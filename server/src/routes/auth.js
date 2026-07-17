import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { queryOne, insertSql, runSql } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { JWT_SECRET } from '../config.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '请填写所有必填字段' } });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '密码至少 6 位' } });
    }

    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) {
      return res.status(400).json({ error: { code: 'EMAIL_EXISTS', message: '该邮箱已注册' } });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatar = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
    const id = await insertSql(
      'INSERT INTO users (name, email, password, avatar) VALUES ($1, $2, $3, $4)',
      [name, email, hashedPassword, avatar]
    );

    const token = jwt.sign({ id, name, email, avatar, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ data: { token, user: { id, name, email, avatar, role: 'user' } } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '注册失败，请稍后重试' } });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '请填写邮箱和密码' } });
    }

    const user = await queryOne('SELECT * FROM users WHERE email = $1', [email]);
    if (!user) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: '邮箱或密码错误' } });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: '邮箱或密码错误' } });
    }

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, avatar: user.avatar, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ data: { token, user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, role: user.role } } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '登录失败，请稍后重试' } });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  const user = await queryOne('SELECT id, name, email, avatar, bio, role, level, points, "followersCount", "followingCount", title, company, location, website FROM users WHERE id = $1', [req.user.id]);
  if (!user) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: '用户不存在' } });
  }
  res.json({ data: user });
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, bio, avatar, title, company, location, website } = req.body;
    if (!name || name.length > 50) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '用户名不能为空且不超过 50 字' } });
    }
    if (bio && bio.length > 500) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '简介不能超过 500 字' } });
    }
    await runSql('UPDATE users SET name = $1, bio = $2, avatar = $3, title = $4, company = $5, location = $6, website = $7 WHERE id = $8', 
      [name, bio || '', avatar || req.user.avatar, title || '', company || '', location || '', website || '', req.user.id]);
    const updatedUser = await queryOne('SELECT id, name, email, avatar, bio, role, level, points, "followersCount", "followingCount", title, company, location, website FROM users WHERE id = $1', [req.user.id]);
    res.json({ data: updatedUser });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '更新失败，请稍后重试' } });
  }
});

router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '请填写所有密码字段' } });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '新密码至少 6 位' } });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '两次输入的新密码不一致' } });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '新密码不能与当前密码相同' } });
    }

    const user = await queryOne('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: '用户不存在' } });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(400).json({ error: { code: 'INVALID_PASSWORD', message: '当前密码错误' } });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await runSql('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.user.id]);

    res.json({ data: { message: '密码修改成功' } });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: '密码修改失败，请稍后重试' } });
  }
});

export default router;