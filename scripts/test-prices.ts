import * as dotenv from 'dotenv';
import { fetchCheapestPrices } from '../lib/prices/travelpayouts';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 4) {
    console.error('Usage: pnpm tsx scripts/test-prices.ts <origin> <destination> <depart_start> <depart_end>');
    console.error('Example: pnpm tsx scripts/test-prices.ts DMM BOM 2026-07-01 2026-07-31');
    process.exit(1);
  }

  const [origin, destination, depart_window_start, depart_window_end] = args;

  console.log(`Fetching cheapest prices for ${origin} to ${destination} between ${depart_window_start} and ${depart_window_end}...`);

  try {
    const quotes = await fetchCheapestPrices({
      origin,
      destination,
      depart_window_start,
      depart_window_end,
      passengers: 1
    });

    console.log(`\nFound ${quotes.length} total quotes matching the criteria.\n`);
    
    // Print top 3 cheapest
    const top3 = quotes.slice(0, 3);
    if (top3.length === 0) {
      console.log('No quotes found.');
      return;
    }

    console.log('Top 3 Cheapest Quotes:');
    top3.forEach((quote, index) => {
      console.log(`\n#${index + 1}`);
      console.log(`Price: ${quote.price_sar} SAR`);
      console.log(`Airline: ${quote.airline}`);
      console.log(`Stops: ${quote.stops}`);
      console.log(`Depart Date: ${quote.depart_date}`);
      if (quote.return_date) {
        console.log(`Return Date: ${quote.return_date}`);
      }
    });
  } catch (error: any) {
    console.error('Error fetching prices:', error.message);
  }
}

main();
