import { initDb, queryAll, closeDb } from './db.js';

async function checkUsers() {
  await initDb();
  const users = await queryAll('SELECT id, name, email, role FROM users');
  const seq = await queryAll("SELECT nextval('users_id_seq') as next");
  console.log('Users in database:', JSON.stringify(users, null, 2));
  console.log('Next user ID:', seq[0]?.next);
  closeDb();
}

checkUsers().catch(console.error);