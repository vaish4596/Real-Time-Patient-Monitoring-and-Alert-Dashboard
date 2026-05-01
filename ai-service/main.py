from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
from datetime import datetime

app = FastAPI(title="Patient Vitals AI Anomaly Detection Service")

class VitalReading(BaseModel):
    patientId: int
    heartRate: int
    bloodPressureSystolic: int
    bloodPressureDiastolic: int
    oxygenLevel: int
    temperature: float

class AnomalyResponse(BaseModel):
    isAnomaly: bool
    vitalType: Optional[str] = None
    severity: Optional[str] = None
    message: Optional[str] = None

# A simple rule-based approach combined with basic statistical moving average simulation
# In a real scenario, we'd store the last N readings per patient in memory or Redis.
patient_history = {}

@app.get("/")
def read_root():
    return {"status": "AI Service Running"}

@app.post("/analyze", response_model=AnomalyResponse)
def analyze_vital(vital: VitalReading):
    pid = vital.patientId
    
    if pid not in patient_history:
        patient_history[pid] = []
        
    history = patient_history[pid]
    history.append(vital.dict())
    
    # Keep only the last 20 readings for moving average calculation
    if len(history) > 20:
        history.pop(0)
    
    df = pd.DataFrame(history)
    
    # 1. Rule-based checks (Hard thresholds)
    if vital.oxygenLevel < 90:
        return AnomalyResponse(isAnomaly=True, vitalType="Oxygen", severity="CRITICAL", message=f"Critical low oxygen level: {vital.oxygenLevel}%")
    if vital.heartRate > 130:
        return AnomalyResponse(isAnomaly=True, vitalType="Heart Rate", severity="HIGH", message=f"Dangerous tachycardia: {vital.heartRate} bpm")
    if vital.bloodPressureSystolic > 180:
        return AnomalyResponse(isAnomaly=True, vitalType="Blood Pressure", severity="HIGH", message=f"Hypertensive crisis: {vital.bloodPressureSystolic}/{vital.bloodPressureDiastolic}")
    
    # 2. Statistical Anomaly Detection (Z-score based on history)
    # We need at least 5 readings to calculate a meaningful Z-score
    if len(df) >= 5:
        mean_hr = df['heartRate'].mean()
        std_hr = df['heartRate'].std()
        if std_hr > 0:
            z_score = abs(vital.heartRate - mean_hr) / std_hr
            if z_score > 3.0: # 3 standard deviations
                return AnomalyResponse(isAnomaly=True, vitalType="Heart Rate", severity="MEDIUM", message=f"Unusual spike in heart rate detected. Current: {vital.heartRate}, Average: {mean_hr:.1f}")

    return AnomalyResponse(isAnomaly=False)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
