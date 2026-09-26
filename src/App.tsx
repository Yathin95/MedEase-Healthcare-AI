// ─────────────────────────────────────────────
//  Root App component — wires all modules
// ─────────────────────────────────────────────
import { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import NavBar from './components/NavBar';
import ToastContainer from './components/ToastContainer';
import DemoSandbox from './components/DemoSandbox';
import Dashboard from './screens/Dashboard';
import ScanPrescription from './screens/ScanPrescription';
import PatientView from './screens/PatientView';
import LabValidator from './screens/LabValidator';
import CaregiverView from './screens/CaregiverView';
import PatientOnboarding from './screens/PatientOnboarding';
import type { ActiveScreen, Toast, Medication, CaregiverContact, DoctorClarificationCard } from './types';
import {
  getLedger,
  getCaregivers,
  getClarificationCards,
  hasPatientProfile,
  getPatientProfile,
} from './ledgerService';

function App() {
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => hasPatientProfile());
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('dashboard');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [caregivers, setCaregivers] = useState<CaregiverContact[]>([]);
  const [clarificationCards, setClarificationCards] = useState<DoctorClarificationCard[]>([]);

  // ── Load state from ledger service ────────────

  const refreshState = useCallback(() => {
    const ledger = getLedger();
    setMedications([...ledger.medications]);
    setCaregivers([...getCaregivers()]);
    setClarificationCards([...getClarificationCards()]);
  }, []);

  useEffect(() => {
    refreshState();
    // Request notification permission on load
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [refreshState]);

  // ── Toast helpers ──────────────────────────────

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Screen renderer ────────────────────────────

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return (
          <Dashboard
            medications={medications}
            clarificationCards={clarificationCards}
            onNavigate={setActiveScreen}
          />
        );
      case 'scan':
        return (
          <ScanPrescription
            onAddToast={addToast}
            onDone={() => {
              refreshState();
              setActiveScreen('dashboard');
            }}
          />
        );
      case 'patient-view':
        return (
          <PatientView
            medications={medications}
            onRefresh={refreshState}
            onAddToast={addToast}
          />
        );
      case 'lab-validator':
        return (
          <LabValidator
            onAddToast={addToast}
            onCardCreated={refreshState}
          />
        );
      case 'caregiver':
        return (
          <CaregiverView
            caregivers={caregivers}
            clarificationCards={clarificationCards}
            onRefresh={refreshState}
            onAddToast={addToast}
          />
        );
    }
  };

  if (!isOnboarded) {
    return (
      <>
        <PatientOnboarding
          onComplete={() => {
            setIsOnboarded(true);
            refreshState();
          }}
          onAddToast={addToast}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  const patientProfile = getPatientProfile();
  const displayName = patientProfile?.name ? patientProfile.name.split(' ')[0] : '';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Subtle ambient glow — sky & slate only */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-48 w-96 h-96 bg-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-32 left-1/4 w-64 h-64 bg-transparent rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <Header onAddToast={addToast} />

      {/* Main content */}
      <main className="relative max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-36">
        {/* Screen title */}
        <div className="mb-6 flex items-center justify-between">
          {activeScreen === 'dashboard' && (
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                Good {getGreeting()}{displayName ? `, ${displayName}` : ''},
              </h2>
              <p className="text-slate-600 font-semibold text-sm md:text-base mt-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          )}

          {/* Quick Edit Profile Pill */}
          <button
            onClick={() => setIsOnboarded(false)}
            className="text-xs md:text-sm font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-xs"
          >
            👤 Edit Patient Profile
          </button>
        </div>

        {renderScreen()}
      </main>

      {/* Demo Sandbox */}
      <DemoSandbox
        medications={medications}
        onRefresh={refreshState}
        onAddToast={addToast}
        onCardCreated={refreshState}
      />

      {/* Bottom nav */}
      <NavBar active={activeScreen} onChange={setActiveScreen} />

      {/* Toast container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

export default App;
