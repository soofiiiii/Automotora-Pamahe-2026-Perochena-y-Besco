package uy.edu.ctc.pamahe.modules.reportes.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import uy.edu.ctc.pamahe.modules.clientes.repository.ClienteRepository;
import uy.edu.ctc.pamahe.modules.taller.repository.RefaccionRepository;
import uy.edu.ctc.pamahe.modules.vehiculos.repository.VehiculoRepository;
import uy.edu.ctc.pamahe.modules.ventas.model.Venta;
import uy.edu.ctc.pamahe.modules.ventas.repository.VentaRepository;

@ExtendWith(MockitoExtension.class)
class ReporteServiceTest {
    @Mock
    VehiculoRepository vehiculos;
    @Mock
    ClienteRepository clientes;
    @Mock
    VentaRepository ventas;
    @Mock
    RefaccionRepository refacciones;

    @Test
    void vendidosSeCuentanDesdeVentasHistoricasAunqueNoEstanEnStockActivo() {
        Venta v = new Venta();
        v.setPrecioFinal(new BigDecimal("15000"));
        v.setRentabilidadCalculada(new BigDecimal("3000"));
        when(vehiculos.findByActivoTrueOrderByCreadoEnDesc()).thenReturn(List.of());
        when(ventas.findByActivoTrueOrderByFechaVentaDesc()).thenReturn(List.of(v));
        when(ventas.findByActivoTrueAndFechaVentaBetweenOrderByFechaVentaDesc(any(LocalDate.class),
                any(LocalDate.class))).thenReturn(List.of(v));
        when(clientes.findByActivoTrueOrderByNombreAsc()).thenReturn(List.of());
        when(refacciones.findByActivoTrueOrderByFechaDesc()).thenReturn(List.of());
        var result = new ReporteService(vehiculos, clientes, ventas, refacciones).dashboard(null, null);
        assertEquals(1, result.vehiculosVendidos());
        assertEquals(new BigDecimal("3000"), result.rentabilidadAcumulada());
    }
}
