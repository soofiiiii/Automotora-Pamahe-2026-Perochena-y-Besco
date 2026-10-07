package uy.edu.ctc.pamahe.modules.exportaciones.service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Currency;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.ReporteComprasResponse;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.ReporteRefaccionesResponse;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.ReporteRentabilidadResponse;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.ReporteStockResponse;
import uy.edu.ctc.pamahe.modules.reportes.dto.response.ReporteVentasResponse;
import uy.edu.ctc.pamahe.modules.reportes.service.ReporteService;

@Service
public class ReportePdfService {

    private static final Locale LOCALE_UY = Locale.forLanguageTag("es-UY");
    private static final DateTimeFormatter FORMATO_FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter FORMATO_FECHA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final Color COLOR_PRIMARIO = new Color(16, 54, 94);
    private static final Color COLOR_CABECERA = new Color(232, 239, 246);
    private static final Color COLOR_BORDE = new Color(205, 216, 228);
    private static final Color COLOR_TEXTO_SECUNDARIO = new Color(78, 95, 114);

    private final ReporteService reporteService;

    public ReportePdfService(ReporteService reporteService) {
        this.reporteService = reporteService;
    }

    public byte[] ventas(LocalDate desde, LocalDate hasta) {
        ReporteVentasResponse reporte = this.reporteService.ventas(desde, hasta);
        return this.generarVentas("Reporte de ventas", reporte);
    }

    public byte[] vendidos(LocalDate desde, LocalDate hasta) {
        ReporteVentasResponse reporte = this.reporteService.vendidos(desde, hasta);
        return this.generarVentas("Reporte de vehículos vendidos", reporte);
    }

    public byte[] compras(LocalDate desde, LocalDate hasta) {
        ReporteComprasResponse reporte = this.reporteService.compras(desde, hasta);

        List<ResumenItem> resumen = List.of(
                new ResumenItem("Compras", String.valueOf(reporte.cantidadCompras())),
                new ResumenItem("Inversión", moneda(reporte.inversionCompras())));

        List<String[]> filas = reporte.compras().stream()
                .map(item -> new String[] {
                        fecha(item.fechaCompra()),
                        texto(item.vehiculo()),
                        moneda(item.costoAdquisicion())
                })
                .toList();

        return this.generar(
                "Reporte de compras",
                reporte.desde(),
                reporte.hasta(),
                resumen,
                new String[] { "Fecha", "Vehículo", "Costo de adquisición" },
                filas,
                new float[] { 1.2f, 4.8f, 1.8f },
                null);
    }

    public byte[] stock(LocalDate desde, LocalDate hasta) {
        ReporteStockResponse reporte = this.reporteService.stock(desde, hasta);

        List<ResumenItem> resumen = List.of(
                new ResumenItem("Ingresados en período", String.valueOf(reporte.vehiculosIngresados())),
                new ResumenItem("Stock al cierre", String.valueOf(reporte.stockAlCierre())),
                new ResumenItem("Disponibles", String.valueOf(reporte.disponibles())),
                new ResumenItem("Publicados", String.valueOf(reporte.publicados())));

        List<String[]> filas = reporte.vehiculos().stream()
                .map(item -> new String[] {
                        texto(item.marca()) + " " + texto(item.modelo()),
                        item.anio() == null ? "-" : String.valueOf(item.anio()),
                        texto(item.tipoVehiculo()),
                        fecha(item.fechaIngreso()),
                        texto(item.estado()),
                        Boolean.TRUE.equals(item.publicado()) ? "Sí" : "No",
                        moneda(item.precioVentaEstimado())
                })
                .toList();

        String nota = reporte.estadoYPublicacionRepresentanSituacionActual()
                ? "El estado y la publicación mostrados corresponden a la situación operativa actual."
                : null;

        return this.generar(
                "Reporte de stock al cierre",
                reporte.desde(),
                reporte.hasta(),
                resumen,
                new String[] { "Vehículo", "Año", "Tipo", "Ingreso", "Estado", "Publicado", "Precio estimado" },
                filas,
                new float[] { 3.2f, 0.8f, 1.3f, 1.2f, 1.5f, 1.0f, 1.7f },
                nota);
    }

    public byte[] refacciones(LocalDate desde, LocalDate hasta) {
        ReporteRefaccionesResponse reporte = this.reporteService.refacciones(desde, hasta);

        List<ResumenItem> resumen = List.of(
                new ResumenItem("Refacciones", String.valueOf(reporte.cantidadRefacciones())),
                new ResumenItem("Repuestos", moneda(reporte.costoRepuestos())),
                new ResumenItem("Mano de obra", moneda(reporte.costoManoObra())),
                new ResumenItem("Servicios externos", moneda(reporte.costoServiciosExternos())),
                new ResumenItem("Costo total", moneda(reporte.costoTotal())));

        List<String[]> filas = reporte.refacciones().stream()
                .map(item -> new String[] {
                        fecha(item.fecha()),
                        texto(item.vehiculo()),
                        enumTexto(item.tipoTrabajo()),
                        enumTexto(item.estadoTarea()),
                        moneda(item.costoRepuestos()),
                        moneda(item.costoManoObra()),
                        moneda(item.costoServiciosExternos()),
                        moneda(item.costoTotal())
                })
                .toList();

        return this.generar(
                "Reporte de refacciones",
                reporte.desde(),
                reporte.hasta(),
                resumen,
                new String[] { "Fecha", "Vehículo", "Trabajo", "Estado", "Repuestos", "Mano de obra", "Servicios", "Total" },
                filas,
                new float[] { 1.0f, 2.5f, 1.5f, 1.2f, 1.2f, 1.2f, 1.2f, 1.2f },
                null);
    }

    public byte[] rentabilidad(LocalDate desde, LocalDate hasta) {
        ReporteRentabilidadResponse reporte = this.reporteService.rentabilidad(desde, hasta);

        List<ResumenItem> resumen = List.of(
                new ResumenItem("Vehículos vendidos", String.valueOf(reporte.vehiculosVendidos())),
                new ResumenItem("Ingresos", moneda(reporte.ingresos())),
                new ResumenItem("Costo total", moneda(reporte.costoTotal())),
                new ResumenItem("Rentabilidad", moneda(reporte.rentabilidad())),
                new ResumenItem("Margen", porcentaje(reporte.margenPorcentual())));

        List<String[]> filas = reporte.operaciones().stream()
                .map(item -> new String[] {
                        fecha(item.fechaVenta()),
                        texto(item.vehiculo()),
                        moneda(item.costoTotal()),
                        moneda(item.precioFinal()),
                        moneda(item.rentabilidad())
                })
                .toList();

        return this.generar(
                "Reporte de rentabilidad",
                reporte.desde(),
                reporte.hasta(),
                resumen,
                new String[] { "Fecha", "Vehículo", "Costo total", "Precio final", "Rentabilidad" },
                filas,
                new float[] { 1.1f, 3.6f, 1.5f, 1.5f, 1.5f },
                "La rentabilidad corresponde al precio final de venta menos el costo total acumulado del vehículo.");
    }

    private byte[] generarVentas(String titulo, ReporteVentasResponse reporte) {
        List<ResumenItem> resumen = List.of(
                new ResumenItem("Operaciones", String.valueOf(reporte.cantidadVentas())),
                new ResumenItem("Ingresos", moneda(reporte.ingresos())),
                new ResumenItem("Costo total", moneda(reporte.costoTotal())),
                new ResumenItem("Rentabilidad", moneda(reporte.rentabilidad())));

        List<String[]> filas = reporte.ventas().stream()
                .map(item -> new String[] {
                        fecha(item.fechaVenta()),
                        texto(item.vehiculo()),
                        moneda(item.precioFinal()),
                        moneda(item.costoTotal()),
                        moneda(item.rentabilidad())
                })
                .toList();

        return this.generar(
                titulo,
                reporte.desde(),
                reporte.hasta(),
                resumen,
                new String[] { "Fecha", "Vehículo", "Precio final", "Costo total", "Rentabilidad" },
                filas,
                new float[] { 1.1f, 3.8f, 1.5f, 1.5f, 1.5f },
                null);
    }

    private byte[] generar(
            String titulo,
            LocalDate desde,
            LocalDate hasta,
            List<ResumenItem> resumen,
            String[] cabeceras,
            List<String[]> filas,
            float[] anchos,
            String nota) {

        try (ByteArrayOutputStream buffer = new ByteArrayOutputStream(8192)) {
            Document document = new Document(PageSize.A4.rotate(), 36, 36, 42, 38);

            try {
                PdfWriter.getInstance(document, buffer);
                document.open();

                this.agregarEncabezado(document, titulo, desde, hasta);
                this.agregarResumen(document, resumen);
                this.agregarTabla(document, cabeceras, filas, anchos);

                if (nota != null && !nota.isBlank()) {
                    Paragraph textoNota = new Paragraph(nota, fuente(9, Font.ITALIC, COLOR_TEXTO_SECUNDARIO));
                    textoNota.setSpacingBefore(10f);
                    document.add(textoNota);
                }
            } finally {
                if (document.isOpen()) {
                    document.close();
                }
            }

            return buffer.toByteArray();
        } catch (IOException | DocumentException exception) {
            throw new BusinessException("No se pudo generar el reporte PDF.");
        }
    }

    private void agregarEncabezado(Document document, String titulo, LocalDate desde, LocalDate hasta)
            throws DocumentException {
        Paragraph marca = new Paragraph("Automotora Pamahe", fuente(18, Font.BOLD, COLOR_PRIMARIO));
        marca.setSpacingAfter(4f);
        document.add(marca);

        Paragraph tituloReporte = new Paragraph(titulo, fuente(14, Font.BOLD, Color.BLACK));
        tituloReporte.setSpacingAfter(4f);
        document.add(tituloReporte);

        Paragraph periodo = new Paragraph(
                "Período: " + fecha(desde) + " - " + fecha(hasta),
                fuente(9, Font.NORMAL, COLOR_TEXTO_SECUNDARIO));
        document.add(periodo);

        Paragraph generado = new Paragraph(
                "Generado: " + LocalDateTime.now().format(FORMATO_FECHA_HORA),
                fuente(9, Font.NORMAL, COLOR_TEXTO_SECUNDARIO));
        generado.setSpacingAfter(12f);
        document.add(generado);
    }

    private void agregarResumen(Document document, List<ResumenItem> resumen) throws DocumentException {
        if (resumen == null || resumen.isEmpty()) {
            return;
        }

        PdfPTable tabla = new PdfPTable(4);
        tabla.setWidthPercentage(100f);
        tabla.setSpacingAfter(14f);

        for (ResumenItem item : resumen) {
            tabla.addCell(celdaResumen(item.label(), true));
            tabla.addCell(celdaResumen(item.valor(), false));
        }

        if (resumen.size() % 2 != 0) {
            PdfPCell espacio = new PdfPCell(new Phrase(""));
            espacio.setColspan(2);
            espacio.setBorder(PdfPCell.NO_BORDER);
            tabla.addCell(espacio);
        }

        document.add(tabla);
    }

    private void agregarTabla(
            Document document,
            String[] cabeceras,
            List<String[]> filas,
            float[] anchos) throws DocumentException {

        PdfPTable tabla = new PdfPTable(cabeceras.length);
        tabla.setWidthPercentage(100f);
        tabla.setHeaderRows(1);
        if (anchos != null && anchos.length == cabeceras.length) {
            tabla.setWidths(anchos);
        }

        for (String cabecera : cabeceras) {
            PdfPCell celda = new PdfPCell(new Phrase(cabecera, fuente(9, Font.BOLD, COLOR_PRIMARIO)));
            celda.setBackgroundColor(COLOR_CABECERA);
            celda.setBorderColor(COLOR_BORDE);
            celda.setPadding(6f);
            tabla.addCell(celda);
        }

        if (filas == null || filas.isEmpty()) {
            PdfPCell vacia = new PdfPCell(new Phrase("Sin registros para el período seleccionado.", fuente(9, Font.NORMAL, COLOR_TEXTO_SECUNDARIO)));
            vacia.setColspan(cabeceras.length);
            vacia.setPadding(8f);
            vacia.setBorderColor(COLOR_BORDE);
            tabla.addCell(vacia);
        } else {
            for (String[] fila : filas) {
                for (int i = 0; i < cabeceras.length; i++) {
                    String valor = i < fila.length ? fila[i] : "-";
                    PdfPCell celda = new PdfPCell(new Phrase(texto(valor), fuente(8, Font.NORMAL, Color.BLACK)));
                    celda.setBorderColor(COLOR_BORDE);
                    celda.setPadding(5f);
                    if (i >= Math.max(2, cabeceras.length - 3)) {
                        celda.setHorizontalAlignment(Element.ALIGN_RIGHT);
                    }
                    tabla.addCell(celda);
                }
            }
        }

        document.add(tabla);
    }

    private PdfPCell celdaResumen(String valor, boolean etiqueta) {
        PdfPCell celda = new PdfPCell(new Phrase(
                texto(valor),
                fuente(9, etiqueta ? Font.BOLD : Font.NORMAL, etiqueta ? COLOR_PRIMARIO : Color.BLACK)));
        celda.setBackgroundColor(etiqueta ? COLOR_CABECERA : Color.WHITE);
        celda.setBorderColor(COLOR_BORDE);
        celda.setPadding(7f);
        return celda;
    }

    private static Font fuente(float tamano, int estilo, Color color) {
        return FontFactory.getFont(FontFactory.HELVETICA, tamano, estilo, color);
    }

    private static String fecha(LocalDate valor) {
        return valor == null ? "-" : valor.format(FORMATO_FECHA);
    }

    private static String moneda(BigDecimal valor) {
        if (valor == null) {
            return "-";
        }
        NumberFormat formatter = NumberFormat.getCurrencyInstance(LOCALE_UY);
        formatter.setCurrency(Currency.getInstance("UYU"));
        formatter.setMinimumFractionDigits(2);
        formatter.setMaximumFractionDigits(2);
        return formatter.format(valor);
    }

    private static String porcentaje(BigDecimal valor) {
        if (valor == null) {
            return "-";
        }
        NumberFormat formatter = NumberFormat.getNumberInstance(LOCALE_UY);
        formatter.setMinimumFractionDigits(0);
        formatter.setMaximumFractionDigits(2);
        return formatter.format(valor) + "%";
    }

    private static String enumTexto(Object valor) {
        if (valor == null) {
            return "-";
        }
        return valor.toString().replace('_', ' ');
    }

    private static String texto(Object valor) {
        if (valor == null) {
            return "-";
        }
        String texto = String.valueOf(valor).trim();
        return texto.isEmpty() ? "-" : texto;
    }

    private record ResumenItem(String label, String valor) {
    }
}
