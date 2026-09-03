package uy.edu.ctc.pamahe.modules.auditoria.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import uy.edu.ctc.pamahe.common.util.SecurityUtils;
import uy.edu.ctc.pamahe.modules.auditoria.model.Auditoria;
import uy.edu.ctc.pamahe.modules.auditoria.repository.AuditoriaRepository;
import uy.edu.ctc.pamahe.modules.auth.dto.response.AuditoriaResponse;

/**
 * Registra cambios relevantes dentro de la misma transacción que la operación auditada.
 * Propagation.MANDATORY evita auditorías aisladas: si el negocio revierte, su evidencia también.
 */
@Service
public class AuditoriaService {

    private final AuditoriaRepository auditoriaRepository;

    public AuditoriaService(AuditoriaRepository auditoriaRepository) {
        this.auditoriaRepository = auditoriaRepository;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void registrar(
            String accion,
            String entidad,
            Long entidadId,
            String detalle
    ) {
        this.registrar(
                accion,
                entidad,
                entidadId,
                detalle,
                null,
                null
        );
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void registrar(
            String accion,
            String entidad,
            Long entidadId,
            String detalle,
            String valoresAnteriores,
            String valoresNuevos
    ) {
        Auditoria auditoria = new Auditoria();

        auditoria.setUsuario(SecurityUtils.usuarioActual());
        auditoria.setAccion(accion);
        auditoria.setEntidad(entidad);
        auditoria.setEntidadId(entidadId);
        auditoria.setDetalle(detalle);
        auditoria.setValoresAnteriores(valoresAnteriores);
        auditoria.setValoresNuevos(valoresNuevos);

        this.auditoriaRepository.save(auditoria);
    }

    @Transactional(readOnly = true)
    public List<AuditoriaResponse> listarUltimas() {

        // El límite mantiene la consulta útil para revisión operativa
        // sin convertirla en una exportación masiva.
        return this.auditoriaRepository
                .findTop200ByOrderByCreadoEnDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private AuditoriaResponse toResponse(Auditoria auditoria) {
        return new AuditoriaResponse(
                auditoria.getId(),
                auditoria.getUsuario(),
                auditoria.getAccion(),
                auditoria.getEntidad(),
                auditoria.getEntidadId(),
                auditoria.getDetalle(),
                auditoria.getValoresAnteriores(),
                auditoria.getValoresNuevos(),
                auditoria.getActivo()
        );
    }
}