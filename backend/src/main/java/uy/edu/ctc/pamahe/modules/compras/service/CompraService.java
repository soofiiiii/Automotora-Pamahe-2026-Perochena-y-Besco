package uy.edu.ctc.pamahe.modules.compras.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.common.response.PageResponse;
import uy.edu.ctc.pamahe.common.util.PdfService;
import uy.edu.ctc.pamahe.common.util.SecurityUtils;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.clientes.model.Cliente;
import uy.edu.ctc.pamahe.modules.clientes.model.TipoCliente;
import uy.edu.ctc.pamahe.modules.clientes.service.ClienteService;
import uy.edu.ctc.pamahe.modules.compras.dto.request.CompraRequest;
import uy.edu.ctc.pamahe.modules.compras.dto.request.CompraConVehiculoRequest;
import uy.edu.ctc.pamahe.modules.compras.dto.request.DefinirDestinoPostCompraRequest;
import uy.edu.ctc.pamahe.modules.compras.dto.request.DestinoPostCompra;
import uy.edu.ctc.pamahe.modules.compras.dto.response.CompraRegistroResponse;
import uy.edu.ctc.pamahe.modules.compras.dto.response.CompraResponse;
import uy.edu.ctc.pamahe.modules.compras.dto.response.DestinoPostCompraResponse;
import uy.edu.ctc.pamahe.modules.compras.mapper.CompraMapper;
import uy.edu.ctc.pamahe.modules.compras.model.Compra;
import uy.edu.ctc.pamahe.modules.compras.repository.CompraRepository;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.usuarios.service.UsuarioActualService;
import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.repository.VehiculoRepository;
import uy.edu.ctc.pamahe.modules.vehiculos.service.VehiculoService;

/**
 * Registra el ingreso económico del vehículo y fija su costo inicial.
 * La operación conserva cliente vendedor, usuario autenticado y comprobante en
 * una sola transacción para que el comienzo del ciclo del vehículo quede
 * completo o se revierta en conjunto.
 */
@Service
public class CompraService {

    private final CompraRepository compraRepository;
    private final VehiculoService vehiculoService;
    private final VehiculoRepository vehiculoRepository;
    private final ClienteService clienteService;
    private final UsuarioActualService usuarioActualService;
    private final PdfService pdfService;
    private final AuditoriaService auditoriaService;

    public CompraService(
            CompraRepository compraRepository,
            VehiculoService vehiculoService,
            VehiculoRepository vehiculoRepository,
            ClienteService clienteService,
            UsuarioActualService usuarioActualService,
            PdfService pdfService,
            AuditoriaService auditoriaService) {

        this.compraRepository = compraRepository;
        this.vehiculoService = vehiculoService;
        this.vehiculoRepository = vehiculoRepository;
        this.clienteService = clienteService;
        this.usuarioActualService = usuarioActualService;
        this.pdfService = pdfService;
        this.auditoriaService = auditoriaService;
    }

    @Transactional(readOnly = true)
    public List<CompraResponse> listar() {
        return this.compraRepository
                .findByActivoTrueOrderByFechaCompraDesc()
                .stream()
                .map(CompraMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<CompraResponse> listarPaginado(int page, int size) {
        validarPaginacion(page, size);

        return PageResponse.from(
                this.compraRepository.findByActivoTrueOrderByFechaCompraDesc(
                        PageRequest.of(page, size)),
                CompraMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public CompraResponse obtener(Long id) {
        return CompraMapper.toResponse(this.buscarActiva(id));
    }

    @Transactional
    public Object crearConVehiculo(CompraConVehiculoRequest request) {
        Usuario responsable = this.usuarioActualService.exigirRoles(
                "ADMINISTRADOR",
                "DUENO",
                "VENDEDOR");

        Vehiculo vehiculo = this.vehiculoService.crearParaCompra(request.vehiculo());
        CompraRequest compraRequest = new CompraRequest(
                vehiculo.getId(),
                request.clienteVendedorId(),
                request.fechaCompra(),
                request.costoAdquisicion(),
                request.observaciones());
        return this.registrarCompra(compraRequest, responsable);
    }

    @Transactional
    public Object crear(CompraRequest request) {
        Usuario responsable = this.usuarioActualService.exigirRoles(
                "ADMINISTRADOR",
                "DUENO",
                "VENDEDOR");
        return this.registrarCompra(request, responsable);
    }

    private Object registrarCompra(CompraRequest request, Usuario responsable) {
        Vehiculo vehiculo = this.vehiculoService
                .buscarActivoPorIdConBloqueo(request.vehiculoId());

        validarVehiculoParaCompra(vehiculo);
        validarFechaCompra(request.fechaCompra());

        Cliente clienteVendedor = this.clienteService
                .buscarActivoPorId(request.clienteVendedorId());

        validarClienteVendedor(clienteVendedor);

        Compra guardada = registrarCompraInicial(
                request,
                vehiculo,
                clienteVendedor,
                responsable);

        actualizarCostoInicialVehiculo(
                vehiculo,
                request.costoAdquisicion());

        guardada = generarYAsignarComprobante(
                guardada,
                request,
                vehiculo,
                clienteVendedor,
                responsable);

        registrarAuditoriaCompra(
                guardada,
                request,
                vehiculo,
                clienteVendedor);

        return construirRespuestaRegistro(
                guardada,
                vehiculo,
                clienteVendedor,
                responsable);
    }

    @Transactional
    public DestinoPostCompraResponse definirDestinoPostCompra(
            Long compraId,
            DefinirDestinoPostCompraRequest request) {
        this.usuarioActualService.exigirRoles("ADMINISTRADOR", "DUENO", "VENDEDOR");

        Compra compra = this.buscarActiva(compraId);
        Vehiculo vehiculo = this.vehiculoService
                .buscarActivoPorIdConBloqueo(compra.getVehiculo().getId());

        if (vehiculo.getEstado() != EstadoVehiculo.COMPRADO) {
            throw new BusinessException(
                    "La decisión posterior a la compra solo puede realizarse mientras el vehículo esté en estado Comprado.");
        }

        EstadoVehiculo destino = request.destino() == DestinoPostCompra.REQUIERE_TALLER
                ? EstadoVehiculo.EN_TALLER
                : EstadoVehiculo.DISPONIBLE;

        String motivo = request.destino() == DestinoPostCompra.REQUIERE_TALLER
                ? "Decisión posterior a compra: requiere taller"
                : "Decisión posterior a compra: puede quedar disponible";

        this.vehiculoService.cambiarEstadoPorSistema(vehiculo, destino, motivo);

        return new DestinoPostCompraResponse(compra.getId(), vehiculo.getId(), destino);
    }

    @Transactional(readOnly = true)
    public PdfService.ComprobanteResource obtenerComprobante(Long id) {
        Compra compra = this.buscarActiva(id);
        return this.pdfService.cargarComprobante(compra.getComprobantePath());
    }

    @Transactional(readOnly = true)
    public Compra buscarActivaPorVehiculo(Vehiculo vehiculo) {
        return this.compraRepository
                .findByVehiculoAndActivoTrue(vehiculo)
                .orElseThrow(() -> new BusinessException(
                        "El vehículo no posee una compra activa registrada."));
    }

    @Transactional(readOnly = true)
    public PageResponse<CompraResponse> listarPaginado(
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
                this.compraRepository.buscarPaginado(
                        desde,
                        hasta,
                        clienteId,
                        vehiculoId,
                        PageRequest.of(page, size)),
                CompraMapper::toResponse);
    }

    private Compra buscarActiva(Long id) {
        Compra compra = this.compraRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontró la compra solicitada."));

        if (!Boolean.TRUE.equals(compra.getActivo())) {
            throw new ResourceNotFoundException(
                    "La compra solicitada no existe o ya no está disponible.");
        }

        return compra;
    }

    private void validarPaginacion(int page, int size) {
        if ((long) page * size > Integer.MAX_VALUE) {
            throw new BusinessException(
                    "La página solicitada no es válida.");
        }

        if (page < 0) {
            throw new BusinessException(
                    "La página solicitada no es válida.");
        }

        if (size < 1 || size > 100) {
            throw new BusinessException(
                    "No pudimos mostrar esa página. Actualizá la vista e intentá nuevamente.");
        }
    }

    private void validarVehiculoParaCompra(Vehiculo vehiculo) {

        if (this.compraRepository.existsByVehiculo(vehiculo)) {
            throw new BusinessException(
                    "El vehículo ya tiene una compra registrada.");
        }

        if (vehiculo.getEstado() != EstadoVehiculo.COMPRADO) {
            throw new BusinessException(
                    "La compra solo puede registrarse cuando el vehículo está en estado Comprado.");
        }
    }

    private void validarFechaCompra(LocalDate fechaCompra) {
        if (fechaCompra.isAfter(LocalDate.now())) {
            throw new BusinessException(
                    "La fecha de compra no puede ser futura.");
        }
    }

    private void validarClienteVendedor(Cliente clienteVendedor) {
        TipoCliente tipoCliente = clienteVendedor.getTipoCliente();

        if (tipoCliente != TipoCliente.VENDEDOR
                && tipoCliente != TipoCliente.AMBOS) {

            throw new BusinessException(
                    "El cliente seleccionado no está habilitado para actuar como vendedor.");
        }
    }

    private Compra registrarCompraInicial(
            CompraRequest request,
            Vehiculo vehiculo,
            Cliente clienteVendedor,
            Usuario responsable) {

        Compra compra = new Compra();

        compra.setVehiculo(vehiculo);
        compra.setClienteVendedor(clienteVendedor);
        compra.setUsuarioResponsable(responsable);
        compra.setFechaCompra(request.fechaCompra());
        compra.setCostoAdquisicion(request.costoAdquisicion());
        compra.setObservaciones(request.observaciones());

        return this.compraRepository.save(compra);
    }

    private void actualizarCostoInicialVehiculo(
            Vehiculo vehiculo,
            java.math.BigDecimal costoAdquisicion) {

        vehiculo.setCostoInicial(costoAdquisicion);
        this.vehiculoRepository.save(vehiculo);
    }

    private Compra generarYAsignarComprobante(
            Compra compra,
            CompraRequest request,
            Vehiculo vehiculo,
            Cliente clienteVendedor,
            Usuario responsable) {

        String comprobante = this.pdfService.generarComprobante(
                "COMPRA",
                List.of(
                        "Compra ID: " + compra.getId(),
                        "Vehículo: " + construirNombreVehiculo(vehiculo),
                        "Cliente vendedor: " + construirNombreCliente(clienteVendedor),
                        "Documento vendedor: " + clienteVendedor.getDocumento(),
                        "Fecha de compra: " + request.fechaCompra(),
                        "Costo de adquisición: " + request.costoAdquisicion(),
                        "Registrado por: " + responsable.getNombre()));

        compra.setComprobantePath(comprobante);

        return this.compraRepository.save(compra);
    }

    private void registrarAuditoriaCompra(
            Compra compra,
            CompraRequest request,
            Vehiculo vehiculo,
            Cliente clienteVendedor) {

        this.auditoriaService.registrar(
                "ALTA",
                "Compra",
                compra.getId(),
                "Registro de compra del vehículo " + vehiculo.getId(),
                null,
                "vehiculoId=" + vehiculo.getId()
                        + ", clienteVendedorId=" + clienteVendedor.getId()
                        + ", costoAdquisicion=" + request.costoAdquisicion()
                        + ", fechaCompra=" + request.fechaCompra());
    }

    private Object construirRespuestaRegistro(
            Compra compra,
            Vehiculo vehiculo,
            Cliente clienteVendedor,
            Usuario responsable) {

        if (SecurityUtils.tieneAlgunRol("ADMINISTRADOR", "DUENO")) {
            return CompraMapper.toResponse(compra);
        }

        return new CompraRegistroResponse(
                compra.getId(),
                vehiculo.getId(),
                construirNombreVehiculo(vehiculo),
                clienteVendedor.getId(),
                construirNombreCliente(clienteVendedor),
                responsable.getId(),
                responsable.getNombre(),
                compra.getFechaCompra());
    }

    private String construirNombreVehiculo(Vehiculo vehiculo) {
        return (vehiculo.getMarca()
                + " "
                + vehiculo.getModelo()
                + " "
                + vehiculo.getAnio())
                .trim();
    }

    private String construirNombreCliente(Cliente cliente) {
        return (cliente.getNombre()
                + " "
                + obtenerApellidoSeguro(cliente))
                .trim();
    }

    private String obtenerApellidoSeguro(Cliente cliente) {
        if (cliente.getApellido() == null) {
            return "";
        }

        return cliente.getApellido();
    }

    private void validarPeriodo(LocalDate desde, LocalDate hasta) {
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