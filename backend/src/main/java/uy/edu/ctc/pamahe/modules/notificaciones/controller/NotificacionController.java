package uy.edu.ctc.pamahe.modules.notificaciones.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import uy.edu.ctc.pamahe.common.response.ApiResponse;
import uy.edu.ctc.pamahe.modules.notificaciones.dto.response.NotificacionResponse;
import uy.edu.ctc.pamahe.modules.notificaciones.service.NotificacionService;

@RestController
@RequestMapping("/notificaciones")
public class NotificacionController {

    private final NotificacionService notificacionService;

    public NotificacionController(NotificacionService notificacionService) {
        this.notificacionService = notificacionService;
    }

    @GetMapping
    public ApiResponse<List<NotificacionResponse>> listar() {
        return ApiResponse.ok("Notificaciones obtenidas correctamente.", this.notificacionService.listarActuales());
    }

    @PatchMapping("/{id}/leida")
    public ApiResponse<NotificacionResponse> marcarLeida(@PathVariable Long id) {
        return ApiResponse.ok("Notificación actualizada correctamente.", this.notificacionService.marcarLeida(id));
    }
}
