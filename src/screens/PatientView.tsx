// ─────────────────────────────────────────────
//  Module 3 — Patient Dual-Interface View
//  Regular Mode + Autonomous Video Proctoring (Liveness & Anti-Spoofing)
// ─────────────────────────────────────────────
import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Video,
  VideoOff,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Clock,
  Pill,
  ChevronRight,
  Loader2,
  Bell,
  Scan,
} from 'lucide-react';
import type { Medication, Toast } from '../types';
import { markDoseTaken, getCaregivers, formatNextDose } from '../ledgerService';
import { verifyDrugFromFrame } from '../geminiService';

interface PatientViewProps {
  medications: Medication[];
  onRefresh: () => void;
  onAddToast: (t: Omit<Toast, 'id'>) => void;
}

function playSuccessChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // AudioContext blocked or unavailable
  }
}

export default function PatientView({ medications, onRefresh, onAddToast }: PatientViewProps) {
  const [isProctoring, setIsProctoring] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [spoofAlert, setSpoofAlert] = useState<string | null>(null);
  const [wrongMedAlert, setWrongMedAlert] = useState<string | null>(null);
  const [proctoringSuccess, setProctoringSuccess] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);
  const [selectedMedId, setSelectedMedId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const verifyingRef = useRef(false);
  const activeMedRef = useRef<Medication | null>(null);

  const pendingMeds = medications.filter(m => !m.takenToday);
  const nextMed = pendingMeds[0] ?? medications[0];
  const activeMed = selectedMedId
    ? medications.find(m => m.id === selectedMedId) ?? nextMed
    : nextMed;

  useEffect(() => {
    activeMedRef.current = activeMed ?? null;
  }, [activeMed]);

  // ── Camera binding effect ───────────────────────────────
  useEffect(() => {
    if (!isProctoring) {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        setStream(null);
      }
      setWrongMedAlert(null);
      setSpoofAlert(null);
      setProctoringSuccess(false);
      return;
    }

    let activeStream: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      .then((s) => {
        activeStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((err) => console.error("Video play error:", err));
          };
        }
      })
      .catch((err) => {
        console.error("Camera access error:", err);
        onAddToast({ type: 'error', message: 'Camera access denied or unavailable.' });
      });

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isProctoring, onAddToast]);

  // ── Mark dose taken & dispatch WhatsApp ─────────────────
  const handleTakeDose = useCallback((med: Medication) => {
    markDoseTaken(med.id, isProctoring ? 'video-proctoring' : 'manual');
    onRefresh();

    // Browser notification
    if (Notification.permission === 'granted') {
      new Notification('💊 Dose Recorded – MedEase', {
        body: `${med.name} ${med.dosage} has been taken and logged.`,
        icon: '/pwa-192x192.png',
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          new Notification('💊 Dose Recorded – MedEase', {
            body: `${med.name} ${med.dosage} has been taken and logged.`,
          });
        }
      });
    }

    // WhatsApp automatic trigger
    const caregivers = getCaregivers();
    caregivers.forEach(c => {
      const cleanPhone = c.phone.replace(/\D/g, '');
      const msg = encodeURIComponent(
        `[MedEase Update] ${new Date().toLocaleTimeString()} — Patient has taken ${med.name} ${med.dosage}. ✅`
      );
      window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`, '_blank');
    });
  }, [isProctoring, onRefresh]);

  // ── Autonomous Frame Checking ───────────────────────────
  const runAutonomousCheck = useCallback(async (med: Medication) => {
    if (!videoRef.current || verifyingRef.current) return;

    verifyingRef.current = true;
    setVerifying(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 1280;
      canvas.height = videoRef.current.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      const result = await verifyDrugFromFrame(dataUrl, med.name);

      // Gating Logic
      if (result.spoofDetected) {
        setSpoofAlert("⚠️ Spoof Detected: Please present the genuine physical medicine bottle or blister pack, not a screen or photocopy.");
        setWrongMedAlert(null);
      } else if (result.isPhysicalMedicine && !result.matchesScheduled) {
        setWrongMedAlert(`🛑 Stop! You are holding ${result.detectedName || 'an unrecognized drug'}. Scheduled dose is ${med.name}.`);
        setSpoofAlert(null);
      } else if (result.isPhysicalMedicine && result.matchesScheduled) {
        // Success
        setSpoofAlert(null);
        setWrongMedAlert(null);
        setProctoringSuccess(true);
        playSuccessChime();
        setSuccessFlash(true);
        setTimeout(() => setSuccessFlash(false), 2000);

        onAddToast({ type: 'success', message: `✅ Medicine Verified: ${med.name} logged.` });
        handleTakeDose(med);
      }
    } catch (err) {
      console.error("Frame check error:", err);
    } finally {
      verifyingRef.current = false;
      setVerifying(false);
    }
  }, [onAddToast, handleTakeDose]);

  // ── Autonomous Polling Loop (4.5s Interval) ─────────────
  useEffect(() => {
    if (!isProctoring || proctoringSuccess) return;

    const interval = setInterval(() => {
      if (verifyingRef.current) {
        return;
      }
      if (activeMedRef.current && videoRef.current) {
        runAutonomousCheck(activeMedRef.current);
      }
    }, 4500); // 4.5s loop (15 RPM free-tier compliant)

    return () => clearInterval(interval);
  }, [isProctoring, proctoringSuccess, runAutonomousCheck]);

  const handleToggleMode = (enabled: boolean) => {
    setIsProctoring(enabled);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Mode toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-900">
            {isProctoring ? '📹 Live Video Proctoring' : '🔔 Regular Reminder Mode'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {isProctoring ? 'Autonomous Liveness & AI Verification active' : 'Tap to confirm you took your dose'}
          </p>
        </div>
        <label className="toggle-switch flex-shrink-0">
          <input
            type="checkbox"
            checked={isProctoring}
            onChange={e => handleToggleMode(e.target.checked)}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      {/* ══ REGULAR MODE ══ */}
      {!isProctoring && (
        <div className="space-y-4">
          {pendingMeds.length > 0 ? (
            <>
              {/* Medication selector if multiple pending */}
              {pendingMeds.length > 1 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 uppercase tracking-widest px-1 font-semibold">Select Medication</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {pendingMeds.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMedId(m.id)}
                        className={`flex-shrink-0 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                          activeMed?.id === m.id
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeMed && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center space-y-5">
                  <div className={`w-20 h-20 rounded-2xl ${activeMed.color} flex items-center justify-center mx-auto shadow-md`}>
                    <Pill className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-extrabold text-blue-900">{activeMed.name}</h2>
                    <p className="text-2xl font-bold text-slate-800 mt-0.5">{activeMed.dosage}</p>
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-blue-700 font-semibold text-sm">{formatNextDose(activeMed.nextDose)}</span>
                    </div>
                  </div>

                  {/* Giant "Mark as Taken" button — hospital teal */}
                  <button
                    onClick={() => {
                      handleTakeDose(activeMed);
                      onAddToast({ type: 'success', message: `✅ ${activeMed.name} recorded. WhatsApp alert dispatched.` });
                    }}
                    className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-lg font-bold shadow-md transition-all active:scale-[0.99]"
                  >
                    ✅ I Took This
                  </button>

                  <p className="text-xs text-slate-500">Tap to record dose & notify caregivers</p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center">
              <CheckCircle2 className="w-16 h-16 text-teal-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-slate-900">All Caught Up!</h3>
              <p className="text-slate-500 mt-1">No pending doses. Well done today! 🎉</p>
            </div>
          )}
        </div>
      )}

      {/* ══ VIDEO PROCTORING MODE ══ */}
      {isProctoring && (
        <div className="space-y-4">
          {/* 16:9 viewfinder — Clinical Light */}
          <div className="relative overflow-hidden rounded-xl border-4 border-slate-200 bg-slate-100 shadow-md aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover rounded-xl"
            />

            {/* HUD corner brackets — blue */}
            <span className="hud-tl" />
            <span className="hud-tr" />
            <span className="hud-bl" />
            <span className="hud-br" />

            {/* Radar scanner line when active and not success */}
            {stream && !proctoringSuccess && (
              <div className="radar-scanline" />
            )}

            {/* Green flash overlay on verified ingestion */}
            {successFlash && (
              <div className="absolute inset-0 bg-teal-500/30 backdrop-blur-xs z-30 transition-all duration-500 flex items-center justify-center animate-pulse">
                <CheckCircle2 className="w-20 h-20 text-teal-600 animate-bounce" />
              </div>
            )}
            
            {/* Live badge & overlay */}
            {stream ? (
              <>
                <div className="video-overlay absolute inset-0 pointer-events-none" />
                <div className="absolute top-8 left-8 flex items-center gap-2 bg-red-600/90 rounded-full px-3 py-1 z-10">
                  <div className="w-2 h-2 rounded-full bg-red-200 animate-pulse" />
                  <span className="text-xs font-bold text-white">LIVE</span>
                </div>
                
                {/* Status indicator — solid white/90 backdrop */}
                <div className="absolute top-8 right-8 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200 z-10 flex items-center gap-1.5 shadow-sm">
                  <Scan className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                  <span className="text-[11px] font-semibold text-slate-900">
                    {verifying ? '⚡ Analyzing 3D Packaging...' : '🔍 AI Scanning'}
                  </span>
                </div>

                {/* Subtitle status bar — white backdrop for contrast */}
                <div className="absolute bottom-8 left-8 right-8 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 text-center shadow-sm">
                  <p className="text-xs text-slate-900 font-medium">
                    {proctoringSuccess
                      ? '✅ Ingestion Complete & Caregiver Notified'
                      : verifying
                      ? '⚡ Running Liveness & Anti-Spoofing check...'
                      : '🔍 Present 3D medicine packaging to camera...'}
                  </p>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100/90 z-10">
                <div className="text-center space-y-2">
                  <VideoOff className="w-10 h-10 text-slate-400 mx-auto animate-pulse" />
                  <p className="text-slate-600 text-sm font-medium">Initialising Camera Stream…</p>
                  <p className="text-xs text-slate-500">Please ensure camera permissions are allowed</p>
                </div>
              </div>
            )}
          </div>

          {/* Amber Spoof Warning — light */}
          {spoofAlert && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-7 h-7 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-800 text-base leading-tight">Spoof Detected!</p>
                  <p className="text-sm text-amber-700 mt-1">{spoofAlert}</p>
                </div>
              </div>
            </div>
          )}

          {/* Red Alert Banner — clinical left-border style */}
          {wrongMedAlert && (
            <div className="bg-red-50 border-l-4 border-red-600 rounded-r-xl p-4">
              <div className="flex items-start gap-3">
                <AlertOctagon className="w-7 h-7 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-900 text-base leading-tight">Wrong Medicine!</p>
                  <p className="text-sm text-red-800 mt-1 whitespace-pre-line">{wrongMedAlert}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Summary Card */}
          {proctoringSuccess && (
            <div className="glass-card p-5 border-2 border-emerald-500/70 bg-emerald-950/30 glow-emerald animate-slide-in-up space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-7 h-7 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-emerald-300 text-base">Dose Verified & Logged!</p>
                  <p className="text-xs text-emerald-200/80">{activeMed?.name} recorded in edge ledger. Tap below to notify caregivers.</p>
                </div>
              </div>
              {/* Manual WhatsApp dispatch — requires user click to bypass browser popup block */}
              {(() => {
                const caregivers = getCaregivers();
                const primaryCaregiver = caregivers[0] ?? null;
                const handleWhatsApp = () => {
                  if (!primaryCaregiver) return;
                  const cleanPhone = primaryCaregiver.phone.replace(/\D/g, '');
                  const msg = encodeURIComponent(
                    `MedEase Alert: The scheduled dose of ${activeMed?.name ?? 'medication'} has been securely verified and taken by the patient.`
                  );
                  window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
                };
                return (
                  <button
                    onClick={handleWhatsApp}
                    disabled={!primaryCaregiver}
                    className="w-full py-3 bg-[#25D366] hover:bg-[#128C7E] disabled:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    {primaryCaregiver ? '📲 Send Caregiver WhatsApp Alert' : 'No Caregiver Contact Saved'}
                  </button>
                );
              })()}
              <button
                onClick={() => { setProctoringSuccess(false); setWrongMedAlert(null); setSpoofAlert(null); }}
                className="btn-ghost w-full text-xs py-2"
              >
                Scan Another Dose
              </button>
            </div>
          )}

          {/* Active Medication Indicator */}
          {activeMed && !proctoringSuccess && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${activeMed.color} flex items-center justify-center flex-shrink-0`}>
                    <Pill className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{activeMed.name}</p>
                    <p className="text-sm text-slate-500">{activeMed.dosage} · {activeMed.frequency}</p>
                  </div>
                </div>
                <div className="badge-pill bg-blue-50 text-blue-700 border border-blue-200 text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Autonomous
                </div>
              </div>

              {/* Selector if multiple */}
              {medications.length > 1 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Target Medicine</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {medications.map(m => (
                      <button
                        key={m.id}
                        onClick={() => { setSelectedMedId(m.id); setProctoringSuccess(false); setWrongMedAlert(null); setSpoofAlert(null); }}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                          activeMed.id === m.id
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Proctoring info */}
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200">
            <Bell className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <p className="text-xs text-slate-600">
              AI continuously checks for <strong className="text-blue-700">3D physical packaging</strong> & rejects digital screens or paper photocopies automatically every 4.5s.
            </p>
          </div>

          <button onClick={() => handleToggleMode(false)} className="btn-ghost w-full flex items-center justify-center gap-2 text-sm py-3">
            <Video className="w-4 h-4" /> Exit Proctoring Mode
          </button>
        </div>
      )}

      {/* All medications mini-list */}
      {medications.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wide px-1 font-semibold">All Medications</p>
          {medications.map(m => (
            <div
              key={m.id}
              className={`bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-all ${!isProctoring && !m.takenToday ? 'cursor-pointer' : ''}`}
              onClick={() => { if (!isProctoring && !m.takenToday) setSelectedMedId(m.id); }}
            >
              <div className={`w-8 h-8 rounded-lg ${m.color} flex items-center justify-center flex-shrink-0`}>
                <Pill className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{m.name}</p>
                <p className="text-xs text-slate-500">{m.dosage}</p>
              </div>
              {m.takenToday ? (
                <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
