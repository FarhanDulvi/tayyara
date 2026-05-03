# Tayyara — Kickoff Kit (Hours 0–10)

**Product:** An autonomous AI travel-hacker agent for expats in Saudi. Watches flight prices on the routes they care about *and actively constructs deals booking sites won't show* — split tickets across airlines, open-jaw routes, multi-airline combos, date-ladder savings. Runs durably on Vercel Workflow, reasons per-cycle about whether a finding is alert-worthy, pushes WhatsApp alerts.

**The wedge vs. Trip.com / Hopper / Skyscanner:** booking sites won't construct split-ticket itineraries because they break commission flow. An independent agent has no such conflict and surfaces fares that *literally cannot be found by searching one site at a time*.

**Track:** Vercel Workflow (WDK).
**Deployment URL goal:** `tayyara.vercel.app`
**Submission deadline:** May 4, 14:59 Malaysia time = 23:59 PT May 3 = ~36 hrs from now.
**Replaces:** Khidma kickoff kit (deprecated; do not use).

---

## What changes from the Khidma pre-flight

You already validated the foundational stack. Most of it carries over:

| Item | Khidma state | Tayyara action |
|---|---|---|
| Vercel Hobby account | ✅ active | Reuse. **Verify Workflow availability on Hobby** in hour 1 — fall back to Pro trial if blocked. |
| v0 + 135 credits | ✅ ready | Reuse — fresh prompt below |
| AI Gateway: gemini-3-flash + claude-sonnet-4.6 | ✅ confirmed | Reuse same models |
| AI Gateway API key | ❌ not yet created | Create when wiring env vars (hour 3) |
| Neon project `khidma` (Frankfurt) | ✅ created, empty | **Rename to `tayyara`** in Settings (or just leave the project name; doesn't affect anything). Apply the new schema below. |
| GitHub repo `FarhanDulvi/khidma` | ✅ created, empty | **Rename to `tayyara`** in repo Settings → General → Repository name. GitHub auto-redirects old URL. |
| WhatsApp delivery | Was going to use WAHA on PC | **Switch to Twilio WhatsApp Sandbox** — 5-min setup, no PC dependency, free for sandbox |

**One thing to verify in hour 0–1:** *Vercel Workflow Development Kit availability on Hobby tier.* Workflows are different from Cron Jobs and may have different tier limits. Run `npm create vercel-workflow@latest` in a scratch dir; if it works on a Hobby project, you're set. If gated, either upgrade to Pro for the hackathon period (the prize includes Pro credits, and you can use the 14-day Pro trial) or pivot the track to v0+MCP using the dashboard + on-demand research chat instead of scheduled monitoring.

---

## Right now — first 15 minutes

- [ ] Verify WDK works on Hobby. Open https://vercel.com/docs/workflows and skim. Run a hello-world workflow if needed.
- [ ] Rename GitHub repo `khidma` → `tayyara` (Settings → General → Repository name → save).
- [ ] In Neon, optionally rename project to `tayyara` (Settings → Project name). Connection string stays the same — you don't need to re-copy it.
- [ ] Sign up for Twilio: https://www.twilio.com/try-twilio (free trial, no card needed for WhatsApp sandbox).
- [ ] Activate the WhatsApp Sandbox in Twilio Console: Messaging → Try it out → Send a WhatsApp message → join the sandbox by sending the join phrase from your own WhatsApp. This is your dev sandbox number.
- [ ] Sign up for Travelpayouts: https://www.travelpayouts.com — free tier, get your API token.
- [ ] Confirm the OpenWeatherMap free tier API key is grabbable (https://openweathermap.org/api) — needed for destination-weather context in alert reasoning.

---

## Hour 0:15 → 1:30 — Scaffold v0 (dashboard + research chat)

Open v0.app, paste this verbatim. **Do not edit it on first try** — let v0 ship its take, then we iterate.

```
Build a single-page web app called "Tayyara" (طيّارة) — an AI flight 
price watcher for expats living in Saudi Arabia. It tracks flight prices 
on routes the user cares about (e.g., Riyadh → Mumbai, Dammam → Manila) 
and shows a live dashboard plus a chat where the user can ask the agent 
to research new routes or special trips.

REQUIREMENTS:
- Next.js 16, App Router, Tailwind v4, shadcn/ui, TypeScript
- Bilingual EN / AR with RTL support; English is the default. Use 
  Tailwind v4 logical properties (start-*/end-*) for layout. Use 
  Noto Sans Arabic from Google Fonts for Arabic text.
- Three main panels:

  1) HEADER (top): "Tayyara · طيّارة" logo on the left, language toggle 
     pill (EN / العربية) on the right. Subtitle: "Your AI flight scout."

  2) WATCHED ROUTES DASHBOARD (left, ~60% width on desktop, full width on 
     mobile): A grid of route cards. Each card shows:
       - Origin → Destination airports with flag emojis
       - Current best DIRECT price in SAR (large, prominent)
       - Target price (small, muted) — "Alert under SAR 2,200"
       - 14-day price sparkline (use Chart.js or recharts)
       - **An "Arbitrage finds" stack**: small badges showing alternative 
         constructions the agent discovered — e.g. 
         "✂️ Split via DXB: SAR 1,420 (-23%)" or 
         "📅 Leave Tue not Wed: SAR -380" or 
         "🔀 Open-jaw via BLR: SAR -290". Each badge is tap-to-expand.
       - Last alert badge or "Watching..." if no alert yet
       - Small "Edit" and "Pause" icon buttons
     Mock with 4 cards seeded for an Indian expat in Khobar:
       - Khobar (DMM) → Mumbai (BOM), direct SAR 1,847, target SAR 2,200,
         arbitrage badge: "✂️ Split via DXB: SAR 1,420 (-23%)"
       - Khobar (DMM) → Karachi (KHI), direct SAR 1,420, target SAR 1,500,
         arbitrage badge: "📅 Leave Sun not Fri: SAR -180"
       - Riyadh (RUH) → Manila (MNL), direct SAR 3,150, target SAR 2,800,
         arbitrage badge: "✂️ Split via DOH: SAR 2,640 (-16%)"
       - Jeddah (JED) → Cairo (CAI), direct SAR 1,090, target SAR 1,200,
         arbitrage badge: "🔀 Open-jaw return via SHJ: SAR -220"
     Top of the dashboard: "+ Add a new route to watch" button.

  3) RESEARCH CHAT (right, ~40% width on desktop, collapsible Sheet on 
     mobile): A chat panel where the user delegates research tasks to 
     the agent. Header: "Ask Tayyara to research." Below the input, 
     show a thin "Agent reasoning" bar that displays the current step 
     ("Step 2 of 5: Comparing prices across 3 airlines...") with a 
     spinner.
     Empty state: 4 suggested prompts:
       EN: "Find the cheapest way to fly my parents Hyderabad → Riyadh 
            in July"
       EN: "When should I book my Eid trip to Cairo?"
       AR: "ابحث عن أرخص رحلة من الرياض إلى مانيلا في يوليو"
       AR: "متى أفضل وقت لحجز رحلة العمرة من جدة؟"
     Mock with one example exchange showing the agent reasoning panel 
     ticking through 5 steps, then returning a structured answer card 
     with: 3 ranked flight options, reasoning bullets, "Add to watch" 
     button per option.

- AT THE TOP RIGHT, next to the language toggle: a small "Last sync: 
  4 min ago" indicator with a refresh icon — implies the agent is 
  active in the background.

- BOTTOM BAR (sticky): "Built on Vercel Workflow + AI Gateway" with 
  Vercel logo. Subtle.

- Style: clean, minimal, lots of whitespace. Color palette: deep 
  navy + warm white + a single sky-blue accent (no green; we want a 
  travel/sky vibe, not a Saudi flag vibe). Rounded-2xl cards. Subtle 
  shadows. Mobile-first.

- CRITICAL: when language is Arabic, set dir="rtl" on the root and 
  flip ALL icon positions and chart axis directions. Test that an 
  Arabic chat message renders correctly in an RTL bubble before 
  considering it done.

Mock everything client-side with realistic-looking data. No backend 
calls yet — just the UI shell that we'll wire to the workflow later.
```

**Validate immediately after generation (15 min budget):**
- Toggle language to Arabic. Layout flips cleanly?
- The price sparklines flip horizontally in RTL?
- Resize to mobile. Research chat collapses into Sheet?
- Inspect: `dir="rtl"` is set conditionally on the root element?

**Kill-point #1 (hour 1:30):** if v0 can't deliver clean RTL + a usable dashboard, drop v0 for the dashboard and use shadcn's chart blocks manually. Keep v0 for the marketing landing page only.

**Deploy:** click v0's Deploy button → connect to your renamed `tayyara` GitHub repo → custom domain `tayyara.vercel.app` → set env vars (we'll fill them in over the next hours).

---

## Hour 1:30 → 2:30 — Neon schema for Tayyara

Run in Neon SQL editor:

```sql
-- users: who's watching what
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  whatsapp_number TEXT,           -- E.164 format, e.g., +966501234567
  preferred_lang TEXT DEFAULT 'en',
  twilio_opted_in_at TIMESTAMPTZ, -- only send WhatsApp after this is set
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- routes: a single watch directive
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  origin_iata TEXT NOT NULL,       -- "DMM"
  destination_iata TEXT NOT NULL,  -- "BOM"
  origin_label TEXT,               -- "Khobar"
  destination_label TEXT,          -- "Mumbai"
  depart_window_start DATE,        -- flexible date range start
  depart_window_end DATE,
  return_window_start DATE,        -- nullable for one-way
  return_window_end DATE,
  passengers INT DEFAULT 1,
  cabin TEXT DEFAULT 'economy',
  target_price_sar NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'active',    -- 'active' | 'paused' | 'archived'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_routes_user_status ON routes(user_id, status);
CREATE INDEX idx_routes_active ON routes(status) WHERE status = 'active';

-- price_history: one row per check, used for baseline reasoning
CREATE TABLE price_history (
  id BIGSERIAL PRIMARY KEY,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  best_price_sar NUMERIC(10,2) NOT NULL,
  airline TEXT,
  stops INT,                       -- 0 = direct
  depart_date DATE,
  return_date DATE,
  raw_offer JSONB,                 -- full offer for later inspection
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_history_route_time ON price_history(route_id, fetched_at DESC);

-- alerts: dedupe + audit log
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  price_sar NUMERIC(10,2) NOT NULL,
  vs_baseline_pct NUMERIC(6,2),    -- e.g., -23.4
  reasoning_text TEXT,             -- LLM-composed reasoning shown to user
  whatsapp_sid TEXT,               -- Twilio message SID for delivery confirmation
  delivered BOOLEAN DEFAULT FALSE,
  user_action TEXT                 -- 'booked' | 'snoozed' | 'ignored' | null
);

CREATE INDEX idx_alerts_route ON alerts(route_id, triggered_at DESC);

-- arbitrage_finds: alternative itinerary constructions per route
CREATE TABLE arbitrage_finds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,              -- 'split' | 'open_jaw' | 'multi_airline' | 'date_ladder' | 'adjacent_airport'
  total_price_sar NUMERIC(10,2) NOT NULL,
  savings_sar NUMERIC(10,2) NOT NULL,         -- positive number = SAR saved vs direct
  savings_pct NUMERIC(6,2) NOT NULL,
  legs JSONB NOT NULL,             -- array of { airline, from, to, depart_date, price_sar, booking_url }
  warnings JSONB,                  -- e.g. visa-on-arrival, transit time, baggage rules
  reasoning TEXT,                  -- LLM-composed why this is a good find
  found_at TIMESTAMPTZ DEFAULT NOW(),
  is_current BOOLEAN DEFAULT TRUE  -- false once a newer find supersedes
);

CREATE INDEX idx_arbitrage_route_current ON arbitrage_finds(route_id, is_current) WHERE is_current;

-- connection_cities: which airports are reasonable transit hubs + visa info
CREATE TABLE connection_cities (
  iata TEXT PRIMARY KEY,
  city_name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  is_major_hub BOOLEAN DEFAULT FALSE,
  -- nationality_code -> { visa_on_arrival: bool, transit_visa_required: bool, max_transit_hrs: int }
  visa_rules JSONB DEFAULT '{}'::jsonb
);

-- Seed common transit hubs for Saudi expats (run after schema creation):
INSERT INTO connection_cities (iata, city_name, country_code, is_major_hub, visa_rules) VALUES
  ('DXB', 'Dubai',     'AE', TRUE, '{"IN":{"visa_on_arrival":false,"transit_visa_required":false,"max_transit_hrs":8},"PH":{"visa_on_arrival":false,"transit_visa_required":false,"max_transit_hrs":8},"PK":{"visa_on_arrival":false,"transit_visa_required":false,"max_transit_hrs":8},"EG":{"visa_on_arrival":false,"transit_visa_required":false,"max_transit_hrs":8},"BD":{"visa_on_arrival":false,"transit_visa_required":false,"max_transit_hrs":8}}'::jsonb),
  ('DOH', 'Doha',      'QA', TRUE, '{"IN":{"transit_visa_required":false,"max_transit_hrs":12},"PH":{"transit_visa_required":false,"max_transit_hrs":12},"PK":{"transit_visa_required":false,"max_transit_hrs":12}}'::jsonb),
  ('AUH', 'Abu Dhabi', 'AE', TRUE, '{"IN":{"transit_visa_required":false,"max_transit_hrs":8},"PH":{"transit_visa_required":false,"max_transit_hrs":8},"PK":{"transit_visa_required":false,"max_transit_hrs":8}}'::jsonb),
  ('SHJ', 'Sharjah',   'AE', FALSE,'{"IN":{"transit_visa_required":false,"max_transit_hrs":6},"PH":{"transit_visa_required":false,"max_transit_hrs":6},"PK":{"transit_visa_required":false,"max_transit_hrs":6}}'::jsonb),
  ('IST', 'Istanbul',  'TR', TRUE, '{"IN":{"transit_visa_required":false,"max_transit_hrs":24}}'::jsonb),
  ('CAI', 'Cairo',     'EG', TRUE, '{}'::jsonb),
  ('AMM', 'Amman',     'JO', TRUE, '{}'::jsonb),
  ('KWI', 'Kuwait',    'KW', TRUE, '{}'::jsonb);

-- research_sessions: log of chat-mode research tasks
CREATE TABLE research_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_query TEXT NOT NULL,
  user_lang TEXT NOT NULL,
  agent_steps JSONB,               -- [{step, tool, args, result_summary}]
  final_recommendation JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Hour 2:30 → 4:00 — Travelpayouts integration

Travelpayouts is the easiest free price source for MEA routes. Sign up, get your API token, set as `TRAVELPAYOUTS_TOKEN` env var.

```bash
pnpm add @travelpayouts/sdk axios
```

Wrapper at `lib/prices/travelpayouts.ts`:

```typescript
import axios from 'axios';

const TOKEN = process.env.TRAVELPAYOUTS_TOKEN!;

export interface PriceQuote {
  price_sar: number;
  airline: string;
  stops: number;
  depart_date: string;
  return_date?: string;
  raw: any;
}

// Convert API response (often in USD) to SAR using rough rate; for hackathon
// this is fine. Production: pull live FX from openexchangerates.
const USD_TO_SAR = 3.75;

export async function fetchCheapestPrices(args: {
  origin: string;
  destination: string;
  depart_window_start: string; // YYYY-MM-DD
  depart_window_end: string;
  return_window_start?: string;
  return_window_end?: string;
  passengers?: number;
}): Promise<PriceQuote[]> {
  const url = 'https://api.travelpayouts.com/v2/prices/latest';
  const { data } = await axios.get(url, {
    params: {
      currency: 'usd',
      origin: args.origin,
      destination: args.destination,
      beginning_of_period: args.depart_window_start,
      period_type: 'month',
      one_way: !args.return_window_start,
      token: TOKEN,
      limit: 30,
    },
  });

  return (data.data || []).map((row: any) => ({
    price_sar: Math.round(row.value * USD_TO_SAR),
    airline: row.gate || row.airline || 'unknown',
    stops: row.number_of_changes ?? 0,
    depart_date: row.depart_date,
    return_date: row.return_date,
    raw: row,
  }));
}
```

Test with one real call before moving on:

```bash
curl "https://api.travelpayouts.com/v2/prices/latest?currency=usd&origin=DMM&destination=BOM&token=$TRAVELPAYOUTS_TOKEN&limit=5"
```

If MEA coverage is thin, fallback in hour 4: pivot to SerpAPI's Google Flights wrapper (free trial covers the hackathon).

---

## Hour 4:00 → 6:00 — Vercel Workflow setup (the agent loop)

The Workflow runs every 30 minutes per active route. Each invocation is the agent.

`workflows/watch-route.ts`:

```typescript
import { defineWorkflow, step } from '@vercel/workflow';
import { neon } from '@neondatabase/serverless';
import { fetchCheapestPrices } from '@/lib/prices/travelpayouts';
import { evaluateSignal } from '@/lib/agent/signal';
import { composeAlert } from '@/lib/agent/compose';
import { sendWhatsApp } from '@/lib/notify/twilio';

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
    for (const route of routes) {
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

        if (!decision.should_alert) return;

        // 2e. Dedupe: don't alert if we sent one in last 12h
        const [recent] = await sql`
          SELECT 1 FROM alerts
          WHERE route_id = ${route.id} AND triggered_at >= NOW() - INTERVAL '12 hours'
          LIMIT 1;
        `;
        if (recent) return;

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
      });
    }
  },
});
```

The two LLM-in-the-loop functions live in `lib/agent/`:

`lib/agent/signal.ts`:

```typescript
import { generateObject } from 'ai';
import { gateway } from '@/lib/ai-gateway';
import { z } from 'zod';

const Decision = z.object({
  should_alert: z.boolean(),
  vs_baseline_pct: z.number().describe('Negative if cheaper than baseline'),
  confidence: z.enum(['low', 'medium', 'high']),
  reasoning: z.string().describe('One sentence on why this is or is not alert-worthy'),
});

export async function evaluateSignal(input: {
  current_price: number;
  target_price: number;
  baseline_avg?: number;
  baseline_min?: number;
  route_label: string;
}) {
  const { object } = await generateObject({
    model: gateway('anthropic/claude-sonnet-4.6'),
    schema: Decision,
    prompt: `You are a flight price scout. The user wants to be alerted only when there is a real opportunity to book this route — not on routine fluctuations.

Route: ${input.route_label}
Current best price: SAR ${input.current_price}
User's target price: SAR ${input.target_price}
30-day average: SAR ${input.baseline_avg ?? 'unknown'}
30-day minimum: SAR ${input.baseline_min ?? 'unknown'}

Decide:
1. Is the current price below the user's target? (necessary)
2. Is the current price meaningfully below the 30-day average? (signal vs noise)
3. Is the current price near the 30-day minimum? (likely a genuine deal)

Be conservative — false alerts erode trust. Only return should_alert=true when at least conditions 1+2 are clearly met.`,
  });
  return object;
}
```

`lib/agent/compose.ts`:

```typescript
import { generateText } from 'ai';
import { gateway } from '@/lib/ai-gateway';

export async function composeAlert(args: {
  route: any;
  quote: any;
  decision: any;
  lang: 'en' | 'ar';
}) {
  const { text } = await generateText({
    model: gateway('google/gemini-3-flash'),
    prompt: `Write a short WhatsApp message in ${args.lang === 'ar' ? 'Arabic' : 'English'} alerting the user to a flight deal.

Route: ${args.route.origin_label} → ${args.route.destination_label}
Current price: SAR ${args.quote.price_sar} (${args.quote.airline}, ${args.quote.stops} stops)
Target: SAR ${args.route.target_price_sar}
Reasoning: ${args.decision.reasoning}

Format:
- Start with ✈️ + route name
- One line on the price + how much below baseline
- One line on the airline + stops
- End with: "Tap to book → [link]"
Keep it under 60 words. Friendly, factual, no marketing fluff.`,
  });
  return text;
}
```

`lib/notify/twilio.ts`:

```typescript
import twilio from 'twilio';
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function sendWhatsApp(toE164: string, body: string): Promise<string> {
  const msg = await client.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`, // sandbox: 'whatsapp:+14155238886'
    to: `whatsapp:${toE164}`,
    body,
  });
  return msg.sid;
}
```

---

## Hour 6:00 → 9:00 — Arbitrage discovery module (THE wedge)

This is the feature that distinguishes Tayyara from every existing price-alert tool. The agent autonomously constructs alternative itineraries that booking sites won't show.

### Five arbitrage strategies (implement in this order, ship what fits)

1. **Date-ladder** *(easiest, ship in hour 6)* — for the user's flexible window, search ±3 days around the optimum and surface "Leave Tuesday not Wednesday: SAR -380."
2. **Split via hub** *(highest-impact, ship in hour 7)* — origin → hub on airline A + hub → destination on airline B as two separate tickets. Compare to direct.
3. **Open-jaw** *(ship in hour 8)* — outbound to city X, return from city Y in same country/region. Often cheaper than round-trip when secondary cities have fare imbalances.
4. **Adjacent-airport** *(ship in hour 8 if time)* — fly into Sharjah instead of Dubai + ground transfer; surface real total cost+time.
5. **Multi-airline same-route** *(stretch goal hour 9)* — outbound on Saudia, return on Etihad, etc.

### `lib/arbitrage/discover.ts`

```typescript
import { fetchCheapestPrices, PriceQuote } from '@/lib/prices/travelpayouts';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export interface ArbitrageFind {
  kind: 'split' | 'open_jaw' | 'multi_airline' | 'date_ladder' | 'adjacent_airport';
  total_price_sar: number;
  savings_sar: number;
  savings_pct: number;
  legs: Array<{ airline: string; from: string; to: string; depart_date: string; price_sar: number }>;
  warnings: string[];
}

export async function discoverArbitrage(args: {
  origin: string;
  destination: string;
  depart_window_start: string;
  depart_window_end: string;
  return_window_start?: string;
  return_window_end?: string;
  passengers: number;
  user_nationality?: string; // e.g. 'IN' for visa rule lookups
  direct_baseline_sar: number; // for savings calc
}): Promise<ArbitrageFind[]> {
  const finds: ArbitrageFind[] = [];

  // 1. Date ladder
  const dateOptions = await fetchCheapestPrices(args);
  if (dateOptions.length > 1) {
    const cheapest = dateOptions.reduce((a,b) => a.price_sar < b.price_sar ? a : b);
    if (cheapest.price_sar < args.direct_baseline_sar - 100) {
      finds.push({
        kind: 'date_ladder',
        total_price_sar: cheapest.price_sar,
        savings_sar: args.direct_baseline_sar - cheapest.price_sar,
        savings_pct: ((args.direct_baseline_sar - cheapest.price_sar) / args.direct_baseline_sar) * 100,
        legs: [{ airline: cheapest.airline, from: args.origin, to: args.destination,
                 depart_date: cheapest.depart_date, price_sar: cheapest.price_sar }],
        warnings: [],
      });
    }
  }

  // 2. Split via hub — try each major hub as connection point
  const hubs = await sql`SELECT iata, city_name, visa_rules FROM connection_cities WHERE is_major_hub = TRUE;`;
  for (const hub of hubs) {
    if (hub.iata === args.origin || hub.iata === args.destination) continue;

    const [outbound, inbound] = await Promise.all([
      fetchCheapestPrices({ ...args, destination: hub.iata, return_window_start: undefined, return_window_end: undefined }),
      fetchCheapestPrices({ ...args, origin: hub.iata, depart_window_start: args.depart_window_start, depart_window_end: args.depart_window_end }),
    ]);

    if (!outbound.length || !inbound.length) continue;
    const ob = outbound.reduce((a,b) => a.price_sar < b.price_sar ? a : b);
    const ib = inbound.reduce((a,b) => a.price_sar < b.price_sar ? a : b);
    const total = ob.price_sar + ib.price_sar;

    if (total < args.direct_baseline_sar - 200) {
      const warnings: string[] = [];
      // Visa check
      if (args.user_nationality) {
        const vr = (hub.visa_rules as any)?.[args.user_nationality];
        if (vr?.transit_visa_required) warnings.push(`Transit visa required at ${hub.city_name}`);
      }
      // Transit time check (need ≥3 hrs gap; here we don't have flight times, so just flag)
      warnings.push(`Self-transfer at ${hub.city_name} — book ≥6hr gap, separate baggage check-in`);

      finds.push({
        kind: 'split',
        total_price_sar: total,
        savings_sar: args.direct_baseline_sar - total,
        savings_pct: ((args.direct_baseline_sar - total) / args.direct_baseline_sar) * 100,
        legs: [
          { airline: ob.airline, from: args.origin, to: hub.iata, depart_date: ob.depart_date, price_sar: ob.price_sar },
          { airline: ib.airline, from: hub.iata, to: args.destination, depart_date: ib.depart_date, price_sar: ib.price_sar },
        ],
        warnings,
      });
    }
  }

  // 3. Open-jaw — return from a different city (simple version: try 2-3 alternates per destination region)
  // TODO hour 8

  // 4. Adjacent airport — try DXB ↔ SHJ swap
  // TODO hour 8

  // Sort by savings, return top 3
  return finds.sort((a,b) => b.savings_sar - a.savings_sar).slice(0, 3);
}
```

### Wire arbitrage into the workflow loop

In `workflows/watch-route.ts`, after fetching the direct cheapest:

```typescript
// 2c-bis. Discover arbitrage
const finds = await step(`arbitrage-${route.id}`, async () => {
  return await discoverArbitrage({
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
  if (f.savings_pct >= 15 && !await wasAlertedRecently(route.id, f.kind)) {
    const message = await composeArbitrageAlert({ route, find: f });
    const sid = await sendWhatsApp(route.whatsapp_number, message);
    await sql`
      INSERT INTO alerts (route_id, price_sar, vs_baseline_pct, reasoning_text, whatsapp_sid, delivered)
      VALUES (${route.id}, ${f.total_price_sar}, ${-f.savings_pct}, ${f.warnings.join('; ')}, ${sid}, TRUE);
    `;
  }
}
```

### `lib/agent/composeArbitrage.ts`

```typescript
import { generateText } from 'ai';
import { gateway } from '@/lib/ai-gateway';

export async function composeArbitrageAlert(args: { route: any; find: any }) {
  const { text } = await generateText({
    model: gateway('google/gemini-3-flash'),
    prompt: `Write a short WhatsApp message in ${args.route.preferred_lang === 'ar' ? 'Arabic' : 'English'} alerting the user to a flight deal that booking sites won't normally show them.

Route the user is watching: ${args.route.origin_label} → ${args.route.destination_label}
Type of find: ${args.find.kind}  (split = two separate tickets via a hub; open_jaw = return from a different city; date_ladder = saved by shifting dates)
Total price: SAR ${args.find.total_price_sar}
Savings vs. direct: SAR ${args.find.savings_sar} (${args.find.savings_pct.toFixed(0)}%)
Legs: ${JSON.stringify(args.find.legs)}
Warnings: ${args.find.warnings.join('; ')}

Format:
- Open with the relevant emoji (✂️ split, 🔀 open-jaw, 📅 date-ladder, 🛫 adjacent)
- One-line headline of what was found and savings
- One line on each leg
- One line on the catch (warnings)
- Close with: "Tap to see the booking links"
Keep under 80 words. Direct, useful tone — you're a travel hacker friend, not a sales pitch.`,
  });
  return text;
}
```

---

## Hour 9:00 → 11:00 — The research-mode chat (the second agent face)

`app/api/research/route.ts`:

```typescript
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { gateway } from '@/lib/ai-gateway';
import { fetchCheapestPrices } from '@/lib/prices/travelpayouts';

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, lang = 'en' } = await req.json();

  const result = streamText({
    model: gateway('anthropic/claude-sonnet-4.6'),
    system: `You are Tayyara's research agent. The user delegates flight-research tasks to you.

Plan multi-step research: search across airlines, date variants, route variants (direct vs. via Dubai/Doha/Istanbul). Reason about trade-offs (price vs. duration vs. airline reputation). Return a ranked recommendation with clear reasoning.

Reply in ${lang === 'ar' ? 'Arabic' : 'English'} matching the user's language.

Always end your response with up to 3 ranked options as a structured list, each with: route, dates, airline, price, one-line trade-off note.`,
    messages,
    tools: {
      search_flights: tool({
        description: 'Search flight prices for a route + date range. Call multiple times to compare alternatives.',
        inputSchema: z.object({
          origin: z.string().describe('IATA airport code'),
          destination: z.string().describe('IATA airport code'),
          depart_window_start: z.string(),
          depart_window_end: z.string(),
          return_window_start: z.string().optional(),
          return_window_end: z.string().optional(),
          passengers: z.number().default(1),
        }),
        execute: fetchCheapestPrices,
      }),
      // Add more tools as needed: weather, school_holidays, etc.
    },
    stopWhen: ({ steps }) => steps.length >= 8,
  });

  return result.toDataStreamResponse();
}
```

---

## Hour 11:00 → 13:00 — Wire the dashboard to live data + onboarding

- Replace v0's mock data with `GET /api/routes` returning the user's active routes from Neon
- Each card's price + sparkline pulls from `price_history`
- "+ Add a new route" opens a small modal that calls `POST /api/routes` and immediately triggers a one-off `watch-route` workflow run for the new route so the card populates within 5 seconds
- On first visit, show a one-time onboarding modal: "Enter your WhatsApp number → Twilio sandbox join instructions → confirm" — this is your judge-facing demo flow

Skip auth entirely for the hackathon. Use a single anonymous session ID stored in `localStorage`. Comment in the code: `// TODO: real auth post-hackathon`.

---

## Hours 13 → 24 — From kit to demo (tightened for Option B scope)

- Hour 13–16: end-to-end smoke test. Add a real route with a high target so a basic alert fires. Then add a real route where you know an arbitrage exists (Riyadh→Manila is the classic — split via Doha is reliably cheaper) and verify the arbitrage path: workflow runs → discovers split → composes alert → WhatsApp arrives with the multi-leg breakdown.
- Hour 16–18: build the visible "Agent reasoning" panel on the research chat — stream the agent's plan steps to the UI as they execute. Same panel pattern reused on the dashboard cards when an arbitrage find is recomputed. **This is the demo wow.**
- Hour 18–20: polish the dashboard — arbitrage badges expand cleanly, sparklines look right, RTL works, mobile passes.
- Hour 20–22: skip the marketing landing page. Use the dashboard as the landing. Add ONE hero strip at the top: "Your AI travel hacker — finds deals booking sites won't show you." Below it, the live dashboard. That's enough.
- Hour 22: kill-point #2. Ship now even if multi-airline / adjacent-airport arbitrage strategies aren't done. Date-ladder + split-via-hub + open-jaw is sufficient differentiation.
- Hours 23–24: record the 60-sec demo, write the showcase post (use the judge-bait sentence below), submit before May 4 14:59 MYT.

---

## Showcase post — judge-bait sentence

> *"Tayyara is your AI travel hacker — built on Vercel Workflow Development Kit. A durable async agent runs every 30 minutes per watched route and **constructs flight deals booking sites won't show you**: split tickets across airlines via Dubai/Doha, open-jaw routes, date-ladder savings. Per cycle the agent calls Travelpayouts across multiple leg combinations, queries a transit-visa table, uses Claude Sonnet 4.6 to decide whether a find is alert-worthy vs. baseline noise, and pushes the multi-leg itinerary to WhatsApp via Twilio. A second AI SDK agent face handles on-demand research over the same data. Built for the 13M+ expats in Saudi Arabia who fly home every summer — voting playbook lives on @saudi_united (89K) and @saudi.insider (24K)."*

That sentence tells judges: WDK done correctly, multi-tool, durable, real LLM-in-the-loop reasoning, **a feature Trip.com / Hopper structurally cannot offer because it breaks their commission model**, and a Saudi audience moat. Five-second decision in your favor.

---

## What NOT to build (anti-scope creep)

- ❌ User accounts / login. Anonymous session ID is fine.
- ❌ Booking integration. Tayyara is a watcher, not an OTA. Link to airline site, that's enough.
- ❌ Hotel / car / package monitoring. Future scope.
- ❌ Email alerts. WhatsApp only.
- ❌ Multi-region. One Vercel deployment in fra1, one Neon in eu-central-1.
- ❌ Localizing into more than EN + AR. Ship two languages, not five.
- ❌ Beautiful loading skeletons. Plain spinners are fine.
- ❌ Payment / subscriptions. Hackathon = free.

---

## When you hit a blocker, ping me

- v0 RTL output broken → I'll write the patch
- WDK schedule syntax confusion → I'll find the exact API
- Travelpayouts coverage thin on a route → I'll wire the SerpAPI fallback
- Twilio sandbox quirks → I'll debug the join phrase / phone format
- The research-chat agent not multi-stepping → I'll rewrite the system prompt + tool descriptions
- Demo recording / showcase post → I'll review pacing and sharpen the wording

You have ~36 hours. Ship.
