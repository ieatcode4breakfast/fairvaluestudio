export const formatCurrency = (num: number | null | undefined) => {
  if (num === null || num === undefined) return 'N/A';
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatPercent = (num: number | null | undefined) => {
  if (num === null || num === undefined) return 'N/A';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
};
