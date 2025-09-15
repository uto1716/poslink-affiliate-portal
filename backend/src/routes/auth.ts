import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { getDb } from '../database/init';

const router = express.Router();

router.post('/register', [
  body('username').isLength({ min: 3 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;
  const db = getDb();

  try {
    db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], async (err: any, existingUser: any) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
      }

      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      db.run(`
        INSERT INTO users (username, email, password)
        VALUES (?, ?, ?)
      `, [username, email, hashedPassword], function(err: any) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Server error' });
        }

        const token = jwt.sign({ userId: this.lastID }, process.env.JWT_SECRET!, { expiresIn: '7d' });

        res.json({
          token,
          user: {
            id: this.lastID,
            username,
            email
          }
        });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', [
  body('username').notEmpty(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  const db = getDb();

  try {
    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, username], async (err: any, user: any) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;