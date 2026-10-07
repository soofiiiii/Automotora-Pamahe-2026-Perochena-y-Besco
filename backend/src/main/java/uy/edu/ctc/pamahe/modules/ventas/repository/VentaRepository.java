package uy.edu.ctc.pamahe.modules.ventas.repository;

import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;
import uy.edu.ctc.pamahe.modules.ventas.model.EstadoComprobanteVenta;
import uy.edu.ctc.pamahe.modules.ventas.model.Venta;

public interface VentaRepository extends JpaRepository<Venta, Long> {
    boolean existsByVehiculo(Vehiculo vehiculo);
    boolean existsByVehiculoAndActivoTrue(Vehiculo vehiculo);
    Optional<Venta> findByVehiculo(Vehiculo vehiculo);
    Optional<Venta> findByVehiculoAndActivoTrue(Vehiculo vehiculo);
    List<Venta> findByActivoTrueOrderByFechaVentaDesc();
    @EntityGraph(attributePaths = {"vehiculo", "clienteComprador", "vendedor"})
    @Query("select e from Venta e where e.activo = true order by e.fechaVenta desc, e.id desc")
    Page<Venta> findByActivoTrueOrderByFechaVentaDesc(Pageable pageable);
    List<Venta> findByActivoTrueAndFechaVentaBetweenOrderByFechaVentaDesc(LocalDate desde, LocalDate hasta);
    List<Venta> findByActivoTrueAndFechaVentaLessThanEqualOrderByFechaVentaDesc(LocalDate hasta);
    @EntityGraph(attributePaths = {"vehiculo", "clienteComprador", "vendedor"})
    List<Venta> findByActivoTrueAndSeguimientoPostventaRealizadoFalseAndFechaVentaLessThanEqualOrderByFechaVentaAsc(
            LocalDate fechaLimite);

    @EntityGraph(attributePaths = {"vehiculo", "clienteComprador", "vendedor"})
    @Query("""
        select e from Venta e where e.activo = true
          and (:desde is null or e.fechaVenta >= :desde)
          and (:hasta is null or e.fechaVenta <= :hasta)
          and (:clienteId is null or e.clienteComprador.id = :clienteId)
          and (:vehiculoId is null or e.vehiculo.id = :vehiculoId)
        order by e.fechaVenta desc, e.id desc
        """)
    Page<Venta> buscarPaginado(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta,
            @Param("clienteId") Long clienteId, @Param("vehiculoId") Long vehiculoId, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"vehiculo", "clienteComprador", "vendedor"})
    @Query("select v from Venta v where v.id = :id")
    Optional<Venta> findByIdForComprobanteUpdate(@Param("id") Long id);

    @Query("""
        select v.id from Venta v
        where v.activo = true
          and v.comprobantePath is null
          and v.estadoComprobante in :estados
          and v.intentosComprobante < :maxIntentos
          and (v.proximoIntentoComprobante is null or v.proximoIntentoComprobante <= :ahora)
        order by v.creadoEn asc, v.id asc
        """)
    List<Long> findIdsComprobantesReintentables(
            @Param("estados") List<EstadoComprobanteVenta> estados,
            @Param("maxIntentos") int maxIntentos,
            @Param("ahora") LocalDateTime ahora,
            Pageable pageable);

    @EntityGraph(attributePaths = {"vehiculo", "clienteComprador", "vendedor"})
    List<Venta> findByActivoTrueAndProximoMantenimientoIsNotNullAndProximoMantenimientoLessThanEqualOrderByProximoMantenimientoAsc(
            LocalDate fechaLimite);
}
