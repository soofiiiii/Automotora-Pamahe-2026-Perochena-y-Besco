package uy.edu.ctc.pamahe.modules.parametros.service;

import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.common.util.MonedaUtils;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.parametros.dto.request.ParametroRequest;
import uy.edu.ctc.pamahe.modules.parametros.dto.response.ParametroResponse;
import uy.edu.ctc.pamahe.modules.parametros.model.Parametro;
import uy.edu.ctc.pamahe.modules.parametros.repository.ParametroRepository;

@Service
public class ParametroService {
    private static final Set<String> CATEGORIAS_CONSUMIBLES = Set.of("TIPO_VEHICULO", MonedaUtils.CATEGORIA_MONEDA);
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


    @Transactional(readOnly = true)
    public List<ParametroResponse> listarPorCategoria(String categoria) {
        String categoriaNormalizada = key(categoria);
        if (!CATEGORIAS_CONSUMIBLES.contains(categoriaNormalizada)) {
            throw new BusinessException("La categoría seleccionada no admite valores configurables.");
        }
        return repository.findByCategoriaAndActivoTrueOrderByClaveAsc(categoriaNormalizada).stream()
                .map(this::map)
                .toList();
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
        validarIdentidadParametroProtegido(p, c, k);
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
        if (esCotizacionUsdUyu(p.getCategoria(), p.getClave())) {
            throw new BusinessException("La cotización USD/UYU es obligatoria y no puede desactivarse.");
        }
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
        String valor = r.valor().trim();
        validarValorEspecial(c, k, valor);
        p.setCategoria(c);
        p.setClave(k);
        p.setValor(valor);
        p.setDescripcion(opt(r.descripcion()));
    }

    private void validarIdentidadParametroProtegido(Parametro actual, String categoria, String clave) {
        if (esCotizacionUsdUyu(actual.getCategoria(), actual.getClave())
                && !esCotizacionUsdUyu(categoria, clave)) {
            throw new BusinessException(
                    "La categoría y la clave de la cotización USD/UYU no pueden modificarse.");
        }
    }

    private void validarValorEspecial(String categoria, String clave, String valor) {
        if (esCotizacionUsdUyu(categoria, clave)) {
            MonedaUtils.parsearCotizacionUsdUyu(valor);
        }
    }

    private boolean esCotizacionUsdUyu(String categoria, String clave) {
        return MonedaUtils.CATEGORIA_MONEDA.equals(key(categoria))
                && MonedaUtils.CLAVE_USD_UYU.equals(key(clave));
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
