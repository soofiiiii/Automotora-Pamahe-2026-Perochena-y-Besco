package uy.edu.ctc.pamahe.modules.exportaciones.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import uy.edu.ctc.pamahe.modules.reportes.dto.response.ReporteRentabilidadResponse;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.ReporteVentaItemResponse;
import uy.edu.ctc.pamahe.modules.reportes.service.ReporteService;

@ExtendWith(MockitoExtension.class)
class ReportePdfServiceTest {

    @Mock
    private ReporteService reporteService;

    private ReportePdfService service;

    @BeforeEach
    void setUp() {
        service = new ReportePdfService(reporteService);
    }

    @Test
    void generaPdfDeRentabilidadUsandoElPeriodoSolicitado() {
        LocalDate desde = LocalDate.of(2026, 9, 1);
        LocalDate hasta = LocalDate.of(2026, 9, 30);
        ReporteVentaItemResponse operacion = new ReporteVentaItemResponse(
                9L,
                1L,
                "Toyota Corolla 2020",
                LocalDate.of(2026, 9, 20),
                new BigDecimal("15000"),
                new BigDecimal("12000"),
                new BigDecimal("3000"));
        ReporteRentabilidadResponse reporte = new ReporteRentabilidadResponse(
                desde,
                hasta,
                1,
                new BigDecimal("15000"),
                new BigDecimal("12000"),
                new BigDecimal("3000"),
                new BigDecimal("20"),
                List.of(operacion));

        when(reporteService.rentabilidad(desde, hasta)).thenReturn(reporte);

        byte[] pdf = service.rentabilidad(desde, hasta);

        verify(reporteService).rentabilidad(desde, hasta);
        assertTrue(pdf.length > 100);
        assertEquals("%PDF", new String(pdf, 0, 4, StandardCharsets.US_ASCII));
    }
}
