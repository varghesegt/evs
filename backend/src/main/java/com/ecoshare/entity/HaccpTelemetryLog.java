package com.ecoshare.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "haccp_telemetry_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HaccpTelemetryLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pickup_id")
    private Pickup pickup;

    @Column(nullable = false)
    private Long donationId;

    @Column(nullable = false)
    private String deviceId;

    @Column(nullable = false)
    private Double temperatureCelsius;

    @Column(nullable = false)
    private Double humidityPercent;

    private Double latitude;
    private Double longitude;

    private Boolean isDangerZone;
    private Boolean safetyTripTriggered;
    private String safetyNotes;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime recordedAt;
}
