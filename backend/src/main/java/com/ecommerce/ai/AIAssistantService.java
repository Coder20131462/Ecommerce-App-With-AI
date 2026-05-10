package com.ecommerce.ai;

import com.ecommerce.service.ProductEmbeddingService;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.AbstractChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.InMemoryChatMemory;
import org.springframework.ai.document.Document;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Core AI service — RAG + tool-calling pipeline.
 *
 * Targets Spring AI 1.0.0-M6 (M6 API surface):
 *   - InMemoryChatMemory is the standard chat-memory implementation.
 *   - MessageChatMemoryAdvisor is constructed via its constructor, not a builder.
 *   - The conversation-id key is AbstractChatMemoryAdvisor.CHAT_MEMORY_CONVERSATION_ID_KEY.
 *   - The advisor uses a default history window (configurable max-messages was added later).
 */
@Service
public class AIAssistantService {

    private static final Logger log = LoggerFactory.getLogger(AIAssistantService.class);

    private static final String SYSTEM_PROMPT = """
            You are ShopBot, a friendly AI shopping assistant.
            You help customers on this e-commerce store with:
            - Finding products using natural language ("I need headphones under $300")
            - Answering questions about product specs, availability, and price
            - Adding items to the cart when a customer wants to buy something
            - Showing order history and explaining order status
            - Giving personalised recommendations based on what the customer has bought before
            
            Rules:
            - Be concise, warm, and genuinely helpful
            - Always mention price and stock status when recommending a product
            - If the customer says "add it", "I'll take it", or "buy" — call addToCart immediately
            - Never make up product details — only discuss what appears in the context below
            - If you are unsure, use the searchProducts tool to look it up
            - The current user's ID is: {userId}
            
            === Relevant products retrieved for this query (RAG context) ===
            {ragContext}
            === End of context ===
            """;

    private ChatClient chatClient;

    private final ChatClient.Builder chatClientBuilder;
    private final ProductEmbeddingService embeddingService;
    private final EcommerceAITools tools;

    public AIAssistantService(ChatClient.Builder chatClientBuilder,
                              ProductEmbeddingService embeddingService,
                              EcommerceAITools tools) {
        this.chatClientBuilder = chatClientBuilder;
        this.embeddingService = embeddingService;
        this.tools = tools;
    }

    @PostConstruct
    public void init() {
        // M6 API: simple constructor, no builder.
        InMemoryChatMemory chatMemory = new InMemoryChatMemory();

        this.chatClient = chatClientBuilder
                .defaultAdvisors(new MessageChatMemoryAdvisor(chatMemory))
                .build();
    }

    public String chat(String userMessage, Long userId, String conversationId) {
        log.info("AI chat — userId={} session={} msg='{}'", userId, conversationId, userMessage);

        List<Document> docs = embeddingService.findRelevantProducts(userMessage);
        String ragContext = docs.isEmpty()
                ? "No products pre-fetched. Use the searchProducts tool if needed."
                : docs.stream().map(Document::getText).collect(Collectors.joining("\n\n"));

        log.debug("RAG: {} document(s) retrieved for '{}'", docs.size(), userMessage);

        // M6 API: AbstractChatMemoryAdvisor.CHAT_MEMORY_CONVERSATION_ID_KEY
        // (renamed to ChatMemory.CONVERSATION_ID later in 1.0.0 GA).
        return chatClient.prompt()
                .system(sp -> sp
                        .text(SYSTEM_PROMPT)
                        .param("userId", userId.toString())
                        .param("ragContext", ragContext)
                )
                .user(userMessage)
                .tools(tools)
                .advisors(a -> a.param(
                        AbstractChatMemoryAdvisor.CHAT_MEMORY_CONVERSATION_ID_KEY,
                        conversationId))
                .call()
                .content();
    }
}