package com.ecommerce.controller;

import com.ecommerce.model.Order;
import com.ecommerce.service.OrderService;
import com.ecommerce.service.PaymentService;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Event;
import com.stripe.net.Webhook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = {"http://localhost:3000"})
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private OrderService orderService;

    @Value("${stripe.webhook.secret:}")
    private String webhookSecret;

    @PostMapping("/create-payment-intent")
    public ResponseEntity<Map<String, Object>> createPaymentIntent(@RequestBody Map<String, Object> request) {
        try {
            Long orderId = Long.valueOf(request.get("orderId").toString());
            Order order = orderService.getOrderById(orderId);
            
            PaymentIntent paymentIntent = paymentService.createPaymentIntent(order);
            
            // Update order with payment intent ID
            orderService.updatePaymentStatus(orderId, paymentIntent.getId(), "created");
            
            Map<String, Object> response = paymentService.createPaymentResponse(paymentIntent);
            return ResponseEntity.ok(response);
            
        } catch (StripeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/confirm-payment")
    public ResponseEntity<Map<String, Object>> confirmPayment(@RequestBody Map<String, String> request) {
        try {
            String paymentIntentId = request.get("paymentIntentId");
            PaymentIntent paymentIntent = paymentService.confirmPaymentIntent(paymentIntentId);
            
            Map<String, Object> response = paymentService.createPaymentResponse(paymentIntent);
            return ResponseEntity.ok(response);
            
        } catch (StripeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/payment-intent/{paymentIntentId}")
    public ResponseEntity<Map<String, Object>> getPaymentIntent(@PathVariable String paymentIntentId) {
        try {
            PaymentIntent paymentIntent = paymentService.retrievePaymentIntent(paymentIntentId);
            Map<String, Object> response = paymentService.createPaymentResponse(paymentIntent);
            return ResponseEntity.ok(response);
            
        } catch (StripeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(@RequestBody String payload, @RequestHeader("Stripe-Signature") String sigHeader) {
        Event event;

        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Webhook error: " + e.getMessage());
        }

        // Handle the event
        switch (event.getType()) {
            case "payment_intent.succeeded":
                handlePaymentIntentSucceeded(event);
                break;
            case "payment_intent.payment_failed":
                handlePaymentIntentFailed(event);
                break;
            default:
                System.out.println("Unhandled event type: " + event.getType());
        }

        return ResponseEntity.ok("Success");
    }

    private void handlePaymentIntentSucceeded(Event event) {
        PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer().getObject().orElse(null);
        if (paymentIntent != null) {
            String paymentIntentId = paymentIntent.getId();
            orderService.getOrderByPaymentIntentId(paymentIntentId).ifPresent(order -> {
                orderService.updatePaymentStatus(order.getId(), paymentIntentId, "succeeded");
            });
        }
    }

    private void handlePaymentIntentFailed(Event event) {
        PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer().getObject().orElse(null);
        if (paymentIntent != null) {
            String paymentIntentId = paymentIntent.getId();
            orderService.getOrderByPaymentIntentId(paymentIntentId).ifPresent(order -> {
                orderService.updatePaymentStatus(order.getId(), paymentIntentId, "failed");
            });
        }
    }
} 