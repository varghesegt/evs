package com.ecoshare.repository;

import com.ecoshare.entity.Pickup;
import com.ecoshare.enums.PickupStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PickupRepository extends JpaRepository<Pickup, Long> {

    List<Pickup> findByNgoIdOrderByCreatedAtDesc(Long ngoId);

    List<Pickup> findByVolunteerIdOrderByCreatedAtDesc(Long volunteerId);

    List<Pickup> findByVolunteerIdAndStatusIn(Long volunteerId, List<PickupStatus> statuses);

    Optional<Pickup> findByDonationId(Long donationId);

    long countByStatus(PickupStatus status);

    long countByNgoId(Long ngoId);

    long countByVolunteerId(Long volunteerId);

    @Query("SELECT COALESCE(SUM(p.routeDistanceKm), 0) FROM Pickup p WHERE p.status = 'DELIVERED'")
    Double getTotalDistanceOptimized();

    List<Pickup> findByStatus(PickupStatus status);
}
