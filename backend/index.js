const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// データベース初期化
const dbPath = path.join(__dirname, '../database/affiliate.db');
const db = new sqlite3.Database(dbPath);

// テーブル作成
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    commission_rate REAL NOT NULL,
    commission_type TEXT NOT NULL,
    phone_number TEXT,
    tracking_url TEXT,
    status TEXT DEFAULT 'active'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS affiliate_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    company_id INTEGER NOT NULL,
    tracking_code TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    generated_url TEXT NOT NULL,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // サンプルデータ挿入
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (row.count === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      db.run("INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
        ['admin', 'admin@example.com', hashedPassword]);
    }
  });

  db.get("SELECT COUNT(*) as count FROM companies", (err, row) => {
    if (row.count === 0) {
      const companies = [
        ['楽天モバイル', '通信', '楽天の携帯電話サービス', 5000, 'fixed', '0120-123-456', 'https://rakuten-mobile.example.com'],
        ['Amazon Prime', 'サブスクリプション', 'Amazonのプライム会員サービス', 1000, 'fixed', '050-1234-5678', 'https://amazon-prime.example.com'],
        ['クレジットカードA', '金融', '年会費無料のクレジットカード', 8000, 'fixed', '0120-987-654', 'https://credit-card-a.example.com'],
        ['オンライン英会話', '教育', 'マンツーマンオンライン英会話', 15, 'percentage', '050-9876-5432', 'https://online-english.example.com'],
        ['プログラミングスクール', '教育', 'エンジニア育成スクール', 20, 'percentage', '0120-555-666', 'https://programming-school.example.com']
      ];

      companies.forEach(company => {
        db.run("INSERT INTO companies (name, category, description, commission_rate, commission_type, phone_number, tracking_url) VALUES (?, ?, ?, ?, ?, ?, ?)", company);
      });
    }
  });
});

// 認証ミドルウェア
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, 'your-secret-key');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ルート
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 認証
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, username], async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, 'your-secret-key', { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  });
});

// 登録
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  // バリデーション
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'すべてのフィールドが必要です' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'パスワードは6文字以上で入力してください' });
  }

  // 既存ユーザーチェック
  db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], async (err, existingUser) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }

    if (existingUser) {
      return res.status(400).json({ error: 'ユーザー名またはメールアドレスが既に使用されています' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      db.run(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Server error' });
          }

          const token = jwt.sign({ userId: this.lastID }, 'your-secret-key', { expiresIn: '7d' });

          res.json({
            token,
            user: {
              id: this.lastID,
              username,
              email
            }
          });
        }
      );
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
});

// 企業一覧
app.get('/api/companies', authMiddleware, (req, res) => {
  const { category, search } = req.query;
  let query = 'SELECT * FROM companies WHERE status = "active"';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY name';

  db.all(query, params, (err, companies) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    res.json(companies);
  });
});

// カテゴリ一覧
app.get('/api/companies/categories', authMiddleware, (req, res) => {
  db.all('SELECT DISTINCT category FROM companies WHERE status = "active" ORDER BY category', [], (err, categories) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    res.json(categories.map(c => c.category));
  });
});

// リンク生成
app.post('/api/links/generate', authMiddleware, (req, res) => {
  const { companyId } = req.body;
  const userId = req.userId;

  // 既存リンクチェック
  db.get('SELECT * FROM affiliate_links WHERE user_id = ? AND company_id = ?', [userId, companyId], (err, existingLink) => {
    if (existingLink) {
      return res.json(existingLink);
    }

    // 新規リンク生成
    const trackingCode = Math.random().toString(36).substr(2, 8);

    db.get('SELECT * FROM companies WHERE id = ?', [companyId], (err, company) => {
      if (err || !company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      const generatedUrl = `${company.tracking_url}?ref=${trackingCode}`;
      let phoneNumber = null;

      if (company.phone_number) {
        if (company.phone_number.startsWith('050')) {
          const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          phoneNumber = company.phone_number.replace(/(\d{3})-(\d{4})-(\d{4})/, `$1-$2-${randomSuffix}`);
        } else {
          phoneNumber = company.phone_number;
        }
      }

      db.run(
        'INSERT INTO affiliate_links (user_id, company_id, tracking_code, phone_number, generated_url) VALUES (?, ?, ?, ?, ?)',
        [userId, companyId, trackingCode, phoneNumber, generatedUrl],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Server error' });
          }

          res.json({
            id: this.lastID,
            user_id: userId,
            company_id: companyId,
            tracking_code: trackingCode,
            phone_number: phoneNumber,
            generated_url: generatedUrl,
            clicks: 0,
            conversions: 0,
            company_name: company.name
          });
        }
      );
    });
  });
});

// マイリンク一覧
app.get('/api/links/my-links', authMiddleware, (req, res) => {
  const userId = req.userId;

  const query = `
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
  `;

  db.all(query, [userId], (err, links) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    res.json(links);
  });
});

// ダッシュボード統計
app.get('/api/dashboard/stats', authMiddleware, (req, res) => {
  const userId = req.userId;

  const stats = {
    totalLinks: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalRevenue: 0,
    totalCommission: 0,
    pendingCommission: 0,
    recentConversions: [],
    topPerformingLinks: []
  };

  // リンク数取得
  db.get('SELECT COUNT(*) as count FROM affiliate_links WHERE user_id = ?', [userId], (err, row) => {
    if (!err && row) stats.totalLinks = row.count;

    // クリック数取得
    db.get('SELECT SUM(clicks) as total FROM affiliate_links WHERE user_id = ?', [userId], (err, row) => {
      if (!err && row) stats.totalClicks = row.total || 0;

      // 成約数取得
      db.get('SELECT SUM(conversions) as total FROM affiliate_links WHERE user_id = ?', [userId], (err, row) => {
        if (!err && row) stats.totalConversions = row.total || 0;

        // トップパフォーマンスリンク取得
        const topLinksQuery = `
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
        `;

        db.all(topLinksQuery, [userId], (err, topLinks) => {
          if (!err) stats.topPerformingLinks = topLinks;
          res.json(stats);
        });
      });
    });
  });
});

// レポート生成
app.get('/api/reports/generate', authMiddleware, (req, res) => {
  const summary = {
    total_conversions: 0,
    total_revenue: 0,
    total_commission: 0,
    approved_commission: 0,
    pending_commission: 0
  };

  res.json({
    summary,
    data: [],
    period: {
      start: req.query.startDate,
      end: req.query.endDate
    }
  });
});

// 月次レポート
app.get('/api/reports/monthly', authMiddleware, (req, res) => {
  res.json([]);
});

// グラフデータ
app.get('/api/dashboard/chart-data', authMiddleware, (req, res) => {
  res.json([]);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});