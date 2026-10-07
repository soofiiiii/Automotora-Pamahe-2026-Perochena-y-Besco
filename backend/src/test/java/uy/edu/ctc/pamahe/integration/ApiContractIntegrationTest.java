package uy.edu.ctc.pamahe.integration;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import uy.edu.ctc.pamahe.common.exception.IdempotencyConflictException;
import uy.edu.ctc.pamahe.modules.compras.service.CompraService;
import uy.edu.ctc.pamahe.modules.taller.service.RefaccionService;

/** Conserva Controller, validación, filtros y handler reales; simula conflictos del servicio. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApiContractIntegrationTest {
    @Autowired MockMvc mvc;
    @MockitoBean CompraService compras;
    @MockitoBean RefaccionService taller;

    @ParameterizedTest
    @ValueSource(strings = {"0", "-0.01", "null"})
    void compraRechazaImporteNoPositivoONuloEnHttp(String costo) throws Exception {
        mvc.perform(post("/compras").with(user("vendedor").roles("VENDEDOR"))
                .contentType(MediaType.APPLICATION_JSON).content("""
                    {"vehiculoId":1,"clienteVendedorId":2,"fechaCompra":"2026-08-01","costoAdquisicion":%s}
                    """.formatted(costo)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("VALIDATION_ERROR"));
        verifyNoInteractions(compras);
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "-1", "null"})
    void ventaRechazaImporteInvalidoAntesDeConsultarEntidades(String precio) throws Exception {
        mvc.perform(post("/ventas").with(user("vendedor").roles("VENDEDOR"))
                .contentType(MediaType.APPLICATION_JSON).content("""
                    {"vehiculoId":1,"clienteCompradorId":2,"fechaVenta":"2026-08-01","precioFinal":%s}
                    """.formatted(precio)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("VALIDATION_ERROR"));
    }

    @Test
    void conflictoDeIntegridadSeDevuelveSinDetallesSql() throws Exception {
        when(compras.crear(any())).thenThrow(new DataIntegrityViolationException("SQL privado"));
        mvc.perform(post("/compras").with(user("vendedor").roles("VENDEDOR"))
                .contentType(MediaType.APPLICATION_JSON).content("""
                    {"vehiculoId":1,"clienteVendedorId":2,"fechaCompra":"2026-08-01","costoAdquisicion":10000}
                    """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("DATA_CONFLICT"))
                .andExpect(jsonPath("$.incidenteId").isNotEmpty())
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("SQL privado"))));
    }

    @Test
    void idempotenciaConPayloadDistintoDevuelve409() throws Exception {
        when(taller.crear(any())).thenThrow(new IdempotencyConflictException("Operación reutilizada"));
        mvc.perform(post("/taller/refacciones").with(user("taller").roles("TALLER"))
                .contentType(MediaType.APPLICATION_JSON).content("""
                    {"vehiculoId":1,"fecha":"2026-08-01","tipoTrabajo":"MECANICA","descripcion":"Revisión",
                     "costoRepuestos":0,"costoManoObra":0,"costoServiciosExternos":0,
                     "estadoTarea":"PENDIENTE","idOperacionOffline":"op-http"}
                    """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("IDEMPOTENCY_CONFLICT"));
    }

    @Test
    void entidadInexistenteDevuelve404ConCodigoEstable() throws Exception {
        mvc.perform(get("/vehiculos/9223372036854775807").with(user("vendedor").roles("VENDEDOR")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.codigo").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    void paginacionInvalidaEs400() throws Exception {
        mvc.perform(get("/vehiculos/paginado").param("size", "101").with(user("gerente").roles("DUENO")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("BUSINESS_RULE"));
    }

    @Test
    void listadoAutorizadoDevuelveContratoDePagina() throws Exception {
        mvc.perform(get("/vehiculos/paginado").with(user("taller").roles("TALLER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.page").value(0))
                .andExpect(jsonPath("$.data.size").value(20))
                .andExpect(jsonPath("$.data.totalElements").isNumber());
    }

    @ParameterizedTest
    @CsvSource({"VENDEDOR,/compras/1/comprobante", "TALLER,/reportes/ventas", "VENDEDOR,/auditoria",
        "TALLER,/costos/vehiculos/1"})
    void lecturaSensibleRespetaRoles(String rol, String ruta) throws Exception {
        mvc.perform(get(ruta).with(user("tester").roles(rol))).andExpect(status().isForbidden());
    }

    @Test
    void imagenPrivadaRequiereAutenticacion() throws Exception {
        mvc.perform(get("/imagenes/1/archivo")).andExpect(status().isUnauthorized());
    }

    @Test
    void vendedorNoPuedeEliminarImagenYTallerNoPuedePublicarla() throws Exception {
        mvc.perform(delete("/imagenes/1").with(user("vendedor").roles("VENDEDOR")))
                .andExpect(status().isForbidden());
        mvc.perform(patch("/imagenes/1/visibilidad").with(user("taller").roles("TALLER"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"publica\":true,\"principal\":true}"))
                .andExpect(status().isForbidden());
    }
}
