package uy.edu.ctc.pamahe.modules.auth.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import uy.edu.ctc.pamahe.common.response.ApiResponse;
import uy.edu.ctc.pamahe.modules.auth.dto.request.LoginRequest;
import uy.edu.ctc.pamahe.modules.auth.dto.response.LoginResponse;
import uy.edu.ctc.pamahe.modules.auth.service.AuthService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;


@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok("Inicio de sesión correcto.", this.authService.login(request));
    }

    @GetMapping("/me")
    public ApiResponse<Object> me(Authentication authentication) {
        return ApiResponse.ok("Usuario autenticado correctamente.", authentication);
    }
}

