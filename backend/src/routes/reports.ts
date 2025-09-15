import express from 'express';
import { getDb } from '../database/init';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { createObjectCsvStringifier } from 'csv-writer';

const router = express.Router();

router.get('/generate', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { startDate, endDate, format = 'json' } = req.query;
  const db = getDb();

  try {
    let dateFilter = '';
    const params: any[] = [userId];

    if (startDate && endDate) {
      dateFilter = 'AND DATE(c.converted_at) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    const data = db.prepare(`
      SELECT
        c.id,
        c.converted_at,
        co.name as company_name,
        co.category,
        c.revenue,
        c.commission,
        c.status,
        al.tracking_code,
        al.phone_number
      FROM conversions c
      JOIN companies co ON c.company_id = co.id
      JOIN affiliate_links al ON c.link_id = al.id
      WHERE c.user_id = ? ${dateFilter}
      ORDER BY c.converted_at DESC
    `).all(...params);

    const summary = db.prepare(`
      SELECT
        COUNT(*) as total_conversions,
        SUM(revenue) as total_revenue,
        SUM(commission) as total_commission,
        SUM(CASE WHEN status = 'approved' THEN commission ELSE 0 END) as approved_commission,
        SUM(CASE WHEN status = 'pending' THEN commission ELSE 0 END) as pending_commission
      FROM conversions
      WHERE user_id = ? ${dateFilter}
    `).get(...params) as any;

    if (format === 'csv') {
      const csvStringifier = createObjectCsvStringifier({
        header: [
          { id: 'converted_at', title: '成約日時' },
          { id: 'company_name', title: '企業名' },
          { id: 'category', title: 'カテゴリ' },
          { id: 'revenue', title: '売上' },
          { id: 'commission', title: '報酬' },
          { id: 'status', title: 'ステータス' },
          { id: 'tracking_code', title: 'トラッキングコード' },
          { id: 'phone_number', title: '電話番号' }
        ]
      });

      const csvData = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(data);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=report-${startDate}-${endDate}.csv`);
      res.send('\uFEFF' + csvData);
    } else {
      res.json({
        summary,
        data,
        period: {
          start: startDate,
          end: endDate
        }
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/monthly', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const db = getDb();

  try {
    const monthlyData = db.prepare(`
      SELECT
        strftime('%Y-%m', converted_at) as month,
        COUNT(*) as conversions,
        SUM(revenue) as revenue,
        SUM(commission) as commission
      FROM conversions
      WHERE user_id = ?
      GROUP BY strftime('%Y-%m', converted_at)
      ORDER BY month DESC
      LIMIT 12
    `).all(userId);

    res.json(monthlyData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;