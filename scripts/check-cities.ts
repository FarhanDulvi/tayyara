import { neon } from '@neondatabase/serverless';

async function check() {
  const sql = neon(process.env.DATABASE_URL!);
  const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'connection_cities' ORDER BY ordinal_position;`;
  console.log('connection_cities columns:', cols);
  const rows = await sql`SELECT * FROM connection_cities LIMIT 5;`;
  console.log('Sample rows:', JSON.stringify(rows, null, 2));
  const count = await sql`SELECT COUNT(*) FROM connection_cities;`;
  console.log('Total rows:', count);
}

check().catch(err => { console.error(err); process.exit(1); });
