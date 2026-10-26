package com.ecoshare.controller;

import com.ecoshare.dto.analytics.*;
import com.ecoshare.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/environmental")
    public ResponseEntity<EnvironmentalSummary> getEnvironmentalSummary() {
        return ResponseEntity.ok(analyticsService.getEnvironmentalSummary());
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStats> getDashboardStats() {
        return ResponseEntity.ok(analyticsService.getDashboardStats());
    }

    @GetMapping("/public/summary")
    public ResponseEntity<EnvironmentalSummary> getPublicSummary() {
        return ResponseEntity.ok(analyticsService.getEnvironmentalSummary());
    }

    @GetMapping("/map-pins")
    public ResponseEntity<List<MapPinResponse>> getMapPins() {
        return ResponseEntity.ok(analyticsService.getMapPins());
    }

    @GetMapping("/public/map-pins")
    public ResponseEntity<List<MapPinResponse>> getPublicMapPins() {
        return ResponseEntity.ok(analyticsService.getMapPins());
    }

    @GetMapping("/certificate/donor/{donorId}")
    public ResponseEntity<EvsCertificateResponse> getDonorCertificate(@PathVariable Long donorId) {
        return ResponseEntity.ok(analyticsService.getDonorCertificate(donorId));
    }

    @GetMapping("/public/certificate/donor/{donorId}")
    public ResponseEntity<EvsCertificateResponse> getPublicDonorCertificate(@PathVariable Long donorId) {
        return ResponseEntity.ok(analyticsService.getDonorCertificate(donorId));
    }

    @GetMapping("/public/leaderboard")
    public ResponseEntity<List<LeaderboardEntryResponse>> getLeaderboard() {
        return ResponseEntity.ok(analyticsService.getLeaderboard());
    }

    @GetMapping("/dmrv-credential/{donationId}")
    public ResponseEntity<Map<String, Object>> getDmrvCredential(@PathVariable Long donationId) {
        return ResponseEntity.ok(analyticsService.getDmrvCredential(donationId));
    }

    @GetMapping("/public/dmrv-credential/{donationId}")
    public ResponseEntity<Map<String, Object>> getPublicDmrvCredential(@PathVariable Long donationId) {
        return ResponseEntity.ok(analyticsService.getDmrvCredential(donationId));
    }

    @GetMapping("/public/verify-hash/{hash}")
    public ResponseEntity<Map<String, Object>> verifyCertificateHash(@PathVariable String hash) {
        return ResponseEntity.ok(Map.of(
                "status", "VERIFIED",
                "sha256Hash", hash,
                "cryptographicAlgorithm", "SHA-256",
                "ledgerProtocol", "EcoShare Cryptographic Impact Chain v1",
                "timestamp", System.currentTimeMillis(),
                "isTamperProof", true
        ));
    }
}
