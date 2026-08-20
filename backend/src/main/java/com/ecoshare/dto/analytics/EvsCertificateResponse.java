package com.ecoshare.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvsCertificateResponse {
    private Long donorId;
    private String donorName;
    private String organizationName;
    private Double totalFoodRescuedKg;
    private Double totalCo2eAvoidedKg;
    private Double totalWaterSavedLiters;
    private Double totalLandfillPreventedKg;
    private Long totalMealsSupported;
    private Double treesPlantedEquivalency;
    private Double carKmNegatedEquivalency;
    private Double electricityHoursEquivalency;
    private String certificateCode;
    private String issueDate;
    private String sha256Hash;
    private String verificationUrl;
}
