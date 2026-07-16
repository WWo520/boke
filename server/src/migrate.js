import { initDb, runSql } from './db.js';

async function migrate() {
  await initDb();
  
  await runSql('DROP TABLE IF EXISTS post_favorites');
  await runSql('DROP TABLE IF EXISTS post_likes');
  await runSql('DROP TABLE IF EXISTS comments');
  await runSql('DROP TABLE IF EXISTS post_tags');
  await runSql('DROP TABLE IF EXISTS posts');
  await runSql('DROP TABLE IF EXISTS categories');
  await runSql('DROP TABLE IF EXISTS users');
  
  console.log('✓ Tables dropped, will be recreated by initSchema');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});