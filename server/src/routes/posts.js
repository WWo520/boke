import express from 'express';
import { queryOne, queryAll, insertSql, runSql } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 9));
  const category = req.query.category;
  const search = req.query.search;
  const tag = req.query.tag;
  const sort = req.query.sort || 'newest';
  const offset = (page - 1) * pageSize;

  let paramIndex = 0;
  const params = [];
  const conditions = [];

  paramIndex++; conditions.push(`p.status = $${paramIndex}`); params.push('published');
  if (category) { paramIndex++; conditions.push(`c.slug = $${paramIndex}`); params.push(category); }
  if (search) { paramIndex++; conditions.push(`(p.title ILIKE $${paramIndex} OR p.summary ILIKE $${paramIndex})`); params.push(`%${search}%`); }

  let joinTags = '';
  if (tag) {
    joinTags = ` JOIN post_tags pt ON pt."postId" = p.id`;
    paramIndex++; conditions.push(`pt.tag = $${paramIndex}`); params.push(tag);
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  let orderBy;
  switch (sort) {
    case 'views': orderBy = 'p.views DESC'; break;
    case 'hot': orderBy = 'p.hotScore DESC'; break;
    case 'oldest': orderBy = 'p."publishedAt" ASC'; break;
    case 'newest': default: orderBy = 'p."publishedAt" DESC'; break;
  }

  const countRow = await queryOne(`
    SELECT COUNT(*) as total FROM posts p
    JOIN categories c ON c.id = p."categoryId"
    ${joinTags}
    ${where}
  `, params);

  const total = countRow.total;
  const totalPages = Math.ceil(total / pageSize);

  const rows = await queryAll(`
    SELECT p.id, p.slug, p.title, p.summary, p."coverImage", p.views, p."publishedAt", p."likeCount", p."favoriteCount", p.hotScore,
           c.id as "categoryId", c.name as "categoryName", c.slug as "categorySlug", c.color as "categoryColor", c.icon as "categoryIcon",
           u.name as "authorName", u.avatar as "authorAvatar", u.level as "authorLevel",
           COALESCE(tag_agg.tags, ARRAY[]::text[]) as tags,
           COALESCE(cc.count, 0) as "commentCount"
    FROM posts p JOIN categories c ON c.id = p."categoryId"
    LEFT JOIN users u ON u.id = p."authorId"
    ${joinTags}
    LEFT JOIN LATERAL (
      SELECT ARRAY_AGG(pt.tag) as tags FROM post_tags pt WHERE pt."postId" = p.id
    ) tag_agg ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*) as count FROM comments cm WHERE cm."postId" = p.id
    ) cc ON true
    ${where}
    ORDER BY ${orderBy} LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}
  `, [...params, pageSize, offset]);

  const data = rows.map(row => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    coverImage: row.coverImage,
    category: { id: row.categoryId, name: row.categoryName, slug: row.categorySlug, color: row.categoryColor, icon: row.categoryIcon },
    author: { name: row.authorName || '墨客', avatar: row.authorAvatar || 'https://api.dicebear.com/9.x/avataaars/svg?seed=blogger&backgroundColor=2563eb', level: row.authorLevel || 1 },
    tags: row.tags || [],
    publishedAt: row.publishedAt,
    views: row.views,
    likeCount: row.likeCount || 0,
    favoriteCount: row.favoriteCount || 0,
    hotScore: row.hotScore || 0,
    commentCount: parseInt(row.commentCount) || 0,
  }));

  res.json({ data, pagination: { page, pageSize, total, totalPages } });
});

router.get('/popular', async (req, res) => {
  const limit = Math.min(10, parseInt(req.query.limit) || 5);
  const rows = await queryAll(`
    SELECT p.slug, p.title, p.summary, p."coverImage", p.views, p."publishedAt", p."likeCount", p."favoriteCount",
           u.name as "authorName", u.avatar as "authorAvatar",
           c.id as "categoryId", c.name as "categoryName", c.slug as "categorySlug", c.color as "categoryColor"
    FROM posts p LEFT JOIN users u ON u.id = p."authorId"
    JOIN categories c ON c.id = p."categoryId"
    WHERE p.status = 'published'
    ORDER BY p.hotScore DESC, p.views DESC LIMIT $1
  `, [limit]);
  const data = rows.map(row => ({
    ...row,
    author: { name: row.authorName || '墨客', avatar: row.authorAvatar || 'https://api.dicebear.com/9.x/avataaars/svg?seed=blogger&backgroundColor=2563eb' },
    category: { id: row.categoryId, name: row.categoryName, slug: row.categorySlug, color: row.categoryColor },
  }));
  res.json({ data });
});

router.get('/id/:id', authMiddleware, async (req, res) => {
  try {
    const row = await queryOne(`
      SELECT p.*, c.id as "categoryId", c.name as "categoryName", c.slug as "categorySlug", c.color as "categoryColor",
             u.name as "authorName", u.avatar as "authorAvatar", u.bio as "authorBio"
      FROM posts p JOIN categories c ON c.id = p."categoryId" LEFT JOIN users u ON u.id = p."authorId" WHERE p.id = $1
    `, [req.params.id]);

    if (!row) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: '文章不存在' } });
    }

    if (row.authorId !== req.user.id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: '无权访问此文章' } });
    }

    const tags = await queryAll('SELECT tag FROM post_tags WHERE "postId" = $1', [row.id]);

    res.json({
      data: {
        id: row.id, slug: row.slug, title: row.title, content: row.content,
        coverImage: row.coverImage, summary: row.summary,
        category: { id: row.categoryId, name: row.categoryName, slug: row.categorySlug, color: row.categoryColor },
        author: { name: row.authorName || '墨客', avatar: row.authorAvatar || 'https://api.dicebear.com/9.x/avataaars/svg?seed=blogger&backgroundColor=2563eb', bio: row.authorBio || '前端开发者 & 技术写作者。' },
        tags: tags.map(t => t.tag), publishedAt: row.publishedAt, updatedAt: row.updatedAt, views: row.views,
        status: row.status,
      }
    });
  } catch (err) {
    console.error('Get post by id error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '获取文章失败' } });
  }
});

router.get('/:slug', async (req, res) => {
  const row = await queryOne(`
    SELECT p.*, c.id as "categoryId", c.name as "categoryName", c.slug as "categorySlug", c.color as "categoryColor",
           u.name as "authorName", u.avatar as "authorAvatar", u.bio as "authorBio", u.level as "authorLevel", u.points as "authorPoints", u."followersCount" as "authorFollowers"
    FROM posts p JOIN categories c ON c.id = p."categoryId" 
    LEFT JOIN users u ON u.id = p."authorId"
    WHERE p.slug = $1
  `, [req.params.slug]);

  if (!row) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: '文章不存在' } });
  }

  if (row.status !== 'published') {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: '文章不存在' } });
  }

  await runSql('UPDATE posts SET views = views + 1 WHERE id = $1', [row.id]);

  const tags = await queryAll('SELECT tag FROM post_tags WHERE "postId" = $1', [row.id]);
  const commentCountResult = await queryOne('SELECT COUNT(*) as count FROM comments WHERE "postId" = $1', [row.id]);
  const prevPost = await queryOne('SELECT slug, title FROM posts WHERE "publishedAt" < $1 ORDER BY "publishedAt" DESC LIMIT 1', [row.publishedAt]);
  const nextPost = await queryOne('SELECT slug, title FROM posts WHERE "publishedAt" > $1 ORDER BY "publishedAt" ASC LIMIT 1', [row.publishedAt]);

  res.json({
    data: {
      id: row.id, slug: row.slug, title: row.title, content: row.content,
      coverImage: row.coverImage,
      category: { id: row.categoryId, name: row.categoryName, slug: row.categorySlug, color: row.categoryColor },
      author: { name: row.authorName || '墨客', avatar: row.authorAvatar || 'https://api.dicebear.com/9.x/avataaars/svg?seed=blogger&backgroundColor=2563eb', bio: row.authorBio || '前端开发者 & 技术写作者。', level: row.authorLevel || 1, points: row.authorPoints || 0, followersCount: row.authorFollowers || 0 },
      column: row.columnId ? { id: row.columnId, name: row.columnName, slug: row.columnSlug } : null,
      tags: tags.map(t => t.tag), publishedAt: row.publishedAt, updatedAt: row.updatedAt, views: row.views + 1, commentCount: parseInt(commentCountResult.count) || 0,
      prevPost: prevPost || null, nextPost: nextPost || null,
    }
  });
});

router.get('/:slug/comments', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 10));
  const offset = (page - 1) * pageSize;

  const post = await queryOne('SELECT id FROM posts WHERE slug = $1', [req.params.slug]);
  if (!post) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: '文章不存在' } });
  }

  const totalRow = await queryOne('SELECT COUNT(*) as total FROM comments WHERE "postId" = $1', [post.id]);
  const total = totalRow.total;
  const totalPages = Math.ceil(total / pageSize);

  const comments = await queryAll(
    'SELECT id, "parentId", "authorId", author, avatar, content, likes, "createdAt" FROM comments WHERE "postId" = $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3',
    [post.id, pageSize, offset]
  );

  const data = [];
  for (const comment of comments) {
    const replyCount = await queryOne('SELECT COUNT(*) as count FROM comments WHERE "parentId" = $1', [comment.id]);
    data.push({
      ...comment,
      replyCount: parseInt(replyCount.count) || 0,
    });
  }

  res.json({ data, pagination: { page, pageSize, total, totalPages } });
});

router.post('/:slug/comments', authMiddleware, async (req, res) => {
  const { content, parentId } = req.body;
  if (!content || content.trim().length < 2 || content.trim().length > 500) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '评论内容为 2-500 字' } });
  }

  const post = await queryOne('SELECT id FROM posts WHERE slug = $1', [req.params.slug]);
  if (!post) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: '文章不存在' } });
  }

  const id = await insertSql(
    'INSERT INTO comments ("postId", "parentId", "authorId", author, avatar, content) VALUES ($1, $2, $3, $4, $5, $6)',
    [post.id, parentId || null, req.user.id, req.user.name, req.user.avatar, content.trim()]
  );

  await runSql('UPDATE posts SET "lastCommentAt" = NOW() WHERE id = $1', [post.id]);
  await updateHotScore(post.id);

  res.status(201).json({
    data: { id, parentId: parentId || null, authorId: req.user.id, author: req.user.name, avatar: req.user.avatar, content: content.trim(), likes: 0, createdAt: new Date().toISOString() }
  });
});

router.post('/:slug/like', authMiddleware, async (req, res) => {
  try {
    const post = await queryOne('SELECT id FROM posts WHERE slug = $1', [req.params.slug]);
    if (!post) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: '文章不存在' } });
    }
    const existing = await queryOne('SELECT id FROM post_likes WHERE "postId" = $1 AND "userId" = $2', [post.id, req.user.id]);
    if (existing) {
      await runSql('DELETE FROM post_likes WHERE id = $1', [existing.id]);
      await runSql('UPDATE posts SET "likeCount" = "likeCount" - 1 WHERE id = $1', [post.id]);
      const countRow = await queryOne('SELECT "likeCount" FROM posts WHERE id = $1', [post.id]);
      res.json({ data: { liked: false, count: countRow.likeCount || 0 } });
    } else {
      await insertSql('INSERT INTO post_likes ("postId", "userId") VALUES ($1, $2)', [post.id, req.user.id]);
      await runSql('UPDATE posts SET "likeCount" = "likeCount" + 1 WHERE id = $1', [post.id]);
      await addPoints(req.user.id, 'like', 1, '点赞文章');
      const countRow = await queryOne('SELECT "likeCount" FROM posts WHERE id = $1', [post.id]);
      await updateHotScore(post.id);
      res.json({ data: { liked: true, count: countRow.likeCount || 0 } });
    }
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '操作失败，请稍后重试' } });
  }
});

router.get('/:slug/like-status', authMiddleware, async (req, res) => {
  try {
    const post = await queryOne('SELECT id, "likeCount" FROM posts WHERE slug = $1', [req.params.slug]);
    if (!post) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: '文章不存在' } });
    }
    const existing = await queryOne('SELECT id FROM post_likes WHERE "postId" = $1 AND "userId" = $2', [post.id, req.user.id]);
    res.json({ data: { liked: !!existing, count: post.likeCount || 0 } });
  } catch (err) {
    console.error('Like status error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '获取失败，请稍后重试' } });
  }
});

router.post('/:slug/favorite', authMiddleware, async (req, res) => {
  try {
    const { folderId } = req.body;
    const post = await queryOne('SELECT id FROM posts WHERE slug = $1', [req.params.slug]);
    if (!post) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: '文章不存在' } });
    }
    const existing = await queryOne('SELECT id FROM post_favorites WHERE "postId" = $1 AND "userId" = $2', [post.id, req.user.id]);
    if (existing) {
      await runSql('DELETE FROM post_favorites WHERE id = $1', [existing.id]);
      await runSql('UPDATE posts SET "favoriteCount" = "favoriteCount" - 1 WHERE id = $1', [post.id]);
      const countRow = await queryOne('SELECT "favoriteCount" FROM posts WHERE id = $1', [post.id]);
      res.json({ data: { favorited: false, count: countRow.favoriteCount || 0 } });
    } else {
      await insertSql('INSERT INTO post_favorites ("postId", "userId", "folderId") VALUES ($1, $2, $3)', [post.id, req.user.id, folderId || null]);
      await runSql('UPDATE posts SET "favoriteCount" = "favoriteCount" + 1 WHERE id = $1', [post.id]);
      await addPoints(req.user.id, 'favorite', 2, '收藏文章');
      const countRow = await queryOne('SELECT "favoriteCount" FROM posts WHERE id = $1', [post.id]);
      res.json({ data: { favorited: true, count: countRow.favoriteCount || 0 } });
    }
  } catch (err) {
    console.error('Favorite error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '操作失败，请稍后重试' } });
  }
});

router.get('/:slug/favorite-status', authMiddleware, async (req, res) => {
  try {
    const post = await queryOne('SELECT id, "favoriteCount" FROM posts WHERE slug = $1', [req.params.slug]);
    if (!post) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: '文章不存在' } });
    }
    const existing = await queryOne('SELECT id, "folderId" FROM post_favorites WHERE "postId" = $1 AND "userId" = $2', [post.id, req.user.id]);
    res.json({ data: { favorited: !!existing, count: post.favoriteCount || 0, folderId: existing?.folderId || null } });
  } catch (err) {
    console.error('Favorite status error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '获取失败，请稍后重试' } });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, summary, content, coverImage, categoryId, tags, status, columnId } = req.body;

    const postStatus = status && status === 'draft' ? 'draft' : 'published';

    if (postStatus === 'published') {
      if (!title || !summary || !content || !coverImage || !categoryId) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '请填写所有必填字段' } });
      }
    } else {
      if (!title) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '标题不能为空' } });
      }
    }

    if (title.length > 200) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '标题不能超过 200 字' } });
    }
    if (summary && summary.length > 500) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '摘要不能超过 500 字' } });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    if (categoryId) {
      const category = await queryOne('SELECT id FROM categories WHERE id = $1', [categoryId]);
      if (!category) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '分类不存在' } });
      }
    }

    const id = await insertSql(
      'INSERT INTO posts (slug, title, summary, content, "coverImage", "categoryId", "authorId", "columnId", status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [slug, title, summary || '', content || '', coverImage || '', categoryId || null, req.user.id, columnId || null, postStatus]
    );

    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        if (tag && tag.trim()) {
          await insertSql('INSERT INTO post_tags ("postId", tag) VALUES ($1, $2)', [id, tag.trim()]);
        }
      }
    }

    if (postStatus === 'published') {
      await addPoints(req.user.id, 'publish', 10, '发布文章');
      await updateHotScore(id);
      await runSql('UPDATE categories SET "postCount" = "postCount" + 1 WHERE id = $1', [categoryId]);
    }

    res.status(201).json({
      data: {
        id, slug, title, summary, content, coverImage, categoryId, columnId,
        authorId: req.user.id, status: postStatus,
        publishedAt: new Date().toISOString(),
        tags: tags || [],
      }
    });
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '发布失败，请稍后重试' } });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, summary, content, coverImage, categoryId, tags, status, columnId } = req.body;

    const post = await queryOne('SELECT * FROM posts WHERE id = $1', [req.params.id]);
    if (!post) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: '文章不存在' } });
    }

    if (post.authorId !== req.user.id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: '无权修改此文章' } });
    }

    const postStatus = status && status === 'draft' ? 'draft' : 'published';

    if (postStatus === 'published') {
      if (!title || !summary || !content || !coverImage || !categoryId) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '请填写所有必填字段' } });
      }
    } else {
      if (!title) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '标题不能为空' } });
      }
    }

    if (title.length > 200) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '标题不能超过 200 字' } });
    }
    if (summary && summary.length > 500) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '摘要不能超过 500 字' } });
    }

    if (categoryId) {
      const category = await queryOne('SELECT id FROM categories WHERE id = $1', [categoryId]);
      if (!category) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '分类不存在' } });
      }
    }

    let slug = post.slug;
    if (title !== post.title) {
      slug = title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
    }

    await runSql(
      'UPDATE posts SET slug = $1, title = $2, summary = $3, content = $4, "coverImage" = $5, "categoryId" = $6, "columnId" = $7, status = $8, "updatedAt" = NOW() WHERE id = $9',
      [slug, title, summary || '', content || '', coverImage || '', categoryId || null, columnId || null, postStatus, req.params.id]
    );

    await runSql('DELETE FROM post_tags WHERE "postId" = $1', [req.params.id]);
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        if (tag && tag.trim()) {
          await insertSql('INSERT INTO post_tags ("postId", tag) VALUES ($1, $2)', [req.params.id, tag.trim()]);
        }
      }
    }

    res.json({
      data: {
        id: post.id, slug, title, summary, content, coverImage, categoryId, columnId,
        authorId: post.authorId, status: postStatus,
        updatedAt: new Date().toISOString(),
        tags: tags || [],
      }
    });
  } catch (err) {
    console.error('Update post error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '更新失败，请稍后重试' } });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await queryOne('SELECT * FROM posts WHERE id = $1', [req.params.id]);
    if (!post) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: '文章不存在' } });
    }

    if (post.authorId !== req.user.id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: '无权删除此文章' } });
    }

    await runSql('DELETE FROM posts WHERE id = $1', [req.params.id]);
    await runSql('UPDATE categories SET "postCount" = "postCount" - 1 WHERE id = $1', [post.categoryId]);
    res.json({ data: { id: parseInt(req.params.id), message: '删除成功' } });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '删除失败，请稍后重试' } });
  }
});

router.post('/:id/publish', authMiddleware, async (req, res) => {
  try {
    const post = await queryOne('SELECT * FROM posts WHERE id = $1', [req.params.id]);
    if (!post) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: '文章不存在' } });
    }

    if (post.authorId !== req.user.id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: '无权操作此文章' } });
    }

    if (post.status === 'published') {
      return res.status(400).json({ error: { code: 'ALREADY_PUBLISHED', message: '文章已发布' } });
    }

    if (!post.summary || !post.content || !post.coverImage || !post.categoryId) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '请填写所有必填字段后再发布' } });
    }

    await runSql('UPDATE posts SET status = $1, "publishedAt" = NOW(), "updatedAt" = NOW() WHERE id = $2', ['published', req.params.id]);
    await addPoints(req.user.id, 'publish', 10, '发布文章');
    await updateHotScore(req.params.id);
    await runSql('UPDATE categories SET "postCount" = "postCount" + 1 WHERE id = $1', [post.categoryId]);

    res.json({ data: { id: parseInt(req.params.id), status: 'published', message: '文章发布成功' } });
  } catch (err) {
    console.error('Publish post error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '发布失败，请稍后重试' } });
  }
});

async function updateHotScore(postId) {
  const post = await queryOne('SELECT views, "likeCount", "favoriteCount", "publishedAt" FROM posts WHERE id = $1', [postId]);
  if (!post) return;

  const now = new Date();
  const publishedAt = new Date(post.publishedAt);
  const hoursSincePublished = (now - publishedAt) / (1000 * 60 * 60);
  
  const decay = Math.pow(0.95, hoursSincePublished / 24);
  const hotScore = Math.round((post.views * 1 + (post.likeCount || 0) * 5 + (post.favoriteCount || 0) * 10) * decay);
  
  await runSql('UPDATE posts SET hotScore = $1 WHERE id = $2', [hotScore, postId]);
}

async function addPoints(userId, type, points, description) {
  await insertSql('INSERT INTO user_points ("userId", type, points, description) VALUES ($1, $2, $3, $4)', [userId, type, points, description]);
  
  const totalRow = await queryOne('SELECT COALESCE(SUM(points), 0) as total FROM user_points WHERE "userId" = $1', [userId]);
  const totalPoints = totalRow.total || 0;
  const level = Math.floor(totalPoints / 100) + 1;
  
  await runSql('UPDATE users SET points = $1, level = $2 WHERE id = $3', [totalPoints, level, userId]);
}

export default router;