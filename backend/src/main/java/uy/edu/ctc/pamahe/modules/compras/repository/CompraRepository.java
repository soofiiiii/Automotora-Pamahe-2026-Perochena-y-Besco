package uy.edu.ctc.pamahe.modules.compras.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import uy.edu.ctc.pamahe.modules.compras.model.Compra;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;

public interface CompraRepository extends JpaRepository<Compra, Long> {
    boolean existsByVehiculo(Vehiculo vehiculo);
    boolean existsByVehiculoAndActivoTrue(Vehiculo vehiculo);
    Optional<Compra> findByVehiculo(Vehiculo vehiculo);
    Optional<Compra> findByVehiculoAndActivoTrue(Vehiculo vehiculo);
    List<Compra> findByActivoTrueOrderByFechaCompraDesc();
    Page<Compra> findByActivoTrueOrderByFechaCompraDesc(Pageable pageable);
    List<Compra> findByActivoTrueAndFechaCompraBetweenOrderByFechaCompraDesc(LocalDate desde, LocalDate hasta);
    List<Compra> findByActivoTrueAndFechaCompraLessThanEqualOrderByFechaCompraDesc(LocalDate hasta);

   
    @Query("""
            select c
            from Compra c
            join fetch c.vehiculo v
            where c.activo = true
              and v.activo = true
              and c.fechaCompra <= :hasta
              and not exists (
                    select venta.id
                    from Venta venta
                    where venta.activo = true
                      and venta.vehiculo = v
                      and venta.fechaVenta <= :hasta
              )
            order by c.fechaCompra desc
            """)
    List<Compra> findStockAlCierre(@Param("hasta") LocalDate hasta);

    @Query("""
        select c
        from Compra c
        where c.activo = true
          and (:desde is null or c.fechaCompra >= :desde)
          and (:hasta is null or c.fechaCompra <= :hasta)
        order by c.fechaCompra desc
        """)
    List<Compra> findByActivoTrueAndPeriodo(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

}
