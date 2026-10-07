package uy.edu.ctc.pamahe.modules.reportes.controller;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import uy.edu.ctc.pamahe.modules.exportaciones.service.ReportePdfService;
import uy.edu.ctc.pamahe.modules.reportes.service.ReporteService;

@ExtendWith(MockitoExtension.class)
class ReporteControllerTest {

    @Mock
    private ReporteService reporteService;

    @Mock
    private ReportePdfService reportePdfService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new ReporteController(reporteService, reportePdfService)).build();
    }

    @Test
    void rentabilidadPdfAceptaPeriodoYDevuelveAdjunto() throws Exception {
        LocalDate desde = LocalDate.of(2026, 9, 1);
        LocalDate hasta = LocalDate.of(2026, 9, 30);
        byte[] pdf = "%PDF-test".getBytes(StandardCharsets.US_ASCII);

        when(reportePdfService.rentabilidad(desde, hasta)).thenReturn(pdf);

        mockMvc.perform(get("/reportes/rentabilidad.pdf")
                .param("desde", "2026-09-01")
                .param("hasta", "2026-09-30"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("attachment")))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("pamahe-reporte-rentabilidad.pdf")));

        verify(reportePdfService).rentabilidad(desde, hasta);
    }
}
