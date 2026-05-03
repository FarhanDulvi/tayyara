import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function checkDb() {
  const sql = neon(process.env.DATABASE_URL!);
  try {
    const result = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`;
    console.log("Neon DB is working! Tables found:", result.map(r => r.table_name));
  } catch (err) {
    console.error("Failed to connect or query:", err);
  }
}

checkDb();
