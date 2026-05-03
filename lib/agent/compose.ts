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
