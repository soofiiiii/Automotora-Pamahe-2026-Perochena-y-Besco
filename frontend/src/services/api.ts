import axios from "axios";
import { apiClient, asArray } from "./apiClient";
import type { LoginRequest, LoginResponse } from "../types/auth.types";
import type {
  Usuario,
  UsuarioCreateRequest,
  UsuarioUpdateRequest,
  Role,
} from "../types/usuario.types";
import type {
  Vehiculo,
  VehiculoRequest,
  CatalogoVehiculo,
  EstadoVehiculo,
  VehiculoHistorial,
} from "../types/vehiculo.types";
import type {
  Cliente,
  ClienteRequest,
  Compra,
  CompraRequest,
  Venta,
  VentaRequest,
  Refaccion,
  RefaccionRequest,
  RefaccionUpdateRequest,
  CostosVehiculo,
  DashboardData,
  Auditoria,
  ImagenVehiculo,
  Parametro,
  ParametroRequest,
} from "../types/domain.types";

export const authService = {
  login: async (body: LoginRequest) =>
    (await apiClient.post<LoginResponse>("/auth/login", body)).data,
};

export const usuarioService = {
  list: async () => asArray<Usuario>((await apiClient.get("/usuarios")).data),
  get: async (id: number) => (await apiClient.get<Usuario>(`/usuarios/${id}`)).data,
  create: async (body: UsuarioCreateRequest) =>
    (await apiClient.post<Usuario>("/usuarios", body)).data,
  update: async (id: number, body: UsuarioUpdateRequest) =>
    (await apiClient.put<Usuario>(`/usuarios/${id}`, body)).data,
  deactivate: async (id: number) => {
    await apiClient.delete(`/usuarios/${id}`);
  },
  roles: async () => asArray<Role>((await apiClient.get("/roles")).data),
};

export const clienteService = {
  list: async () => asArray<Cliente>((await apiClient.get("/clientes")).data),
  get: async (id: number) => (await apiClient.get<Cliente>(`/clientes/${id}`)).data,
  create: async (body: ClienteRequest) =>
    (await apiClient.post<Cliente>("/clientes", body)).data,
  update: async (id: number, body: ClienteRequest) =>
    (await apiClient.put<Cliente>(`/clientes/${id}`, body)).data,
  deactivate: async (id: number) => {
    await apiClient.delete(`/clientes/${id}`);
  },
};

export const vehiculoService = {
  list: async () => asArray<Vehiculo>((await apiClient.get("/vehiculos")).data),
  get: async (id: number) => (await apiClient.get<Vehiculo>(`/vehiculos/${id}`)).data,
  historial: async (id: number) => (await apiClient.get<VehiculoHistorial>(`/vehiculos/${id}/historial`)).data,
  create: async (body: VehiculoRequest) =>
    (await apiClient.post<Vehiculo>("/vehiculos", body)).data,
  update: async (id: number, body: VehiculoRequest) =>
    (await apiClient.put<Vehiculo>(`/vehiculos/${id}`, body)).data,
  deactivate: async (id: number) => {
    await apiClient.delete(`/vehiculos/${id}`);
  },
  state: async (id: number, estado: EstadoVehiculo, motivo?: string) =>
    (await apiClient.patch<Vehiculo>(`/vehiculos/${id}/estado`, { estado, motivo })).data,
  publication: async (id: number, publicado: boolean) =>
    (await apiClient.patch<Vehiculo>(`/vehiculos/${id}/publicacion`, { publicado })).data,
};

export const compraService = {
  list: async () => asArray<Compra>((await apiClient.get("/compras")).data),
  get: async (id: number) => (await apiClient.get<Compra>(`/compras/${id}`)).data,
  create: async (body: CompraRequest) =>
    (await apiClient.post<Compra>("/compras", body)).data,
  receipt: async (id: number) =>
    (await apiClient.get<Blob>(`/compras/${id}/comprobante`, { responseType: "blob" })).data,
};

export const ventaService = {
  list: async () => asArray<Venta>((await apiClient.get("/ventas")).data),
  get: async (id: number) => (await apiClient.get<Venta>(`/ventas/${id}`)).data,
  gerencial: async (id: number) =>
    (await apiClient.get(`/ventas/${id}/detalle-gerencial`)).data,
  create: async (body: VentaRequest) =>
    (await apiClient.post<Venta>("/ventas", body)).data,
  receipt: async (id: number) =>
    (await apiClient.get<Blob>(`/ventas/${id}/comprobante`, { responseType: "blob" })).data,
};

export const tallerService = {
  list: async (estado?: string) =>
    asArray<Refaccion>(
      (await apiClient.get("/taller/refacciones", { params: estado ? { estado } : undefined })).data,
    ),
  byVehicle: async (id: number) =>
    asArray<Refaccion>((await apiClient.get(`/taller/refacciones/vehiculos/${id}`)).data),
  create: async (body: RefaccionRequest) =>
    (await apiClient.post<Refaccion>("/taller/refacciones", body)).data,
  update: async (id: number, body: RefaccionUpdateRequest) =>
    (await apiClient.put<Refaccion>(`/taller/refacciones/${id}`, body)).data,
};

export const costoService = {
  get: async (id: number) =>
    (await apiClient.get<CostosVehiculo>(`/costos/vehiculos/${id}`)).data,
};

export const dashboardService = {
  get: async (desde?: string, hasta?: string) =>
    (
      await apiClient.get<DashboardData>("/reportes/dashboard", {
        params: {
          ...(desde ? { desde } : {}),
          ...(hasta ? { hasta } : {}),
        },
      })
    ).data,
};

export interface AuditoriaFilters {
  usuario?: string;
  accion?: string;
  entidad?: string;
  entidadId?: number;
  desde?: string;
  hasta?: string;
}

export const auditoriaService = {
  list: async (filters?: AuditoriaFilters) =>
    asArray<Auditoria>(
      (
        await apiClient.get("/auditoria", {
          params: filters,
        })
      ).data,
    ),
};

export const parametroService = {
  list: async () =>
    asArray<Parametro>(
      (await apiClient.get("/parametros")).data
    ),

  create: async (body: ParametroRequest) =>
    (
      await apiClient.post<Parametro>(
        "/parametros",
        body
      )
    ).data,

  update: async (
    id: number,
    body: ParametroRequest
  ) =>
    (
      await apiClient.put<Parametro>(
        `/parametros/${id}`,
        body
      )
    ).data,

  deactivate: async (id: number) => {
    await apiClient.delete(`/parametros/${id}`);
  },
};

export const catalogoService = {
  list: async (params?: Record<string, string | number | undefined>) =>
    asArray<CatalogoVehiculo>(
      (await apiClient.get("/catalogo/vehiculos", { params })).data,
    ),
  get: async (id: number) => {
    try {
      return (await apiClient.get<CatalogoVehiculo>(`/catalogo/vehiculos/${id}`)).data;
    } catch (error) {
      if (!axios.isAxiosError(error) || ![404, 405].includes(error.response?.status ?? 0)) {
        throw error;
      }
      const all = await catalogoService.list();
      return all.find((vehicle) => vehicle.id === id) ?? null;
    }
  },
};

export const chatbotService = {
  ask: async (pregunta: string) =>
    (
      await apiClient.post<{
        respuesta: string;
        intencion?: string;
        sugerencias?: string[];
      }>("/chatbot/preguntar", { pregunta })
    ).data,
};

export const imagenService = {
  list: async (vehiculoId: number) =>
    asArray<ImagenVehiculo>((await apiClient.get(`/imagenes/vehiculos/${vehiculoId}`)).data),
  upload: async (vehiculoId: number, file: File, descripcion?: string) => {
    const data = new FormData();
    data.append("file", file);
    if (descripcion) data.append("descripcion", descripcion);
    return (await apiClient.post<ImagenVehiculo>(`/imagenes/vehiculos/${vehiculoId}`, data)).data;
  },
  visibility: async (id: number, publica: boolean, principal: boolean) =>
    (await apiClient.patch<ImagenVehiculo>(`/imagenes/${id}/visibilidad`, { publica, principal })).data,
  remove: async (id: number) => {
    await apiClient.delete(`/imagenes/${id}`);
  },
  privateBlob: async (id: number) =>
    (await apiClient.get<Blob>(`/imagenes/${id}/archivo`, { responseType: "blob" })).data,
};

export const exportService = {
  file: async (name: "vehiculos" | "clientes" | "ventas") =>
    (await apiClient.get<Blob>(`/exportaciones/${name}.csv`, { responseType: "blob" })).data,
};
