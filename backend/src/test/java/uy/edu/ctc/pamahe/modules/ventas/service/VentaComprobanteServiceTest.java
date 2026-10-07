package uy.edu.ctc.pamahe.modules.ventas.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.clientes.model.Cliente;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;
import uy.edu.ctc.pamahe.modules.ventas.model.EstadoComprobanteVenta;
import uy.edu.ctc.pamahe.modules.ventas.model.CanalOrigenVenta;
import uy.edu.ctc.pamahe.modules.ventas.model.MedioPagoVenta;
import uy.edu.ctc.pamahe.modules.ventas.model.Venta;
import uy.edu.ctc.pamahe.modules.ventas.repository.VentaRepository;

@ExtendWith(MockitoExtension.class)
class VentaComprobanteServiceTest {

    @Mock
    VentaRepository repository;
    @Mock
    AuditoriaService auditoriaService;
    private VentaComprobanteService service;

    @BeforeEach
    void setUp() {
        service = new VentaComprobanteService(repository, auditoriaService);
    }

    @Test
    void reservarIntentoReconstruyePayloadDesdeLaVentaPersistida() {
        Venta venta = venta();
        when(repository.findByIdForComprobanteUpdate(9L)).thenReturn(Optional.of(venta));

        var snapshot = service.prepararIntento(9L).orElseThrow();

        assertEquals(1, snapshot.numeroIntento());
        assertEquals("Toyota Corolla 2022", snapshot.vehiculo());
        assertEquals("Ana Pérez", snapshot.clienteComprador());
        assertEquals(MedioPagoVenta.TRANSFERENCIA, snapshot.medioPago());
        assertEquals(CanalOrigenVenta.PRESENCIAL, snapshot.canalOrigen());
        assertEquals(EstadoComprobanteVenta.PENDIENTE, venta.getEstadoComprobante());
        assertEquals(1, venta.getIntentosComprobante());
        assertNotNull(venta.getUltimoIntentoComprobante());
        assertNotNull(venta.getProximoIntentoComprobante());
    }

    @Test
    void comprobanteGeneradoNoSeProcesaOtraVez() {
        Venta venta = venta();
        venta.setEstadoComprobante(EstadoComprobanteVenta.GENERADO);
        venta.setComprobantePath("ventas/9.pdf");
        when(repository.findByIdForComprobanteUpdate(9L)).thenReturn(Optional.of(venta));

        assertTrue(service.prepararIntento(9L).isEmpty());
    }

    @Test
    void errorQuedaPersistidoYProgramadoParaReintento() {
        Venta venta = venta();
        venta.setIntentosComprobante(1);
        when(repository.findByIdForComprobanteUpdate(9L)).thenReturn(Optional.of(venta));

        LocalDateTime before = LocalDateTime.now();
        service.marcarError(9L, new IllegalStateException("PDF temporalmente no disponible"));

        assertEquals(EstadoComprobanteVenta.ERROR, venta.getEstadoComprobante());
        assertEquals(
                "No se pudo generar el comprobante PDF en el último intento.",
                venta.getErrorComprobante());
        assertNotNull(venta.getProximoIntentoComprobante());
        assertTrue(venta.getProximoIntentoComprobante().isAfter(before));
        verify(auditoriaService).registrar(
                eq("COMPROBANTE_ERROR"),
                eq("Venta"),
                eq(9L),
                anyString());
    }

    @Test
    void alAgotarIntentosConservaErrorSinNuevoReintentoAutomatico() {
        Venta venta = venta();
        venta.setIntentosComprobante(VentaComprobanteService.MAX_INTENTOS);
        when(repository.findByIdForComprobanteUpdate(9L)).thenReturn(Optional.of(venta));

        service.marcarError(9L, new IllegalStateException("fallo persistente"));

        assertEquals(EstadoComprobanteVenta.ERROR, venta.getEstadoComprobante());
        assertNull(venta.getProximoIntentoComprobante());
    }

    @Test
    void marcarGeneradoAsociaArchivoYLimpiaEstadoDeError() {
        Venta venta = venta();
        venta.setEstadoComprobante(EstadoComprobanteVenta.ERROR);
        venta.setErrorComprobante("fallo anterior");
        when(repository.findByIdForComprobanteUpdate(9L)).thenReturn(Optional.of(venta));

        service.marcarGenerado(9L, "ventas/9.pdf");

        assertEquals("ventas/9.pdf", venta.getComprobantePath());
        assertEquals(EstadoComprobanteVenta.GENERADO, venta.getEstadoComprobante());
        assertNull(venta.getErrorComprobante());
        assertNull(venta.getProximoIntentoComprobante());
        verify(auditoriaService).registrar(eq("COMPROBANTE_GENERADO"), eq("Venta"), eq(9L), anyString());
    }

    @Test
    void reprogramacionAdministrativaReiniciaContadorSinDuplicarVenta() {
        Venta venta = venta();
        venta.setEstadoComprobante(EstadoComprobanteVenta.ERROR);
        venta.setIntentosComprobante(5);
        venta.setErrorComprobante("agotado");
        when(repository.findByIdForComprobanteUpdate(9L)).thenReturn(Optional.of(venta));

        service.reprogramar(9L);

        assertEquals(EstadoComprobanteVenta.PENDIENTE, venta.getEstadoComprobante());
        assertEquals(0, venta.getIntentosComprobante());
        assertNull(venta.getErrorComprobante());
        assertNotNull(venta.getProximoIntentoComprobante());
        verify(repository, never()).save(any());
    }

    private Venta venta() {
        Vehiculo vehiculo = new Vehiculo();
        vehiculo.setId(1L);
        vehiculo.setMarca("Toyota");
        vehiculo.setModelo("Corolla");
        vehiculo.setAnio(2022);

        Cliente cliente = new Cliente();
        cliente.setId(2L);
        cliente.setNombre("Ana");
        cliente.setApellido("Pérez");
        cliente.setDocumento("12345678");

        Usuario vendedor = new Usuario();
        vendedor.setId(7L);
        vendedor.setNombre("Vendedor");

        Venta venta = new Venta();
        venta.setId(9L);
        venta.setVehiculo(vehiculo);
        venta.setClienteComprador(cliente);
        venta.setVendedor(vendedor);
        venta.setFechaVenta(LocalDate.of(2026, 9, 29));
        venta.setPrecioFinal(new BigDecimal("15000.00"));
        venta.setMedioPago(MedioPagoVenta.TRANSFERENCIA);
        venta.setCanalOrigen(CanalOrigenVenta.PRESENCIAL);
        venta.setActivo(true);
        venta.setEstadoComprobante(EstadoComprobanteVenta.PENDIENTE);
        venta.setIntentosComprobante(0);
        venta.setProximoIntentoComprobante(LocalDateTime.now().minusSeconds(1));
        return venta;
    }
}
