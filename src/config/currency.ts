/**
 * Backend Currency Configuration
 * Change currency settings here for backend operations
 */

// Currency Configuration
export const CURRENCY_CONFIG = {
  // Main currency code (must match Stripe supported currencies)
  code: 'USD' as const,

  // Stripe uses lowercase
  stripeCode: 'usd' as const,
} as const;

// Supported currencies
export const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'BRL', 'INR', 'MXN', 'SGD'
] as const;

export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];
