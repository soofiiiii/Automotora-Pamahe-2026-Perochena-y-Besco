import { useMemo, useState } from "react";

export function usePagination<T>(items: T[], size = 12) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / size));
  const safe = Math.min(page, pages);
  const data = useMemo(
    () => items.slice((safe - 1) * size, safe * size),
    [items, size, safe],
  );
  return { page: safe, pages, data, setPage };
}
