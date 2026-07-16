import express from 'express';
import { queryOne, queryAll } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const q = req.query.q;
    const type = req.query.type || 'all';
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(20, Math.max(1, parseInt(req.query.pageSize) || 10));
    const offset = (page - 1) * pageSize;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '搜索关键词至少 2 个字符' } });
    }

    const query = q.trim();
    const results = { posts: [], users: [], tags: [] };

    if (type === 'all' || type === 'posts') {
      const countRow = await queryOne(`
        SELECT COUNT(*) as total FROM posts 
        WHERE status = 'published' AND 
        (title ILIKE $1 OR summary ILIKE $1 OR content ILIKE $1)
      `, [`%${query}%`]);
      
      const postRows = await queryAll(`
        SELECT p.id, p.slug, p.title, p.summary, p."coverImage", p.views, p."publishedAt",
               c.name as "categoryName", c.slug as "categorySlug",
               u.name as "authorName", u.avatar as "authorAvatar"
        FROM posts p JOIN categories c ON c.id = p."categoryId"
        LEFT JOIN users u ON u.id = p."authorId"
        WHERE p.status = 'published' AND 
        (p.title ILIKE $1 OR p.summary ILIKE $1 OR p.content ILIKE $1)
        ORDER BY p."publishedAt" DESC LIMIT $2 OFFSET $3
      `, [`%${query}%`, pageSize, offset]);

      results.posts = {
        data: postRows.map(row => ({
          id: row.id,
          slug: row.slug,
          title: row.title,
          summary: row.summary,
          coverImage: row.coverImage,
          views: row.views,
          publishedAt: row.publishedAt,
          category: { name: row.categoryName, slug: row.categorySlug },
          author: { name: row.authorName || '墨客', avatar: row.authorAvatar },
        })),
        total: countRow.total,
        pagination: { page, pageSize, totalPages: Math.ceil(countRow.total / pageSize) },
      };
    }

    if (type === 'all' || type === 'users') {
      const userRows = await queryAll(`
        SELECT id, name, avatar, bio, level, points, "followersCount"
        FROM users WHERE name ILIKE $1 OR bio ILIKE $1
        ORDER BY "followersCount" DESC LIMIT $2
      `, [`%${query}%`, 10]);

      results.users = {
        data: userRows,
        total: userRows.length,
      };
    }

    if (type === 'all' || type === 'tags') {
      const tagRows = await queryAll(`
        SELECT tag, COUNT(*) as count
        FROM post_tags WHERE tag ILIKE $1
        GROUP BY tag ORDER BY count DESC LIMIT $2
      `, [`%${query}%`, 10]);

      results.tags = {
        data: tagRows,
        total: tagRows.length,
      };
    }

    res.json({ data: results });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '搜索失败，请稍后重试' } });
  }
});

router.get('/posts', async (req, res) => {
  try {
    const q = req.query.q;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(20, Math.max(1, parseInt(req.query.pageSize) || 10));
    const offset = (page - 1) * pageSize;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '搜索关键词至少 2 个字符' } });
    }

    const countRow = await queryOne(`
      SELECT COUNT(*) as total FROM posts 
      WHERE status = 'published' AND 
      (title ILIKE $1 OR summary ILIKE $1 OR content ILIKE $1)
    `, [`%${q.trim()}%`]);

    const rows = await queryAll(`
      SELECT p.id, p.slug, p.title, p.summary, p."coverImage", p.views, p."publishedAt", p."likeCount", p."favoriteCount",
             c.name as "categoryName", c.slug as "categorySlug", c.color as "categoryColor",
             u.name as "authorName", u.avatar as "authorAvatar", u.level as "authorLevel",
             COALESCE(tag_agg.tags, ARRAY[]::text[]) as tags,
             COALESCE(cc.count, 0) as "commentCount"
      FROM posts p JOIN categories c ON c.id = p."categoryId"
      LEFT JOIN users u ON u.id = p."authorId"
      LEFT JOIN LATERAL (
        SELECT ARRAY_AGG(pt.tag) as tags FROM post_tags pt WHERE pt."postId" = p.id
      ) tag_agg ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as count FROM comments cm WHERE cm."postId" = p.id
      ) cc ON true
      WHERE p.status = 'published' AND 
      (p.title ILIKE $1 OR p.summary ILIKE $1 OR p.content ILIKE $1)
      ORDER BY p."publishedAt" DESC LIMIT $2 OFFSET $3
    `, [`%${q.trim()}%`, pageSize, offset]);

    const data = rows.map(row => ({
      id: row.id, slug: row.slug, title: row.title, summary: row.summary,
      coverImage: row.coverImage,
      category: { name: row.categoryName, slug: row.categorySlug, color: row.categoryColor },
      author: { name: row.authorName || '墨客', avatar: row.authorAvatar, level: row.authorLevel || 1 },
      tags: row.tags || [],
      publishedAt: row.publishedAt, views: row.views,
      likeCount: row.likeCount || 0, favoriteCount: row.favoriteCount || 0,
      commentCount: parseInt(row.commentCount) || 0,
    }));

    res.json({ 
      data, 
      pagination: { page, pageSize, total: countRow.total, totalPages: Math.ceil(countRow.total / pageSize) } 
    });
  } catch (err) {
    console.error('Search posts error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '搜索失败，请稍后重试' } });
  }
});

router.get('/users', async (req, res) => {
  try {
    const q = req.query.q;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(20, Math.max(1, parseInt(req.query.pageSize) || 10));
    const offset = (page - 1) * pageSize;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '搜索关键词至少 2 个字符' } });
    }

    const countRow = await queryOne(`
      SELECT COUNT(*) as total FROM users WHERE name ILIKE $1 OR bio ILIKE $1
    `, [`%${q.trim()}%`]);

    const rows = await queryAll(`
      SELECT id, name, avatar, bio, level, points, "followersCount", "followingCount", title, company, location, "createdAt"
      FROM users WHERE name ILIKE $1 OR bio ILIKE $1
      ORDER BY "followersCount" DESC LIMIT $2 OFFSET $3
    `, [`%${q.trim()}%`, pageSize, offset]);

    const data = [];
    for (const row of rows) {
      const postCount = await queryOne('SELECT COUNT(*) as count FROM posts WHERE "authorId" = $1 AND status = $2', [row.id, 'published']);
      data.push({
        ...row,
        postCount: postCount.count || 0,
      });
    }

    res.json({ 
      data, 
      pagination: { page, pageSize, total: countRow.total, totalPages: Math.ceil(countRow.total / pageSize) } 
    });
  } catch (err) {
    console.error('Search users error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '搜索失败，请稍后重试' } });
  }
});

router.get('/tags', async (req, res) => {
  try {
    const q = req.query.q;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '搜索关键词至少 2 个字符' } });
    }

    const rows = await queryAll(`
      SELECT tag, COUNT(*) as count
      FROM post_tags WHERE tag ILIKE $1
      GROUP BY tag ORDER BY count DESC LIMIT 20
    `, [`%${q.trim()}%`]);

    res.json({ data: rows });
  } catch (err) {
    console.error('Search tags error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '搜索失败，请稍后重试' } });
  }
});

export default router;