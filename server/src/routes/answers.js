import express from 'express';
import { queryOne } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Like/unlike an answer
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const answer = await queryOne('SELECT * FROM answers WHERE id = $1', [id]);
    if (!answer) return res.status(404).json({ error: { message: '回答不存在' } });

    const existing = await queryOne(
      'SELECT id FROM answer_votes WHERE "answerId" = $1 AND "userId" = $2 AND "voteType" = $3',
      [id, req.user.id, 'like']
    );

    if (existing) {
      await queryOne('DELETE FROM answer_votes WHERE id = $1', [existing.id]);
      await queryOne('UPDATE answers SET votes = GREATEST(0, votes - 1) WHERE id = $1', [id]);
      res.json({ data: { liked: false } });
    } else {
      await queryOne(
        'INSERT INTO answer_votes ("answerId", "userId", "voteType") VALUES ($1, $2, $3)',
        [id, req.user.id, 'like']
      );
      await queryOne('UPDATE answers SET votes = votes + 1 WHERE id = $1', [id]);
      res.json({ data: { liked: true } });
    }
  } catch (err) {
    console.error('Like answer error:', err);
    res.status(500).json({ error: { message: '操作失败' } });
  }
});

// Accept an answer
router.post('/:id/accept', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const answer = await queryOne(
      'SELECT a.*, q."authorId" as "questionAuthorId" FROM answers a JOIN questions q ON q.id = a."questionId" WHERE a.id = $1',
      [id]
    );
    if (!answer) return res.status(404).json({ error: { message: '回答不存在' } });

    // Only the question author or admin can accept an answer
    if (answer.questionAuthorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: '无权采纳此回答' } });
    }

    // Unaccept previous accepted answer
    await queryOne(
      'UPDATE answers SET accepted = FALSE WHERE "questionId" = $1 AND accepted = TRUE',
      [answer.questionId]
    );

    // Accept this answer
    await queryOne('UPDATE answers SET accepted = TRUE WHERE id = $1', [id]);
    await queryOne('UPDATE questions SET "acceptedAnswerId" = $1, status = $2 WHERE id = $3',
      [id, 'answered', answer.questionId]);

    res.json({ success: true });
  } catch (err) {
    console.error('Accept answer error:', err);
    res.status(500).json({ error: { message: '采纳回答失败' } });
  }
});

export default router;
