package uy.edu.ctc.pamahe.modules.usuarios.service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.roles.model.Rol;
import uy.edu.ctc.pamahe.modules.roles.repository.RolRepository;
import uy.edu.ctc.pamahe.modules.usuarios.dto.request.UsuarioRequest;
import uy.edu.ctc.pamahe.modules.usuarios.dto.request.UsuarioUpdateRequest;
import uy.edu.ctc.pamahe.modules.usuarios.dto.response.UsuarioResponse;
import uy.edu.ctc.pamahe.modules.usuarios.mapper.UsuarioMapper;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.usuarios.repository.UsuarioRepository;

/**
 * Administra cuentas internas y sus roles sin exponer ni almacenar contraseñas en texto plano.
 * La baja lógica permite conservar responsables de compras, ventas, refacciones y auditorías históricas.
 */
@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditoriaService auditoriaService;

    public UsuarioService(UsuarioRepository usuarioRepository,
                          RolRepository rolRepository,
                          PasswordEncoder passwordEncoder,
                          AuditoriaService auditoriaService) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditoriaService = auditoriaService;
    }

    public List<UsuarioResponse> listar() {
        return this.usuarioRepository.findByActivoTrueOrderByNombreAsc().stream()
                .map(UsuarioMapper::toResponse)
                .toList();
    }

    public UsuarioResponse obtener(Long id) {
        return UsuarioMapper.toResponse(this.buscarPorId(id));
    }

    @Transactional
    public UsuarioResponse crear(UsuarioRequest request) {
        if (this.usuarioRepository.existsByUsername(request.username())) {
            throw new BusinessException("Ya existe un usuario con ese nombre de usuario.");
        }
        if (this.usuarioRepository.existsByEmail(request.email())) {
            throw new BusinessException("Ya existe un usuario con ese correo electrónico.");
        }

        Usuario usuario = new Usuario();
        usuario.setUsername(request.username().trim().toLowerCase());
        // Solo se persiste el hash; la contraseña original no debe recuperarse ni registrarse.
        usuario.setPasswordHash(this.passwordEncoder.encode(request.password()));
        usuario.setNombre(request.nombre().trim());
        usuario.setEmail(request.email().trim().toLowerCase());
        usuario.setTelefono(request.telefono());
        usuario.setRoles(this.obtenerRoles(request.roles()));

        Usuario guardado = this.usuarioRepository.save(usuario);
        this.auditoriaService.registrar("ALTA", "Usuario", guardado.getId(), "Creación de usuario interno");
        return UsuarioMapper.toResponse(guardado);
    }

    @Transactional
    public UsuarioResponse actualizar(Long id, UsuarioUpdateRequest request) {
        Usuario usuario = this.buscarPorId(id);
        usuario.setNombre(request.nombre().trim());
        usuario.setEmail(request.email().trim().toLowerCase());
        usuario.setTelefono(request.telefono());
        usuario.setRoles(this.obtenerRoles(request.roles()));
        usuario.setActivo(request.activo() == null || request.activo());

        Usuario guardado = this.usuarioRepository.save(usuario);
        this.auditoriaService.registrar("MODIFICACION", "Usuario", guardado.getId(), "Actualización de usuario interno");
        return UsuarioMapper.toResponse(guardado);
    }

    @Transactional
    public void desactivar(Long id) {
        Usuario usuario = this.buscarPorId(id);
        usuario.setActivo(false);
        this.usuarioRepository.save(usuario);
        this.auditoriaService.registrar("BAJA_LOGICA", "Usuario", usuario.getId(), "Desactivación de usuario interno");
    }

    private Usuario buscarPorId(Long id) {
        return this.usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el usuario solicitado."));
    }

    private Set<Rol> obtenerRoles(Set<String> nombresRoles) {
        return nombresRoles.stream()
                .map(nombre -> nombre.trim().toUpperCase())
                .map(nombre -> this.rolRepository.findByNombre(nombre)
                        .orElseThrow(() -> new BusinessException("El rol " + nombre + " no existe.")))
                .collect(Collectors.toSet());
    }
}

