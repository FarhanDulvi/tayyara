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
