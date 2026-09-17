package uy.edu.ctc.pamahe.modules.auditoria.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.response.PageResponse;
import uy.edu.ctc.pamahe.common.util.SecurityUtils;
import uy.edu.ctc.pamahe.modules.auditoria.model.Auditoria;
import uy.edu.ctc.pamahe.modules.auditoria.repository.AuditoriaRepository;
import uy.edu.ctc.pamahe.modules.auditoria.dto.response.AuditoriaResponse;

/**
 * Registra cambios relevantes dentro de la misma transacción que la operación
 * auditada.
 * Propagation.MANDATORY evita auditorías aisladas: si el negocio revierte, su
 * evidencia también.
 */
@Service
public class AuditoriaService {

    private final AuditoriaRepository auditoriaRepository;

    public AuditoriaService(AuditoriaRepository auditoriaRepository) {
        this.auditoriaRepository = auditoriaRepository;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void registrar(String accion, String entidad, Long entidadId, String detalle) {
        this.registrar(accion, entidad, entidadId, detalle, null, null);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void registrar(String accion, String entidad, Long entidadId, String detalle,
            String valoresAnteriores, String valoresNuevos) {
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
    public List<AuditoriaResponse> listar(String usuario, String accion, String entidad, Long entidadId,
            LocalDate desde, LocalDate hasta) {
        if (desde != null && hasta != null && desde.isAfter(hasta)) {
            throw new BusinessException("La fecha desde no puede ser posterior a la fecha hasta.");
        }
        LocalDateTime desdeHora = desde == null ? null : desde.atStartOfDay();
        LocalDateTime hastaExclusivo = hasta == null ? null : hasta.plusDays(1).atStartOfDay();
        return this.auditoriaRepository.buscar(
                normalizar(usuario), normalizar(accion), normalizar(entidad), entidadId,
                desdeHora, hastaExclusivo, PageRequest.of(0, 200))
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditoriaResponse> listarPaginado(
            String usuario, String accion, String entidad, Long entidadId,
            LocalDate desde, LocalDate hasta, int page, int size) {
        validarFechas(desde, hasta);
        validarPaginacion(page, size);
        LocalDateTime desdeHora = desde == null ? null : desde.atStartOfDay();
        LocalDateTime hastaExclusivo = hasta == null ? null : hasta.plusDays(1).atStartOfDay();
        return PageResponse.from(
                this.auditoriaRepository.buscarPaginado(
                        normalizar(usuario), normalizar(accion), normalizar(entidad), entidadId,
                        desdeHora, hastaExclusivo, PageRequest.of(page, size)),
                this::toResponse);
    }

    private String normalizar(String value) {
        if (value == null)
            return null;
        String v = value.trim();
        return v.isEmpty() ? null : v;
    }

    private AuditoriaResponse toResponse(Auditoria a) {
        return new AuditoriaResponse(a.getId(), a.getUsuario(), a.getAccion(), a.getEntidad(), a.getEntidadId(),
                a.getDetalle(), a.getValoresAnteriores(), a.getValoresNuevos(), a.getCreadoEn());
    }

    private void validarFechas(LocalDate desde, LocalDate hasta) {
        if (desde != null && hasta != null && desde.isAfter(hasta)) {
            throw new BusinessException("La fecha desde no puede ser posterior a la fecha hasta.");
        }
    }

    private void validarPaginacion(int page, int size) {
        if (page < 0) {
            throw new BusinessException("La página no puede ser negativa.");
        }
        if (size < 1 || size > 200) {
            throw new BusinessException("El tamaño de página debe estar entre 1 y 200.");
        }
    }
}
