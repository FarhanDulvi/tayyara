import { defineWorkflow, step } from '@vercel/workflow';
import { neon } from '@neondatabase/serverless';
import { fetchCheapestPrices } from '@/lib/prices/travelpayouts';
import { evaluateSignal } from '@/lib/agent/signal';
import { composeAlert } from '@/lib/agent/compose';
import { composeArbitrageAlert } from '@/lib/agent/composeArbitrage';
import { sendWhatsApp } from '@/lib/notify/twilio';
import { discoverArbitrage } from '@/lib/arbitrage/discover';

const sql = neon(process.env.DATABASE_URL!);

export const watchRoute = defineWorkflow({
  name: 'watch-route',
  schedule: '*/30 * * * *', // every 30 min — confirm WDK syntax
  async run() {
    // 1. Get all active routes
    const routes = await step('load-active-routes', async () => {
      return await sql`
        SELECT r.*, u.whatsapp_number, u.preferred_lang
        FROM routes r JOIN users u ON r.user_id = u.id
        WHERE r.status = 'active' AND u.twilio_opted_in_at IS NOT NULL;
      `;
    });

    // 2. Per route: fetch → log → evaluate → maybe notify
    for (const route of routes as any[]) {
      await step(`process-${route.id}`, async () => {
        // 2a. Fetch latest prices (tool call)
        const quotes = await fetchCheapestPrices({
          origin: route.origin_iata,
          destination: route.destination_iata,
          depart_window_start: route.depart_window_start,
          depart_window_end: route.depart_window_end,
          return_window_start: route.return_window_start,
          return_window_end: route.return_window_end,
          passengers: route.passengers,
        });
        if (!quotes.length) return;
        const cheapest = quotes.reduce((a, b) => a.price_sar < b.price_sar ? a : b);

        // 2b. Log to price_history
        await sql`
          INSERT INTO price_history (route_id, best_price_sar, airline, stops, depart_date, return_date, raw_offer)
          VALUES (${route.id}, ${cheapest.price_sar}, ${cheapest.airline}, ${cheapest.stops},
                  ${cheapest.depart_date}, ${cheapest.return_date}, ${JSON.stringify(cheapest.raw)});
        `;

        // 2c. Pull 30-day baseline
        const [baseline] = await sql`
          SELECT AVG(best_price_sar)::NUMERIC(10,2) AS avg_30d, MIN(best_price_sar) AS min_30d
          FROM price_history
          WHERE route_id = ${route.id}
            AND fetched_at >= NOW() - INTERVAL '30 days';
        `;

        // 2d. AGENT REASONING STEP — let the LLM decide if this is alert-worthy
        const decision = await evaluateSignal({
          current_price: cheapest.price_sar,
          target_price: route.target_price_sar,
          baseline_avg: baseline?.avg_30d,
          baseline_min: baseline?.min_30d,
          route_label: `${route.origin_label} → ${route.destination_label}`,
        });

        if (decision.should_alert) {
          // 2e. Dedupe: don't alert if we sent one in last 12h
          const [recent] = await sql`
            SELECT 1 FROM alerts
            WHERE route_id = ${route.id} AND triggered_at >= NOW() - INTERVAL '12 hours'
            LIMIT 1;
          `;

          if (!recent) {
            // 2f. Compose the alert text (LLM)
            const message = await composeAlert({
              route,
              quote: cheapest,
              decision,
              lang: route.preferred_lang,
            });

            // 2g. Send WhatsApp + log
            const sid = await sendWhatsApp(route.whatsapp_number, message);
            await sql`
              INSERT INTO alerts (route_id, price_sar, vs_baseline_pct, reasoning_text, whatsapp_sid, delivered)
              VALUES (${route.id}, ${cheapest.price_sar}, ${decision.vs_baseline_pct},
                      ${decision.reasoning}, ${sid}, TRUE);
            `;
          }
        }

        // ── 2h. ARBITRAGE DISCOVERY (purely additive — runs regardless of direct-price alert) ──
        await step(`arbitrage-${route.id}`, async () => {
          const finds = await discoverArbitrage({
            origin: route.origin_iata,
            destination: route.destination_iata,
            depart_window_start: route.depart_window_start,
            depart_window_end: route.depart_window_end,
            return_window_start: route.return_window_start,
            return_window_end: route.return_window_end,
            passengers: route.passengers,
            user_nationality: route.user_nationality,
            direct_baseline_sar: cheapest.price_sar,
          });

          // Mark old finds stale, insert new ones
          await sql`UPDATE arbitrage_finds SET is_current = FALSE WHERE route_id = ${route.id};`;
          for (const f of finds) {
            await sql`
              INSERT INTO arbitrage_finds (route_id, kind, total_price_sar, savings_sar, savings_pct, legs, warnings)
              VALUES (${route.id}, ${f.kind}, ${f.total_price_sar}, ${f.savings_sar}, ${f.savings_pct},
                      ${JSON.stringify(f.legs)}, ${JSON.stringify(f.warnings)});
            `;
          }

          // Promote significant finds to alerts
          for (const f of finds) {
            if (f.savings_pct >= 15) {
              // Dedupe: check no alert of same kind in last 12h
              const [recentArb] = await sql`
                SELECT 1 FROM alerts
                WHERE route_id = ${route.id}
                  AND reasoning_text LIKE ${'%' + f.kind + '%'}
                  AND triggered_at >= NOW() - INTERVAL '12 hours'
                LIMIT 1;
              `;
              if (recentArb) continue;

              const message = await composeArbitrageAlert({ route, find: f });
              const sid = await sendWhatsApp(route.whatsapp_number, message);
              await sql`
                INSERT INTO alerts (route_id, price_sar, vs_baseline_pct, reasoning_text, whatsapp_sid, delivered)
                VALUES (${route.id}, ${f.total_price_sar}, ${-f.savings_pct},
                        ${f.kind + ': ' + f.warnings.join('; ')}, ${sid}, TRUE);
              `;
            }
          }
        });
      });
    }
  },
});
