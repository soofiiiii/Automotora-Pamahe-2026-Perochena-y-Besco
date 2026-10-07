package uy.edu.ctc.pamahe.modules.ventas.event;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import uy.edu.ctc.pamahe.common.util.PdfService;
import uy.edu.ctc.pamahe.modules.ventas.service.VentaComprobanteService;
import uy.edu.ctc.pamahe.modules.ventas.service.VentaComprobanteService.ComprobanteVentaSnapshot;

/**
 * Genera comprobantes fuera de la transacción de venta. El evento acelera el
 * primer intento, pero el estado persistido y el job de reconciliación evitan
 * depender de que este evento permanezca en memoria.
 */
@Component
public class VentaComprobanteListener {

    private static final Logger log = LoggerFactory.getLogger(VentaComprobanteListener.class);

    private final PdfService pdfService;
    private final VentaComprobanteService ventaComprobanteService;

    public VentaComprobanteListener(
            PdfService pdfService,
            VentaComprobanteService ventaComprobanteService) {
        this.pdfService = pdfService;
        this.ventaComprobanteService = ventaComprobanteService;
    }

    @Async("comprobanteExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void generarComprobante(VentaComprobanteSolicitadoEvent event) {
        procesar(event.ventaId());
    }

    @Async("comprobanteExecutor")
    public void reintentar(Long ventaId) {
        procesar(ventaId);
    }

    void procesar(Long ventaId) {
        var intento = this.ventaComprobanteService.prepararIntento(ventaId);
        if (intento.isEmpty()) {
            return;
        }

        ComprobanteVentaSnapshot snapshot = intento.get();
        String ruta = null;

        try {
            List<String> lineas = new ArrayList<>();
            lineas.add("Venta ID: " + snapshot.ventaId());
            lineas.add("Vehículo: " + snapshot.vehiculo());
            lineas.add("Cliente comprador: " + snapshot.clienteComprador());
            lineas.add("Documento comprador: " + snapshot.documentoComprador());
            lineas.add("Fecha de venta: " + snapshot.fechaVenta());
            lineas.add("Precio final: " + snapshot.precioFinal());
            lineas.add("Medio de pago: " + (snapshot.medioPago() == null ? "No informado" : snapshot.medioPago()));
            if (snapshot.medioPago() != null && snapshot.medioPago().esFinanciacion()) {
                lineas.add("Entidad financiera: " + snapshot.entidadFinanciera());
                lineas.add("Monto financiado: " + snapshot.montoFinanciado());
                lineas.add("Estado de financiación: " + snapshot.estadoFinanciacion());
            }
            lineas.add("Canal de origen: " + (snapshot.canalOrigen() == null ? "No informado" : snapshot.canalOrigen()));
            lineas.add("Vendedor: " + snapshot.vendedor());

            ruta = this.pdfService.generarComprobante("VENTA", lineas);

            this.ventaComprobanteService.marcarGenerado(snapshot.ventaId(), ruta);
        } catch (Exception exception) {
            if (ruta != null) {
                this.pdfService.eliminarComprobante(ruta);
            }

            try {
                this.ventaComprobanteService.marcarError(snapshot.ventaId(), exception);
            } catch (Exception stateException) {
                log.error(
                        "No se pudo persistir el estado de error del comprobante de la venta {}.",
                        snapshot.ventaId(),
                        stateException);
            }

            log.error(
                    "Falló el intento {} de generación del comprobante de la venta {}.",
                    snapshot.numeroIntento(),
                    snapshot.ventaId(),
                    exception);
        }
    }
}
