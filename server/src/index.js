import express from 'express';
import cors from 'cors';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { initDb, queryOne, queryAll, runSql, insertSql, healthCheck } from './db.js';
import seed from './seed.js';
import { authMiddleware, adminMiddleware } from './middleware/auth.js';

import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import userRoutes from './routes/users.js';
import searchRoutes from './routes/search.js';
import rankingRoutes from './routes/ranking.js';
import columnRoutes from './routes/columns.js';
import questionRoutes from './routes/questions.js';
import answerRoutes from './routes/answers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3333;
const HOST = process.env.HOST || '0.0.0.0';

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) + ext;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 jpg、png、gif、webp、svg、bmp 格式的图片'));
    }
  },
});

app.set('trust proxy', 1);

// 请求 ID：便于日志追踪与问题定位
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// 健康检查端点（无需鉴权）：liveness 与 readiness
app.get('/healthz', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.get('/readyz', async (req, res) => {
  try {
    await healthCheck();
    res.json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'unavailable' });
  }
});

// CORS 白名单：默认放行本地前端；生产可用 CORS_ORIGINS（逗号分隔）覆盖
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    // 允许同源/无 origin（如服务器间调用、curl）以及白名单来源
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

// 认证接口限流：抵御暴力破解与刷注册
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // 生产严格限流；开发/测试环境放宽以免误伤自动化测试
  max: process.env.NODE_ENV === 'production' ? 30 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: '操作过于频繁，请稍后再试' } },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/columns', columnRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/answers', answerRoutes);

app.get('/api/categories', async (req, res) => {
  const categories = await queryAll(`
    SELECT c.*, COUNT(p.id) as count
    FROM categories c LEFT JOIN posts p ON p."categoryId" = c.id AND p.status = 'published'
    GROUP BY c.id ORDER BY c.id
  `);
  res.json({ data: categories });
});

app.get('/api/tags', async (req, res) => {
  const tags = await queryAll(`
    SELECT tag, COUNT(*) as count
    FROM post_tags GROUP BY tag ORDER BY count DESC LIMIT 50
  `);
  res.json({ data: tags });
});

app.get('/api/author', async (req, res) => {
  try {
    const user = await queryOne('SELECT id, name, email, avatar, bio, level, points, "followersCount" FROM users ORDER BY id LIMIT 1');
    const postCountRow = await queryOne('SELECT COUNT(*) as count FROM posts WHERE status = $1', ['published']);
    const totalViewsRow = await queryOne('SELECT COALESCE(SUM(views), 0) as total FROM posts WHERE status = $1', ['published']);

    if (!user) {
      return res.json({
        data: {
          name: '墨客', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=blogger&backgroundColor=2563eb',
          bio: '前端开发者 & 技术写作者。', level: 1, points: 0, followersCount: 0,
          stats: { posts: 0, followers: 1850, readingTime: '0h' }
        }
      });
    }

    const totalViews = parseInt(totalViewsRow.total) || 0;
    const readingHours = Math.max(1, Math.round(totalViews / 100));

    res.json({
      data: {
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        level: user.level || 1,
        points: user.points || 0,
        followersCount: user.followersCount || 0,
        stats: {
          posts: parseInt(postCountRow.count) || 0,
          followers: user.followersCount || 1850,
          readingTime: `${readingHours}h`,
        }
      }
    });
  } catch (err) {
    console.error('Author error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '获取作者信息失败' } });
  }
});

app.get('/api/comments/recent', async (req, res) => {
  const limit = Math.min(10, parseInt(req.query.limit) || 5);
  const data = await queryAll(`
    SELECT cm.id, cm.author, cm.avatar, cm.content, cm."createdAt", p.slug as "postSlug", p.title as "postTitle"
    FROM comments cm JOIN posts p ON p.id = cm."postId"
    ORDER BY cm."createdAt" DESC LIMIT $1
  `, [limit]);
  res.json({ data });
});

app.post('/api/comments/:id/like', authMiddleware, async (req, res) => {
  try {
    const comment = await queryOne('SELECT * FROM comments WHERE id = $1', [req.params.id]);
    if (!comment) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: '评论不存在' } });
    }
    await runSql('UPDATE comments SET likes = likes + 1 WHERE id = $1', [req.params.id]);
    const updated = await queryOne('SELECT likes FROM comments WHERE id = $1', [req.params.id]);
    res.json({ data: { likes: updated.likes } });
  } catch (err) {
    console.error('Comment like error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '操作失败，请稍后重试' } });
  }
});

app.delete('/api/comments/:id', authMiddleware, async (req, res) => {
  try {
    const comment = await queryOne('SELECT * FROM comments WHERE id = $1', [req.params.id]);
    if (!comment) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: '评论不存在' } });
    }
    const user = await queryOne('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (user.role !== 'admin' && comment.authorId !== req.user.id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: '无权删除此评论' } });
    }
    await runSql('DELETE FROM comments WHERE id = $1', [req.params.id]);
    res.json({ data: { id: parseInt(req.params.id), message: '删除成功' } });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '删除失败，请稍后重试' } });
  }
});

app.post('/api/follow/:userId', authMiddleware, async (req, res) => {
  try {
    const followId = parseInt(req.params.userId);
    if (followId === req.user.id) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '不能关注自己' } });
    }

    const existing = await queryOne('SELECT id FROM user_follows WHERE "userId" = $1 AND "followId" = $2', [req.user.id, followId]);
    if (existing) {
      await runSql('DELETE FROM user_follows WHERE id = $1', [existing.id]);
      await runSql('UPDATE users SET "followersCount" = GREATEST(0, "followersCount" - 1) WHERE id = $1', [followId]);
      await runSql('UPDATE users SET "followingCount" = GREATEST(0, "followingCount" - 1) WHERE id = $1', [req.user.id]);
      res.json({ data: { following: false } });
    } else {
      await runSql('INSERT INTO user_follows ("userId", "followId") VALUES ($1, $2)', [req.user.id, followId]);
      await runSql('UPDATE users SET "followersCount" = "followersCount" + 1 WHERE id = $1', [followId]);
      await runSql('UPDATE users SET "followingCount" = "followingCount" + 1 WHERE id = $1', [req.user.id]);
      res.json({ data: { following: true } });
    }
  } catch (err) {
    console.error('Follow error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '操作失败，请稍后重试' } });
  }
});

app.get('/api/follow/:userId', authMiddleware, async (req, res) => {
  try {
    const followId = parseInt(req.params.userId);
    const existing = await queryOne('SELECT id FROM user_follows WHERE "userId" = $1 AND "followId" = $2', [req.user.id, followId]);
    res.json({ data: { following: !!existing } });
  } catch (err) {
    console.error('Check follow error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '查询关注状态失败' } });
  }
});

app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const postCount = await queryOne('SELECT COUNT(*) as count FROM posts');
    const publishedCount = await queryOne('SELECT COUNT(*) as count FROM posts WHERE status = $1', ['published']);
    const draftCount = await queryOne('SELECT COUNT(*) as count FROM posts WHERE status = $1', ['draft']);
    const commentCount = await queryOne('SELECT COUNT(*) as count FROM comments');
    const totalViews = await queryOne('SELECT COALESCE(SUM(views), 0) as total FROM posts');
    const userCount = await queryOne('SELECT COUNT(*) as count FROM users');

    res.json({
      data: {
        posts: parseInt(postCount.count) || 0,
        published: parseInt(publishedCount.count) || 0,
        drafts: parseInt(draftCount.count) || 0,
        comments: parseInt(commentCount.count) || 0,
        totalViews: parseInt(totalViews.total) || 0,
        users: parseInt(userCount.count) || 0,
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '获取统计数据失败' } });
  }
});

app.get('/api/admin/posts', authMiddleware, adminMiddleware, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 20));
  const status = req.query.status;
  const offset = (page - 1) * pageSize;

  let whereClause = '';
  const params = [];

  if (status) {
    params.push(status);
    whereClause = `WHERE status = $1`;
  }

  const countRow = await queryOne(`SELECT COUNT(*) as total FROM posts ${whereClause}`, params);
  const total = countRow.total;
  const totalPages = Math.ceil(total / pageSize);

  const rows = await queryAll(`
    SELECT p.id, p.slug, p.title, p.status, p.views, p."publishedAt", p."updatedAt",
           u.name as "authorName", u.email as "authorEmail",
           c.name as "categoryName",
           COALESCE(cc.count, 0) as "commentCount"
    FROM posts p LEFT JOIN users u ON u.id = p."authorId"
    JOIN categories c ON c.id = p."categoryId"
    LEFT JOIN LATERAL (
      SELECT COUNT(*) as count FROM comments cm WHERE cm."postId" = p.id
    ) cc ON true
    ${whereClause}
    ORDER BY p."publishedAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `, [...params, pageSize, offset]);

  const data = rows.map(row => ({
    id: row.id, slug: row.slug, title: row.title, status: row.status,
    views: row.views, publishedAt: row.publishedAt, updatedAt: row.updatedAt,
    author: { name: row.authorName || '未知', email: row.authorEmail },
    category: row.categoryName,
    commentCount: parseInt(row.commentCount) || 0,
  }));

  res.json({ data, pagination: { page, pageSize, total, totalPages } });
});

app.delete('/api/admin/posts/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const post = await queryOne('SELECT id FROM posts WHERE id = $1', [req.params.id]);
    if (!post) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: '文章不存在' } });
    }
    await runSql('DELETE FROM posts WHERE id = $1', [req.params.id]);
    res.json({ data: { id: parseInt(req.params.id), message: '删除成功' } });
  } catch (err) {
    console.error('Admin delete post error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '删除失败，请稍后重试' } });
  }
});

app.get('/api/admin/comments', authMiddleware, adminMiddleware, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 20));
  const offset = (page - 1) * pageSize;

  const countRow = await queryOne('SELECT COUNT(*) as total FROM comments');
  const total = countRow.total;
  const totalPages = Math.ceil(total / pageSize);

  const rows = await queryAll(`
    SELECT cm.id, cm.author, cm.avatar, cm.content, cm.likes, cm."createdAt",
           p.slug as "postSlug", p.title as "postTitle"
    FROM comments cm JOIN posts p ON p.id = cm."postId"
    ORDER BY cm."createdAt" DESC LIMIT $1 OFFSET $2
  `, [pageSize, offset]);

  res.json({ data: rows, pagination: { page, pageSize, total, totalPages } });
});

app.post('/api/admin/categories', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, slug, description, color, icon } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '请填写名称和别名' } });
    }
    const existing = await queryOne('SELECT id FROM categories WHERE slug = $1', [slug]);
    if (existing) {
      return res.status(400).json({ error: { code: 'SLUG_EXISTS', message: '别名已存在' } });
    }
    const id = await insertSql(
      'INSERT INTO categories (name, slug, description, color, icon) VALUES ($1, $2, $3, $4, $5)',
      [name, slug, description || '', color || '#2563eb', icon || 'BookOpen']
    );
    const newCategory = await queryOne('SELECT * FROM categories WHERE id = $1', [id]);
    res.status(201).json({ data: newCategory });
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '创建失败，请稍后重试' } });
  }
});

app.put('/api/admin/categories/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, slug, description, color, icon } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '请填写名称和别名' } });
    }
    const existing = await queryOne('SELECT id FROM categories WHERE slug = $1 AND id != $2', [slug, req.params.id]);
    if (existing) {
      return res.status(400).json({ error: { code: 'SLUG_EXISTS', message: '别名已存在' } });
    }
    await runSql('UPDATE categories SET name = $1, slug = $2, description = $3, color = $4, icon = $5 WHERE id = $6',
      [name, slug, description || '', color || '#2563eb', icon || 'BookOpen', req.params.id]);
    const updated = await queryOne('SELECT * FROM categories WHERE id = $1', [req.params.id]);
    res.json({ data: updated });
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '更新失败，请稍后重试' } });
  }
});

app.delete('/api/admin/categories/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const postCount = await queryOne('SELECT COUNT(*) as count FROM posts WHERE "categoryId" = $1', [req.params.id]);
    if (postCount.count > 0) {
      return res.status(400).json({ error: { code: 'HAS_POSTS', message: '该分类下还有文章，请先删除或转移文章' } });
    }
    await runSql('DELETE FROM categories WHERE id = $1', [req.params.id]);
    res.json({ data: { id: parseInt(req.params.id), message: '删除成功' } });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '删除失败，请稍后重试' } });
  }
});

app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 20));
    const offset = (page - 1) * pageSize;

    const countRow = await queryOne('SELECT COUNT(*) as total FROM users');
    const total = parseInt(countRow.total) || 0;
    const totalPages = Math.ceil(total / pageSize);

    const rows = await queryAll(`
      SELECT u.id, u.name, u.email, u.avatar, u.bio, u.role, u.level, u.points, u."followersCount", u."createdAt",
             (SELECT COUNT(*) FROM posts WHERE "authorId" = u.id AND status = 'published') as "postCount",
             (SELECT COALESCE(SUM(views), 0) FROM posts WHERE "authorId" = u.id AND status = 'published') as "totalViews"
      FROM users u ORDER BY u."createdAt" DESC LIMIT $1 OFFSET $2
    `, [pageSize, offset]);

    res.json({ data: rows, pagination: { page, pageSize, total, totalPages } });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '获取用户列表失败' } });
  }
});

app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const targetUser = await queryOne('SELECT id, role FROM users WHERE id = $1', [req.params.id]);
    if (!targetUser) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: '用户不存在' } });
    }
    if (targetUser.id === req.user.id) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '不能删除自己' } });
    }
    await runSql('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ data: { id: parseInt(req.params.id), message: '删除成功' } });
  } catch (err) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '删除失败，请稍后重试' } });
  }
});

app.put('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '无效的角色' } });
    }
    const targetUser = await queryOne('SELECT id FROM users WHERE id = $1', [req.params.id]);
    if (!targetUser) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: '用户不存在' } });
    }
    await runSql('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
    const updated = await queryOne('SELECT id, name, email, avatar, role FROM users WHERE id = $1', [req.params.id]);
    res.json({ data: updated });
  } catch (err) {
    console.error('Admin update user error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '更新失败，请稍后重试' } });
  }
});

// 校验图片魔数（文件内容头），防止伪装扩展名的非图片文件
function isValidImageMagic(filePath, ext) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(12);
    fs.readSync(fd, buf, 0, 12, 0);
    fs.closeSync(fd);
    const hex = buf.toString('hex').toLowerCase();
    const ascii = buf.toString('latin1');
    if (ext === '.jpg' || ext === '.jpeg') return hex.startsWith('ffd8ff');
    if (ext === '.png') return hex.startsWith('89504e47');
    if (ext === '.gif') return hex.startsWith('47494638');
    if (ext === '.bmp') return hex.startsWith('424d');
    if (ext === '.webp') return ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP';
    if (ext === '.svg') return ascii.includes('<svg') || ascii.trimStart().startsWith('<?xml');
    return false;
  } catch {
    return false;
  }
}

app.post('/api/upload', authMiddleware, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: { code: 'FILE_TOO_LARGE', message: '文件大小不能超过 10MB' } });
        }
        return res.status(400).json({ error: { code: 'UPLOAD_ERROR', message: err.message } });
      }
      return res.status(400).json({ error: { code: 'UPLOAD_ERROR', message: err.message } });
    }

    if (!req.file) {
      return res.status(400).json({ error: { code: 'NO_FILE', message: '请选择要上传的文件' } });
    }

    // 内容校验：核对文件魔数，拒绝伪装扩展名的非图片文件
    const ext = path.extname(req.file.filename).toLowerCase();
    if (!isValidImageMagic(req.file.path, ext)) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: { code: 'INVALID_IMAGE', message: '文件内容不是有效的图片' } });
    }

    const url = `/uploads/${req.file.filename}`;
    res.json({ data: { url, filename: req.file.filename, size: req.file.size } });
  });
});

app.use((err, req, res, next) => {
  console.error(`[req:${req.id}] Unhandled error:`, err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: { code: 'UPLOAD_ERROR', message: err.message, requestId: req.id } });
  }
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: { code: 'CORS_FORBIDDEN', message: '跨域请求被拒绝', requestId: req.id } });
  }
  res.status(500).json({ error: { code: 'SERVER_ERROR', message: '服务器内部错误', requestId: req.id } });
});

const DIST_DIR = path.join(__dirname, '..', '..', 'dist');
app.use(express.static(DIST_DIR));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return;
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

async function syncSequences() {
  const tables = ['posts', 'users', 'categories', 'comments', 'post_tags', 'columns', 'user_follows', 'user_points', 'post_favorites', 'column_posts'];
  for (const table of tables) {
    try {
      const seqName = `${table}_id_seq`;
      const maxRes = await queryOne(`SELECT COALESCE(MAX(id), 0) as max_id FROM ${table}`);
      const maxId = maxRes?.max_id ?? 0;
      await runSql(`CREATE SEQUENCE IF NOT EXISTS ${seqName} START WITH ${maxId + 1} INCREMENT BY 1`);
      await runSql(`ALTER TABLE ${table} ALTER COLUMN id SET DEFAULT nextval('${seqName}'::regclass)`);
      await runSql(`ALTER SEQUENCE ${seqName} OWNED BY ${table}.id`);
    } catch (err) {
      console.error(`Sync sequence for ${table} warning (non-fatal):`, err.message);
    }
  }
}

async function start() {
  await initDb();

  const countRow = await queryOne('SELECT COUNT(*) as count FROM posts');
  const count = parseInt(countRow.count) || 0;
  if (count === 0) {
    console.log('📦 Empty database detected, seeding...');
    await seed();
  }

  await syncSequences();

  app.listen(PORT, HOST, () => {
    console.log(`🚀 Technical Community API running at http://${HOST}:${PORT}`);
    console.log(`   Auth:    POST /api/auth/login`);
    console.log(`   Posts:   GET  /api/posts`);
    console.log(`   Search:  GET  /api/search?q=keyword`);
    console.log(`   Rank:    GET  /api/ranking/posts`);
    console.log(`   Columns: GET  /api/columns`);
    console.log(`   Users:   GET  /api/users/:username`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});