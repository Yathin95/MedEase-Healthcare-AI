// ─────────────────────────────────────────────
//  Local-state medication ledger service
//  Simulates AES-encrypted on-device storage
// ─────────────────────────────────────────────

import type {
  MedicationLedger,
  Medication,
  CaregiverContact,
  DoctorClarificationCard,
  DoseLog,
  SubstanceCategory,
  SupplementAnalysis,
  PatientProfile,
} from './types';

const LEDGER_KEY = 'medease_ledger_v1';
const CAREGIVERS_KEY = 'medease_caregivers_v1';
const CLARIFICATION_KEY = 'medease_cards_v1';
const DOSE_LOG_KEY = 'medease_dose_log_v1';

const PILL_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
  'bg-fuchsia-500', 'bg-orange-500',
];

// ── Ledger helpers ─────────────────────────────

export function getLedger(): MedicationLedger {
  const raw = localStorage.getItem(LEDGER_KEY);
  if (raw) return JSON.parse(raw) as MedicationLedger;
  const fresh: MedicationLedger = {
    patientId: crypto.randomUUID(),
    patientName: 'Patient',
    medications: [],
    lastUpdated: new Date().toISOString(),
  };
  saveLedger(fresh);
  return fresh;
}

export function saveLedger(ledger: MedicationLedger): void {
  ledger.lastUpdated = new Date().toISOString();
  localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
}

export function addMedication(
  med: Omit<Medication, 'id' | 'prescribedAt' | 'takenToday' | 'color'>
): Medication {
  const ledger = getLedger();
  const newMed: Medication = {
    ...med,
    id: crypto.randomUUID(),
    prescribedAt: new Date().toISOString(),
    takenToday: false,
    color: PILL_COLORS[ledger.medications.length % PILL_COLORS.length],
    nextDose: computeNextDose(med.timeOfDay),
    category: med.category || 'Prescription Medicine',
  };
  ledger.medications.push(newMed);
  saveLedger(ledger);
  return newMed;
}

export function addManualSubstance(data: {
  name: string;
  category: SubstanceCategory;
  dosage: string;
  frequency: string;
  timeOfDay: string[];
  patientGoal?: string;
  supplementAnalysis?: SupplementAnalysis;
}): Medication {
  const ledger = getLedger();
  const newSubstance: Medication = {
    id: crypto.randomUUID(),
    name: data.name,
    category: data.category,
    dosage: data.dosage,
    frequency: data.frequency,
    timeOfDay: data.timeOfDay,
    patientGoal: data.patientGoal,
    supplementAnalysis: data.supplementAnalysis,
    prescribedAt: new Date().toISOString(),
    confidence: 1.0,
    takenToday: false,
    color: PILL_COLORS[ledger.medications.length % PILL_COLORS.length],
    nextDose: computeNextDose(data.timeOfDay),
  };
  ledger.medications.push(newSubstance);
  saveLedger(ledger);
  return newSubstance;
}

export function markDoseTaken(medicationId: string, verificationMethod: 'manual' | 'video-proctoring' | 'simulated' = 'manual'): void {
  const ledger = getLedger();
  const med = ledger.medications.find(m => m.id === medicationId);
  if (med) {
    med.takenToday = true;
    med.nextDose = computeNextDose(med.timeOfDay, true);
    saveLedger(ledger);
    logDose({
      medicationId: med.id,
      medicationName: med.name,
      verificationMethod,
      category: med.category || 'Prescription Medicine',
    });
  }
}

export function resetDailyDoses(): void {
  const ledger = getLedger();
  ledger.medications.forEach(m => { m.takenToday = false; });
  saveLedger(ledger);
}

// ── Caregiver helpers ──────────────────────────

export function getCaregivers(): CaregiverContact[] {
  const raw = localStorage.getItem(CAREGIVERS_KEY);
  if (raw) {
    const list = JSON.parse(raw) as CaregiverContact[];
    let updated = false;
    list.forEach(c => {
      if (c.phone.includes('98765') || c.phone.includes('90000')) {
        c.phone = '+91 91481 16869';
        updated = true;
      }
    });
    if (updated) saveCaregivers(list);
    return list;
  }
  const defaults: CaregiverContact[] = [
    { id: crypto.randomUUID(), name: 'Priya Sharma', phone: '+91 91481 16869', role: 'Spouse' },
    { id: crypto.randomUUID(), name: 'Dr. Anil Menon', phone: '+91 91481 16869', role: 'Doctor' },
  ];
  saveCaregivers(defaults);
  return defaults;
}

export function saveCaregivers(contacts: CaregiverContact[]): void {
  localStorage.setItem(CAREGIVERS_KEY, JSON.stringify(contacts));
}

// ── Clarification card helpers ─────────────────

export function getClarificationCards(): DoctorClarificationCard[] {
  const raw = localStorage.getItem(CLARIFICATION_KEY);
  if (raw) return JSON.parse(raw) as DoctorClarificationCard[];
  return [];
}

export function saveClarificationCard(card: DoctorClarificationCard): void {
  const cards = getClarificationCards();
  cards.unshift(card);
  localStorage.setItem(CLARIFICATION_KEY, JSON.stringify(cards));
}

export function acknowledgeClarificationCard(cardId: string): void {
  const cards = getClarificationCards();
  const card = cards.find(c => c.id === cardId);
  if (card) {
    card.acknowledged = true;
    localStorage.setItem(CLARIFICATION_KEY, JSON.stringify(cards));
  }
}

// ── Dose log helpers ───────────────────────────

export function getDoseLog(): DoseLog[] {
  const raw = localStorage.getItem(DOSE_LOG_KEY);
  if (raw) return JSON.parse(raw) as DoseLog[];
  return [];
}

export function logDose(log: Omit<DoseLog, 'id' | 'takenAt'>): DoseLog {
  const entry: DoseLog = {
    ...log,
    id: crypto.randomUUID(),
    takenAt: new Date().toISOString(),
  };
  const logs = getDoseLog();
  logs.unshift(entry);
  localStorage.setItem(DOSE_LOG_KEY, JSON.stringify(logs.slice(0, 100)));
  return entry;
}

export function getDoseLogsByDate(dateStr: string): DoseLog[] {
  const logs = getDoseLog();
  return logs.filter(log => {
    const d = new Date(log.takenAt);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const formatted = `${yyyy}-${mm}-${dd}`;
    return formatted === dateStr;
  });
}


// ── Utility ────────────────────────────────────

function computeNextDose(timeOfDay: string[], skipFirst = false): string {
  const now = new Date();
  const firstTime = timeOfDay[skipFirst ? 1 : 0] ?? '08:00';
  const [h, m] = firstTime.split(':').map(Number);
  const next = new Date(now);
  next.setHours(h ?? 8, m ?? 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.toISOString();
}

export function formatNextDose(isoString?: string): string {
  if (!isoString) return 'Not scheduled';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffM = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (diffMs < 0) return 'Overdue';
  if (diffH === 0) return `In ${diffM}m`;
  return `In ${diffH}h ${diffM}m`;
}

// ── Patient Profile helpers ───────────────────

const PATIENT_PROFILE_KEY = 'medease_patient_profile';

export function getPatientProfile(): PatientProfile | null {
  const raw = localStorage.getItem(PATIENT_PROFILE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as PatientProfile;
    } catch {
      return null;
    }
  }
  return null;
}

export function savePatientProfile(profile: Partial<PatientProfile>): PatientProfile {
  const existing = getPatientProfile() || {
    name: '',
    age: '',
    sex: '',
    emergencyContact: '',
    conditions: '',
    allergies: '',
    currentMedications: '',
    bloodGroup: '',
    height: '',
    weight: '',
    completedOnboarding: false,
    updatedAt: new Date().toISOString(),
  };

  const updated: PatientProfile = {
    ...existing,
    ...profile,
    completedOnboarding: true,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(PATIENT_PROFILE_KEY, JSON.stringify(updated));

  if (updated.name) {
    const ledger = getLedger();
    ledger.patientName = updated.name;
    saveLedger(ledger);
  }

  if (updated.emergencyContact) {
    const caregivers = getCaregivers();
    if (caregivers.length > 0) {
      caregivers[0].phone = updated.emergencyContact;
      saveCaregivers(caregivers);
    }
  }

  return updated;
}

export function hasPatientProfile(): boolean {
  const profile = getPatientProfile();
  return Boolean(profile && profile.completedOnboarding);
}
