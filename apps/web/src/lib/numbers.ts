export function normalizeDecimal(value: string): string | null {
  const cleaned = value.replace(/\s/g, '').replace(',', '.');
  if (!cleaned) return null;
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  return cleaned;
}

export function multiplyDecimals(a: string, b: string): string {
  const x = parseFloat(normalizeDecimal(a) ?? '');
  const y = parseFloat(normalizeDecimal(b) ?? '');
  if (Number.isNaN(x) || Number.isNaN(y)) return '';
  return (x * y).toFixed(2);
}

export function formatDecimal(value: string, decimals = 2): string | null {
  const n = normalizeDecimal(value);
  if (n === null) return null;
  const num = parseFloat(n);
  if (Number.isNaN(num)) return null;
  return num.toFixed(decimals);
}
