package uy.edu.ctc.pamahe.modules.chatbot.dto.response;

import java.util.List;

public record ChatbotResponse(
    String respuesta,
    String intencion,
    List<String> sugerencias
) {
    
}
