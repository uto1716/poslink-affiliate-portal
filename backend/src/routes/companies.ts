import express from 'express';
import { getDb } from '../database/init';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const { category, search } = req.query;
  const db = getDb();

  try {
    let query = 'SELECT * FROM companies WHERE status = "active"';
    const params: any[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY name';

    db.all(query, params, (err: any, companies: any[]) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
      }
      res.json(companies);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/categories', authMiddleware, (req, res) => {
  const db = getDb();

  try {
    db.all('SELECT DISTINCT category FROM companies WHERE status = "active" ORDER BY category', [], (err: any, categories: any[]) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
      }
      res.json(categories.map((c: any) => c.category));
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const db = getDb();

  try {
    db.get('SELECT * FROM companies WHERE id = ? AND status = "active"', [id], (err: any, company: any) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
      }

      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      res.json(company);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;