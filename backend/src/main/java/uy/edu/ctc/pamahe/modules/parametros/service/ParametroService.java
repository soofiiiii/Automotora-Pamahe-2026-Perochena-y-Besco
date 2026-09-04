package uy.edu.ctc.pamahe.modules.parametros.service;

import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.parametros.dto.request.ParametroRequest;
import uy.edu.ctc.pamahe.modules.parametros.dto.response.ParametroResponse;
import uy.edu.ctc.pamahe.modules.parametros.model.Parametro;
import uy.edu.ctc.pamahe.modules.parametros.repository.ParametroRepository;

@Service
public class ParametroService {
    private final ParametroRepository repository;
    private final AuditoriaService auditoriaService;

    public ParametroService(ParametroRepository repository, AuditoriaService auditoriaService) {
        this.repository = repository;
        this.auditoriaService = auditoriaService;
    }

    @Transactional(readOnly = true)
    public List<ParametroResponse> listar() {
        return repository.findByActivoTrueOrderByCategoriaAscClaveAsc().stream().map(this::map).toList();
    }

    @Transactional
    public ParametroResponse crear(ParametroRequest r) {
        String c = key(r.categoria());
        String k = key(r.clave());
        if (repository.existsByCategoriaAndClave(c, k))
            throw new BusinessException("Ya existe un parámetro con esa categoría y clave.");
        Parametro p = new Parametro();
        cargar(p, r, c, k);
        p = repository.save(p);
        auditoriaService.registrar("ALTA", "Parametro", p.getId(), "Creación de parámetro " + c + "/" + k);
        return map(p);
    }

    @Transactional
    public ParametroResponse actualizar(Long id, ParametroRequest r) {
        Parametro p = buscar(id);
        String c = key(r.categoria());
        String k = key(r.clave());
        if (repository.existsByCategoriaAndClaveAndIdNot(c, k, id))
            throw new BusinessException("Ya existe otro parámetro con esa categoría y clave.");
        cargar(p, r, c, k);
        p.setActivo(true);
        p = repository.save(p);
        auditoriaService.registrar("MODIFICACION", "Parametro", p.getId(), "Actualización de parámetro " + c + "/" + k);
        return map(p);
    }

    @Transactional
    public void desactivar(Long id) {
        Parametro p = buscar(id);
        p.setActivo(false);
        repository.save(p);
        auditoriaService.registrar("BAJA_LOGICA", "Parametro", p.getId(),
                "Desactivación de parámetro " + p.getCategoria() + "/" + p.getClave());
    }

    private Parametro buscar(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el parámetro solicitado."));
    }

    private void cargar(Parametro p, ParametroRequest r, String c, String k) {
        p.setCategoria(c);
        p.setClave(k);
        p.setValor(r.valor().trim());
        p.setDescripcion(opt(r.descripcion()));
    }

    private String key(String v) {
        return v.trim().toUpperCase(Locale.ROOT);
    }

    private String opt(String v) {
        if (v == null)
            return null;
        String x = v.trim();
        return x.isEmpty() ? null : x;
    }

    private ParametroResponse map(Parametro p) {
        return new ParametroResponse(p.getId(), p.getCategoria(), p.getClave(), p.getValor(), p.getDescripcion(),
                p.getActivo());
    }
    
}
