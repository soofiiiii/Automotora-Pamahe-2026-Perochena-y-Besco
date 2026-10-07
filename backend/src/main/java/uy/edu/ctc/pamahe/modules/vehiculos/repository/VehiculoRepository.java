package uy.edu.ctc.pamahe.modules.vehiculos.repository;

import jakarta.persistence.LockModeType;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;

public interface VehiculoRepository extends JpaRepository<Vehiculo, Long> {

        List<Vehiculo> findByActivoTrueOrderByCreadoEnDesc();

        Page<Vehiculo> findByActivoTrueOrderByCreadoEnDesc(Pageable pageable);

        List<Vehiculo> findByActivoTrueAndPublicadoTrueAndEstadoOrderByCreadoEnDesc(EstadoVehiculo estado);

        @Query("""
                        SELECT v
                        FROM Vehiculo v
                        WHERE v.activo = true
                          AND (:estado IS NULL OR v.estado = :estado)
                          AND (:marca IS NULL OR LOWER(v.marca) LIKE LOWER(CONCAT('%', :marca, '%')))
                          AND (:modelo IS NULL OR LOWER(v.modelo) LIKE LOWER(CONCAT('%', :modelo, '%')))
                          AND (:tipoVehiculo IS NULL OR UPPER(v.tipoVehiculo) = UPPER(:tipoVehiculo))
                          AND (:anioDesde IS NULL OR v.anio >= :anioDesde)
                          AND (:anioHasta IS NULL OR v.anio <= :anioHasta)
                          AND (:precioMin IS NULL OR v.precioVentaEstimado >= :precioMin)
                          AND (:precioMax IS NULL OR v.precioVentaEstimado <= :precioMax)
                          AND (:publicado IS NULL OR v.publicado = :publicado)
                          AND (
                                :disponibleComercial IS NULL
                                OR (:disponibleComercial = true AND v.estado = uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo.DISPONIBLE)
                                OR (:disponibleComercial = false AND v.estado <> uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo.DISPONIBLE)
                          )
                        ORDER BY v.creadoEn DESC, v.id DESC
                        """)
        List<Vehiculo> buscarConFiltros(
                        @Param("estado") EstadoVehiculo estado,
                        @Param("marca") String marca,
                        @Param("modelo") String modelo,
                        @Param("tipoVehiculo") String tipoVehiculo,
                        @Param("anioDesde") Integer anioDesde,
                        @Param("anioHasta") Integer anioHasta,
                        @Param("precioMin") BigDecimal precioMin,
                        @Param("precioMax") BigDecimal precioMax,
                        @Param("publicado") Boolean publicado,
                        @Param("disponibleComercial") Boolean disponibleComercial);

        @Query("""
                        SELECT v
                        FROM Vehiculo v
                        WHERE v.activo = true
                          AND (:estado IS NULL OR v.estado = :estado)
                          AND (:marca IS NULL OR LOWER(v.marca) LIKE LOWER(CONCAT('%', :marca, '%')))
                          AND (:modelo IS NULL OR LOWER(v.modelo) LIKE LOWER(CONCAT('%', :modelo, '%')))
                          AND (:tipoVehiculo IS NULL OR UPPER(v.tipoVehiculo) = UPPER(:tipoVehiculo))
                          AND (:anioDesde IS NULL OR v.anio >= :anioDesde)
                          AND (:anioHasta IS NULL OR v.anio <= :anioHasta)
                          AND (:precioMin IS NULL OR v.precioVentaEstimado >= :precioMin)
                          AND (:precioMax IS NULL OR v.precioVentaEstimado <= :precioMax)
                          AND (:publicado IS NULL OR v.publicado = :publicado)
                          AND (
                                :disponibleComercial IS NULL
                                OR (:disponibleComercial = true AND v.estado = uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo.DISPONIBLE)
                                OR (:disponibleComercial = false AND v.estado <> uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo.DISPONIBLE)
                          )
                        ORDER BY v.creadoEn DESC, v.id DESC
                        """)
        Page<Vehiculo> buscarConFiltrosPaginado(
                        @Param("estado") EstadoVehiculo estado,
                        @Param("marca") String marca,
                        @Param("modelo") String modelo,
                        @Param("tipoVehiculo") String tipoVehiculo,
                        @Param("anioDesde") Integer anioDesde,
                        @Param("anioHasta") Integer anioHasta,
                        @Param("precioMin") BigDecimal precioMin,
                        @Param("precioMax") BigDecimal precioMax,
                        @Param("publicado") Boolean publicado,
                        @Param("disponibleComercial") Boolean disponibleComercial,
                        Pageable pageable);

        @Query("""
                        SELECT v
                        FROM Vehiculo v
                        WHERE v.activo = true
                          AND v.publicado = true
                          AND v.estado IN :estados
                          AND (:marca IS NULL OR LOWER(v.marca) LIKE LOWER(CONCAT('%', :marca, '%')))
                          AND (:modelo IS NULL OR LOWER(v.modelo) LIKE LOWER(CONCAT('%', :modelo, '%')))
                          AND (:tipoVehiculo IS NULL OR UPPER(v.tipoVehiculo) = UPPER(:tipoVehiculo))
                          AND (:anioDesde IS NULL OR v.anio >= :anioDesde)
                          AND (:anioHasta IS NULL OR v.anio <= :anioHasta)
                          AND (:precioMin IS NULL OR v.precioVentaUsd >= :precioMin)
                          AND (:precioMax IS NULL OR v.precioVentaUsd <= :precioMax)
                        ORDER BY v.creadoEn DESC, v.id DESC
                        """)
        List<Vehiculo> buscarCatalogo(
                        @Param("estados") Collection<EstadoVehiculo> estados,
                        @Param("marca") String marca,
                        @Param("modelo") String modelo,
                        @Param("tipoVehiculo") String tipoVehiculo,
                        @Param("anioDesde") Integer anioDesde,
                        @Param("anioHasta") Integer anioHasta,
                        @Param("precioMin") BigDecimal precioMin,
                        @Param("precioMax") BigDecimal precioMax);

        @Query("""
                        SELECT v
                        FROM Vehiculo v
                        WHERE v.activo = true
                          AND v.publicado = true
                          AND v.estado IN :estados
                          AND (:marca IS NULL OR LOWER(v.marca) LIKE LOWER(CONCAT('%', :marca, '%')))
                          AND (:modelo IS NULL OR LOWER(v.modelo) LIKE LOWER(CONCAT('%', :modelo, '%')))
                          AND (:tipoVehiculo IS NULL OR UPPER(v.tipoVehiculo) = UPPER(:tipoVehiculo))
                          AND (:anioDesde IS NULL OR v.anio >= :anioDesde)
                          AND (:anioHasta IS NULL OR v.anio <= :anioHasta)
                          AND (:precioMin IS NULL OR v.precioVentaUsd >= :precioMin)
                          AND (:precioMax IS NULL OR v.precioVentaUsd <= :precioMax)
                        ORDER BY v.creadoEn DESC, v.id DESC
                        """)
        Page<Vehiculo> buscarCatalogoPaginado(
                        @Param("estados") Collection<EstadoVehiculo> estados,
                        @Param("marca") String marca,
                        @Param("modelo") String modelo,
                        @Param("tipoVehiculo") String tipoVehiculo,
                        @Param("anioDesde") Integer anioDesde,
                        @Param("anioHasta") Integer anioHasta,
                        @Param("precioMin") BigDecimal precioMin,
                        @Param("precioMax") BigDecimal precioMax,
                        Pageable pageable);

        Optional<Vehiculo> findByIdAndActivoTrueAndPublicadoTrueAndEstadoIn(Long id, Collection<EstadoVehiculo> estados);

        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("select v from Vehiculo v where v.id = :id")
        Optional<Vehiculo> findByIdForUpdate(@Param("id") Long id);
}