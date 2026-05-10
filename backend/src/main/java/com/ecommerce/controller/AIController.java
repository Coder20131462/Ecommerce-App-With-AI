package com.ecommerce.controller;

import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ecommerce.ai.AIAssistantService;
import com.ecommerce.security.UserPrincipal;

/**
 * REST controller exposing the AI assistant to the React frontend.
 *
 * POST /api/ai/chat
 *   Body:  { "message": "I need wireless headphones under $300", "conversationId": "uuid" }
 *   Reply: { "response": "Great choice! Here are a few options...", "conversationId": "uuid" }
 */
@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = {"http://localhost:3000"})
public class AIController {

    private final AIAssistantService aiAssistantService;

    public AIController(AIAssistantService aiAssistantService) {
        this.aiAssistantService = aiAssistantService;
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(@RequestBody Map<String, String> request) {
        String userMessage = request.getOrDefault("message", "").trim();
        if (userMessage.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Message cannot be empty"));
        }

        // Re-use the same conversationId across turns so the LLM remembers context
        String conversationId = request.getOrDefault("conversationId", UUID.randomUUID().toString());

        // Get the authenticated user — fall back to a guest id if unauthenticated
        Long userId = getAuthenticatedUserId();

        try {
            String response = aiAssistantService.chat(userMessage, userId, conversationId);
            return ResponseEntity.ok(Map.of(
                    "response", response,
                    "conversationId", conversationId
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "AI assistant is temporarily unavailable. Please try again."));
        }
    }

    /** Health-check so the frontend can show a "connected" indicator */
    @GetMapping("/status")
    public ResponseEntity<Map<String, String>> status() {
        return ResponseEntity.ok(Map.of("status", "online", "model", "llama3.1:8b"));
    }

    private Long getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal up) {
            return up.getId();
        }
        // Guest user — tools that need userId will gracefully handle this
        return -1L;
    }
}