import axios from 'axios';

export interface PriceQuoteArgs {
  origin: string;
  destination: string;
  depart_window_start: string; // YYYY-MM-DD
  depart_window_end: string;   // YYYY-MM-DD
  return_window_start?: string;
  return_window_end?: string;
  passengers?: number;
}

export interface PriceQuote {
  price_sar: number;
  airline: string;
  stops: number;
  depart_date: string;
  return_date?: string;
  raw: any;
}

export async function fetchCheapestPrices(args: PriceQuoteArgs): Promise<PriceQuote[]> {
  const token = process.env.TRAVELPAYOUTS_TOKEN;
  if (!token) {
    throw new Error('TRAVELPAYOUTS_TOKEN is not defined in environment variables');
  }

  // The latest prices API usually takes x-access-token header
  // Docs: https://travelpayouts.github.io/slate/#latest-prices
  const response = await axios.get('https://api.travelpayouts.com/v2/prices/latest', {
    headers: {
      'x-access-token': token,
    },
    params: {
      origin: args.origin,
      destination: args.destination,
      currency: 'usd',
      limit: 1000,
      beginning_of_period: args.depart_window_start, // Helps narrow down
    },
  });

  if (!response.data || !response.data.success) {
    throw new Error('Failed to fetch from Travelpayouts API');
  }

  const quotes: PriceQuote[] = [];
  const rawData = response.data.data || [];

  for (const item of rawData) {
    const departDate = item.depart_date; // typically "YYYY-MM-DD"
    const returnDate = item.return_date; 
    
    // Filter by departure window
    if (departDate < args.depart_window_start || departDate > args.depart_window_end) {
      continue;
    }

    // Filter by return window if provided
    if (args.return_window_start && args.return_window_end) {
      if (!returnDate) continue;
      if (returnDate < args.return_window_start || returnDate > args.return_window_end) {
        continue;
      }
    }

    // Convert USD to SAR (rate 3.75)
    // Travelpayouts 'latest' API returns `value` as the price
    const usdPrice = item.value;
    const sarPrice = Math.round(usdPrice * 3.75 * 100) / 100;

    // Multiply by passengers if applicable
    const totalPassengers = args.passengers || 1;
    const finalPriceSar = sarPrice * totalPassengers;

    quotes.push({
      price_sar: finalPriceSar,
      airline: item.gate || item.airline || 'Unknown', // `gate` or `airline` depending on API spec
      stops: item.number_of_changes || 0,
      depart_date: departDate,
      return_date: returnDate,
      raw: item,
    });
  }

  // Sort by cheapest
  quotes.sort((a, b) => a.price_sar - b.price_sar);

  return quotes;
}
