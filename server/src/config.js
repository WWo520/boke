// 集中管理关键运行配置与安全校验
const isProd = process.env.NODE_ENV === 'production';

// 仅用于本地开发的兜底密钥；生产环境严禁使用
const DEV_FALLBACK_SECRET = 'moke-dev-insecure-secret-local-only';
// 历史硬编码弱密钥，生产环境若沿用则拒绝启动
const KNOWN_WEAK_SECRETS = new Set([
  'moke-blog-secret-key-2024',
  DEV_FALLBACK_SECRET,
  'CHANGE_ME_TO_A_STRONG_RANDOM_SECRET',
]);

function resolveJwtSecret() {
  const secret = process.env.JWT_SECRET && process.env.JWT_SECRET.trim();

  if (isProd) {
    if (!secret) {
      throw new Error('[FATAL] 生产环境必须通过环境变量配置 JWT_SECRET，服务拒绝启动。');
    }
    if (secret.length < 16 || KNOWN_WEAK_SECRETS.has(secret)) {
      throw new Error('[FATAL] JWT_SECRET 过弱或使用了默认占位值，请更换为足够随机的强密钥（≥16 字符）。');
    }
    return secret;
  }

  if (secret) return secret;
  console.warn('⚠️  未配置 JWT_SECRET，正在使用开发默认密钥（仅限本地开发，切勿用于生产环境）。');
  return DEV_FALLBACK_SECRET;
}

export const JWT_SECRET = resolveJwtSecret();
