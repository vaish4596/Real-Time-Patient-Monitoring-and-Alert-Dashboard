from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import numpy as np

app = FastAPI(title="Patient Vitals AI Anomaly Detection Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    riskScore: int = 0
    status: str = "Normal"
    recommendation: str = ""

patient_history = {}

def _compute_risk_and_guidance(vital: VitalReading) -> tuple[int, str, str]:
    score = 0
    if vital.heartRate > 110:
        score += 25
    elif vital.heartRate > 95:
        score += 10

    if vital.oxygenLevel < 92:
        score += 35
    elif vital.oxygenLevel < 95:
        score += 15

    if vital.bloodPressureSystolic > 160:
        score += 25
    elif vital.bloodPressureSystolic > 130:
        score += 10

    variation = int(np.random.randint(0, 26))
    score = min(100, score + variation)

    if score < 35:
        status = "Normal"
        recommendation = "Vitals are stable. Continue routine monitoring."
    elif score < 70:
        status = "Warning"
        recommendation = "Patient needs observation. Check vitals frequently."
    else:
        status = "Critical"
        recommendation = "Immediate medical attention required!"

    return score, status, recommendation

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

    if len(history) > 20:
        history.pop(0)

    df = pd.DataFrame(history)

    risk_score, status, recommendation = _compute_risk_and_guidance(vital)

    # Hard thresholds — clinical priorities
    if vital.oxygenLevel < 90:
        return AnomalyResponse(
            isAnomaly=True,
            vitalType="Oxygen",
            severity="CRITICAL",
            message=f"Critical low oxygen level: {vital.oxygenLevel}%",
            riskScore=risk_score,
            status=status,
            recommendation=recommendation,
        )
    if vital.heartRate > 130:
        return AnomalyResponse(
            isAnomaly=True,
            vitalType="Heart Rate",
            severity="HIGH",
            message=f"Dangerous tachycardia: {vital.heartRate} bpm",
            riskScore=risk_score,
            status=status,
            recommendation=recommendation,
        )
    if vital.bloodPressureSystolic > 180:
        return AnomalyResponse(
            isAnomaly=True,
            vitalType="Blood Pressure",
            severity="HIGH",
            message=f"Hypertensive crisis: {vital.bloodPressureSystolic}/{vital.bloodPressureDiastolic}",
            riskScore=risk_score,
            status=status,
            recommendation=recommendation,
        )

    if len(df) >= 5:
        mean_hr = df["heartRate"].mean()
        std_hr = df["heartRate"].std()
        if std_hr > 0:
            z_score = abs(vital.heartRate - mean_hr) / std_hr
            if z_score > 3.0:
                return AnomalyResponse(
                    isAnomaly=True,
                    vitalType="Heart Rate",
                    severity="MEDIUM",
                    message=f"Unusual spike in heart rate detected. Current: {vital.heartRate}, Average: {mean_hr:.1f}",
                    riskScore=risk_score,
                    status=status,
                    recommendation=recommendation,
                )

    # Composite risk — aligns dashboard alerts with the AI panel
    if risk_score >= 65:
        sev = "HIGH" if risk_score >= 80 else "MEDIUM"
        return AnomalyResponse(
            isAnomaly=True,
            vitalType="Risk Assessment",
            severity=sev,
            message=f"Elevated composite risk ({risk_score}%): {recommendation}",
            riskScore=risk_score,
            status=status,
            recommendation=recommendation,
        )

    return AnomalyResponse(
        isAnomaly=False,
        riskScore=risk_score,
        status=status,
        recommendation=recommendation,
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
