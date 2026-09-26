// ─────────────────────────────────────────────
//  Module 2 — Prescription Ingestion & AI Scheduling (Human-in-the-Loop)
// ─────────────────────────────────────────────
import { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Plus,
  X,
  Pill,
  Sparkles,
  ScanLine,
  Trash2,
  Clock,
  Dumbbell,
  ShieldAlert,
  Activity,
  TrendingUp,
  Droplets,
} from 'lucide-react';
import type { Toast, SubstanceCategory, SupplementAnalysis } from '../types';
import { extractPrescription, analyzeSupplement, type ExtractedMedication } from '../geminiService';
import { addMedication, addManualSubstance, getLedger } from '../ledgerService';

interface ScanPrescriptionProps {
  onAddToast: (t: Omit<Toast, 'id'>) => void;
  onDone: () => void;
}

type ScanState = 'idle' | 'scanning' | 'result' | 'saving';

export default function ScanPrescription({ onAddToast, onDone }: ScanPrescriptionProps) {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [extractedMeds, setExtractedMeds] = useState<ExtractedMedication[]>([]);
  const [confidence, setConfidence] = useState(1);
  const [confidenceScore, setConfidenceScore] = useState(100);
  const [legibilityRating, setLegibilityRating] = useState<'Low' | 'Medium' | 'High'>('High');
  const [showModal, setShowModal] = useState(false);

  // Manual Intake & Supplement Form state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState<{
    name: string;
    category: SubstanceCategory;
    dosage: string;
    frequency: string;
    timeOfDay: string;
    patientGoal: string;
  }>({
    name: '',
    category: 'Dietary Supplement / Fitness',
    dosage: '5 g',
    frequency: 'Daily Post-Workout',
    timeOfDay: '08:00',
    patientGoal: 'Muscle recovery & cellular hydration',
  });
  const [isAnalyzingSupplement, setIsAnalyzingSupplement] = useState(false);
  const [supplementReport, setSupplementReport] = useState<SupplementAnalysis | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onAddToast({ type: 'error', message: 'Please upload an image file.' });
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    setScanState('scanning');

    try {
      const result = await extractPrescription(file);
      setExtractedMeds(result.medications);
      setConfidence(result.confidence);
      setConfidenceScore(result.confidenceScore ?? Math.round(result.confidence * 100));
      setLegibilityRating(result.legibilityRating ?? (result.confidence >= 0.7 ? 'High' : result.confidence >= 0.4 ? 'Medium' : 'Low'));
      setScanState('result');
      setShowModal(true);
    } catch (err: any) {
      console.error(err);
      onAddToast({ type: 'error', message: err?.message || 'AI extraction failed. Please verify your API key.' });
      setScanState('idle');
    }
  };

  const handleMedChange = (index: number, field: keyof ExtractedMedication, value: any) => {
    setExtractedMeds(prev => {
      const updated = [...prev];
      if (field === 'timeOfDay') {
        updated[index] = {
          ...updated[index],
          timeOfDay: typeof value === 'string' ? value.split(',').map(s => s.trim()) : value,
        };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const handleRemoveMed = (index: number) => {
    setExtractedMeds(prev => prev.filter((_, i) => i !== index));
    onAddToast({ type: 'info', message: 'Medication removed.' });
  };

  const handleAddMedCard = () => {
    setExtractedMeds(prev => [
      ...prev,
      { name: 'New Medicine', dosage: '500mg', frequency: 'twice daily', timeOfDay: ['08:00', '20:00'] },
    ]);
  };

  const handleConfirm = () => {
    const validMeds = extractedMeds.filter(m => m.name.trim().length > 0);
    if (validMeds.length === 0) {
      onAddToast({ type: 'warning', message: 'Please add at least one valid medication.' });
      return;
    }

    setScanState('saving');
    validMeds.forEach(med =>
      addMedication({
        name: med.name.trim(),
        dosage: med.dosage.trim() || 'As directed',
        frequency: med.frequency.trim() || 'once daily',
        timeOfDay: med.timeOfDay?.length ? med.timeOfDay : ['08:00'],
        confidence,
        nextDose: undefined,
      })
    );
    setShowModal(false);
    onAddToast({ type: 'success', message: `✅ ${validMeds.length} medication(s) saved to your ledger.` });
    setScanState('idle');
    setPreview(null);
    setExtractedMeds([]);
    onDone();
  };

  const handleDiscard = () => {
    setShowModal(false);
    setScanState('idle');
    setPreview(null);
    setExtractedMeds([]);
  };

  const handleAnalyzeManualSubstance = async () => {
    if (!manualForm.name.trim()) {
      onAddToast({ type: 'warning', message: 'Please enter a medication or supplement name.' });
      return;
    }

    setIsAnalyzingSupplement(true);
    setSupplementReport(null);

    try {
      const ledger = getLedger();
      const report = await analyzeSupplement(
        manualForm.name.trim(),
        manualForm.category,
        manualForm.dosage.trim(),
        manualForm.patientGoal.trim(),
        ledger.medications
      );
      setSupplementReport(report);
      onAddToast({ type: 'info', message: 'AI Pharmacological & Conflict Analysis complete.' });
    } catch (err: any) {
      console.error(err);
      onAddToast({ type: 'error', message: 'Analysis failed. Showing default physiological parameters.' });
    } finally {
      setIsAnalyzingSupplement(false);
    }
  };

  const handleSaveManualSubstance = () => {
    if (!manualForm.name.trim()) {
      onAddToast({ type: 'warning', message: 'Please enter a valid substance name.' });
      return;
    }

    const times = manualForm.timeOfDay
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    addManualSubstance({
      name: manualForm.name.trim(),
      category: manualForm.category,
      dosage: manualForm.dosage.trim() || 'As directed',
      frequency: manualForm.frequency.trim() || 'Daily',
      timeOfDay: times.length > 0 ? times : ['08:00'],
      patientGoal: manualForm.patientGoal.trim(),
      supplementAnalysis: supplementReport || undefined,
    });

    onAddToast({
      type: 'success',
      message: `✅ Saved ${manualForm.name} (${manualForm.category}) to your encrypted ledger.`,
    });

    setShowManualModal(false);
    setManualForm({
      name: '',
      category: 'Dietary Supplement / Fitness',
      dosage: '5 g',
      frequency: 'Daily Post-Workout',
      timeOfDay: '08:00',
      patientGoal: 'Muscle recovery & cellular hydration',
    });
    setSupplementReport(null);
    onDone();
  };

  const isLowOrMediumConfidence = confidenceScore < 70 || legibilityRating !== 'High';
  const confidenceColor =
    confidenceScore >= 70 ? 'text-emerald-400' : confidenceScore >= 40 ? 'text-amber-400' : 'text-red-400';
  const confidenceBg =
    confidenceScore >= 70 ? 'bg-emerald-500' : confidenceScore >= 40 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto shadow-md">
          <ScanLine className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">Scan Prescription</h2>
        <p className="text-slate-600 font-semibold text-sm md:text-base">Upload or photograph a prescription for instant AI ingestion & scheduling</p>
      </div>

      {/* Upload zone (Responsive Grid for Laptop) */}
      {scanState === 'idle' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Camera capture */}
            <button
              onClick={() => cameraRef.current?.click()}
              className="glass-card p-6 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-200 cursor-pointer rounded-2xl shadow-sm text-center"
            >
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                <Camera className="w-7 h-7 text-blue-700" />
              </div>
              <div>
                <p className="font-extrabold text-slate-900 text-base md:text-lg">Take a Photo</p>
                <p className="text-xs md:text-sm font-semibold text-slate-500 mt-0.5">Use laptop or mobile camera to snap prescription</p>
              </div>
            </button>
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {/* File upload */}
            <button
              onClick={() => fileRef.current?.click()}
              className="glass-card p-6 flex flex-col items-center justify-center gap-3 border-2 border-slate-200 hover:border-blue-400 hover:bg-slate-50 transition-all duration-200 cursor-pointer rounded-2xl shadow-sm text-center"
            >
              <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center">
                <Upload className="w-7 h-7 text-indigo-700" />
              </div>
              <div>
                <p className="font-extrabold text-slate-900 text-base md:text-lg">Upload Image</p>
                <p className="text-xs md:text-sm font-semibold text-slate-500 mt-0.5">JPG, PNG, WEBP files supported</p>
              </div>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          {/* Manual Entry & Supplement Action Card */}
          <button
            onClick={() => setShowManualModal(true)}
            className="w-full glass-card p-5 flex items-center justify-between border-2 border-teal-300 bg-teal-50/40 hover:bg-teal-50 transition-all duration-200 cursor-pointer rounded-2xl shadow-sm group"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-extrabold text-slate-900 text-base md:text-lg group-hover:text-teal-800 transition-colors">
                  Or Enter Manually / Add Dietary Supplement
                </p>
                <p className="text-xs md:text-sm font-semibold text-slate-600 mt-0.5">
                  Log supplements (Creatine, Whey, Ashwagandha) or OTC meds with AI pharmacological interaction check
                </p>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Plus className="w-5 h-5" />
            </div>
          </button>

          {/* AI info badge */}
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-violet-950/40 border border-violet-800/30">
            <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0" />
            <p className="text-xs text-slate-400">
              Powered by <span className="text-violet-400 font-medium">Gemini 3.5 Flash Lite</span> — Grounded in Indian Pharma & Pharmacological Analysis context.
            </p>
          </div>
        </div>
      )}

      {/* Scanning state */}
      {scanState === 'scanning' && (
        <div className="glass-card p-8 flex flex-col items-center gap-5">
          {preview && (
            <img src={preview} alt="Prescription" className="w-full max-h-48 object-contain rounded-xl opacity-60" />
          )}
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full bg-violet-500/20 ping-slow" />
              <div className="relative w-16 h-16 rounded-full bg-violet-500/30 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-bold text-white">AI Reading Prescription…</p>
              <p className="text-sm text-slate-400">Cross-referencing Indian clinical combinations</p>
            </div>
          </div>
        </div>
      )}

      {/* Result preview before modal */}
      {scanState === 'result' && !showModal && preview && (
        <div className="glass-card p-4">
          <img src={preview} alt="Prescription" className="w-full max-h-48 object-contain rounded-xl" />
        </div>
      )}

      {/* Dedicated Log Medication or Supplement Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/60 rounded-3xl w-full max-w-lg p-6 space-y-5 my-auto animate-slide-in-up shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Log Medication or Supplement</h3>
                  <p className="text-xs text-slate-400">Manual Intake & AI Pharmacological Analyzer</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowManualModal(false);
                  setSupplementReport(null);
                }}
                className="text-slate-500 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Quick Presets</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: 'Creatine Monohydrate', cat: 'Dietary Supplement / Fitness', dose: '5 g', goal: 'Muscle recovery & cellular hydration' },
                  { name: 'Whey Isolate', cat: 'Dietary Supplement / Fitness', dose: '1 scoop / 25 g', goal: 'Muscle protein synthesis' },
                  { name: 'Ashwagandha', cat: 'Dietary Supplement / Fitness', dose: '500 mg', goal: 'Cortisol reduction & stress management' },
                  { name: 'Zerodol-SP', cat: 'Prescription Medicine', dose: '1 tablet', goal: 'Pain & inflammation relief' },
                  { name: 'Metformin', cat: 'Prescription Medicine', dose: '500 mg', goal: 'Blood sugar management' },
                ].map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setManualForm({
                        name: preset.name,
                        category: preset.cat as SubstanceCategory,
                        dosage: preset.dose,
                        frequency: 'Daily',
                        timeOfDay: '08:00',
                        patientGoal: preset.goal,
                      });
                      setSupplementReport(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700/60 transition-colors"
                  >
                    + {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3.5">
              {/* Category Selector */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide block mb-1.5">Substance Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Prescription Medicine', label: '💊 Prescription', color: 'border-violet-500 bg-violet-950/40 text-violet-300' },
                    { id: 'Dietary Supplement / Fitness', label: '🏋️ Supplement', color: 'border-cyan-500 bg-cyan-950/40 text-cyan-300' },
                    { id: 'OTC Vitamin', label: '🌿 OTC Vitamin', color: 'border-emerald-500 bg-emerald-950/40 text-emerald-300' },
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setManualForm(prev => ({ ...prev, category: c.id as SubstanceCategory }))}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                        manualForm.category === c.id
                          ? c.color
                          : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide block mb-1">Substance Name</label>
                <input
                  type="text"
                  value={manualForm.name}
                  onChange={e => setManualForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Creatine Monohydrate, Metformin, Ashwagandha"
                  className="w-full bg-slate-800/90 border border-slate-700/70 focus:border-cyan-500 text-white font-semibold text-sm rounded-xl px-3.5 py-2.5 outline-none transition-all"
                />
              </div>

              {/* Dose & Frequency Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide block mb-1">Dose & Unit</label>
                  <input
                    type="text"
                    value={manualForm.dosage}
                    onChange={e => setManualForm(prev => ({ ...prev, dosage: e.target.value }))}
                    placeholder="e.g. 5 g, 1 scoop, 500 mg"
                    className="w-full bg-slate-800/90 border border-slate-700/70 focus:border-cyan-500 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide block mb-1">Frequency</label>
                  <input
                    type="text"
                    value={manualForm.frequency}
                    onChange={e => setManualForm(prev => ({ ...prev, frequency: e.target.value }))}
                    placeholder="e.g. Daily Post-Workout"
                    className="w-full bg-slate-800/90 border border-slate-700/70 focus:border-cyan-500 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none"
                  />
                </div>
              </div>

              {/* Intake Time & Goal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide block mb-1">Intake Time</label>
                  <input
                    type="text"
                    value={manualForm.timeOfDay}
                    onChange={e => setManualForm(prev => ({ ...prev, timeOfDay: e.target.value }))}
                    placeholder="08:00, 20:00"
                    className="w-full bg-slate-800/90 border border-slate-700/70 focus:border-cyan-500 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide block mb-1">Patient Goal (Optional)</label>
                  <input
                    type="text"
                    value={manualForm.patientGoal}
                    onChange={e => setManualForm(prev => ({ ...prev, patientGoal: e.target.value }))}
                    placeholder="e.g. Muscle recovery, Energy"
                    className="w-full bg-slate-800/90 border border-slate-700/70 focus:border-cyan-500 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* AI Analysis Trigger Button */}
            <button
              type="button"
              onClick={handleAnalyzeManualSubstance}
              disabled={isAnalyzingSupplement || !manualForm.name.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40 transition-all disabled:opacity-50"
            >
              {isAnalyzingSupplement ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Gemini Analyzing Pharmacological Profile & Interactions…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  Run Gemini Pharmacological & Conflict Analysis
                </>
              )}
            </button>

            {/* AI Report Output Container */}
            {supplementReport && (
              <div className="bg-slate-950/80 border border-cyan-500/40 rounded-2xl p-4 space-y-3.5 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" /> AI Pharmacological & Progress Report
                  </span>
                  <span className="badge-pill bg-cyan-500/20 text-cyan-300 text-[10px]">Verified</span>
                </div>

                {/* 1. Clinical Uses */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" /> Clinical & Physiological Uses
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    {supplementReport.uses}
                  </p>
                </div>

                {/* 2. Side Effects & Monitoring */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Side Effects & Monitoring Markers
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {supplementReport.sideEffects.map((se, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                        • {se}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 3. Drug-Supplement Conflict Check */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Drug-Supplement Conflict Check
                  </span>
                  {supplementReport.interactionWarning ? (
                    <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/60 text-red-200 text-xs leading-relaxed space-y-1 glow-red">
                      <p className="font-bold flex items-center gap-1 text-red-300">
                        <AlertTriangle className="w-4 h-4 text-red-400" /> DRUG INTERACTION CONFLICT WARNING
                      </p>
                      <p>{supplementReport.interactionWarning}</p>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>No direct pharmacological conflicts detected with active ledger medications.</span>
                    </div>
                  )}
                </div>

                {/* 4. Progress & Saturation Timeline */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> Saturation & Progress Timeline
                  </span>
                  <p className="text-xs text-indigo-200 bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-500/30">
                    {supplementReport.progressPrediction}
                  </p>
                </div>

                {/* 5. Recommended Guidance */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Routine Guidance & Tips
                  </span>
                  <p className="text-xs text-cyan-200 bg-cyan-950/30 p-2.5 rounded-xl border border-cyan-500/30">
                    {supplementReport.recommendedGuidance}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowManualModal(false);
                  setSupplementReport(null);
                }}
                className="btn-ghost flex-1 text-sm py-2.5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveManualSubstance}
                disabled={!manualForm.name.trim()}
                className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Save to Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confidence Calibration Modal (Human-in-the-Loop) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/50 rounded-3xl w-full max-w-lg p-6 space-y-5 my-auto animate-slide-in-up shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                <h3 className="text-lg font-bold text-white">AI Extraction Result</h3>
              </div>
              <button onClick={handleDiscard} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Confidence Calibration Bar */}
            <div className="bg-slate-800/60 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Legibility Rating</span>
                <span className={`text-sm font-bold ${confidenceColor}`}>{legibilityRating} ({confidenceScore}%)</span>
              </div>
              <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${confidenceBg} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(100, Math.max(5, confidenceScore))}%` }}
                />
              </div>
            </div>

            {/* Editable Medication Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
                  Extracted Medications ({extractedMeds.length})
                </p>
                <span className="text-[10px] text-slate-500">Click fields to edit</span>
              </div>

              {extractedMeds.map((med, i) => (
                <div key={i} className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 space-y-3 group hover:border-violet-500/40 transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Pill className="w-4 h-4 text-violet-400 flex-shrink-0" />
                      <input
                        type="text"
                        value={med.name}
                        onChange={e => handleMedChange(i, 'name', e.target.value)}
                        placeholder="Drug Name (e.g. Zerodol-SP)"
                        className="bg-slate-900/80 border border-slate-700/60 focus:border-violet-500 text-white font-bold text-base rounded-lg px-2.5 py-1 w-full outline-none transition-all"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveMed(i)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                      title="Delete card"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pl-6">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold">Dosage</label>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={e => handleMedChange(i, 'dosage', e.target.value)}
                        placeholder="e.g. 500mg, 1 tab"
                        className="bg-slate-900/60 border border-slate-700/50 focus:border-violet-500 text-slate-200 text-xs rounded-lg px-2 py-1 w-full outline-none mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold">Frequency</label>
                      <input
                        type="text"
                        value={med.frequency}
                        onChange={e => handleMedChange(i, 'frequency', e.target.value)}
                        placeholder="e.g. twice daily"
                        className="bg-slate-900/60 border border-slate-700/50 focus:border-violet-500 text-slate-200 text-xs rounded-lg px-2 py-1 w-full outline-none mt-0.5"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-violet-400" /> Times of Day (comma separated)
                      </label>
                      <input
                        type="text"
                        value={med.timeOfDay?.join(', ') || ''}
                        onChange={e => handleMedChange(i, 'timeOfDay', e.target.value)}
                        placeholder="08:00, 20:00"
                        className="bg-slate-900/60 border border-slate-700/50 focus:border-violet-500 text-slate-200 text-xs rounded-lg px-2 py-1 w-full outline-none mt-0.5"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Another Medicine Button */}
              <button
                onClick={handleAddMedCard}
                className="w-full py-2.5 px-4 rounded-xl bg-violet-950/40 border border-violet-700/40 hover:bg-violet-900/40 text-violet-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200"
              >
                <Plus className="w-4 h-4" /> Add Another Medicine
              </button>
            </div>

            {/* Confidence Warning Gating Banner */}
            {isLowOrMediumConfidence && (
              <div className="flex items-start gap-3 bg-amber-950/50 border border-amber-600/50 rounded-2xl p-3.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200 leading-relaxed">
                  ⚠️ Handwriting partially ambiguous. Please verify medicine names and doses against your physical paper slip before saving.
                </p>
              </div>
            )}

            {/* Preview image */}
            {preview && (
              <img src={preview} alt="Prescription" className="w-full max-h-28 object-contain rounded-xl opacity-80" />
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button onClick={handleDiscard} className="btn-ghost flex-1 text-sm py-2.5">
                Discard
              </button>
              <button
                onClick={handleConfirm}
                disabled={extractedMeds.length === 0}
                className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                Save to Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
