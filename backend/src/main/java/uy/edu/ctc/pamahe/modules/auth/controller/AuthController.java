package uy.edu.ctc.pamahe.modules.auth.controller;

import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import uy.edu.ctc.pamahe.common.response.ApiResponse;
import uy.edu.ctc.pamahe.modules.auth.dto.request.CambiarPasswordRequest;
import uy.edu.ctc.pamahe.modules.auth.dto.request.LoginRequest;
import uy.edu.ctc.pamahe.modules.auth.dto.response.LoginResponse;
import uy.edu.ctc.pamahe.modules.auth.service.AuthService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;

import uy.edu.ctc.pamahe.modules.auth.dto.response.AuthMeResponse;
import uy.edu.ctc.pamahe.modules.usuarios.model.Usuario;
import uy.edu.ctc.pamahe.modules.usuarios.service.UsuarioActualService;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final UsuarioActualService usuarioActualService;

    public AuthController(AuthService authService,
            UsuarioActualService usuarioActualService) {
        this.authService = authService;
        this.usuarioActualService = usuarioActualService;
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok("Inicio de sesión correcto.", this.authService.login(request));
    }

    @GetMapping("/me")
    public ApiResponse<AuthMeResponse> me() {
        Usuario usuario = this.usuarioActualService.obtenerActivo();
        Set<String> roles = usuario.getRoles()
                .stream()
                .map(rol -> rol.getNombre())
                .collect(Collectors.toSet());
        return ApiResponse.ok("Usuario autenticado correctamente.",
                new AuthMeResponse(usuario.getId(), usuario.getUsername(), usuario.getNombre(), roles));
    }

    @PatchMapping("/password")
    public ApiResponse<Void> cambiarPassword(@Valid @RequestBody CambiarPasswordRequest request) {
        this.authService.cambiarPasswordPropia(request);
        return ApiResponse.ok("Contraseña actualizada correctamente.", null);
    }
}
