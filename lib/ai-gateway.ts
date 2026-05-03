import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// In a real Vercel environment, you might use the explicit Vercel AI Gateway URL as baseURL.
// Here we are creating a custom router function `gateway()` that mimics it.
export function gateway(modelId: string) {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    throw new Error('AI_GATEWAY_API_KEY is not defined');
  }

  if (modelId.startsWith('anthropic/')) {
    const anthropic = createAnthropic({ apiKey }); // AI Gateway handles routing
    return anthropic(modelId.replace('anthropic/', ''));
  }

  if (modelId.startsWith('google/')) {
    const google = createGoogleGenerativeAI({ apiKey }); // AI Gateway handles routing
    return google(modelId.replace('google/', ''));
  }

  throw new Error(`Unsupported model ID format for gateway: ${modelId}`);
}
