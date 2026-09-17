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

    /**
     * Obtiene las unidades que formaban parte del inventario al cierre indicado:
     * ya habían sido compradas y todavía no tenían una venta activa registrada a esa fecha.
     * La consulta no depende del estado actual del vehículo, evitando eliminar retrospectivamente
     * una unidad de un reporte histórico solo porque fue vendida después del período consultado.
     */
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

}
