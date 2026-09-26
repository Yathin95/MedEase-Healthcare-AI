// ─────────────────────────────────────────────
//  Core application types for MedEase PWA
// ─────────────────────────────────────────────

export type MedicationFrequency = 'once daily' | 'twice daily' | 'three times daily' | 'as needed' | 'every 8 hours' | 'every 12 hours';

export type SubstanceCategory = 'Prescription Medicine' | 'Dietary Supplement / Fitness' | 'OTC Vitamin';

export interface SupplementAnalysis {
  uses: string;
  sideEffects: string[];
  interactionWarning: string | null;
  progressPrediction: string;
  recommendedGuidance: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: MedicationFrequency | string;
  timeOfDay: string[];
  prescribedAt: string;       // ISO date string
  confidence: number;         // 0–1 from AI
  nextDose?: string;          // ISO date string
  takenToday: boolean;
  color: string;              // pill colour for UI
  category?: SubstanceCategory;
  patientGoal?: string;
  supplementAnalysis?: SupplementAnalysis;
}

export interface PatientProfile {
  name: string;
  age: string;
  sex: string;
  emergencyContact: string;
  conditions: string;
  allergies: string;
  currentMedications: string;
  bloodGroup: string;
  height: string;
  weight: string;
  completedOnboarding: boolean;
  updatedAt: string;
}

export interface MedicationLedger {
  patientId: string;
  patientName: string;
  medications: Medication[];
  lastUpdated: string;
}

export interface CaregiverContact {
  id: string;
  name: string;
  phone: string;
  role: 'Spouse' | 'Parent' | 'Child' | 'Sibling' | 'Friend' | 'Doctor' | 'Other';
}

export interface DoctorClarificationCard {
  id: string;
  createdAt: string;
  labMarkers: string;
  prescribedDrug: string;
  aiAnalysis: string;
  questions: string[];
  acknowledged: boolean;
}

export interface DoseLog {
  id: string;
  medicationId: string;
  medicationName: string;
  takenAt: string;
  verificationMethod: 'manual' | 'video-proctoring' | 'simulated';
  category?: SubstanceCategory;
}

export type ActiveScreen = 'dashboard' | 'scan' | 'patient-view' | 'lab-validator' | 'caregiver';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

