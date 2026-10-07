package uy.edu.ctc.pamahe.modules.exportaciones.controller;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import uy.edu.ctc.pamahe.modules.exportaciones.service.CsvExportService;

@ExtendWith(MockitoExtension.class)
class ExportacionControllerTest {
    @Mock
    CsvExportService service;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new ExportacionController(service)).build();
    }

    @Test
    void ventasAceptaFiltrosDePeriodoIso() throws Exception {
        LocalDate desde = LocalDate.of(2026, 9, 1);
        LocalDate hasta = LocalDate.of(2026, 9, 30);
        when(service.ventas(desde, hasta)).thenReturn("csv");

        mockMvc.perform(get("/exportaciones/ventas.csv")
                .param("desde", "2026-09-01")
                .param("hasta", "2026-09-30"))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        HttpHeaders.CONTENT_DISPOSITION,
                        containsString("attachment")))
                .andExpect(header().string(
                        HttpHeaders.CONTENT_DISPOSITION,
                        containsString("filename=\"ventas.csv\"")));

        verify(service).ventas(desde, hasta);
    }

    @Test
    void comprasAceptaFiltrosDePeriodoIso() throws Exception {
        LocalDate desde = LocalDate.of(2026, 8, 1);
        LocalDate hasta = LocalDate.of(2026, 8, 31);
        when(service.compras(desde, hasta)).thenReturn("csv");

        mockMvc.perform(get("/exportaciones/compras.csv")
                .param("desde", "2026-08-01")
                .param("hasta", "2026-08-31"))
                .andExpect(status().isOk());

        verify(service).compras(desde, hasta);
    }

    @Test
    void refaccionesAceptaFiltrosDePeriodoIso() throws Exception {
        LocalDate desde = LocalDate.of(2026, 7, 1);
        LocalDate hasta = LocalDate.of(2026, 7, 31);
        when(service.refacciones(desde, hasta)).thenReturn("csv");

        mockMvc.perform(get("/exportaciones/refacciones.csv")
                .param("desde", "2026-07-01")
                .param("hasta", "2026-07-31"))
                .andExpect(status().isOk());

        verify(service).refacciones(desde, hasta);
    }
}
