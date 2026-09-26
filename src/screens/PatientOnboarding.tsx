// ─────────────────────────────────────────────
//  Patient Profile Onboarding — WebMD Light Theme
//  Zero-Backend Architecture — Strict Local Edge Persistence
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react';
import {
  Heart,
  ShieldCheck,
  Globe,
  ArrowRight,
  User,
  Activity,
  AlertTriangle,
  Pill,
  Phone,
  Sparkles,
} from 'lucide-react';
import type { Toast } from '../types';
import { getPatientProfile, savePatientProfile } from '../ledgerService';

interface PatientOnboardingProps {
  onComplete: () => void;
  onAddToast?: (toast: Omit<Toast, 'id'>) => void;
}

export default function PatientOnboarding({ onComplete, onAddToast }: PatientOnboardingProps) {
  const [lang, setLang] = useState<'EN' | 'HI'>('EN');

  const [form, setForm] = useState<{
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
  }>({
    name: '',
    age: '',
    sex: 'Male',
    emergencyContact: '',
    conditions: '',
    allergies: '',
    currentMedications: '',
    bloodGroup: 'O+',
    height: '',
    weight: '',
  });

  // Pre-fill if editing existing profile
  useEffect(() => {
    const existing = getPatientProfile();
    if (existing) {
      setForm({
        name: existing.name || '',
        age: existing.age || '',
        sex: existing.sex || 'Male',
        emergencyContact: existing.emergencyContact || '',
        conditions: existing.conditions || '',
        allergies: existing.allergies || '',
        currentMedications: existing.currentMedications || '',
        bloodGroup: existing.bloodGroup || 'O+',
        height: existing.height || '',
        weight: existing.weight || '',
      });
    }
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = (isSkip = false) => {
    const payloadToSave = isSkip
      ? {
          name: form.name.trim() || 'Patient',
          age: form.age || '60',
          sex: form.sex || 'Not specified',
          emergencyContact: form.emergencyContact || '+91 91481 16869',
          conditions: form.conditions || 'None listed',
          allergies: form.allergies || 'None listed',
          currentMedications: form.currentMedications || '',
          bloodGroup: form.bloodGroup || 'O+',
          height: form.height || '',
          weight: form.weight || '',
        }
      : {
          ...form,
          name: form.name.trim() || 'Patient',
        };

    savePatientProfile(payloadToSave);

    if (onAddToast) {
      onAddToast({
        type: 'success',
        message: isSkip
          ? 'Profile skipped. Stored baseline setup in local encrypted edge storage.'
          : `✅ Profile saved for ${payloadToSave.name}. All data encrypted locally on device.`,
      });
    }

    onComplete();
  };

  const handleLoadDemoPatient = () => {
    const demoData = {
      name: 'Ramesh K.',
      age: '68',
      sex: 'Male',
      emergencyContact: '+919876543210',
      conditions: 'Hypertension, Type 2 Diabetes',
      allergies: 'Penicillin',
      currentMedications: 'Metformin 500mg, Amlodipine 5mg',
      bloodGroup: 'O+',
      height: '165 cm',
      weight: '72 kg',
    };

    setForm(demoData);

    if (onAddToast) {
      onAddToast({
        type: 'info',
        message: '⚡ Loaded Demo Patient: Ramesh K. (68, Male, Hypertension & Type 2 Diabetes)',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900">
      {/* ══ HEADER (WebMD Light Theme) ══ */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
              <Heart className="w-6 h-6 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-extrabold text-slate-900 leading-none tracking-tight">MedEase</h1>
              <p className="text-xs text-slate-600 font-bold leading-none mt-1 tracking-wide">AI Medication Safety</p>
            </div>
          </div>

          {/* Right Controls: Language Toggle + Privacy Badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(l => (l === 'EN' ? 'HI' : 'EN'))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs md:text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
            >
              <Globe className="w-4 h-4 text-blue-600" />
              <span>{lang}</span>
            </button>

            <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs md:text-sm font-bold bg-slate-900 text-white shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero-Cloud Edge Storage</span>
            </div>
          </div>
        </div>
      </header>

      {/* ══ MAIN ONBOARDING CONTAINER ══ */}
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-8 w-full">
        {/* Step Progress Bar Pill */}
        <div className="flex items-center justify-center gap-2 md:gap-3 mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600 text-white font-bold text-xs md:text-sm shadow-sm">
            <span className="w-5 h-5 rounded-full bg-white text-blue-600 flex items-center justify-center text-xs font-black">1</span>
            <span>Profile</span>
          </div>
          <div className="w-6 md:w-10 h-0.5 bg-slate-200" />
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-200 text-slate-500 font-semibold text-xs md:text-sm">
            <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center text-xs font-bold">2</span>
            <span>Today</span>
          </div>
          <div className="w-6 md:w-10 h-0.5 bg-slate-200" />
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-200 text-slate-500 font-semibold text-xs md:text-sm">
            <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center text-xs font-bold">3</span>
            <span>Review</span>
          </div>
        </div>

        {/* ══ THE FORM CARD (Clinical Light) ══ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10 space-y-8 animate-fade-in">
          {/* Header Typography */}
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              Tell us a little about you.
            </h2>
            <p className="text-slate-600 font-medium text-sm md:text-base">
              Only enter what your doctor has told you. You can skip any field. All details stay 100% encrypted on this device.
            </p>
          </div>

          {/* Form Fields Grid */}
          <div className="space-y-6">
            {/* Row 1: Name & Age */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh K."
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3.5 bg-white text-slate-900 font-semibold focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Age
                </label>
                <input
                  type="number"
                  placeholder="e.g. 68"
                  value={form.age}
                  onChange={e => handleChange('age', e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3.5 bg-white text-slate-900 font-semibold focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
                />
              </div>
            </div>

            {/* Row 2: Sex & Emergency Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Biological Sex
                </label>
                <select
                  value={form.sex}
                  onChange={e => handleChange('sex', e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3.5 bg-white text-slate-900 font-semibold focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all cursor-pointer"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-teal-600" />
                  Caregiver WhatsApp / Emergency Phone
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +919876543210"
                  value={form.emergencyContact}
                  onChange={e => handleChange('emergencyContact', e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3.5 bg-white text-slate-900 font-semibold focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
                />
              </div>
            </div>

            {/* Row 3: Medical Conditions & Allergies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-600" />
                  Known Medical Conditions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hypertension, Type 2 Diabetes"
                  value={form.conditions}
                  onChange={e => handleChange('conditions', e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3.5 bg-white text-slate-900 font-semibold focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Drug Allergies / Contraindications
                </label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Sulfa drugs"
                  value={form.allergies}
                  onChange={e => handleChange('allergies', e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3.5 bg-white text-slate-900 font-semibold focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
                />
              </div>
            </div>

            {/* Row 4: Current Medications */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-blue-600" />
                Current Prescriptions / Daily Medications
              </label>
              <input
                type="text"
                placeholder="e.g. Metformin 500mg, Amlodipine 5mg"
                value={form.currentMedications}
                onChange={e => handleChange('currentMedications', e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-3.5 bg-white text-slate-900 font-semibold focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
              />
            </div>

            {/* Row 5: Vitals (Blood Group, Height, Weight) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Blood Group
                </label>
                <select
                  value={form.bloodGroup}
                  onChange={e => handleChange('bloodGroup', e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3.5 bg-white text-slate-900 font-semibold focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all cursor-pointer"
                >
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Height
                </label>
                <input
                  type="text"
                  placeholder="e.g. 165 cm"
                  value={form.height}
                  onChange={e => handleChange('height', e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3.5 bg-white text-slate-900 font-semibold focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Weight
                </label>
                <input
                  type="text"
                  placeholder="e.g. 72 kg"
                  value={form.weight}
                  onChange={e => handleChange('weight', e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3.5 bg-white text-slate-900 font-semibold focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* ══ ACTION BUTTONS & HACKATHON DEMO INJECTION ══ */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Primary Action Button */}
              <button
                type="button"
                onClick={() => handleSave(false)}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold py-3.5 px-8 rounded-xl shadow-md transition-all duration-200 text-base md:text-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <span>Next: Today</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              {/* Secondary Skip Button */}
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="w-full sm:w-auto text-blue-600 hover:text-blue-800 font-bold py-3 px-6 hover:bg-blue-50 rounded-xl transition-all text-sm md:text-base cursor-pointer text-center"
              >
                Skip for now
              </button>
            </div>

            {/* Hackathon Demo Patient Trigger */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleLoadDemoPatient}
                className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>⚡ Load demo patient: Ramesh</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
