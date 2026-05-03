import { neon } from '@neondatabase/serverless';

async function clear() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`DELETE FROM alerts WHERE route_id = (SELECT id FROM routes WHERE user_id = '11111111-1111-1111-1111-111111111111')`;
  console.log('✅ Cleared old alert rows.');
}

clear().catch(err => { console.error(err); process.exit(1); });
