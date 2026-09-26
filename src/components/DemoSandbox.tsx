// ─────────────────────────────────────────────
//  Module 6 — Demo Sandbox / Dev Bar
//  Hidden dev bar at bottom for live pitch demos
// ─────────────────────────────────────────────
import { useState } from 'react';
import { ChevronUp, ChevronDown, Zap, AlertOctagon, FlaskConical } from 'lucide-react';
import type { DoctorClarificationCard, Medication, Toast } from '../types';
import { markDoseTaken, saveClarificationCard, getCaregivers } from '../ledgerService';

interface DemoSandboxProps {
  medications: Medication[];
  onRefresh: () => void;
  onAddToast: (t: Omit<Toast, 'id'>) => void;
  onCardCreated: () => void;
}

export default function DemoSandbox({ medications, onRefresh, onAddToast, onCardCreated }: DemoSandboxProps) {
  const [expanded, setExpanded] = useState(false);

  // ── Simulation 1: Verified dose + WhatsApp ping ──

  const simulateVerifiedDose = () => {
    const med = medications[0];
    if (!med) {
      onAddToast({ type: 'warning', message: 'Add at least one medication to simulate a dose.' });
      return;
    }
    markDoseTaken(med.id, 'simulated');
    onRefresh();

    // Trigger WhatsApp for each caregiver
    const caregivers = getCaregivers();
    caregivers.forEach(c => {
      const cleanPhone = c.phone.replace(/\D/g, '');
      const msg = encodeURIComponent(
        `[MedEase DEMO] ✅ ${med.name} ${med.dosage} has been taken at ${new Date().toLocaleTimeString()}. Caregiver ping: ${c.name} (${c.role}).`
      );
      const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`;
      window.open(url, '_blank');
    });

    onAddToast({
      type: 'success',
      message: `✅ [DEMO] Dose recorded for ${med.name}. WhatsApp caregiver pings launched!`,
      duration: 6000,
    });
  };

  // ── Simulation 2: Wrong medicine alert ──────────

  const simulateWrongMedicine = () => {
    onAddToast({
      type: 'error',
      message: '⛔ [DEMO] Stop! You are holding the WRONG medicine. Detected: "Aspirin 100mg" — Expected: "Metformin 500mg". Please put it down immediately.',
      duration: 8000,
    });

    // Shake the screen
    document.body.classList.add('animate-bounce-soft');
    setTimeout(() => document.body.classList.remove('animate-bounce-soft'), 600);
  };

  // ── Simulation 3: Lab conflict card ────────────

  const simulateLabConflict = () => {
    const card: DoctorClarificationCard = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      labMarkers: 'eGFR: 38 mL/min, Serum Creatinine: 2.1 mg/dL, Potassium: 5.9 mEq/L',
      prescribedDrug: 'Metformin 1000mg (DEMO)',
      aiAnalysis:
        'Metformin is contraindicated when eGFR falls below 30 mL/min and requires careful monitoring between 30–45 mL/min. The lab result of eGFR 38 mL/min and elevated creatinine (2.1 mg/dL) suggest reduced kidney function. Lactic acidosis risk may increase. This requires immediate physician review.',
      questions: [
        'Given my eGFR of 38 mL/min, is Metformin still safe for me to continue?',
        'Should the Metformin dosage be adjusted given my current kidney function?',
        'Are there alternative medications to Metformin that are safer for patients with reduced kidney function?',
        'How frequently should I have my kidney function monitored while on this medication?',
      ],
      acknowledged: false,
    };
    saveClarificationCard(card);
    onCardCreated();
    onAddToast({
      type: 'warning',
      message: '⚠️ [DEMO] Lab conflict detected! Doctor Clarification Card generated. Check the Caregiver Dashboard.',
      duration: 8000,
    });
    onRefresh();
  };

  return (
    <div className="fixed bottom-24 left-0 right-0 z-30 pointer-events-none">
      <div className="max-w-2xl mx-auto px-4 pointer-events-auto">
        {/* Collapsed trigger pill */}
        <div className="flex justify-center mb-1.5">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-xs px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/50 text-slate-500 hover:text-amber-400 hover:border-amber-500/30 transition-all duration-200 backdrop-blur-md shadow-lg"
          >
            <Zap className="w-3 h-3 text-amber-500" />
            <span className="font-mono tracking-widest">DEMO</span>
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>

        {/* Expanded panel */}
        {expanded && (
          <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 shadow-2xl animate-slide-in-up">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <p className="text-[10px] font-mono text-amber-500/80 uppercase tracking-widest">Hackathon Demo Controls</p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                onClick={simulateVerifiedDose}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-emerald-300 text-xs font-medium hover:bg-emerald-950/80 hover:border-emerald-700/70 transition-all duration-200 text-left"
              >
                <Zap className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>Simulate Verified Dose (Triggers WhatsApp Caregiver Ping)</span>
              </button>
              <button
                onClick={simulateWrongMedicine}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-950/50 border border-rose-800/50 text-rose-300 text-xs font-medium hover:bg-rose-950/80 hover:border-rose-700/70 transition-all duration-200 text-left"
              >
                <AlertOctagon className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>Simulate Wrong Medicine Warning (Video Proctoring Alert)</span>
              </button>
              <button
                onClick={simulateLabConflict}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-950/50 border border-amber-800/50 text-amber-300 text-xs font-medium hover:bg-amber-950/80 hover:border-amber-700/70 transition-all duration-200 text-left"
              >
                <FlaskConical className="w-4 h-4 flex-shrink-0 text-amber-400" />
                <span>Simulate Lab Report Conflict (Generates Clarification Card)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
