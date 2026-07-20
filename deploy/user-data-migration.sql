-- Moke Blog: 精确迁移 moke/qw/www 用户及其关联数据
-- 字段按服务器 schema 过滤（去掉服务器不存在的列）
-- 使用 INSERT ... ON CONFLICT (id) DO NOTHING，跳过服务器已有的 seed 数据

BEGIN;

-- ========== users ==========
INSERT INTO users ("id", "name", "email", "password", "avatar", "bio", "role", "followersCount", "followingCount", "level", "points", "title", "company", "location", "website", "createdAt") VALUES (1, 'moke', 'admin@moke.com', '$2a$10$ADGqhQ/6ryIazzr0naH9bOzyo7h83d8o7N8QvIwrfxRmbYxxKTj4a', 'https://api.dicebear.com/9.x/avataaars/svg?seed=blogger&backgroundColor=2563eb', '', 'admin', 1, 2, 1, 30, '', '', '', '', '2026-07-15T09:38:56.344903'::timestamp) ON CONFLICT (id) DO NOTHING;
INSERT INTO users ("id", "name", "email", "password", "avatar", "bio", "role", "followersCount", "followingCount", "level", "points", "title", "company", "location", "website", "createdAt") VALUES (2, 'qw', 'yz9951@126.com', '$2a$10$hFZdr0/v9CD/QSnCCMgf1OiTEanzoZJ4/A/LOFwfJFommEpPfJW6y', 'https://api.dicebear.com/9.x/avataaars/svg?seed=qw', '', 'user', 2, 1, 1, 72, '', '', '', '', '2026-07-15T09:54:55.233375'::timestamp) ON CONFLICT (id) DO NOTHING;
INSERT INTO users ("id", "name", "email", "password", "avatar", "bio", "role", "followersCount", "followingCount", "level", "points", "title", "company", "location", "website", "createdAt") VALUES (3, 'www', 'yz0951@126.com', '$2a$10$5ZofUyP5Z.DkVKe/q9t6m.FAYj0FG8i8JEiAl5mCFYPujN2VIY8Qy', 'https://api.dicebear.com/9.x/avataaars/svg?seed=www', '', 'user', 1, 1, 1, 20, '', '', '', '', '2026-07-16T06:26:30.966901'::timestamp) ON CONFLICT (id) DO NOTHING;

-- ========== posts ==========
INSERT INTO posts ("id", "slug", "title", "summary", "content", "coverImage", "categoryId", "authorId", "columnId", "status", "reviewStatus", "views", "hotscore", "lastCommentAt", "likeCount", "favoriteCount", "publishedAt", "updatedAt", "hotScore") VALUES (21, '12-mrlw2wz3', '12', '21', '21', '/uploads/mrlw2ubf-ga90fa.png', 2, 1, NULL, 'published', 'approved', 11, 13, NULL, 1, 1, '2026-07-15T09:40:06.642048'::timestamp, '2026-07-15T09:40:06.642048'::timestamp, 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO posts ("id", "slug", "title", "summary", "content", "coverImage", "categoryId", "authorId", "columnId", "status", "reviewStatus", "views", "hotscore", "lastCommentAt", "likeCount", "favoriteCount", "publishedAt", "updatedAt", "hotScore") VALUES (22, '21-mrlwkcya', '21', '21', '21', '/uploads/mrlwk6b8-wbopsf.png', 1, 1, NULL, 'published', 'approved', 8, 0, NULL, 0, 0, '2026-07-16T01:16:13.667278'::timestamp, '2026-07-16T01:16:13.667278'::timestamp, 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO posts ("id", "slug", "title", "summary", "content", "coverImage", "categoryId", "authorId", "columnId", "status", "reviewStatus", "views", "hotscore", "lastCommentAt", "likeCount", "favoriteCount", "publishedAt", "updatedAt", "hotScore") VALUES (23, '21-mrlwn4gu', '21', '21', '21', '/uploads/mrlwn2e1-2n51d6.png', 1, 2, NULL, 'published', 'approved', 14, 13, NULL, 1, 1, '2026-07-15T09:55:49.475940'::timestamp, '2026-07-15T09:55:49.475940'::timestamp, 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO posts ("id", "slug", "title", "summary", "content", "coverImage", "categoryId", "authorId", "columnId", "status", "reviewStatus", "views", "hotscore", "lastCommentAt", "likeCount", "favoriteCount", "publishedAt", "updatedAt", "hotScore") VALUES (24, 'ww-mrlxe8c9', 'ww', 'ww', 'wq', '/uploads/mrlxe4z3-tesb5s.png', 1, 2, NULL, 'draft', 'approved', 0, 0, NULL, 0, 0, '2026-07-15T10:16:54.201829'::timestamp, '2026-07-15T10:16:54.201829'::timestamp, 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO posts ("id", "slug", "title", "summary", "content", "coverImage", "categoryId", "authorId", "columnId", "status", "reviewStatus", "views", "hotscore", "lastCommentAt", "likeCount", "favoriteCount", "publishedAt", "updatedAt", "hotScore") VALUES (25, 'qq-mrlxuwt7', 'qq', 'qq', '# qq# 
## qqq', '/uploads/mrlxut77-m6e8ao.png', 1, 2, NULL, 'published', 'approved', 0, 0, NULL, 0, 0, '2026-07-15T10:29:52.411720'::timestamp, '2026-07-15T10:29:52.411720'::timestamp, 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO posts ("id", "slug", "title", "summary", "content", "coverImage", "categoryId", "authorId", "columnId", "status", "reviewStatus", "views", "hotscore", "lastCommentAt", "likeCount", "favoriteCount", "publishedAt", "updatedAt", "hotScore") VALUES (26, 'qq-mrlxvgzo', 'qq', 'qq', 'qqq', '/uploads/mrlxvf9o-8d31d5.png', 1, 2, NULL, 'published', 'approved', 2, 16, '2026-07-16T01:11:51.298041'::timestamp, 1, 1, '2026-07-15T10:30:18.567859'::timestamp, '2026-07-15T10:30:18.567859'::timestamp, 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO posts ("id", "slug", "title", "summary", "content", "coverImage", "categoryId", "authorId", "columnId", "status", "reviewStatus", "views", "hotscore", "lastCommentAt", "likeCount", "favoriteCount", "publishedAt", "updatedAt", "hotScore") VALUES (59, '111-mrmtcagj', '111', '', '# 111
## 111', '', NULL, 2, NULL, 'draft', 'approved', 0, 0, NULL, 0, 0, '2026-07-16T01:11:11.349871'::timestamp, '2026-07-16T01:11:11.349871'::timestamp, 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO posts ("id", "slug", "title", "summary", "content", "coverImage", "categoryId", "authorId", "columnId", "status", "reviewStatus", "views", "hotscore", "lastCommentAt", "likeCount", "favoriteCount", "publishedAt", "updatedAt", "hotScore") VALUES (60, '21-mrmtdmsn', '21', '21', '212', '/uploads/mrmtdjr4-lb38nt.png', 2, 2, NULL, 'draft', 'approved', 0, 0, NULL, 0, 0, '2026-07-16T01:12:13.993936'::timestamp, '2026-07-16T01:12:13.993936'::timestamp, 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO posts ("id", "slug", "title", "summary", "content", "coverImage", "categoryId", "authorId", "columnId", "status", "reviewStatus", "views", "hotscore", "lastCommentAt", "likeCount", "favoriteCount", "publishedAt", "updatedAt", "hotScore") VALUES (61, '212-mrmtek36', '212', '12', '212', '/uploads/mrmtei4m-6d81ez.png', 1, 2, NULL, 'published', 'approved', 0, 0, NULL, 0, 0, '2026-07-16T01:12:57.141461'::timestamp, '2026-07-16T01:12:57.141461'::timestamp, 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO posts ("id", "slug", "title", "summary", "content", "coverImage", "categoryId", "authorId", "columnId", "status", "reviewStatus", "views", "hotscore", "lastCommentAt", "likeCount", "favoriteCount", "publishedAt", "updatedAt", "hotScore") VALUES (62, '2222-mrmwzt1w', '2222', '121212', '21212', '/uploads/mrmwzol2-hgpfiu.png', 1, 2, NULL, 'published', 'approved', 0, 0, NULL, 0, 0, '2026-07-16T02:53:34.144864'::timestamp, '2026-07-16T02:53:34.144864'::timestamp, 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO posts ("id", "slug", "title", "summary", "content", "coverImage", "categoryId", "authorId", "columnId", "status", "reviewStatus", "views", "hotscore", "lastCommentAt", "likeCount", "favoriteCount", "publishedAt", "updatedAt", "hotScore") VALUES (63, '21-mrmx8nzx', '21', '212', '1221', '/uploads/mrmx8kzr-b2rn0p.png', 1, 1, NULL, 'published', 'approved', 0, 0, NULL, 0, 0, '2026-07-16T03:00:32.593535'::timestamp, '2026-07-16T03:00:32.593535'::timestamp, 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO posts ("id", "slug", "title", "summary", "content", "coverImage", "categoryId", "authorId", "columnId", "status", "reviewStatus", "views", "hotscore", "lastCommentAt", "likeCount", "favoriteCount", "publishedAt", "updatedAt", "hotScore") VALUES (64, 'test-mrmxwo3s', 'test', 'test', '# 111
## 222', '/uploads/mrmxw4mq-myblrt.png', 1, 2, NULL, 'published', 'approved', 11, 83, '2026-07-17T06:45:08.266605'::timestamp, 1, 7, '2026-07-16T03:20:40.109094'::timestamp, '2026-07-16T03:20:40.109094'::timestamp, 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO posts ("id", "slug", "title", "summary", "content", "coverImage", "categoryId", "authorId", "columnId", "status", "reviewStatus", "views", "hotscore", "lastCommentAt", "likeCount", "favoriteCount", "publishedAt", "updatedAt", "hotScore") VALUES (94, 'test-mrom0ij4', 'test', '测试', '# 111

## 222', '/uploads/mrom00zr-18a9ak.jpg', 1, 3, NULL, 'published', 'approved', 1, 0, NULL, 0, 0, '2026-07-17T07:21:43.118276'::timestamp, '2026-07-17T07:21:43.118276'::timestamp, 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO posts ("id", "slug", "title", "summary", "content", "coverImage", "categoryId", "authorId", "columnId", "status", "reviewStatus", "views", "hotscore", "lastCommentAt", "likeCount", "favoriteCount", "publishedAt", "updatedAt", "hotScore") VALUES (95, 'hj-mrondgkm', 'hj', 'ww', '# 212121

312313

1焦虑看

2

3', '/uploads/mrondf3a-5q2spx.jpg', 1, 3, NULL, 'published', 'approved', 0, 0, NULL, 0, 0, '2026-07-17T07:59:40.584275'::timestamp, '2026-07-17T07:59:40.584275'::timestamp, 0) ON CONFLICT (id) DO NOTHING;

-- ========== post_tags ==========
-- post_tags: (empty, 0 rows)


-- ========== comments ==========
INSERT INTO comments ("id", "postId", "parentId", "authorId", "author", "avatar", "content", "likes", "createdAt") VALUES (58, 26, NULL, 2, 'qw', 'https://api.dicebear.com/9.x/avataaars/svg?seed=qw', '212', 0, '2026-07-16T01:11:51.295203'::timestamp) ON CONFLICT (id) DO NOTHING;
INSERT INTO comments ("id", "postId", "parentId", "authorId", "author", "avatar", "content", "likes", "createdAt") VALUES (59, 64, NULL, 2, 'qw', 'https://api.dicebear.com/9.x/avataaars/svg?seed=qw', '你好', 1, '2026-07-16T03:21:41.280104'::timestamp) ON CONFLICT (id) DO NOTHING;

-- ========== user_follows ==========
INSERT INTO user_follows ("id", "userId", "followId", "createdAt") VALUES (3, 2, 1, '2026-07-16T06:12:21.679957'::timestamp) ON CONFLICT (id) DO NOTHING;
INSERT INTO user_follows ("id", "userId", "followId", "createdAt") VALUES (7, 3, 2, '2026-07-17T03:50:36.897830'::timestamp) ON CONFLICT (id) DO NOTHING;
INSERT INTO user_follows ("id", "userId", "followId", "createdAt") VALUES (16, 1, 3, '2026-07-17T04:19:34.575602'::timestamp) ON CONFLICT (id) DO NOTHING;
INSERT INTO user_follows ("id", "userId", "followId", "createdAt") VALUES (28, 1, 2, '2026-07-17T07:16:38.616074'::timestamp) ON CONFLICT (id) DO NOTHING;

COMMIT;
