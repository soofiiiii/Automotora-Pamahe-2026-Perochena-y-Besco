package uy.edu.ctc.pamahe.modules.costos.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import uy.edu.ctc.pamahe.modules.compras.model.Compra;
import uy.edu.ctc.pamahe.modules.compras.repository.CompraRepository;
import uy.edu.ctc.pamahe.modules.taller.model.EstadoTarea;
import uy.edu.ctc.pamahe.modules.taller.model.Refaccion;
import uy.edu.ctc.pamahe.modules.taller.repository.RefaccionRepository;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.service.VehiculoService;
import uy.edu.ctc.pamahe.modules.ventas.model.Venta;
import uy.edu.ctc.pamahe.modules.ventas.repository.VentaRepository;

@ExtendWith(MockitoExtension.class)
class CostoServiceTest {
    @Mock VehiculoService vehiculoService;
    @Mock CompraRepository compraRepository;
    @Mock RefaccionRepository refaccionRepository;
    @Mock VentaRepository ventaRepository;
    private CostoService service;

    @BeforeEach
    void setUp() {
        service = new CostoService(vehiculoService, compraRepository, refaccionRepository, ventaRepository);
    }

    @Test
    void calculaCompraRefaccionesYCostoTotal() {
        Vehiculo vehiculo = vehiculo(1L);
        Compra compra = new Compra();
        compra.setCostoAdquisicion(new BigDecimal("10000.00"));
        Refaccion r1 = refaccion("1000", "500", "250");
        Refaccion r2 = refaccion("300", "200", "0");
        when(compraRepository.findByVehiculoAndActivoTrue(vehiculo)).thenReturn(Optional.of(compra));
        when(refaccionRepository.findByVehiculoAndActivoTrueAndEstadoTareaNotOrderByFechaDesc(vehiculo, EstadoTarea.CANCELADA))
                .thenReturn(List.of(r1, r2));

        var result = service.calcularActualParaVenta(vehiculo);

        assertEquals(new BigDecimal("10000.00"), result.costoCompra());
        assertEquals(new BigDecimal("2250"), result.costoRefacciones());
        assertEquals(new BigDecimal("12250.00"), result.costoTotal());
    }

    @Test
    void vendidoUsaSnapshotHistorico() {
        Vehiculo vehiculo = vehiculo(1L);
        Venta venta = new Venta();
        venta.setVehiculo(vehiculo);
        venta.setCostoCompraAlVender(new BigDecimal("10000"));
        venta.setCostoRefaccionesAlVender(new BigDecimal("2000"));
        venta.setCostoTotalAlVender(new BigDecimal("12000"));
        venta.setPrecioFinal(new BigDecimal("15000"));
        venta.setRentabilidadCalculada(new BigDecimal("3000"));
        when(vehiculoService.buscarActivoPorId(1L)).thenReturn(vehiculo);
        when(ventaRepository.findByVehiculoAndActivoTrue(vehiculo)).thenReturn(Optional.of(venta));

        var result = service.calcular(1L);

        assertTrue(result.historicoCerrado());
        assertEquals(new BigDecimal("12000"), result.costoTotal());
        assertEquals(new BigDecimal("3000"), result.rentabilidad());
        verifyNoInteractions(compraRepository, refaccionRepository);
    }

    @Test
    void sinVentaCalculaCostosActualesConCentavos() {
        Vehiculo v = vehiculo(1L);
        Compra compra = new Compra();
        compra.setCostoAdquisicion(new BigDecimal("10000.01"));
        when(vehiculoService.buscarActivoPorId(1L)).thenReturn(v);
        when(compraRepository.findByVehiculoAndActivoTrue(v)).thenReturn(Optional.of(compra));
        when(refaccionRepository.findByVehiculoAndActivoTrueAndEstadoTareaNotOrderByFechaDesc(v, EstadoTarea.CANCELADA))
                .thenReturn(List.of(refaccion("0.10", "0.20", "0.01")));
        var result = service.calcular(1L);
        assertFalse(result.historicoCerrado());
        assertEquals(new BigDecimal("10000.32"), result.costoTotal());
        assertNull(result.rentabilidad());
    }

    @Test
    void sinRefaccionesElCostoEsSoloLaCompra() {
        Vehiculo v = vehiculo(1L);
        Compra compra = new Compra();
        compra.setCostoAdquisicion(new BigDecimal("12500.50"));
        when(compraRepository.findByVehiculoAndActivoTrue(v)).thenReturn(Optional.of(compra));
        var result = service.calcularActualParaVenta(v);
        assertEquals(BigDecimal.ZERO, result.costoRefacciones());
        assertEquals(new BigDecimal("12500.50"), result.costoTotal());
        verify(refaccionRepository).findByVehiculoAndActivoTrueAndEstadoTareaNotOrderByFechaDesc(v, EstadoTarea.CANCELADA);
    }

    @Test
    void sinCompraNoInventaCostoCero() {
        assertThrows(uy.edu.ctc.pamahe.common.exception.BusinessException.class,
                () -> service.calcularActualParaVenta(vehiculo(1L)));
        verifyNoInteractions(refaccionRepository);
    }

    @Test
    void ventaReutilizaCompraValidadaYAgregaEnBase() {
        Vehiculo v = vehiculo(1L);
        Compra compra = new Compra();
        compra.setCostoAdquisicion(new BigDecimal("10000.01"));
        when(refaccionRepository.sumarCostoActivo(v, EstadoTarea.CANCELADA))
                .thenReturn(new BigDecimal("0.31"));
        var result = service.calcularActualParaVenta(v, compra);
        assertEquals(new BigDecimal("10000.32"), result.costoTotal());
        verifyNoInteractions(compraRepository);
    }

    private Vehiculo vehiculo(Long id) {
        Vehiculo v = new Vehiculo(); v.setId(id); v.setMarca("Test"); v.setModelo("V1"); v.setAnio(2022); return v;
    }
    private Refaccion refaccion(String repuestos, String mano, String externos) {
        Refaccion r = new Refaccion();
        r.setCostoRepuestos(new BigDecimal(repuestos));
        r.setCostoManoObra(new BigDecimal(mano));
        r.setCostoServiciosExternos(new BigDecimal(externos));
        return r;
    }
}
