import express from 'express';
import { queryOne, queryAll, insertSql, runSql } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(20, Math.max(1, parseInt(req.query.pageSize) || 10));
    const offset = (page - 1) * pageSize;

    const countRow = await queryOne('SELECT COUNT(*) as total FROM columns');
    const total = countRow.total;
    const totalPages = Math.ceil(total / pageSize);

    const rows = await queryAll(`
      SELECT c.id, c.name, c.slug, c.description, c."coverImage", c."postCount", c."viewCount", c."createdAt",
             u.name as "authorName", u.avatar as "authorAvatar", u.level as "authorLevel",
             (SELECT COUNT(*) FROM user_follows WHERE "followId" = c."authorId") as followersCount
      FROM columns c LEFT JOIN users u ON u.id = c."authorId"
      ORDER BY c."postCount" DESC, c."viewCount" DESC LIMIT $1 OFFSET $2
    `, [pageSize, offset]);

    res.json({ data: rows, pagination: { page, pageSize, total, totalPages } });
  } catch (err) {
    console.error('Get columns error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '获取专栏列表失败' } });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const column = await queryOne(`
      SELECT c.id, c.name, c.slug, c.description, c."coverImage", c."postCount", c."viewCount", c."createdAt", c."updatedAt",
             u.id as "authorId", u.name as "authorName", u.avatar as "authorAvatar", u.bio as "authorBio", u.level as "authorLevel", u.points as "authorPoints", u."followersCount" as "authorFollowers"
      FROM columns c LEFT JOIN users u ON u.id = c."authorId"
      WHERE c.slug = $1
    `, [slug]);

    if (!column) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: '专栏不存在' } });
    }

    await runSql('UPDATE columns SET "viewCount" = "viewCount" + 1 WHERE id = $1', [column.id]);

    const posts = await queryAll(`
      SELECT p.id, p.slug, p.title, p.summary, p."coverImage", p.views, p."publishedAt", p."likeCount", p."favoriteCount",
             cat.name as "categoryName", cat.slug as "categorySlug",
             COALESCE(tag_agg.tags, ARRAY[]::text[]) as tags,
             COALESCE(cc.count, 0) as "commentCount"
      FROM column_posts cp JOIN posts p ON cp."postId" = p.id
      JOIN categories cat ON cat.id = p."categoryId"
      LEFT JOIN LATERAL (
        SELECT ARRAY_AGG(pt.tag) as tags FROM post_tags pt WHERE pt."postId" = p.id
      ) tag_agg ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as count FROM comments cm WHERE cm."postId" = p.id
      ) cc ON true
      WHERE cp."columnId" = $1 AND p.status = 'published'
      ORDER BY cp.orderNum ASC, p."publishedAt" DESC
    `, [column.id]);

    const data = posts.map(post => ({
      ...post,
      tags: post.tags || [],
      commentCount: parseInt(post.commentCount) || 0,
    }));

    res.json({
      data: {
        ...column,
        author: {
          id: column.authorId,
          name: column.authorName || '墨客',
          avatar: column.authorAvatar,
          bio: column.authorBio,
          level: column.authorLevel || 1,
          points: column.authorPoints || 0,
          followersCount: column.authorFollowers || 0,
        },
        posts: data,
      }
    });
  } catch (err) {
    console.error('Get column error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '获取专栏详情失败' } });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, coverImage } = req.body;

    if (!name || name.length > 100) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '专栏名称不能为空且不超过 100 字' } });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    const existing = await queryOne('SELECT id FROM columns WHERE slug = $1', [slug]);
    if (existing) {
      return res.status(400).json({ error: { code: 'SLUG_EXISTS', message: '专栏别名已存在' } });
    }

    const id = await insertSql(
      'INSERT INTO columns (name, slug, description, "coverImage", "authorId") VALUES ($1, $2, $3, $4, $5)',
      [name, slug, description || '', coverImage || '', req.user.id]
    );

    res.status(201).json({
      data: { id, name, slug, description: description || '', coverImage: coverImage || '', authorId: req.user.id, postCount: 0, viewCount: 0 }
    });
  } catch (err) {
    console.error('Create column error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '创建专栏失败，请稍后重试' } });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, coverImage } = req.body;

    const column = await queryOne('SELECT * FROM columns WHERE id = $1', [req.params.id]);
    if (!column) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: '专栏不存在' } });
    }

    if (column.authorId !== req.user.id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: '无权修改此专栏' } });
    }

    if (!name || name.length > 100) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '专栏名称不能为空且不超过 100 字' } });
    }

    let slug = column.slug;
    if (name !== column.name) {
      slug = name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
      const existing = await queryOne('SELECT id FROM columns WHERE slug = $1 AND id != $2', [slug, req.params.id]);
      if (existing) {
        return res.status(400).json({ error: { code: 'SLUG_EXISTS', message: '专栏别名已存在' } });
      }
    }

    await runSql(
      'UPDATE columns SET name = $1, slug = $2, description = $3, "coverImage" = $4, "updatedAt" = NOW() WHERE id = $5',
      [name, slug, description || '', coverImage || '', req.params.id]
    );

    const updated = await queryOne('SELECT * FROM columns WHERE id = $1', [req.params.id]);
    res.json({ data: updated });
  } catch (err) {
    console.error('Update column error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '更新专栏失败，请稍后重试' } });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const column = await queryOne('SELECT * FROM columns WHERE id = $1', [req.params.id]);
    if (!column) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: '专栏不存在' } });
    }

    if (column.authorId !== req.user.id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: '无权删除此专栏' } });
    }

    await runSql('DELETE FROM columns WHERE id = $1', [req.params.id]);
    res.json({ data: { id: parseInt(req.params.id), message: '删除成功' } });
  } catch (err) {
    console.error('Delete column error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '删除专栏失败，请稍后重试' } });
  }
});

router.post('/:id/posts', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.body;

    const column = await queryOne('SELECT * FROM columns WHERE id = $1', [req.params.id]);
    if (!column) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: '专栏不存在' } });
    }

    if (column.authorId !== req.user.id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: '无权操作此专栏' } });
    }

    const post = await queryOne('SELECT * FROM posts WHERE id = $1', [postId]);
    if (!post) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: '文章不存在' } });
    }

    if (post.authorId !== req.user.id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: '无权添加他人文章' } });
    }

    const existing = await queryOne('SELECT id FROM column_posts WHERE "columnId" = $1 AND "postId" = $2', [req.params.id, postId]);
    if (existing) {
      return res.status(400).json({ error: { code: 'ALREADY_EXISTS', message: '文章已在专栏中' } });
    }

    await insertSql('INSERT INTO column_posts ("columnId", "postId") VALUES ($1, $2)', [req.params.id, postId]);
    await runSql('UPDATE columns SET "postCount" = "postCount" + 1 WHERE id = $1', [req.params.id]);
    await runSql('UPDATE posts SET "columnId" = $1 WHERE id = $2', [req.params.id, postId]);

    res.json({ data: { message: '添加成功' } });
  } catch (err) {
    console.error('Add post to column error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '添加失败，请稍后重试' } });
  }
});

router.delete('/:id/posts/:postId', authMiddleware, async (req, res) => {
  try {
    const column = await queryOne('SELECT * FROM columns WHERE id = $1', [req.params.id]);
    if (!column) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: '专栏不存在' } });
    }

    if (column.authorId !== req.user.id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: '无权操作此专栏' } });
    }

    await runSql('DELETE FROM column_posts WHERE "columnId" = $1 AND "postId" = $2', [req.params.id, req.params.postId]);
    await runSql('UPDATE columns SET "postCount" = GREATEST(0, "postCount" - 1) WHERE id = $1', [req.params.id]);
    await runSql('UPDATE posts SET "columnId" = NULL WHERE id = $1', [req.params.postId]);

    res.json({ data: { message: '移除成功' } });
  } catch (err) {
    console.error('Remove post from column error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '移除失败，请稍后重试' } });
  }
});

export default router;