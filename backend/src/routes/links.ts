import express from 'express';
import { getDb } from '../database/init';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

const router = express.Router();

function generateTrackingCode(): string {
  return crypto.randomBytes(8).toString('hex');
}

function generatePhoneNumber(baseNumber: string, trackingCode: string): string {
  const cleanBase = baseNumber.replace(/[^0-9]/g, '');

  if (cleanBase.startsWith('0120') || cleanBase.startsWith('0800')) {
    return cleanBase;
  }

  if (cleanBase.startsWith('050')) {
    const prefix = cleanBase.substring(0, 3);
    const middle = cleanBase.substring(3, 7);
    const suffix = trackingCode.substring(0, 4).replace(/[a-f]/g, (char) => String((char.charCodeAt(0) % 10)));
    return `${prefix}-${middle}-${suffix}`;
  }

  return cleanBase;
}

router.post('/generate', authMiddleware, async (req: AuthRequest, res) => {
  const { companyId } = req.body;
  const userId = req.userId!;
  const db = getDb();

  try {
    const company = db.prepare('SELECT * FROM companies WHERE id = ? AND status = "active"').get(companyId) as any;

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const existingLink = db.prepare(`
      SELECT * FROM affiliate_links
      WHERE user_id = ? AND company_id = ?
    `).get(userId, companyId) as any;

    if (existingLink) {
      return res.json(existingLink);
    }

    const trackingCode = generateTrackingCode();
    const phoneNumber = company.phone_number ? generatePhoneNumber(company.phone_number, trackingCode) : null;
    const generatedUrl = `${company.tracking_url}?ref=${trackingCode}`;

    const result = db.prepare(`
      INSERT INTO affiliate_links (user_id, company_id, tracking_code, phone_number, generated_url)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, companyId, trackingCode, phoneNumber, generatedUrl);

    const newLink = {
      id: result.lastInsertRowid,
      user_id: userId,
      company_id: companyId,
      tracking_code: trackingCode,
      phone_number: phoneNumber,
      generated_url: generatedUrl,
      clicks: 0,
      conversions: 0,
      company_name: company.name
    };

    res.json(newLink);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/my-links', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const db = getDb();

  try {
    const links = db.prepare(`
      SELECT
        al.*,
        c.name as company_name,
        c.category,
        c.commission_rate,
        c.commission_type
      FROM affiliate_links al
      JOIN companies c ON al.company_id = c.id
      WHERE al.user_id = ?
      ORDER BY al.created_at DESC
    `).all(userId);

    res.json(links);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/track/:trackingCode', (req, res) => {
  const { trackingCode } = req.params;
  const db = getDb();

  try {
    db.prepare('UPDATE affiliate_links SET clicks = clicks + 1 WHERE tracking_code = ?').run(trackingCode);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;