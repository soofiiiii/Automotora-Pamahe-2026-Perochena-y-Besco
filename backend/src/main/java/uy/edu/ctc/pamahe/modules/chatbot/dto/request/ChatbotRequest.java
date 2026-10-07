package uy.edu.ctc.pamahe.modules.chatbot.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatbotRequest(

        @NotBlank(message = "La pregunta no puede estar vacía.")
        @Size(max = 500, message = "La pregunta no puede superar los 500 caracteres.")
        String pregunta

) {
}