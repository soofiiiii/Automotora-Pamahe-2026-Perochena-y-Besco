import { useEffect, useState } from "react";
import type { VehicleTypeOption } from "../config/vehicleTypes";
import { parametroService } from "../services/api";
import { errorMessage } from "../utils/errorMessage";

const CATEGORY = "TIPO_VEHICULO";

export function useVehicleTypeOptions() {
  const [state, setState] = useState<{
    options: VehicleTypeOption[];
    loading: boolean;
    error: string;
  }>({
    options: [],
    loading: true,
    error: "",
  });

  useEffect(() => {
    const controller = new AbortController();

    parametroService.listByCategory(CATEGORY, controller.signal).then(
      (rows) => {
        if (controller.signal.aborted) return;

        setState({
          options: rows
            .filter((row) => row.activo && row.categoria === CATEGORY)
            .map((row) => ({
              value: row.clave.trim().toUpperCase(),
              label: row.valor.trim() || row.clave.trim(),
            })),
          loading: false,
          error: "",
        });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setState({
            options: [],
            loading: false,
            error: errorMessage(error, "No pudimos cargar los tipos de vehículo."),
          });
        }
      },
    );

    return () => controller.abort();
  }, []);

  return state;
}