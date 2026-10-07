package uy.edu.ctc.pamahe.modules.imagenes.controller;

import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;

import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import uy.edu.ctc.pamahe.common.response.ApiResponse;
import uy.edu.ctc.pamahe.modules.imagenes.dto.request.ActualizarVisibilidadImagenRequest;
import uy.edu.ctc.pamahe.modules.imagenes.dto.response.ImagenVehiculoResponse;
import uy.edu.ctc.pamahe.modules.imagenes.service.FileStorageService;
import uy.edu.ctc.pamahe.modules.imagenes.service.ImagenVehiculoService;

@RestController
@RequestMapping("/imagenes")
public class ImagenVehiculoController {

    private final ImagenVehiculoService imagenVehiculoService;

    public ImagenVehiculoController(ImagenVehiculoService imagenVehiculoService) {
        this.imagenVehiculoService = imagenVehiculoService;
    }

    @GetMapping("/vehiculos/{vehiculoId}")
    public ApiResponse<List<ImagenVehiculoResponse>> listarPorVehiculo(@PathVariable Long vehiculoId) {
        return ApiResponse.ok("Galería del vehículo cargada con éxito.", this.imagenVehiculoService.listarPorVehiculo(vehiculoId));
    }

    @PostMapping(value = "/vehiculos/{vehiculoId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ImagenVehiculoResponse> subir(@PathVariable Long vehiculoId,
                                                      @RequestParam("file") MultipartFile file,
                                                      @RequestParam(required = false) String descripcion) {
        return ApiResponse.ok(
                "La imagen se guardó correctamente. (Recuerda que estará oculta hasta que decidas publicarla)",
                this.imagenVehiculoService.subir(vehiculoId, file, descripcion)
        );
    }

    @PatchMapping("/{id}/visibilidad")
    public ApiResponse<ImagenVehiculoResponse> actualizarVisibilidad(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarVisibilidadImagenRequest request) {
        return ApiResponse.ok(
                "El estado de la imagen se actualizó con éxito.",
                this.imagenVehiculoService.actualizarVisibilidad(id, request)
        );
    }

    @GetMapping("/{id}/archivo")
    public ResponseEntity<Resource> descargarArchivoInterno(@PathVariable Long id) {
        FileStorageService.StoredResource archivo = this.imagenVehiculoService.cargarArchivoInterno(id);
        ContentDisposition disposition = ContentDisposition.inline()
                .filename(archivo.filename(), StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(archivo.mediaType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(archivo.resource());
    }
    
    @DeleteMapping("/{id}")
    public ApiResponse<Void> eliminarDefinitivamente(@PathVariable Long id) {
        this.imagenVehiculoService.eliminarDefinitivamente(id);
        return ApiResponse.ok("Imagen y archivo eliminados correctamente.", null);
    }
}
