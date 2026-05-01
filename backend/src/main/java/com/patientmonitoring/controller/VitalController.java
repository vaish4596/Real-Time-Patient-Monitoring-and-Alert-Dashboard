package com.patientmonitoring.controller;

import com.patientmonitoring.model.Vital;
import com.patientmonitoring.repository.VitalRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vitals")
public class VitalController {

    private final VitalRepository vitalRepository;

    public VitalController(VitalRepository vitalRepository) {
        this.vitalRepository = vitalRepository;
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Vital>> getVitalsForPatient(@PathVariable Long patientId) {
        List<Vital> vitals = vitalRepository.findTop50ByPatientIdOrderByRecordedAtDesc(patientId);
        return ResponseEntity.ok(vitals);
    }
}
