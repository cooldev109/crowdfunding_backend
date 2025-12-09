/**
 * Backend Currency Configuration
 * Change currency settings here for backend operations
 */

// Currency Configuration
export const CURRENCY_CONFIG = {
  // Main currency code
  code: 'COP' as const,
} as const;

// Supported currencies
export const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'BRL', 'INR', 'MXN', 'SGD'
] as const;

export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];
