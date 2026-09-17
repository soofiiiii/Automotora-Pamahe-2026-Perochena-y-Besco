package uy.edu.ctc.pamahe.modules.clientes.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;

import uy.edu.ctc.pamahe.modules.clientes.model.Cliente;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    boolean existsByDocumento(String documento);
    boolean existsByDocumentoAndIdNot(String documento, Long id);
    List<Cliente> findByActivoTrueOrderByNombreAsc();
    Page<Cliente> findByActivoTrueOrderByNombreAsc(Pageable pageable);
}

