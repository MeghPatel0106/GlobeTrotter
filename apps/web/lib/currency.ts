/**
 * Comprehensive Country-to-Currency mapping and formatting helpers for GlobeTrotter
 */

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export const DEFAULT_CURRENCY: CurrencyInfo = {
  code: "INR",
  symbol: "₹",
  name: "Indian Rupee",
};

export const COUNTRY_CURRENCY_MAP: Record<string, CurrencyInfo> = {
  // Asia
  india: { code: "INR", symbol: "₹", name: "Indian Rupee" },
  japan: { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  "united arab emirates": { code: "AED", symbol: "AED", name: "UAE Dirham" },
  uae: { code: "AED", symbol: "AED", name: "UAE Dirham" },
  dubai: { code: "AED", symbol: "AED", name: "UAE Dirham" },
  singapore: { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  thailand: { code: "THB", symbol: "฿", name: "Thai Baht" },
  indonesia: { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  vietnam: { code: "VND", symbol: "₫", name: "Vietnamese Dong" },
  malaysia: { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  china: { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  "south korea": { code: "KRW", symbol: "₩", name: "South Korean Won" },
  korea: { code: "KRW", symbol: "₩", name: "South Korean Won" },
  "saudi arabia": { code: "SAR", symbol: "SAR", name: "Saudi Riyal" },
  qatar: { code: "QAR", symbol: "QAR", name: "Qatari Riyal" },
  oman: { code: "OMR", symbol: "OMR", name: "Omani Rial" },
  turkey: { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  turkiye: { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  nepal: { code: "NPR", symbol: "NPR", name: "Nepalese Rupee" },
  "sri lanka": { code: "LKR", symbol: "LKR", name: "Sri Lankan Rupee" },
  maldives: { code: "MVR", symbol: "Rf", name: "Maldivian Rufiyaa" },
  philippines: { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  taiwan: { code: "TWD", symbol: "NT$", name: "New Taiwan Dollar" },
  "hong kong": { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },

  // Europe
  "united kingdom": { code: "GBP", symbol: "£", name: "British Pound" },
  uk: { code: "GBP", symbol: "£", name: "British Pound" },
  england: { code: "GBP", symbol: "£", name: "British Pound" },
  scotland: { code: "GBP", symbol: "£", name: "British Pound" },
  france: { code: "EUR", symbol: "€", name: "Euro" },
  germany: { code: "EUR", symbol: "€", name: "Euro" },
  italy: { code: "EUR", symbol: "€", name: "Euro" },
  spain: { code: "EUR", symbol: "€", name: "Euro" },
  netherlands: { code: "EUR", symbol: "€", name: "Euro" },
  switzerland: { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  greece: { code: "EUR", symbol: "€", name: "Euro" },
  portugal: { code: "EUR", symbol: "€", name: "Euro" },
  austria: { code: "EUR", symbol: "€", name: "Euro" },
  belgium: { code: "EUR", symbol: "€", name: "Euro" },
  ireland: { code: "EUR", symbol: "€", name: "Euro" },
  sweden: { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  norway: { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  denmark: { code: "DKK", symbol: "kr", name: "Danish Krone" },
  iceland: { code: "ISK", symbol: "kr", name: "Icelandic Króna" },
  czechia: { code: "CZK", symbol: "Kč", name: "Czech Koruna" },
  "czech republic": { code: "CZK", symbol: "Kč", name: "Czech Koruna" },
  hungary: { code: "HUF", symbol: "Ft", name: "Hungarian Forint" },
  poland: { code: "PLN", symbol: "zł", name: "Polish Złoty" },
  croatia: { code: "EUR", symbol: "€", name: "Euro" },
  finland: { code: "EUR", symbol: "€", name: "Euro" },

  // Americas
  "united states": { code: "USD", symbol: "$", name: "US Dollar" },
  usa: { code: "USD", symbol: "$", name: "US Dollar" },
  us: { code: "USD", symbol: "$", name: "US Dollar" },
  america: { code: "USD", symbol: "$", name: "US Dollar" },
  canada: { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  mexico: { code: "MXN", symbol: "Mex$", name: "Mexican Peso" },
  brazil: { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  argentina: { code: "ARS", symbol: "ARS$", name: "Argentine Peso" },
  colombia: { code: "COP", symbol: "COL$", name: "Colombian Peso" },
  peru: { code: "PEN", symbol: "S/", name: "Peruvian Sol" },
  chile: { code: "CLP", symbol: "CLP$", name: "Chilean Peso" },
  "costa rica": { code: "CRC", symbol: "₡", name: "Costa Rican Colón" },

  // Oceania
  australia: { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  "new zealand": { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  fiji: { code: "FJD", symbol: "FJ$", name: "Fijian Dollar" },

  // Africa
  "south africa": { code: "ZAR", symbol: "R", name: "South African Rand" },
  egypt: { code: "EGP", symbol: "E£", name: "Egyptian Pound" },
  morocco: { code: "MAD", symbol: "MAD", name: "Moroccan Dirham" },
  kenya: { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  tanzania: { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling" },
  mauritius: { code: "MUR", symbol: "Rs", name: "Mauritian Rupee" },
};

// Also map direct currency codes (e.g. "USD" -> "$", "EUR" -> "€", "GBP" -> "£", "INR" -> "₹")
export const CODE_CURRENCY_MAP: Record<string, CurrencyInfo> = {
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee" },
  USD: { code: "USD", symbol: "$", name: "US Dollar" },
  EUR: { code: "EUR", symbol: "€", name: "Euro" },
  GBP: { code: "GBP", symbol: "£", name: "British Pound" },
  JPY: { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  AED: { code: "AED", symbol: "AED", name: "UAE Dirham" },
  SGD: { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  THB: { code: "THB", symbol: "฿", name: "Thai Baht" },
  AUD: { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  CAD: { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  CHF: { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  IDR: { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  VND: { code: "VND", symbol: "₫", name: "Vietnamese Dong" },
  MYR: { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  CNY: { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  KRW: { code: "KRW", symbol: "₩", name: "South Korean Won" },
  NZD: { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  ZAR: { code: "ZAR", symbol: "R", name: "South African Rand" },
  TRY: { code: "TRY", symbol: "₺", name: "Turkish Lira" },
};

export function getCurrencyForCountry(countryOrCurrency?: string | null): CurrencyInfo {
  if (!countryOrCurrency) {
    return DEFAULT_CURRENCY;
  }
  const clean = countryOrCurrency.trim().toUpperCase();
  if (CODE_CURRENCY_MAP[clean]) {
    return CODE_CURRENCY_MAP[clean];
  }

  const normalized = countryOrCurrency.trim().toLowerCase();
  if (COUNTRY_CURRENCY_MAP[normalized]) {
    return COUNTRY_CURRENCY_MAP[normalized];
  }

  // Substring match
  for (const [key, value] of Object.entries(COUNTRY_CURRENCY_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  return DEFAULT_CURRENCY;
}

export function getCurrencySymbol(countryOrCurrency?: string | null): string {
  return getCurrencyForCountry(countryOrCurrency).symbol;
}

export function formatMoney(
  amount: number | null | undefined,
  countryOrCurrency?: string | null
): string {
  if (amount == null) return "0";
  const curr = getCurrencyForCountry(countryOrCurrency);
  return `${curr.symbol}${amount.toLocaleString()}`;
}
