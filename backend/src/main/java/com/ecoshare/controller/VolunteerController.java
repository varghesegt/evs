package com.ecoshare.controller;

import com.ecoshare.dto.donation.DonationResponse;
import com.ecoshare.entity.User;
import com.ecoshare.service.AuthService;
import com.ecoshare.service.DonationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/volunteer")
@RequiredArgsConstructor
public class VolunteerController {

    private final DonationService donationService;
    private final AuthService authService;

    @GetMapping("/pickups")
    @PreAuthorize("hasRole('VOLUNTEER')")
    public ResponseEntity<List<DonationResponse>> getMyPickups() {
        User volunteer = authService.getCurrentUser();
        return ResponseEntity.ok(donationService.getVolunteerPickups(volunteer.getId()));
    }

    @GetMapping("/active")
    @PreAuthorize("hasRole('VOLUNTEER')")
    public ResponseEntity<List<DonationResponse>> getActivePickups() {
        User volunteer = authService.getCurrentUser();
        return ResponseEntity.ok(donationService.getVolunteerActivePickups(volunteer.getId()));
    }

    @PostMapping("/pickup/{donationId}")
    @PreAuthorize("hasRole('VOLUNTEER')")
    public ResponseEntity<DonationResponse> markPickedUp(@PathVariable Long donationId) {
        User volunteer = authService.getCurrentUser();
        return ResponseEntity.ok(donationService.markPickedUp(donationId, volunteer));
    }

    @PostMapping("/deliver/{donationId}")
    @PreAuthorize("hasRole('VOLUNTEER')")
    public ResponseEntity<DonationResponse> markDelivered(
            @PathVariable Long donationId,
            @RequestParam(required = false) String proofUrl) {
        User volunteer = authService.getCurrentUser();
        return ResponseEntity.ok(donationService.markDelivered(donationId, volunteer, proofUrl));
    }
}
