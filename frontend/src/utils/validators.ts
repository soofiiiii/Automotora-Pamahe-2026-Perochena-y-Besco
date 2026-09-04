export const normalizeText = (value: string) =>
  value.trim().replace(/\s+/g, " ");
export const normalizeDocument = (value: string) =>
  value.replace(/[^0-9A-Za-z]/g, "").toUpperCase();
export const isPositive = (value: number) =>
  Number.isFinite(value) && value > 0;
