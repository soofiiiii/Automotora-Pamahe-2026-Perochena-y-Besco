package uy.edu.ctc.pamahe.modules.usuarios.service;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;
import uy.edu.ctc.pamahe.modules.roles.model.Rol;
import uy.edu.ctc.pamahe.modules.roles.repository.RolRepository;
import uy.edu.ctc.pamahe.modules.usuarios.dto.request.RestablecerPasswordRequest;
import uy.edu.ctc.pamahe.modules.usuarios.dto.request.UsuarioRequest;
import uy.edu.ctc.pamahe.modules.usuarios.dto.request.UsuarioUpdateRequest;
import uy.edu.ctc.pamahe.modules.usuarios.dto.response.UsuarioResponse;
import uy.edu.ctc.pamahe.modules.usuarios.mapper.UsuarioMapper;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.usuarios.repository.UsuarioRepository;

/**
 * Administra cuentas internas, sus roles y reglas de continuidad
 * administrativa.
 */
@Service
public class UsuarioService {

    private static final String ROL_ADMIN = "ADMINISTRADOR";

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditoriaService auditoriaService;
    private final UsuarioActualService usuarioActualService;

    public UsuarioService(UsuarioRepository usuarioRepository,
            RolRepository rolRepository,
            PasswordEncoder passwordEncoder,
            AuditoriaService auditoriaService,
            UsuarioActualService usuarioActualService) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditoriaService = auditoriaService;
        this.usuarioActualService = usuarioActualService;
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {
        return this.usuarioRepository.findByActivoTrueOrderByNombreAsc().stream()
                .map(UsuarioMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public UsuarioResponse obtener(Long id) {
        return UsuarioMapper.toResponse(this.buscarPorId(id));
    }

    @Transactional
    public UsuarioResponse crear(UsuarioRequest request) {
        String username = normalizarIdentificador(request.username());
        String email = normalizarIdentificador(request.email());

        if (this.usuarioRepository.existsByUsername(username)) {
            throw new BusinessException("Ya existe un usuario con ese nombre de usuario.");
        }

        if (this.usuarioRepository.existsByEmail(email)) {
            throw new BusinessException("Ya existe un usuario con ese correo electrónico.");
        }

        Usuario usuario = new Usuario();
        usuario.setUsername(username);
        usuario.setPasswordHash(this.passwordEncoder.encode(request.password()));
        usuario.setDebeCambiarPassword(true);
        usuario.setNombre(request.nombre().trim());
        usuario.setEmail(email);
        usuario.setTelefono(normalizarOpcional(request.telefono()));
        usuario.setRoles(this.obtenerRoles(request.roles()));

        Usuario guardado = this.usuarioRepository.save(usuario);

        this.auditoriaService.registrar("ALTA", "Usuario", guardado.getId(), "Creación de usuario interno");

        return UsuarioMapper.toResponse(guardado);
    }

    @Transactional
    public UsuarioResponse actualizar(Long id, UsuarioUpdateRequest request) {
        Usuario usuario = this.buscarPorId(id);
        Usuario actual = this.usuarioActualService.obtenerActivo();
        String email = normalizarIdentificador(request.email());

        if (this.usuarioRepository.existsByEmailAndIdNot(email, id)) {
            throw new BusinessException(
                    "Ya existe otro usuario con ese correo electrónico.");
        }

        Set<Rol> rolesNuevos = this.obtenerRoles(request.roles());
        boolean quedaraActivo = request.activo() == null || request.activo();
        this.validarContinuidadAdministrativa(usuario, actual, quedaraActivo, rolesNuevos);

        usuario.setNombre(request.nombre().trim());
        usuario.setEmail(email);
        usuario.setTelefono(normalizarOpcional(request.telefono()));
        usuario.setRoles(rolesNuevos);
        usuario.setActivo(quedaraActivo);

        Usuario guardado = this.usuarioRepository.save(usuario);

        this.auditoriaService.registrar("MODIFICACION", "Usuario", guardado.getId(),
                "Actualización de usuario interno");

        return UsuarioMapper.toResponse(guardado);
    }

    @Transactional
    public void desactivar(Long id) {
        Usuario usuario = this.buscarPorId(id);
        Usuario actual = this.usuarioActualService.obtenerActivo();
        this.validarContinuidadAdministrativa(usuario, actual, false, usuario.getRoles());

        usuario.setActivo(false);
        this.usuarioRepository.save(usuario);
        this.auditoriaService.registrar("BAJA_LOGICA", "Usuario", usuario.getId(), "Desactivación de usuario interno");
    }

    @Transactional
    public void restablecerPassword(Long id, RestablecerPasswordRequest request) {
        Usuario usuario = this.buscarPorId(id);
        usuario.setPasswordHash(this.passwordEncoder.encode(request.nuevaPassword()));
        usuario.setDebeCambiarPassword(true);
        this.usuarioRepository.save(usuario);
        this.auditoriaService.registrar("RESET_PASSWORD", "Usuario", usuario.getId(),
                "Restablecimiento administrativo de contraseña");
    }

    private void validarContinuidadAdministrativa(Usuario objetivo,
                                                   Usuario usuarioActual,
                                                   boolean quedaraActivo,
                                                   Set<Rol> rolesNuevos) {
        if (objetivo.getId().equals(usuarioActual.getId()) && !quedaraActivo) {
            throw new BusinessException("No podés desactivar tu propia cuenta mientras estás autenticado.");
        }

        boolean eraAdmin = tieneRol(objetivo, ROL_ADMIN);
        boolean seguiraAdmin = rolesNuevos.stream().anyMatch(r -> ROL_ADMIN.equals(r.getNombre()));
        if (eraAdmin && (!quedaraActivo || !seguiraAdmin)
                && this.usuarioRepository.contarAdministradoresActivos() <= 1) {
            throw new BusinessException("No se puede desactivar ni quitar el rol al único administrador activo del sistema.");
        }
    }

    private boolean tieneRol(Usuario usuario, String rol) {
        return usuario.getRoles().stream().anyMatch(r -> rol.equals(r.getNombre()));
    }

    private Usuario buscarPorId(Long id) {
        return this.usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el usuario solicitado."));
    }

    private Set<Rol> obtenerRoles(Set<String> nombresRoles) {
        return nombresRoles.stream()
                .map(this::normalizarRol)
                .map(nombre -> this.rolRepository.findByNombre(nombre)
                        .orElseThrow(() -> new BusinessException("El rol " + nombre + " no existe.")))
                .collect(Collectors.toSet());
    }

    private String normalizarIdentificador(String valor) {
        return valor.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizarRol(String valor) {
        return valor.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizarOpcional(String valor) {
        if (valor == null) return null;
        String limpio = valor.trim();
        return limpio.isEmpty() ? null : limpio;
    }
}
