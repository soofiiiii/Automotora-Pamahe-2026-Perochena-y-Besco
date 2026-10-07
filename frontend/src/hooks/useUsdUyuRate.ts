import { useEffect, useState } from "react";
import { parametroService } from "../services/api";

const CATEGORY = "MONEDA";
const KEY = "USD_UYU";

export function useUsdUyuRate() {
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    parametroService
      .listByCategory(CATEGORY, controller.signal)
      .then((rows) => {
        const configured = rows.find((item) => item.clave === KEY)?.valor;
        const parsed = Number(configured);
        setRate(Number.isFinite(parsed) && parsed > 0 ? parsed : null);
      })
      .catch(() => {
        setRate(null);
      });

    return () => controller.abort();
  }, []);

  return rate;
}
