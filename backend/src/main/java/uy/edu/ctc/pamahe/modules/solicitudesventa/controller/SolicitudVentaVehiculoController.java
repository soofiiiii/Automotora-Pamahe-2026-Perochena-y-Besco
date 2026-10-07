package uy.edu.ctc.pamahe.modules.solicitudesventa.controller;

import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import uy.edu.ctc.pamahe.common.response.ApiResponse;
import uy.edu.ctc.pamahe.modules.imagenes.service.FileStorageService;
import uy.edu.ctc.pamahe.modules.solicitudesventa.dto.request.ActualizarEstadoSolicitudVentaRequest;
import uy.edu.ctc.pamahe.modules.solicitudesventa.dto.request.SolicitudVentaPublicaRequest;
import uy.edu.ctc.pamahe.modules.solicitudesventa.dto.response.SolicitudVentaDetalleResponse;
import uy.edu.ctc.pamahe.modules.solicitudesventa.dto.response.SolicitudVentaPublicaResponse;
import uy.edu.ctc.pamahe.modules.solicitudesventa.dto.response.SolicitudVentaResumenResponse;
import uy.edu.ctc.pamahe.modules.solicitudesventa.service.SolicitudVentaVehiculoService;

@RestController
@RequestMapping("/solicitudes-venta")
public class SolicitudVentaVehiculoController {

    private final SolicitudVentaVehiculoService service;

    public SolicitudVentaVehiculoController(SolicitudVentaVehiculoService service) {
        this.service = service;
    }

    @PostMapping(value = "/publica", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<SolicitudVentaPublicaResponse> crearPublica(
            @Valid @ModelAttribute SolicitudVentaPublicaRequest request) {
        return ApiResponse.ok(
                "Solicitud recibida correctamente. La automotora podrá revisarla y contactarte.",
                this.service.crearPublica(request));
    }

    @GetMapping
    public ApiResponse<List<SolicitudVentaResumenResponse>> listar() {
        return ApiResponse.ok("Solicitudes obtenidas correctamente.", this.service.listarInternas());
    }

    @GetMapping("/{id}")
    public ApiResponse<SolicitudVentaDetalleResponse> obtener(@PathVariable Long id) {
        return ApiResponse.ok("Solicitud obtenida correctamente.", this.service.obtenerInterna(id));
    }

    @PatchMapping("/{id}/estado")
    public ApiResponse<SolicitudVentaDetalleResponse> actualizarEstado(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarEstadoSolicitudVentaRequest request) {
        return ApiResponse.ok("Estado de la solicitud actualizado correctamente.",
                this.service.actualizarEstado(id, request));
    }

    @GetMapping("/{solicitudId}/imagenes/{imagenId}")
    public ResponseEntity<Resource> fotografia(
            @PathVariable Long solicitudId,
            @PathVariable Long imagenId) {
        FileStorageService.StoredResource archivo = this.service.cargarFotografia(solicitudId, imagenId);
        ContentDisposition disposition = ContentDisposition.inline()
                .filename(archivo.filename(), StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(archivo.mediaType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(archivo.resource());
    }
}
