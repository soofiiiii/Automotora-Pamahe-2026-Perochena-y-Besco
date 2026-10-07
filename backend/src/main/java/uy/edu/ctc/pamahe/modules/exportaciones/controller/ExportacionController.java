package uy.edu.ctc.pamahe.modules.exportaciones.controller;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import uy.edu.ctc.pamahe.modules.exportaciones.service.CsvExportService;

@RestController
@RequestMapping("/exportaciones")
public class ExportacionController {
    private final CsvExportService service;

    public ExportacionController(CsvExportService service) {
        this.service = service;
    }

    @GetMapping("/vehiculos.csv")
    public ResponseEntity<byte[]> vehiculos() {
        return csv("vehiculos.csv", service.vehiculos());
    }

    @GetMapping("/clientes.csv")
    public ResponseEntity<byte[]> clientes() {
        return csv("clientes.csv", service.clientes());
    }

    @GetMapping("/ventas.csv")
    public ResponseEntity<byte[]> ventas(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return csv("ventas.csv", service.ventas(desde, hasta));
    }

    @GetMapping("/compras.csv")
    public ResponseEntity<byte[]> compras(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return csv("compras.csv", service.compras(desde, hasta));
    }

    @GetMapping("/refacciones.csv")
    public ResponseEntity<byte[]> refacciones(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return csv("refacciones.csv", service.refacciones(desde, hasta));
    }

    @GetMapping("/costos-vehiculos.csv")
    public ResponseEntity<byte[]> costos() {
        return csv("costos-vehiculos.csv", service.costosVehiculos());
    }

    private ResponseEntity<byte[]> csv(String filename, String content) {
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(filename, StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(content.getBytes(StandardCharsets.UTF_8));
    }
}
