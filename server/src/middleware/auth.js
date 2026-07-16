import jwt from 'jsonwebtoken';
import { queryOne } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'moke-blog-secret-key-2024';

export async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: '请先登录' } });
  }
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
    const user = await queryOne('SELECT id, name, email, avatar, bio, role, level, points, "followersCount", "followingCount" FROM users WHERE id = $1', [decoded.id]);
    if (!user) {
      return res.status(401).json({ error: { code: 'USER_NOT_FOUND', message: '用户不存在，请重新登录' } });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: { code: 'TOKEN_INVALID', message: 'Token 已失效，请重新登录' } });
  }
}

export function adminMiddleware(req, res, next) {
  const user = req.user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: '管理员权限不足' } });
  }
  next();
}