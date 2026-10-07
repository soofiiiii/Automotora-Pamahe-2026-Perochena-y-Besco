package uy.edu.ctc.pamahe.modules.ventas.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.common.performance.VentaTiming;
import uy.edu.ctc.pamahe.common.response.PageResponse;
import uy.edu.ctc.pamahe.common.util.PdfService;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.clientes.model.Cliente;
import uy.edu.ctc.pamahe.modules.clientes.model.TipoCliente;
import uy.edu.ctc.pamahe.modules.clientes.service.ClienteService;
import uy.edu.ctc.pamahe.modules.compras.model.Compra;
import uy.edu.ctc.pamahe.modules.compras.repository.CompraRepository;
import uy.edu.ctc.pamahe.modules.costos.service.CostoService;
import uy.edu.ctc.pamahe.modules.notificaciones.service.NotificacionService;
import uy.edu.ctc.pamahe.modules.taller.model.EstadoTarea;
import uy.edu.ctc.pamahe.modules.taller.repository.RefaccionRepository;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.usuarios.service.UsuarioActualService;
import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.service.VehiculoService;
import uy.edu.ctc.pamahe.modules.ventas.dto.request.ActualizarFinanciacionVentaRequest;
import uy.edu.ctc.pamahe.modules.ventas.dto.request.ActualizarProximoMantenimientoRequest;
import uy.edu.ctc.pamahe.modules.ventas.dto.request.VentaRequest;
import uy.edu.ctc.pamahe.modules.ventas.dto.response.VentaDetalleGerencialResponse;
import uy.edu.ctc.pamahe.modules.ventas.dto.response.VentaResponse;
import uy.edu.ctc.pamahe.modules.ventas.event.VentaComprobanteSolicitadoEvent;
import uy.edu.ctc.pamahe.modules.ventas.mapper.VentaMapper;
import uy.edu.ctc.pamahe.modules.ventas.model.EstadoComprobanteVenta;
import uy.edu.ctc.pamahe.modules.ventas.model.EstadoFinanciacion;
import uy.edu.ctc.pamahe.modules.ventas.model.MedioPagoVenta;
import uy.edu.ctc.pamahe.modules.ventas.model.Venta;
import uy.edu.ctc.pamahe.modules.ventas.repository.VentaRepository;

/**
 * Cierra el ciclo comercial de una unidad en una única transacción.
 * Antes de vender valida estado y tareas, fija una fotografía de costos,
 * calcula la rentabilidad, cambia el vehículo a VENDIDO y genera el
 * comprobante administrativo correspondiente.
 */
@Service
public class VentaService {

        private final VentaRepository ventaRepository;
        private final VehiculoService vehiculoService;
        private final ClienteService clienteService;
        private final UsuarioActualService usuarioActualService;
        private final CompraRepository compraRepository;
        private final RefaccionRepository refaccionRepository;
        private final CostoService costoService;
        private final PdfService pdfService;
        private final AuditoriaService auditoriaService;
        private final VentaComprobanteService ventaComprobanteService;
        private final NotificacionService notificacionService;
        private final ApplicationEventPublisher eventPublisher;

        public VentaService(
                        VentaRepository ventaRepository,
                        VehiculoService vehiculoService,
                        ClienteService clienteService,
                        UsuarioActualService usuarioActualService,
                        CompraRepository compraRepository,
                        RefaccionRepository refaccionRepository,
                        CostoService costoService,
                        PdfService pdfService,
                        AuditoriaService auditoriaService,
                        VentaComprobanteService ventaComprobanteService,
                        NotificacionService notificacionService,
                        ApplicationEventPublisher eventPublisher) {

                this.ventaRepository = ventaRepository;
                this.vehiculoService = vehiculoService;
                this.clienteService = clienteService;
                this.usuarioActualService = usuarioActualService;
                this.compraRepository = compraRepository;
                this.refaccionRepository = refaccionRepository;
                this.costoService = costoService;
                this.pdfService = pdfService;
                this.auditoriaService = auditoriaService;
                this.ventaComprobanteService = ventaComprobanteService;
                this.notificacionService = notificacionService;
                this.eventPublisher = eventPublisher;
        }

        @Transactional(readOnly = true)
        public List<VentaResponse> listar() {
                return this.ventaRepository
                                .findByActivoTrueOrderByFechaVentaDesc()
                                .stream()
                                .map(VentaMapper::toResponse)
                                .toList();
        }

        @Transactional(readOnly = true)
        public VentaResponse obtener(Long id) {
                return VentaMapper.toResponse(this.buscarActiva(id));
        }

        @Transactional(readOnly = true)
        public VentaDetalleGerencialResponse obtenerDetalleGerencial(Long id) {
                this.usuarioActualService.exigirRoles(
                                "ADMINISTRADOR",
                                "DUENO");

                return VentaMapper.toDetalleGerencial(this.buscarActiva(id));
        }

        @Transactional
        public VentaResponse crear(VentaRequest request) {
                Usuario vendedor = this.usuarioActualService.exigirRoles(
                                "ADMINISTRADOR",
                                "DUENO",
                                "VENDEDOR");

                VentaTiming.mark("seguridad_inicio_tx_roles");

                Vehiculo vehiculo = this.vehiculoService
                                .buscarActivoPorIdConBloqueo(request.vehiculoId());

                VentaTiming.mark("bloqueo_vehiculo");

                validarVehiculoVendible(vehiculo);
                validarDatosBasicosVenta(request);

                Compra compra = buscarCompraActiva(vehiculo);

                validarFechaRespectoCompra(request, compra);

                Cliente comprador = buscarCompradorHabilitado(
                                request.clienteCompradorId());

                VentaTiming.mark("validaciones_compra_cliente");

                CostoService.CostoSnapshot snapshot = this.costoService.calcularActualParaVenta(
                                vehiculo,
                                compra);

                VentaTiming.mark("costos");

                BigDecimal rentabilidad = request.precioFinal().subtract(snapshot.costoTotal());

                Venta guardada = this.ventaRepository.save(
                                construirVenta(
                                                request,
                                                vehiculo,
                                                comprador,
                                                vendedor,
                                                snapshot,
                                                rentabilidad));

                VentaTiming.mark("insert_venta");

                this.vehiculoService.marcarVendidoPorVenta(
                                vehiculo,
                                guardada.getId());

                registrarAuditoriaVenta(
                                guardada,
                                vehiculo,
                                comprador,
                                vendedor,
                                request,
                                snapshot,
                                rentabilidad);

                VentaTiming.mark("estado_auditorias");

                this.eventPublisher.publishEvent(
                                new VentaComprobanteSolicitadoEvent(
                                                guardada.getId()));

                VentaResponse response = VentaMapper.toResponse(guardada);

                VentaTiming.mark("evento_dto");

                return response;
        }

        private void validarVehiculoVendible(Vehiculo vehiculo) {
                if (this.ventaRepository.existsByVehiculo(vehiculo)) {
                        throw new BusinessException(
                                        "El vehículo ya tiene una venta activa registrada.");
                }

                if (vehiculo.getEstado() != EstadoVehiculo.DISPONIBLE) {
                        throw new BusinessException(
                                        "Solo se puede registrar la venta de un vehículo que esté Disponible.");
                }

                boolean tieneTareasAbiertas = this.refaccionRepository
                                .existsByVehiculoAndActivoTrueAndEstadoTareaIn(
                                                vehiculo,
                                                List.of(
                                                                EstadoTarea.PENDIENTE,
                                                                EstadoTarea.EN_CURSO));

                if (tieneTareasAbiertas) {
                        throw new BusinessException(
                                        "No se puede vender el vehículo mientras existan tareas pendientes o en curso.");
                }
        }

        private void validarDatosBasicosVenta(VentaRequest request) {
                if (request.fechaVenta().isAfter(LocalDate.now())) {
                        throw new BusinessException(
                                        "La fecha de venta no puede ser futura.");
                }

                if (request.precioFinal().compareTo(BigDecimal.ZERO) <= 0) {
                        throw new BusinessException(
                                        "El precio final debe ser mayor que cero.");
                }

                if (request.canalOrigen() == null) {
                        throw new BusinessException(
                                        "Seleccioná el canal de origen del cliente.");
                }

                validarChecklistPrevioVenta(request);

                validarProximoMantenimiento(
                                request.proximoMantenimiento(),
                                request.fechaVenta());

                validarDatosFinanciacion(
                                request.medioPago(),
                                request.entidadFinanciera(),
                                request.montoFinanciado(),
                                request.estadoFinanciacion(),
                                request.precioFinal());
        }

        private void validarChecklistPrevioVenta(VentaRequest request) {
                if (!Boolean.TRUE.equals(request.datosCompradorVerificados())
                                || !Boolean.TRUE.equals(request.documentacionRevisada())
                                || !Boolean.TRUE.equals(request.cobroConfirmado())) {
                        throw new BusinessException(
                                        "Confirmá los tres controles previos: datos del comprador, documentación y cobro.");
                }
        }

        private void validarDatosFinanciacion(
                        MedioPagoVenta medioPago,
                        String entidadFinanciera,
                        BigDecimal montoFinanciado,
                        EstadoFinanciacion estadoFinanciacion,
                        BigDecimal precioFinal) {

                if (medioPago == null) {
                        throw new BusinessException("Seleccioná el medio de pago.");
                }

                if (medioPago.esFinanciacion()) {
                        validarVentaFinanciada(
                                        entidadFinanciera,
                                        montoFinanciado,
                                        estadoFinanciacion,
                                        precioFinal);
                        return;
                }

                validarAusenciaDatosFinanciacion(
                                entidadFinanciera,
                                montoFinanciado,
                                estadoFinanciacion);
        }

        private void validarVentaFinanciada(
                        String entidadFinanciera,
                        BigDecimal montoFinanciado,
                        EstadoFinanciacion estadoFinanciacion,
                        BigDecimal precioFinal) {

                validarEntidadFinanciera(entidadFinanciera);
                validarMontoFinanciado(montoFinanciado, precioFinal);
                validarEstadoFinanciacion(estadoFinanciacion);
        }

        private void validarEntidadFinanciera(String entidadFinanciera) {
                if (normalizarOpcional(entidadFinanciera) == null) {
                        throw new BusinessException("Ingresá la entidad financiera.");
                }
        }

        private void validarMontoFinanciado(
                        BigDecimal montoFinanciado,
                        BigDecimal precioFinal) {

                if (montoFinanciado == null) {
                        throw new BusinessException(
                                        "El monto financiado debe ser mayor que cero.");
                }

                if (montoFinanciado.compareTo(BigDecimal.ZERO) <= 0) {
                        throw new BusinessException(
                                        "El monto financiado debe ser mayor que cero.");
                }

                if (montoFinanciado.compareTo(precioFinal) > 0) {
                        throw new BusinessException(
                                        "El monto financiado no puede superar el precio final de la venta.");
                }
        }

        private void validarEstadoFinanciacion(
                        EstadoFinanciacion estadoFinanciacion) {

                if (estadoFinanciacion == null) {
                        throw new BusinessException(
                                        "Seleccioná el estado de la financiación.");
                }
        }

        private void validarAusenciaDatosFinanciacion(
                        String entidadFinanciera,
                        BigDecimal montoFinanciado,
                        EstadoFinanciacion estadoFinanciacion) {

                if (normalizarOpcional(entidadFinanciera) != null) {
                        throw new BusinessException(
                                        "Los datos de financiación solo corresponden a ventas financiadas.");
                }

                if (montoFinanciado != null) {
                        throw new BusinessException(
                                        "Los datos de financiación solo corresponden a ventas financiadas.");
                }

                if (estadoFinanciacion != null) {
                        throw new BusinessException(
                                        "Los datos de financiación solo corresponden a ventas financiadas.");
                }
        }

        private Compra buscarCompraActiva(Vehiculo vehiculo) {
                return this.compraRepository
                                .findByVehiculoAndActivoTrue(vehiculo)
                                .orElseThrow(() -> new BusinessException(
                                                "El vehículo debe tener una compra activa antes de registrar la venta."));
        }

        private void validarFechaRespectoCompra(
                        VentaRequest request,
                        Compra compra) {

                if (request.fechaVenta().isBefore(compra.getFechaCompra())) {
                        throw new BusinessException(
                                        "La fecha de venta no puede ser anterior a la fecha de compra.");
                }
        }

        private Cliente buscarCompradorHabilitado(Long clienteCompradorId) {
                Cliente comprador = this.clienteService.buscarActivoPorId(
                                clienteCompradorId);

                if (comprador.getTipoCliente() != TipoCliente.COMPRADOR
                                && comprador.getTipoCliente() != TipoCliente.AMBOS) {

                        throw new BusinessException(
                                        "El cliente seleccionado no está habilitado para actuar como comprador.");
                }

                return comprador;
        }

        private Venta construirVenta(
                        VentaRequest request,
                        Vehiculo vehiculo,
                        Cliente comprador,
                        Usuario vendedor,
                        CostoService.CostoSnapshot snapshot,
                        BigDecimal rentabilidad) {

                Venta venta = new Venta();

                venta.setVehiculo(vehiculo);
                venta.setClienteComprador(comprador);
                venta.setVendedor(vendedor);
                venta.setFechaVenta(request.fechaVenta());
                venta.setCostoCompraAlVender(snapshot.costoCompra());
                venta.setCostoRefaccionesAlVender(snapshot.costoRefacciones());
                venta.setCostoTotalAlVender(snapshot.costoTotal());
                venta.setPrecioFinal(request.precioFinal());
                venta.setMedioPago(request.medioPago());
                venta.setEntidadFinanciera(normalizarOpcional(request.entidadFinanciera()));
                venta.setMontoFinanciado(request.montoFinanciado());
                venta.setEstadoFinanciacion(request.estadoFinanciacion());
                venta.setCanalOrigen(request.canalOrigen());
                venta.setSeguimientoPostventaRealizado(false);
                venta.setDatosCompradorVerificados(Boolean.TRUE.equals(request.datosCompradorVerificados()));
                venta.setDocumentacionRevisada(Boolean.TRUE.equals(request.documentacionRevisada()));
                venta.setCobroConfirmado(Boolean.TRUE.equals(request.cobroConfirmado()));
                venta.setProximoMantenimiento(request.proximoMantenimiento());
                venta.setRentabilidadCalculada(rentabilidad);
                venta.setObservaciones(normalizarOpcional(request.observaciones()));
                venta.setEstadoComprobante(
                                EstadoComprobanteVenta.PENDIENTE);
                venta.setIntentosComprobante(0);
                venta.setProximoIntentoComprobante(
                                LocalDateTime.now());

                return venta;
        }

        private void registrarAuditoriaVenta(
                        Venta venta,
                        Vehiculo vehiculo,
                        Cliente comprador,
                        Usuario vendedor,
                        VentaRequest request,
                        CostoService.CostoSnapshot snapshot,
                        BigDecimal rentabilidad) {

                this.auditoriaService.registrar(
                                "ALTA",
                                "Venta",
                                venta.getId(),
                                "Registro de venta del vehículo "
                                                + vehiculo.getId(),
                                null,
                                "vehiculoId=" + vehiculo.getId()
                                                + ", clienteCompradorId="
                                                + comprador.getId()
                                                + ", vendedorId="
                                                + vendedor.getId()
                                                + ", fechaVenta="
                                                + request.fechaVenta()
                                                + ", costoCompraAlVender="
                                                + snapshot.costoCompra()
                                                + ", costoRefaccionesAlVender="
                                                + snapshot.costoRefacciones()
                                                + ", costoTotalAlVender="
                                                + snapshot.costoTotal()
                                                + ", precioFinal="
                                                + request.precioFinal()
                                                + ", medioPago="
                                                + request.medioPago()
                                                + ", canalOrigen="
                                                + request.canalOrigen()
                                                + ", checklistConfirmado="
                                                + (Boolean.TRUE.equals(request.datosCompradorVerificados())
                                                                && Boolean.TRUE.equals(request.documentacionRevisada())
                                                                && Boolean.TRUE.equals(request.cobroConfirmado()))
                                                + ", proximoMantenimiento="
                                                + request.proximoMantenimiento()
                                                + ", rentabilidad="
                                                + rentabilidad);
        }

        @Transactional
        public VentaResponse actualizarFinanciacion(Long id, ActualizarFinanciacionVentaRequest request) {
                this.usuarioActualService.exigirRoles("ADMINISTRADOR", "DUENO", "VENDEDOR");
                Venta venta = this.buscarActiva(id);

                if (venta.getMedioPago() == null || !venta.getMedioPago().esFinanciacion()) {
                        throw new BusinessException("La venta seleccionada no utiliza un medio de pago financiado.");
                }

                validarDatosFinanciacion(
                                venta.getMedioPago(),
                                request.entidadFinanciera(),
                                request.montoFinanciado(),
                                request.estado(),
                                venta.getPrecioFinal());

                String anterior = "entidadFinanciera=" + venta.getEntidadFinanciera()
                                + ", montoFinanciado=" + venta.getMontoFinanciado()
                                + ", estadoFinanciacion=" + venta.getEstadoFinanciacion();

                venta.setEntidadFinanciera(normalizarOpcional(request.entidadFinanciera()));
                venta.setMontoFinanciado(request.montoFinanciado());
                venta.setEstadoFinanciacion(request.estado());

                Venta guardada = this.ventaRepository.save(venta);
                this.auditoriaService.registrar(
                                "ACTUALIZACION_FINANCIACION",
                                "Venta",
                                venta.getId(),
                                "Actualización de los datos básicos de financiación de la venta.",
                                anterior,
                                "entidadFinanciera=" + guardada.getEntidadFinanciera()
                                                + ", montoFinanciado=" + guardada.getMontoFinanciado()
                                                + ", estadoFinanciacion=" + guardada.getEstadoFinanciacion());

                return VentaMapper.toResponse(guardada);
        }

        @Transactional
        public VentaResponse marcarSeguimientoPostventaRealizado(Long id) {
                Usuario usuario = this.usuarioActualService.exigirRoles("ADMINISTRADOR", "DUENO", "VENDEDOR");
                Venta venta = this.buscarActiva(id);

                if (Boolean.TRUE.equals(venta.getSeguimientoPostventaRealizado())) {
                        return VentaMapper.toResponse(venta);
                }

                venta.setSeguimientoPostventaRealizado(true);
                Venta guardada = this.ventaRepository.save(venta);
                this.notificacionService.cerrarSeguimientoPostventa(guardada);

                this.auditoriaService.registrar(
                                "SEGUIMIENTO_POSTVENTA_REALIZADO",
                                "Venta",
                                venta.getId(),
                                "Seguimiento postventa marcado como realizado por " + usuario.getUsername(),
                                "seguimientoPostventaRealizado=false",
                                "seguimientoPostventaRealizado=true");

                return VentaMapper.toResponse(guardada);
        }

        @Transactional
        public VentaResponse actualizarProximoMantenimiento(
                        Long id,
                        ActualizarProximoMantenimientoRequest request) {
                Usuario usuario = this.usuarioActualService.exigirRoles(
                                "ADMINISTRADOR",
                                "DUENO",
                                "VENDEDOR");
                Venta venta = this.buscarActiva(id);

                validarProximoMantenimiento(request.proximoMantenimiento(), venta.getFechaVenta());
                LocalDate anterior = venta.getProximoMantenimiento();
                venta.setProximoMantenimiento(request.proximoMantenimiento());
                Venta guardada = this.ventaRepository.save(venta);
                this.notificacionService.cerrarProximoMantenimiento(guardada);

                this.auditoriaService.registrar(
                                "ACTUALIZACION_PROXIMO_MANTENIMIENTO",
                                "Venta",
                                venta.getId(),
                                "Fecha de próximo mantenimiento actualizada por " + usuario.getUsername(),
                                "proximoMantenimiento=" + anterior,
                                "proximoMantenimiento=" + guardada.getProximoMantenimiento());

                return VentaMapper.toResponse(guardada);
        }

        private void validarProximoMantenimiento(LocalDate fecha, LocalDate fechaVenta) {
                if (fecha == null) {
                        return;
                }
                if (fecha.isBefore(LocalDate.now())) {
                        throw new BusinessException(
                                        "La fecha de próximo mantenimiento no puede ser pasada.");
                }
                if (!fecha.isAfter(fechaVenta)) {
                        throw new BusinessException(
                                        "La fecha de próximo mantenimiento debe ser posterior a la fecha de venta.");
                }
        }

        private String normalizarOpcional(String valor) {
                if (valor == null) {
                        return null;
                }
                String limpio = valor.trim();
                return limpio.isEmpty() ? null : limpio;
        }

        @Transactional
        public void reintentarComprobante(Long id) {
                this.usuarioActualService.exigirRoles(
                                "ADMINISTRADOR",
                                "DUENO");

                this.buscarActiva(id);

                this.ventaComprobanteService.reprogramar(id);

                this.eventPublisher.publishEvent(
                                new VentaComprobanteSolicitadoEvent(id));
        }

        @Transactional(readOnly = true)
        public PdfService.ComprobanteResource obtenerComprobante(Long id) {
                Venta venta = this.buscarActiva(id);

                return this.pdfService.cargarComprobante(
                                venta.getComprobantePath());
        }

        private Venta buscarActiva(Long id) {
                Venta venta = this.ventaRepository
                                .findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "No se encontró la venta solicitada."));

                if (!Boolean.TRUE.equals(venta.getActivo())) {
                        throw new ResourceNotFoundException(
                                        "La venta solicitada no existe o ya no está disponible.");
                }
                return venta;
        }

        @Transactional(readOnly = true)
        public PageResponse<VentaResponse> listarPaginado(
                        int page,
                        int size,
                        LocalDate desde,
                        LocalDate hasta,
                        Long clienteId,
                        Long vehiculoId) {

                validarPaginacion(page, size);
                validarPeriodo(desde, hasta);
                validarIdentificadoresFiltro(clienteId, vehiculoId);

                return PageResponse.from(
                                this.ventaRepository.buscarPaginado(
                                                desde,
                                                hasta,
                                                clienteId,
                                                vehiculoId,
                                                PageRequest.of(page, size)),
                                VentaMapper::toResponse);
        }

        private void validarPaginacion(int page, int size) {
                if (page < 0
                                || size < 1
                                || size > 100
                                || (long) page * size > Integer.MAX_VALUE) {

                        throw new BusinessException(
                                        "La página solicitada no es válida.");
                }
        }

        private void validarPeriodo(
                        LocalDate desde,
                        LocalDate hasta) {

                if (desde != null
                                && hasta != null
                                && desde.isAfter(hasta)) {

                        throw new BusinessException(
                                        "La fecha inicial no puede ser posterior a la fecha final.");
                }
        }

        private void validarIdentificadoresFiltro(
                        Long clienteId,
                        Long vehiculoId) {

                validarIdentificadorFiltro(clienteId);
                validarIdentificadorFiltro(vehiculoId);
        }

        private void validarIdentificadorFiltro(Long id) {
                if (id != null && id <= 0) {
                        throw new BusinessException(
                                        "Revisá los filtros seleccionados.");
                }
        }
}