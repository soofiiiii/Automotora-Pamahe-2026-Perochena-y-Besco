import type { ExportName } from "../types/export.types";
import type { CompraConVehiculoRequest } from "../types/compra.types";
import type {
  ReporteComprasResponse,
  ReporteRefaccionesResponse,
  ReporteRentabilidadResponse,
  ReporteStockResponse,
  ReporteVentasResponse,
  ReportName,
} from "../types/report.types";
import type { PageRequest } from "../types/api.types";
import { apiClient, asArray, asPage } from "./apiClient";
import type {
  ChangePasswordRequest,
  CurrentUserResponse,
  LoginRequest,
  LoginResponse,
  ResetPasswordRequest,
} from "../types/auth.types";
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
  StockFilters,
  CatalogoFilters,
} from "../types/vehiculo.types";
import type {
  Cliente,
  ClienteRequest,
  TipoCliente,
  Compra,
  CompraCreateResponse,
  CompraRequest,
  DestinoPostCompra,
  DestinoPostCompraResponse,
  Venta,
  VentaDetalleGerencial,
  VentaRequest,
  ActualizarFinanciacionVentaRequest,
  ActualizarProximoMantenimientoRequest,
  Refaccion,
  RefaccionRequest,
  RefaccionUpdateRequest,
  CostosVehiculo,
  DashboardData,
  Auditoria,
  ImagenVehiculo,
  Parametro,
  ParametroRequest,
  Notificacion,
} from "../types/domain.types";
import type {
  EstadoSolicitudVenta,
  SolicitudVentaDetalle,
  SolicitudVentaPublicaResponse,
  SolicitudVentaResumen,
} from "../types/solicitudVenta.types";

export const authService = {
  login: async (body: LoginRequest) =>
    (await apiClient.post<LoginResponse>("/auth/login", body)).data,
  me: async (signal?: AbortSignal) =>
    (await apiClient.get<CurrentUserResponse>("/auth/me", { signal })).data,
  changePassword: async (body: ChangePasswordRequest) => {
    await apiClient.patch("/auth/password", body);
  },
};

export const usuarioService = {
  list: async () => asArray<Usuario>((await apiClient.get("/usuarios")).data),
  get: async (id: number) =>
    (await apiClient.get<Usuario>(`/usuarios/${id}`)).data,
  create: async (body: UsuarioCreateRequest) =>
    (await apiClient.post<Usuario>("/usuarios", body)).data,
  update: async (id: number, body: UsuarioUpdateRequest) =>
    (await apiClient.put<Usuario>(`/usuarios/${id}`, body)).data,
  deactivate: async (id: number) => {
    await apiClient.delete(`/usuarios/${id}`);
  },
  roles: async () => asArray<Role>((await apiClient.get("/roles")).data),
  resetPassword: async (id: number, body: ResetPasswordRequest) => {
    await apiClient.patch(`/usuarios/${id}/password`, body);
  },
};


const normalizeDocument = (value: string) =>
  value.trim().replace(/[^A-Za-z0-9]/g, "").toUpperCase();

export interface ClientePageRequest extends PageRequest {
  q?: string;
  tipoCliente?: TipoCliente;
}

export const clienteService = {
  list: async () => asArray<Cliente>((await apiClient.get("/clientes")).data),
  page: async (params: ClientePageRequest, signal?: AbortSignal) =>
    asPage<Cliente>(
      (await apiClient.get("/clientes/paginado", { params, signal })).data,
    ),
  findByDocument: async (documento: string, signal?: AbortSignal) => {
    const normalized = normalizeDocument(documento);
    if (!normalized) return null;
    return (
      await apiClient.get<Cliente | null>("/clientes/por-documento", {
        params: { documento: normalized },
        signal,
      })
    ).data;
  },
  get: async (id: number) =>
    (await apiClient.get<Cliente>(`/clientes/${id}`)).data,
  create: async (body: ClienteRequest) =>
    (await apiClient.post<Cliente>("/clientes", body)).data,
  update: async (id: number, body: ClienteRequest) =>
    (await apiClient.put<Cliente>(`/clientes/${id}`, body)).data,
  deactivate: async (id: number) => {
    await apiClient.delete(`/clientes/${id}`);
  },
};

export const vehiculoService = {
  list: async (params?: StockFilters, signal?: AbortSignal) =>
    asArray<Vehiculo>(
      (await apiClient.get("/vehiculos", { params, signal })).data,
    ),
  page: async (params?: StockFilters & PageRequest, signal?: AbortSignal) =>
    asPage<Vehiculo>(
      (await apiClient.get("/vehiculos/paginado", { params, signal })).data,
    ),
  get: async (id: number) =>
    (await apiClient.get<Vehiculo>(`/vehiculos/${id}`)).data,
  historial: async (id: number, signal?: AbortSignal) =>
    (
      await apiClient.get<VehiculoHistorial>(`/vehiculos/${id}/historial`, {
        signal,
      })
    ).data,
  create: async (body: VehiculoRequest) =>
    (await apiClient.post<Vehiculo>("/vehiculos", body)).data,
  update: async (id: number, body: VehiculoRequest) =>
    (await apiClient.put<Vehiculo>(`/vehiculos/${id}`, body)).data,
  deactivate: async (id: number) => {
    await apiClient.delete(`/vehiculos/${id}`);
  },
  state: async (id: number, estado: EstadoVehiculo, motivo?: string) =>
    (
      await apiClient.patch<Vehiculo>(`/vehiculos/${id}/estado`, {
        estado,
        motivo,
      })
    ).data,
  publication: async (id: number, publicado: boolean) =>
    (
      await apiClient.patch<Vehiculo>(`/vehiculos/${id}/publicacion`, {
        publicado,
      })
    ).data,
};

export const compraService = {
  list: async () => asArray<Compra>((await apiClient.get("/compras")).data),
  page: async (params: PageRequest, signal?: AbortSignal) =>
    asPage<Compra>(
      (await apiClient.get("/compras/paginado", { params, signal })).data,
    ),
  get: async (id: number) =>
    (await apiClient.get<Compra>(`/compras/${id}`)).data,
  create: async (body: CompraRequest): Promise<CompraCreateResponse> =>
    (await apiClient.post<CompraCreateResponse>("/compras", body)).data,
  createWithVehicle: async (body: CompraConVehiculoRequest): Promise<CompraCreateResponse> =>
    (await apiClient.post<CompraCreateResponse>("/compras/con-vehiculo", body)).data,
  defineDestination: async (id: number, destino: DestinoPostCompra) =>
    (
      await apiClient.patch<DestinoPostCompraResponse>(`/compras/${id}/destino`, {
        destino,
      })
    ).data,
  receipt: async (id: number) =>
    (
      await apiClient.get<Blob>(`/compras/${id}/comprobante`, {
        responseType: "blob",
      })
    ).data,
};

export const ventaService = {
  list: async () => asArray<Venta>((await apiClient.get("/ventas")).data),
  page: async (params: PageRequest, signal?: AbortSignal) =>
    asPage<Venta>(
      (await apiClient.get("/ventas/paginado", { params, signal })).data,
    ),
  get: async (id: number) => (await apiClient.get<Venta>(`/ventas/${id}`)).data,
  gerencial: async (id: number) =>
    (await apiClient.get<VentaDetalleGerencial>(`/ventas/${id}/detalle-gerencial`)).data,
  create: async (body: VentaRequest) =>
    (await apiClient.post<Venta>("/ventas", body)).data,
  updateFinancing: async (id: number, body: ActualizarFinanciacionVentaRequest) =>
    (await apiClient.patch<Venta>(`/ventas/${id}/financiacion`, body)).data,
  updateMaintenance: async (id: number, body: ActualizarProximoMantenimientoRequest) =>
    (await apiClient.patch<Venta>(`/ventas/${id}/proximo-mantenimiento`, body)).data,
  markPostSaleFollowUp: async (id: number) =>
    (await apiClient.patch<Venta>(`/ventas/${id}/seguimiento-postventa/realizado`)).data,
  receipt: async (id: number) =>
    (
      await apiClient.get<Blob>(`/ventas/${id}/comprobante`, {
        responseType: "blob",
      })
    ).data,
};

export const solicitudVentaService = {
  createPublic: async (body: FormData) =>
    (await apiClient.post<SolicitudVentaPublicaResponse>("/solicitudes-venta/publica", body)).data,
  list: async () =>
    asArray<SolicitudVentaResumen>((await apiClient.get("/solicitudes-venta")).data),
  get: async (id: number) =>
    (await apiClient.get<SolicitudVentaDetalle>(`/solicitudes-venta/${id}`)).data,
  updateStatus: async (id: number, estado: EstadoSolicitudVenta) =>
    (await apiClient.patch<SolicitudVentaDetalle>(`/solicitudes-venta/${id}/estado`, { estado })).data,
  photo: async (solicitudId: number, imagenId: number) =>
    (await apiClient.get<Blob>(`/solicitudes-venta/${solicitudId}/imagenes/${imagenId}`, { responseType: "blob" })).data,
};

export const tallerService = {
  list: async (estado?: string, signal?: AbortSignal) =>
    asArray<Refaccion>(
      (
        await apiClient.get("/taller/refacciones", {
          params: estado ? { estado } : undefined,
          signal,
        })
      ).data,
    ),
  byVehicle: async (id: number, signal?: AbortSignal) =>
    asArray<Refaccion>(
      (await apiClient.get(`/taller/refacciones/vehiculos/${id}`, { signal }))
        .data,
    ),
  get: async (
    id: number,
    vehiculoId?: number,
    signal?: AbortSignal,
  ): Promise<Refaccion> => {
    // El contrato de taller expone listados, no un GET individual por refacción.
    const rows = vehiculoId
      ? await tallerService.byVehicle(vehiculoId, signal)
      : await tallerService.list(undefined, signal);
    const repair = rows.find((row) => row.id === id);
    if (!repair)
      throw new Error("La refacción no existe o ya no está disponible.");
    return repair;
  },
  create: async (body: RefaccionRequest) =>
    (await apiClient.post<Refaccion>("/taller/refacciones", body)).data,
  update: async (id: number, body: RefaccionUpdateRequest) =>
    (await apiClient.put<Refaccion>(`/taller/refacciones/${id}`, body)).data,
};

export const notificationService = {
  list: async () =>
    asArray<Notificacion>((await apiClient.get("/notificaciones")).data),
  markRead: async (id: number) =>
    (await apiClient.patch<Notificacion>(`/notificaciones/${id}/leida`)).data,
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

const reportParams = (desde?: string, hasta?: string) => ({
  ...(desde ? { desde } : {}),
  ...(hasta ? { hasta } : {}),
});

export const reporteService = {
  ventas: async (desde?: string, hasta?: string, signal?: AbortSignal) =>
    (await apiClient.get<ReporteVentasResponse>("/reportes/ventas", { params: reportParams(desde, hasta), signal })).data,
  compras: async (desde?: string, hasta?: string, signal?: AbortSignal) =>
    (await apiClient.get<ReporteComprasResponse>("/reportes/compras", { params: reportParams(desde, hasta), signal })).data,
  stock: async (desde?: string, hasta?: string, signal?: AbortSignal) =>
    (await apiClient.get<ReporteStockResponse>("/reportes/stock", { params: reportParams(desde, hasta), signal })).data,
  vendidos: async (desde?: string, hasta?: string, signal?: AbortSignal) =>
    (await apiClient.get<ReporteVentasResponse>("/reportes/vendidos", { params: reportParams(desde, hasta), signal })).data,
  refacciones: async (desde?: string, hasta?: string, signal?: AbortSignal) =>
    (await apiClient.get<ReporteRefaccionesResponse>("/reportes/refacciones", { params: reportParams(desde, hasta), signal })).data,
  rentabilidad: async (desde?: string, hasta?: string, signal?: AbortSignal) =>
    (await apiClient.get<ReporteRentabilidadResponse>("/reportes/rentabilidad", { params: reportParams(desde, hasta), signal })).data,
  pdf: async (name: ReportName, desde?: string, hasta?: string) =>
    (
      await apiClient.get<Blob>(`/reportes/${name}.pdf`, {
        params: reportParams(desde, hasta),
        responseType: "blob",
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
  page: async (filters: AuditoriaFilters & PageRequest, signal?: AbortSignal) =>
    asPage<Auditoria>(
      (
        await apiClient.get("/auditoria/paginado", {
          params: filters,
          signal,
        })
      ).data,
    ),
};

export const parametroService = {
  list: async () =>
    asArray<Parametro>((await apiClient.get("/parametros")).data),

  listByCategory: async (categoria: string, signal?: AbortSignal) =>
    asArray<Parametro>(
      (await apiClient.get("/parametros/opciones", { params: { categoria }, signal })).data,
    ),

  create: async (body: ParametroRequest) =>
    (await apiClient.post<Parametro>("/parametros", body)).data,

  update: async (id: number, body: ParametroRequest) =>
    (await apiClient.put<Parametro>(`/parametros/${id}`, body)).data,

  deactivate: async (id: number) => {
    await apiClient.delete(`/parametros/${id}`);
  },
};

export const catalogoService = {
  list: async (params?: CatalogoFilters, signal?: AbortSignal) =>
    asArray<CatalogoVehiculo>(
      (await apiClient.get("/catalogo/vehiculos", { params, signal })).data,
    ),
  page: async (params?: CatalogoFilters & PageRequest, signal?: AbortSignal) =>
    asPage<CatalogoVehiculo>(
      (
        await apiClient.get("/catalogo/vehiculos/paginado", { params, signal })
      ).data,
    ),
  get: async (id: number, signal?: AbortSignal) =>
    (
      await apiClient.get<CatalogoVehiculo>(`/catalogo/vehiculos/${id}`, {
        signal,
      })
    ).data,
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
    asArray<ImagenVehiculo>(
      (await apiClient.get(`/imagenes/vehiculos/${vehiculoId}`)).data,
    ),
  upload: async (vehiculoId: number, file: File, descripcion?: string) => {
    const data = new FormData();
    data.append("file", file);
    if (descripcion) data.append("descripcion", descripcion);
    return (
      await apiClient.post<ImagenVehiculo>(
        `/imagenes/vehiculos/${vehiculoId}`,
        data,
      )
    ).data;
  },
  visibility: async (id: number, publica: boolean, principal: boolean) =>
    (
      await apiClient.patch<ImagenVehiculo>(`/imagenes/${id}/visibilidad`, {
        publica,
        principal,
      })
    ).data,
  remove: async (id: number) => {
    await apiClient.delete(`/imagenes/${id}`);
  },
  privateBlob: async (id: number) =>
    (
      await apiClient.get<Blob>(`/imagenes/${id}/archivo`, {
        responseType: "blob",
      })
    ).data,
};

export const exportService = {
  file: async (name: ExportName) =>
    (
      await apiClient.get<Blob>(`/exportaciones/${name}.csv`, {
        responseType: "blob",
      })
    ).data,
};
