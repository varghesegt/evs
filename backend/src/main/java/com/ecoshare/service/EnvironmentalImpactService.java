package com.ecoshare.service;

import com.ecoshare.entity.Donation;
import com.ecoshare.entity.EnvironmentalImpact;
import com.ecoshare.entity.Pickup;
import com.ecoshare.repository.EnvironmentalImpactRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EnvironmentalImpactService {

    private final EnvironmentalImpactRepository impactRepository;

    // Conversion factors (research-backed averages)
    private static final double CO2E_PER_KG = 1.9;          // kg CO2e per kg food (production + landfill)
    private static final double WATER_PER_KG = 1400.0;      // liters per kg food (weighted average)
    private static final double FUEL_PER_KM = 0.12;         // liters diesel per km
    private static final double KG_PER_MEAL = 0.5;          // 500g per meal average

    @Transactional
    public EnvironmentalImpact calculateAndSave(Donation donation, Pickup pickup) {
        double foodKg = donation.getQuantityKg();
        double distanceKm = pickup.getRouteDistanceKm() != null ? pickup.getRouteDistanceKm() : 0;

        EnvironmentalImpact impact = EnvironmentalImpact.builder()
                .donation(donation)
                .foodRescuedKg(foodKg)
                .mealsSupported((int) Math.ceil(foodKg / KG_PER_MEAL))
                .co2eAvoidedKg(round(foodKg * CO2E_PER_KG))
                .waterSavedLiters(round(foodKg * WATER_PER_KG))
                .fuelSavedLiters(round(distanceKm * FUEL_PER_KM))
                .landfillPreventedKg(foodKg)
                .build();

        return impactRepository.save(impact);
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
