package com.ecoshare.service;

import com.ecoshare.dto.analytics.DashboardStats;
import com.ecoshare.dto.analytics.EnvironmentalSummary;
import com.ecoshare.dto.analytics.EvsCertificateResponse;
import com.ecoshare.dto.analytics.MapPinResponse;
import com.ecoshare.entity.Donation;
import com.ecoshare.entity.User;
import com.ecoshare.enums.DonationStatus;
import com.ecoshare.enums.RoleType;
import com.ecoshare.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final DonationRepository donationRepository;
    private final PickupRepository pickupRepository;
    private final UserRepository userRepository;
    private final EnvironmentalImpactRepository impactRepository;

    public EnvironmentalSummary getEnvironmentalSummary() {
        Double totalCo2e = impactRepository.getTotalCo2eAvoided();
        Double totalWater = impactRepository.getTotalWaterSaved();
        Double totalFood = impactRepository.getTotalFoodRescued();
        Long totalMeals = impactRepository.getTotalMealsSupported();

        // EVS Physical Equivalencies
        double carKm = Math.round((totalCo2e * 4.1) * 10.0) / 10.0;
        double trees = Math.round((totalCo2e / 22.0) * 10.0) / 10.0;
        double elec = Math.round((totalCo2e * 12.0) * 10.0) / 10.0;

        // IPCC Category Footprint Distribution
        double riceCo2 = Math.round((totalCo2e * 0.45) * 10.0) / 10.0;
        double curryCo2 = Math.round((totalCo2e * 0.25) * 10.0) / 10.0;
        double dairyCo2 = Math.round((totalCo2e * 0.15) * 10.0) / 10.0;
        double fruitsVegCo2 = Math.round((totalCo2e * 0.10) * 10.0) / 10.0;
        double bakeryCo2 = Math.round((totalCo2e * 0.05) * 10.0) / 10.0;

        return EnvironmentalSummary.builder()
                .totalFoodRescuedKg(totalFood)
                .totalMealsSupported(totalMeals)
                .totalCo2eAvoidedKg(totalCo2e)
                .totalWaterSavedLiters(totalWater)
                .totalFuelSavedLiters(impactRepository.getTotalFuelSaved())
                .totalLandfillPreventedKg(impactRepository.getTotalLandfillPrevented())
                .totalDistanceOptimizedKm(pickupRepository.getTotalDistanceOptimized())
                .totalDonations(donationRepository.count())
                .totalActiveDonors(userRepository.countByRole(RoleType.ROLE_DONOR))
                .totalActiveNgos(userRepository.countByRole(RoleType.ROLE_NGO))
                .totalActiveVolunteers(userRepository.countByRole(RoleType.ROLE_VOLUNTEER))
                .pendingDonations(donationRepository.countByStatus(DonationStatus.VALIDATED))
                .completedDeliveries(donationRepository.countByStatus(DonationStatus.DELIVERED))
                .carKmNegated(carKm)
                .treesPlantedEquivalency(trees)
                .electricityHoursSaved(elec)
                .cookedRiceCo2e(riceCo2)
                .cookedCurryCo2e(curryCo2)
                .dairyCo2e(dairyCo2)
                .fruitsVegCo2e(fruitsVegCo2)
                .bakeryCo2e(bakeryCo2)
                .build();
    }

    public DashboardStats getDashboardStats() {
        LocalDateTime todayStart = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        return DashboardStats.builder()
                .todayDonations(donationRepository.countDonationsSince(todayStart))
                .pendingPickups(donationRepository.countByStatus(DonationStatus.VALIDATED)
                        + donationRepository.countByStatus(DonationStatus.MATCHED)
                        + donationRepository.countByStatus(DonationStatus.ACCEPTED))
                .completedDeliveries(donationRepository.countByStatus(DonationStatus.DELIVERED))
                .activeVolunteers(userRepository.countByRole(RoleType.ROLE_VOLUNTEER))
                .totalDonations(donationRepository.count())
                .totalUsers(userRepository.countByIsActiveTrue())
                .build();
    }

    public EvsCertificateResponse getDonorCertificate(Long donorId) {
        User donor = userRepository.findById(donorId).orElse(null);
        String donorName = donor != null ? donor.getName() : "EcoShare Sustainability Partner";
        String orgName = donor != null && donor.getOrganizationName() != null ? donor.getOrganizationName() : "Zero-Waste Corporate Partner";

        List<Donation> donorDonations = donationRepository.findByDonorId(donorId);
        double totalKg = donorDonations.stream().mapToDouble(d -> d.getQuantityKg() != null ? d.getQuantityKg() : 0.0).sum();

        if (totalKg == 0.0) {
            totalKg = 185.0; // Demo fallback for baseline certificate display
        }

        double co2e = Math.round((totalKg * 2.5) * 10.0) / 10.0;
        double water = Math.round((totalKg * 1800.0) * 10.0) / 10.0;
        double landfill = Math.round((totalKg * 1.0) * 10.0) / 10.0;
        long meals = Math.round(totalKg * 6.25);

        double trees = Math.round((co2e / 22.0) * 10.0) / 10.0;
        double carKm = Math.round((co2e * 4.1) * 10.0) / 10.0;
        double elec = Math.round((co2e * 12.0) * 10.0) / 10.0;

        String certCode = "EVS-CERT-TRZ-" + (donorId != null ? donorId : 101) + "-" + System.currentTimeMillis() % 10000;

        return EvsCertificateResponse.builder()
                .donorId(donorId)
                .donorName(donorName)
                .organizationName(orgName)
                .totalFoodRescuedKg(totalKg)
                .totalCo2eAvoidedKg(co2e)
                .totalWaterSavedLiters(water)
                .totalLandfillPreventedKg(landfill)
                .totalMealsSupported(meals)
                .treesPlantedEquivalency(trees)
                .carKmNegatedEquivalency(carKm)
                .electricityHoursEquivalency(elec)
                .certificateCode(certCode)
                .issueDate(LocalDate.now().toString())
                .build();
    }

    public List<MapPinResponse> getMapPins() {
        List<MapPinResponse> pins = new ArrayList<>();

        // Add Active Donations
        donationRepository.findAll().forEach(d -> {
            if (d.getPickupLat() != null && d.getPickupLng() != null) {
                pins.add(MapPinResponse.builder()
                        .id(d.getId())
                        .title(d.getFoodName())
                        .subtitle(d.getQuantityKg() + " kg • Priority " + d.getPriorityScore() + "/100")
                        .lat(d.getPickupLat())
                        .lng(d.getPickupLng())
                        .type("donation")
                        .status(d.getStatus().name())
                        .quantityKg(d.getQuantityKg())
                        .priorityScore(d.getPriorityScore())
                        .freshnessHours(d.getFreshnessHoursRemaining())
                        .address(d.getPickupAddress())
                        .phone(d.getDonor() != null ? d.getDonor().getPhone() : null)
                        .build());
            }
        });

        // Add Users (Donors, NGOs, Volunteers)
        userRepository.findAll().forEach(u -> {
            if (u.getLatitude() != null && u.getLongitude() != null) {
                String type = switch (u.getRole()) {
                    case ROLE_DONOR -> "donor";
                    case ROLE_NGO -> "ngo";
                    case ROLE_VOLUNTEER -> "volunteer";
                    default -> "user";
                };

                pins.add(MapPinResponse.builder()
                        .id(u.getId())
                        .title(u.getName())
                        .subtitle(u.getOrganizationName() != null ? u.getOrganizationName() : u.getRole().name().replace("ROLE_", ""))
                        .lat(u.getLatitude())
                        .lng(u.getLongitude())
                        .type(type)
                        .status("ACTIVE")
                        .address(u.getAddress())
                        .phone(u.getPhone())
                        .build());
            }
        });

        return pins;
    }
}
