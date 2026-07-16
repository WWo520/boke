import { runSql, queryAll } from './src/db.js';

async function addColumn() {
  try {
    const exists = await queryAll("SELECT column_name FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'columnId'");
    if (exists.length === 0) {
      await runSql('ALTER TABLE posts ADD COLUMN "columnId" INTEGER');
      console.log('Column added successfully');
    } else {
      console.log('Column already exists');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

addColumn();