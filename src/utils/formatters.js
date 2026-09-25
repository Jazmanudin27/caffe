/**
 * Formatting Utility Functions for Caffe POS Application
 */

/**
 * Formats a number to IDR Currency string (e.g. 35000 -> "Rp 35.000")
 */
export const formatRupiah = (amount) => {
  if (amount === undefined || amount === null) return 'Rp 0';
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(amount);
};

/**
 * Formats input strings with thousand separator for typing (e.g. "100000" -> "100.000")
 */
export const formatRupiahInput = (val) => {
  if (val === null || val === undefined) return '';
  const numberString = val.toString().replace(/\D/g, '');
  if (!numberString) return '';
  return new Intl.NumberFormat('id-ID').format(parseInt(numberString, 10));
};

/**
 * Extracts raw integer number from formatted string (e.g. "100.000" -> 100000)
 */
export const getNumericValue = (val) => {
  if (!val) return 0;
  return parseInt(val.toString().replace(/\D/g, ''), 10) || 0;
};

/**
 * Formats ISO date string to localized date time (e.g. "25/09/2026, 13.30")
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
