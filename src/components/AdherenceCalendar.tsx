// ─────────────────────────────────────────────
//  Adherence Calendar & Historical Log Tracker
// ─────────────────────────────────────────────
import { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Droplets,
  Sparkles,
  Pill,
  Dumbbell,
  Info,
  X,
  Flame,
} from 'lucide-react';
import type { Medication, DoseLog } from '../types';
import { getDoseLog } from '../ledgerService';

interface AdherenceCalendarProps {
  medications: Medication[];
}

export default function AdherenceCalendar({ medications }: AdherenceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [showDetailModal, setShowDetailModal] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // All logs from storage
  const allLogs = useMemo(() => getDoseLog(), []);

  // Compute days in current month
  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(year, month, 1).getDay();
  }, [year, month]);

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Map of logs per date
  const logsByDate = useMemo(() => {
    const map: Record<string, DoseLog[]> = {};
    allLogs.forEach(log => {
      const d = new Date(log.takenAt);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;
      if (!map[key]) map[key] = [];
      map[key].push(log);
    });
    return map;
  }, [allLogs]);

  // Today ISO string
  const todayStr = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // Compute streak
  const currentStreak = useMemo(() => {
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;
      const logs = logsByDate[key] || [];
      if (logs.length > 0) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }, [logsByDate]);

  // Active supplements in ledger
  const activeSupplements = useMemo(() => {
    return medications.filter(
      m => m.category === 'Dietary Supplement / Fitness' || m.category === 'OTC Vitamin' || m.supplementAnalysis
    );
  }, [medications]);

  // Selected date logs
  const selectedDateLogs = useMemo(() => {
    return logsByDate[selectedDateStr] || [];
  }, [selectedDateStr, logsByDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (dayNum: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(dayNum).padStart(2, '0');
    const dateStr = `${year}-${mm}-${dd}`;
    setSelectedDateStr(dateStr);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Dynamic Hydration & Routine Tip Banner */}
      {activeSupplements.length > 0 ? (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 relative overflow-hidden">
          <div className="flex items-start gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Droplets className="w-5 h-5 text-blue-600" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Hydration & Routine Tip</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  {activeSupplements.length} active supplement{activeSupplements.length !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                💧 <strong className="text-blue-700 font-semibold">Active Intake Guidance:</strong> Maintain at least{' '}
                <span className="text-blue-700 font-bold">3.0 to 3.5 Liters</span> of daily water intake. Supplements like{' '}
                {activeSupplements.map(s => s.name).join(', ')} draw cellular water into muscle tissue and increase renal filtration turnover.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-700">Routine Tip</p>
              <p className="text-xs text-slate-500">Log daily medications and supplements to unlock personalized progress predictions and adherence streaks.</p>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Header & Streak */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{monthName}</h3>
              <p className="text-xs text-slate-500">Adherence & Supplement History</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentStreak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-700 text-xs font-bold">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{currentStreak} Day Streak!</span>
              </div>
            )}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 text-center border-b border-slate-200 pb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <span key={day} className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {day}
            </span>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {/* Empty cells before 1st day */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-11 rounded-xl bg-slate-100 opacity-40" />
          ))}

          {/* Month days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const mm = String(month + 1).padStart(2, '0');
            const dd = String(dayNum).padStart(2, '0');
            const dateKey = `${year}-${mm}-${dd}`;

            const logs = logsByDate[dateKey] || [];
            const isToday = dateKey === todayStr;
            const isSelected = dateKey === selectedDateStr;

            // Compute day status
            const hasLogs = logs.length > 0;
            const totalRequired = medications.length;
            const isAllTaken = hasLogs && (totalRequired === 0 || logs.length >= totalRequired);

            return (
              <button
                key={`day-${dayNum}`}
                onClick={() => handleDayClick(dayNum)}
                className={`h-11 rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 cursor-pointer border ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-sm scale-105 z-10'
                    : isToday
                    ? 'border-blue-400 bg-blue-50/70'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <span className={`text-xs font-semibold ${isToday ? 'text-blue-600 font-bold' : 'text-slate-700'}`}>
                  {dayNum}
                </span>

                {/* Indicator dots/checks */}
                <div className="flex items-center justify-center gap-0.5 mt-0.5">
                  {isAllTaken ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : hasLogs ? (
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 opacity-50" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Calendar Legend */}
        <div className="flex items-center justify-center gap-5 pt-2 text-[11px] text-slate-500 border-t border-slate-200">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Complete Logged</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Partial Intake</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span>No Intake</span>
          </div>
        </div>
      </div>

      {/* Date Detail Drawer Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 animate-slide-in-up shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">
                    {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </h4>
                  <p className="text-xs text-slate-500">Historical Intake Audit Log</p>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-800 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Logs List */}
            {selectedDateLogs.length > 0 ? (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {selectedDateLogs.map((log, idx) => {
                  const logTime = new Date(log.takenAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const isSupplement = log.category === 'Dietary Supplement / Fitness' || log.category === 'OTC Vitamin';

                  return (
                    <div
                      key={log.id || idx}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl ${
                            isSupplement ? 'bg-teal-50 text-teal-600' : 'bg-blue-50 text-blue-600'
                          } flex items-center justify-center flex-shrink-0`}
                        >
                          {isSupplement ? <Dumbbell className="w-4 h-4" /> : <Pill className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{log.medicationName}</p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="badge-pill bg-slate-200 text-slate-600 text-[10px] py-0">
                              {log.category || 'Prescription Medicine'}
                            </span>
                            <span>• {log.verificationMethod}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-1 text-slate-700 text-xs font-mono bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                        <Clock className="w-3 h-3 text-blue-500" />
                        {logTime}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">No intake logs for this date</p>
                <p className="text-xs text-slate-500 mt-0.5">Ensure you check in your daily doses & supplements</p>
              </div>
            )}

            <button
              onClick={() => setShowDetailModal(false)}
              className="w-full btn-ghost text-sm py-2.5"
            >
              Close Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
