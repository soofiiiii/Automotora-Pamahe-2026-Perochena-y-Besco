package uy.edu.ctc.pamahe.integration;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import uy.edu.ctc.pamahe.modules.clientes.model.*;
import uy.edu.ctc.pamahe.modules.compras.model.Compra;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.vehiculos.model.*;
import uy.edu.ctc.pamahe.modules.vehiculos.repository.VehiculoRepository;
import uy.edu.ctc.pamahe.modules.ventas.model.Venta;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:pamahe_pages;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE")
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@Transactional
class PaginatedListsIntegrationTest {
    @Autowired EntityManager em;
    @Autowired MockMvc mvc;
    @Autowired VehiculoRepository vehiculos;
    private final List<Long> ventaIds = new ArrayList<>();
    private final List<Long> vehiculoIds = new ArrayList<>();
    private Long clienteId;
    private final LocalDate fecha = LocalDate.of(2026, 8, 1);

    @BeforeEach
    void datos() {
        ventaIds.clear(); vehiculoIds.clear();
        Usuario u = new Usuario(); u.setUsername("pages"); u.setNombre("Operador");
        u.setEmail("pages@example.test"); u.setPasswordHash("fixture"); em.persist(u);
        Cliente c = new Cliente(); c.setNombre("Cliente 100% literal"); c.setDocumento("PAGE1");
        c.setTipoCliente(TipoCliente.AMBOS); em.persist(c); clienteId = c.getId();
        for (int i = 0; i < 3; i++) {
            Vehiculo v = new Vehiculo(); v.setMarca("Marca"); v.setModelo("Modelo" + i); v.setAnio(2020);
            v.setEstado(EstadoVehiculo.DISPONIBLE); v.setPublicado(true); em.persist(v); vehiculoIds.add(v.getId());
            Compra cp = new Compra(); cp.setVehiculo(v); cp.setClienteVendedor(c); cp.setUsuarioResponsable(u);
            cp.setFechaCompra(fecha.minusDays(1)); cp.setCostoAdquisicion(BigDecimal.TEN); em.persist(cp);
            Venta venta = new Venta(); venta.setVehiculo(v); venta.setClienteComprador(c); venta.setVendedor(u);
            venta.setFechaVenta(fecha); venta.setPrecioFinal(new BigDecimal("15"));
            venta.setCostoCompraAlVender(BigDecimal.TEN); venta.setCostoRefaccionesAlVender(BigDecimal.ZERO);
            venta.setCostoTotalAlVender(BigDecimal.TEN); venta.setRentabilidadCalculada(new BigDecimal("5"));
            venta.setActivo(i < 2); em.persist(venta); ventaIds.add(venta.getId());
        }
        em.flush();
        // Empate real de fecha para comprobar el desempate por ID, sin depender del reloj.
        em.createQuery("update Vehiculo v set v.creadoEn = :t where v.id in :ids")
            .setParameter("t", LocalDateTime.of(2026, 8, 1, 0, 0)).setParameter("ids", vehiculoIds).executeUpdate();
        em.clear();
    }

    @Test
    void ventasFiltranEnDbPaginanEstablementeYNoExponenSnapshotGerencial() throws Exception {
        for (int page = 0; page < 2; page++) {
            mvc.perform(get("/ventas/paginado").with(user("vendedor").roles("VENDEDOR"))
                    .param("page", Integer.toString(page)).param("size", "1")
                    .param("desde", fecha.toString()).param("hasta", fecha.toString())
                    .param("clienteId", clienteId.toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.totalPages").value(2))
                .andExpect(jsonPath("$.data.content[0].id").value(ventaIds.get(1 - page).intValue()))
                .andExpect(jsonPath("$.data.content[0].costoTotalAlVender").doesNotExist())
                .andExpect(jsonPath("$.data.content[0].rentabilidadCalculada").doesNotExist());
        }
        mvc.perform(get("/ventas/paginado").with(user("vendedor").roles("VENDEDOR"))
                .param("vehiculoId", vehiculoIds.get(0).toString()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1));
        mvc.perform(get("/ventas/paginado").with(user("vendedor").roles("VENDEDOR"))
                .param("page", "50"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.content").isEmpty())
            .andExpect(jsonPath("$.data.totalElements").value(2));
    }

    @Test
    void comprasFiltranFechasInclusivasYVehiculo() throws Exception {
        mvc.perform(get("/compras/paginado").with(user("dueno").roles("DUENO"))
                .param("desde", fecha.minusDays(1).toString()).param("hasta", fecha.minusDays(1).toString())
                .param("vehiculoId", vehiculoIds.get(0).toString()).param("clienteId", clienteId.toString()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1));
    }

    @Test
    void clientesBuscanTextoLiteralYTipo() throws Exception {
        mvc.perform(get("/clientes/paginado").with(user("vendedor").roles("VENDEDOR"))
                .param("q", " 100% ").param("tipoCliente", "AMBOS"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1));
        mvc.perform(get("/clientes/paginado").with(user("vendedor").roles("VENDEDOR"))
                .param("q", "100_").param("tipoCliente", "AMBOS"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(0));
        mvc.perform(get("/clientes/paginado").with(user("vendedor").roles("VENDEDOR"))
                .param("q", "literal").param("tipoCliente", "COMPRADOR"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(0));
    }

    @Test
    void catalogoDesempataPorIdEnPaginasDiferentes() {
        for (int page = 0; page < 3; page++) {
            var result = vehiculos.buscarCatalogoPaginado(List.of(EstadoVehiculo.DISPONIBLE, EstadoVehiculo.RESERVADO), null, null, null,
                    null, null, null, null, PageRequest.of(page, 1));
            assertEquals(3, result.getTotalElements());
            assertEquals(vehiculoIds.get(2 - page), result.getContent().get(0).getId());
        }
    }

    @ParameterizedTest
    @CsvSource({"/ventas/paginado,size,101", "/compras/paginado,page,-1", "/clientes/paginado,size,0",
        "/ventas/paginado,vehiculoId,0", "/compras/paginado,clienteId,-1",
        "/vehiculos/paginado,page,2147483647", "/catalogo/vehiculos/paginado,page,2147483647"})
    void limitesInvalidosSon400(String path, String key, String value) throws Exception {
        mvc.perform(get(path).param(key, value).with(user("dueno").roles("DUENO")))
            .andExpect(status().isBadRequest());
    }

    @Test
    void rechazaPeriodoInvertido() throws Exception {
        for (String path : List.of("/compras/paginado", "/ventas/paginado")) {
            mvc.perform(get(path).param("desde", "2026-09-02").param("hasta", "2026-09-01")
                    .with(user("dueno").roles("DUENO")))
                .andExpect(status().isBadRequest());
        }
    }

    @Test
    void mantieneRbacDeListadosSensibles() throws Exception {
        mvc.perform(get("/ventas/paginado")).andExpect(status().isUnauthorized());
        mvc.perform(get("/ventas/paginado").with(user("taller").roles("TALLER"))).andExpect(status().isForbidden());
        mvc.perform(get("/compras/paginado").with(user("vendedor").roles("VENDEDOR"))).andExpect(status().isForbidden());
    }
}
