// ─────────────────────────────────────────────
//  Dashboard — Module 1 overview screen
// ─────────────────────────────────────────────
import { useMemo } from 'react';
import {
  Pill,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
  ChevronRight,
  Dumbbell,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import type { Medication, DoctorClarificationCard, ActiveScreen } from '../types';
import { formatNextDose, getPatientProfile } from '../ledgerService';
import AdherenceCalendar from '../components/AdherenceCalendar';

interface DashboardProps {
  medications: Medication[];
  clarificationCards: DoctorClarificationCard[];
  onNavigate: (screen: ActiveScreen) => void;
}

export default function Dashboard({ medications, clarificationCards, onNavigate }: DashboardProps) {
  const taken = medications.filter(m => m.takenToday).length;
  const pending = medications.length - taken;
  const adherence = medications.length
    ? Math.round((taken / medications.length) * 100)
    : 100;

  const nextMed = useMemo(
    () =>
      medications
        .filter(m => !m.takenToday)
        .sort((a, b) => {
          const ta = new Date(a.nextDose ?? 0).getTime();
          const tb = new Date(b.nextDose ?? 0).getTime();
          return ta - tb;
        })[0],
    [medications]
  );

  const pendingCards = clarificationCards.filter(c => !c.acknowledged);
  const profile = getPatientProfile();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Patient Profile Summary Banner */}
      {profile && profile.name && (
        <div className="glass-card p-5 bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-xl shadow-sm">
              {profile.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-slate-900">{profile.name}</h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  {profile.age ? `${profile.age} yrs` : ''} {profile.sex ? `· ${profile.sex}` : ''}
                </span>
                {profile.bloodGroup && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                    🩸 {profile.bloodGroup}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-600 font-semibold">
                {profile.conditions && (
                  <span className="flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200">
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    {profile.conditions}
                  </span>
                )}
                {profile.allergies && profile.allergies !== 'None listed' && (
                  <span className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-md border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Allergy: {profile.allergies}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right text-xs font-bold text-slate-500 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
            <span>Verified Edge Profile</span>
          </div>
        </div>
      )}

      {/* Top Grid: Hero Stats & Adherence Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Meds */}
        <div className="glass-card p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Meds</span>
            <p className="text-3xl lg:text-4xl font-black text-slate-900 mt-1">{medications.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <Pill className="w-6 h-6 text-blue-700" />
          </div>
        </div>

        {/* Taken Today */}
        <div className="glass-card p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Taken Today</span>
            <p className="text-3xl lg:text-4xl font-black text-teal-700 mt-1">{taken}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-teal-700" />
          </div>
        </div>

        {/* Pending */}
        <div className="glass-card p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Doses</span>
            <p className="text-3xl lg:text-4xl font-black text-amber-700 mt-1">{pending}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-700" />
          </div>
        </div>

        {/* Adherence Gauge */}
        <div className="glass-card p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Adherence Rate
            </span>
            <span className="text-xl font-black text-blue-700">{adherence}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden my-2 border border-slate-200">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-700 shadow-sm"
              style={{ width: `${adherence}%` }}
            />
          </div>
          <p className="text-xs font-bold text-slate-600">
            {adherence === 100 ? '🎉 Perfect adherence today!' : `${pending} dose${pending !== 1 ? 's' : ''} remaining`}
          </p>
        </div>
      </div>

      {/* Next Dose Banner & Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Next dose card */}
        {nextMed ? (
          <div
            className="glass-card p-5 border-blue-300 bg-blue-50/40 cursor-pointer hover:bg-blue-50 transition-all duration-200 shadow-sm flex flex-col justify-between"
            onClick={() => onNavigate('patient-view')}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl ${nextMed.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <Pill className="w-7 h-7 text-white" />
                </div>
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-600 text-white uppercase tracking-wider mb-1">
                    Up Next
                  </span>
                  <p className="text-xl md:text-2xl font-black text-slate-900">{nextMed.name}</p>
                  <p className="text-sm font-semibold text-slate-600 mt-0.5">{nextMed.dosage} · {nextMed.frequency}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white font-bold text-xs md:text-sm shadow-sm">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  {formatNextDose(nextMed.nextDose)}
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 mt-3 ml-auto" />
              </div>
            </div>
          </div>
        ) : medications.length === 0 ? (
          <div className="glass-card p-6 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <Pill className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-slate-900 font-extrabold text-base">No medications logged yet</p>
            <p className="text-slate-500 text-xs mt-1">Scan a prescription or add supplements manually to start tracking</p>
            <button
              onClick={() => onNavigate('scan')}
              className="btn-primary mt-4 text-xs md:text-sm font-bold"
            >
              Scan Prescription
            </button>
          </div>
        ) : (
          <div className="glass-card p-6 border-teal-300 bg-teal-50/40 flex items-center gap-4">
            <CheckCircle2 className="w-10 h-10 text-teal-600 flex-shrink-0" />
            <div>
              <p className="font-extrabold text-slate-900 text-lg">All doses completed today!</p>
              <p className="text-sm font-semibold text-slate-600 mt-0.5">Awesome job! Your next scheduled doses are queued for tomorrow.</p>
            </div>
          </div>
        )}

        {/* Doctor clarification alerts */}
        {pendingCards.length > 0 && (
          <div
            className="glass-card p-5 bg-red-50 border-red-300 cursor-pointer hover:bg-red-100/60 transition-all duration-200 shadow-sm flex items-center justify-between"
            onClick={() => onNavigate('caregiver')}
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <AlertCircle className="w-10 h-10 text-red-600" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-xs text-white flex items-center justify-center font-black">
                  {pendingCards.length}
                </span>
              </div>
              <div>
                <p className="font-extrabold text-red-900 text-base md:text-lg">Doctor Clarification Required</p>
                <p className="text-xs md:text-sm font-semibold text-slate-700 mt-0.5">
                  {pendingCards.length} card{pendingCards.length !== 1 ? 's' : ''} awaiting review — tap to resolve in Caregiver Portal
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-red-700" />
          </div>
        )}
      </div>

      {/* Adherence Calendar & Tracker */}
      <AdherenceCalendar medications={medications} />

      {/* Today's medications schedule list (Responsive Grid on Laptop) */}
      {medications.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-700" />
              <h3 className="text-base md:text-lg font-extrabold text-slate-900">Today's Medication Schedule</h3>
            </div>
            <span className="text-xs md:text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {medications.length} active item{medications.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {medications.map(med => {
              const isSupplement = med.category === 'Dietary Supplement / Fitness' || med.category === 'OTC Vitamin';

              return (
                <div
                  key={med.id}
                  className={`glass-card p-4.5 flex items-center gap-4 transition-all duration-200 ${
                    med.takenToday ? 'opacity-60 bg-slate-50' : 'hover:shadow-md'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl ${med.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    {isSupplement ? <Dumbbell className="w-6 h-6 text-white" /> : <Pill className="w-6 h-6 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-slate-900 text-base md:text-lg truncate">{med.name}</p>
                      <span className={`text-[10px] md:text-xs px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider ${
                        isSupplement ? 'bg-teal-100 text-teal-800 border border-teal-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {med.category || 'Prescription'}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm font-semibold text-slate-600 mt-1">{med.dosage} · {med.frequency}</p>
                    {med.supplementAnalysis?.interactionWarning && (
                      <p className="text-xs text-red-600 font-bold mt-1 flex items-center gap-1">
                        ⚠️ Conflict Alert: {med.supplementAnalysis.interactionWarning}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {med.takenToday ? (
                      <div className="flex items-center gap-1 text-teal-700 font-bold text-xs md:text-sm bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                        <CheckCircle2 className="w-4 h-4 text-teal-600" />
                        Taken
                      </div>
                    ) : (
                      <div className="badge-pill bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-1">
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        {formatNextDose(med.nextDose)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
