import express from 'express';
import { queryOne, queryAll } from '../db.js';

const router = express.Router();

router.get('/posts', async (req, res) => {
  try {
    const period = req.query.period || 'week';
    const limit = Math.min(50, parseInt(req.query.limit) || 20);

    let dateFilter = '';
    switch (period) {
      case 'day': dateFilter = 'AND p."publishedAt" >= NOW() - INTERVAL \'1 DAY\''; break;
      case 'week': dateFilter = 'AND p."publishedAt" >= NOW() - INTERVAL \'7 DAYS\''; break;
      case 'month': dateFilter = 'AND p."publishedAt" >= NOW() - INTERVAL \'30 DAYS\''; break;
      case 'year': dateFilter = 'AND p."publishedAt" >= NOW() - INTERVAL \'365 DAYS\''; break;
      default: dateFilter = '';
    }

    const rows = await queryAll(`
      SELECT p.id, p.slug, p.title, p.summary, p."coverImage", p.views, p."publishedAt", p."likeCount", p."favoriteCount", p.hotScore,
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
      WHERE p.status = 'published' ${dateFilter}
      ORDER BY p.hotScore DESC, p.views DESC LIMIT $1
    `, [limit]);

    const data = rows.map(row => ({
      id: row.id, slug: row.slug, title: row.title, summary: row.summary,
      coverImage: row.coverImage,
      category: { name: row.categoryName, slug: row.categorySlug, color: row.categoryColor },
      author: { name: row.authorName || '墨客', avatar: row.authorAvatar, level: row.authorLevel || 1 },
      tags: row.tags || [],
      publishedAt: row.publishedAt, views: row.views,
      likeCount: row.likeCount || 0, favoriteCount: row.favoriteCount || 0,
      hotScore: row.hotScore || 0,
      commentCount: parseInt(row.commentCount) || 0,
    }));

    res.json({ data, period });
  } catch (err) {
    console.error('Post ranking error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '获取排行榜失败' } });
  }
});

router.get('/authors', async (req, res) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit) || 20);

    const rows = await queryAll(`
      SELECT u.id, u.name, u.avatar, u.bio, u.level, u.points, u.title, u.company,
             (SELECT COUNT(*) FROM posts WHERE "authorId" = u.id AND status = 'published') as postCount,
             (SELECT COALESCE(SUM(views), 0) FROM posts WHERE "authorId" = u.id AND status = 'published') as totalViews,
             (SELECT COALESCE(SUM("likeCount"), 0) FROM posts WHERE "authorId" = u.id AND status = 'published') as totalLikes,
             (SELECT COUNT(*) FROM user_follows WHERE "followId" = u.id) as followersCount,
             (SELECT COUNT(*) FROM user_follows WHERE "userId" = u.id) as followingCount
      FROM users u
      ORDER BY followersCount DESC, totalViews DESC LIMIT $1
    `, [limit]);

    res.json({ data: rows });
  } catch (err) {
    console.error('Author ranking error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '获取作者排行失败' } });
  }
});

router.get('/tags', async (req, res) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit) || 30);

    const rows = await queryAll(`
      SELECT pt.tag, COUNT(DISTINCT pt."postId") as postCount,
             COALESCE(SUM(p.views), 0) as totalViews,
             COALESCE(SUM(p."likeCount"), 0) as totalLikes
      FROM post_tags pt JOIN posts p ON pt."postId" = p.id
      WHERE p.status = 'published'
      GROUP BY pt.tag
      ORDER BY postCount DESC, totalViews DESC LIMIT $1
    `, [limit]);

    res.json({ data: rows });
  } catch (err) {
    console.error('Tag ranking error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '获取标签排行失败' } });
  }
});

router.get('/views', async (req, res) => {
  try {
    const period = req.query.period || 'week';
    const limit = Math.min(50, parseInt(req.query.limit) || 20);

    let dateFilter = '';
    switch (period) {
      case 'day': dateFilter = 'AND p."publishedAt" >= NOW() - INTERVAL \'1 DAY\''; break;
      case 'week': dateFilter = 'AND p."publishedAt" >= NOW() - INTERVAL \'7 DAYS\''; break;
      case 'month': dateFilter = 'AND p."publishedAt" >= NOW() - INTERVAL \'30 DAYS\''; break;
      case 'year': dateFilter = 'AND p."publishedAt" >= NOW() - INTERVAL \'365 DAYS\''; break;
      default: dateFilter = '';
    }

    const rows = await queryAll(`
      SELECT p.id, p.slug, p.title, p.summary, p."coverImage", p.views, p."publishedAt",
             c.name as "categoryName", c.slug as "categorySlug",
             u.name as "authorName", u.avatar as "authorAvatar"
      FROM posts p JOIN categories c ON c.id = p."categoryId"
      LEFT JOIN users u ON u.id = p."authorId"
      WHERE p.status = 'published' ${dateFilter}
      ORDER BY p.views DESC LIMIT $1
    `, [limit]);

    const data = rows.map(row => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      coverImage: row.coverImage,
      views: row.views,
      publishedAt: row.publishedAt,
      category: { name: row.categoryName, slug: row.categorySlug },
      author: { name: row.authorName || '墨客', avatar: row.authorAvatar },
    }));

    res.json({ data, period });
  } catch (err) {
    console.error('Views ranking error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '获取阅读排行失败' } });
  }
});

router.get('/comments', async (req, res) => {
  try {
    const period = req.query.period || 'week';
    const limit = Math.min(50, parseInt(req.query.limit) || 20);

    let dateFilter = '';
    switch (period) {
      case 'day': dateFilter = 'AND p."publishedAt" >= NOW() - INTERVAL \'1 DAY\''; break;
      case 'week': dateFilter = 'AND p."publishedAt" >= NOW() - INTERVAL \'7 DAYS\''; break;
      case 'month': dateFilter = 'AND p."publishedAt" >= NOW() - INTERVAL \'30 DAYS\''; break;
      case 'year': dateFilter = 'AND p."publishedAt" >= NOW() - INTERVAL \'365 DAYS\''; break;
      default: dateFilter = '';
    }

    const rows = await queryAll(`
      SELECT p.id, p.slug, p.title, p.summary, p."coverImage", p."publishedAt",
             (SELECT COUNT(*) FROM comments WHERE "postId" = p.id) as commentCount,
             c.name as "categoryName", c.slug as "categorySlug",
             u.name as "authorName", u.avatar as "authorAvatar"
      FROM posts p JOIN categories c ON c.id = p."categoryId"
      LEFT JOIN users u ON u.id = p."authorId"
      WHERE p.status = 'published' ${dateFilter}
      ORDER BY commentCount DESC LIMIT $1
    `, [limit]);

    const data = rows.map(row => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      coverImage: row.coverImage,
      publishedAt: row.publishedAt,
      commentCount: parseInt(row.commentCount) || 0,
      category: { name: row.categoryName, slug: row.categorySlug },
      author: { name: row.authorName || '墨客', avatar: row.authorAvatar },
    }));

    res.json({ data, period });
  } catch (err) {
    console.error('Comments ranking error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '获取评论排行失败' } });
  }
});

export default router;