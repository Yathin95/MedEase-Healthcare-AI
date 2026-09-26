// ─────────────────────────────────────────────
//  Bottom navigation — floating pill dock (light)
// ─────────────────────────────────────────────
import React from 'react';
import {
  LayoutDashboard,
  ScanLine,
  UserCircle,
  FlaskConical,
  Users,
} from 'lucide-react';
import type { ActiveScreen } from '../types';

interface NavBarProps {
  active: ActiveScreen;
  onChange: (screen: ActiveScreen) => void;
}

const NAV_ITEMS: { id: ActiveScreen; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard',     label: 'Home',    icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'scan',          label: 'Scan Rx', icon: <ScanLine className="w-5 h-5" /> },
  { id: 'patient-view',  label: 'Doses',   icon: <UserCircle className="w-5 h-5" /> },
  { id: 'lab-validator', label: 'Lab',     icon: <FlaskConical className="w-5 h-5" /> },
  { id: 'caregiver',     label: 'Family',  icon: <Users className="w-5 h-5" /> },
];

export default function NavBar({ active, onChange }: NavBarProps) {
  return (
    <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white backdrop-blur-md shadow-xl border border-slate-800 rounded-full px-4 py-2.5 sm:px-6">
      <div className="flex items-center gap-1 sm:gap-3">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`nav-item flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full transition-all duration-200 cursor-pointer ${
              active === item.id
                ? 'bg-blue-600 text-white font-bold shadow-md scale-105'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            {item.icon}
            <span className="text-xs md:text-sm font-bold tracking-wide">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
