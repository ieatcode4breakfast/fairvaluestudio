export const formatCurrency = (num: number | null | undefined) => {
  if (num === null || num === undefined) return 'N/A';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatPercent = (num: number | null | undefined) => {
  if (num === null || num === undefined) return 'N/A';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
};

export const formatCompactNumber = (num: number | null | undefined) => {
  if (num === null || num === undefined) return 'N/A';
  
  // Use absolute value for comparison
  const absNum = Math.abs(num);
  
  // Keep standard format if under 10,000
  if (absNum < 10000) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }


  const suffixes = [
    { value: 1e12, symbol: 'T' },
    { value: 1e9, symbol: 'B' },
    { value: 1e6, symbol: 'M' },
    { value: 1e3, symbol: 'K' },
  ];

  for (let i = 0; i < suffixes.length; i++) {
    if (absNum >= suffixes[i].value) {
      const formatted = (num / suffixes[i].value).toFixed(2) + suffixes[i].symbol;
      return formatted;
    }
  }

  return num.toFixed(2);
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
