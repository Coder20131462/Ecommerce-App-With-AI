package com.ecommerce.ai;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

import com.ecommerce.model.Order;
import com.ecommerce.model.Product;
import com.ecommerce.service.CartService;
import com.ecommerce.service.OrderService;
import com.ecommerce.service.ProductEmbeddingService;
import com.ecommerce.service.ProductService;

/**
 * Tool Calling — this is the "action" half of the AI assistant.
 *
 * When the LLM decides it needs real data or wants to perform an operation,
 * it emits a tool-call JSON object. Spring AI intercepts that, calls the
 * matching Java method here, and feeds the result back to the LLM so it can
 * compose a helpful response.
 *
 * The LLM never has direct DB access — it can only call these declared tools.
 * This keeps the system secure and auditable.
 *
 * Resume talking point: "Implemented tool calling with Spring AI enabling the
 * LLM to autonomously execute backend operations like cart management and
 * order retrieval through a secure, declarative @Tool interface."
 */
@Component
public class EcommerceAITools {

    private static final Logger log = LoggerFactory.getLogger(EcommerceAITools.class);

    private final ProductService productService;
    private final CartService cartService;
    private final OrderService orderService;
    private final ProductEmbeddingService embeddingService;

    public EcommerceAITools(ProductService productService,
                            CartService cartService,
                            OrderService orderService,
                            ProductEmbeddingService embeddingService) {
        this.productService = productService;
        this.cartService = cartService;
        this.orderService = orderService;
        this.embeddingService = embeddingService;
    }

    // ─────────────────────────────────────────────────────────────
    //  PRODUCT TOOLS
    // ─────────────────────────────────────────────────────────────

    @Tool(description = "Search for products using a natural language query. " +
            "Use this when the user asks about specific products, mentions a category, brand, or price range. " +
            "Returns a list of matching products with names, prices, and descriptions.")
    public String searchProducts(String query) {
        log.info("Tool: searchProducts called with query='{}'", query);
        List<Document> docs = embeddingService.findRelevantProducts(query);
        if (docs.isEmpty()) {
            return "No products found matching: " + query;
        }
        return docs.stream().map(doc -> {
            var m = doc.getMetadata();
            return String.format("• %s | Brand: %s | Category: %s | $%s | %s",
                    m.get("name"), m.get("brand"), m.get("category"),
                    m.get("price"),
                    Boolean.TRUE.equals(m.get("inStock")) ? "In stock" : "Out of stock");
        }).collect(Collectors.joining("\n"));
    }

    @Tool(description = "Get full details of a single product by its numeric ID. " +
            "Use this when the user asks about a specific product they have already seen.")
    public String getProductDetails(Long productId) {
        log.info("Tool: getProductDetails called with id={}", productId);
        Optional<Product> product = productService.getProductById(productId);
        return product.map(p -> String.format(
                "Product ID: %d\nName: %s\nBrand: %s\nCategory: %s\nPrice: $%.2f\n" +
                        "Description: %s\nStock: %d units",
                p.getId(), p.getName(), p.getBrand(), p.getCategory(),
                p.getPrice(), p.getDescription(), p.getStockQuantity()
        )).orElse("Product with ID " + productId + " not found.");
    }

    @Tool(description = "List all available product categories in the store.")
    public String getCategories() {
        log.info("Tool: getCategories called");
        List<String> categories = productService.getAllCategories();
        return "Available categories: " + String.join(", ", categories);
    }

    // ─────────────────────────────────────────────────────────────
    //  CART TOOLS
    // ─────────────────────────────────────────────────────────────

    @Tool(description = "Add a product to the user's shopping cart. " +
            "Use this when the user says they want to buy, add, or purchase a product. " +
            "Requires the numeric productId and userId, and the quantity (default 1).")
    public String addToCart(Long userId, Long productId, Integer quantity) {
        log.info("Tool: addToCart — userId={} productId={} qty={}", userId, productId, quantity);
        try {
            cartService.addItemToCart(userId, productId, quantity == null ? 1 : quantity);
            Optional<Product> product = productService.getProductById(productId);
            String name = product.map(Product::getName).orElse("product #" + productId);
            return String.format("Added %d × \"%s\" to your cart.", quantity == null ? 1 : quantity, name);
        } catch (Exception e) {
            return "Could not add to cart: " + e.getMessage();
        }
    }

    @Tool(description = "View the current shopping cart contents and total price for a user.")
    public String viewCart(Long userId) {
        log.info("Tool: viewCart — userId={}", userId);
        try {
            var cart = cartService.getCartByUserId(userId);
            if (cart.getItems().isEmpty()) {
                return "Your cart is empty.";
            }
            StringBuilder sb = new StringBuilder("Your cart:\n");
            cart.getItems().forEach(item ->
                    sb.append(String.format("• %s × %d = $%.2f\n",
                            item.getProduct().getName(),
                            item.getQuantity(),
                            item.getSubtotal()))
            );
            sb.append(String.format("Total: $%.2f", cart.getTotal()));
            return sb.toString();
        } catch (Exception e) {
            return "Could not retrieve cart: " + e.getMessage();
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  ORDER TOOLS
    // ─────────────────────────────────────────────────────────────

    @Tool(description = "Get the order history for a user. " +
            "Use this when the user asks about their previous orders, order status, or what they have bought.")
    public String getOrderHistory(Long userId) {
        log.info("Tool: getOrderHistory — userId={}", userId);
        try {
            List<Order> orders = orderService.getOrdersByUserId(userId);
            if (orders.isEmpty()) {
                return "You have no past orders.";
            }
            return orders.stream().limit(5).map(o -> String.format(
                    "Order #%d — %s — $%.2f — %s",
                    o.getId(), o.getStatus(), o.getTotalAmount(),
                    o.getCreatedAt().toLocalDate()
            )).collect(Collectors.joining("\n"));
        } catch (Exception e) {
            return "Could not retrieve orders: " + e.getMessage();
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  RECOMMENDATION TOOL
    // ─────────────────────────────────────────────────────────────

    @Tool(description = "Generate personalised product recommendations for a user based on their order history. " +
            "Use this when the user asks 'what should I buy', 'recommend something', or 'what's popular'.")
    public String getPersonalisedRecommendations(Long userId) {
        log.info("Tool: getPersonalisedRecommendations — userId={}", userId);
        try {
            List<Order> orders = orderService.getOrdersByUserId(userId);
            // Build a query from past purchase categories/brands
            String historyQuery = orders.stream()
                    .flatMap(o -> o.getOrderItems().stream())
                    .map(i -> i.getProduct().getCategory() + " " + i.getProduct().getBrand())
                    .distinct().limit(5)
                    .collect(Collectors.joining(" "));

            String query = historyQuery.isBlank()
                    ? "popular electronics clothing books"
                    : historyQuery;

            List<Document> docs = embeddingService.findRelevantProducts(query);
            if (docs.isEmpty()) {
                return "No recommendations available right now.";
            }
            return "Based on your history, you might like:\n" +
                    docs.stream().map(doc -> {
                        var m = doc.getMetadata();
                        return String.format("• %s — $%s (%s)", m.get("name"), m.get("price"), m.get("category"));
                    }).collect(Collectors.joining("\n"));
        } catch (Exception e) {
            return "Could not generate recommendations: " + e.getMessage();
        }
    }
}