package com.ecommerce.service;

import com.ecommerce.model.*;
import com.ecommerce.repository.OrderItemRepository;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CartService cartService;

    @Autowired
    private ProductService productService;

    public Order createOrderFromCart(Long userId, String shippingAddress, String billingAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        Cart cart = cartService.getCartByUserId(userId);
        
        if (cart.getItems().isEmpty()) {
            throw new RuntimeException("Cannot create order from empty cart");
        }

        // Calculate total amount
        BigDecimal totalAmount = cart.getTotal();

        // Create order
        Order order = new Order(user, totalAmount, shippingAddress, billingAddress);
        order = orderRepository.save(order);

        // Create order items from cart items
        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItem cartItem : cart.getItems()) {
            // Check product availability
            if (!productService.isProductAvailable(cartItem.getProduct().getId(), cartItem.getQuantity())) {
                throw new RuntimeException("Product " + cartItem.getProduct().getName() + " is not available in required quantity");
            }

            OrderItem orderItem = new OrderItem(
                order,
                cartItem.getProduct(),
                cartItem.getQuantity(),
                cartItem.getProduct().getPrice()
            );
            orderItems.add(orderItem);
        }

        orderItemRepository.saveAll(orderItems);
        order.setOrderItems(orderItems);

        // Update product stock
        for (CartItem cartItem : cart.getItems()) {
            productService.updateStock(cartItem.getProduct().getId(), cartItem.getQuantity());
        }

        // Clear the cart
        cartService.clearCart(userId);

        return order;
    }

    public Order getOrderById(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
    }

    public List<Order> getOrdersByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        return orderRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public Page<Order> getOrdersByUserId(Long userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        return orderRepository.findByUser(user, pageable);
    }

    public Order updateOrderStatus(Long orderId, OrderStatus status) {
        Order order = getOrderById(orderId);
        order.setStatus(status);
        return orderRepository.save(order);
    }

    public Order updatePaymentStatus(Long orderId, String paymentIntentId, String paymentStatus) {
        Order order = getOrderById(orderId);
        order.setPaymentIntentId(paymentIntentId);
        order.setPaymentStatus(paymentStatus);
        
        if ("succeeded".equals(paymentStatus)) {
            order.setStatus(OrderStatus.CONFIRMED);
        } else if ("failed".equals(paymentStatus)) {
            order.setStatus(OrderStatus.CANCELLED);
        }
        
        return orderRepository.save(order);
    }

    public Optional<Order> getOrderByPaymentIntentId(String paymentIntentId) {
        return orderRepository.findByPaymentIntentId(paymentIntentId);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public List<Order> getOrdersByStatus(OrderStatus status) {
        return orderRepository.findByStatus(status);
    }
} 