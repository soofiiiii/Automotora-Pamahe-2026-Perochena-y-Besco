package uy.edu.ctc.pamahe.modules.chatbot.service;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import uy.edu.ctc.pamahe.modules.chatbot.dto.request.ChatbotRequest;
import uy.edu.ctc.pamahe.modules.chatbot.dto.response.ChatbotResponse;
import uy.edu.ctc.pamahe.modules.chatbot.model.ChatbotIntent;

/**
 * Implementa asistencia básica mediante intenciones y respuestas controladas.
 * Se eligió este enfoque porque mantiene el alcance informativo del catálogo y evita que el asistente invente precios,
 * disponibilidad, condiciones comerciales o decisiones que corresponden al personal de Pamahe.
 */
@Service
public class ChatbotService {
    
    private static final Pattern DIACRITICOS = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");

    public ChatbotResponse responder(ChatbotRequest request) {
        // La normalización permite comparar expresiones equivalentes sin depender de tildes o mayúsculas.
        String preguntaNormalizada = normalizar(request.pregunta());
        ChatbotIntent intencion = detectarIntencion(preguntaNormalizada);

        return construirRespuesta(intencion);
    }

    private ChatbotIntent detectarIntencion(String pregunta) {
        
        if(contiene(pregunta, "gracias", "muchas gracias", "te agradezco")) {
            return ChatbotIntent.AGRADECIMIENTO;
        }

        if (contiene(pregunta, "chau", "adios", "hasta luego", "nos vemos")) {
            return ChatbotIntent.DESPEDIDA;
        }

        if (contiene(pregunta, "horario", "horarios", "abren", "cierran", "a que hora", "sabado", "domingo")) {
            return ChatbotIntent.HORARIO;
        }

        if (contiene(pregunta, "ubicacion", "direccion", "donde estan", "donde queda", "local", "juan lacaze", "colonia")) {
            return ChatbotIntent.UBICACION;
        }

        if (contiene(pregunta, "contacto", "whatsapp", "telefono", "llamar", "mensaje", "correo", "email")) {
            return ChatbotIntent.CONTACTO;
        }

        if (contiene(pregunta, "financiacion", "financiar", "cuotas", "credito", "prestamo", "entrega")) {
            return ChatbotIntent.FINANCIACION;
        }

        if (contiene(pregunta, "disponible", "disponibles", "stock", "hay algun", "tienen algun", "queda algun")) {
            return ChatbotIntent.DISPONIBILIDAD;
        }

        if (contiene(pregunta, "catalogo", "vehiculos", "autos", "camionetas", "unidades", "ver autos", "ver vehiculos")) {
            return ChatbotIntent.CATALOGO;
        }

        if (contiene(pregunta, "precio", "cuanto sale", "valor", "costo", "barato", "economico")) {
            return ChatbotIntent.PRECIO;
        }

        if (contiene(pregunta, "kilometros", "kilometraje", "marca", "modelo", "año", "ano", "motor", "estado", "caracteristicas")) {
            return ChatbotIntent.CARACTERISTICAS;
        }

        if (contiene(pregunta, "vender mi auto", "vendo mi auto", "compran autos", "compran vehiculos", "toman vehiculos", "permuta")) {
            return ChatbotIntent.VENDER_VEHICULO;
        }

        if (contiene(pregunta, "reservar", "reserva", "seña", "sena", "apartarlo", "se puede apartar")) {
            return ChatbotIntent.RESERVA;
        }

        if (contiene(pregunta, "documentacion", "documentos", "comprobante", "papeles", "factura", "contrato")) {
            return ChatbotIntent.DOCUMENTACION;
        }

        if (contiene(pregunta, "dgi", "sucive", "banco", "transferencia", "seguro", "aseguradora", "tramite legal")) {
            return ChatbotIntent.FUERA_DE_ALCANCE;
        }

        if (contiene(pregunta, "hola", "buenas", "buen dia", "buenas tardes", "buenas noches")) {
            return ChatbotIntent.SALUDO;
        }

        return ChatbotIntent.DESCONOCIDA;
    }

    private ChatbotResponse construirRespuesta(ChatbotIntent intencion) {
        return switch (intencion) {

            case SALUDO -> new ChatbotResponse(
                    "¡Hola! Soy el asistente virtual de Automotora Pamahe. Puedo ayudarte con consultas sobre vehículos, catálogo, ubicación, horarios, financiación y medios de contacto.",
                    intencion.name(),
                    List.of(
                            "Ver vehículos disponibles",
                            "Consultar financiación",
                            "Saber ubicación"
                    )
            );

            case HORARIO -> new ChatbotResponse(
                    "Nuestro horario de atención es de lunes a viernes de 9:00 a 12:00 y de 14:30 a 19:30. Los sábados atendemos de 10:00 a 13:30. Los domingos no contamos con atención al público.",
                    intencion.name(),
                    List.of(
                            "Ver medios de contacto",
                            "Consultar ubicación",
                            "Ver catálogo"
                    )
            );

            case UBICACION -> new ChatbotResponse(
                    "Automotora Pamahe se encuentra en Juan Lacaze, departamento de Colonia.",
                    intencion.name(),
                    List.of(
                            "Ver medios de contacto",
                            "Consultar horarios",
                            "Ver vehículos disponibles"
                    )
            );

            case CONTACTO -> new ChatbotResponse(
                    "Podés comunicarte con Automotora Pamahe por WhatsApp al 093 358 826. Si consultás por un vehículo específico, te recomendamos mencionar la marca, modelo o publicación para que la atención sea más directa.",
                    intencion.name(),
                    List.of(
                            "Enviar WhatsApp al 093 358 826",
                            "Ver catálogo",
                            "Consultar financiación"
                    )
            );

            case FINANCIACION -> new ChatbotResponse(
                    "La automotora puede ofrecer modalidades de financiación según cada operación y el vehículo de interés. Como las condiciones pueden variar, te recomendamos consultar directamente por la unidad que te interesa.",
                    intencion.name(),
                    List.of(
                            "Ver vehículos disponibles",
                            "Consultar medios de contacto",
                            "Preguntar por requisitos"
                    )
            );

            case CATALOGO -> new ChatbotResponse(
                    "Podés consultar el catálogo público para ver los vehículos disponibles. Allí se muestra la información comercial habilitada, como marca, modelo, año, precio, fotografías y medios de contacto.",
                    intencion.name(),
                    List.of(
                            "Buscar por marca",
                            "Buscar por precio",
                            "Consultar disponibilidad"
                    )
            );

            case DISPONIBILIDAD -> new ChatbotResponse(
                    "Para consultar disponibilidad, revisá el catálogo público de vehículos. En esta primera versión todavía no consulto el stock en tiempo real desde el chatbot, pero puedo orientarte para que encuentres la información correcta.",
                    intencion.name(),
                    List.of(
                            "Ver catálogo",
                            "Consultar por precio",
                            "Contactar con la automotora"
                    )
            );

            case PRECIO -> new ChatbotResponse(
                    "Los precios se consultan en la ficha de cada vehículo publicado. Si tenés una marca, modelo o rango de precio en mente, podés buscarlo desde el catálogo o comunicarte con la automotora para recibir orientación.",
                    intencion.name(),
                    List.of(
                            "Ver vehículos económicos",
                            "Consultar financiación",
                            "Contactar por un vehículo"
                    )
            );

            case CARACTERISTICAS -> new ChatbotResponse(
                    "En la ficha de cada vehículo se podrá consultar información comercial como marca, modelo, año, fotografías, precio y características principales. Para datos más específicos, conviene consultar directamente por la unidad de interés.",
                    intencion.name(),
                    List.of(
                            "Ver ficha del vehículo",
                            "Consultar disponibilidad",
                            "Contactar con la automotora"
                    )
            );

            case VENDER_VEHICULO -> new ChatbotResponse(
                    "Si querés vender tu vehículo o consultar si la automotora lo puede tomar como parte de una operación, lo recomendable es comunicarte directamente y brindar datos básicos como marca, modelo, año, estado general y documentación disponible.",
                    intencion.name(),
                    List.of(
                            "Ver medios de contacto",
                            "Consultar documentación",
                            "Consultar ubicación"
                    )
            );

            case RESERVA -> new ChatbotResponse(
                    "En esta primera versión, el sistema no realiza reservas automáticas ni pagos en línea. Si te interesa un vehículo, podés comunicarte con la automotora para consultar disponibilidad y condiciones.",
                    intencion.name(),
                    List.of(
                            "Contactar con la automotora",
                            "Ver catálogo",
                            "Consultar financiación"
                    )
            );

            case DOCUMENTACION -> new ChatbotResponse(
                    "La documentación necesaria puede variar según la operación. Para compras, ventas o consultas sobre comprobantes, te recomendamos comunicarte directamente con la automotora para recibir orientación específica.",
                    intencion.name(),
                    List.of(
                            "Ver medios de contacto",
                            "Consultar por venta de vehículo",
                            "Consultar financiación"
                    )
            );

            case AGRADECIMIENTO -> new ChatbotResponse(
                    "¡De nada! Si necesitás otra consulta sobre vehículos, financiación, ubicación o contacto, estoy para ayudarte.",
                    intencion.name(),
                    List.of(
                            "Ver catálogo",
                            "Consultar ubicación",
                            "Consultar contacto"
                    )
            );

            case DESPEDIDA -> new ChatbotResponse(
                    "¡Hasta luego! Cuando quieras consultar por vehículos o información de Automotora Pamahe, podés volver a escribirme.",
                    intencion.name(),
                    List.of(
                            "Volver al inicio",
                            "Ver catálogo"
                    )
            );

            case FUERA_DE_ALCANCE -> new ChatbotResponse(
                    "Esa consulta puede depender de organismos, trámites o servicios externos. En esta versión puedo orientarte sobre información comercial básica, catálogo, ubicación, financiación y contacto de la automotora.",
                    intencion.name(),
                    List.of(
                            "Consultar contacto",
                            "Ver catálogo",
                            "Preguntar por documentación"
                    )
            );

            case DESCONOCIDA -> new ChatbotResponse(
                    "No estoy completamente seguro de haber entendido la consulta. Por ahora puedo ayudarte con vehículos disponibles, catálogo, ubicación, horarios, financiación y medios de contacto.",
                    intencion.name(),
                    List.of(
                            "Ver vehículos disponibles",
                            "Consultar financiación",
                            "Ver ubicación",
                            "Contactar con la automotora"
                    )
            );
        };
    }


    private boolean contiene(String texto, String... palabrasClave) {
        for (String palabra : palabrasClave) {
            if (texto.contains(palabra)) {
                return true;
            }
        }
        return false;
    }

    private String normalizar(String texto) {
        String textoNormalizado = Normalizer.normalize(texto, Normalizer.Form.NFD);

        return DIACRITICOS.matcher(textoNormalizado)
                .replaceAll("")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9ñ\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
