/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building2, 
  ShieldCheck, 
  User, 
  LogOut, 
  LogIn, 
  QrCode, 
  Coins,
  FileCheck,
  CheckCircle2
} from 'lucide-react';
import { BusinessProfile, CurrencyCode, UserSession } from '../types.ts';

interface NavbarProps {
  profile: BusinessProfile;
  session: UserSession | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onNavigate: (tab: string) => void;
  selectedCurrency: CurrencyCode;
  onCurrencyChange: (c: CurrencyCode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  session,
  onOpenLogin,
  onLogout,
  onNavigate,
  selectedCurrency,
  onCurrencyChange,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Business Brand & Official Status */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-emerald-600 flex items-center justify-center shadow-lg shadow-indigo-950/40 border border-indigo-400/30">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-slate-100">
                  {profile.commercialName || profile.officialBusinessName}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Bénin Réglementaire
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center space-x-2">
                <span>RCCM: {profile.rccmNumber || 'Non renseigné'}</span>
                <span>•</span>
                <span>IFU: {profile.ifuNumber || 'Non renseigné'}</span>
              </div>
            </div>
          </div>

          {/* Right Tools & Account */}
          <div className="flex items-center space-x-4">
            
            {/* Currency Selector */}
            <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <span className="text-slate-400 px-2 flex items-center">
                <Coins className="w-3.5 h-3.5 mr-1 text-amber-400" />
                Devise:
              </span>
              {(['XOF', 'EUR', 'USD'] as CurrencyCode[]).map((cur) => (
                <button
                  key={cur}
                  onClick={() => onCurrencyChange(cur)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                    selectedCurrency === cur
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cur}
                </button>
              ))}
            </div>

            {/* Quick Public Verification Access */}
            <button
              onClick={() => onNavigate('verify')}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700/80 hover:border-slate-600 transition-all shadow-sm"
              title="Vérifier l'authenticité d'un document"
            >
              <QrCode className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
              <span>Vérification Publique</span>
            </button>

            {/* User Session / Role */}
            {session ? (
              <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
                <div className="text-right hidden md:block">
                  <div className="text-xs font-semibold text-slate-200">{session.name}</div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-indigo-400">
                    {session.role === 'ADMIN' ? 'Administrateur' : session.role === 'BILLING_OFFICER' ? 'Comptable' : 'Auditeur'}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-900/50 transition-all"
                  title="Déconnexion"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm shadow-indigo-900/30"
              >
                <LogIn className="w-3.5 h-3.5 mr-1.5" />
                <span>Connexion Staff</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
