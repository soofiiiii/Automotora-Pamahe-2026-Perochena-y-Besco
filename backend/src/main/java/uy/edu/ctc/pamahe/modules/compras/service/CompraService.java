package uy.edu.ctc.pamahe.modules.compras.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;
import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.common.util.PdfService;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.clientes.model.Cliente;
import uy.edu.ctc.pamahe.modules.clientes.model.TipoCliente;
import uy.edu.ctc.pamahe.modules.clientes.service.ClienteService;
import uy.edu.ctc.pamahe.modules.compras.dto.request.CompraRequest;
import uy.edu.ctc.pamahe.modules.compras.dto.response.CompraResponse;
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
 * La operación conserva cliente vendedor, usuario autenticado y comprobante en una sola transacción
 * para que el comienzo del ciclo del vehículo quede completo o se revierta en conjunto.
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

    public CompraService(CompraRepository compraRepository,
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
        return this.compraRepository.findByActivoTrueOrderByFechaCompraDesc().stream()
                .map(CompraMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CompraResponse obtener(Long id) {
        return CompraMapper.toResponse(this.buscarActiva(id));
    }

    @Transactional
    public CompraResponse crear(CompraRequest request) {
        Usuario responsable = this.usuarioActualService.exigirRoles("ADMINISTRADOR", "DUENO", "VENDEDOR");
        Vehiculo vehiculo = this.vehiculoService.buscarActivoPorIdConBloqueo(request.vehiculoId());
        // La relación uno a uno impide reconstruir el origen económico con compras contradictorias.
        if (this.compraRepository.existsByVehiculo(vehiculo)) {
            throw new BusinessException("El vehículo ya tiene una compra registrada.");
        }
        if (vehiculo.getEstado() != EstadoVehiculo.COMPRADO) {
            throw new BusinessException("La compra solo puede registrarse cuando el vehículo se encuentra en estado COMPRADO.");
        }
        if (request.fechaCompra().isAfter(LocalDate.now())) {
            throw new BusinessException("La fecha de compra no puede ser futura.");
        }

        Cliente clienteVendedor = this.clienteService.buscarActivoPorId(request.clienteVendedorId());
        if (clienteVendedor.getTipoCliente() != TipoCliente.VENDEDOR
                && clienteVendedor.getTipoCliente() != TipoCliente.AMBOS) {
            throw new BusinessException("El cliente seleccionado no está habilitado para actuar como vendedor.");
        }

        Compra compra = new Compra();
        compra.setVehiculo(vehiculo);
        compra.setClienteVendedor(clienteVendedor);
        compra.setUsuarioResponsable(responsable);
        compra.setFechaCompra(request.fechaCompra());
        compra.setCostoAdquisicion(request.costoAdquisicion());
        compra.setObservaciones(request.observaciones());

        Compra guardada = this.compraRepository.save(compra);
        // El costo se replica en el vehículo para consultas operativas;
        // la compra continúa siendo la fuente histórica.
        vehiculo.setCostoInicial(request.costoAdquisicion());
        this.vehiculoRepository.save(vehiculo);

        String comprobante = this.pdfService.generarComprobante("COMPRA", List.of(
                "Compra ID: " + guardada.getId(),
                "Vehículo: " + vehiculo.getMarca() + " " + vehiculo.getModelo() + " " + vehiculo.getAnio(),
                "Cliente vendedor: " + clienteVendedor.getNombre() + " " + (clienteVendedor.getApellido() == null ? "" : clienteVendedor.getApellido()),
                "Documento vendedor: " + clienteVendedor.getDocumento(),
                "Fecha de compra: " + request.fechaCompra(),
                "Costo de adquisición: " + request.costoAdquisicion(),
                "Registrado por: " + responsable.getNombre()
        ));
        guardada.setComprobantePath(comprobante);
        guardada = this.compraRepository.save(guardada);

        this.auditoriaService.registrar(
                "ALTA",
                "Compra",
                guardada.getId(),
                "Registro de compra del vehículo " + vehiculo.getId(),
                null,
                "vehiculoId=" + vehiculo.getId()
                        + ", clienteVendedorId=" + clienteVendedor.getId()
                        + ", costoAdquisicion=" + request.costoAdquisicion()
                        + ", fechaCompra=" + request.fechaCompra()
        );
        return CompraMapper.toResponse(guardada);
    }

    @Transactional(readOnly = true)
    public PdfService.ComprobanteResource obtenerComprobante(Long id) {
        Compra compra = this.buscarActiva(id);
        return this.pdfService.cargarComprobante(compra.getComprobantePath());
    }

    @Transactional(readOnly = true)
    public Compra buscarActivaPorVehiculo(Vehiculo vehiculo) {
        return this.compraRepository.findByVehiculoAndActivoTrue(vehiculo)
                .orElseThrow(() -> new BusinessException("El vehículo no posee una compra activa registrada."));
    }

    private Compra buscarActiva(Long id) {
        Compra compra = this.compraRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la compra solicitada."));
        if (!Boolean.TRUE.equals(compra.getActivo())) {
            throw new ResourceNotFoundException("No se encontró una compra activa con el identificador solicitado.");
        }
        return compra;
    }
}