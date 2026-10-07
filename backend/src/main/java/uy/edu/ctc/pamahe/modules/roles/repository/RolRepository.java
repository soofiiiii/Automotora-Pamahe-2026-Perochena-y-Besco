package uy.edu.ctc.pamahe.modules.roles.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import uy.edu.ctc.pamahe.modules.roles.model.Rol;

import java.util.List;
import java.util.Optional;

public interface RolRepository extends JpaRepository<Rol, Long> {
    Optional<Rol> findByNombre(String nombre);
    List<Rol> findByActivoTrueOrderByNombreAsc();
}
