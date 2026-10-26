package com.ecoshare.controller;

import com.ecoshare.dto.haccp.HaccpTelemetryRequest;
import com.ecoshare.dto.haccp.HaccpTelemetryResponse;
import com.ecoshare.service.HaccpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/haccp")
@RequiredArgsConstructor
public class HaccpController {

    private final HaccpService haccpService;

    @PostMapping("/log-telemetry")
    public ResponseEntity<HaccpTelemetryResponse> logTelemetry(@RequestBody HaccpTelemetryRequest request) {
        return ResponseEntity.ok(haccpService.logAndEvaluate(request));
    }

    @GetMapping("/telemetry/{donationId}")
    public ResponseEntity<HaccpTelemetryResponse> getTelemetry(@PathVariable Long donationId) {
        return ResponseEntity.ok(haccpService.getTelemetryHistory(donationId));
    }
}
