package uy.edu.ctc.pamahe.modules.clientes.service;

import java.util.List;

import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
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

    public ClienteResponse obtener(Long id) {
        return ClienteMapper.toResponse(this.buscarPorId(id));
    }

    @Transactional
    public ClienteResponse crear(ClienteRequest request) {
        if (this.clienteRepository.existsByDocumento(request.documento())) {
            throw new BusinessException("Ya existe un cliente con ese documento.");
        }
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
            throw new ResourceNotFoundException("No se encontró un cliente activo con el identificador solicitado.");
        }
        return cliente;
    }
    
    private void cargarDatos(Cliente cliente, ClienteRequest request) {
        cliente.setNombre(request.nombre().trim());
        cliente.setApellido(request.apellido());
        cliente.setRazonSocial(request.razonSocial());
        cliente.setDocumento(request.documento().trim());
        cliente.setTelefono(request.telefono());
        cliente.setEmail(request.email());
        cliente.setDireccion(request.direccion());
        cliente.setTipoCliente(request.tipoCliente());
    }

}
