package com.patientmonitoring.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "alerts")
@Data
@NoArgsConstructor
public class Alert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(name = "vital_type", nullable = false, length = 50)
    private String vitalType;

    @Column(name = "alert_message", nullable = false)
    private String alertMessage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Severity severity;

    @Column(name = "is_resolved", columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean isResolved = false;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
}
