/**
 * test-arbitrage.ts — CLI test for arbitrage discovery
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/test-arbitrage.ts <origin> <destination> <depart_start> <depart_end> [nationality]
 *
 * Example:
 *   npx tsx --env-file=.env.local scripts/test-arbitrage.ts RUH MNL 2026-05-15 2026-05-30 IN
 */

import { discoverArbitrage, ArbitrageFind } from '../lib/arbitrage/discover';
import { fetchCheapestPrices } from '../lib/prices/travelpayouts';

const KIND_EMOJI: Record<string, string> = {
  split: '✂️',
  open_jaw: '🔀',
  date_ladder: '📅',
  adjacent_airport: '🛫',
  multi_airline: '🔄',
};

async function main() {
  const [origin, destination, departStart, departEnd, nationality] = process.argv.slice(2);

  if (!origin || !destination || !departStart || !departEnd) {
    console.error('Usage: test-arbitrage.ts <origin> <destination> <depart_start> <depart_end> [nationality]');
    console.error('Example: test-arbitrage.ts RUH MNL 2026-05-15 2026-05-30 IN');
    process.exit(1);
  }

  console.log(`\n🔍 Arbitrage discovery: ${origin} → ${destination}`);
  console.log(`   Depart window: ${departStart} to ${departEnd}`);
  if (nationality) console.log(`   Nationality: ${nationality}`);

  // First, get the direct baseline price
  console.log('\n📊 Fetching direct baseline price...');
  const directQuotes = await fetchCheapestPrices({
    origin,
    destination,
    depart_window_start: departStart,
    depart_window_end: departEnd,
  });

  if (!directQuotes.length) {
    console.log('⚠️  No direct quotes found. Using SAR 3000 as synthetic baseline.');
  }

  const directBaseline = directQuotes.length
    ? directQuotes.reduce((a, b) => a.price_sar < b.price_sar ? a : b).price_sar
    : 3000;

  console.log(`   Direct baseline: SAR ${directBaseline}\n`);

  // Run arbitrage discovery
  console.log('🔎 Running arbitrage strategies (date-ladder, split-via-hub, open-jaw, adjacent)...\n');
  const startTime = Date.now();

  const finds = await discoverArbitrage({
    origin,
    destination,
    depart_window_start: departStart,
    depart_window_end: departEnd,
    passengers: 1,
    user_nationality: nationality,
    direct_baseline_sar: directBaseline,
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Discovery complete in ${elapsed}s — found ${finds.length} arbitrage deal(s)\n`);

  if (finds.length === 0) {
    console.log('No arbitrage opportunities found for this route/window.');
    console.log('This could mean:');
    console.log('  • Direct price is already very competitive');
    console.log('  • Travelpayouts cache has limited data for these hub routes');
    console.log('  • Date window is too narrow');
    return;
  }

  for (let i = 0; i < finds.length; i++) {
    const f = finds[i];
    const emoji = KIND_EMOJI[f.kind] || '💡';

    console.log(`${emoji} #${i + 1} — ${f.kind.toUpperCase()}`);
    console.log(`   Total: SAR ${f.total_price_sar.toFixed(2)}`);
    console.log(`   Savings: SAR ${f.savings_sar.toFixed(2)} (${f.savings_pct.toFixed(1)}%)`);
    console.log(`   Legs:`);
    for (const leg of f.legs) {
      console.log(`     • ${leg.from} → ${leg.to} | ${leg.airline} | ${leg.depart_date} | SAR ${leg.price_sar.toFixed(2)}`);
    }
    if (f.warnings.length) {
      console.log(`   ⚠️  Warnings:`);
      for (const w of f.warnings) {
        console.log(`     • ${w}`);
      }
    }
    console.log('');
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message || err);
  process.exit(1);
});
