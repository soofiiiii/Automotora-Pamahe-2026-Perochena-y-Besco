package uy.edu.ctc.pamahe.modules.catalogo.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.modules.imagenes.repository.ImagenVehiculoRepository;
import uy.edu.ctc.pamahe.modules.parametros.repository.ParametroRepository;
import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.repository.VehiculoRepository;

@ExtendWith(MockitoExtension.class)
class CatalogoServiceTest {
    @Mock VehiculoRepository vehiculos;
    @Mock ImagenVehiculoRepository imagenes;
    @Mock ParametroRepository parametros;

    @Test
    void detallePublicoDevuelve404SiNoEstaVisible() {
        when(vehiculos.findByIdAndActivoTrueAndPublicadoTrueAndEstado(7L, EstadoVehiculo.DISPONIBLE))
                .thenReturn(Optional.empty());
        CatalogoService service = new CatalogoService(vehiculos, imagenes, parametros);
        assertThrows(ResourceNotFoundException.class, () -> service.obtenerDetalle(7L));
    }

    @Test
    void rechazaRangoDePrecioInvertido() {
        CatalogoService service = new CatalogoService(vehiculos, imagenes, parametros);
        assertThrows(BusinessException.class,
                () -> service.listarDisponibles(null, null, null, null, null,
                        new BigDecimal("20000"), new BigDecimal("10000")));
    }

    @Test
    void rechazaPrecioNegativo() {
        CatalogoService service = new CatalogoService(vehiculos, imagenes, parametros);
        assertThrows(BusinessException.class,
                () -> service.listarDisponibles(null, null, null, null, null,
                        new BigDecimal("-1"), null));
    }

    @Test
    void listadoVacioNoConsultaImagenes() {
        when(vehiculos.buscarCatalogo(eq(EstadoVehiculo.DISPONIBLE), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of());
        CatalogoService service = new CatalogoService(vehiculos, imagenes, parametros);
        assertTrue(service.listarDisponibles(null, null, null, null, null, null, null).isEmpty());
        verifyNoInteractions(imagenes);
    }
}
