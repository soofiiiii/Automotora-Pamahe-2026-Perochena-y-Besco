package uy.edu.ctc.pamahe.common.util;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

import uy.edu.ctc.pamahe.common.exception.BusinessException;
import uy.edu.ctc.pamahe.common.exception.ResourceNotFoundException;
import uy.edu.ctc.pamahe.modules.parametros.model.Parametro;
import uy.edu.ctc.pamahe.modules.parametros.repository.ParametroRepository;

/**
 * Genera comprobantes administrativos dentro del almacenamiento privado.
 * Coordina el archivo con la transacción de negocio para evitar comprobantes
 * huérfanos cuando una compra o venta no logra confirmarse en la base de datos.
 */
@Service
public class PdfService {

    private static final DateTimeFormatter FORMATO_FECHA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter FORMATO_FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final String LOGO_CLASSPATH = "branding/pamahe-logo.png";

    private static final Color AZUL_PAMAHE = new Color(31, 47, 111);
    private static final Color ROJO_PAMAHE = new Color(229, 41, 28);
    private static final Color GRIS_TEXTO = new Color(72, 77, 88);
    private static final Color GRIS_SUAVE = new Color(243, 245, 248);
    private static final Color GRIS_BORDE = new Color(219, 223, 230);
    private static final Color BLANCO = Color.WHITE;

    private static final Set<String> CAMPOS_PRINCIPALES = Set.of(
            "compra id",
            "venta id",
            "vehiculo",
            "cliente vendedor",
            "cliente comprador",
            "documento vendedor",
            "documento comprador",
            "fecha de compra",
            "fecha de venta",
            "costo de adquisicion",
            "precio final",
            "registrado por",
            "vendedor");

    private final ParametroRepository parametroRepository;

    @Value("${app.storage.root}")
    private String storageRoot;

    public PdfService(ParametroRepository parametroRepository) {
        this.parametroRepository = parametroRepository;
    }

    public String generarComprobante(String tipo, List<String> lineas) {
        String categoria = this.categoriaSegura(tipo);

        Path basePrivada = this.baseComprobantes();
        Path carpeta = basePrivada.resolve(categoria).normalize();

        this.validarDentroDeBase(carpeta, basePrivada);

        Path destino = null;

        try {
            Files.createDirectories(carpeta);

            String nombreArchivo = tipo.toLowerCase(Locale.ROOT)
                    + "-"
                    + UUID.randomUUID()
                    + ".pdf";

            destino = carpeta.resolve(nombreArchivo).normalize();

            this.validarDentroDeBase(destino, basePrivada);

            byte[] contenido = this.generarPdfEnMemoria(tipo, lineas);

            Files.write(
                    destino,
                    contenido,
                    StandardOpenOption.CREATE_NEW,
                    StandardOpenOption.WRITE);

            this.eliminarSiRollback(destino);

            return categoria + "/" + nombreArchivo;

        } catch (IOException | DocumentException exception) {
            this.eliminarSilenciosamente(destino);

            throw new BusinessException(
                    "No se pudo generar el comprobante PDF.");
        }
    }

    private byte[] generarPdfEnMemoria(
            String tipo,
            List<String> lineas) throws DocumentException {

        try (ByteArrayOutputStream buffer = new ByteArrayOutputStream(16_384)) {
            Document document = new Document(PageSize.A4, 42, 42, 38, 42);
            PdfWriter.getInstance(document, buffer);

            document.addTitle("Comprobante interno de " + tipo.toLowerCase(Locale.ROOT));
            document.addAuthor("Automotora Pamahe");
            document.addSubject("Comprobante administrativo interno sin validez fiscal");

            document.open();

            Map<String, String> datos = this.parsearLineas(lineas);
            BigDecimal cotizacion = this.cotizacionUsdUyu();
            BigDecimal importeUyu = this.extraerImporteUyu(tipo, datos);
            BigDecimal importeUsd = importeUyu == null
                    ? null
                    : MonedaUtils.convertirUyuAUsd(importeUyu, cotizacion)
                            .setScale(2, RoundingMode.HALF_UP);

            this.agregarEncabezado(document, tipo, datos);
            this.agregarResumenComprobante(document, tipo, datos);
            this.agregarSeccionCliente(document, tipo, datos);
            this.agregarSeccionVehiculo(document, tipo, datos);
            this.agregarSeccionImportes(document, tipo, importeUsd, importeUyu, cotizacion);
            this.agregarInformacionComplementaria(document, datos);
            this.agregarPie(document);

            document.close();
            return buffer.toByteArray();

        } catch (IOException exception) {
            throw new BusinessException(
                    "No se pudo generar el comprobante PDF.");
        }
    }

    private void agregarEncabezado(
            Document document,
            String tipo,
            Map<String, String> datos) throws DocumentException {

        PdfPTable header = new PdfPTable(new float[] { 58f, 42f });
        header.setWidthPercentage(100f);
        header.setSpacingAfter(14f);

        PdfPCell logoCell = new PdfPCell();
        logoCell.setBorder(Rectangle.NO_BORDER);
        logoCell.setPadding(0f);
        logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);

        Image logo = this.cargarLogo();
        if (logo != null) {
            logo.scaleToFit(215f, 66f);
            logoCell.addElement(logo);
        } else {
            logoCell.addElement(new Paragraph(
                    "PAMAHE",
                    new Font(Font.HELVETICA, 24f, Font.BOLD, AZUL_PAMAHE)));
        }

        PdfPCell empresaCell = new PdfPCell();
        empresaCell.setBorder(Rectangle.NO_BORDER);
        empresaCell.setPadding(0f);
        empresaCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        empresaCell.setVerticalAlignment(Element.ALIGN_MIDDLE);

        Paragraph empresa = new Paragraph();
        empresa.setAlignment(Element.ALIGN_RIGHT);
        empresa.add(new Phrase(
                "COMPROBANTE INTERNO DE " + tipo.toUpperCase(Locale.ROOT) + "\n",
                new Font(Font.HELVETICA, 12f, Font.BOLD, ROJO_PAMAHE)));
        empresa.add(new Phrase(
                "Automotora Pamahe\n",
                new Font(Font.HELVETICA, 10f, Font.BOLD, AZUL_PAMAHE)));
        empresa.add(new Phrase(
                "Juan Lacaze, Colonia - Uruguay",
                new Font(Font.HELVETICA, 8.5f, Font.NORMAL, GRIS_TEXTO)));
        empresaCell.addElement(empresa);

        header.addCell(logoCell);
        header.addCell(empresaCell);
        document.add(header);

        PdfPTable linea = new PdfPTable(1);
        linea.setWidthPercentage(100f);
        PdfPCell lineaCell = new PdfPCell(new Phrase(" "));
        lineaCell.setFixedHeight(3f);
        lineaCell.setBorder(Rectangle.NO_BORDER);
        lineaCell.setBackgroundColor(AZUL_PAMAHE);
        linea.addCell(lineaCell);
        document.add(linea);
    }

    private void agregarResumenComprobante(
            Document document,
            String tipo,
            Map<String, String> datos) throws DocumentException {

        String id = this.valor(
                datos,
                "COMPRA".equalsIgnoreCase(tipo) ? "compra id" : "venta id");
        String numero = tipo.toUpperCase(Locale.ROOT)
                + "-"
                + this.formatearNumeroComprobante(id);
        String fecha = this.valor(
                datos,
                "COMPRA".equalsIgnoreCase(tipo) ? "fecha de compra" : "fecha de venta");

        PdfPTable resumen = new PdfPTable(new float[] { 50f, 50f });
        resumen.setWidthPercentage(100f);
        resumen.setSpacingBefore(10f);
        resumen.setSpacingAfter(14f);

        resumen.addCell(this.celdaResumen(
                "N.º DE COMPROBANTE",
                numero,
                Element.ALIGN_LEFT));
        resumen.addCell(this.celdaResumen(
                "FECHA DE OPERACIÓN",
                this.formatearFechaOperacion(fecha),
                Element.ALIGN_RIGHT));

        document.add(resumen);
    }

    private PdfPCell celdaResumen(String etiqueta, String valor, int alineacion) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(0f);
        cell.setHorizontalAlignment(alineacion);

        Paragraph p = new Paragraph();
        p.setAlignment(alineacion);
        p.add(new Phrase(
                etiqueta + "\n",
                new Font(Font.HELVETICA, 7.5f, Font.BOLD, GRIS_TEXTO)));
        p.add(new Phrase(
                valor,
                new Font(Font.HELVETICA, 11f, Font.BOLD, AZUL_PAMAHE)));
        cell.addElement(p);
        return cell;
    }

    private void agregarSeccionCliente(
            Document document,
            String tipo,
            Map<String, String> datos) throws DocumentException {

        this.agregarTituloSeccion(document, "DATOS DEL CLIENTE");

        boolean compra = "COMPRA".equalsIgnoreCase(tipo);
        String cliente = this.valor(datos, compra ? "cliente vendedor" : "cliente comprador");
        String documento = this.valor(datos, compra ? "documento vendedor" : "documento comprador");

        PdfPTable tabla = new PdfPTable(new float[] { 25f, 75f });
        tabla.setWidthPercentage(100f);
        tabla.setSpacingAfter(14f);

        this.agregarFilaDato(tabla, "Nombre", this.valorSeguro(cliente));
        this.agregarFilaDato(tabla, "Documento", this.valorSeguro(documento));
        this.agregarFilaDato(tabla, "Rol en la operación", compra ? "Vendedor" : "Comprador");

        document.add(tabla);
    }

    private void agregarSeccionVehiculo(
            Document document,
            String tipo,
            Map<String, String> datos) throws DocumentException {

        this.agregarTituloSeccion(document, "DETALLE DEL VEHÍCULO");

        PdfPTable tabla = new PdfPTable(new float[] { 12f, 63f, 25f });
        tabla.setWidthPercentage(100f);
        tabla.setSpacingAfter(14f);

        tabla.addCell(this.celdaCabeceraTabla("Cant.", Element.ALIGN_CENTER));
        tabla.addCell(this.celdaCabeceraTabla("Descripción", Element.ALIGN_LEFT));
        tabla.addCell(this.celdaCabeceraTabla("Operación", Element.ALIGN_CENTER));

        tabla.addCell(this.celdaDetalle("1", Element.ALIGN_CENTER));
        tabla.addCell(this.celdaDetalle(this.valorSeguro(this.valor(datos, "vehiculo")), Element.ALIGN_LEFT));
        tabla.addCell(this.celdaDetalle(
                "COMPRA".equalsIgnoreCase(tipo) ? "Ingreso" : "Venta",
                Element.ALIGN_CENTER));

        document.add(tabla);
    }

    private void agregarSeccionImportes(
            Document document,
            String tipo,
            BigDecimal importeUsd,
            BigDecimal importeUyu,
            BigDecimal cotizacion) throws DocumentException {

        this.agregarTituloSeccion(document, "IMPORTES");

        PdfPTable cuerpo = new PdfPTable(new float[] { 52f, 48f });
        cuerpo.setWidthPercentage(100f);
        cuerpo.setSpacingAfter(14f);

        PdfPCell descripcion = new PdfPCell();
        descripcion.setPadding(12f);
        descripcion.setBorder(Rectangle.BOX);
        descripcion.setBorderColor(GRIS_BORDE);

        Paragraph concepto = new Paragraph();
        concepto.add(new Phrase(
                "Concepto\n",
                new Font(Font.HELVETICA, 8f, Font.BOLD, GRIS_TEXTO)));
        concepto.add(new Phrase(
                "COMPRA".equalsIgnoreCase(tipo)
                        ? "Costo de adquisición del vehículo"
                        : "Precio final de venta del vehículo",
                new Font(Font.HELVETICA, 10.5f, Font.BOLD, AZUL_PAMAHE)));
        descripcion.addElement(concepto);

        Paragraph cambio = new Paragraph();
        cambio.setSpacingBefore(8f);
        cambio.add(new Phrase(
                "Cotización aplicada: 1 USD = $ " + this.formatearCotizacion(cotizacion) + " UYU",
                new Font(Font.HELVETICA, 8f, Font.NORMAL, GRIS_TEXTO)));
        descripcion.addElement(cambio);

        PdfPCell total = new PdfPCell();
        total.setPadding(12f);
        total.setBorder(Rectangle.BOX);
        total.setBorderColor(AZUL_PAMAHE);
        total.setBackgroundColor(GRIS_SUAVE);
        total.setHorizontalAlignment(Element.ALIGN_RIGHT);

        Paragraph totalP = new Paragraph();
        totalP.setAlignment(Element.ALIGN_RIGHT);
        totalP.add(new Phrase(
                "TOTAL\n",
                new Font(Font.HELVETICA, 8f, Font.BOLD, GRIS_TEXTO)));
        totalP.add(new Phrase(
                this.formatearUsd(importeUsd) + "\n",
                new Font(Font.HELVETICA, 18f, Font.BOLD, AZUL_PAMAHE)));
        totalP.add(new Phrase(
                this.formatearUyu(importeUyu),
                new Font(Font.HELVETICA, 10f, Font.BOLD, GRIS_TEXTO)));
        total.addElement(totalP);

        cuerpo.addCell(descripcion);
        cuerpo.addCell(total);
        document.add(cuerpo);
    }

    private void agregarInformacionComplementaria(
            Document document,
            Map<String, String> datos) throws DocumentException {

        Map<String, String> adicionales = new LinkedHashMap<>();
        datos.forEach((clave, valor) -> {
            if (!CAMPOS_PRINCIPALES.contains(clave)
                    && valor != null
                    && !valor.isBlank()) {
                adicionales.put(clave, valor);
            }
        });

        String responsable = this.primerValorNoVacio(
                this.valor(datos, "registrado por"),
                this.valor(datos, "vendedor"));

        if (responsable != null) {
            adicionales.put("responsable", responsable);
        }

        if (adicionales.isEmpty()) {
            return;
        }

        this.agregarTituloSeccion(document, "INFORMACIÓN DE LA OPERACIÓN");

        PdfPTable tabla = new PdfPTable(new float[] { 34f, 66f });
        tabla.setWidthPercentage(100f);
        tabla.setSpacingAfter(14f);

        adicionales.forEach((clave, valor) -> this.agregarFilaDato(
                tabla,
                this.formatearEtiqueta(clave),
                this.valorSeguro(valor)));

        document.add(tabla);
    }

    private void agregarPie(Document document) throws DocumentException {
        PdfPTable aviso = new PdfPTable(1);
        aviso.setWidthPercentage(100f);
        aviso.setSpacingBefore(4f);
        aviso.setSpacingAfter(8f);

        PdfPCell avisoCell = new PdfPCell();
        avisoCell.setPadding(10f);
        avisoCell.setBorder(Rectangle.BOX);
        avisoCell.setBorderColor(GRIS_BORDE);
        avisoCell.setBackgroundColor(GRIS_SUAVE);

        Paragraph avisoTexto = new Paragraph(
                "Este documento es de uso interno administrativo y no posee validez como comprobante fiscal (Factura).",
                new Font(Font.HELVETICA, 8.5f, Font.NORMAL, GRIS_TEXTO));
        avisoTexto.setAlignment(Element.ALIGN_CENTER);
        avisoCell.addElement(avisoTexto);
        aviso.addCell(avisoCell);
        document.add(aviso);

        Paragraph emision = new Paragraph(
                "Emitido por Sistema Pamahe el " + LocalDateTime.now().format(FORMATO_FECHA_HORA),
                new Font(Font.HELVETICA, 7.5f, Font.NORMAL, GRIS_TEXTO));
        emision.setAlignment(Element.ALIGN_CENTER);
        document.add(emision);
    }

    private void agregarTituloSeccion(Document document, String titulo) throws DocumentException {
        PdfPTable tabla = new PdfPTable(1);
        tabla.setWidthPercentage(100f);
        tabla.setSpacingBefore(2f);

        PdfPCell cell = new PdfPCell(new Phrase(
                titulo,
                new Font(Font.HELVETICA, 8.5f, Font.BOLD, BLANCO)));
        cell.setPaddingTop(6f);
        cell.setPaddingBottom(6f);
        cell.setPaddingLeft(8f);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setBackgroundColor(AZUL_PAMAHE);
        tabla.addCell(cell);

        document.add(tabla);
    }

    private void agregarFilaDato(PdfPTable tabla, String etiqueta, String valor) {
        PdfPCell etiquetaCell = new PdfPCell(new Phrase(
                etiqueta,
                new Font(Font.HELVETICA, 8.5f, Font.BOLD, GRIS_TEXTO)));
        etiquetaCell.setPadding(7f);
        etiquetaCell.setBorder(Rectangle.BOTTOM);
        etiquetaCell.setBorderColor(GRIS_BORDE);
        etiquetaCell.setBackgroundColor(GRIS_SUAVE);

        PdfPCell valorCell = new PdfPCell(new Phrase(
                valor,
                new Font(Font.HELVETICA, 9f, Font.NORMAL, Color.BLACK)));
        valorCell.setPadding(7f);
        valorCell.setBorder(Rectangle.BOTTOM);
        valorCell.setBorderColor(GRIS_BORDE);

        tabla.addCell(etiquetaCell);
        tabla.addCell(valorCell);
    }

    private PdfPCell celdaCabeceraTabla(String texto, int alineacion) {
        PdfPCell cell = new PdfPCell(new Phrase(
                texto,
                new Font(Font.HELVETICA, 8.5f, Font.BOLD, GRIS_TEXTO)));
        cell.setPadding(7f);
        cell.setHorizontalAlignment(alineacion);
        cell.setBackgroundColor(GRIS_SUAVE);
        cell.setBorder(Rectangle.BOX);
        cell.setBorderColor(GRIS_BORDE);
        return cell;
    }

    private PdfPCell celdaDetalle(String texto, int alineacion) {
        PdfPCell cell = new PdfPCell(new Phrase(
                texto,
                new Font(Font.HELVETICA, 9f, Font.NORMAL, Color.BLACK)));
        cell.setPadding(9f);
        cell.setHorizontalAlignment(alineacion);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setBorder(Rectangle.BOX);
        cell.setBorderColor(GRIS_BORDE);
        return cell;
    }

    private Image cargarLogo() {
        ClassPathResource resource = new ClassPathResource(LOGO_CLASSPATH);
        if (!resource.exists()) {
            return null;
        }

        try (InputStream input = resource.getInputStream()) {
            return Image.getInstance(input.readAllBytes());
        } catch (IOException | DocumentException exception) {
            return null;
        }
    }

    private Map<String, String> parsearLineas(List<String> lineas) {
        Map<String, String> datos = new LinkedHashMap<>();
        if (lineas == null) {
            return datos;
        }

        int indiceLibre = 1;
        for (String linea : lineas) {
            if (linea == null || linea.isBlank()) {
                continue;
            }

            int separador = linea.indexOf(':');
            if (separador <= 0) {
                datos.put("detalle " + indiceLibre++, linea.trim());
                continue;
            }

            String clave = this.normalizarClave(linea.substring(0, separador));
            String valor = linea.substring(separador + 1).trim();
            datos.put(clave, valor);
        }

        return datos;
    }

    private String normalizarClave(String valor) {
        String sinAcentos = Normalizer.normalize(valor, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return sinAcentos.trim().toLowerCase(Locale.ROOT);
    }

    private BigDecimal extraerImporteUyu(String tipo, Map<String, String> datos) {
        String valor = this.valor(
                datos,
                "COMPRA".equalsIgnoreCase(tipo)
                        ? "costo de adquisicion"
                        : "precio final");
        return this.parsearImporte(valor);
    }

    private BigDecimal parsearImporte(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }

        String normalizado = valor
                .toUpperCase(Locale.ROOT)
                .replace("USD", "")
                .replace("UYU", "")
                .replace("$", "")
                .replace(" ", "")
                .trim();

        if (normalizado.contains(",") && normalizado.contains(".")) {
            normalizado = normalizado.replace(".", "").replace(',', '.');
        } else if (normalizado.contains(",")) {
            normalizado = normalizado.replace(',', '.');
        }

        try {
            return new BigDecimal(normalizado);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private BigDecimal cotizacionUsdUyu() {
        return this.parametroRepository
                .findByCategoriaAndClaveAndActivoTrue(
                        MonedaUtils.CATEGORIA_MONEDA,
                        MonedaUtils.CLAVE_USD_UYU)
                .map(Parametro::getValor)
                .map(MonedaUtils::parsearCotizacionUsdUyu)
                .orElse(MonedaUtils.COTIZACION_USD_UYU_PREDETERMINADA);
    }

    private String valor(Map<String, String> datos, String clave) {
        return datos.get(this.normalizarClave(clave));
    }

    private String valorSeguro(String valor) {
        return valor == null || valor.isBlank() ? "No informado" : valor;
    }

    private String primerValorNoVacio(String... valores) {
        for (String valor : valores) {
            if (valor != null && !valor.isBlank()) {
                return valor;
            }
        }
        return null;
    }

    private String formatearNumeroComprobante(String id) {
        if (id == null || id.isBlank()) {
            return "SIN-ID";
        }

        try {
            return String.format(Locale.ROOT, "%06d", Long.parseLong(id.trim()));
        } catch (NumberFormatException exception) {
            return id.trim();
        }
    }

    private String formatearFechaOperacion(String valor) {
        if (valor == null || valor.isBlank()) {
            return "No informada";
        }

        try {
            return LocalDate.parse(valor.trim()).format(FORMATO_FECHA);
        } catch (DateTimeParseException exception) {
            return valor.trim();
        }
    }

    private String formatearUsd(BigDecimal valor) {
        return valor == null ? "USD -" : "USD " + this.formatearNumero(valor);
    }

    private String formatearUyu(BigDecimal valor) {
        return valor == null ? "$ - UYU" : "$ " + this.formatearNumero(valor) + " UYU";
    }

    private String formatearCotizacion(BigDecimal valor) {
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(new Locale("es", "UY"));
        symbols.setGroupingSeparator('.');
        symbols.setDecimalSeparator(',');

        DecimalFormat format = new DecimalFormat("#,##0.00", symbols);
        format.setGroupingUsed(true);
        return format.format(valor);
    }

    private String formatearNumero(BigDecimal valor) {
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(new Locale("es", "UY"));
        symbols.setGroupingSeparator('.');
        symbols.setDecimalSeparator(',');

        DecimalFormat format = new DecimalFormat("#,##0.##", symbols);
        format.setGroupingUsed(true);
        format.setMinimumFractionDigits(0);
        format.setMaximumFractionDigits(2);
        return format.format(valor);
    }

    private String formatearEtiqueta(String clave) {
        if (clave == null || clave.isBlank()) {
            return "Detalle";
        }

        return switch (clave) {
            case "medio de pago" -> "Medio de pago";
            case "entidad financiera" -> "Entidad financiera";
            case "monto financiado" -> "Monto financiado";
            case "estado de financiacion" -> "Estado de financiación";
            case "canal de origen" -> "Canal de origen";
            case "responsable" -> "Responsable";
            default -> {
                String texto = clave.replace('_', ' ').trim();
                yield Character.toUpperCase(texto.charAt(0)) + texto.substring(1);
            }
        };
    }

    public ComprobanteResource cargarComprobante(String rutaRelativa) {
        if (rutaRelativa == null || rutaRelativa.isBlank()) {
            throw new ResourceNotFoundException(
                    "La operación no posee un comprobante generado.");
        }

        Path base = this.baseComprobantes();
        Path archivo = base.resolve(rutaRelativa).normalize();

        this.validarDentroDeBase(archivo, base);

        if (!Files.isRegularFile(archivo)) {
            throw new ResourceNotFoundException(
                    "El comprobante solicitado ya no está disponible.");
        }

        Resource resource = new FileSystemResource(archivo);

        return new ComprobanteResource(
                resource,
                archivo.getFileName().toString());
    }

    private String categoriaSegura(String tipo) {
        String normalizado = tipo == null
                ? ""
                : tipo.trim().toUpperCase(Locale.ROOT);

        return switch (normalizado) {
            case "COMPRA" -> "compras";
            case "VENTA" -> "ventas";
            default ->
                throw new BusinessException(
                        "Tipo de comprobante no permitido.");
        };
    }

    private Path baseComprobantes() {
        return Path.of(
                this.storageRoot,
                "private",
                "comprobantes")
                .toAbsolutePath()
                .normalize();
    }

    private void validarDentroDeBase(Path path, Path base) {
        Path rutaNormalizada = path.toAbsolutePath().normalize();

        Path baseNormalizada = base.toAbsolutePath().normalize();

        if (!rutaNormalizada.startsWith(baseNormalizada)) {
            throw new BusinessException(
                    "No pudimos acceder al comprobante solicitado.");
        }
    }

    private void eliminarSiRollback(Path archivo) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {

                    @Override
                    public void afterCompletion(int status) {
                        if (status == STATUS_ROLLED_BACK) {
                            eliminarSilenciosamente(archivo);
                        }
                    }
                });
    }

    private void eliminarSilenciosamente(Path archivo) {
        if (archivo == null) {
            return;
        }

        try {
            Files.deleteIfExists(archivo);
        } catch (IOException ignored) {
            // La limpieza del archivo no debe ocultar el error principal.
        }
    }

    public void eliminarComprobante(String rutaRelativa) {
        if (rutaRelativa == null || rutaRelativa.isBlank()) {
            return;
        }

        Path base = this.baseComprobantes();
        Path archivo = base.resolve(rutaRelativa).normalize();

        this.validarDentroDeBase(archivo, base);
        this.eliminarSilenciosamente(archivo);
    }

    public record ComprobanteResource(
            Resource resource,
            String filename) {
    }
}
