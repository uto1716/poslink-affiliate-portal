import express from 'express';
import { getDb } from '../database/init';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get('/stats', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const db = getDb();

  try {
    const totalLinks = db.prepare('SELECT COUNT(*) as count FROM affiliate_links WHERE user_id = ?').get(userId) as any;

    const totalClicks = db.prepare('SELECT SUM(clicks) as total FROM affiliate_links WHERE user_id = ?').get(userId) as any;

    const totalConversions = db.prepare('SELECT SUM(conversions) as total FROM affiliate_links WHERE user_id = ?').get(userId) as any;

    const revenue = db.prepare(`
      SELECT
        SUM(revenue) as total_revenue,
        SUM(commission) as total_commission,
        COUNT(*) as total_conversions
      FROM conversions
      WHERE user_id = ? AND status IN ('approved', 'paid')
    `).get(userId) as any;

    const pendingRevenue = db.prepare(`
      SELECT SUM(commission) as total
      FROM conversions
      WHERE user_id = ? AND status = 'pending'
    `).get(userId) as any;

    const recentConversions = db.prepare(`
      SELECT
        c.*,
        co.name as company_name
      FROM conversions c
      JOIN companies co ON c.company_id = co.id
      WHERE c.user_id = ?
      ORDER BY c.converted_at DESC
      LIMIT 10
    `).all(userId);

    const topPerformingLinks = db.prepare(`
      SELECT
        al.*,
        c.name as company_name,
        c.commission_rate,
        c.commission_type
      FROM affiliate_links al
      JOIN companies c ON al.company_id = c.id
      WHERE al.user_id = ?
      ORDER BY al.conversions DESC, al.clicks DESC
      LIMIT 5
    `).all(userId);

    res.json({
      totalLinks: totalLinks.count || 0,
      totalClicks: totalClicks.total || 0,
      totalConversions: totalConversions.total || 0,
      totalRevenue: revenue.total_revenue || 0,
      totalCommission: revenue.total_commission || 0,
      pendingCommission: pendingRevenue.total || 0,
      recentConversions,
      topPerformingLinks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/chart-data', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { period = '7days' } = req.query;
  const db = getDb();

  try {
    let dateFilter = '';
    if (period === '7days') {
      dateFilter = "AND converted_at >= datetime('now', '-7 days')";
    } else if (period === '30days') {
      dateFilter = "AND converted_at >= datetime('now', '-30 days')";
    } else if (period === '90days') {
      dateFilter = "AND converted_at >= datetime('now', '-90 days')";
    }

    const chartData = db.prepare(`
      SELECT
        DATE(converted_at) as date,
        COUNT(*) as conversions,
        SUM(commission) as commission
      FROM conversions
      WHERE user_id = ? ${dateFilter}
      GROUP BY DATE(converted_at)
      ORDER BY date
    `).all(userId);

    res.json(chartData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;