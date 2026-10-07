const DAY_IN_MILLISECONDS = 86_400_000;

function dateOnlyToUtc(value: string | null | undefined): number | null {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;

  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return timestamp;
}

export function calculateDaysInStock(
  purchaseDate: string | null | undefined,
  saleDate: string | null | undefined,
  today = new Date(),
): number | null {
  const start = dateOnlyToUtc(purchaseDate);
  if (start === null) return null;

  const end = saleDate
    ? dateOnlyToUtc(saleDate)
    : Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

  if (end === null || end < start) return null;
  return Math.floor((end - start) / DAY_IN_MILLISECONDS);
}

export function formatDaysInStock(days: number | null): string | null {
  if (days === null) return null;
  return `${days} ${days === 1 ? "día" : "días"} en stock`;
}
