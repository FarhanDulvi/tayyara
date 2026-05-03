/**
 * test-workflow.ts — Local end-to-end test of the watch-route workflow
 * 
 * Replicates the exact logic from workflows/watch-route.ts but without
 * the @vercel/workflow dependency (which only exists on Vercel's runtime).
 * 
 * Run: npx tsx --env-file=.env.local scripts/test-workflow.ts
 */

import { neon } from '@neondatabase/serverless';
import { fetchCheapestPrices } from '../lib/prices/travelpayouts';
import { sendWhatsApp } from '../lib/notify/twilio';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log('🔄 Triggering watch-route workflow locally...\n');

  // ── Step 1: Load active routes ──
  console.log('[step] load-active-routes');
  const routes = await sql`
    SELECT r.*, u.whatsapp_number, u.preferred_lang
    FROM routes r JOIN users u ON r.user_id = u.id
    WHERE r.status = 'active' AND u.twilio_opted_in_at IS NOT NULL;
  `;
  console.log(`  → Found ${routes.length} active route(s)\n`);

  if (routes.length === 0) {
    console.log('❌ No active routes found. Did you run seed-db.ts first?');
    return;
  }

  // ── Step 2: Process each route ──
  for (const route of routes as any[]) {
    console.log(`[step] process-${route.id}`);
    console.log(`  Route: ${route.origin_iata} → ${route.destination_iata}`);
    console.log(`  Window: ${route.depart_window_start} to ${route.depart_window_end}`);
    console.log(`  Target price: SAR ${route.target_price_sar}`);

    // 2a. Fetch latest prices
    console.log('\n  [2a] Fetching prices from Travelpayouts...');
    const quotes = await fetchCheapestPrices({
      origin: route.origin_iata,
      destination: route.destination_iata,
      depart_window_start: route.depart_window_start,
      depart_window_end: route.depart_window_end,
      return_window_start: route.return_window_start,
      return_window_end: route.return_window_end,
      passengers: route.passengers,
    });

    if (!quotes.length) {
      console.log('  ⚠️  No quotes returned from Travelpayouts. Skipping route.');
      continue;
    }

    const cheapest = quotes.reduce((a, b) => a.price_sar < b.price_sar ? a : b);
    console.log(`  ✅ Found ${quotes.length} quote(s). Cheapest: SAR ${cheapest.price_sar} (${cheapest.airline}, ${cheapest.stops} stop(s))`);

    // 2b. Log to price_history
    console.log('\n  [2b] Inserting into price_history...');
    await sql`
      INSERT INTO price_history (route_id, best_price_sar, airline, stops, depart_date, return_date, raw_offer)
      VALUES (${route.id}, ${cheapest.price_sar}, ${cheapest.airline}, ${cheapest.stops},
              ${cheapest.depart_date}, ${cheapest.return_date}, ${JSON.stringify(cheapest.raw)});
    `;
    console.log('  ✅ price_history row inserted.');

    // 2c. Pull 30-day baseline
    console.log('\n  [2c] Pulling 30-day baseline...');
    const [baseline] = await sql`
      SELECT AVG(best_price_sar)::NUMERIC(10,2) AS avg_30d, MIN(best_price_sar) AS min_30d
      FROM price_history
      WHERE route_id = ${route.id}
        AND fetched_at >= NOW() - INTERVAL '30 days';
    `;
    console.log(`  Baseline → avg: SAR ${baseline?.avg_30d ?? 'N/A'}, min: SAR ${baseline?.min_30d ?? 'N/A'}`);

    // 2d. Signal evaluation (SKIPPING LLM for local test — the price is clearly below target)
    //     Target = 9999, any real price ~1800 is way below → should_alert = true
    const currentPrice = cheapest.price_sar;
    const targetPrice = parseFloat(route.target_price_sar);
    const shouldAlert = currentPrice < targetPrice;
    const vsBaselinePct = baseline?.avg_30d
      ? ((currentPrice - parseFloat(baseline.avg_30d)) / parseFloat(baseline.avg_30d)) * 100
      : -50; // first data point, assume significant

    console.log(`\n  [2d] Signal evaluation (local):`);
    console.log(`    Current: SAR ${currentPrice} vs Target: SAR ${targetPrice}`);
    console.log(`    Below target? ${shouldAlert ? 'YES ✅' : 'NO ❌'}`);
    console.log(`    vs baseline: ${vsBaselinePct.toFixed(1)}%`);

    if (!shouldAlert) {
      console.log('  → Not alerting (price above target).');
      continue;
    }

    // 2e. Dedupe check
    console.log('\n  [2e] Checking for recent alerts (12h dedupe)...');
    const recentAlerts = await sql`
      SELECT 1 FROM alerts
      WHERE route_id = ${route.id} AND triggered_at >= NOW() - INTERVAL '12 hours'
      LIMIT 1;
    `;
    if (recentAlerts.length > 0) {
      console.log('  ⚠️  Alert already sent in last 12h. Skipping.');
      continue;
    }
    console.log('  ✅ No recent alert — proceeding to send.');

    // 2f. Compose message (simple template instead of LLM for local test)
    const message = `✈️ *Khobar → Mumbai* deal found!\n\n💰 SAR ${cheapest.price_sar} (${cheapest.airline}, ${cheapest.stops} stop${cheapest.stops === 1 ? '' : 's'})\n🎯 Your target: SAR ${targetPrice}\n📅 Depart: ${cheapest.depart_date}${cheapest.return_date ? `\n↩️ Return: ${cheapest.return_date}` : ''}\n\n_Powered by Tayyara — your AI flight scout_`;

    console.log(`\n  [2f] Composed message:\n${message}\n`);

    // 2g. Send WhatsApp
    console.log('  [2g] Sending WhatsApp via Twilio...');
    try {
      const sid = await sendWhatsApp(route.whatsapp_number, message);
      console.log(`  ✅ WhatsApp sent! SID: ${sid}`);

      // Log to alerts table
      await sql`
        INSERT INTO alerts (route_id, price_sar, vs_baseline_pct, reasoning_text, whatsapp_sid, delivered)
        VALUES (${route.id}, ${cheapest.price_sar}, ${vsBaselinePct},
                ${'Local test: price below target, alert triggered'}, ${sid}, TRUE);
      `;
      console.log('  ✅ Alert row inserted into DB.');
    } catch (err: any) {
      console.error(`  ❌ Twilio error: ${err.message}`);
      // Still log the alert attempt
      await sql`
        INSERT INTO alerts (route_id, price_sar, vs_baseline_pct, reasoning_text, whatsapp_sid, delivered)
        VALUES (${route.id}, ${cheapest.price_sar}, ${vsBaselinePct},
                ${`Local test failed: ${err.message}`}, ${'FAILED'}, FALSE);
      `;
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Workflow run complete. Now verify:');
  console.log('  1. Check your WhatsApp for the message');
  console.log('  2. Check price_history table in Neon');
  console.log('  3. Check alerts table in Neon');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(err => {
  console.error('❌ Workflow failed:', err);
  process.exit(1);
});
