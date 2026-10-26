package com.ecoshare.repository;

import com.ecoshare.entity.HaccpTelemetryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HaccpTelemetryRepository extends JpaRepository<HaccpTelemetryLog, Long> {
    List<HaccpTelemetryLog> findByDonationIdOrderByRecordedAtAsc(Long donationId);
    List<HaccpTelemetryLog> findByPickupIdOrderByRecordedAtAsc(Long pickupId);
    List<HaccpTelemetryLog> findBySafetyTripTriggeredTrueOrderByRecordedAtDesc();
}
