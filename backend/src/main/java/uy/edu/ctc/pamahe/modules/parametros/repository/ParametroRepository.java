package uy.edu.ctc.pamahe.modules.parametros.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import uy.edu.ctc.pamahe.modules.parametros.model.Parametro;

public interface ParametroRepository extends JpaRepository<Parametro, Long> {
    List<Parametro> findByActivoTrueOrderByCategoriaAscClaveAsc();
    Optional<Parametro> findByCategoriaAndClaveAndActivoTrue(String categoria, String clave);
    boolean existsByCategoriaAndClave(String categoria, String clave);
    boolean existsByCategoriaAndClaveAndIdNot(String categoria, String clave, Long id);
}

