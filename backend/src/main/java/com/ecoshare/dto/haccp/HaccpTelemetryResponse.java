package com.ecoshare.dto.haccp;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HaccpTelemetryResponse {
    private Long donationId;
    private Long pickupId;
    private String deviceId;
    private Double currentTemperature;
    private Double currentHumidity;
    private Boolean isDangerZone;
    private Boolean safetyTripTriggered;
    private String statusMessage;
    private String rerouteFacilityName;
    private String rerouteAddress;
    private Double rerouteLat;
    private Double rerouteLng;
    private List<TelemetryPoint> history;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TelemetryPoint {
        private Double temp;
        private Double humidity;
        private Boolean dangerZone;
        private String timestamp;
    }
}
