import { generateText } from 'ai';
import { gateway } from '../ai-gateway';

const KIND_EMOJI: Record<string, string> = {
  split: '✂️',
  open_jaw: '🔀',
  date_ladder: '📅',
  adjacent_airport: '🛫',
  multi_airline: '🔄',
};

export async function composeArbitrageAlert(args: { route: any; find: any }) {
  const emoji = KIND_EMOJI[args.find.kind] || '💡';
  const lang = args.route.preferred_lang === 'ar' ? 'Arabic' : 'English';

  const { text } = await generateText({
    model: gateway('google/gemini-3-flash'),
    prompt: `Write a short WhatsApp message in ${lang} alerting the user to a flight deal that booking sites won't normally show them.

Route the user is watching: ${args.route.origin_label} → ${args.route.destination_label}
Type of find: ${args.find.kind}  (split = two separate tickets via a hub; open_jaw = return from a different city; date_ladder = saved by shifting dates; adjacent_airport = fly from/into a nearby airport)
Total price: SAR ${args.find.total_price_sar}
Savings vs. direct: SAR ${args.find.savings_sar} (${args.find.savings_pct.toFixed(0)}%)
Legs: ${JSON.stringify(args.find.legs)}
Warnings: ${args.find.warnings.join('; ')}

Format:
- Open with ${emoji} + route name
- One-line headline of what was found and savings %
- One line on each leg
- One line on the catch (warnings)
- Close with: "Tap to see the booking links"
Keep under 80 words. Direct, useful tone — you're a travel hacker friend, not a sales pitch.`,
  });
  return text;
}
