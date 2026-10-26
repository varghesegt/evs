package com.ecoshare.service;

import com.ecoshare.dto.haccp.HaccpTelemetryRequest;
import com.ecoshare.dto.haccp.HaccpTelemetryResponse;
import com.ecoshare.entity.Donation;
import com.ecoshare.entity.HaccpTelemetryLog;
import com.ecoshare.entity.Pickup;
import com.ecoshare.enums.DonationStatus;
import com.ecoshare.enums.PickupStatus;
import com.ecoshare.repository.DonationRepository;
import com.ecoshare.repository.HaccpTelemetryRepository;
import com.ecoshare.repository.PickupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HaccpService {

    private final HaccpTelemetryRepository haccpRepository;
    private final DonationRepository donationRepository;
    private final PickupRepository pickupRepository;

    // FDA / WHO HACCP Danger Zone: 5°C to 60°C for perishable cooked food holding
    private static final double MIN_SAFE_HOT_HOLDING_C = 55.0; // Hot holding should stay >= 55°C
    private static final double MAX_SAFE_COLD_HOLDING_C = 6.0;  // Chilled holding should stay <= 6°C
    private static final double CRITICAL_SPOILAGE_MAX_C = 42.0; // Extreme rapid bacterial proliferation threshold

    @Transactional
    public HaccpTelemetryResponse logAndEvaluate(HaccpTelemetryRequest req) {
        Donation donation = donationRepository.findById(req.getDonationId()).orElse(null);
        Pickup pickup = req.getPickupId() != null 
                ? pickupRepository.findById(req.getPickupId()).orElse(null) 
                : (donation != null ? pickupRepository.findByDonationId(donation.getId()).orElse(null) : null);

        double temp = req.getTemperatureCelsius();
        boolean isDanger = (temp > MAX_SAFE_COLD_HOLDING_C && temp < MIN_SAFE_HOT_HOLDING_C);
        boolean tripTriggered = false;
        String notes = "Normal cold-chain operating parameters.";
        String rerouteName = null;
        String rerouteAddr = null;
        Double rerouteLat = null;
        Double rerouteLng = null;

        // Check recent history to see if danger zone has persisted
        List<HaccpTelemetryLog> previous = haccpRepository.findByDonationIdOrderByRecordedAtAsc(req.getDonationId());
        long recentDangerCount = previous.stream()
                .skip(Math.max(0, previous.size() - 2))
                .filter(l -> Boolean.TRUE.equals(l.getIsDangerZone()))
                .count();

        // If high ambient spoilage threshold breached (> 42°C) or sustained danger zone for 3 readings
        if (temp >= CRITICAL_SPOILAGE_MAX_C || (isDanger && recentDangerCount >= 2)) {
            tripTriggered = true;
            notes = "HACCP VIOLATION: Thermal danger zone exceeded threshold (" + temp + "°C). Automatic biohazard safety trip triggered.";
            rerouteName = "Ariyamangalam Municipal Bio-Digestion & Composting Depot";
            rerouteAddr = "Thanjavur Main Road, Ariyamangalam, Trichy - 620010";
            rerouteLat = 10.7980;
            rerouteLng = 78.7180;

            if (donation != null && donation.getStatus() != DonationStatus.DELIVERED) {
                donation.setStatus(DonationStatus.BIO_DIVERTED);
                donationRepository.save(donation);
            }
            if (pickup != null && pickup.getStatus() != PickupStatus.DELIVERED) {
                pickup.setStatus(PickupStatus.DIVERTED_TO_COMPOST);
                pickupRepository.save(pickup);
            }
        } else if (isDanger) {
            notes = "WARNING: Current temperature (" + temp + "°C) in HACCP Danger Zone (5°C-55°C). Monitor closely.";
        }

        HaccpTelemetryLog logEntry = HaccpTelemetryLog.builder()
                .donationId(req.getDonationId())
                .pickup(pickup)
                .deviceId(req.getDeviceId() != null ? req.getDeviceId() : "BLE-BEACON-DEFAULT")
                .temperatureCelsius(temp)
                .humidityPercent(req.getHumidityPercent())
                .latitude(req.getLatitude())
                .longitude(req.getLongitude())
                .isDangerZone(isDanger)
                .safetyTripTriggered(tripTriggered)
                .safetyNotes(notes)
                .build();

        haccpRepository.save(logEntry);

        // Fetch complete history
        List<HaccpTelemetryLog> allHistory = haccpRepository.findByDonationIdOrderByRecordedAtAsc(req.getDonationId());
        List<HaccpTelemetryResponse.TelemetryPoint> points = allHistory.stream()
                .map(h -> HaccpTelemetryResponse.TelemetryPoint.builder()
                        .temp(h.getTemperatureCelsius())
                        .humidity(h.getHumidityPercent())
                        .dangerZone(h.getIsDangerZone())
                        .timestamp(h.getRecordedAt() != null ? h.getRecordedAt().format(DateTimeFormatter.ofPattern("HH:mm:ss")) : "")
                        .build())
                .collect(Collectors.toList());

        return HaccpTelemetryResponse.builder()
                .donationId(req.getDonationId())
                .pickupId(pickup != null ? pickup.getId() : null)
                .deviceId(logEntry.getDeviceId())
                .currentTemperature(temp)
                .currentHumidity(req.getHumidityPercent())
                .isDangerZone(isDanger)
                .safetyTripTriggered(tripTriggered)
                .statusMessage(notes)
                .rerouteFacilityName(rerouteName)
                .rerouteAddress(rerouteAddr)
                .rerouteLat(rerouteLat)
                .rerouteLng(rerouteLng)
                .history(points)
                .build();
    }

    public HaccpTelemetryResponse getTelemetryHistory(Long donationId) {
        List<HaccpTelemetryLog> list = haccpRepository.findByDonationIdOrderByRecordedAtAsc(donationId);
        if (list.isEmpty()) {
            return HaccpTelemetryResponse.builder()
                    .donationId(donationId)
                    .currentTemperature(22.0)
                    .currentHumidity(55.0)
                    .isDangerZone(false)
                    .safetyTripTriggered(false)
                    .statusMessage("No live telemetry received yet. BLE beacon in standby mode.")
                    .history(List.of())
                    .build();
        }

        HaccpTelemetryLog latest = list.get(list.size() - 1);
        List<HaccpTelemetryResponse.TelemetryPoint> points = list.stream()
                .map(h -> HaccpTelemetryResponse.TelemetryPoint.builder()
                        .temp(h.getTemperatureCelsius())
                        .humidity(h.getHumidityPercent())
                        .dangerZone(h.getIsDangerZone())
                        .timestamp(h.getRecordedAt() != null ? h.getRecordedAt().format(DateTimeFormatter.ofPattern("HH:mm:ss")) : "")
                        .build())
                .collect(Collectors.toList());

        return HaccpTelemetryResponse.builder()
                .donationId(donationId)
                .pickupId(latest.getPickup() != null ? latest.getPickup().getId() : null)
                .deviceId(latest.getDeviceId())
                .currentTemperature(latest.getTemperatureCelsius())
                .currentHumidity(latest.getHumidityPercent())
                .isDangerZone(latest.getIsDangerZone())
                .safetyTripTriggered(latest.getSafetyTripTriggered())
                .statusMessage(latest.getSafetyNotes())
                .history(points)
                .build();
    }
}
