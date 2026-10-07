package uy.edu.ctc.pamahe.modules.auditoria.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import uy.edu.ctc.pamahe.modules.auditoria.model.Auditoria;

import java.time.LocalDateTime;
import java.util.Collection;
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
                        order by a.creadoEn desc, a.id desc
                        """)
        List<Auditoria> buscar(@Param("usuario") String usuario,
                        @Param("accion") String accion,
                        @Param("entidad") String entidad,
                        @Param("entidadId") Long entidadId,
                        @Param("desde") LocalDateTime desde,
                        @Param("hastaExclusivo") LocalDateTime hastaExclusivo,
                        Pageable pageable);

        @Query("""
                        select a from Auditoria a
                        where (:usuario is null or lower(a.usuario) like lower(concat('%', :usuario, '%')))
                          and (:accion is null or upper(a.accion) = upper(:accion))
                          and (:entidad is null or upper(a.entidad) = upper(:entidad))
                          and (:entidadId is null or a.entidadId = :entidadId)
                          and (:desde is null or a.creadoEn >= :desde)
                          and (:hastaExclusivo is null or a.creadoEn < :hastaExclusivo)
                        """)
        Page<Auditoria> buscarPaginado(
                        @Param("usuario") String usuario,
                        @Param("accion") String accion,
                        @Param("entidad") String entidad,
                        @Param("entidadId") Long entidadId,
                        @Param("desde") LocalDateTime desde,
                        @Param("hastaExclusivo") LocalDateTime hastaExclusivo,
                        Pageable pageable);


        @Query("""
                        select a from Auditoria a
                        where a.activo = true
                          and upper(a.entidad) = 'VEHICULO'
                          and a.entidadId = :vehiculoId
                          and upper(a.accion) in ('CAMBIO_ESTADO', 'CAMBIO_PUBLICACION')
                        order by a.creadoEn asc, a.id asc
                        """)
        List<Auditoria> buscarEventosVehiculo(@Param("vehiculoId") Long vehiculoId);

      /** Recupera en orden cronológico los cambios auditados de los vehículos indicados
       * hasta el cierre solicitado. Se utiliza para reconstruir estado y publicación
       * históricos sin depender del valor actual persistido en la entidad Vehiculo.
       */
      @Query("""
                        select a from Auditoria a
                        where a.activo = true
                          and upper(a.entidad) = 'VEHICULO'
                          and a.entidadId in :vehiculoIds
                          and a.creadoEn < :hastaExclusivo
                        order by a.entidadId asc, a.creadoEn asc, a.id asc
                        """)
        List<Auditoria> buscarHistorialVehiculosHasta(
                        @Param("vehiculoIds") Collection<Long> vehiculoIds,
                        @Param("hastaExclusivo") LocalDateTime hastaExclusivo);
}
