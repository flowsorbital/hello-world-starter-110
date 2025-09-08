// Currency conversion utility
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  return `$${amount.toLocaleString('en-US')}`;
};

// Convert USD to INR (approximate rate, should be updated with real-time rates)
export const convertToINR = (usdAmount: number): number => {
  const exchangeRate = 83; // Approximate USD to INR rate
  return Math.round(usdAmount * exchangeRate);
};

// Format cost for display (converts to INR if needed)
export const formatCost = (amount: number, fromCurrency: string = 'USD'): string => {
  if (fromCurrency === 'USD') {
    const inrAmount = convertToINR(amount);
    return formatCurrency(inrAmount, 'INR');
  }
  return formatCurrency(amount, 'INR');
};