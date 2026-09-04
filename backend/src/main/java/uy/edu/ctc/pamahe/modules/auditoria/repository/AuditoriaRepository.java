package uy.edu.ctc.pamahe.modules.auditoria.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import uy.edu.ctc.pamahe.modules.auditoria.model.Auditoria;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {
    @Query("""
            select a from Auditoria a
            where (:usuario is null or lower(a.usuario) like lower(concat('%', :usuario, '%')))
              and (:accion is null or upper(a.accion) = upper(:accion))
              and (:entidad is null or upper(a.entidad) = upper(:entidad))
              and (:entidadId is null or a.entidadId = :entidadId)
              and (:desde is null or a.creadoEn >= :desde)
              and (:hastaExclusivo is null or a.creadoEn < :hastaExclusivo)
            order by a.creadoEn desc
            """)
    List<Auditoria> buscar(@Param("usuario") String usuario,
            @Param("accion") String accion,
            @Param("entidad") String entidad,
            @Param("entidadId") Long entidadId,
            @Param("desde") LocalDateTime desde,
            @Param("hastaExclusivo") LocalDateTime hastaExclusivo,
            Pageable pageable);
}
