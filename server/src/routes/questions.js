import express from 'express';
import { queryOne, queryAll } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// List questions
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 20));
    const offset = (page - 1) * pageSize;
    const status = req.query.status;
    const tag = req.query.tag;

    let where = 'WHERE 1=1';
    const params = [];
    let paramIdx = 1;

    if (status) {
      where += ` AND q.status = $${paramIdx++}`;
      params.push(status);
    }
    if (tag) {
      where += ` AND $${paramIdx++} = ANY(q.tags)`;
      params.push(tag);
    }

    const countRow = await queryOne(`SELECT COUNT(*) as total FROM questions q ${where}`, params);
    const total = parseInt(countRow.total);

    const rows = await queryAll(`
      SELECT q.*, u.name as author, u.avatar as "authorAvatar"
      FROM questions q
      LEFT JOIN users u ON u.id = q."authorId"
      ${where}
      ORDER BY q."updatedAt" DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `, [...params, pageSize, offset]);

    res.json({
      data: rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    console.error('List questions error:', err);
    res.status(500).json({ error: { message: '获取问题列表失败' } });
  }
});

// Get single question
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: { message: '无效的问题ID' } });

    const question = await queryOne(`
      SELECT q.*, u.name as author, u.avatar as "authorAvatar"
      FROM questions q
      LEFT JOIN users u ON u.id = q."authorId"
      WHERE q.id = $1
    `, [id]);

    if (!question) {
      return res.status(404).json({ error: { message: '问题不存在' } });
    }

    // Increment views
    await queryOne('UPDATE questions SET views = views + 1 WHERE id = $1', [id]);

    // Get answers
    const answers = await queryAll(`
      SELECT a.*, u.name as author, u.avatar as "authorAvatar"
      FROM answers a
      LEFT JOIN users u ON u.id = a."authorId"
      WHERE a."questionId" = $1
      ORDER BY a.accepted DESC, a.votes DESC, a."createdAt" ASC
    `, [id]);

    res.json({ data: { ...question, answers: answers || [] } });
  } catch (err) {
    console.error('Get question error:', err);
    res.status(500).json({ error: { message: '获取问题详情失败' } });
  }
});

// Create question
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: { message: '问题标题不能为空' } });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ error: { message: '问题描述不能为空' } });
    }

    const result = await queryOne(`
      INSERT INTO questions (title, content, "authorId", tags)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [title.trim(), content.trim(), req.user.id, tags || null]);

    res.status(201).json({ data: result });
  } catch (err) {
    console.error('Create question error:', err);
    res.status(500).json({ error: { message: '创建问题失败' } });
  }
});

// Update question
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const question = await queryOne('SELECT * FROM questions WHERE id = $1', [id]);
    if (!question) return res.status(404).json({ error: { message: '问题不存在' } });
    if (question.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: '无权修改此问题' } });
    }

    const { title, content, tags } = req.body;
    await queryOne(`
      UPDATE questions SET title = $1, content = $2, tags = $3, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [title || question.title, content || question.content, tags || question.tags, id]);

    res.json({ success: true });
  } catch (err) {
    console.error('Update question error:', err);
    res.status(500).json({ error: { message: '更新问题失败' } });
  }
});

// Delete question
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const question = await queryOne('SELECT * FROM questions WHERE id = $1', [id]);
    if (!question) return res.status(404).json({ error: { message: '问题不存在' } });
    if (question.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: '无权删除此问题' } });
    }

    await queryOne('DELETE FROM questions WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete question error:', err);
    res.status(500).json({ error: { message: '删除问题失败' } });
  }
});

// Answer a question
router.post('/:id/answers', authMiddleware, async (req, res) => {
  try {
    const questionId = parseInt(req.params.id);
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: { message: '回答内容不能为空' } });
    }

    const question = await queryOne('SELECT id FROM questions WHERE id = $1', [questionId]);
    if (!question) return res.status(404).json({ error: { message: '问题不存在' } });

    const result = await queryOne(`
      INSERT INTO answers ("questionId", "authorId", content)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [questionId, req.user.id, content.trim()]);

    await queryOne('UPDATE questions SET answers = answers + 1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $1', [questionId]);

    res.status(201).json({ data: result });
  } catch (err) {
    console.error('Create answer error:', err);
    res.status(500).json({ error: { message: '提交回答失败' } });
  }
});

export default router;
