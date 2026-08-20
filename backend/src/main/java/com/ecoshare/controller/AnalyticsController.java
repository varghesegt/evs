package com.ecoshare.controller;

import com.ecoshare.dto.analytics.DashboardStats;
import com.ecoshare.dto.analytics.EnvironmentalSummary;
import com.ecoshare.dto.analytics.EvsCertificateResponse;
import com.ecoshare.dto.analytics.MapPinResponse;
import com.ecoshare.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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
}
