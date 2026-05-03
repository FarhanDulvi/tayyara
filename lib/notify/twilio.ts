import twilio from 'twilio';

// Use the environment variables from .env.local
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Initialize only if credentials are provided (prevents crash on build if missing)
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export async function sendWhatsApp(toE164: string, body: string): Promise<string> {
  if (!client) {
    throw new Error('Twilio client is not initialized. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.');
  }

  const msg = await client.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`, // sandbox: e.g. 'whatsapp:+14155238886'
    to: `whatsapp:${toE164}`,
    body,
  });
  return msg.sid;
}
