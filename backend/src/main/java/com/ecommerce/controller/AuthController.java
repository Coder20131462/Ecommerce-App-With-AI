package com.ecommerce.controller;

import com.ecommerce.model.User;
import com.ecommerce.security.UserPrincipal;
import com.ecommerce.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000"})
public class AuthController {

    @Autowired
    private UserService userService;

    @GetMapping("/user")
    public ResponseEntity<Map<String, Object>> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal) {
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            Optional<User> user = userService.getUserById(userPrincipal.getId());
            
            if (user.isPresent()) {
                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("id", user.get().getId());
                userInfo.put("name", user.get().getName());
                userInfo.put("email", user.get().getEmail());
                userInfo.put("imageUrl", user.get().getImageUrl());
                userInfo.put("provider", user.get().getProvider());
                return ResponseEntity.ok(userInfo);
            }
        }
        
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/user/{id}")
    public ResponseEntity<Map<String, Object>> getUserById(@PathVariable Long id) {
        Optional<User> user = userService.getUserById(id);
        
        if (user.isPresent()) {
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.get().getId());
            userInfo.put("name", user.get().getName());
            userInfo.put("email", user.get().getEmail());
            userInfo.put("imageUrl", user.get().getImageUrl());
            userInfo.put("provider", user.get().getProvider());
            return ResponseEntity.ok(userInfo);
        }
        
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/user/email/{email}")
    public ResponseEntity<Map<String, Object>> getUserByEmail(@PathVariable String email) {
        Optional<User> user = userService.getUserByEmail(email);
        
        if (user.isPresent()) {
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.get().getId());
            userInfo.put("name", user.get().getName());
            userInfo.put("email", user.get().getEmail());
            userInfo.put("imageUrl", user.get().getImageUrl());
            userInfo.put("provider", user.get().getProvider());
            return ResponseEntity.ok(userInfo);
        }
        
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/user/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        try {
            User updatedUser = userService.updateUser(id, userDetails);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
} 