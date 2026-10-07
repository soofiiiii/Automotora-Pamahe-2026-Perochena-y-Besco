import { API_URL } from "../config/apiConfig";
import type { Vehiculo } from "../types/vehiculo.types";
import { getOfflineDb } from "./indexedDb";

export const vehicleCache = {
  async save(username: string, rows: Vehiculo[]) {
    await (
      await getOfflineDb()
    ).put(
      "vehicles",
      {
        updatedAt: new Date().toISOString(),
        rows: rows.map(
          ({
            id,
            marca,
            modelo,
            tipoVehiculo,
            tipoVehiculoLabel,
            anio,
            matricula,
            estado,
            ubicacionActual,
            activo,
          }) => ({
            id,
            marca,
            modelo,
            tipoVehiculo,
            tipoVehiculoLabel,
            anio,
            matricula,
            estado,
            ubicacionActual,
            activo,
          }),
        ),
      },
      `${API_URL}:${username}`,
    );
  },

  async get(username: string) {
    return (await getOfflineDb()).get(
      "vehicles",
      `${API_URL}:${username}`,
    );
  },
};