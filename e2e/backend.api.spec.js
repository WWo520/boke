import { test, expect } from '@playwright/test';

/**
 * 后端 API 全面测试
 * 覆盖：认证、文章 CRUD、关注（含自关注/关注状态回归）、点赞收藏、评论、
 *      排行榜（isFollowed/isSelf 回归）、搜索、鉴权与输入校验。
 * 前置：后端运行在 http://localhost:3333，数据库已 seed（admin@moke.com/password123）。
 */

const ADMIN = { email: 'admin@moke.com', password: 'password123' };

// 生成唯一用户，避免污染 & 重复注册
function uniqueUser() {
  const rand = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return { name: `tester_${rand}`, email: `tester_${rand}@test.com`, password: 'password123' };
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

test.describe('1. 健康检查与公开接口', () => {
  test('1.1 文章列表返回分页结构', async ({ request }) => {
    const res = await request.get('/api/posts?page=1&pageSize=5');
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(Array.isArray(json.data)).toBeTruthy();
    expect(json.pagination).toMatchObject({ page: 1, pageSize: 5 });
    // 注：部分接口 total 以字符串形式返回（pg COUNT 为 bigint），此处兼容
    expect(Number.isFinite(Number(json.pagination.total))).toBeTruthy();
  });

  test('1.2 分类列表', async ({ request }) => {
    const res = await request.get('/api/categories');
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(Array.isArray(json.data)).toBeTruthy();
    expect(json.data.length).toBeGreaterThan(0);
  });

  test('1.3 标签列表', async ({ request }) => {
    const res = await request.get('/api/tags');
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(Array.isArray(json.data)).toBeTruthy();
  });

  test('1.4 热门文章', async ({ request }) => {
    const res = await request.get('/api/posts/popular?limit=5');
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(Array.isArray(json.data)).toBeTruthy();
    expect(json.data.length).toBeLessThanOrEqual(5);
  });
});

test.describe('2. 认证', () => {
  test('2.1 注册新用户返回 token', async ({ request }) => {
    const u = uniqueUser();
    const res = await request.post('/api/auth/register', { data: u });
    expect(res.status()).toBe(201);
    const json = await res.json();
    expect(json.data.token).toBeTruthy();
    expect(json.data.user).toMatchObject({ name: u.name, email: u.email, role: 'user' });
  });

  test('2.2 管理员登录成功', async ({ request }) => {
    const res = await request.post('/api/auth/login', { data: ADMIN });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data.token).toBeTruthy();
    expect(json.data.user.role).toBe('admin');
  });

  test('2.3 错误密码返回 401', async ({ request }) => {
    const res = await request.post('/api/auth/login', { data: { email: ADMIN.email, password: 'wrong-password' } });
    expect(res.status()).toBe(401);
    const json = await res.json();
    expect(json.error.code).toBe('INVALID_CREDENTIALS');
  });

  test('2.4 缺少字段返回 400', async ({ request }) => {
    const res = await request.post('/api/auth/login', { data: { email: ADMIN.email } });
    expect(res.status()).toBe(400);
  });

  test('2.5 /me 需要登录', async ({ request }) => {
    const res = await request.get('/api/auth/me');
    expect(res.status()).toBe(401);
  });

  test('2.6 携带 token 可访问 /me', async ({ request }) => {
    const login = await request.post('/api/auth/login', { data: ADMIN });
    const { token } = (await login.json()).data;
    const res = await request.get('/api/auth/me', { headers: authHeader(token) });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data.email).toBe(ADMIN.email);
  });

  test('2.7 无效 token 返回 401', async ({ request }) => {
    const res = await request.get('/api/auth/me', { headers: authHeader('invalid.token.here') });
    expect(res.status()).toBe(401);
  });
});

test.describe.serial('3. 文章 CRUD（草稿→更新→发布→删除）', () => {
  let token;
  let postId;
  let categoryId;

  test.beforeAll(async ({ request }) => {
    const u = uniqueUser();
    const reg = await request.post('/api/auth/register', { data: u });
    token = (await reg.json()).data.token;
    const cats = await (await request.get('/api/categories')).json();
    categoryId = cats.data[0].id;
  });

  test('3.1 未登录不能创建文章', async ({ request }) => {
    const res = await request.post('/api/posts', { data: { title: 'x' } });
    expect(res.status()).toBe(401);
  });

  test('3.2 创建草稿', async ({ request }) => {
    // 注：带 categoryId 创建。已知问题：GET /api/posts/id/:id 对 categories 使用 INNER JOIN，
    // 无分类的草稿重新打开会 404（见审查报告）。此处按可用路径创建。
    const res = await request.post('/api/posts', {
      headers: authHeader(token),
      data: { title: 'API 测试草稿', status: 'draft', categoryId },
    });
    expect(res.status()).toBe(201);
    const json = await res.json();
    postId = json.data.id;
    expect(json.data.status).toBe('draft');
  });

  test('3.3 作者可通过 id 获取自己的文章', async ({ request }) => {
    const res = await request.get(`/api/posts/id/${postId}`, { headers: authHeader(token) });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data.id).toBe(postId);
  });

  test('3.4 更新文章为完整内容并发布', async ({ request }) => {
    const res = await request.put(`/api/posts/${postId}`, {
      headers: authHeader(token),
      data: {
        title: 'API 测试文章（已更新）',
        summary: '这是摘要',
        content: '# 正文\n\n**加粗** 内容。',
        coverImage: '/uploads/placeholder.png',
        categoryId,
        tags: ['测试', 'api'],
        status: 'published',
      },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data.status).toBe('published');
    expect(json.data.tags).toContain('测试');
  });

  test('3.5 发布后可通过 slug 公开访问', async ({ request }) => {
    const byId = await (await request.get(`/api/posts/id/${postId}`, { headers: authHeader(token) })).json();
    const slug = byId.data.slug;
    const res = await request.get(`/api/posts/${slug}`);
    expect(res.ok()).toBeTruthy();
  });

  test('3.6 标题超长返回 400', async ({ request }) => {
    const res = await request.post('/api/posts', {
      headers: authHeader(token),
      data: { title: 'a'.repeat(201), status: 'draft' },
    });
    expect(res.status()).toBe(400);
  });

  test('3.7 删除文章', async ({ request }) => {
    const res = await request.delete(`/api/posts/${postId}`, { headers: authHeader(token) });
    expect(res.ok()).toBeTruthy();
    // 删除后再取应 404
    const check = await request.get(`/api/posts/id/${postId}`, { headers: authHeader(token) });
    expect(check.status()).toBe(404);
  });
});

test.describe('4. 关注功能（关键回归）', () => {
  let token, myId;

  test.beforeAll(async ({ request }) => {
    const login = await request.post('/api/auth/login', { data: ADMIN });
    const data = (await login.json()).data;
    token = data.token;
    myId = data.user.id;
  });

  test('4.1 不能关注自己，返回 400 且信息明确', async ({ request }) => {
    const res = await request.post(`/api/follow/${myId}`, { headers: authHeader(token) });
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.error.message).toContain('不能关注自己');
  });

  test('4.2 关注他人后，作者榜 isFollowed=true 且刷新保持', async ({ request }) => {
    // 找一个非自己的作者
    const authors = (await (await request.get('/api/ranking/authors?limit=20')).json()).data;
    const other = authors.find((a) => a.id !== myId);
    test.skip(!other, '数据库中没有其他用户，跳过');

    // 确保初始为未关注（若已关注先取消）
    let statusRes = await (await request.get(`/api/follow/${other.id}`, { headers: authHeader(token) })).json();
    if (statusRes.data.following) {
      await request.post(`/api/follow/${other.id}`, { headers: authHeader(token) });
    }

    // 关注
    const follow = await request.post(`/api/follow/${other.id}`, { headers: authHeader(token) });
    expect(follow.ok()).toBeTruthy();
    expect((await follow.json()).data.following).toBe(true);

    // 关键：带 token 再查作者榜，isFollowed 应为 true（回归：刷新后不丢失）
    const authors2 = (await (await request.get('/api/ranking/authors?limit=20', { headers: authHeader(token) })).json()).data;
    const target = authors2.find((a) => a.id === other.id);
    expect(target.isFollowed).toBe(true);

    // 自己那条 isSelf=true
    const me = authors2.find((a) => a.id === myId);
    if (me) expect(me.isSelf).toBe(true);
  });

  test('4.3 未登录访问作者榜 isFollowed/isSelf 均为 false', async ({ request }) => {
    const authors = (await (await request.get('/api/ranking/authors?limit=5')).json()).data;
    for (const a of authors) {
      expect(a.isFollowed).toBeFalsy();
      expect(a.isSelf).toBeFalsy();
    }
  });
});

test.describe('5. 点赞、收藏、评论', () => {
  let token, slug;

  test.beforeAll(async ({ request }) => {
    const u = uniqueUser();
    token = (await (await request.post('/api/auth/register', { data: u })).json()).data.token;
    // 创建一篇独立的已发布文章，避免依赖易变的 posts[0]（可能被其他用例删除）
    const cats = (await (await request.get('/api/categories')).json()).data;
    const create = await request.post('/api/posts', {
      headers: authHeader(token),
      data: {
        title: `互动测试文章 ${Date.now()}`,
        summary: '用于点赞/收藏/评论测试',
        content: '正文内容',
        coverImage: '/uploads/placeholder.png',
        categoryId: cats[0].id,
        status: 'published',
      },
    });
    slug = (await create.json()).data.slug;
  });

  test('5.1 点赞切换', async ({ request }) => {
    test.skip(!slug, '无已发布文章');
    const first = await (await request.post(`/api/posts/${slug}/like`, { headers: authHeader(token) })).json();
    expect(typeof first.data.liked).toBe('boolean');
    const second = await (await request.post(`/api/posts/${slug}/like`, { headers: authHeader(token) })).json();
    expect(second.data.liked).toBe(!first.data.liked);
  });

  test('5.2 收藏切换', async ({ request }) => {
    test.skip(!slug, '无已发布文章');
    const res = await request.post(`/api/posts/${slug}/favorite`, { headers: authHeader(token) });
    expect(res.ok()).toBeTruthy();
    expect(typeof (await res.json()).data.favorited).toBe('boolean');
  });

  test('5.3 发表评论', async ({ request }) => {
    test.skip(!slug, '无已发布文章');
    const res = await request.post(`/api/posts/${slug}/comments`, {
      headers: authHeader(token),
      data: { content: '这是一条自动化测试评论' },
    });
    expect(res.status()).toBe(201);
  });

  test('5.4 评论过短返回 400', async ({ request }) => {
    test.skip(!slug, '无已发布文章');
    const res = await request.post(`/api/posts/${slug}/comments`, {
      headers: authHeader(token),
      data: { content: 'a' },
    });
    expect(res.status()).toBe(400);
  });
});

test.describe('6. 排行榜与搜索', () => {
  test('6.1 热榜', async ({ request }) => {
    const res = await request.get('/api/ranking/posts?period=week&limit=10');
    expect(res.ok()).toBeTruthy();
    expect(Array.isArray((await res.json()).data)).toBeTruthy();
  });

  test('6.2 阅读榜/评论榜/标签榜', async ({ request }) => {
    for (const path of ['/api/ranking/views', '/api/ranking/comments', '/api/ranking/tags']) {
      const res = await request.get(path);
      expect(res.ok(), `${path} 应 200`).toBeTruthy();
    }
  });

  test('6.3 搜索命中', async ({ request }) => {
    const res = await request.get('/api/search?q=技术');
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data).toHaveProperty('posts');
  });

  test('6.4 搜索关键词过短返回 400', async ({ request }) => {
    const res = await request.get('/api/search?q=a');
    expect(res.status()).toBe(400);
  });
});

test.describe('7. 鉴权边界', () => {
  test('7.1 管理员统计需要 admin 权限（未登录 401）', async ({ request }) => {
    const res = await request.get('/api/admin/stats');
    expect(res.status()).toBe(401);
  });

  test('7.2 普通用户访问管理员接口返回 403', async ({ request }) => {
    const u = uniqueUser();
    const token = (await (await request.post('/api/auth/register', { data: u })).json()).data.token;
    const res = await request.get('/api/admin/stats', { headers: authHeader(token) });
    expect(res.status()).toBe(403);
  });

  test('7.3 管理员可获取统计', async ({ request }) => {
    const token = (await (await request.post('/api/auth/login', { data: ADMIN })).json()).data.token;
    const res = await request.get('/api/admin/stats', { headers: authHeader(token) });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data).toHaveProperty('posts');
    expect(json.data).toHaveProperty('users');
  });
});

test.describe('8. 回归：无分类草稿可按 id 重新打开（P0-3）', () => {
  test('8.1 创建无分类草稿后按 id 获取应 200（而非 404）', async ({ request }) => {
    const u = uniqueUser();
    const token = (await (await request.post('/api/auth/register', { data: u })).json()).data.token;
    // 仅标题、无 categoryId 的草稿（修复前会因 INNER JOIN 导致 404）
    const create = await request.post('/api/posts', {
      headers: authHeader(token),
      data: { title: '无分类草稿回归', status: 'draft' },
    });
    expect(create.status()).toBe(201);
    const id = (await create.json()).data.id;

    const get = await request.get(`/api/posts/id/${id}`, { headers: authHeader(token) });
    expect(get.status()).toBe(200);
    const json = await get.json();
    expect(json.data.id).toBe(id);
    expect(json.data.status).toBe('draft');
  });
});

test.describe('9. 健康检查与基础设施（P1）', () => {
  test('9.1 /healthz 返回 ok', async ({ request }) => {
    const res = await request.get('/healthz');
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).status).toBe('ok');
  });

  test('9.2 /readyz 数据库就绪', async ({ request }) => {
    const res = await request.get('/readyz');
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).status).toBe('ready');
  });

  test('9.3 响应携带 X-Request-Id 头', async ({ request }) => {
    const res = await request.get('/api/posts?pageSize=1');
    expect(res.headers()['x-request-id']).toBeTruthy();
  });
});
