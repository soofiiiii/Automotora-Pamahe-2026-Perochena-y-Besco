package uy.edu.ctc.pamahe.modules.ventas.event;

import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import uy.edu.ctc.pamahe.common.util.PdfService;
import uy.edu.ctc.pamahe.modules.ventas.service.VentaComprobanteService;
import uy.edu.ctc.pamahe.modules.ventas.model.CanalOrigenVenta;
import uy.edu.ctc.pamahe.modules.ventas.model.MedioPagoVenta;
import uy.edu.ctc.pamahe.modules.ventas.service.VentaComprobanteService.ComprobanteVentaSnapshot;

@ExtendWith(MockitoExtension.class)
class VentaComprobanteListenerTest {

    @Mock PdfService pdfService;
    @Mock VentaComprobanteService stateService;
    private VentaComprobanteListener listener;

    @BeforeEach
    void setUp() {
        listener = new VentaComprobanteListener(pdfService, stateService);
    }

    @Test
    void generaYMarcaComprobanteCuandoElPdfEsExitoso() {
        when(stateService.prepararIntento(9L)).thenReturn(Optional.of(snapshot()));
        when(pdfService.generarComprobante(eq("VENTA"), anyList())).thenReturn("ventas/9.pdf");

        listener.procesar(9L);

        verify(stateService).marcarGenerado(9L, "ventas/9.pdf");
        verify(stateService, never()).marcarError(anyLong(), any());
    }

    @Test
    void falloDelPdfQuedaEnEstadoRecuperable() {
        when(stateService.prepararIntento(9L)).thenReturn(Optional.of(snapshot()));
        RuntimeException error = new RuntimeException("generador caído");
        when(pdfService.generarComprobante(eq("VENTA"), anyList())).thenThrow(error);

        listener.procesar(9L);

        verify(stateService).marcarError(9L, error);
        verify(stateService, never()).marcarGenerado(anyLong(), anyString());
    }

    @Test
    void siFallaLaAsociacionEliminaElPdfHuerfanoYProgramaReintento() {
        when(stateService.prepararIntento(9L)).thenReturn(Optional.of(snapshot()));
        when(pdfService.generarComprobante(eq("VENTA"), anyList())).thenReturn("ventas/9.pdf");
        RuntimeException error = new RuntimeException("fallo al asociar");
        doThrow(error).when(stateService).marcarGenerado(9L, "ventas/9.pdf");

        listener.procesar(9L);

        verify(pdfService).eliminarComprobante("ventas/9.pdf");
        verify(stateService).marcarError(9L, error);
    }

    private ComprobanteVentaSnapshot snapshot() {
        return new ComprobanteVentaSnapshot(
                9L, "Toyota Corolla 2022", "Ana Pérez", "12345678",
                LocalDate.of(2026, 9, 29), new BigDecimal("15000.00"),
                MedioPagoVenta.TRANSFERENCIA, null, null, null, CanalOrigenVenta.PRESENCIAL,
                "Vendedor", 1);
    }
}
