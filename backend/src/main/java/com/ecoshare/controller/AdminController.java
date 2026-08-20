package com.ecoshare.controller;

import com.ecoshare.dto.donation.DonationResponse;
import com.ecoshare.dto.user.UserResponse;
import com.ecoshare.service.AuthService;
import com.ecoshare.service.DonationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AuthService authService;
    private final DonationService donationService;

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    @GetMapping("/users/role/{role}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> getUsersByRole(@PathVariable String role) {
        return ResponseEntity.ok(authService.getUsersByRole(role));
    }

    @PatchMapping("/users/{userId}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> toggleUserStatus(@PathVariable Long userId) {
        return ResponseEntity.ok(authService.toggleUserStatus(userId));
    }

    @PatchMapping("/ngo/{userId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> approveNgo(@PathVariable Long userId) {
        return ResponseEntity.ok(authService.approveNgo(userId));
    }

    @GetMapping("/donations")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<DonationResponse>> getAllDonations() {
        return ResponseEntity.ok(donationService.getAllDonations());
    }
}
