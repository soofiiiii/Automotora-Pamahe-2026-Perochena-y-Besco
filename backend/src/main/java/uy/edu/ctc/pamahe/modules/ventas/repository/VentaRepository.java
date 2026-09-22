package uy.edu.ctc.pamahe.modules.ventas.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;
import uy.edu.ctc.pamahe.modules.ventas.model.Venta;

public interface VentaRepository extends JpaRepository<Venta, Long> {
    boolean existsByVehiculo(Vehiculo vehiculo);
    boolean existsByVehiculoAndActivoTrue(Vehiculo vehiculo);
    Optional<Venta> findByVehiculo(Vehiculo vehiculo);
    Optional<Venta> findByVehiculoAndActivoTrue(Vehiculo vehiculo);
    List<Venta> findByActivoTrueOrderByFechaVentaDesc();
    Page<Venta> findByActivoTrueOrderByFechaVentaDesc(Pageable pageable);
    List<Venta> findByActivoTrueAndFechaVentaBetweenOrderByFechaVentaDesc(LocalDate desde, LocalDate hasta);
    List<Venta> findByActivoTrueAndFechaVentaLessThanEqualOrderByFechaVentaDesc(LocalDate hasta);

    @Query("""
        select v
        from Venta v
        where v.activo = true
          and (:desde is null or v.fechaVenta >= :desde)
          and (:hasta is null or v.fechaVenta <= :hasta)
        order by v.fechaVenta desc
        """)
    List<Venta> findByActivoTrueAndPeriodo(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

}