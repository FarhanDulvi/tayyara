import { neon } from '@neondatabase/serverless';

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);

  // 1. Create a test user with your real WhatsApp number
  await sql`
    INSERT INTO users (id, email, whatsapp_number, preferred_lang, twilio_opted_in_at)
    VALUES (
      '11111111-1111-1111-1111-111111111111',
      'farhan-test@dynamicnetwork.io',
      '+966549588059',
      'en',
      NOW()
    ) ON CONFLICT (id) DO NOTHING;
  `;
  console.log('✅ Test user inserted.');

  // 2. Create a test route (DMM → BOM, May 2026, absurdly high target so any price triggers)
  await sql`
    INSERT INTO routes (
      user_id, origin_iata, destination_iata, origin_label, destination_label,
      depart_window_start, depart_window_end, return_window_start, return_window_end,
      passengers, cabin, target_price_sar, status
    )
    VALUES (
      '11111111-1111-1111-1111-111111111111',
      'DMM', 'BOM', 'Khobar', 'Mumbai',
      '2026-05-15', '2026-05-25', '2026-05-29', '2026-06-05',
      1, 'economy',
      9999.00,
      'active'
    ) ON CONFLICT DO NOTHING;
  `;
  console.log('✅ Test route inserted.');

  // 3. Verify
  const rows = await sql`
    SELECT u.whatsapp_number, r.origin_iata, r.destination_iata, r.target_price_sar, r.status
    FROM users u JOIN routes r ON u.id = r.user_id
    WHERE u.id = '11111111-1111-1111-1111-111111111111';
  `;
  console.log('📋 Verification:', rows);
}

seed().catch(err => { console.error('❌', err); process.exit(1); });
