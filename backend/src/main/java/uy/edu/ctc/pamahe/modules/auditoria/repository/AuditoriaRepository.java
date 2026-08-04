package uy.edu.ctc.pamahe.modules.auditoria.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uy.edu.ctc.pamahe.modules.auditoria.model.Auditoria;

import java.util.List;

public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {
    List<Auditoria> findTop200ByOrderByCreadoEnDesc();
}
