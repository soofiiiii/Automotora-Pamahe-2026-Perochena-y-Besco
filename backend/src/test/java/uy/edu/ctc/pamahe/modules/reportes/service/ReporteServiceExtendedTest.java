package uy.edu.ctc.pamahe.modules.reportes.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.modules.auditoria.model.Auditoria;
import uy.edu.ctc.pamahe.modules.auditoria.repository.AuditoriaRepository;
import uy.edu.ctc.pamahe.modules.clientes.repository.ClienteRepository;
import uy.edu.ctc.pamahe.modules.compras.model.Compra;
import uy.edu.ctc.pamahe.modules.compras.repository.CompraRepository;
import uy.edu.ctc.pamahe.modules.taller.model.EstadoTarea;
import uy.edu.ctc.pamahe.modules.taller.model.Refaccion;
import uy.edu.ctc.pamahe.modules.taller.repository.RefaccionRepository;
import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.repository.VehiculoRepository;
import uy.edu.ctc.pamahe.modules.ventas.model.Venta;
import uy.edu.ctc.pamahe.modules.ventas.repository.VentaRepository;

@ExtendWith(MockitoExtension.class)
class ReporteServiceExtendedTest {

    @Mock
    VehiculoRepository vehiculos;

    @Mock
    ClienteRepository clientes;

    @Mock
    VentaRepository ventas;

    @Mock
    CompraRepository compras;

    @Mock
    RefaccionRepository refacciones;

    @Mock
    AuditoriaRepository auditoria;

    ReporteService service;

    @BeforeEach
    void setUp() {
        service = new ReporteService(
                vehiculos,
                clientes,
                ventas,
                compras,
                refacciones,
                auditoria);
    }

    @Test
    void ventasUsaSnapshotsHistoricos() {
        Vehiculo ve = vehiculo();

        Venta v = new Venta();
        v.setId(1L);
        v.setVehiculo(ve);
        v.setFechaVenta(LocalDate.of(2026, 9, 1));
        v.setPrecioFinal(new BigDecimal("15000"));
        v.setCostoTotalAlVender(new BigDecimal("11000"));
        v.setRentabilidadCalculada(new BigDecimal("4000"));

        when(ventas.findByActivoTrueAndFechaVentaBetweenOrderByFechaVentaDesc(
                any(),
                any()))
                .thenReturn(List.of(v));

        var r = service.ventas(
                LocalDate.of(2026, 9, 1),
                LocalDate.of(2026, 9, 30));

        assertEquals(new BigDecimal("4000"), r.rentabilidad());
        assertEquals(new BigDecimal("11000"), r.costoTotal());
    }

    @Test
    void comprasSumaInversionDelPeriodo() {
        Vehiculo ve = vehiculo();

        Compra c = new Compra();
        c.setId(2L);
        c.setVehiculo(ve);
        c.setFechaCompra(LocalDate.of(2026, 9, 2));
        c.setCostoAdquisicion(new BigDecimal("9000"));

        when(compras.findByActivoTrueAndFechaCompraBetweenOrderByFechaCompraDesc(
                any(),
                any()))
                .thenReturn(List.of(c));

        var r = service.compras(
                LocalDate.of(2026, 9, 1),
                LocalDate.of(2026, 9, 30));

        assertEquals(new BigDecimal("9000"), r.inversionCompras());
    }

    @Test
    void stockDistingueIngresosDelPeriodoDeStockAlCierre() {
        Vehiculo ve = vehiculo();

        /*
         * El estado actual no debe ser utilizado directamente
         * para calcular el estado histórico.
         */
        ve.setEstado(EstadoVehiculo.VENDIDO);
        ve.setPublicado(false);

        Compra ingreso = new Compra();
        ingreso.setVehiculo(ve);
        ingreso.setFechaCompra(LocalDate.of(2026, 9, 2));

        Compra anterior = new Compra();
        anterior.setVehiculo(ve);
        anterior.setFechaCompra(LocalDate.of(2026, 8, 2));

        /*
         * Durante septiembre ingresó una unidad.
         */
        when(compras.findByActivoTrueAndFechaCompraBetweenOrderByFechaCompraDesc(
                LocalDate.of(2026, 9, 1),
                LocalDate.of(2026, 9, 30)))
                .thenReturn(List.of(ingreso));

        /*
         * Al cierre existen dos registros de compra que forman parte
         * del stock histórico considerado por el reporte.
         */
        when(compras.findByActivoTrueAndFechaCompraLessThanEqualOrderByFechaCompraDesc(
                LocalDate.of(2026, 9, 30)))
                .thenReturn(List.of(anterior, ingreso));

        /*
         * Ninguno había sido vendido todavía al 30/09.
         */
        when(ventas.findByActivoTrueAndFechaVentaLessThanEqualOrderByFechaVentaDesc(
                LocalDate.of(2026, 9, 30)))
                .thenReturn(List.of());

        /*
         * La auditoría indica que al cierre del período
         * el vehículo estaba DISPONIBLE y publicado.
         */
        Auditoria eventoHistorico = new Auditoria();
        eventoHistorico.setEntidadId(ve.getId());
        eventoHistorico.setValoresNuevos(
                "estado=DISPONIBLE, publicado=true");

        when(auditoria.buscarHistorialVehiculosHasta(
                any(),
                any()))
                .thenReturn(List.of(eventoHistorico));

        var r = service.stock(
                LocalDate.of(2026, 9, 1),
                LocalDate.of(2026, 9, 30));

        /*
         * Solo una compra ocurrió dentro de septiembre.
         */
        assertEquals(1, r.vehiculosIngresados());

        /*
         * Pero al cierre existen dos unidades/registros
         * pertenecientes al stock.
         */
        assertEquals(2, r.stockAlCierre());

        /*
         * La situación histórica reconstruida es DISPONIBLE/publicado.
         */
        assertEquals(2, r.disponibles());
        assertEquals(2, r.publicados());

        assertEquals(
                EstadoVehiculo.DISPONIBLE,
                r.vehiculos().get(0).estado());

        assertTrue(r.vehiculos().get(0).publicado());

        /*
         * El DTO debe dejar claro que estos valores no representan
         * necesariamente el estado actual persistido en Vehiculo.
         */
        assertFalse(
                r.estadoYPublicacionRepresentanSituacionActual());
    }

    @Test
    void stockHistoricoNoDependeDeQueLaUnidadEsteVendidaActualmente() {
        Vehiculo ve = vehiculo();

        /*
         * Situación ACTUAL del vehículo.
         */
        ve.setEstado(EstadoVehiculo.VENDIDO);
        ve.setPublicado(false);

        Compra compraHistorica = new Compra();
        compraHistorica.setVehiculo(ve);
        compraHistorica.setFechaCompra(LocalDate.of(2026, 1, 10));

        /*
         * No ingresó durante junio porque fue comprado en enero.
         */
        when(compras.findByActivoTrueAndFechaCompraBetweenOrderByFechaCompraDesc(
                LocalDate.of(2026, 6, 1),
                LocalDate.of(2026, 6, 30)))
                .thenReturn(List.of());

        /*
         * La compra ya existía antes del cierre de junio.
         */
        when(compras.findByActivoTrueAndFechaCompraLessThanEqualOrderByFechaCompraDesc(
                LocalDate.of(2026, 6, 30)))
                .thenReturn(List.of(compraHistorica));

        /*
         * Al 30/06 todavía no había sido vendido.
         */
        when(ventas.findByActivoTrueAndFechaVentaLessThanEqualOrderByFechaVentaDesc(
                LocalDate.of(2026, 6, 30)))
                .thenReturn(List.of());

        /*
         * La auditoría demuestra que en junio estaba disponible
         * y publicado, aunque actualmente figure como vendido.
         */
        Auditoria eventoHistorico = new Auditoria();
        eventoHistorico.setEntidadId(ve.getId());
        eventoHistorico.setValoresNuevos(
                "estado=DISPONIBLE, publicado=true");

        when(auditoria.buscarHistorialVehiculosHasta(
                any(),
                any()))
                .thenReturn(List.of(eventoHistorico));

        var r = service.stock(
                LocalDate.of(2026, 6, 1),
                LocalDate.of(2026, 6, 30));

        assertEquals(0, r.vehiculosIngresados());
        assertEquals(1, r.stockAlCierre());

        /*
         * El reporte debe mostrar la situación de junio,
         * no la situación actual VENDIDO/false.
         */
        assertEquals(1, r.disponibles());
        assertEquals(1, r.publicados());

        assertEquals(
                EstadoVehiculo.DISPONIBLE,
                r.vehiculos().get(0).estado());

        assertTrue(
                r.vehiculos().get(0).publicado());

        assertFalse(
                r.estadoYPublicacionRepresentanSituacionActual());
    }

    @Test
    void refaccionesExcluyeCanceladasDeCostos() {
        Vehiculo ve = vehiculo();

        Refaccion ok = refaccion(
                ve,
                EstadoTarea.FINALIZADA,
                "100");

        Refaccion cancelada = refaccion(
                ve,
                EstadoTarea.CANCELADA,
                "500");

        when(refacciones.findByActivoTrueAndFechaBetweenOrderByFechaDesc(
                any(),
                any()))
                .thenReturn(List.of(ok, cancelada));

        var r = service.refacciones(
                LocalDate.of(2026, 9, 1),
                LocalDate.of(2026, 9, 30));

        assertEquals(1, r.cantidadRefacciones());
        assertEquals(new BigDecimal("100"), r.costoTotal());
    }

    @Test
    void rentabilidadCalculaMargenSobreIngresos() {
        Vehiculo ve = vehiculo();

        Venta v = new Venta();
        v.setVehiculo(ve);
        v.setPrecioFinal(new BigDecimal("10000"));
        v.setCostoTotalAlVender(new BigDecimal("8000"));
        v.setRentabilidadCalculada(new BigDecimal("2000"));

        when(ventas.findByActivoTrueAndFechaVentaBetweenOrderByFechaVentaDesc(
                any(),
                any()))
                .thenReturn(List.of(v));

        var r = service.rentabilidad(
                LocalDate.of(2026, 9, 1),
                LocalDate.of(2026, 9, 30));

        assertEquals(
                new BigDecimal("20.00"),
                r.margenPorcentual());
    }

    @Test
    void rechazaPeriodoInvertido() {
        assertThrows(
                BusinessException.class,
                () -> service.ventas(
                        LocalDate.of(2026, 9, 30),
                        LocalDate.of(2026, 9, 1)));
    }

    private Vehiculo vehiculo() {
        Vehiculo v = new Vehiculo();

        v.setId(1L);
        v.setActivo(true);
        v.setMarca("Toyota");
        v.setModelo("Corolla");
        v.setAnio(2020);

        /*
         * Estado inicial conocido del ciclo.
         */
        v.setEstado(EstadoVehiculo.COMPRADO);
        v.setPublicado(false);

        return v;
    }

    private Refaccion refaccion(
            Vehiculo v,
            EstadoTarea estado,
            String total) {

        Refaccion r = new Refaccion();

        r.setVehiculo(v);
        r.setEstadoTarea(estado);
        r.setFecha(LocalDate.of(2026, 9, 3));

        r.setCostoRepuestos(new BigDecimal(total));
        r.setCostoManoObra(BigDecimal.ZERO);
        r.setCostoServiciosExternos(BigDecimal.ZERO);

        return r;
    }
}