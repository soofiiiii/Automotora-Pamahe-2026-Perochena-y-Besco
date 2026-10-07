import type { VehiculoRequest } from "./vehiculo.types";

export interface CompraConVehiculoRequest {
  vehiculo: VehiculoRequest;
  clienteVendedorId: number;
  fechaCompra: string;
  costoAdquisicion: number;
  observaciones?: string;
}
