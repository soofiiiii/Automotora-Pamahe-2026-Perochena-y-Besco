package uy.edu.ctc.pamahe.modules.chatbot.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import uy.edu.ctc.pamahe.common.response.ApiResponse;
import uy.edu.ctc.pamahe.modules.chatbot.dto.request.ChatbotRequest;
import uy.edu.ctc.pamahe.modules.chatbot.dto.response.ChatbotResponse;
import uy.edu.ctc.pamahe.modules.chatbot.service.ChatbotService;

@RestController
@RequestMapping("/chatbot")
public class ChatbotController {

    private final ChatbotService chatbotService;

    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @PostMapping("/preguntar")
    public ApiResponse<ChatbotResponse> preguntar(@Valid @RequestBody ChatbotRequest request) {
        ChatbotResponse response = chatbotService.responder(request);
        return ApiResponse.ok("Respuesta generada correctamente.", response);
    }
}