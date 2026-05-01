package com.patientmonitoring.repository;

import com.patientmonitoring.model.Log;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LogRepository extends JpaRepository<Log, Long> {
    List<Log> findTop100ByOrderByTimestampDesc();
}
