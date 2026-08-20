package com.ecoshare.controller;

import com.ecoshare.dto.donation.DonationResponse;
import com.ecoshare.dto.user.UserResponse;
import com.ecoshare.entity.User;
import com.ecoshare.service.AuthService;
import com.ecoshare.service.DonationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ngo")
@RequiredArgsConstructor
public class NgoController {

    private final DonationService donationService;
    private final AuthService authService;

    @GetMapping("/donations")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<List<DonationResponse>> getNgoDonations() {
        User ngo = authService.getCurrentUser();
        return ResponseEntity.ok(donationService.getNgoDonations(ngo.getId()));
    }

    @PostMapping("/accept/{donationId}")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<DonationResponse> acceptDonation(@PathVariable Long donationId) {
        User ngo = authService.getCurrentUser();
        return ResponseEntity.ok(donationService.acceptDonation(donationId, ngo));
    }

    @PostMapping("/assign-volunteer/{donationId}")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<DonationResponse> assignVolunteer(
            @PathVariable Long donationId,
            @RequestParam Long volunteerId) {
        return ResponseEntity.ok(donationService.assignVolunteer(donationId, volunteerId));
    }

    @GetMapping("/volunteers")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<List<UserResponse>> getVolunteers() {
        return ResponseEntity.ok(authService.getUsersByRole("VOLUNTEER"));
    }
}
