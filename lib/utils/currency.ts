export function formatCurrency(amount: number | string | null | undefined, currency: string = 'UGX'): string {
  if (amount === null || amount === undefined) return `${currency} 0`;
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return `${currency} 0`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
}

export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.-]+/g, '');
  return parseFloat(cleaned) || 0;
}

// Exchange Rate API integration
const EXCHANGE_RATE_API_URL = 'https://api.exchangerate-api.com/v4/latest';

export async function getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
  try {
    const response = await fetch(`${EXCHANGE_RATE_API_URL}/${fromCurrency}`);
    const data = await response.json();
    
    if (data.rates && data.rates[toCurrency]) {
      return data.rates[toCurrency];
    }
    
    throw new Error(`Exchange rate not available for ${toCurrency}`);
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    throw error;
  }
}

export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) return amount;
  
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
}

export async function formatWithConversion(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<{ original: string; converted: string; rate: number }> {
  const original = formatCurrency(amount, fromCurrency);
  const convertedAmount = await convertCurrency(amount, fromCurrency, toCurrency);
  const converted = formatCurrency(convertedAmount, toCurrency);
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  
  return {
    original,
    converted,
    rate,
  };
}
