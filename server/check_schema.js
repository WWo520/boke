import { queryAll } from './src/db.js';

async function check() {
  const rows = await queryAll("SELECT column_name FROM information_schema.columns WHERE table_name = 'columns'");
  console.log(JSON.stringify(rows, null, 2));
}

check().catch(console.error);