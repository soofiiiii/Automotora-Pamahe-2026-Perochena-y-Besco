package uy.edu.ctc.pamahe.modules.usuarios.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.query.Param;

import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    @EntityGraph(attributePaths = "roles")
    Optional<Usuario> findByUsername(String username);
    @EntityGraph(attributePaths = "roles")
    Optional<Usuario> findByUsernameAndActivoTrue(String username);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByEmailAndIdNot(String email, Long id);
    List<Usuario> findByActivoTrueOrderByNombreAsc();

    @Query("""
            select distinct u
            from Usuario u join u.roles r
            where u.activo = true and r.nombre in :roles
            order by u.nombre asc
            """)
    List<Usuario> buscarActivosPorRoles(@Param("roles") Collection<String> roles);

    @Query("""
            select count(distinct u)
            from Usuario u join u.roles r
            where u.activo = true and r.nombre = 'ADMINISTRADOR'
            """)
    long contarAdministradoresActivos();
}

