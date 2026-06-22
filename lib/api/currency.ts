import { getExchangeRate, convertCurrency } from '../utils/currency';

// Cache exchange rates to avoid repeated API calls
const rateCache = new Map<string, { rate: number; timestamp: number }>();
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

export async function getCachedExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
  const cacheKey = `${fromCurrency}_${toCurrency}`;
  const cached = rateCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.rate;
  }
  
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  rateCache.set(cacheKey, { rate, timestamp: Date.now() });
  
  return rate;
}

export async function convertWithCache(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) return amount;
  
  const rate = await getCachedExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
}

export function clearRateCache(): void {
  rateCache.clear();
}
