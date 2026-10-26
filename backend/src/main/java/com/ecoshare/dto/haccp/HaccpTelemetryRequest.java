package com.ecoshare.dto.haccp;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HaccpTelemetryRequest {
    private Long donationId;
    private Long pickupId;
    private String deviceId;
    private Double temperatureCelsius;
    private Double humidityPercent;
    private Double latitude;
    private Double longitude;
}
