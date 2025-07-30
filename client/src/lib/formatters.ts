/**
 * Financial formatting utilities for Prime Edge Finance Bank
 * Ensures consistent currency and number formatting across the application
 */

/**
 * Formats a number as USD currency with proper localization
 * @param amount - The amount to format
 * @param showCents - Whether to show cents (default: true)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, showCents: boolean = true): string => {
  if (isNaN(amount)) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(amount);
};

/**
 * Formats a number with proper thousand separators
 * @param num - The number to format
 * @returns Formatted number string
 */
export const formatNumber = (num: number): string => {
  if (isNaN(num)) return '0';
  
  return new Intl.NumberFormat('en-US').format(num);
};

/**
 * Formats a large currency amount with appropriate suffix (K, M, B)
 * @param amount - The amount to format
 * @returns Formatted currency string with suffix
 */
export const formatCompactCurrency = (amount: number): string => {
  if (isNaN(amount)) return '$0';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount);
};

/**
 * Formats a percentage with proper precision
 * @param value - The percentage value (as decimal, e.g., 0.15 for 15%)
 * @param precision - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, precision: number = 1): string => {
  if (isNaN(value)) return '0%';
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);
};

/**
 * Formats an account number with masking for security
 * @param accountNumber - The full account number
 * @param visibleDigits - Number of digits to show at the end (default: 4)
 * @returns Masked account number string
 */
export const formatAccountNumber = (accountNumber: string, visibleDigits: number = 4): string => {
  if (!accountNumber) return '••••••0000';
  
  // Extract only numeric digits
  const numericOnly = accountNumber.replace(/[^0-9]/g, '');
  
  if (numericOnly.length < visibleDigits) {
    // If not enough digits, use default
    return '••••••0000';
  }
  
  const lastDigits = numericOnly.slice(-visibleDigits);
  const maskLength = Math.max(6, numericOnly.length - visibleDigits);
  const mask = '•'.repeat(maskLength);
  
  return mask + lastDigits;
};

/**
 * Formats a date for financial contexts (transactions, statements, etc.)
 * @param date - The date to format
 * @param includeTime - Whether to include time (default: false)
 * @returns Formatted date string
 */
export const formatFinancialDate = (date: Date | string, includeTime: boolean = false): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  
  const formattedDate = new Intl.DateTimeFormat('en-US', dateOptions).format(dateObj);
  
  if (includeTime) {
    const formattedTime = new Intl.DateTimeFormat('en-US', timeOptions).format(dateObj);
    return `${formattedDate} at ${formattedTime}`;
  }
  
  return formattedDate;
};

/**
 * Formats a transaction amount with proper sign and color indication
 * @param amount - The transaction amount
 * @param type - Transaction type ('CREDIT' or 'DEBIT')
 * @returns Object with formatted amount and styling info
 */
export const formatTransactionAmount = (amount: number, type: 'CREDIT' | 'DEBIT') => {
  const formattedAmount = formatCurrency(Math.abs(amount));
  const sign = type === 'CREDIT' ? '+' : '-';
  const colorClass = type === 'CREDIT' ? 'text-green-400' : 'text-red-400';
  
  return {
    display: `${sign}${formattedAmount}`,
    amount: formattedAmount,
    sign,
    colorClass,
    isPositive: type === 'CREDIT',
  };
};