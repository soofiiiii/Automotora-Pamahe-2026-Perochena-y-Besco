package uy.edu.ctc.pamahe.modules.ventas.job;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import uy.edu.ctc.pamahe.modules.ventas.event.VentaComprobanteListener;
import uy.edu.ctc.pamahe.modules.ventas.model.EstadoComprobanteVenta;
import uy.edu.ctc.pamahe.modules.ventas.repository.VentaRepository;
import uy.edu.ctc.pamahe.modules.ventas.service.VentaComprobanteService;

/**
 * Reconciliación durable de ventas sin comprobante. Se ejecuta al iniciar la
 * aplicación y luego periódicamente para recuperar fallos transitorios o
 * procesos interrumpidos después del commit de la venta.
 */
@Component
public class VentaComprobanteReconciliacionJob {

    private static final Logger log = LoggerFactory.getLogger(VentaComprobanteReconciliacionJob.class);
    private static final int LOTE = 25;
    private static final List<EstadoComprobanteVenta> REINTENTABLES = List.of(
            EstadoComprobanteVenta.PENDIENTE,
            EstadoComprobanteVenta.ERROR);

    private final VentaRepository ventaRepository;
    private final VentaComprobanteListener listener;

    public VentaComprobanteReconciliacionJob(
            VentaRepository ventaRepository,
            VentaComprobanteListener listener) {
        this.ventaRepository = ventaRepository;
        this.listener = listener;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void reconciliarAlArranque() {
        reconciliar();
    }

    @Scheduled(
            fixedDelayString = "${app.comprobantes.reconciliacion-ms:60000}",
            initialDelayString = "${app.comprobantes.reconciliacion-inicial-ms:15000}")
    public void reconciliarProgramado() {
        reconciliar();
    }

    void reconciliar() {
        List<Long> ventaIds = this.ventaRepository.findIdsComprobantesReintentables(
                REINTENTABLES,
                VentaComprobanteService.MAX_INTENTOS,
                LocalDateTime.now(),
                PageRequest.of(0, LOTE));

        if (!ventaIds.isEmpty()) {
            log.info("Reprogramando {} comprobante(s) de venta pendiente(s).", ventaIds.size());
        }

        ventaIds.forEach(this.listener::reintentar);
    }
}
