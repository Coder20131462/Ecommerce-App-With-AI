package com.ecommerce.service;

import com.ecommerce.model.*;
import com.ecommerce.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    public Cart getOrCreateCart(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        Optional<Cart> existingCart = cartRepository.findByUser(user);
        if (existingCart.isPresent()) {
            return existingCart.get();
        }

        Cart newCart = new Cart(user);
        return cartRepository.save(newCart);
    }

    public Cart addItemToCart(Long userId, Long productId, Integer quantity) {
        Cart cart = getOrCreateCart(userId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        if (product.getStockQuantity() < quantity) {
            throw new RuntimeException("Insufficient stock for product: " + product.getName());
        }

        Optional<CartItem> existingItem = cartItemRepository.findByCartAndProduct(cart, product);
        
        if (existingItem.isPresent()) {
            CartItem cartItem = existingItem.get();
            int newQuantity = cartItem.getQuantity() + quantity;
            
            if (product.getStockQuantity() < newQuantity) {
                throw new RuntimeException("Insufficient stock for product: " + product.getName());
            }
            
            cartItem.setQuantity(newQuantity);
            cartItemRepository.save(cartItem);
        } else {
            CartItem newItem = new CartItem(cart, product, quantity);
            cartItemRepository.save(newItem);
        }

        return cartRepository.findById(cart.getId()).orElse(cart);
    }

    public Cart updateCartItem(Long userId, Long productId, Integer quantity) {
        Cart cart = getOrCreateCart(userId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        Optional<CartItem> cartItemOpt = cartItemRepository.findByCartAndProduct(cart, product);
        
        if (cartItemOpt.isPresent()) {
            CartItem cartItem = cartItemOpt.get();
            
            if (quantity <= 0) {
                cartItemRepository.delete(cartItem);
            } else {
                if (product.getStockQuantity() < quantity) {
                    throw new RuntimeException("Insufficient stock for product: " + product.getName());
                }
                cartItem.setQuantity(quantity);
                cartItemRepository.save(cartItem);
            }
        }

        return cartRepository.findById(cart.getId()).orElse(cart);
    }

    public Cart removeItemFromCart(Long userId, Long productId) {
        Cart cart = getOrCreateCart(userId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        Optional<CartItem> cartItemOpt = cartItemRepository.findByCartAndProduct(cart, product);
        
        if (cartItemOpt.isPresent()) {
            cartItemRepository.delete(cartItemOpt.get());
        }

        return cartRepository.findById(cart.getId()).orElse(cart);
    }

    public void clearCart(Long userId) {
        Cart cart = getOrCreateCart(userId);
        cartItemRepository.deleteByCart(cart);
    }

    public Cart getCartByUserId(Long userId) {
        return getOrCreateCart(userId);
    }
} 