package com.ecoshare.service;

import com.ecoshare.dto.ai.SurgeStatusResponse;
import com.ecoshare.dto.ai.SurgeStatusResponse.CodeRedBatchDto;
import com.ecoshare.dto.ai.SurgeStatusResponse.EmergencyCourierDto;
import com.ecoshare.entity.Donation;
import com.ecoshare.entity.User;
import com.ecoshare.enums.DonationStatus;
import com.ecoshare.enums.RoleType;
import com.ecoshare.repository.DonationRepository;
import com.ecoshare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SurgeEscalationService {

    private final DonationRepository donationRepository;
    private final UserRepository userRepository;

    public SurgeStatusResponse evaluateSurgeStatus() {
        double ambientTemp = 34.0; // Trichy ambient afternoon reading in Celsius
        List<DonationStatus> activeStatuses = Arrays.asList(
                DonationStatus.PENDING,
                DonationStatus.ACCEPTED,
                DonationStatus.PICKUP_ASSIGNED
        );

        List<Donation> activeDonations = donationRepository.findByStatusInOrderByPriorityScoreDesc(activeStatuses);
        List<User> volunteers = userRepository.findByRole(RoleType.ROLE_VOLUNTEER);

        List<CodeRedBatchDto> criticalBatches = new ArrayList<>();
        int codeRedCount = 0;
        int elevatedCount = 0;

        for (Donation d : activeDonations) {
            double freshness = d.getFreshnessHoursRemaining() != null ? d.getFreshnessHoursRemaining() : 4.0;
            
            // Kinetic degradation factor (Arrhenius ambient acceleration for Trichy heat)
            double kineticFactor = switch (d.getFoodCategory() != null ? d.getFoodCategory().name() : "COOKED_MEALS") {
                case "COOKED_MEALS" -> 1.30;
                case "DAIRY" -> 1.55;
                case "PRODUCE" -> 0.90;
                case "BAKERY" -> 1.10;
                default -> 1.0;
            };

            double effectiveRemainingHours = Math.max(0.5, Math.round((freshness / kineticFactor) * 10.0) / 10.0);
            int dynamicPriority = Math.min(100, (int) Math.round(100.0 - (effectiveRemainingHours * 14.0)));

            boolean isCodeRed = effectiveRemainingHours <= 2.8 || dynamicPriority >= 80;
            boolean isElevated = !isCodeRed && (effectiveRemainingHours <= 4.2 || dynamicPriority >= 60);

            if (isCodeRed) codeRedCount++;
            if (isElevated) elevatedCount++;

            if (isCodeRed || isElevated) {
                // Find top emergency courier candidates near donation pickup
                List<EmergencyCourierDto> courierCandidates = findCandidateCouriers(d, volunteers);

                String actionText = isCodeRed
                        ? "CRITICAL: Urgent dispatch required within 30 mins to prevent spoilage."
                        : "ELEVATED: Pre-match available couriers and reserve thermal totes.";

                String whatsAppBroadcast = buildWhatsAppSurgeText(d, effectiveRemainingHours, dynamicPriority);

                criticalBatches.add(CodeRedBatchDto.builder()
                        .donationId(d.getId())
                        .foodName(d.getFoodName())
                        .category(d.getFoodCategory() != null ? d.getFoodCategory().name() : "COOKED_MEALS")
                        .quantityKg(d.getQuantityKg())
                        .freshnessHoursRemaining(effectiveRemainingHours)
                        .dynamicPriorityScore(dynamicPriority)
                        .isCodeRed(isCodeRed)
                        .pickupAddress(d.getPickupAddress())
                        .pickupLat(d.getPickupLat())
                        .pickupLng(d.getPickupLng())
                        .donorOrganization(d.getDonor() != null && d.getDonor().getOrganizationName() != null
                                ? d.getDonor().getOrganizationName()
                                : (d.getDonor() != null ? d.getDonor().getName() : "Corporate Donor"))
                        .donorPhone(d.getDonor() != null ? d.getDonor().getPhone() : "9443100001")
                        .recommendedAction(actionText)
                        .candidateCouriers(courierCandidates)
                        .whatsAppBroadcastUrl(whatsAppBroadcast)
                        .build());
            }
        }

        criticalBatches.sort((a, b) -> Integer.compare(b.getDynamicPriorityScore(), a.getDynamicPriorityScore()));

        boolean activeSurgeAlert = codeRedCount > 0;
        String alertHeadline = activeSurgeAlert
                ? "CODE RED SURGE: " + codeRedCount + " Perishable Food Batch" + (codeRedCount > 1 ? "es" : "") + " Expiring in Trichy Corridor"
                : elevatedCount > 0
                ? "Elevated Monitoring: " + elevatedCount + " Batch" + (elevatedCount > 1 ? "es" : "") + " Approaching Critical Shelf-Life"
                : "All Food Rescue Operations Operating Within Safe Perishability Windows";

        return SurgeStatusResponse.builder()
                .totalPendingBatches(activeDonations.size())
                .codeRedCount(codeRedCount)
                .elevatedCount(elevatedCount)
                .activeSurgeAlert(activeSurgeAlert)
                .ambientTemperatureC(ambientTemp)
                .alertHeadline(alertHeadline)
                .criticalBatches(criticalBatches)
                .build();
    }

    public Map<String, Object> triggerEmergencyBroadcast(Long donationId) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new RuntimeException("Donation not found: " + donationId));

        donation.setPriorityScore(99);
        donationRepository.save(donation);

        List<User> volunteers = userRepository.findByRole(RoleType.ROLE_VOLUNTEER);
        List<EmergencyCourierDto> couriers = findCandidateCouriers(donation, volunteers);

        String broadcastMsg = buildWhatsAppSurgeText(donation, 1.8, 99);

        log.info("Triggered emergency broadcast for Donation ID {} across {} volunteer couriers", donationId, couriers.size());

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("donationId", donationId);
        result.put("foodName", donation.getFoodName());
        result.put("elevatedPriorityScore", 99);
        result.put("alertBroadcastCount", couriers.size());
        result.put("notifiedCouriers", couriers);
        result.put("whatsAppBroadcastUrl", broadcastMsg);
        result.put("timestamp", new Date());

        return result;
    }

    private List<EmergencyCourierDto> findCandidateCouriers(Donation d, List<User> volunteers) {
        double pLat = d.getPickupLat() != null ? d.getPickupLat() : 10.8030;
        double pLng = d.getPickupLng() != null ? d.getPickupLng() : 78.6850;

        List<EmergencyCourierDto> list = new ArrayList<>();
        for (int i = 0; i < volunteers.size(); i++) {
            User v = volunteers.get(i);
            double vLat = v.getLatitude() != null ? v.getLatitude() : 10.7980;
            double vLng = v.getLongitude() != null ? v.getLongitude() : 78.6820;

            String vehicleType = switch (i % 3) {
                case 0 -> "ELECTRIC_CARGO";
                case 1 -> "REFRIGERATED_VAN";
                default -> "TWO_WHEELER";
            };
            double capacityKg = vehicleType.equals("REFRIGERATED_VAN") ? 200.0 : vehicleType.equals("ELECTRIC_CARGO") ? 100.0 : 35.0;

            double dist = calculateDistanceKm(pLat, pLng, vLat, vLng);
            int etaMins = (int) Math.max(5, Math.round(dist * 3.5));

            list.add(EmergencyCourierDto.builder()
                    .volunteerId(v.getId())
                    .name(v.getName())
                    .phone(v.getPhone() != null ? v.getPhone() : "9443100030")
                    .vehicleType(vehicleType.replace("_", " "))
                    .capacityKg(capacityKg)
                    .distanceKm(Math.round(dist * 10.0) / 10.0)
                    .etaMinutes(etaMins)
                    .build());
        }

        list.sort(Comparator.comparingDouble(EmergencyCourierDto::getDistanceKm));
        return list.stream().limit(3).collect(Collectors.toList());
    }

    private double calculateDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return 6371.0 * c;
    }

    private String buildWhatsAppSurgeText(Donation d, double remainingHours, int priority) {
        String pLat = String.valueOf(d.getPickupLat() != null ? d.getPickupLat() : 10.8030);
        String pLng = String.valueOf(d.getPickupLng() != null ? d.getPickupLng() : 78.6850);
        String gmapsUrl = "https://www.google.com/maps/dir/?api=1&destination=" + pLat + "," + pLng;

        String msg = "🚨 *ECOSHARE EMERGENCY CODE-RED SURGE BROADCAST* 🚨\n"
                + "━━━━━━━━━━━━━━━━━━━━━\n"
                + "⚠️ *URGENT FOOD RESCUE IN TRICHY CORRIDOR*\n"
                + "🍲 *Batch:* " + d.getFoodName() + " (" + d.getQuantityKg() + " kg)\n"
                + "⏳ *Remaining Safe Window:* " + remainingHours + " Hours Remaining\n"
                + "🔥 *Priority Score:* " + priority + "/100 [EXPIRING SOON]\n"
                + "📍 *Pickup Location:* " + (d.getPickupAddress() != null ? d.getPickupAddress() : "Cantonment, Trichy") + "\n"
                + "🧭 *Direct Google Maps Turn-by-Turn GPS:*\n" + gmapsUrl + "\n"
                + "━━━━━━━━━━━━━━━━━━━━━\n"
                + "Reply with YES to claim this emergency rescue mission immediately.";

        return "https://api.whatsapp.com/send?text=" + URLEncoder.encode(msg, StandardCharsets.UTF_8);
    }
}
