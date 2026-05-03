import { neon } from '@neondatabase/serverless';

async function updateRoute() {
  const sql = neon(process.env.DATABASE_URL!);

  // Widen the depart window to the full month of May + early June
  // We confirmed earlier that May 30 data exists
  await sql`
    UPDATE routes
    SET depart_window_start = '2026-05-01',
        depart_window_end = '2026-06-15',
        return_window_start = '2026-05-15',
        return_window_end = '2026-06-30'
    WHERE user_id = '11111111-1111-1111-1111-111111111111';
  `;
  console.log('✅ Route dates widened to full May-June window.');

  const rows = await sql`
    SELECT origin_iata, destination_iata, depart_window_start, depart_window_end, return_window_start, return_window_end
    FROM routes WHERE user_id = '11111111-1111-1111-1111-111111111111';
  `;
  console.log('📋 Updated route:', rows);
}

updateRoute().catch(err => { console.error('❌', err); process.exit(1); });
