import { test, expect } from '@playwright/test';

/**
 * 前端端到端冒烟测试（Chromium）
 * 前置：前端 http://localhost:3000（通过 rewrites 代理到后端 3333）。
 * 目标：验证核心页面可加载、关键元素渲染、数据来自后端。
 */

test.describe('首页', () => {
  test('加载成功且渲染文章卡片', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/墨客/);
    // 文章链接（/post/xxx）应至少有一个
    await expect(page.locator('a[href^="/post/"]').first()).toBeVisible({ timeout: 15000 });
  });

  test('导航到排行榜', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: '排行榜' }).first().click();
    await expect(page).toHaveURL(/\/rankings/);
    await expect(page.getByRole('heading', { name: '排行榜' })).toBeVisible();
  });
});

test.describe('排行榜', () => {
  test('页面加载并显示榜单标签', async ({ page }) => {
    await page.goto('/rankings');
    await expect(page.getByRole('heading', { name: '排行榜' })).toBeVisible();
    await expect(page.getByRole('button', { name: /热榜/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /作者榜/ })).toBeVisible();
  });

  test('切换到作者榜显示作者项', async ({ page }) => {
    await page.goto('/rankings');
    await page.getByRole('button', { name: /作者榜/ }).click();
    await expect(page).toHaveURL(/\/rankings\/authors/);
    // 作者榜应渲染至少一个头像或“关注/这是你”其中之一
    const hasFollowOrSelf = page.getByText(/关注|这是你/).first();
    await expect(hasFollowOrSelf).toBeVisible({ timeout: 15000 });
  });
});

test.describe('文章详情', () => {
  test('打开第一篇文章并渲染正文', async ({ page, request }) => {
    // 取最旧的种子文章（稳定、不会被 api 用例删除）
    const res = await request.get('http://localhost:3333/api/posts?pageSize=1&sort=oldest');
    const json = await res.json();
    const slug = json.data?.[0]?.slug;
    test.skip(!slug, '无已发布文章');

    // 详情页图片较多，等 domcontentloaded 即可（不必死等全部资源 load）
    await page.goto(`/post/${slug}`, { waitUntil: 'domcontentloaded' });
    // 标题（h1）应可见
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('搜索页', () => {
  test('搜索页可访问', async ({ page }) => {
    await page.goto('/search');
    // 页面正常渲染（body 可见，无致命错误）
    await expect(page.locator('body')).toBeVisible();
  });
});
