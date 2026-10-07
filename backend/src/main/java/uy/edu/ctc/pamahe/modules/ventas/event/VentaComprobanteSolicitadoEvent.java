package uy.edu.ctc.pamahe.modules.ventas.event;

/**
 * Disparador de baja latencia para una venta que ya dejó persistido su estado
 * PENDIENTE. El contenido del comprobante se reconstruye desde la base para
 * que el proceso sea recuperable después de un reinicio.
 */
public record VentaComprobanteSolicitadoEvent(Long ventaId) {
}
