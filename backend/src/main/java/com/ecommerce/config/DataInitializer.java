package com.ecommerce.config;

import java.math.BigDecimal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.ecommerce.model.Product;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.service.ProductEmbeddingService;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private ProductRepository productRepository;

    // BUG FIX: inject embedding service here so we can embed AFTER products exist.
    // Previously @PostConstruct in ProductEmbeddingService ran during context init
    // (before CommandLineRunner), so the DB was always empty when embeddings were built.
    @Autowired
    private ProductEmbeddingService productEmbeddingService;

    @Override
    public void run(String... args) throws Exception {
        if (productRepository.count() == 0) {
            initializeProducts();
            // Embed only after the rows are committed to the DB
            productEmbeddingService.embedAllProducts();
        }
    }

    private void initializeProducts() {
        // Electronics
        productRepository.save(new Product("iPhone 15 Pro", "Latest iPhone with advanced camera system", new BigDecimal("999.99"), 50, "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400", "Electronics", "Apple"));
        productRepository.save(new Product("Samsung Galaxy S24", "Flagship Android phone with AI features", new BigDecimal("899.99"), 30, "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400", "Electronics", "Samsung"));
        productRepository.save(new Product("MacBook Air M3", "Lightweight laptop with M3 chip", new BigDecimal("1299.99"), 25, "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400", "Electronics", "Apple"));
        productRepository.save(new Product("Dell XPS 13", "Premium ultrabook for professionals", new BigDecimal("1099.99"), 20, "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400", "Electronics", "Dell"));
        productRepository.save(new Product("AirPods Pro 2", "Wireless earbuds with noise cancellation", new BigDecimal("249.99"), 100, "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400", "Electronics", "Apple"));
        productRepository.save(new Product("Sony WH-1000XM5", "Premium noise-canceling headphones", new BigDecimal("399.99"), 40, "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400", "Electronics", "Sony"));

        // Clothing
        productRepository.save(new Product("Classic White T-Shirt", "100% cotton comfortable t-shirt", new BigDecimal("29.99"), 200, "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400", "Clothing", "Generic"));
        productRepository.save(new Product("Denim Jeans", "Classic blue jeans for everyday wear", new BigDecimal("79.99"), 150, "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400", "Clothing", "Levi's"));
        productRepository.save(new Product("Winter Jacket", "Warm and stylish winter jacket", new BigDecimal("199.99"), 75, "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400", "Clothing", "North Face"));
        productRepository.save(new Product("Running Shoes", "Lightweight running shoes for athletes", new BigDecimal("129.99"), 120, "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", "Clothing", "Nike"));
        productRepository.save(new Product("Business Suit", "Professional suit for formal occasions", new BigDecimal("299.99"), 50, "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400", "Clothing", "Hugo Boss"));

        // Home & Garden
        productRepository.save(new Product("Coffee Maker", "Programmable coffee maker with timer", new BigDecimal("89.99"), 60, "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400", "Home & Garden", "Cuisinart"));
        productRepository.save(new Product("Air Purifier", "HEPA air purifier for clean air", new BigDecimal("199.99"), 35, "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", "Home & Garden", "Dyson"));
        productRepository.save(new Product("Plant Pot Set", "Decorative ceramic plant pots", new BigDecimal("39.99"), 80, "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400", "Home & Garden", "Generic"));
        productRepository.save(new Product("LED Desk Lamp", "Adjustable LED desk lamp", new BigDecimal("49.99"), 90, "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400", "Home & Garden", "Philips"));

        // Books
        productRepository.save(new Product("The Psychology of Programming", "Essential book for developers", new BigDecimal("24.99"), 100, "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400", "Books", "O'Reilly"));
        productRepository.save(new Product("Clean Code", "A handbook of agile software craftsmanship", new BigDecimal("29.99"), 75, "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400", "Books", "Prentice Hall"));
        productRepository.save(new Product("Design Patterns", "Elements of reusable object-oriented software", new BigDecimal("34.99"), 50, "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=400", "Books", "Addison-Wesley"));

        System.out.println("Sample products initialized successfully!");
    }
}