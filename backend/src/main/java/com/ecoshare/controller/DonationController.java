package com.ecoshare.controller;

import com.ecoshare.dto.donation.CreateDonationRequest;
import com.ecoshare.dto.donation.DonationResponse;
import com.ecoshare.entity.User;
import com.ecoshare.service.AuthService;
import com.ecoshare.service.DonationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/donations")
@RequiredArgsConstructor
public class DonationController {

    private final DonationService donationService;
    private final AuthService authService;

    @PostMapping("/create")
    @PreAuthorize("hasRole('DONOR')")
    public ResponseEntity<DonationResponse> createDonation(@Valid @RequestBody CreateDonationRequest request) {
        User donor = authService.getCurrentUser();
        return ResponseEntity.ok(donationService.createDonation(request, donor));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('DONOR')")
    public ResponseEntity<List<DonationResponse>> getMyDonations() {
        User donor = authService.getCurrentUser();
        return ResponseEntity.ok(donationService.getDonorDonations(donor.getId()));
    }

    @GetMapping("/available")
    @PreAuthorize("hasAnyRole('NGO', 'ADMIN')")
    public ResponseEntity<List<DonationResponse>> getAvailableDonations() {
        return ResponseEntity.ok(donationService.getAvailableDonations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DonationResponse> getDonation(@PathVariable Long id) {
        return ResponseEntity.ok(donationService.getDonation(id));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<DonationResponse>> getAllDonations() {
        return ResponseEntity.ok(donationService.getAllDonations());
    }
}
