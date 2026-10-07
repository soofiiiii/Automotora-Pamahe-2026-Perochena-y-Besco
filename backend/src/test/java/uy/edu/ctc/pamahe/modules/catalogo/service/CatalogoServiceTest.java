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
import uy.edu.ctc.pamahe.modules.parametros.model.Parametro;
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
        when(vehiculos.findByIdAndActivoTrueAndPublicadoTrueAndEstadoIn(7L, List.of(EstadoVehiculo.DISPONIBLE, EstadoVehiculo.RESERVADO)))
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
        when(vehiculos.buscarCatalogo(eq(List.of(EstadoVehiculo.DISPONIBLE, EstadoVehiculo.RESERVADO)), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of());
        CatalogoService service = new CatalogoService(vehiculos, imagenes, parametros);
        assertTrue(service.listarDisponibles(null, null, null, null, null, null, null).isEmpty());
        verifyNoInteractions(imagenes);
    }
    @Test
    void detallePublicoConservaLabelDeTipoDinamicoAunqueElParametroEsteInactivo() {
        Vehiculo vehiculo = new Vehiculo();
        vehiculo.setId(7L);
        vehiculo.setMarca("JAC");
        vehiculo.setModelo("T8");
        vehiculo.setTipoVehiculo("UTE_DOBLE");
        vehiculo.setAnio(2024);
        vehiculo.setEstado(EstadoVehiculo.RESERVADO);

        Parametro tipo = new Parametro();
        tipo.setCategoria("TIPO_VEHICULO");
        tipo.setClave("UTE_DOBLE");
        tipo.setValor("Utilitario doble cabina");
        tipo.setActivo(false);

        when(vehiculos.findByIdAndActivoTrueAndPublicadoTrueAndEstadoIn(7L, List.of(EstadoVehiculo.DISPONIBLE, EstadoVehiculo.RESERVADO)))
                .thenReturn(Optional.of(vehiculo));
        when(parametros.findByCategoriaAndClave("TIPO_VEHICULO", "UTE_DOBLE"))
                .thenReturn(Optional.of(tipo));

        CatalogoService service = new CatalogoService(vehiculos, imagenes, parametros);
        var response = service.obtenerDetalle(7L);

        assertEquals("UTE_DOBLE", response.tipoVehiculo());
        assertEquals("Utilitario doble cabina", response.tipoVehiculoLabel());
        assertEquals(EstadoVehiculo.RESERVADO, response.estado());
    }

}
