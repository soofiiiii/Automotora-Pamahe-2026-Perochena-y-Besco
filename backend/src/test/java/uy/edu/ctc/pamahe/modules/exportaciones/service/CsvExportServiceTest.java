package uy.edu.ctc.pamahe.modules.exportaciones.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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

    @Test
    void escapaComasComillasSaltosYNeutralizaFormula() {
        Cliente c = new Cliente();

        c.setId(1L);
        c.setNombre("=SUM(A1:A2), \"Juan\"\nPérez");
        c.setDocumento("123");
        c.setTipoCliente(TipoCliente.COMPRADOR);

        when(clientes.findByActivoTrueOrderByNombreAsc())
                .thenReturn(List.of(c));

        CsvExportService service = new CsvExportService(
                vehiculos,
                clientes,
                ventas,
                compras,
                refacciones,
                costoService);

        String csv = service.clientes();

        assertTrue(csv.startsWith(
                "\uFEFF\"id\",\"nombre\",\"apellido\",\"documento\",\"tipoCliente\",\"telefono\",\"email\""));

        assertTrue(csv.contains(
                "\"1\",\"'=SUM(A1:A2), \"\"Juan\"\"\nPérez\""));
    }
}
