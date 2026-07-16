import express from 'express';
import { queryOne, queryAll, runSql } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ⚠️ 特定路由必须放在 /:username 之前，否则会被参数化路由阴影遮盖
router.get('/posts', authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 10));
    const status = req.query.status;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE p."authorId" = $1';
    const params = [req.user.id];

    if (status) {
      params.push(status);
      whereClause += ` AND p.status = $${params.length}`;
    }

    const countRow = await queryOne(`SELECT COUNT(*) as total FROM posts p ${whereClause}`, params);
    const total = parseInt(countRow.total) || 0;
    const totalPages = Math.ceil(total / pageSize);

    const rows = await queryAll(`
      SELECT p.id, p.slug, p.title, p.summary, p."coverImage", p.views, p."publishedAt", p."updatedAt", p.status, p."likeCount", p."favoriteCount",
             c.name as "categoryName", c.slug as "categorySlug",
             COALESCE(tag_agg.tags, ARRAY[]::text[]) as tags,
             COALESCE(cc.count, 0) as "commentCount"
      FROM posts p LEFT JOIN categories c ON c.id = p."categoryId"
      LEFT JOIN LATERAL (
        SELECT ARRAY_AGG(pt.tag) as tags FROM post_tags pt WHERE pt."postId" = p.id
      ) tag_agg ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as count FROM comments cm WHERE cm."postId" = p.id
      ) cc ON true
      ${whereClause}
      ORDER BY p."publishedAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, pageSize, offset]);

    const data = rows.map(row => ({
      id: row.id, slug: row.slug, title: row.title, summary: row.summary,
      coverImage: row.coverImage, views: row.views,
      publishedAt: row.publishedAt, updatedAt: row.updatedAt,
      category: row.categoryName ? { name: row.categoryName, slug: row.categorySlug } : null,
      tags: row.tags || [],
      commentCount: parseInt(row.commentCount) || 0,
      likeCount: row.likeCount || 0, favoriteCount: row.favoriteCount || 0,
      status: row.status,
    }));

    res.json({ data, pagination: { page, pageSize, total, totalPages } });
  } catch (err) {
    console.error('Get user posts error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '获取用户文章失败' } });
  }
});

router.get('/favorites', authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 10));
    const offset = (page - 1) * pageSize;

    const countRow = await queryOne('SELECT COUNT(*) as total FROM post_favorites WHERE "userId" = $1', [req.user.id]);
    const total = parseInt(countRow.total) || 0;
    const totalPages = Math.ceil(total / pageSize);

    const rows = await queryAll(`
      SELECT p.id, p.slug, p.title, p.summary, p."coverImage", p.views, p."publishedAt",
             c.name as "categoryName", c.slug as "categorySlug", c.color as "categoryColor",
             COALESCE(tag_agg.tags, ARRAY[]::text[]) as tags,
             COALESCE(cc.count, 0) as "commentCount"
      FROM post_favorites pf JOIN posts p ON p.id = pf."postId"
      JOIN categories c ON c.id = p."categoryId"
      LEFT JOIN LATERAL (
        SELECT ARRAY_AGG(pt.tag) as tags FROM post_tags pt WHERE pt."postId" = p.id
      ) tag_agg ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as count FROM comments cm WHERE cm."postId" = p.id
      ) cc ON true
      WHERE pf."userId" = $1
      ORDER BY pf."createdAt" DESC LIMIT $2 OFFSET $3
    `, [req.user.id, pageSize, offset]);

    const data = rows.map(row => ({
      id: row.id, slug: row.slug, title: row.title, summary: row.summary,
      coverImage: row.coverImage, views: row.views, publishedAt: row.publishedAt,
      category: { name: row.categoryName, slug: row.categorySlug, color: row.categoryColor },
      tags: row.tags || [],
      commentCount: parseInt(row.commentCount) || 0,
    }));

    res.json({ data, pagination: { page, pageSize, total, totalPages } });
  } catch (err) {
    console.error('Get favorites error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '获取收藏失败' } });
  }
});

router.get('/points', authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 20));
    const offset = (page - 1) * pageSize;

    const countRow = await queryOne('SELECT COUNT(*) as total FROM user_points WHERE "userId" = $1', [req.user.id]);
    const total = parseInt(countRow.total) || 0;
    const totalPages = Math.ceil(total / pageSize);

    const rows = await queryAll(`
      SELECT id, type, points, description, "createdAt"
      FROM user_points WHERE "userId" = $1
      ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3
    `, [req.user.id, pageSize, offset]);

    const totalPointsRow = await queryOne('SELECT COALESCE(SUM(points), 0) as total FROM user_points WHERE "userId" = $1', [req.user.id]);

    res.json({
      data: rows,
      pagination: { page, pageSize, total, totalPages },
      summary: { totalPoints: totalPointsRow.total || 0 }
    });
  } catch (err) {
    console.error('Get points error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '获取积分失败' } });
  }
});

router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    if (!username) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '用户名不能为空' } });
    }

    const user = await queryOne('SELECT id, name, email, avatar, bio, role, level, points, "followersCount", "followingCount", title, company, location, website, "createdAt" FROM users WHERE name = $1', [username]);
    if (!user) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: '用户不存在' } });
    }

    const postCountRow = await queryOne('SELECT COUNT(*) as count FROM posts WHERE "authorId" = $1 AND status = $2', [user.id, 'published']);
    const totalViewsRow = await queryOne('SELECT COALESCE(SUM(views), 0) as total FROM posts WHERE "authorId" = $1 AND status = $2', [user.id, 'published']);
    const commentCountRow = await queryOne('SELECT COUNT(*) as count FROM comments WHERE "authorId" = $1', [user.id]);
    const columnCountRow = await queryOne('SELECT COUNT(*) as count FROM columns WHERE "authorId" = $1', [user.id]);

    let isFollowing = false;
    if (req.user && req.user.id !== user.id) {
      const follow = await queryOne('SELECT id FROM user_follows WHERE "userId" = $1 AND "followId" = $2', [req.user.id, user.id]);
      isFollowing = !!follow;
    }

    const postCount = parseInt(postCountRow.count) || 0;
    const totalViews = parseInt(totalViewsRow.total) || 0;

    res.json({
      data: {
        ...user,
        postCount,
        totalViews,
        isFollowing,
        stats: {
          posts: postCount,
          views: totalViews,
          comments: parseInt(commentCountRow.count) || 0,
          columns: parseInt(columnCountRow.count) || 0,
        }
      }
    });
  } catch (err) {
    console.error('Get user by username error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '获取用户信息失败' } });
  }
});

router.get('/:username/posts', async (req, res) => {
  try {
    const { username } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(20, Math.max(1, parseInt(req.query.pageSize) || 10));
    const offset = (page - 1) * pageSize;
    const status = req.query.status || 'published';

    const user = await queryOne('SELECT id FROM users WHERE name = $1', [username]);
    if (!user) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: '用户不存在' } });
    }

    const countRow = await queryOne('SELECT COUNT(*) as total FROM posts WHERE "authorId" = $1 AND status = $2', [user.id, status]);
    const total = parseInt(countRow.total) || 0;
    const totalPages = Math.ceil(total / pageSize);

    const rows = await queryAll(`
      SELECT p.id, p.slug, p.title, p.summary, p."coverImage", p.views, p."publishedAt", p."likeCount", p."favoriteCount", p.hotScore, p.status,
             c.id as "categoryId", c.name as "categoryName", c.slug as "categorySlug",
             COALESCE(tag_agg.tags, ARRAY[]::text[]) as tags,
             COALESCE(cc.count, 0) as "commentCount"
      FROM posts p LEFT JOIN categories c ON c.id = p."categoryId"
      LEFT JOIN LATERAL (
        SELECT ARRAY_AGG(pt.tag) as tags FROM post_tags pt WHERE pt."postId" = p.id
      ) tag_agg ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as count FROM comments cm WHERE cm."postId" = p.id
      ) cc ON true
      WHERE p."authorId" = $1 AND p.status = $2
      ORDER BY p."publishedAt" DESC LIMIT $3 OFFSET $4
    `, [user.id, status, pageSize, offset]);

    const data = rows.map(row => ({
      ...row,
      tags: row.tags || [],
      commentCount: parseInt(row.commentCount) || 0,
    }));

    res.json({ data, pagination: { page, pageSize, total, totalPages } });
  } catch (err) {
    console.error('Get user posts error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '获取用户文章失败' } });
  }
});

router.get('/:username/columns', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await queryOne('SELECT id FROM users WHERE name = $1', [username]);
    if (!user) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: '用户不存在' } });
    }

    const columns = await queryAll(`
      SELECT id, name, slug, description, "coverImage", "postCount", "viewCount", "createdAt"
      FROM columns WHERE "authorId" = $1 ORDER BY "createdAt" DESC
    `, [user.id]);

    res.json({ data: columns });
  } catch (err) {
    console.error('Get user columns error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '获取用户专栏失败' } });
  }
});

router.get('/:username/followers', authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 20));
    const offset = (page - 1) * pageSize;

    const user = await queryOne('SELECT id FROM users WHERE name = $1', [username]);
    if (!user) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: '用户不存在' } });
    }

    const countRow = await queryOne('SELECT COUNT(*) as total FROM user_follows WHERE "followId" = $1', [user.id]);
    const total = parseInt(countRow.total) || 0;
    const totalPages = Math.ceil(total / pageSize);

    const rows = await queryAll(`
      SELECT u.id, u.name, u.avatar, u.bio, u.level, u.points, u."followersCount", u."followingCount", uf."createdAt"
      FROM user_follows uf JOIN users u ON uf."userId" = u.id
      WHERE uf."followId" = $1 ORDER BY uf."createdAt" DESC LIMIT $2 OFFSET $3
    `, [user.id, pageSize, offset]);

    const data = [];
    for (const row of rows) {
      const isFollowing = await queryOne('SELECT id FROM user_follows WHERE "userId" = $1 AND "followId" = $2', [req.user.id, row.id]);
      data.push({
        ...row,
        isFollowing: !!isFollowing,
      });
    }

    res.json({ data, pagination: { page, pageSize, total, totalPages } });
  } catch (err) {
    console.error('Get followers error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '获取关注者失败' } });
  }
});

router.get('/:username/following', authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 20));
    const offset = (page - 1) * pageSize;

    const user = await queryOne('SELECT id FROM users WHERE name = $1', [username]);
    if (!user) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: '用户不存在' } });
    }

    const countRow = await queryOne('SELECT COUNT(*) as total FROM user_follows WHERE "userId" = $1', [user.id]);
    const total = parseInt(countRow.total) || 0;
    const totalPages = Math.ceil(total / pageSize);

    const rows = await queryAll(`
      SELECT u.id, u.name, u.avatar, u.bio, u.level, u.points, u."followersCount", u."followingCount", uf."createdAt"
      FROM user_follows uf JOIN users u ON uf."followId" = u.id
      WHERE uf."userId" = $1 ORDER BY uf."createdAt" DESC LIMIT $2 OFFSET $3
    `, [user.id, pageSize, offset]);

    const data = [];
    for (const row of rows) {
      const isFollowing = await queryOne('SELECT id FROM user_follows WHERE "userId" = $1 AND "followId" = $2', [req.user.id, row.id]);
      data.push({
        ...row,
        isFollowing: !!isFollowing,
      });
    }

    res.json({ data, pagination: { page, pageSize, total, totalPages } });
  } catch (err) {
    console.error('Get following error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '获取关注列表失败' } });
  }
});

export default router;
