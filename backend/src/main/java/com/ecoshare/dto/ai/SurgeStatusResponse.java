package com.ecoshare.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SurgeStatusResponse {
    private int totalPendingBatches;
    private int codeRedCount;
    private int elevatedCount;
    private boolean activeSurgeAlert;
    private double ambientTemperatureC;
    private String alertHeadline;
    private List<CodeRedBatchDto> criticalBatches;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CodeRedBatchDto {
        private Long donationId;
        private String foodName;
        private String category;
        private Double quantityKg;
        private Double freshnessHoursRemaining;
        private Integer dynamicPriorityScore;
        private boolean isCodeRed;
        private String pickupAddress;
        private Double pickupLat;
        private Double pickupLng;
        private String donorOrganization;
        private String donorPhone;
        private String recommendedAction;
        private List<EmergencyCourierDto> candidateCouriers;
        private String whatsAppBroadcastUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmergencyCourierDto {
        private Long volunteerId;
        private String name;
        private String phone;
        private String vehicleType;
        private Double capacityKg;
        private Double distanceKm;
        private Integer etaMinutes;
    }
}
