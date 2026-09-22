package uy.edu.ctc.pamahe.modules.ventas.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.data.domain.PageRequest;
import uy.edu.ctc.pamahe.common.response.PageResponse;
import org.springframework.transaction.annotation.Transactional;
import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.common.util.PdfService;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.clientes.model.Cliente;
import uy.edu.ctc.pamahe.modules.clientes.model.TipoCliente;
import uy.edu.ctc.pamahe.modules.clientes.service.ClienteService;
import uy.edu.ctc.pamahe.modules.compras.model.Compra;
import uy.edu.ctc.pamahe.modules.compras.repository.CompraRepository;
import uy.edu.ctc.pamahe.modules.costos.service.CostoService;
import uy.edu.ctc.pamahe.modules.taller.model.EstadoTarea;
import uy.edu.ctc.pamahe.modules.taller.repository.RefaccionRepository;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.usuarios.service.UsuarioActualService;
import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.service.VehiculoService;
import uy.edu.ctc.pamahe.modules.ventas.dto.request.VentaRequest;
import uy.edu.ctc.pamahe.modules.ventas.dto.response.VentaDetalleGerencialResponse;
import uy.edu.ctc.pamahe.modules.ventas.dto.response.VentaResponse;
import uy.edu.ctc.pamahe.modules.ventas.mapper.VentaMapper;
import uy.edu.ctc.pamahe.modules.ventas.model.Venta;
import uy.edu.ctc.pamahe.modules.ventas.repository.VentaRepository;

/**
 * Cierra el ciclo comercial de una unidad en una única transacción.
 * Antes de vender valida estado y tareas, fija una fotografía de costos, calcula la rentabilidad,
 * cambia el vehículo a VENDIDO y genera el comprobante administrativo correspondiente.
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

    public VentaService(VentaRepository ventaRepository,
                        VehiculoService vehiculoService,
                        ClienteService clienteService,
                        UsuarioActualService usuarioActualService,
                        CompraRepository compraRepository,
                        RefaccionRepository refaccionRepository,
                        CostoService costoService,
                        PdfService pdfService,
                        AuditoriaService auditoriaService) {
        this.ventaRepository = ventaRepository;
        this.vehiculoService = vehiculoService;
        this.clienteService = clienteService;
        this.usuarioActualService = usuarioActualService;
        this.compraRepository = compraRepository;
        this.refaccionRepository = refaccionRepository;
        this.costoService = costoService;
        this.pdfService = pdfService;
        this.auditoriaService = auditoriaService;
    }

    @Transactional(readOnly = true)
    public List<VentaResponse> listar() {
        return this.ventaRepository.findByActivoTrueOrderByFechaVentaDesc().stream()
                .map(VentaMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<VentaResponse> listarPaginado(int page, int size) {
        validarPaginacion(page, size);

        var resultado = this.ventaRepository.findByActivoTrueOrderByFechaVentaDesc(
                PageRequest.of(page, size));

        return PageResponse.from(resultado, VentaMapper::toResponse);
    }

    private void validarPaginacion(int page, int size) {
        if (page < 0) {
            throw new BusinessException("La página no puede ser negativa.");
        }
        if (size < 1 || size > 100) {
            throw new BusinessException("El tamaño de página debe estar entre 1 y 100.");
        }
    }

    @Transactional(readOnly = true)
    public VentaResponse obtener(Long id) {
        return VentaMapper.toResponse(this.buscarActiva(id));
    }

    @Transactional(readOnly = true)
    public VentaDetalleGerencialResponse obtenerDetalleGerencial(Long id) {
        this.usuarioActualService.exigirRoles("ADMINISTRADOR", "DUENO");
        return VentaMapper.toDetalleGerencial(this.buscarActiva(id));
    }

    @Transactional
    public VentaResponse crear(VentaRequest request) {
        Usuario vendedor = this.usuarioActualService.exigirRoles("ADMINISTRADOR", "DUENO", "VENDEDOR");
        // El bloqueo evita ventas duplicadas o cambios de taller simultáneos sobre la misma unidad.
        Vehiculo vehiculo = this.vehiculoService.buscarActivoPorIdConBloqueo(request.vehiculoId());

        if (this.ventaRepository.existsByVehiculo(vehiculo)) {
            throw new BusinessException("El vehículo ya tiene una venta activa registrada.");
        }
        if (vehiculo.getEstado() != EstadoVehiculo.DISPONIBLE
                && vehiculo.getEstado() != EstadoVehiculo.RESERVADO) {
            throw new BusinessException("Solo se puede vender un vehículo en estado DISPONIBLE o RESERVADO.");
        }
        if (this.refaccionRepository.existsByVehiculoAndActivoTrueAndEstadoTareaIn(
                vehiculo,
                List.of(EstadoTarea.PENDIENTE, EstadoTarea.EN_CURSO))) {
            throw new BusinessException("No se puede vender el vehículo mientras existan tareas pendientes o en curso.");
        }
        if (request.fechaVenta().isAfter(LocalDate.now())) {
            throw new BusinessException("La fecha de venta no puede ser futura.");
        }
        if (request.precioFinal().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("El precio final debe ser mayor que cero.");
        }

        Compra compra = this.compraRepository.findByVehiculoAndActivoTrue(vehiculo)
                .orElseThrow(() -> new BusinessException("El vehículo debe tener una compra activa antes de registrar la venta."));
        if (request.fechaVenta().isBefore(compra.getFechaCompra())) {
            throw new BusinessException("La fecha de venta no puede ser anterior a la fecha de compra.");
        }

        Cliente comprador = this.clienteService.buscarActivoPorId(request.clienteCompradorId());
        if (comprador.getTipoCliente() != TipoCliente.COMPRADOR
                && comprador.getTipoCliente() != TipoCliente.AMBOS) {
            throw new BusinessException("El cliente seleccionado no está habilitado para actuar como comprador.");
        }

        // El snapshot conserva el resultado económico tal como era al cerrar la operación.
        CostoService.CostoSnapshot snapshot = this.costoService.calcularActualParaVenta(vehiculo);
        BigDecimal rentabilidad = request.precioFinal().subtract(snapshot.costoTotal());

        Venta venta = new Venta();
        venta.setVehiculo(vehiculo);
        venta.setClienteComprador(comprador);
        venta.setVendedor(vendedor);
        venta.setFechaVenta(request.fechaVenta());
        venta.setCostoCompraAlVender(snapshot.costoCompra());
        venta.setCostoRefaccionesAlVender(snapshot.costoRefacciones());
        venta.setCostoTotalAlVender(snapshot.costoTotal());
        venta.setPrecioFinal(request.precioFinal());
        venta.setRentabilidadCalculada(rentabilidad);
        venta.setObservaciones(request.observaciones());

        // Se necesita el ID de la venta para dejar una referencia explícita en la auditoría del cambio de estado.
        Venta guardada = this.ventaRepository.save(venta);
        this.vehiculoService.marcarVendidoPorVenta(vehiculo, guardada.getId());

        String comprobante = this.pdfService.generarComprobante("VENTA", List.of(
                "Venta ID: " + guardada.getId(),
                "Vehículo: " + vehiculo.getMarca() + " " + vehiculo.getModelo() + " " + vehiculo.getAnio(),
                "Cliente comprador: " + comprador.getNombre() + " " + (comprador.getApellido() == null ? "" : comprador.getApellido()),
                "Documento comprador: " + comprador.getDocumento(),
                "Fecha de venta: " + request.fechaVenta(),
                "Precio final: " + request.precioFinal(),
                "Vendedor: " + vendedor.getNombre()
        ));
        guardada.setComprobantePath(comprobante);
        guardada = this.ventaRepository.save(guardada);

        this.auditoriaService.registrar(
                "ALTA",
                "Venta",
                guardada.getId(),
                "Registro de venta del vehículo " + vehiculo.getId(),
                null,
                "vehiculoId=" + vehiculo.getId()
                        + ", clienteCompradorId=" + comprador.getId()
                        + ", vendedorId=" + vendedor.getId()
                        + ", fechaVenta=" + request.fechaVenta()
                        + ", costoCompraAlVender=" + snapshot.costoCompra()
                        + ", costoRefaccionesAlVender=" + snapshot.costoRefacciones()
                        + ", costoTotalAlVender=" + snapshot.costoTotal()
                        + ", precioFinal=" + request.precioFinal()
                        + ", rentabilidad=" + rentabilidad
        );
        return VentaMapper.toResponse(guardada);
    }

    @Transactional(readOnly = true)
    public PdfService.ComprobanteResource obtenerComprobante(Long id) {
        Venta venta = this.buscarActiva(id);
        return this.pdfService.cargarComprobante(venta.getComprobantePath());
    }

    private Venta buscarActiva(Long id) {
        Venta venta = this.ventaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la venta solicitada."));
        if (!Boolean.TRUE.equals(venta.getActivo())) {
            throw new ResourceNotFoundException("No se encontró una venta activa con el identificador solicitado.");
        }
        return venta;
    }
}
