import { initDb, runSql } from './db.js';

async function migrate() {
  await initDb();
  
  console.log('Running draft feature migration...');
  
  await runSql(`ALTER TABLE posts ALTER COLUMN summary DROP NOT NULL`);
  console.log('✓ summary: dropped NOT NULL constraint');
  
  await runSql(`ALTER TABLE posts ALTER COLUMN content DROP NOT NULL`);
  console.log('✓ content: dropped NOT NULL constraint');
  
  await runSql(`ALTER TABLE posts ALTER COLUMN "coverImage" DROP NOT NULL`);
  console.log('✓ coverImage: dropped NOT NULL constraint');
  
  await runSql(`ALTER TABLE posts ALTER COLUMN "categoryId" DROP NOT NULL`);
  console.log('✓ categoryId: dropped NOT NULL constraint');
  
  await runSql(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published'`);
  console.log('✓ status column added');
  
  await runSql(`UPDATE posts SET status = 'published' WHERE status IS NULL`);
  console.log('✓ existing posts marked as published');
  
  console.log('\n✓ Draft feature migration completed successfully!');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
