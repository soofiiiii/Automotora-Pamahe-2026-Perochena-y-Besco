package uy.edu.ctc.pamahe.modules.ventas.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.ventas.model.EstadoComprobanteVenta;
import uy.edu.ctc.pamahe.modules.ventas.model.Venta;
import uy.edu.ctc.pamahe.modules.ventas.repository.VentaRepository;

/**
 * Mantiene el estado durable del comprobante de venta.
 * La generación del PDF ocurre fuera de estas transacciones; aquí solo se
 * reserva un intento, se persiste su resultado y se prepara la información
 * necesaria para reconstruir el documento después de un reinicio.
 */
@Service
public class VentaComprobanteService {

    public static final int MAX_INTENTOS = 5;
    private static final int LEASE_MINUTES = 5;

    private final VentaRepository ventaRepository;
    private final AuditoriaService auditoriaService;

    public VentaComprobanteService(
            VentaRepository ventaRepository,
            AuditoriaService auditoriaService) {
        this.ventaRepository = ventaRepository;
        this.auditoriaService = auditoriaService;
    }

    @Transactional
    public Optional<ComprobanteVentaSnapshot> prepararIntento(Long ventaId) {
        Venta venta = buscarParaActualizar(ventaId);
        LocalDateTime ahora = LocalDateTime.now();

        if (venta.getEstadoComprobante() == EstadoComprobanteVenta.GENERADO
                || venta.getComprobantePath() != null) {
            return Optional.empty();
        }

        int intentos = valorIntentos(venta);
        if (intentos >= MAX_INTENTOS) {
            return Optional.empty();
        }

        LocalDateTime proximoIntento = venta.getProximoIntentoComprobante();
        if (proximoIntento != null && proximoIntento.isAfter(ahora)) {
            return Optional.empty();
        }

        int numeroIntento = intentos + 1;
        venta.setEstadoComprobante(EstadoComprobanteVenta.PENDIENTE);
        venta.setIntentosComprobante(numeroIntento);
        venta.setUltimoIntentoComprobante(ahora);
        venta.setProximoIntentoComprobante(ahora.plusMinutes(LEASE_MINUTES));

        return Optional.of(snapshot(venta, numeroIntento));
    }

    @Transactional
    public void marcarGenerado(Long ventaId, String comprobantePath) {
        Venta venta = buscarParaActualizar(ventaId);
        venta.setComprobantePath(comprobantePath);
        venta.setEstadoComprobante(EstadoComprobanteVenta.GENERADO);
        venta.setErrorComprobante(null);
        venta.setProximoIntentoComprobante(null);

        this.auditoriaService.registrar(
                "COMPROBANTE_GENERADO",
                "Venta",
                ventaId,
                "Comprobante PDF de venta generado y asociado correctamente.");
    }

    @Transactional
    public void marcarError(Long ventaId, Throwable error) {
        Venta venta = buscarParaActualizar(ventaId);
        LocalDateTime ahora = LocalDateTime.now();
        int intentos = valorIntentos(venta);

        venta.setEstadoComprobante(EstadoComprobanteVenta.ERROR);
        venta.setErrorComprobante(mensajeError(error));
        venta.setProximoIntentoComprobante(
                intentos < MAX_INTENTOS ? ahora.plusMinutes(minutosBackoff(intentos)) : null);

        this.auditoriaService.registrar(
                "COMPROBANTE_ERROR",
                "Venta",
                ventaId,
                intentos < MAX_INTENTOS
                        ? "Falló la generación del comprobante; quedó programado un reintento automático."
                        : "Falló la generación del comprobante y se agotaron los reintentos automáticos.");
    }

    @Transactional
    public void reprogramar(Long ventaId) {
        Venta venta = buscarParaActualizar(ventaId);
        if (venta.getEstadoComprobante() == EstadoComprobanteVenta.GENERADO
                || venta.getComprobantePath() != null) {
            throw new BusinessException("La venta ya posee un comprobante generado.");
        }

        venta.setEstadoComprobante(EstadoComprobanteVenta.PENDIENTE);
        venta.setIntentosComprobante(0);
        venta.setUltimoIntentoComprobante(null);
        venta.setProximoIntentoComprobante(LocalDateTime.now());
        venta.setErrorComprobante(null);

        this.auditoriaService.registrar(
                "COMPROBANTE_REPROGRAMADO",
                "Venta",
                ventaId,
                "Se habilitó nuevamente la generación del comprobante de venta.");
    }

    private Venta buscarParaActualizar(Long ventaId) {
        Venta venta = this.ventaRepository.findByIdForComprobanteUpdate(ventaId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontró la venta para procesar su comprobante."));
        if (!Boolean.TRUE.equals(venta.getActivo())) {
            throw new ResourceNotFoundException(
                    "No se encontró una venta activa para procesar su comprobante.");
        }
        return venta;
    }

    private ComprobanteVentaSnapshot snapshot(Venta venta, int numeroIntento) {
        String vehiculo = (venta.getVehiculo().getMarca() + " "
                + venta.getVehiculo().getModelo() + " "
                + venta.getVehiculo().getAnio()).trim();
        String comprador = (venta.getClienteComprador().getNombre() + " "
                + (venta.getClienteComprador().getApellido() == null
                        ? ""
                        : venta.getClienteComprador().getApellido()))
                .trim();

        return new ComprobanteVentaSnapshot(
                venta.getId(),
                vehiculo,
                comprador,
                venta.getClienteComprador().getDocumento(),
                venta.getFechaVenta(),
                venta.getPrecioFinal(),
                venta.getMedioPago(),
                venta.getEntidadFinanciera(),
                venta.getMontoFinanciado(),
                venta.getEstadoFinanciacion(),
                venta.getCanalOrigen(),
                venta.getVendedor().getNombre(),
                numeroIntento);
    }

    private int valorIntentos(Venta venta) {
        return venta.getIntentosComprobante() == null ? 0 : venta.getIntentosComprobante();
    }

    private long minutosBackoff(int intento) {
        return Math.min(30L, 1L << Math.max(0, intento - 1));
    }

    private String mensajeError(Throwable error) {
        return error == null
                ? "No se pudo generar el comprobante PDF."
                : "No se pudo generar el comprobante PDF en el último intento.";
    }

    public record ComprobanteVentaSnapshot(
            Long ventaId,
            String vehiculo,
            String clienteComprador,
            String documentoComprador,
            LocalDate fechaVenta,
            BigDecimal precioFinal,
            uy.edu.ctc.pamahe.modules.ventas.model.MedioPagoVenta medioPago,
            String entidadFinanciera,
            BigDecimal montoFinanciado,
            uy.edu.ctc.pamahe.modules.ventas.model.EstadoFinanciacion estadoFinanciacion,
            uy.edu.ctc.pamahe.modules.ventas.model.CanalOrigenVenta canalOrigen,
            String vendedor,
            int numeroIntento) {
    }
}
