/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  TrendingUp,
  FileText,
  ReceiptText,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Scale,
  PlusCircle,
  Building2,
  Coins
} from 'lucide-react';
import { BusinessProfile, CurrencyCode, Invoice, Receipt } from '../types.ts';
import { formatCurrency, formatDate, formatDateTime, getInvoiceStatusBadge, getPaymentMethodLabel } from '../lib/formatters.ts';

interface DashboardViewProps {
  stats: {
    totalRevenueByCurrency: Record<string, number>;
    outstandingByCurrency: Record<string, number>;
    invoiceCounts: {
      total: number;
      paid: number;
      partiallyPaid: number;
      unpaid: number;
      cancelled: number;
    };
    totalReceipts: number;
    totalCustomers: number;
    recentReceipts: Receipt[];
    recentInvoices: Invoice[];
  } | null;
  profile: BusinessProfile;
  selectedCurrency: CurrencyCode;
  onNavigate: (tab: string) => void;
  onViewInvoice: (inv: Invoice) => void;
  onViewReceipt: (rec: Receipt) => void;
  onCreateInvoice: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  profile,
  selectedCurrency,
  onNavigate,
  onViewInvoice,
  onViewReceipt,
  onCreateInvoice,
}) => {
  if (!stats) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-3" />
        <span>Chargement des indicateurs financiers...</span>
      </div>
    );
  }

  const collectedCurrentCurrency = stats.totalRevenueByCurrency[selectedCurrency] || 0;
  const outstandingCurrentCurrency = stats.outstandingByCurrency[selectedCurrency] || 0;

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Business Status & Compliance Registry */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4" />
              <span>Registre d'Exploitation Commerciale • Bénin</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {profile.officialBusinessName}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              {profile.activityDescription} • {profile.operatingAddress}, {profile.city} ({profile.country}).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onCreateInvoice}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              <span>Émettre Facture</span>
            </button>
            <button
              onClick={() => onNavigate('deriv')}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
            >
              <Scale className="w-4 h-4 mr-2 text-emerald-400" />
              <span>Dossier Deriv & Banques</span>
            </button>
          </div>
        </div>

        {/* Benin Statutory Registry Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px] block">N° RCCM (Tribunal de Commerce)</span>
            <span className="font-mono font-bold text-slate-200">{profile.rccmNumber || 'En cours'}</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Identifiant Fiscal Unique (IFU)</span>
            <span className="font-mono font-bold text-emerald-400">{profile.ifuNumber || 'Non renseigné'}</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Forme Juridique</span>
            <span className="font-medium text-slate-200">{profile.legalStructure}</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px] block">TVA Applicable</span>
            <span className="font-mono font-bold text-indigo-300">{profile.defaultTaxRate}% (Régime Réel)</span>
          </div>
        </div>
      </div>

      {/* Main KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Revenue Collected */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Chiffre d'Affaires Encaissé</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-white tracking-tight">
            {formatCurrency(collectedCurrentCurrency, selectedCurrency)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Sur factures payées</span>
            <span className="font-mono text-emerald-400 font-semibold">{stats.invoiceCounts.paid} soldées</span>
          </div>
        </div>

        {/* Metric 2: Outstanding Receivables */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Créances en Attente</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-amber-300 tracking-tight">
            {formatCurrency(outstandingCurrentCurrency, selectedCurrency)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>À recouvrer</span>
            <span className="font-mono text-amber-400 font-semibold">{stats.invoiceCounts.unpaid + stats.invoiceCounts.partiallyPaid} en cours</span>
          </div>
        </div>

        {/* Metric 3: Total Invoices Issued */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Factures Émises</span>
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-white tracking-tight">
            {stats.invoiceCounts.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Annulées: {stats.invoiceCounts.cancelled}</span>
            <span className="text-indigo-400 font-semibold cursor-pointer" onClick={() => onNavigate('invoices')}>
              Voir liste →
            </span>
          </div>
        </div>

        {/* Metric 4: Verified Receipts Issued */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Quittances & Reçus</span>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ReceiptText className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-white tracking-tight">
            {stats.totalReceipts}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Paiements vérifiés</span>
            <span className="text-purple-400 font-semibold cursor-pointer" onClick={() => onNavigate('receipts')}>
              Consulter →
            </span>
          </div>
        </div>

      </div>

      {/* Multi-Currency Revenue Distribution Widget */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-2">
          <Coins className="w-4 h-4 text-indigo-400" />
          <span>Répartition du Chiffre d'Affaires par Devise Commerciale</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400">Franc CFA (XOF)</span>
              <div className="text-lg font-bold font-mono text-slate-100">
                {formatCurrency(stats.totalRevenueByCurrency['XOF'] || 0, 'XOF')}
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300 font-mono">Bénin / UEMOA</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400">Euro (EUR)</span>
              <div className="text-lg font-bold font-mono text-slate-100">
                {formatCurrency(stats.totalRevenueByCurrency['EUR'] || 0, 'EUR')}
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300 font-mono">Europe / Zone SEPA</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400">US Dollar (USD)</span>
              <div className="text-lg font-bold font-mono text-slate-100">
                {formatCurrency(stats.totalRevenueByCurrency['USD'] || 0, 'USD')}
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300 font-mono">International</span>
          </div>
        </div>
      </div>

      {/* Recent Activity: Invoices & Receipts Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Invoices */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Dernières Factures Commerciales</span>
              </h2>
              <p className="text-xs text-slate-400">Documents séquentiels horodatés</p>
            </div>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Tout voir →
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {stats.recentInvoices.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">Aucune facture émise pour le moment.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 pb-2">
                    <th className="py-2 font-medium">N° Facture</th>
                    <th className="py-2 font-medium">Client</th>
                    <th className="py-2 font-medium text-right">Montant</th>
                    <th className="py-2 font-medium text-center">Statut</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stats.recentInvoices.map((inv) => {
                    const badge = getInvoiceStatusBadge(inv.status);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-2.5 font-mono font-bold text-slate-200">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-2.5 text-slate-300 truncate max-w-[140px]">
                          {inv.customerSnapshot.companyName || inv.customerSnapshot.fullName}
                        </td>
                        <td className="py-2.5 font-mono text-right text-slate-200 font-semibold">
                          {formatCurrency(inv.totalAmount, inv.currency)}
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.bg} ${badge.textCol} ${badge.border}`}>
                            {badge.text}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => onViewInvoice(inv)}
                            className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline"
                          >
                            Consulter
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Official Receipts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <ReceiptText className="w-4 h-4 text-emerald-400" />
                <span>Dernières Quittances & Reçus Officiels</span>
              </h2>
              <p className="text-xs text-slate-400">Émis uniquement sur preuve de règlement</p>
            </div>
            <button
              onClick={() => onNavigate('receipts')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Tout voir →
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {stats.recentReceipts.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">Aucun reçu de paiement délivré.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 pb-2">
                    <th className="py-2 font-medium">N° Reçu</th>
                    <th className="py-2 font-medium">Facture</th>
                    <th className="py-2 font-medium">Règlement</th>
                    <th className="py-2 font-medium text-right">Encaissé</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stats.recentReceipts.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-2.5 font-mono font-bold text-emerald-400">
                        {rec.receiptNumber}
                      </td>
                      <td className="py-2.5 font-mono text-slate-300">
                        {rec.invoiceNumber}
                      </td>
                      <td className="py-2.5 text-slate-300">
                        <span className="truncate max-w-[130px] block" title={rec.transactionReference}>
                          {rec.transactionReference}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-right text-emerald-300 font-bold">
                        {formatCurrency(rec.amountReceived, rec.currency)}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => onViewReceipt(rec)}
                          className="text-emerald-400 hover:text-emerald-300 font-semibold hover:underline"
                        >
                          Quittance
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
