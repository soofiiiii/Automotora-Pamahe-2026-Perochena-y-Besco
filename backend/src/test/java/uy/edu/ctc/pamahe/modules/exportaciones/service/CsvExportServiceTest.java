package uy.edu.ctc.pamahe.modules.exportaciones.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.modules.clientes.model.Cliente;
import uy.edu.ctc.pamahe.modules.clientes.model.TipoCliente;
import uy.edu.ctc.pamahe.modules.clientes.repository.ClienteRepository;
import uy.edu.ctc.pamahe.modules.compras.repository.CompraRepository;
import uy.edu.ctc.pamahe.modules.costos.service.CostoService;
import uy.edu.ctc.pamahe.modules.taller.repository.RefaccionRepository;
import uy.edu.ctc.pamahe.modules.vehiculos.repository.VehiculoRepository;
import uy.edu.ctc.pamahe.modules.ventas.repository.VentaRepository;

@ExtendWith(MockitoExtension.class)
class CsvExportServiceTest {
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
    CostoService costoService;

    private CsvExportService service;

    @BeforeEach
    void setUp() {
        service = new CsvExportService(
                vehiculos,
                clientes,
                ventas,
                compras,
                refacciones,
                costoService);
    }

    @Test
    void escapaComasComillasSaltosYNeutralizaFormula() {
        Cliente c = new Cliente();
        c.setId(1L);
        c.setNombre("=SUM(A1:A2), \"Juan\"\nPérez");
        c.setDocumento("123");
        c.setTipoCliente(TipoCliente.COMPRADOR);

        when(clientes.findByActivoTrueOrderByNombreAsc())
                .thenReturn(List.of(c));

        String csv = service.clientes();

        assertTrue(csv.startsWith(
                "\uFEFF\"id\",\"nombre\",\"apellido\",\"documento\",\"tipoCliente\",\"telefono\",\"email\""));
        assertTrue(csv.contains(
                "\"1\",\"'=SUM(A1:A2), \"\"Juan\"\"\nPérez\""));
    }

    @Test
    void ventasUsaElPeriodoSolicitado() {
        LocalDate desde = LocalDate.of(2026, 9, 1);
        LocalDate hasta = LocalDate.of(2026, 9, 30);
        when(ventas.findByActivoTrueAndFechaVentaBetweenOrderByFechaVentaDesc(desde, hasta))
                .thenReturn(List.of());

        service.ventas(desde, hasta);

        verify(ventas).findByActivoTrueAndFechaVentaBetweenOrderByFechaVentaDesc(desde, hasta);
    }

    @Test
    void comprasUsaElPeriodoSolicitado() {
        LocalDate desde = LocalDate.of(2026, 8, 1);
        LocalDate hasta = LocalDate.of(2026, 8, 31);
        when(compras.findByActivoTrueAndFechaCompraBetweenOrderByFechaCompraDesc(desde, hasta))
                .thenReturn(List.of());

        service.compras(desde, hasta);

        verify(compras).findByActivoTrueAndFechaCompraBetweenOrderByFechaCompraDesc(desde, hasta);
    }

    @Test
    void refaccionesUsaElPeriodoSolicitado() {
        LocalDate desde = LocalDate.of(2026, 7, 1);
        LocalDate hasta = LocalDate.of(2026, 7, 31);
        when(refacciones.findByActivoTrueAndFechaBetweenOrderByFechaDesc(desde, hasta))
                .thenReturn(List.of());

        service.refacciones(desde, hasta);

        verify(refacciones).findByActivoTrueAndFechaBetweenOrderByFechaDesc(desde, hasta);
    }

    @Test
    void exportacionesSinFechasUsanMesActualComoLosReportes() {
        LocalDate hoy = LocalDate.now();
        LocalDate inicioMes = hoy.withDayOfMonth(1);
        when(ventas.findByActivoTrueAndFechaVentaBetweenOrderByFechaVentaDesc(inicioMes, hoy))
                .thenReturn(List.of());

        service.ventas(null, null);

        verify(ventas).findByActivoTrueAndFechaVentaBetweenOrderByFechaVentaDesc(inicioMes, hoy);
    }

    @Test
    void rechazaPeriodoInvertidoEnVentasComprasYRefacciones() {
        LocalDate desde = LocalDate.of(2026, 9, 30);
        LocalDate hasta = LocalDate.of(2026, 9, 1);

        assertThrows(BusinessException.class, () -> service.ventas(desde, hasta));
        assertThrows(BusinessException.class, () -> service.compras(desde, hasta));
        assertThrows(BusinessException.class, () -> service.refacciones(desde, hasta));
    }
}
