const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  waitForConnections: true, connectionLimit: 10, queueLimit: 0,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined
});
async function initializeDatabase() {
  for (const k of ['DB_HOST','DB_USER','DB_NAME']) if (!process.env[k]) throw new Error(`Missing ${k}`);
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL,
    role ENUM('user','admin') NOT NULL DEFAULT 'user', is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`);
  await pool.query(`CREATE TABLE IF NOT EXISTS posts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, author_id BIGINT UNSIGNED NULL,
    title VARCHAR(180) NOT NULL, slug VARCHAR(210) NOT NULL UNIQUE, excerpt VARCHAR(350) NOT NULL,
    content LONGTEXT NOT NULL, cover_image VARCHAR(700), category VARCHAR(80) NOT NULL DEFAULT 'General',
    status ENUM('draft','published') NOT NULL DEFAULT 'draft', read_time INT NOT NULL DEFAULT 4,
    published_at DATETIME NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_posts_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_posts_status_date(status,published_at)
  ) ENGINE=InnoDB`);
  await pool.query(`CREATE TABLE IF NOT EXISTS ads (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    placement ENUM('top_banner','bottom_banner','sidebar','in_content_1','in_content_2','sticky_footer') NOT NULL UNIQUE,
    title VARCHAR(150) NOT NULL, description VARCHAR(255) NOT NULL,
    label VARCHAR(40) NOT NULL DEFAULT 'Demo Ad', is_active BOOLEAN NOT NULL DEFAULT TRUE
  ) ENGINE=InnoDB`);
  await seed();
}
async function seed() {
  const bcrypt = require('bcryptjs');
  const email = (process.env.ADMIN_EMAIL || 'admin@blogspace.local').toLowerCase();
  const [admins] = await pool.execute('SELECT id FROM users WHERE email=? LIMIT 1',[email]);
  let adminId = admins[0]?.id;
  if (!adminId) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'ChangeMe_Admin_123!',12);
    const [r] = await pool.execute('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)',
      [process.env.ADMIN_NAME || 'BlogSpace Admin',email,hash,'admin']);
    adminId = r.insertId;
  }
  const [count] = await pool.query('SELECT COUNT(*) total FROM posts');
  if (!Number(count[0].total)) {
    const samples = [
      ['The art of building a calmer morning','calmer-morning','Small rituals can create more room for focus, energy and a thoughtful start.','A good morning is less about doing everything early and more about choosing a few things that matter. Start with a glass of water, a little light, and one clear priority. Keep your phone away for the first few minutes. Consistency beats a perfect routine.','https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1400&q=85','Lifestyle',4],
      ['A practical guide to writing online','writing-online','Find your voice, make your ideas useful, and write for real people.','Great writing begins with a clear promise to the reader. Decide what they should learn, feel, or do by the end. Use specific examples, short sections, and a natural voice. Edit for clarity before trying to sound clever.','https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1400&q=85','Writing',4],
      ['Designing a workspace that works','workspace-that-works','A thoughtful workspace supports concentration without being complicated.','Start with comfortable seating, useful light, and a surface that stays clear enough to think. Keep frequently used tools close and distractions out of sight. Add one personal detail that makes the space inviting.','https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=85','Productivity',3],
      ['Small ways to make technology simpler','technology-simpler','A few intentional habits can make your digital life feel lighter.','Turn off notifications that do not need your attention. Group similar tasks together. Keep a short list of tools you genuinely use, remove duplicates, back up important files and use a password manager.','https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1400&q=85','Technology',3]
    ];
    for (const p of samples) await pool.execute(`INSERT IGNORE INTO posts(author_id,title,slug,excerpt,content,cover_image,category,status,read_time,published_at) VALUES(?,?,?,?,?,?,?,'published',?,NOW())`,[adminId,...p]);
  }
  const ads = [
    ['top_banner','Make room for your next big idea','A little inspiration can change the shape of your day.'],
    ['bottom_banner','Build a routine that feels like yours','Small steps. Clear focus. Better days.'],
    ['sidebar','Discover your next favourite read','Fresh perspectives for curious minds.'],
    ['in_content_1','Create more space for deep work','Find tools that help you focus on what matters.'],
    ['in_content_2','Keep learning, one page at a time','A good idea is always worth sharing.'],
    ['sticky_footer','Thanks for spending time with BlogSpace','Keep exploring thoughtful stories.']
  ];
  for (const a of ads) await pool.execute('INSERT IGNORE INTO ads(placement,title,description) VALUES(?,?,?)',a);
}
module.exports={pool,initializeDatabase};
