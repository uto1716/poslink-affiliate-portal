import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.join(__dirname, '../../../database/affiliate.db');
const db = new Database(dbPath);

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      commission_rate REAL NOT NULL,
      commission_type TEXT NOT NULL CHECK(commission_type IN ('percentage', 'fixed')),
      phone_number TEXT,
      tracking_url TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS affiliate_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      company_id INTEGER NOT NULL,
      tracking_code TEXT UNIQUE NOT NULL,
      phone_number TEXT,
      generated_url TEXT NOT NULL,
      clicks INTEGER DEFAULT 0,
      conversions INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (company_id) REFERENCES companies (id)
    );

    CREATE TABLE IF NOT EXISTS conversions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      link_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      company_id INTEGER NOT NULL,
      revenue REAL NOT NULL,
      commission REAL NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'paid')),
      converted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (link_id) REFERENCES affiliate_links (id),
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (company_id) REFERENCES companies (id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      report_type TEXT NOT NULL CHECK(report_type IN ('daily', 'monthly', 'custom')),
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      total_clicks INTEGER DEFAULT 0,
      total_conversions INTEGER DEFAULT 0,
      total_revenue REAL DEFAULT 0,
      total_commission REAL DEFAULT 0,
      data JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);

  const adminExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get('admin') as { count: number };

  if (adminExists.count === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (username, email, password)
      VALUES (?, ?, ?)
    `).run('admin', 'admin@example.com', hashedPassword);
  }

  const companiesCount = db.prepare('SELECT COUNT(*) as count FROM companies').get() as { count: number };

  if (companiesCount.count === 0) {
    const sampleCompanies = [
      {
        name: '楽天モバイル',
        category: '通信',
        description: '楽天の携帯電話サービス',
        commission_rate: 5000,
        commission_type: 'fixed',
        phone_number: '0120-123-456',
        tracking_url: 'https://rakuten-mobile.example.com'
      },
      {
        name: 'Amazon Prime',
        category: 'サブスクリプション',
        description: 'Amazonのプライム会員サービス',
        commission_rate: 1000,
        commission_type: 'fixed',
        phone_number: '050-1234-5678',
        tracking_url: 'https://amazon-prime.example.com'
      },
      {
        name: 'クレジットカードA',
        category: '金融',
        description: '年会費無料のクレジットカード',
        commission_rate: 8000,
        commission_type: 'fixed',
        phone_number: '0120-987-654',
        tracking_url: 'https://credit-card-a.example.com'
      },
      {
        name: 'オンライン英会話',
        category: '教育',
        description: 'マンツーマンオンライン英会話',
        commission_rate: 15,
        commission_type: 'percentage',
        phone_number: '050-9876-5432',
        tracking_url: 'https://online-english.example.com'
      },
      {
        name: 'プログラミングスクール',
        category: '教育',
        description: 'エンジニア育成スクール',
        commission_rate: 20,
        commission_type: 'percentage',
        phone_number: '0120-555-666',
        tracking_url: 'https://programming-school.example.com'
      }
    ];

    const insertCompany = db.prepare(`
      INSERT INTO companies (name, category, description, commission_rate, commission_type, phone_number, tracking_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const company of sampleCompanies) {
      insertCompany.run(
        company.name,
        company.category,
        company.description,
        company.commission_rate,
        company.commission_type,
        company.phone_number,
        company.tracking_url
      );
    }
  }

  console.log('Database initialized successfully');
}

export function getDb() {
  return db;
}