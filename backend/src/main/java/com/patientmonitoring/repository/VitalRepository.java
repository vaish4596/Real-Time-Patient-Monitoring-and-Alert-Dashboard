package com.patientmonitoring.repository;

import com.patientmonitoring.model.Vital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VitalRepository extends JpaRepository<Vital, Long> {
    List<Vital> findByPatientIdOrderByRecordedAtDesc(Long patientId);
    List<Vital> findTop50ByPatientIdOrderByRecordedAtDesc(Long patientId);
}
