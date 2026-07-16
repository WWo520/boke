import 'dotenv/config';
import { initDb, runSql, queryAll } from './db.js';

async function migrate() {
  console.log('🚀 Starting database migration v3...');

  try {
    await initDb();

    console.log('📦 Step 1: Adding new columns to users table...');
    await runSql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "followersCount" INTEGER DEFAULT 0`);
    await runSql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "followingCount" INTEGER DEFAULT 0`);
    await runSql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1`);
    await runSql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0`);
    await runSql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS title TEXT DEFAULT ''`);
    await runSql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS company TEXT DEFAULT ''`);
    await runSql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT DEFAULT ''`);
    await runSql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS website TEXT DEFAULT ''`);

    console.log('📦 Step 2: Adding new columns to posts table...');
    await runSql(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS "columnId" INTEGER`);
    await runSql(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS hotScore INTEGER DEFAULT 0`);
    await runSql(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS "lastCommentAt" TIMESTAMP`);
    await runSql(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS "likeCount" INTEGER DEFAULT 0`);
    await runSql(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS "favoriteCount" INTEGER DEFAULT 0`);
    await runSql(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS "reviewStatus" TEXT DEFAULT 'approved'`);
    await runSql(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS "reviewedBy" INTEGER REFERENCES users(id)`);
    await runSql(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP`);
    await runSql(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS "reviewComment" TEXT DEFAULT ''`);
    await runSql(`ALTER TABLE posts ADD CONSTRAINT IF NOT EXISTS "fk_posts_columnId" FOREIGN KEY ("columnId") REFERENCES columns(id)`);

    console.log('📦 Step 3: Adding new columns to categories table...');
    await runSql(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS orderNum INTEGER DEFAULT 0`);
    await runSql(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS "postCount" INTEGER DEFAULT 0`);

    console.log('📦 Step 4: Adding parentId to comments table (nested comments)...');
    await runSql(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS "parentId" INTEGER REFERENCES comments(id)`);
    await runSql(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS "authorId" INTEGER REFERENCES users(id)`);

    console.log('📦 Step 5: Adding folderId to post_favorites table...');
    await runSql(`ALTER TABLE post_favorites ADD COLUMN IF NOT EXISTS "folderId" INTEGER`);

    console.log('📦 Step 6: Creating full-text search index...');
    await runSql(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS "searchVector" tsvector`);
    await runSql(`UPDATE posts SET "searchVector" = to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(summary, '') || ' ' || COALESCE(content, ''))`);
    await runSql(`CREATE INDEX IF NOT EXISTS "idx_posts_search" ON posts USING GIN ("searchVector")`);

    console.log('📦 Step 7: Creating columns table...');
    await runSql(`
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

    console.log('📦 Step 8: Creating column_posts table...');
    await runSql(`
      CREATE TABLE IF NOT EXISTS column_posts (
        id SERIAL PRIMARY KEY,
        "columnId" INTEGER NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
        "postId" INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        orderNum INTEGER DEFAULT 0,
        UNIQUE("columnId", "postId")
      )
    `);

    console.log('📦 Step 9: Creating user_follows table...');
    await runSql(`
      CREATE TABLE IF NOT EXISTS user_follows (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "followId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("userId", "followId")
      )
    `);

    console.log('📦 Step 10: Creating user_points table...');
    await runSql(`
      CREATE TABLE IF NOT EXISTS user_points (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        points INTEGER NOT NULL,
        description TEXT DEFAULT '',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('📦 Step 11: Creating notifications table...');
    await runSql(`
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

    console.log('📦 Step 12: Creating questions table...');
    await runSql(`
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

    console.log('📦 Step 13: Creating answers table...');
    await runSql(`
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

    console.log('📦 Step 14: Creating answer_votes table...');
    await runSql(`
      CREATE TABLE IF NOT EXISTS answer_votes (
        id SERIAL PRIMARY KEY,
        "answerId" INTEGER NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
        "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "voteType" TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("answerId", "userId")
      )
    `);

    console.log('📦 Step 15: Creating favorite_folders table...');
    await runSql(`
      CREATE TABLE IF NOT EXISTS favorite_folders (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('📦 Step 16: Creating user_activity table...');
    await runSql(`
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

    console.log('📦 Step 17: Creating post_rankings view...');
    await runSql(`
      CREATE OR REPLACE VIEW post_rankings AS
      SELECT 
        p.id,
        p.title,
        p.slug,
        p."coverImage",
        p.views,
        p."likeCount",
        p."favoriteCount",
        (SELECT COUNT(*) FROM comments WHERE "postId" = p.id) as commentCount,
        p.hotScore,
        p."authorId",
        u.name as authorName,
        u.avatar as authorAvatar,
        p."publishedAt"
      FROM posts p
      JOIN users u ON p."authorId" = u.id
      WHERE p.status = 'published'
      ORDER BY p.hotScore DESC, p.views DESC
    `);

    console.log('📦 Step 18: Creating author_rankings view...');
    await runSql(`
      CREATE OR REPLACE VIEW author_rankings AS
      SELECT 
        u.id,
        u.name,
        u.avatar,
        u.bio,
        u.level,
        u.points,
        COUNT(DISTINCT p.id) as postCount,
        SUM(p.views) as totalViews,
        SUM(p."likeCount") as totalLikes,
        (SELECT COUNT(*) FROM user_follows WHERE "followId" = u.id) as followersCount
      FROM users u
      LEFT JOIN posts p ON u.id = p."authorId" AND p.status = 'published'
      GROUP BY u.id, u.name, u.avatar, u.bio, u.level, u.points
      ORDER BY followersCount DESC, totalViews DESC
    `);

    console.log('📦 Step 19: Creating tag_rankings view...');
    await runSql(`
      CREATE OR REPLACE VIEW tag_rankings AS
      SELECT 
        tag,
        COUNT(*) as postCount,
        SUM(p.views) as totalViews
      FROM post_tags pt
      JOIN posts p ON pt."postId" = p.id AND p.status = 'published'
      GROUP BY tag
      ORDER BY postCount DESC, totalViews DESC
    `);

    console.log('📦 Step 20: Creating indexes...');
    await runSql(`CREATE INDEX IF NOT EXISTS "idx_questions_tags" ON questions USING GIN(tags)`);
    await runSql(`CREATE INDEX IF NOT EXISTS "idx_answers_questionId" ON answers("questionId")`);
    await runSql(`CREATE INDEX IF NOT EXISTS "idx_user_follows_userId" ON user_follows("userId")`);
    await runSql(`CREATE INDEX IF NOT EXISTS "idx_user_follows_followId" ON user_follows("followId")`);
    await runSql(`CREATE INDEX IF NOT EXISTS "idx_notifications_userId" ON notifications("userId")`);
    await runSql(`CREATE INDEX IF NOT EXISTS "idx_notifications_read" ON notifications("userId", read)`);
    await runSql(`CREATE INDEX IF NOT EXISTS "idx_post_tags_tag" ON post_tags(tag)`);
    await runSql(`CREATE INDEX IF NOT EXISTS "idx_comments_parentId" ON comments("parentId")`);
    await runSql(`CREATE INDEX IF NOT EXISTS "idx_posts_hotScore" ON posts(hotScore)`);
    await runSql(`CREATE INDEX IF NOT EXISTS "idx_favorite_folders_userId" ON favorite_folders("userId")`);
    await runSql(`CREATE INDEX IF NOT EXISTS "idx_user_activity_userId" ON user_activity("userId")`);
    await runSql(`CREATE INDEX IF NOT EXISTS "idx_column_posts_columnId" ON column_posts("columnId")`);
    await runSql(`CREATE INDEX IF NOT EXISTS "idx_column_posts_postId" ON column_posts("postId")`);

    console.log('📦 Step 21: Updating existing data...');
    const posts = await queryAll('SELECT id FROM posts');
    for (const post of posts) {
      const likeCount = await queryAll('SELECT COUNT(*) as count FROM post_likes WHERE "postId" = $1', [post.id]);
      const favCount = await queryAll('SELECT COUNT(*) as count FROM post_favorites WHERE "postId" = $1', [post.id]);
      await runSql('UPDATE posts SET "likeCount" = $1, "favoriteCount" = $2 WHERE id = $3', [
        likeCount[0]?.count || 0,
        favCount[0]?.count || 0,
        post.id
      ]);
    }

    const categories = await queryAll('SELECT id FROM categories');
    for (const cat of categories) {
      const postCount = await queryAll('SELECT COUNT(*) as count FROM posts WHERE "categoryId" = $1', [cat.id]);
      await runSql('UPDATE categories SET "postCount" = $1 WHERE id = $2', [postCount[0]?.count || 0, cat.id]);
    }

    console.log('🎉 Database migration v3 completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();