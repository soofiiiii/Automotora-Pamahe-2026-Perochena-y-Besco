package uy.edu.ctc.pamahe.modules.clientes.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import uy.edu.ctc.pamahe.modules.clientes.model.Cliente;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    boolean existsByDocumento(String documento);
    List<Cliente> findByActivoTrueOrderByNombreAsc();
}

