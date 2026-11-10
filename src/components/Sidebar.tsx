/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  FileText,
  ReceiptText,
  Users,
  QrCode,
  ShieldCheck,
  History,
  Settings,
  Scale,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  unpaidCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, unpaidCount }) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Tableau de Bord',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'invoices',
      label: 'Factures Commerciales',
      icon: FileText,
      badge: unpaidCount > 0 ? `${unpaidCount}` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'receipts',
      label: 'Reçus & Quittances',
      icon: ReceiptText,
      badge: null,
    },
    {
      id: 'accounting',
      label: 'Comptabilité & Journaux',
      icon: BookOpen,
      badge: 'OHADA',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'customers',
      label: 'Clients & CRM',
      icon: Users,
      badge: null,
    },
    {
      id: 'verify',
      label: 'Vérification Publique',
      icon: QrCode,
      badge: 'Public',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
    {
      id: 'deriv',
      label: 'Conformité Deriv & Banques',
      icon: Scale,
      badge: 'Audit',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'audit',
      label: 'Journal d\'Audit SHA-256',
      icon: History,
      badge: null,
    },
    {
      id: 'settings',
      label: 'Paramètres & Sauvegardes',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 flex-1 space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Opérations Commerciales
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                    isActive
                      ? 'bg-white/20 text-white border-white/30'
                      : item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Compliance Bottom Banner */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-xs">
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Intégrité Comptable</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Système conforme OHADA & DGI Bénin. Documents vérifiables par empreinte cryptographique.
          </p>
        </div>
      </div>
    </aside>
  );
};
