// ─────────────────────────────────────────────
//  App Header — WebMD Clinical Light theme
// ─────────────────────────────────────────────
import { ShieldCheck, Heart } from 'lucide-react';
import type { Toast } from '../types';

interface HeaderProps {
  onAddToast: (toast: Omit<Toast, 'id'>) => void;
}

export default function Header({ onAddToast }: HeaderProps) {
  const handleBadgeClick = () => {
    onAddToast({
      type: 'info',
      message:
        'Edge-Architecture: All patient medication ledgers are encrypted and stored exclusively on this physical device. Zero cloud health data transmission.',
      duration: 8000,
    });
  };

  return (
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

        {/* Security badge (Dark themed & bold) */}
        <button
          onClick={handleBadgeClick}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs md:text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all duration-200 shadow-sm"
          title="Click to learn about data security"
        >
          <div className="relative">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          <span className="hidden sm:block">Data Encrypted Locally</span>
          <span className="sm:hidden">Secure</span>
        </button>
      </div>
    </header>
  );
}
