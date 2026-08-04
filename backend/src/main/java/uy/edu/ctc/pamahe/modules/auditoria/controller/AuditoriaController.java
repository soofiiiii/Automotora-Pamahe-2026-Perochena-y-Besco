package uy.edu.ctc.pamahe.modules.auditoria.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import uy.edu.ctc.pamahe.common.response.ApiResponse;
import uy.edu.ctc.pamahe.modules.auditoria.model.Auditoria;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;

@RestController
@RequestMapping("/auditoria")
public class AuditoriaController {

    private final AuditoriaService auditoriaService;

    public AuditoriaController(AuditoriaService auditoriaService) {
        this.auditoriaService = auditoriaService;
    }

    @GetMapping
    public ApiResponse<List<Auditoria>> listarUltimas() {
        return ApiResponse.ok("Registros de auditoria obtenidos correctamente.", this.auditoriaService.listarUltimas());
    }
    
}
