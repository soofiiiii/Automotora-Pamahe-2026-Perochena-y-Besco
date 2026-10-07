package uy.edu.ctc.pamahe.modules.vehiculos.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.List;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.request.VehiculoRequest;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.response.VehiculoResponse;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.response.VehiculoTallerResponse;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.response.historial.VehiculoHistorialGerencialResponse;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.response.historial.VehiculoHistorialComercialResponse;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.response.historial.VehiculoHistorialTallerResponse;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.response.historial.HistorialEventoVehiculoResponse;
import uy.edu.ctc.pamahe.modules.parametros.model.Parametro;
import uy.edu.ctc.pamahe.modules.compras.model.Compra;
import uy.edu.ctc.pamahe.modules.ventas.model.Venta;
import uy.edu.ctc.pamahe.modules.taller.model.Refaccion;
import uy.edu.ctc.pamahe.modules.clientes.model.Cliente;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import java.time.LocalDate;
import java.time.Year;
import java.time.LocalDateTime;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.compras.repository.CompraRepository;
import uy.edu.ctc.pamahe.modules.imagenes.repository.ImagenVehiculoRepository;
import uy.edu.ctc.pamahe.modules.parametros.repository.ParametroRepository;
import uy.edu.ctc.pamahe.modules.taller.repository.RefaccionRepository;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.request.CambiarEstadoVehiculoRequest;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.request.CambiarPublicacionVehiculoRequest;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.response.VehiculoComercialResponse;
import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.model.UbicacionVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.repository.VehiculoRepository;
import uy.edu.ctc.pamahe.modules.ventas.repository.VentaRepository;

@ExtendWith(MockitoExtension.class)
class VehiculoServiceTest {
    @Mock
    VehiculoRepository vehiculoRepository;
    @Mock
    CompraRepository compraRepository;
    @Mock
    RefaccionRepository refaccionRepository;
    @Mock
    AuditoriaService auditoriaService;
    @Mock
    VentaRepository ventaRepository;
    @Mock
    ImagenVehiculoRepository imagenRepository;
    @Mock
    ParametroRepository parametroRepository;
    private VehiculoService service;

    @BeforeEach
    void setUp() {
        service = new VehiculoService(vehiculoRepository, compraRepository, refaccionRepository, auditoriaService,
                ventaRepository, imagenRepository, parametroRepository);
    }

    @AfterEach
    void cleanSecurity() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void crearVehiculoRechazaAnioPosteriorAlActual() {
        autenticar("ADMINISTRADOR");
        VehiculoRequest request = new VehiculoRequest(
                "Toyota", "Corolla", null, Year.now().getValue() + 1,
                null, null, "Gris", 10000,
                UbicacionVehiculo.LOCAL,
                new BigDecimal("15000"),
                null, null);

        assertThrows(BusinessException.class, () -> service.crear(request));
        verify(vehiculoRepository, never()).save(any());
    }

    @Test
    void crearVehiculoConservaUbicacionFisicaIndependienteDelEstado() {
        autenticar("ADMINISTRADOR");
        VehiculoRequest request = new VehiculoRequest(
                "Toyota", "Corolla", null, 2020, null, null, "Gris", 10000,
                UbicacionVehiculo.TALLER_EXTERNO, new BigDecimal("15000"), null, null);
        when(vehiculoRepository.save(any(Vehiculo.class))).thenAnswer(inv -> {
            Vehiculo vehiculo = inv.getArgument(0);
            vehiculo.setId(1L);
            return vehiculo;
        });
        when(parametroRepository.findByCategoriaOrderByClaveAsc("TIPO_VEHICULO")).thenReturn(List.of());

        VehiculoResponse response = assertInstanceOf(VehiculoResponse.class, service.crear(request));

        assertEquals(EstadoVehiculo.COMPRADO, response.estado());
        assertEquals(UbicacionVehiculo.TALLER_EXTERNO, response.ubicacionActual());
    }

    @Test
    void vendidoNoPuedeAsignarseManualmente() {
        autenticar("ADMINISTRADOR");
        assertThrows(BusinessException.class,
                () -> service.cambiarEstado(1L, new CambiarEstadoVehiculoRequest(EstadoVehiculo.VENDIDO, "manual")));
        verifyNoInteractions(vehiculoRepository);
    }

    @Test
    void noPuedeQuedarDisponibleConTareasAbiertas() {
        autenticar("TALLER");
        Vehiculo v = vehiculo(EstadoVehiculo.EN_TALLER);
        when(vehiculoRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(v));
        when(refaccionRepository.existsByVehiculoAndActivoTrueAndEstadoTareaIn(eq(v), anyCollection()))
                .thenReturn(true);
        assertThrows(BusinessException.class,
                () -> service.cambiarEstado(1L, new CambiarEstadoVehiculoRequest(EstadoVehiculo.DISPONIBLE, null)));
    }

    @Test
    void publicacionExigeEstadoComercialYPrecioPositivo() {
        autenticar("VENDEDOR");
        Vehiculo v = vehiculo(EstadoVehiculo.DISPONIBLE);
        v.setPrecioVentaEstimado(BigDecimal.ZERO);
        v.setPrecioVentaUsd(BigDecimal.ZERO);
        when(vehiculoRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(v));
        assertThrows(BusinessException.class,
                () -> service.cambiarPublicacion(1L, new CambiarPublicacionVehiculoRequest(true)));
    }

    @Test
    void vendedorRecibeProyeccionComercialTrasMutacion() {
        autenticar("VENDEDOR");
        Vehiculo v = vehiculo(EstadoVehiculo.DISPONIBLE);
        v.setPrecioVentaEstimado(new BigDecimal("15000"));
        v.setCostoInicial(new BigDecimal("8000"));
        when(vehiculoRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(v));
        Object result = service.cambiarPublicacion(1L, new CambiarPublicacionVehiculoRequest(true));
        assertInstanceOf(VehiculoComercialResponse.class, result);
        assertTrue(v.getPublicado());
    }

    @Test
    void reservarMantieneLaPublicacion() {
        autenticar("VENDEDOR");
        Vehiculo v = vehiculo(EstadoVehiculo.DISPONIBLE);
        v.setPublicado(true);
        when(vehiculoRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(v));

        service.cambiarEstado(1L, new CambiarEstadoVehiculoRequest(EstadoVehiculo.RESERVADO, "seña manual"));

        assertEquals(EstadoVehiculo.RESERVADO, v.getEstado());
        assertTrue(v.getPublicado());
        verify(auditoriaService).registrar("CAMBIO_ESTADO", "Vehiculo", 1L, "seña manual",
                "estado=DISPONIBLE", "estado=RESERVADO, publicado=true");
    }

    @Test
    void reservadoPuedePublicarseConPrecioValido() {
        autenticar("VENDEDOR");
        Vehiculo v = vehiculo(EstadoVehiculo.RESERVADO);
        v.setPrecioVentaEstimado(new BigDecimal("15000"));
        when(vehiculoRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(v));

        service.cambiarPublicacion(1L, new CambiarPublicacionVehiculoRequest(true));

        assertTrue(v.getPublicado());
    }

    @Test
    void vendidoNoSePuedeDesactivar() {
        autenticar("ADMINISTRADOR");
        Vehiculo v = vehiculo(EstadoVehiculo.VENDIDO);
        when(vehiculoRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(v));
        assertThrows(BusinessException.class, () -> service.desactivar(1L));
    }

    @ParameterizedTest
    @CsvSource({
            "ADMINISTRADOR,COMPRADO,DISPONIBLE", "DUENO,COMPRADO,DADO_DE_BAJA",
            "VENDEDOR,COMPRADO,DISPONIBLE", "VENDEDOR,DISPONIBLE,RESERVADO",
            "VENDEDOR,RESERVADO,DISPONIBLE", "VENDEDOR,DISPONIBLE,EN_TALLER",
            "VENDEDOR,EN_TALLER,DISPONIBLE", "TALLER,COMPRADO,EN_TALLER", "TALLER,DISPONIBLE,EN_TALLER",
            "TALLER,EN_TALLER,DISPONIBLE", "ADMINISTRADOR,EN_TALLER,DADO_DE_BAJA"
    })
    void transicionPermitidaPersisteYAudita(String rol, EstadoVehiculo origen, EstadoVehiculo destino) {
        autenticar(rol);
        Vehiculo v = vehiculo(origen);
        v.setPublicado(false);
        when(vehiculoRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(v));
        if (origen == EstadoVehiculo.COMPRADO && destino != EstadoVehiculo.DADO_DE_BAJA) {
            when(compraRepository.existsByVehiculoAndActivoTrue(v)).thenReturn(true);
        }
        service.cambiarEstado(1L, new CambiarEstadoVehiculoRequest(destino, "  revisión  "));
        assertEquals(destino, v.getEstado());
        verify(vehiculoRepository).save(v);
        verify(auditoriaService).registrar("CAMBIO_ESTADO", "Vehiculo", 1L, "revisión",
                "estado=" + origen, "estado=" + destino + ", publicado=false");
    }

    @ParameterizedTest
    @CsvSource({ "TALLER,DISPONIBLE,RESERVADO",
            "VENDEDOR,COMPRADO,DADO_DE_BAJA", "CLIENTE,COMPRADO,DISPONIBLE" })
    void transicionSinPermisoNoModificaElVehiculo(String rol, EstadoVehiculo origen, EstadoVehiculo destino) {
        autenticar(rol);
        Vehiculo v = vehiculo(origen);
        when(vehiculoRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(v));
        assertThrows(AccessDeniedException.class,
                () -> service.cambiarEstado(1L, new CambiarEstadoVehiculoRequest(destino, null)));
        assertEquals(origen, v.getEstado());
        verify(vehiculoRepository, never()).save(any());
        verifyNoInteractions(auditoriaService);
    }

    @ParameterizedTest
    @CsvSource({ "VENDIDO,DISPONIBLE", "DADO_DE_BAJA,COMPRADO", "COMPRADO,RESERVADO",
            "EN_TALLER,RESERVADO", "RESERVADO,EN_TALLER", "DISPONIBLE,DISPONIBLE" })
    void transicionesInvalidasNoPersisten(EstadoVehiculo origen, EstadoVehiculo destino) {
        Vehiculo v = vehiculo(origen);
        assertThrows(BusinessException.class, () -> service.cambiarEstadoPorSistema(v, destino, null));
        assertEquals(origen, v.getEstado());
        verifyNoInteractions(vehiculoRepository, auditoriaService);
    }

    @Test
    void compradoSinCompraNoAvanza() {
        Vehiculo v = vehiculo(EstadoVehiculo.COMPRADO);
        assertThrows(BusinessException.class,
                () -> service.cambiarEstadoPorSistema(v, EstadoVehiculo.DISPONIBLE, null));
        verify(vehiculoRepository, never()).save(any());
    }

    @Test
    void ventaRetiraPublicacionYConservaReferencia() {
        Vehiculo v = vehiculo(EstadoVehiculo.DISPONIBLE);
        v.setPublicado(true);
        service.marcarVendidoPorVenta(v, 42L);
        assertEquals(EstadoVehiculo.VENDIDO, v.getEstado());
        assertFalse(v.getPublicado());
        verify(auditoriaService).registrar("CAMBIO_ESTADO", "Vehiculo", 1L,
                "Venta registrada: 42", "estado=DISPONIBLE", "estado=VENDIDO, publicado=false");
    }

    @ParameterizedTest
    @EnumSource(value = EstadoVehiculo.class, names = { "COMPRADO", "EN_TALLER", "RESERVADO", "VENDIDO",
            "DADO_DE_BAJA" })
    void cierreDeVentaRechazaEstadoIncompatible(EstadoVehiculo origen) {
        assertThrows(BusinessException.class, () -> service.marcarVendidoPorVenta(vehiculo(origen), 42L));
        verifyNoInteractions(vehiculoRepository, auditoriaService);
    }

    @Test
    void vendidoNoPuedeAsignarsePorCambioGenericoDelSistema() {
        Vehiculo v = vehiculo(EstadoVehiculo.DISPONIBLE);
        assertThrows(BusinessException.class,
                () -> service.cambiarEstadoPorSistema(v, EstadoVehiculo.VENDIDO, "forzado"));
        assertEquals(EstadoVehiculo.DISPONIBLE, v.getEstado());
        verifyNoInteractions(vehiculoRepository, auditoriaService);
    }

    @Test
    void ingresoATallerRetiraUnidadDelCatalogo() {
        Vehiculo v = vehiculo(EstadoVehiculo.DISPONIBLE);
        v.setPublicado(true);
        service.cambiarEstadoPorSistema(v, EstadoVehiculo.EN_TALLER, " ");
        assertFalse(v.getPublicado());
        verify(auditoriaService).registrar("CAMBIO_ESTADO", "Vehiculo", 1L,
                "Cambio controlado de estado", "estado=DISPONIBLE", "estado=EN_TALLER, publicado=false");
    }

    @ParameterizedTest
    @EnumSource(value = EstadoVehiculo.class, names = { "DISPONIBLE", "RESERVADO" }, mode = EnumSource.Mode.EXCLUDE)
    void publicacionRechazaEstadosNoComerciales(EstadoVehiculo estado) {
        Vehiculo v = vehiculo(estado);
        v.setPrecioVentaEstimado(BigDecimal.TEN);
        when(vehiculoRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(v));
        assertThrows(BusinessException.class,
                () -> service.cambiarPublicacion(1L, new CambiarPublicacionVehiculoRequest(true)));
        verify(vehiculoRepository, never()).save(any());
    }

    @Test
    void despublicarNoExigePrecio() {
        autenticar("ADMINISTRADOR");
        Vehiculo v = vehiculo(EstadoVehiculo.COMPRADO);
        v.setPublicado(true);
        v.setPrecioVentaEstimado(null);
        when(vehiculoRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(v));
        service.cambiarPublicacion(1L, new CambiarPublicacionVehiculoRequest(false));
        assertFalse(v.getPublicado());
        verify(auditoriaService).registrar("CAMBIO_PUBLICACION", "Vehiculo", 1L,
                "Vehículo retirado del catálogo", "publicado=true", "publicado=false");
    }

    @ParameterizedTest
    @ValueSource(strings = { "compra", "refaccion", "venta" })
    void bajaNoPuedeRomperReferenciasHistoricas(String operacion) {
        Vehiculo v = vehiculo(EstadoVehiculo.COMPRADO);
        when(vehiculoRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(v));
        switch (operacion) {
            case "compra" -> when(compraRepository.existsByVehiculo(v)).thenReturn(true);
            case "refaccion" -> when(refaccionRepository.existsByVehiculo(v)).thenReturn(true);
            case "venta" -> when(ventaRepository.existsByVehiculo(v)).thenReturn(true);
            default -> throw new IllegalArgumentException(operacion);
        }
        assertThrows(BusinessException.class, () -> service.desactivar(1L));
        assertTrue(v.getActivo());
        verify(vehiculoRepository, never()).save(any());
    }

    @Test
    void bajaSinOperacionesEsLogicaYRetiraPublicacion() {
        Vehiculo v = vehiculo(EstadoVehiculo.COMPRADO);
        v.setPublicado(true);
        when(vehiculoRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(v));
        service.desactivar(1L);
        assertFalse(v.getActivo());
        assertFalse(v.getPublicado());
        verify(vehiculoRepository).save(v);
        verify(vehiculoRepository, never()).delete(any());
    }

    @ParameterizedTest
    @ValueSource(strings = { "ADMINISTRADOR", "DUENO", "VENDEDOR", "TALLER" })
    void consultasProyectanSegunRol(String rol) {
        autenticar(rol);
        Vehiculo v = vehiculo(EstadoVehiculo.DISPONIBLE);
        v.setCostoInicial(new BigDecimal("10000"));
        v.setObservacionesInternas("Solo gerencia");
        when(vehiculoRepository.findById(1L)).thenReturn(Optional.of(v));
        when(vehiculoRepository.buscarConFiltros(null, "Toyota", null, "SUV", null, null,
                null, null, null, null)).thenReturn(List.of(v));
        when(vehiculoRepository.buscarConFiltrosPaginado(null, null, null, null, null, null,
                null, null, null, null, PageRequest.of(1, 2)))
                .thenReturn(new PageImpl<>(List.of(v), PageRequest.of(1, 2), 3));
        Class<?> tipo = switch (rol) {
            case "VENDEDOR" -> VehiculoComercialResponse.class;
            case "TALLER" -> VehiculoTallerResponse.class;
            default -> VehiculoResponse.class;
        };
        assertInstanceOf(tipo, service.obtener(1L));
        var lista = service.listar(null, " Toyota ", " ", " suv ", null, null, null, null, null, null);
        assertInstanceOf(tipo, lista.get(0));
        var pagina = service.listarPaginado(null, null, null, null, null, null, null, null, null, null, 1, 2);
        assertInstanceOf(tipo, pagina.content().get(0));
        assertEquals(3, pagina.totalElements());
        assertEquals(2, pagina.totalPages());
        assertEquals(1, pagina.page());
    }

    @Test
    void rolNoHabilitadoNoRecibeProyecciones() {
        autenticar("CLIENTE");
        when(vehiculoRepository.findById(1L)).thenReturn(Optional.of(vehiculo(EstadoVehiculo.COMPRADO)));
        when(vehiculoRepository.buscarConFiltrosPaginado(null, null, null, null, null, null,
                null, null, null, null, PageRequest.of(0, 10))).thenReturn(new PageImpl<>(List.of()));
        assertThrows(AccessDeniedException.class, () -> service.obtener(1L));
        assertThrows(AccessDeniedException.class,
                () -> service.listar(null, null, null, null, null, null, null, null, null, null));
        assertThrows(AccessDeniedException.class,
                () -> service.listarPaginado(null, null, null, null, null, null, null, null, null, null, 0, 10));
        assertThrows(AccessDeniedException.class, () -> service.historial(1L));
    }

    @ParameterizedTest
    @CsvSource({ "2025,2020,,", ",,-1,10", ",,1,-1", ",,20,10" })
    void filtrosInvalidosSeRechazanAntesDeConsultar(Integer desde, Integer hasta,
            BigDecimal minimo, BigDecimal maximo) {
        assertThrows(BusinessException.class,
                () -> service.listar(null, null, null, null, desde, hasta, minimo, maximo, null, null));
        verifyNoInteractions(vehiculoRepository);
    }

    @ParameterizedTest
    @CsvSource({ "-1,10", "0,0", "0,101" })
    void paginacionFueraDeLimitesSeRechaza(int page, int size) {
        assertThrows(BusinessException.class,
                () -> service.listarPaginado(null, null, null, null, null, null, null, null, null, null, page, size));
        verifyNoInteractions(vehiculoRepository);
    }

    @Test
    void inexistentesEInactivosNoSeExponenComoActivos() {
        assertThrows(ResourceNotFoundException.class, () -> service.buscarActivoPorId(1L));
        assertThrows(ResourceNotFoundException.class, () -> service.buscarActivoPorIdConBloqueo(1L));
        Vehiculo v = vehiculo(EstadoVehiculo.COMPRADO);
        v.setActivo(false);
        when(vehiculoRepository.findById(1L)).thenReturn(Optional.of(v));
        when(vehiculoRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(v));
        assertThrows(ResourceNotFoundException.class, () -> service.buscarActivoPorId(1L));
        assertThrows(ResourceNotFoundException.class, () -> service.buscarActivoPorIdConBloqueo(1L));
    }

    @Test
    void altaNormalizaDatosYArrancaSinPublicacion() {
        autenticar("ADMINISTRADOR");
        when(parametroRepository.findByCategoriaAndClaveAndActivoTrue("TIPO_VEHICULO", "SUV"))
                .thenReturn(Optional.of(new Parametro()));
        when(vehiculoRepository.save(any())).thenAnswer(inv -> {
            Vehiculo v = inv.getArgument(0);
            v.setId(1L);
            return v;
        });
        var response = assertInstanceOf(VehiculoResponse.class, service.crear(datosVehiculo(" suv ", " nota ")));
        assertEquals("Toyota", response.marca());
        assertEquals("SUV", response.tipoVehiculo());
        assertEquals(EstadoVehiculo.COMPRADO, response.estado());
        assertFalse(response.publicado());
        assertEquals("nota", response.observacionesInternas());
        verify(auditoriaService).registrar(eq("ALTA"), eq("Vehiculo"), eq(1L), anyString(), isNull(), anyString());
    }

    @Test
    void actualizacionNoReiniciaEstadoNiCostoHistorico() {
        autenticar("VENDEDOR");
        Vehiculo v = vehiculo(EstadoVehiculo.RESERVADO);
        v.setCostoInicial(new BigDecimal("9000"));
        v.setObservacionesInternas("Reservado a gerencia");
        when(vehiculoRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(v));
        when(vehiculoRepository.save(v)).thenReturn(v);
        assertInstanceOf(VehiculoComercialResponse.class, service.actualizar(1L, datosVehiculo(null, " ")));
        assertEquals(EstadoVehiculo.RESERVADO, v.getEstado());
        assertEquals(new BigDecimal("9000"), v.getCostoInicial());
        assertEquals("Reservado a gerencia", v.getObservacionesInternas());
        assertNull(v.getMatricula());
    }

    @Test
    void editarVehiculoConTipoHistoricoDesactivadoConservaElValorSinExigirReactivacion() {
        autenticar("VENDEDOR");
        Vehiculo v = vehiculo(EstadoVehiculo.DISPONIBLE);
        v.setTipoVehiculo("CAMIONETA");
        when(vehiculoRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(v));
        when(vehiculoRepository.save(v)).thenReturn(v);

        var result = assertInstanceOf(VehiculoComercialResponse.class,
                service.actualizar(1L, datosVehiculo("CAMIONETA", null)));

        assertEquals("CAMIONETA", result.tipoVehiculo());
        verify(parametroRepository, never())
                .findByCategoriaAndClaveAndActivoTrue("TIPO_VEHICULO", "CAMIONETA");
    }

    @Test
    void tipoInexistenteYObservacionesSinPermisoNoSeGuardan() {
        autenticar("VENDEDOR");
        assertThrows(BusinessException.class, () -> service.crear(datosVehiculo("INVALIDO", null)));
        assertThrows(AccessDeniedException.class, () -> service.crear(datosVehiculo(null, "privado")));
        verify(vehiculoRepository, never()).save(any());
    }

    @ParameterizedTest
    @ValueSource(strings = { "ADMINISTRADOR", "VENDEDOR", "TALLER" })
    void historialSinOperacionesConservaProyeccionPorRol(String rol) {
        autenticar(rol);
        when(vehiculoRepository.findById(1L)).thenReturn(Optional.of(vehiculo(EstadoVehiculo.COMPRADO)));
        Object historial = service.historial(1L);
        switch (rol) {
            case "VENDEDOR" -> {
                var h = assertInstanceOf(VehiculoHistorialComercialResponse.class, historial);
                assertNull(h.compra());
                assertNull(h.venta());
                assertTrue(h.refacciones().isEmpty());
            }
            case "TALLER" -> {
                var h = assertInstanceOf(VehiculoHistorialTallerResponse.class, historial);
                assertNull(h.fechaCompra());
                assertNull(h.fechaVenta());
            }
            default -> {
                var h = assertInstanceOf(VehiculoHistorialGerencialResponse.class, historial);
                assertNull(h.compra());
                assertNull(h.venta());
            }
        }
    }

    @ParameterizedTest
    @ValueSource(strings = { "ADMINISTRADOR", "DUENO", "VENDEDOR", "TALLER" })
    void historialConOperacionesMantieneDatosPermitidosPorRol(String rol) {
        autenticar(rol);
        Vehiculo v = vehiculo(EstadoVehiculo.VENDIDO);
        v.setCostoInicial(new BigDecimal("9000.00"));
        v.setObservacionesInternas("Solo gerencia");
        Usuario u = new Usuario();
        u.setId(7L);
        u.setNombre("Operador");
        Cliente c = new Cliente();
        c.setId(2L);
        c.setNombre("Ana");
        Compra compra = new Compra();
        compra.setId(10L);
        compra.setVehiculo(v);
        compra.setClienteVendedor(c);
        compra.setUsuarioResponsable(u);
        compra.setFechaCompra(LocalDate.of(2026, 8, 1));
        compra.setCostoAdquisicion(new BigDecimal("9000.00"));
        Refaccion refaccion = new Refaccion();
        refaccion.setId(20L);
        refaccion.setVehiculo(v);
        refaccion.setUsuarioQueRegistra(u);
        refaccion.setDescripcion("Mantenimiento");
        refaccion.setCostoManoObra(new BigDecimal("250.00"));
        Venta venta = new Venta();
        venta.setId(30L);
        venta.setVehiculo(v);
        venta.setClienteComprador(c);
        venta.setVendedor(u);
        venta.setFechaVenta(LocalDate.of(2026, 8, 15));
        venta.setPrecioFinal(new BigDecimal("12000.00"));
        venta.setCostoTotalAlVender(new BigDecimal("9250.00"));
        when(vehiculoRepository.findById(1L)).thenReturn(Optional.of(v));
        when(compraRepository.findByVehiculoAndActivoTrue(v)).thenReturn(Optional.of(compra));
        when(ventaRepository.findByVehiculoAndActivoTrue(v)).thenReturn(Optional.of(venta));
        when(refaccionRepository.findByVehiculoAndActivoTrueOrderByFechaDesc(v)).thenReturn(List.of(refaccion));
        var evento = new HistorialEventoVehiculoResponse(
                LocalDateTime.of(2026, 8, 10, 12, 0), "Operador", "CAMBIO_ESTADO",
                "Estado actualizado de EN_TALLER a DISPONIBLE.", "EN_TALLER", "DISPONIBLE");
        when(auditoriaService.eventosVehiculo(1L)).thenReturn(List.of(evento));
        Object historial = service.historial(1L);
        switch (rol) {
            case "VENDEDOR" -> {
                var h = assertInstanceOf(VehiculoHistorialComercialResponse.class, historial);
                assertEquals("CAMBIO_ESTADO", h.eventos().get(0).accion());
                assertEquals(10L, h.compra().id());
                assertEquals("Ana", h.compra().clienteVendedor());
                assertEquals("Mantenimiento", h.refacciones().get(0).descripcion());
                assertEquals(new BigDecimal("12000.00"), h.venta().precioFinal());
                // Se inspecciona el contrato público para detectar una futura fuga de datos por
                // DTO.
                assertFalse(componentes(h.compra()).contains("costoAdquisicion"));
                assertFalse(componentes(h.refacciones().get(0)).contains("costoManoObra"));
                assertFalse(componentes(h.vehiculo()).contains("observacionesInternas"));
            }
            case "TALLER" -> {
                var h = assertInstanceOf(VehiculoHistorialTallerResponse.class, historial);
                assertEquals("CAMBIO_ESTADO", h.eventos().get(0).accion());
                assertEquals(compra.getFechaCompra(), h.fechaCompra());
                assertEquals(venta.getFechaVenta(), h.fechaVenta());
                assertFalse(componentes(h.vehiculo()).contains("costoInicial"));
                assertFalse(componentes(h.vehiculo()).contains("precioVentaEstimado"));
                assertFalse(componentes(h.vehiculo()).contains("observacionesInternas"));
                assertEquals(20L, h.refacciones().get(0).id());
            }
            default -> {
                var h = assertInstanceOf(VehiculoHistorialGerencialResponse.class, historial);
                assertEquals("CAMBIO_ESTADO", h.eventos().get(0).accion());
                assertEquals(new BigDecimal("9000.00"), h.compra().costoAdquisicion());
                assertEquals(new BigDecimal("9250.00"), h.venta().costoTotalAlVender());
                assertEquals("Solo gerencia", h.vehiculo().observacionesInternas());
            }
        }
    }

    private List<String> componentes(Object dto) {
        return java.util.Arrays.stream(dto.getClass().getRecordComponents())
                .map(java.lang.reflect.RecordComponent::getName).toList();
    }

    private VehiculoRequest datosVehiculo(String tipo, String observaciones) {
        return new VehiculoRequest(" Toyota ", " Corolla ", tipo, 2020, " ", null, " Gris ",
                12000, UbicacionVehiculo.LOCAL, null, " Unidad revisada ", observaciones);
    }

    private Vehiculo vehiculo(EstadoVehiculo estado) {
        Vehiculo v = new Vehiculo();
        v.setId(1L);
        v.setMarca("Toyota");
        v.setModelo("Corolla");
        v.setAnio(2020);
        v.setEstado(estado);
        v.setPrecioVentaUsd(new BigDecimal("15000"));
        return v;
    }

    private void autenticar(String rol) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "tester", "n/a", java.util.List.of(new SimpleGrantedAuthority("ROLE_" + rol))));
    }
}
