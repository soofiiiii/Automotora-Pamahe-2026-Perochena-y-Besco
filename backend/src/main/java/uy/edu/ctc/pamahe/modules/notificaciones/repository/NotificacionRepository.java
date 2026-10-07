package uy.edu.ctc.pamahe.modules.notificaciones.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import uy.edu.ctc.pamahe.modules.notificaciones.model.Notificacion;
import uy.edu.ctc.pamahe.modules.notificaciones.model.TipoNotificacion;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.vehiculos.model.Vehiculo;
import uy.edu.ctc.pamahe.modules.ventas.model.Venta;

public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {
    List<Notificacion> findByUsuarioAndActivoTrueAndLeidaFalseOrderByCreadoEnDesc(Usuario usuario);

    Optional<Notificacion> findByIdAndUsuarioAndActivoTrue(Long id, Usuario usuario);

    boolean existsByUsuarioAndVehiculoAndTipoAndActivoTrue(
            Usuario usuario,
            Vehiculo vehiculo,
            TipoNotificacion tipo);

    List<Notificacion> findByVehiculoAndTipoAndActivoTrue(
            Vehiculo vehiculo,
            TipoNotificacion tipo);

    boolean existsByUsuarioAndVentaAndTipoAndActivoTrue(
            Usuario usuario,
            Venta venta,
            TipoNotificacion tipo);

    List<Notificacion> findByVentaAndTipoAndActivoTrue(
            Venta venta,
            TipoNotificacion tipo);
}
