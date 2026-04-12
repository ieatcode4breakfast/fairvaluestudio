export const formatCurrency = (num: number | null | undefined) => {
  if (num === null || num === undefined) return 'N/A';
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatPercent = (num: number | null | undefined) => {
  if (num === null || num === undefined) return 'N/A';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
};

const MILLION = 1_000_000;

export const convertMillions = (
  currentValue: number | '',
  fromMillions: boolean,
  toMillions: boolean
): number | '' => {
  if (currentValue === '' || currentValue === 0) return currentValue;
  const num = Number(currentValue);
  if (fromMillions && !toMillions) return num * MILLION;
  if (!fromMillions && toMillions) return num / MILLION;
  return num;
};
