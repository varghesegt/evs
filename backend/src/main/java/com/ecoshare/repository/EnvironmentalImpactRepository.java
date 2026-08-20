package com.ecoshare.repository;

import com.ecoshare.entity.EnvironmentalImpact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EnvironmentalImpactRepository extends JpaRepository<EnvironmentalImpact, Long> {

    Optional<EnvironmentalImpact> findByDonationId(Long donationId);

    @Query("SELECT COALESCE(SUM(e.foodRescuedKg), 0) FROM EnvironmentalImpact e")
    Double getTotalFoodRescued();

    @Query("SELECT COALESCE(SUM(e.mealsSupported), 0) FROM EnvironmentalImpact e")
    Long getTotalMealsSupported();

    @Query("SELECT COALESCE(SUM(e.co2eAvoidedKg), 0) FROM EnvironmentalImpact e")
    Double getTotalCo2eAvoided();

    @Query("SELECT COALESCE(SUM(e.waterSavedLiters), 0) FROM EnvironmentalImpact e")
    Double getTotalWaterSaved();

    @Query("SELECT COALESCE(SUM(e.fuelSavedLiters), 0) FROM EnvironmentalImpact e")
    Double getTotalFuelSaved();

    @Query("SELECT COALESCE(SUM(e.landfillPreventedKg), 0) FROM EnvironmentalImpact e")
    Double getTotalLandfillPrevented();
}
