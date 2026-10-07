const amountFormatter = new Intl.NumberFormat("es-UY", {
  maximumFractionDigits: 0,
});

export const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

export const formatUsd = (value?: number | null) =>
  value == null ? "USD 0" : `USD ${amountFormatter.format(value)}`;

export const formatUyuEquivalent = (value?: number | null) =>
  value == null ? "$ 0 UYU" : `$ ${amountFormatter.format(value)} UYU`;

export const convertUsdToUyu = (usd?: number | null, rate?: number | null) => {
  if (usd == null || rate == null || !Number.isFinite(usd) || !Number.isFinite(rate)) {
    return null;
  }
  return usd * rate;
};
