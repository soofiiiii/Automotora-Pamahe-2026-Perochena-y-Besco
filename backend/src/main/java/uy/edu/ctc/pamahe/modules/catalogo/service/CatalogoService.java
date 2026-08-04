package uy.edu.ctc.pamahe.modules.catalogo.service;

import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;
import uy.edu.ctc.pamahe.modules.catalogo.dto.response.CatalogoVehiculoResponse;
import uy.edu.ctc.pamahe.modules.imagenes.model.ImagenVehiculo;
import uy.edu.ctc.pamahe.modules.imagenes.repository.ImagenVehiculoRepository;
import uy.edu.ctc.pamahe.modules.parametros.repository.ParametroRepository;
import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.repository.VehiculoRepository;

/**
 * Construye una proyección pública deliberadamente reducida del inventario.
 * La respuesta se arma desde campos comerciales e imágenes públicas para que costos, observaciones
 * internas, clientes y datos de auditoría nunca formen parte del contrato del catálogo.
 */
@Service
public class CatalogoService {

    private final VehiculoRepository vehiculoRepository;
    private final ImagenVehiculoRepository imagenVehiculoRepository;
    private final ParametroRepository parametroRepository;

    public CatalogoService(VehiculoRepository vehiculoRepository, ImagenVehiculoRepository imagenVehiculoRepository,
            ParametroRepository parametroRepository) {
        this.vehiculoRepository = vehiculoRepository;
        this.imagenVehiculoRepository = imagenVehiculoRepository;
        this.parametroRepository = parametroRepository;
    }

    @Transactional(readOnly = true)
    public List<CatalogoVehiculoResponse> listarDisponibles(String marca, String modelo, Integer anioDesde,
            Integer anioHasta) {
        // Publicado y DISPONIBLE se exigen en servidor aunque el frontend también controle el estado.
        return this.vehiculoRepository
                .findByActivoTrueAndPublicadoTrueAndEstadoOrderByCreadoEnDesc(EstadoVehiculo.DISPONIBLE)
                .stream()
                .filter(v -> marca == null || v.getMarca().toLowerCase().contains(marca.toLowerCase()))
                .filter(v -> modelo == null || v.getModelo().toLowerCase().contains(modelo.toLowerCase()))
                .filter(v -> anioDesde == null || v.getAnio() >= anioDesde)
                .filter(v -> anioHasta == null || v.getAnio() <= anioHasta)
                .map(this::toPublicResponse)
                .toList();
    }

     CatalogoVehiculoResponse toPublicResponse(Vehiculo vehiculo) {
        List<String> imagenes = this.imagenVehiculoRepository
                .findByVehiculoAndActivoTrueAndPublicaTrueOrderByPrincipalDescIdAsc(vehiculo)
                .stream()
                .map(ImagenVehiculo::getUrlPublica)
                .filter(Objects::nonNull)
                .toList();

        String whatsapp = this.parametroRepository.findByCategoriaAndClaveAndActivoTrue("CONTACTO", "WHATSAPP")
                .map(p -> p.getValor())
                .orElse(null);
        String telefono = this.parametroRepository.findByCategoriaAndClaveAndActivoTrue("CONTACTO", "TELEFONO")
                .map(p -> p.getValor())
                .orElse(null);

        return new CatalogoVehiculoResponse(
                vehiculo.getId(),
                vehiculo.getMarca(),
                vehiculo.getModelo(),
                vehiculo.getAnio(),
                vehiculo.getColor(),
                vehiculo.getKilometraje(),
                vehiculo.getPrecioVentaEstimado(),
                vehiculo.getDescripcionPublica(),
                imagenes,
                whatsapp,
                telefono
        );
    }
}
