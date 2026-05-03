import { fetchCheapestPrices, PriceQuote } from '../prices/travelpayouts';
import { neon } from '@neondatabase/serverless';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ArbitrageFind {
  kind: 'split' | 'open_jaw' | 'multi_airline' | 'date_ladder' | 'adjacent_airport';
  total_price_sar: number;
  savings_sar: number;
  savings_pct: number;
  legs: Array<{ airline: string; from: string; to: string; depart_date: string; price_sar: number }>;
  warnings: string[];
}

export interface ArbitrageArgs {
  origin: string;
  destination: string;
  depart_window_start: string;
  depart_window_end: string;
  return_window_start?: string;
  return_window_end?: string;
  passengers?: number;
  user_nationality?: string;
  direct_baseline_sar: number;
}

// ── Simple concurrency limiter (no external deps) ──────────────────────────────

function createLimiter(concurrency: number) {
  let running = 0;
  const queue: Array<() => void> = [];

  return async function limit<T>(fn: () => Promise<T>): Promise<T> {
    while (running >= concurrency) {
      await new Promise<void>(resolve => queue.push(resolve));
    }
    running++;
    try {
      return await fn();
    } finally {
      running--;
      if (queue.length > 0) queue.shift()!();
    }
  };
}

const limit = createLimiter(12);

// ── Open-jaw alternate cities (v1 hard-coded) ──────────────────────────────────

const OPEN_JAW_ALTERNATES: Record<string, string[]> = {
  BOM: ['BLR', 'HYD', 'DEL'],
  MNL: ['CEB'],
  KHI: ['LHE', 'ISB'],
  CAI: ['SSH', 'HRG'],
  DXB: ['SHJ', 'AUH'],
};

// ── Adjacent airport swap pairs ────────────────────────────────────────────────

const ADJACENT_PAIRS: Record<string, string> = {
  DXB: 'SHJ', SHJ: 'DXB',
  DOH: 'AUH', AUH: 'DOH',
  BOM: 'PNQ', PNQ: 'BOM',
  MNL: 'CRK', CRK: 'MNL',
};

// ── Main discovery function ────────────────────────────────────────────────────

export async function discoverArbitrage(args: ArbitrageArgs): Promise<ArbitrageFind[]> {
  const finds: ArbitrageFind[] = [];
  const passengers = args.passengers || 1;

  // Run all strategies in parallel
  const [dateLadder, splits, openJaws, adjacent] = await Promise.allSettled([
    findDateLadder(args, finds),
    findSplitViaHub(args, finds),
    findOpenJaw(args, finds),
    findAdjacentAirport(args, finds),
  ]);

  // Log any strategy-level errors (don't crash the whole discovery)
  for (const [name, result] of [
    ['date_ladder', dateLadder],
    ['split_via_hub', splits],
    ['open_jaw', openJaws],
    ['adjacent_airport', adjacent],
  ] as const) {
    if (result.status === 'rejected') {
      console.error(`  ⚠️  Arbitrage strategy ${name} failed:`, result.reason?.message || result.reason);
    }
  }

  // Sort by savings descending, return top 3
  return finds.sort((a, b) => b.savings_sar - a.savings_sar).slice(0, 3);
}

// ── Strategy A: Date-ladder ────────────────────────────────────────────────────
// Check if shifting dates within the window yields meaningful savings.

async function findDateLadder(args: ArbitrageArgs, finds: ArbitrageFind[]) {
  const quotes = await limit(() => fetchCheapestPrices({
    origin: args.origin,
    destination: args.destination,
    depart_window_start: args.depart_window_start,
    depart_window_end: args.depart_window_end,
    return_window_start: args.return_window_start,
    return_window_end: args.return_window_end,
    passengers: args.passengers,
  }));

  if (!quotes.length) return;

  const cheapest = quotes.reduce((a, b) => a.price_sar < b.price_sar ? a : b);
  const savings = args.direct_baseline_sar - cheapest.price_sar;

  // Only emit if savings > SAR 100
  if (savings > 100) {
    finds.push({
      kind: 'date_ladder',
      total_price_sar: cheapest.price_sar,
      savings_sar: savings,
      savings_pct: (savings / args.direct_baseline_sar) * 100,
      legs: [{
        airline: cheapest.airline,
        from: args.origin,
        to: args.destination,
        depart_date: cheapest.depart_date,
        price_sar: cheapest.price_sar,
      }],
      warnings: [`Requires departing on ${cheapest.depart_date} instead of your preferred date`],
    });
  }
}

// ── Strategy B: Split via hub ──────────────────────────────────────────────────
// Buy two separate tickets via a connecting hub for less than the direct route.

async function findSplitViaHub(args: ArbitrageArgs, finds: ArbitrageFind[]) {
  const sql = neon(process.env.DATABASE_URL!);

  // Get major hubs from connection_cities
  const hubs = await sql`
    SELECT iata, city_name, visa_rules
    FROM connection_cities
    WHERE is_major_hub = TRUE
      AND iata != ${args.origin}
      AND iata != ${args.destination};
  `;

  const hubPromises = hubs.map((hub: any) =>
    limit(async () => {
      try {
        // Fetch both legs in parallel
        const [outboundQuotes, inboundQuotes] = await Promise.all([
          fetchCheapestPrices({
            origin: args.origin,
            destination: hub.iata,
            depart_window_start: args.depart_window_start,
            depart_window_end: args.depart_window_end,
            passengers: args.passengers,
          }),
          fetchCheapestPrices({
            origin: hub.iata,
            destination: args.destination,
            depart_window_start: args.depart_window_start,
            depart_window_end: args.depart_window_end,
            passengers: args.passengers,
          }),
        ]);

        if (!outboundQuotes.length || !inboundQuotes.length) return;

        const ob = outboundQuotes.reduce((a, b) => a.price_sar < b.price_sar ? a : b);
        const ib = inboundQuotes.reduce((a, b) => a.price_sar < b.price_sar ? a : b);
        const total = ob.price_sar + ib.price_sar;
        const savings = args.direct_baseline_sar - total;

        // Only emit if savings > SAR 200
        if (savings > 200) {
          const warnings: string[] = [];

          // Visa check
          if (args.user_nationality) {
            const vr = (hub.visa_rules as any)?.[args.user_nationality];
            if (vr?.transit_visa_required) {
              warnings.push(`Transit visa required at ${hub.city_name}`);
            }
          }

          // Self-transfer warning (always)
          warnings.push(`Self-transfer at ${hub.city_name} — book ≥6hr gap, separate baggage check-in`);

          finds.push({
            kind: 'split',
            total_price_sar: total,
            savings_sar: savings,
            savings_pct: (savings / args.direct_baseline_sar) * 100,
            legs: [
              { airline: ob.airline, from: args.origin, to: hub.iata, depart_date: ob.depart_date, price_sar: ob.price_sar },
              { airline: ib.airline, from: hub.iata, to: args.destination, depart_date: ib.depart_date, price_sar: ib.price_sar },
            ],
            warnings,
          });
        }
      } catch (err: any) {
        // Don't crash on a single hub failure — log and continue
        console.error(`    ⚠️  Split-via-${hub.iata} failed:`, err.message);
      }
    })
  );

  await Promise.all(hubPromises);
}

// ── Strategy C: Open-jaw ───────────────────────────────────────────────────────
// For round-trips: fly outbound to destination, return from a nearby alternate city.

async function findOpenJaw(args: ArbitrageArgs, finds: ArbitrageFind[]) {
  // Only applicable for round-trip routes
  if (!args.return_window_start || !args.return_window_end) return;

  const alternates = OPEN_JAW_ALTERNATES[args.destination];
  if (!alternates || alternates.length === 0) return;

  const jawPromises = alternates.map((alt) =>
    limit(async () => {
      try {
        // Fetch outbound (origin → destination) + return (alternate → origin)
        const [outboundQuotes, returnQuotes] = await Promise.all([
          fetchCheapestPrices({
            origin: args.origin,
            destination: args.destination,
            depart_window_start: args.depart_window_start,
            depart_window_end: args.depart_window_end,
            passengers: args.passengers,
          }),
          fetchCheapestPrices({
            origin: alt,
            destination: args.origin,
            depart_window_start: args.return_window_start!,
            depart_window_end: args.return_window_end!,
            passengers: args.passengers,
          }),
        ]);

        if (!outboundQuotes.length || !returnQuotes.length) return;

        const ob = outboundQuotes.reduce((a, b) => a.price_sar < b.price_sar ? a : b);
        const ret = returnQuotes.reduce((a, b) => a.price_sar < b.price_sar ? a : b);
        const total = ob.price_sar + ret.price_sar;
        const savings = args.direct_baseline_sar - total;

        // Only emit if savings > SAR 200
        if (savings > 200) {
          finds.push({
            kind: 'open_jaw',
            total_price_sar: total,
            savings_sar: savings,
            savings_pct: (savings / args.direct_baseline_sar) * 100,
            legs: [
              { airline: ob.airline, from: args.origin, to: args.destination, depart_date: ob.depart_date, price_sar: ob.price_sar },
              { airline: ret.airline, from: alt, to: args.origin, depart_date: ret.depart_date, price_sar: ret.price_sar },
            ],
            warnings: [
              `Return flight departs from ${alt}, not ${args.destination} — arrange ground transport between cities`,
            ],
          });
        }
      } catch (err: any) {
        console.error(`    ⚠️  Open-jaw via ${alt} failed:`, err.message);
      }
    })
  );

  await Promise.all(jawPromises);
}

// ── Strategy D: Adjacent airport ───────────────────────────────────────────────
// Try swapping origin or destination with a nearby airport.

async function findAdjacentAirport(args: ArbitrageArgs, finds: ArbitrageFind[]) {
  const swaps: Array<{ newOrigin: string; newDest: string; swappedSide: string; swappedTo: string }> = [];

  // Check if origin has an adjacent swap
  if (ADJACENT_PAIRS[args.origin]) {
    swaps.push({
      newOrigin: ADJACENT_PAIRS[args.origin],
      newDest: args.destination,
      swappedSide: 'origin',
      swappedTo: ADJACENT_PAIRS[args.origin],
    });
  }

  // Check if destination has an adjacent swap
  if (ADJACENT_PAIRS[args.destination]) {
    swaps.push({
      newOrigin: args.origin,
      newDest: ADJACENT_PAIRS[args.destination],
      swappedSide: 'destination',
      swappedTo: ADJACENT_PAIRS[args.destination],
    });
  }

  if (swaps.length === 0) return;

  const adjPromises = swaps.map((swap) =>
    limit(async () => {
      try {
        const quotes = await fetchCheapestPrices({
          origin: swap.newOrigin,
          destination: swap.newDest,
          depart_window_start: args.depart_window_start,
          depart_window_end: args.depart_window_end,
          return_window_start: args.return_window_start,
          return_window_end: args.return_window_end,
          passengers: args.passengers,
        });

        if (!quotes.length) return;

        const cheapest = quotes.reduce((a, b) => a.price_sar < b.price_sar ? a : b);
        const savings = args.direct_baseline_sar - cheapest.price_sar;

        // Only emit if meaningful savings
        if (savings > 100) {
          finds.push({
            kind: 'adjacent_airport',
            total_price_sar: cheapest.price_sar,
            savings_sar: savings,
            savings_pct: (savings / args.direct_baseline_sar) * 100,
            legs: [{
              airline: cheapest.airline,
              from: swap.newOrigin,
              to: swap.newDest,
              depart_date: cheapest.depart_date,
              price_sar: cheapest.price_sar,
            }],
            warnings: [
              `Flies ${swap.swappedSide === 'origin' ? 'from' : 'into'} ${swap.swappedTo} instead of ${swap.swappedSide === 'origin' ? args.origin : args.destination} — ~30-90 min ground transfer`,
            ],
          });
        }
      } catch (err: any) {
        console.error(`    ⚠️  Adjacent ${swap.newOrigin}→${swap.newDest} failed:`, err.message);
      }
    })
  );

  await Promise.all(adjPromises);

  // TODO: Strategy E — Multi-airline same-route (stretch goal)
  // Compare prices across different airlines on the exact same route to find
  // combinations where mixing carriers on outbound/return saves money.
}
