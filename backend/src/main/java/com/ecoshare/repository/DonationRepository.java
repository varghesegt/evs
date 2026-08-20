package com.ecoshare.repository;

import com.ecoshare.entity.Donation;
import com.ecoshare.enums.DonationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DonationRepository extends JpaRepository<Donation, Long> {

    List<Donation> findByDonorId(Long donorId);

    List<Donation> findByDonorIdOrderByCreatedAtDesc(Long donorId);

    List<Donation> findByStatusOrderByPriorityScoreDesc(DonationStatus status);

    List<Donation> findByStatusInOrderByPriorityScoreDesc(List<DonationStatus> statuses);

    @Query("SELECT d FROM Donation d WHERE d.status IN :statuses " +
           "AND d.pickupLat IS NOT NULL AND d.pickupLng IS NOT NULL " +
           "ORDER BY d.priorityScore DESC")
    List<Donation> findAvailableDonationsWithLocation(@Param("statuses") List<DonationStatus> statuses);

    long countByStatus(DonationStatus status);

    long countByDonorId(Long donorId);

    @Query("SELECT COALESCE(SUM(d.quantityKg), 0) FROM Donation d WHERE d.status = 'DELIVERED'")
    Double getTotalFoodRescued();

    @Query("SELECT COUNT(d) FROM Donation d WHERE d.createdAt >= :since")
    long countDonationsSince(@Param("since") LocalDateTime since);

    @Query("SELECT d FROM Donation d WHERE d.createdAt >= :since ORDER BY d.createdAt DESC")
    List<Donation> findDonationsSince(@Param("since") LocalDateTime since);

    List<Donation> findByDonorIdAndStatus(Long donorId, DonationStatus status);
}
