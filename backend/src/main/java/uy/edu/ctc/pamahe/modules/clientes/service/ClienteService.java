package uy.edu.ctc.pamahe.modules.clientes.service;

import java.util.List;
import uy.edu.ctc.pamahe.modules.clientes.model.TipoCliente;
import java.util.Locale;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.common.response.PageResponse;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.clientes.dto.request.ClienteRequest;
import uy.edu.ctc.pamahe.modules.clientes.dto.response.ClienteResponse;
import uy.edu.ctc.pamahe.modules.clientes.mapper.ClienteMapper;
import uy.edu.ctc.pamahe.modules.clientes.model.Cliente;
import uy.edu.ctc.pamahe.modules.clientes.repository.ClienteRepository;

/**
 * Gestiona la identidad comercial reutilizable en compras y ventas.
 * La desactivación es lógica para conservar la referencia histórica de operaciones anteriores.
 */
@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final AuditoriaService auditoriaService;

    public ClienteService(ClienteRepository clienteRepository, AuditoriaService auditoriaService) {
        this.clienteRepository = clienteRepository;
        this.auditoriaService = auditoriaService;
    }

    public List<ClienteResponse> listar() {
        return this.clienteRepository.findByActivoTrueOrderByNombreAsc().stream()
                .map(ClienteMapper::toResponse)
                .toList();
    }

    @Transactional (readOnly = true)
    public PageResponse<ClienteResponse> listarPaginado(int page, int size) {
        validarPaginacion(page, size);
        return PageResponse.from(
                this.clienteRepository.findByActivoTrueOrderByNombreAsc(PageRequest.of(page, size)),
                ClienteMapper::toResponse);
    }

    public ClienteResponse obtener(Long id) {
        return ClienteMapper.toResponse(this.buscarPorId(id));
    }

    @Transactional(readOnly = true)
    public ClienteResponse buscarActivoPorDocumento(String documento) {
        String normalizado = normalizarDocumento(documento);
        if (normalizado == null) {
            return null;
        }
        return this.clienteRepository.findFirstByDocumentoAndActivoTrueOrderByIdAsc(normalizado)
                .map(ClienteMapper::toResponse)
                .orElse(null);
    }

    @Transactional
    public ClienteResponse crear(ClienteRequest request) {

        Cliente cliente = new Cliente();
        this.cargarDatos(cliente, request);
        Cliente guardado = this.clienteRepository.save(cliente);
        this.auditoriaService.registrar("ALTA", "Cliente", guardado.getId(), "Creación de cliente");
        return ClienteMapper.toResponse(guardado);
    }

    @Transactional
    public ClienteResponse actualizar(Long id, ClienteRequest request) {
        Cliente cliente = this.buscarPorId(id);

        this.cargarDatos(cliente, request);
        Cliente guardado = this.clienteRepository.save(cliente);
        this.auditoriaService.registrar("MODIFICACION", "Cliente", guardado.getId(), "Actualización de cliente");
        return ClienteMapper.toResponse(guardado);
    }

    @Transactional
    public void desactivar(Long id) {
        Cliente cliente = this.buscarPorId(id);
        cliente.setActivo(false);
        this.clienteRepository.save(cliente);
        this.auditoriaService.registrar("BAJA_LOGICA", "Cliente", cliente.getId(), "Desactivación de cliente");
    }

    public Cliente buscarPorId(Long id) {
        return this.clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el cliente solicitado."));
    }

    public Cliente buscarActivoPorId(Long id) {
        Cliente cliente = this.buscarPorId(id);
        if (!Boolean.TRUE.equals(cliente.getActivo())) {
            throw new ResourceNotFoundException("El cliente solicitado no existe o ya no está disponible.");
        }
        return cliente;
    }
  
    private void cargarDatos(
            Cliente cliente,
            ClienteRequest request
    ) {
        cliente.setNombre(
                normalizarTexto(request.nombre())
        );

        cliente.setApellido(
                normalizarTexto(request.apellido())
        );

        cliente.setRazonSocial(
                normalizarTexto(request.razonSocial())
        );

        cliente.setDocumento(
                normalizarDocumento(request.documento())
        );

        cliente.setTelefono(
                normalizarTelefono(request.telefono())
        );

        cliente.setEmail(
                normalizarEmail(request.email())
        );

        cliente.setDireccion(
                normalizarTexto(request.direccion())
        );

        cliente.setTipoCliente(
                request.tipoCliente()
        );
    }

    private String normalizarTexto(String valor) {
        if (valor == null) {
            return null;
        }

        String resultado = valor.trim();

        return resultado.isBlank() ? null : resultado;
    }

    private String normalizarDocumento(String documento) {
        if (documento == null) {
            return null;
        }

        String resultado = documento
                .trim()
                .replaceAll("[^A-Za-z0-9]", "")
                .toUpperCase(Locale.ROOT);

        return resultado.isBlank() ? null : resultado;
    }

    private String normalizarTelefono(String telefono) {
        if (telefono == null) {
            return null;
        }

        String resultado = telefono
                .trim()
                .replaceAll("[\\s()-]", "");

        return resultado.isBlank() ? null : resultado;
    }

    private String normalizarEmail(String email) {
        if (email == null) {
            return null;
        }

        String resultado = email.trim();

        if (resultado.isBlank()) {
            return null;
        }

        return resultado.toLowerCase(Locale.ROOT);
    }

    private void validarPaginacion(int page, int size) {
        if ((long) page * size > Integer.MAX_VALUE) {
            throw new BusinessException("La página solicitada no es válida.");
        }
        if (page < 0) {
            throw new BusinessException("La página solicitada no es válida.");
        }
        if (size < 1 || size > 100) {
            throw new BusinessException("No pudimos mostrar esa página. Actualizá la vista e intentá nuevamente.");
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<ClienteResponse> listarPaginado(int page, int size, String q, TipoCliente tipoCliente) {
        validarPaginacion(page, size);
        String termino = q == null || q.isBlank() ? null : q.trim().toLowerCase(Locale.ROOT);
        if (termino != null && termino.length() > 120) {
            throw new BusinessException("La búsqueda no puede superar los 120 caracteres.");
        }
        String patron = termino == null ? null : "%" + termino.replace("!", "!!")
                .replace("%", "!%").replace("_", "!_") + "%";
        return PageResponse.from(this.clienteRepository.buscarPaginado(patron, tipoCliente,
                PageRequest.of(page, size)), ClienteMapper::toResponse);
    }
}
