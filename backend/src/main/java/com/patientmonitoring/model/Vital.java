package com.patientmonitoring.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "vitals")
@Data
@NoArgsConstructor
public class Vital {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(name = "heart_rate")
    private Integer heartRate;

    @Column(name = "blood_pressure_systolic")
    private Integer bloodPressureSystolic;

    @Column(name = "blood_pressure_diastolic")
    private Integer bloodPressureDiastolic;

    @Column(name = "oxygen_level")
    private Integer oxygenLevel;

    @Column(precision = 4, scale = 2)
    private BigDecimal temperature;

    @Column(name = "recorded_at", insertable = false, updatable = false)
    private LocalDateTime recordedAt;
}
