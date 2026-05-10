package com.ecommerce.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.ecommerce.model.Product;
import com.ecommerce.repository.ProductRepository;

/**
 * Manages product vector embeddings for the RAG (Retrieval-Augmented Generation) pipeline.
 *
 * How it works:
 *  1. Each product is converted into a rich text Document.
 *  2. Spring AI calls OpenAI's embedding API to turn that text into a 1536-dim float vector.
 *  3. The vector is stored in PostgreSQL (pgvector extension).
 *  4. At query time, the user's message is embedded the same way and a cosine-similarity
 *     search finds the closest products — these become the "context" fed to the LLM.
 */
@Service
public class ProductEmbeddingService {

    private static final Logger log = LoggerFactory.getLogger(ProductEmbeddingService.class);

    private final VectorStore vectorStore;
    private final ProductRepository productRepository;

    @Value("${app.ai.rag-top-k:4}")
    private int topK;

    @Value("${app.ai.rag-similarity-threshold:0.65}")
    private double similarityThreshold;

    public ProductEmbeddingService(VectorStore vectorStore, ProductRepository productRepository) {
        this.vectorStore = vectorStore;
        this.productRepository = productRepository;
    }

    /**
     * BUG FIX: removed @PostConstruct — it ran during Spring context initialization,
     * which is BEFORE CommandLineRunner (DataInitializer) seeds the database.
     * This meant embedAllProducts() always ran on an empty table and the vector
     * store was never populated. Now called explicitly from DataInitializer.run()
     * after products are committed.
     */
    public void embedAllProducts() {
        List<Product> products = productRepository.findAll();
        if (products.isEmpty()) {
            log.info("No products found to embed — skipping.");
            return;
        }
        log.info("Embedding {} products into vector store...", products.size());
        List<Document> documents = products.stream()
                .map(this::toDocument)
                .collect(Collectors.toList());
        vectorStore.add(documents);
        log.info("Product embeddings complete.");
    }

    /**
     * Embed a single product — call this whenever a product is created or updated.
     */
    public void embedProduct(Product product) {
        vectorStore.add(List.of(toDocument(product)));
        log.debug("Embedded product id={} name={}", product.getId(), product.getName());
    }

    /**
     * Semantic search: finds the products most relevant to a natural-language query.
     *
     * BUG FIX: updated to Spring AI 1.0.0 SearchRequest builder API.
     * The old static-factory + chained .withTopK() / .withSimilarityThreshold() methods
     * were removed in 1.0.0 and cause a compilation error. Use the builder instead.
     */
    public List<Document> findRelevantProducts(String query) {
        return vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query(query)
                        .topK(topK)
                        .similarityThreshold(similarityThreshold)
                        .build()
        );
    }

    /**
     * Builds a rich text representation of a product for embedding.
     */
    private Document toDocument(Product product) {
        String content = String.format(
                "Product: %s. Brand: %s. Category: %s. Price: $%.2f. " +
                        "Description: %s. Stock: %d units available.",
                product.getName(),
                product.getBrand(),
                product.getCategory(),
                product.getPrice(),
                product.getDescription(),
                product.getStockQuantity()
        );

        Map<String, Object> metadata = Map.of(
                "productId",  product.getId(),
                "name",       product.getName(),
                "price",      product.getPrice(),
                "category",   product.getCategory(),
                "brand",      product.getBrand(),
                "imageUrl",   product.getImageUrl() != null ? product.getImageUrl() : "",
                "inStock",    product.getStockQuantity() > 0
        );

        return new Document(content, metadata);
    }
}