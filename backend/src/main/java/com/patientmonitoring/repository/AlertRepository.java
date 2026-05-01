package com.patientmonitoring.repository;

import com.patientmonitoring.model.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    List<Alert> findByIsResolvedFalseOrderByCreatedAtDesc();
}
