package com.patientmonitoring.repository;

import com.patientmonitoring.model.Alert;
import com.patientmonitoring.model.Severity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    List<Alert> findByIsResolvedFalseOrderByCreatedAtDesc();
    List<Alert> findTop50ByIsResolvedTrueOrderByResolvedAtDesc();

    boolean existsByPatient_IdAndVitalTypeAndSeverityAndCreatedAtAfter(
            Long patientId, String vitalType, Severity severity, LocalDateTime createdAfter);
}
