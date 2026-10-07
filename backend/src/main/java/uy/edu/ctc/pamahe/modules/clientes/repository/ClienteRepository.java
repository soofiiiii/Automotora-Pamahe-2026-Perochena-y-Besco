package uy.edu.ctc.pamahe.modules.clientes.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uy.edu.ctc.pamahe.modules.clientes.model.TipoCliente;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;

import uy.edu.ctc.pamahe.modules.clientes.model.Cliente;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    List<Cliente> findByActivoTrueOrderByNombreAsc();
    Optional<Cliente> findFirstByDocumentoAndActivoTrueOrderByIdAsc(String documento);
    @Query("select c from Cliente c where c.activo = true order by c.nombre asc, c.id asc")
    Page<Cliente> findByActivoTrueOrderByNombreAsc(Pageable pageable);

    @Query("""
        select c from Cliente c where c.activo = true
          and (:tipo is null or c.tipoCliente = :tipo)
          and (:q is null or lower(c.nombre) like :q escape '!'
               or lower(coalesce(c.apellido, '')) like :q escape '!'
               or lower(c.documento) like :q escape '!')
        order by c.nombre asc, c.id asc
        """)
    Page<Cliente> buscarPaginado(@Param("q") String q, @Param("tipo") TipoCliente tipo, Pageable pageable);
}

