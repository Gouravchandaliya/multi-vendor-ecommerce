/**
 * Format a number as Indian Rupees.
 * Used throughout the app for consistent price display.
 *
 * @param {number} amount - Amount in paise (Razorpay) or rupees
 * @param {boolean} fromPaise - Set true when amount is in paise (divide by 100)
 * @returns {string} e.g. "₹1,299.00"
 */
export const formatCurrency = (amount, fromPaise = false) => {
  const value = fromPaise ? amount / 100 : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(value);
};
