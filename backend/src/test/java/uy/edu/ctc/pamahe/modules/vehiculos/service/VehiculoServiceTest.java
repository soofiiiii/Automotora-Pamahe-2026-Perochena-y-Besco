package uy.edu.ctc.pamahe.modules.vehiculos.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.util.Optional;

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
import uy.edu.ctc.pamahe.modules.taller.repository.RefaccionRepository;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.request.CambiarEstadoVehiculoRequest;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.request.CambiarPublicacionVehiculoRequest;
import uy.edu.ctc.pamahe.modules.vehiculos.dto.response.VehiculoComercialResponse;
import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;
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
    private VehiculoService service;

    @BeforeEach
    void setUp() {
        service = new VehiculoService(vehiculoRepository, compraRepository, refaccionRepository, auditoriaService,
                ventaRepository, imagenRepository);
    }

    @AfterEach
    void cleanSecurity() {
        SecurityContextHolder.clearContext();
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
    void publicacionExigeDisponibleYPrecioPositivo() {
        autenticar("VENDEDOR");
        Vehiculo v = vehiculo(EstadoVehiculo.DISPONIBLE);
        v.setPrecioVentaEstimado(BigDecimal.ZERO);
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
    void vendidoNoSePuedeDesactivar() {
        autenticar("ADMINISTRADOR");
        Vehiculo v = vehiculo(EstadoVehiculo.VENDIDO);
        when(vehiculoRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(v));
        assertThrows(BusinessException.class, () -> service.desactivar(1L));
    }

    private Vehiculo vehiculo(EstadoVehiculo estado) {
        Vehiculo v = new Vehiculo();
        v.setId(1L);
        v.setMarca("Toyota");
        v.setModelo("Corolla");
        v.setAnio(2020);
        v.setEstado(estado);
        return v;
    }

    private void autenticar(String rol) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "tester", "n/a", java.util.List.of(new SimpleGrantedAuthority("ROLE_" + rol))));
    }
}
