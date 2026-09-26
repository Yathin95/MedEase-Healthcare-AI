// ─────────────────────────────────────────────
//  Module 5 — Caregiver & Family Notification System
// ─────────────────────────────────────────────
import { useState } from 'react';
import {
  Users,
  Phone,
  MessageSquare,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  UserCircle,
  ChevronDown,
  ChevronUp,
  Send,
  Bell,
  X,
} from 'lucide-react';
import type { CaregiverContact, DoctorClarificationCard, Toast } from '../types';
import { saveCaregivers } from '../ledgerService';

interface CaregiverViewProps {
  caregivers: CaregiverContact[];
  clarificationCards: DoctorClarificationCard[];
  onRefresh: () => void;
  onAddToast: (t: Omit<Toast, 'id'>) => void;
}

const ROLES: CaregiverContact['role'][] = ['Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Doctor', 'Other'];

function sendWhatsApp(phone: string, message: string) {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedMsg = encodeURIComponent(message);
  window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`, '_blank');
}

export default function CaregiverView({
  caregivers,
  clarificationCards,
  onRefresh,
  onAddToast,
}: CaregiverViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<CaregiverContact['role']>('Spouse');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const pendingCards = clarificationCards.filter(c => !c.acknowledged);

  const handleAdd = () => {
    if (!newName.trim() || !newPhone.trim()) {
      onAddToast({ type: 'warning', message: 'Please provide both name and phone number.' });
      return;
    }
    const updated = [...caregivers, { id: crypto.randomUUID(), name: newName.trim(), phone: newPhone.trim(), role: newRole }];
    saveCaregivers(updated);
    onRefresh();
    setNewName(''); setNewPhone(''); setNewRole('Spouse'); setShowAddForm(false);
    onAddToast({ type: 'success', message: `${newName} added as a caregiver.` });
  };

  const handleDelete = (id: string) => {
    const updated = caregivers.filter(c => c.id !== id);
    saveCaregivers(updated);
    onRefresh();
    onAddToast({ type: 'info', message: 'Caregiver removed.' });
  };

  const handleNotifyAll = () => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission().then(p => {
        if (p !== 'granted') {
          onAddToast({ type: 'warning', message: 'Please allow browser notifications to use this feature.' });
        }
      });
    } else {
      new Notification('MedEase – Caregiver Update', {
        body: `A dose reminder notification has been sent to all caregivers.`,
      });
    }
    onAddToast({ type: 'success', message: '🔔 Browser notification sent to all caregivers.' });
  };

  const handleWhatsApp = (c: CaregiverContact, msg?: string) => {
    const message = msg ?? `[MedEase Caregiver Update] Hello ${c.name}, this is an update from MedEase regarding the patient's medication status. Please check in when you can. 💊`;
    sendWhatsApp(c.phone, message);
  };

  const roleColors: Record<CaregiverContact['role'], string> = {
    Spouse: 'bg-rose-500/20 text-rose-300',
    Parent: 'bg-amber-500/20 text-amber-300',
    Child: 'bg-blue-500/20 text-blue-300',
    Sibling: 'bg-violet-500/20 text-violet-300',
    Friend: 'bg-emerald-500/20 text-emerald-300',
    Doctor: 'bg-cyan-500/20 text-cyan-300',
    Other: 'bg-slate-500/20 text-slate-300',
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Caregiver Dashboard</h2>
          <p className="text-sm text-slate-400 mt-0.5">{caregivers.length} contact{caregivers.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button onClick={handleNotifyAll} className="btn-ghost flex items-center gap-2 text-sm px-3 py-2">
          <Bell className="w-4 h-4" /> Notify All
        </button>
      </div>

      {/* ── Doctor Clarification Alerts ─────────── */}
      {pendingCards.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-bold text-red-300 uppercase tracking-wide">⚠️ Doctor Clarification Required</span>
            <span className="ml-auto badge-pill bg-red-500 text-white">{pendingCards.length}</span>
          </div>

          {pendingCards.map(card => (
            <div key={card.id} className="glass-card border-2 border-red-500/50 bg-red-950/20 glow-red rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
                className="w-full p-4 flex items-start gap-3 text-left"
              >
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-red-300">Drug-Lab Concern: {card.prescribedDrug}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(card.createdAt).toLocaleString()}</p>
                </div>
                {expandedCard === card.id
                  ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                }
              </button>

              {expandedCard === card.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-red-800/30 pt-3">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">AI Analysis</p>
                    <p className="text-sm text-slate-300">{card.aiAnalysis}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Questions for Doctor</p>
                    <ul className="space-y-1">
                      {card.questions.map((q, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-red-400 font-bold flex-shrink-0">{i + 1}.</span> {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {caregivers.map(c => (
                      <button
                        key={c.id}
                        onClick={() => handleWhatsApp(c, `[URGENT – MedEase] Hello ${c.name}, a potential drug-lab concern has been detected for the patient taking "${card.prescribedDrug}". Please assist them in contacting their doctor. AI Analysis: ${card.aiAnalysis}`)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-700/30 border border-green-600/40 text-green-300 hover:bg-green-700/40 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" /> Alert {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Caregiver contacts ──────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-400">Family & Contacts</span>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Contact
          </button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div className="glass-card p-4 space-y-3 animate-slide-in-up">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white text-sm">New Caregiver</p>
              <button onClick={() => setShowAddForm(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full Name" className="input-field text-sm" />
            <input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+91 91481 16869" className="input-field text-sm" />
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value as CaregiverContact['role'])}
              className="input-field text-sm"
            >
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button onClick={handleAdd} className="btn-primary w-full text-sm py-2">
              Save Contact
            </button>
          </div>
        )}

        {/* Contact cards */}
        {caregivers.map(c => (
          <div key={c.id} className="glass-card p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                <UserCircle className="w-6 h-6 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-white">{c.name}</p>
                  <span className={`badge-pill text-[10px] ${roleColors[c.role]}`}>{c.role}</span>
                </div>
                <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {c.phone}
                </p>
              </div>
              <button
                onClick={() => handleDelete(c.id)}
                className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleWhatsApp(c)}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-green-700/20 border border-green-600/30 text-green-300 text-sm font-medium hover:bg-green-700/30 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                📲 WhatsApp
              </button>
              <button
                onClick={() => {
                  if (Notification.permission !== 'granted') {
                    Notification.requestPermission();
                  }
                  onAddToast({ type: 'success', message: `🔔 Browser notification queued for ${c.name}.` });
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-700/20 border border-blue-600/30 text-blue-300 text-sm font-medium hover:bg-blue-700/30 transition-colors"
              >
                <Send className="w-4 h-4" /> Notify
              </button>
            </div>
          </div>
        ))}

        {caregivers.length === 0 && (
          <div className="glass-card p-8 text-center">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400">No caregivers added yet.</p>
          </div>
        )}
      </div>

      {/* Dose log summary */}
      {clarificationCards.filter(c => c.acknowledged).length > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <p className="text-sm font-semibold text-slate-300">Resolved Clarifications</p>
          </div>
          {clarificationCards.filter(c => c.acknowledged).map(c => (
            <div key={c.id} className="text-xs text-slate-500 py-1 border-t border-slate-800">
              {c.prescribedDrug} · {new Date(c.createdAt).toLocaleDateString()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
