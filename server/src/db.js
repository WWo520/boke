import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT) || 5432,
  database: process.env.POSTGRES_DATABASE || 'moke_blog',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

export async function initDb() {
  await initSchema();
  return pool;
}

export function getDb() {
  return pool;
}

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT,
      bio TEXT DEFAULT '',
      role TEXT DEFAULT 'user',
      "followersCount" INTEGER DEFAULT 0,
      "followingCount" INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      points INTEGER DEFAULT 0,
      title TEXT DEFAULT '',
      company TEXT DEFAULT '',
      location TEXT DEFAULT '',
      website TEXT DEFAULT '',
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1`);
  await pool.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0`);
  await pool.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS title TEXT DEFAULT ''`);
  await pool.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS company TEXT DEFAULT ''`);
  await pool.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS location TEXT DEFAULT ''`);
  await pool.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS website TEXT DEFAULT ''`);
  await pool.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS "followersCount" INTEGER DEFAULT 0`);
  await pool.query(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS "followingCount" INTEGER DEFAULT 0`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      color TEXT DEFAULT '#2563eb',
      icon TEXT DEFAULT 'BookOpen',
      orderNum INTEGER DEFAULT 0,
      "postCount" INTEGER DEFAULT 0
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      summary TEXT DEFAULT '',
      content TEXT DEFAULT '',
      "coverImage" TEXT DEFAULT '',
      "categoryId" INTEGER REFERENCES categories(id),
      "authorId" INTEGER REFERENCES users(id),
      "columnId" INTEGER,
      status TEXT DEFAULT 'published',
      "reviewStatus" TEXT DEFAULT 'approved',
      "reviewedBy" INTEGER REFERENCES users(id),
      "reviewedAt" TIMESTAMP,
      "reviewComment" TEXT DEFAULT '',
      views INTEGER DEFAULT 0,
      hotScore INTEGER DEFAULT 0,
      "lastCommentAt" TIMESTAMP,
      "likeCount" INTEGER DEFAULT 0,
      "favoriteCount" INTEGER DEFAULT 0,
      "publishedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`ALTER TABLE IF EXISTS posts ADD COLUMN IF NOT EXISTS "hotScore" INTEGER DEFAULT 0`);
  await pool.query(`ALTER TABLE IF EXISTS posts ADD COLUMN IF NOT EXISTS "lastCommentAt" TIMESTAMP`);
  await pool.query(`ALTER TABLE IF EXISTS posts ADD COLUMN IF NOT EXISTS "likeCount" INTEGER DEFAULT 0`);
  await pool.query(`ALTER TABLE IF EXISTS posts ADD COLUMN IF NOT EXISTS "favoriteCount" INTEGER DEFAULT 0`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS post_tags (
      id SERIAL PRIMARY KEY,
      "postId" INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      tag TEXT NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      "postId" INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      "parentId" INTEGER REFERENCES comments(id),
      "authorId" INTEGER REFERENCES users(id),
      author TEXT NOT NULL,
      avatar TEXT,
      content TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`ALTER TABLE IF EXISTS comments ADD COLUMN IF NOT EXISTS "parentId" INTEGER REFERENCES comments(id)`);
  await pool.query(`ALTER TABLE IF EXISTS comments ADD COLUMN IF NOT EXISTS "authorId" INTEGER REFERENCES users(id)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS post_likes (
      id SERIAL PRIMARY KEY,
      "postId" INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE("postId", "userId")
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS post_favorites (
      id SERIAL PRIMARY KEY,
      "postId" INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "folderId" INTEGER,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE("postId", "userId")
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS columns (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      "coverImage" TEXT DEFAULT '',
      "authorId" INTEGER REFERENCES users(id),
      "postCount" INTEGER DEFAULT 0,
      "viewCount" INTEGER DEFAULT 0,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS column_posts (
      id SERIAL PRIMARY KEY,
      "columnId" INTEGER NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
      "postId" INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      orderNum INTEGER DEFAULT 0,
      UNIQUE("columnId", "postId")
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_follows (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "followId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE("userId", "followId")
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_points (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      points INTEGER NOT NULL,
      description TEXT DEFAULT '',
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      read BOOLEAN DEFAULT FALSE,
      "relatedId" INTEGER DEFAULT NULL,
      "relatedType" TEXT DEFAULT NULL,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      "authorId" INTEGER REFERENCES users(id),
      tags TEXT[],
      status TEXT DEFAULT 'open',
      views INTEGER DEFAULT 0,
      answers INTEGER DEFAULT 0,
      "acceptedAnswerId" INTEGER,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS answers (
      id SERIAL PRIMARY KEY,
      "questionId" INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      "authorId" INTEGER REFERENCES users(id),
      content TEXT NOT NULL,
      votes INTEGER DEFAULT 0,
      accepted BOOLEAN DEFAULT FALSE,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS answer_votes (
      id SERIAL PRIMARY KEY,
      "answerId" INTEGER NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
      "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "voteType" TEXT NOT NULL,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE("answerId", "userId")
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS favorite_folders (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_activity (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      "relatedId" INTEGER DEFAULT NULL,
      "relatedType" TEXT DEFAULT NULL,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_posts_categoryId ON posts("categoryId")`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_posts_authorId ON posts("authorId")`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_posts_hotScore ON posts("hotScore")`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_post_tags_postId ON post_tags("postId")`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_post_tags_tag ON post_tags(tag)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_comments_postId ON comments("postId")`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_comments_parentId ON comments("parentId")`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_post_likes_postId ON post_likes("postId")`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_post_likes_userId ON post_likes("userId")`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_post_favorites_postId ON post_favorites("postId")`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_post_favorites_userId ON post_favorites("userId")`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_questions_tags ON questions USING GIN(tags)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_answers_questionId ON answers("questionId")`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_follows_userId ON user_follows("userId")`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_follows_followId ON user_follows("followId")`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications("userId")`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications("userId", read)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_favorite_folders_userId ON favorite_folders("userId")`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_activity_userId ON user_activity("userId")`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_column_posts_columnId ON column_posts("columnId")`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_column_posts_postId ON column_posts("postId")`);
}

function snakeToCamel(str) {
  return str.replace(/(_\w)/g, (m) => m[1].toUpperCase());
}

function camelizeRow(row) {
  const result = {};
  for (const key of Object.keys(row)) {
    result[snakeToCamel(key)] = row[key];
  }
  return result;
}

export async function queryAll(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows.map(camelizeRow);
}

export async function queryOne(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows[0] ? camelizeRow(result.rows[0]) : null;
}

export async function runSql(sql, params = []) {
  const result = await pool.query(sql, params);
  return { changes: result.rowCount };
}

export async function insertSql(sql, params = []) {
  const hasReturning = /\bRETURNING\b/i.test(sql);
  const finalSql = hasReturning ? sql : sql + ' RETURNING id';
  const result = await pool.query(finalSql, params);
  return result.rows[0]?.id ?? 0;
}

export async function closeDb() {
  await pool.end();
}