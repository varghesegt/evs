package com.ecoshare.service;

import com.ecoshare.ai.FreshnessPredictor;
import com.ecoshare.ai.NgoRanker;
import com.ecoshare.ai.PriorityCalculator;
import com.ecoshare.dto.donation.CreateDonationRequest;
import com.ecoshare.dto.donation.DonationResponse;
import com.ecoshare.entity.*;
import com.ecoshare.enums.*;
import com.ecoshare.exception.ResourceNotFoundException;
import com.ecoshare.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DonationService {

    private final DonationRepository donationRepository;
    private final PickupRepository pickupRepository;
    private final UserRepository userRepository;
    private final NgoProfileRepository ngoProfileRepository;
    private final EnvironmentalImpactRepository impactRepository;
    private final FreshnessPredictor freshnessPredictor;
    private final PriorityCalculator priorityCalculator;
    private final NgoRanker ngoRanker;
    private final EnvironmentalImpactService impactService;

    @Transactional
    public DonationResponse createDonation(CreateDonationRequest request, User donor) {
        FoodCategory category = FoodCategory.valueOf(request.getFoodCategory().toUpperCase());
        LocalDateTime preparedAt = LocalDateTime.parse(request.getPreparedAt());

        // AI: Predict freshness and expiry
        double remainingHours = freshnessPredictor.predictRemainingHours(category, preparedAt);
        LocalDateTime expiresAt = freshnessPredictor.predictExpiryTime(category, preparedAt);

        // AI: Calculate priority
        int priority = priorityCalculator.calculatePriority(request.getQuantityKg(), category, preparedAt);

        Donation donation = Donation.builder()
                .donor(donor)
                .foodName(request.getFoodName())
                .foodCategory(category)
                .quantityKg(request.getQuantityKg())
                .description(request.getDescription())
                .packagingType(request.getPackagingType())
                .imageUrl(request.getImageUrl())
                .preparedAt(preparedAt)
                .expiresAt(expiresAt)
                .pickupAddress(request.getPickupAddress())
                .pickupLat(request.getPickupLat())
                .pickupLng(request.getPickupLng())
                .status(DonationStatus.VALIDATED)
                .priorityScore(priority)
                .freshnessHoursRemaining(remainingHours)
                .qrCode(UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .build();

        donation = donationRepository.save(donation);
        return mapToResponse(donation);
    }

    public List<DonationResponse> getDonorDonations(Long donorId) {
        return donationRepository.findByDonorIdOrderByCreatedAtDesc(donorId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<DonationResponse> getAvailableDonations() {
        List<DonationStatus> statuses = Arrays.asList(
                DonationStatus.VALIDATED, DonationStatus.MATCHED);
        return donationRepository.findAvailableDonationsWithLocation(statuses)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<DonationResponse> getAllDonations() {
        return donationRepository.findAll().stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    public DonationResponse getDonation(Long id) {
        Donation d = donationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Donation not found"));
        return mapToResponse(d);
    }

    @Transactional
    public DonationResponse acceptDonation(Long donationId, User ngoUser) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new ResourceNotFoundException("Donation not found"));

        donation.setStatus(DonationStatus.ACCEPTED);
        donationRepository.save(donation);

        Pickup pickup = Pickup.builder()
                .donation(donation)
                .ngo(ngoUser)
                .status(PickupStatus.ASSIGNED)
                .assignedAt(LocalDateTime.now())
                .build();
        pickupRepository.save(pickup);

        return mapToResponse(donation);
    }

    @Transactional
    public DonationResponse assignVolunteer(Long donationId, Long volunteerId) {
        Pickup pickup = pickupRepository.findByDonationId(donationId)
                .orElseThrow(() -> new ResourceNotFoundException("Pickup not found"));

        User volunteer = userRepository.findById(volunteerId)
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer not found"));

        pickup.setVolunteer(volunteer);
        pickup.setStatus(PickupStatus.ASSIGNED);
        pickupRepository.save(pickup);

        Donation donation = pickup.getDonation();
        donation.setStatus(DonationStatus.PICKUP_ASSIGNED);
        donationRepository.save(donation);

        return mapToResponse(donation);
    }

    @Transactional
    public DonationResponse markPickedUp(Long donationId, User volunteer) {
        Pickup pickup = pickupRepository.findByDonationId(donationId)
                .orElseThrow(() -> new ResourceNotFoundException("Pickup not found"));

        pickup.setStatus(PickupStatus.PICKED_UP);
        pickup.setPickedUpAt(LocalDateTime.now());
        pickupRepository.save(pickup);

        Donation donation = pickup.getDonation();
        donation.setStatus(DonationStatus.PICKED_UP);
        donationRepository.save(donation);

        return mapToResponse(donation);
    }

    @Transactional
    public DonationResponse markDelivered(Long donationId, User volunteer, String proofUrl) {
        Pickup pickup = pickupRepository.findByDonationId(donationId)
                .orElseThrow(() -> new ResourceNotFoundException("Pickup not found"));

        pickup.setStatus(PickupStatus.DELIVERED);
        pickup.setDeliveredAt(LocalDateTime.now());
        pickup.setDeliveryProofUrl(proofUrl);

        // Calculate route distance (simulated based on coordinates)
        Donation donation = pickup.getDonation();
        if (donation.getPickupLat() != null && pickup.getNgo().getLatitude() != null) {
            double dist = NgoRanker.haversineDistance(
                    donation.getPickupLat(), donation.getPickupLng(),
                    pickup.getNgo().getLatitude(), pickup.getNgo().getLongitude()
            );
            pickup.setRouteDistanceKm(Math.round(dist * 10.0) / 10.0);
        }
        pickupRepository.save(pickup);

        donation.setStatus(DonationStatus.DELIVERED);
        donationRepository.save(donation);

        // Calculate environmental impact
        impactService.calculateAndSave(donation, pickup);

        // Update NGO delivery count
        ngoProfileRepository.findByUserId(pickup.getNgo().getId()).ifPresent(profile -> {
            profile.setTotalDeliveries(profile.getTotalDeliveries() + 1);
            ngoProfileRepository.save(profile);
        });

        return mapToResponse(donation);
    }

    public List<DonationResponse> getVolunteerPickups(Long volunteerId) {
        return pickupRepository.findByVolunteerIdOrderByCreatedAtDesc(volunteerId)
                .stream()
                .map(p -> mapToResponse(p.getDonation()))
                .collect(Collectors.toList());
    }

    public List<DonationResponse> getVolunteerActivePickups(Long volunteerId) {
        List<PickupStatus> active = Arrays.asList(
                PickupStatus.ASSIGNED, PickupStatus.EN_ROUTE,
                PickupStatus.ARRIVED, PickupStatus.PICKED_UP, PickupStatus.DELIVERING);
        return pickupRepository.findByVolunteerIdAndStatusIn(volunteerId, active)
                .stream()
                .map(p -> mapToResponse(p.getDonation()))
                .collect(Collectors.toList());
    }

    public List<DonationResponse> getNgoDonations(Long ngoId) {
        return pickupRepository.findByNgoIdOrderByCreatedAtDesc(ngoId)
                .stream()
                .map(p -> mapToResponse(p.getDonation()))
                .collect(Collectors.toList());
    }

    private DonationResponse mapToResponse(Donation d) {
        DonationResponse.DonationResponseBuilder builder = DonationResponse.builder()
                .id(d.getId())
                .foodName(d.getFoodName())
                .foodCategory(d.getFoodCategory().name())
                .quantityKg(d.getQuantityKg())
                .description(d.getDescription())
                .packagingType(d.getPackagingType())
                .imageUrl(d.getImageUrl())
                .preparedAt(d.getPreparedAt() != null ? d.getPreparedAt().toString() : null)
                .expiresAt(d.getExpiresAt() != null ? d.getExpiresAt().toString() : null)
                .pickupAddress(d.getPickupAddress())
                .pickupLat(d.getPickupLat())
                .pickupLng(d.getPickupLng())
                .status(d.getStatus().name())
                .priorityScore(d.getPriorityScore())
                .freshnessHoursRemaining(d.getFreshnessHoursRemaining())
                .qrCode(d.getQrCode())
                .createdAt(d.getCreatedAt() != null ? d.getCreatedAt().toString() : null)
                .donorId(d.getDonor().getId())
                .donorName(d.getDonor().getName())
                .donorPhone(d.getDonor().getPhone())
                // AI Estimation Fields (Feature 1, 2, 3)
                .aiEstimatedMassKg(d.getAiEstimatedMassKg())
                .aiConfidenceScore(d.getAiConfidenceScore())
                .containerType(d.getContainerType())
                .actualConfirmedMassKg(d.getActualConfirmedMassKg())
                .estimationErrorPercent(d.getEstimationErrorPercent());

        pickupRepository.findByDonationId(d.getId()).ifPresent(pickup -> {
            builder.pickupId(pickup.getId())
                    .ngoName(pickup.getNgo().getName())
                    .pickupStatus(pickup.getStatus().name());
            if (pickup.getVolunteer() != null) {
                builder.volunteerName(pickup.getVolunteer().getName());
            }
        });

        return builder.build();
    }
}
