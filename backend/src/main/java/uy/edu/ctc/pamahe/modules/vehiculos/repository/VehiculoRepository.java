package uy.edu.ctc.pamahe.modules.vehiculos.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import uy.edu.ctc.pamahe.modules.vehiculos.model.EstadoVehiculo;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;

public interface VehiculoRepository extends JpaRepository<Vehiculo, Long> {

    List<Vehiculo> findByActivoTrueOrderByCreadoEnDesc();

    List<Vehiculo> findByActivoTrueAndPublicadoTrueAndEstadoOrderByCreadoEnDesc(
            EstadoVehiculo estado
    );

    /**
     * Consulta el inventario interno aplicando filtros opcionales.
     *
     * Si un parámetro es null, ese filtro no se aplica.
     */
    @Query("""
            SELECT v
            FROM Vehiculo v
            WHERE v.activo = true
              AND (:estado IS NULL OR v.estado = :estado)
              AND (
                    :marca IS NULL
                    OR LOWER(v.marca) LIKE LOWER(CONCAT('%', :marca, '%'))
              )
              AND (
                    :modelo IS NULL
                    OR LOWER(v.modelo) LIKE LOWER(CONCAT('%', :modelo, '%'))
              )
              AND (:anioDesde IS NULL OR v.anio >= :anioDesde)
              AND (:anioHasta IS NULL OR v.anio <= :anioHasta)
              AND (:publicado IS NULL OR v.publicado = :publicado)
            ORDER BY v.creadoEn DESC
            """)
    List<Vehiculo> buscarConFiltros(
            @Param("estado") EstadoVehiculo estado,
            @Param("marca") String marca,
            @Param("modelo") String modelo,
            @Param("anioDesde") Integer anioDesde,
            @Param("anioHasta") Integer anioHasta,
            @Param("publicado") Boolean publicado
    );

    @Query("""
            SELECT v
            FROM Vehiculo v
            WHERE v.activo = true
              AND v.publicado = true
              AND v.estado = :estado
              AND (
                    :marca IS NULL
                    OR LOWER(v.marca) LIKE LOWER(CONCAT('%', :marca, '%'))
              )
              AND (
                    :modelo IS NULL
                    OR LOWER(v.modelo) LIKE LOWER(CONCAT('%', :modelo, '%'))
              )
              AND (:anioDesde IS NULL OR v.anio >= :anioDesde)
              AND (:anioHasta IS NULL OR v.anio <= :anioHasta)
              AND (:precioMin IS NULL OR v.precioVentaEstimado >= :precioMin)
              AND (:precioMax IS NULL OR v.precioVentaEstimado <= :precioMax)
            ORDER BY v.creadoEn DESC
            """)
    List<Vehiculo> buscarCatalogo(
            @Param("estado") EstadoVehiculo estado,
            @Param("marca") String marca,
            @Param("modelo") String modelo,
            @Param("anioDesde") Integer anioDesde,
            @Param("anioHasta") Integer anioHasta,
            @Param("precioMin") BigDecimal precioMin,
            @Param("precioMax") BigDecimal precioMax
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from Vehiculo v where v.id = :id")
    Optional<Vehiculo> findByIdForUpdate(@Param("id") Long id);
}