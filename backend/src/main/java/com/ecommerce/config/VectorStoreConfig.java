package com.ecommerce.config;

import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Vector-store configuration.
 *
 * Uses the in-memory SimpleVectorStore. Embeddings are rebuilt on every startup
 * by DataInitializer, so persistence across restarts isn't needed.
 *
 * In Spring AI 1.0.0-M6 the SimpleVectorStore constructor is protected.
 * The supported way to construct one is via SimpleVectorStore.builder(embeddingModel).build().
 */
@Configuration
public class VectorStoreConfig {

    @Bean
    public VectorStore vectorStore(EmbeddingModel embeddingModel) {
        return SimpleVectorStore.builder(embeddingModel).build();
    }
}