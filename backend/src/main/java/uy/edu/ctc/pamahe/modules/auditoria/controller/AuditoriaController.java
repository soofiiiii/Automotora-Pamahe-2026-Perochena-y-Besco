package uy.edu.ctc.pamahe.modules.auditoria.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import uy.edu.ctc.pamahe.common.response.ApiResponse;
import uy.edu.ctc.pamahe.common.response.PageResponse;
import uy.edu.ctc.pamahe.modules.auditoria.dto.response.AuditoriaResponse;
import uy.edu.ctc.pamahe.modules.auditoria.service.AuditoriaService;

@RestController
@RequestMapping("/auditoria")
public class AuditoriaController {
    
    private final AuditoriaService auditoriaService;

    public AuditoriaController(AuditoriaService auditoriaService) {
        this.auditoriaService = auditoriaService;
    }

    @GetMapping
    public ApiResponse<List<AuditoriaResponse>> listar(
            @RequestParam(required = false) String usuario,
            @RequestParam(required = false) String accion,
            @RequestParam(required = false) String entidad,
            @RequestParam(required = false) Long entidadId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ApiResponse.ok("Registros de auditoría obtenidos correctamente.",
                this.auditoriaService.listar(usuario, accion, entidad, entidadId, desde, hasta));
    }

    @GetMapping("/paginado")
    public ApiResponse<PageResponse<AuditoriaResponse>> listarPaginado(
            @RequestParam(required = false) String usuario,
            @RequestParam(required = false) String accion,
            @RequestParam(required = false) String entidad,
            @RequestParam(required = false) Long entidadId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ApiResponse.ok("Registros de auditoría paginados obtenidos correctamente.",
                this.auditoriaService.listarPaginado(usuario, accion, entidad, entidadId, desde, hasta, page, size));
    }
}
