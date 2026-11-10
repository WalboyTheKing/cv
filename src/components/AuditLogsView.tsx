/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  History,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  Hash,
  Database,
  RefreshCw,
  Lock
} from 'lucide-react';
import { AuditLog } from '../types.ts';
import { formatDateTime } from '../lib/formatters.ts';

interface AuditLogsViewProps {
  logs: AuditLog[];
  integrity: {
    isCompromised: boolean;
    totalLogs: number;
    brokenAtId?: string;
  };
  onRefresh: () => void;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs, integrity, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || log.entityType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <History className="w-5 h-5 text-indigo-400" />
            <span>Journal d'Audit Immuable (Registre SHA-256)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Traçabilité inviolable de chaque émission de document, validation de règlement, modification et sauvegarde.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-all self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          <span>Vérifier & Rafraîchir</span>
        </button>
      </div>

      {/* Cryptographic Hash Chain Integrity Banner */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between ${
        integrity.isCompromised
          ? 'bg-rose-950/40 border-rose-800/80 text-rose-300'
          : 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
      }`}>
        <div className="flex items-center space-x-3">
          <span className={`p-2 rounded-xl border ${
            integrity.isCompromised
              ? 'bg-rose-500/20 border-rose-500/30 text-rose-400'
              : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
          }`}>
            {integrity.isCompromised ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </span>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">
              {integrity.isCompromised ? 'ALERTE : ALTÉRATION DÉTECTÉE' : 'CHAÎNE DE HACHAGE SHA-256 INTACTE'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {integrity.isCompromised
                ? `La signature a échoué à l'entrée ${integrity.brokenAtId}. Les données ont pu être modifiées en dehors du protocole.`
                : `${integrity.totalLogs} enregistrements scellés chronologiquement. Aucune altération ou suppression détectée.`}
            </p>
          </div>
        </div>

        <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800/50">
          SHA-256 Validé
        </span>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrer par acteur, action ou mot-clé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-2 focus:outline-none"
          >
            <option value="ALL">Tous types d'événements</option>
            <option value="INVOICE">Factures (Émission / Annulation)</option>
            <option value="RECEIPT">Reçus & Quittances</option>
            <option value="PAYMENT">Encaissements de flux</option>
            <option value="CUSTOMER">Fichier Clients</option>
            <option value="PROFILE">Profil Entreprise</option>
            <option value="SECURITY">Sécurité & Connexions</option>
            <option value="BACKUP">Sauvegardes Système</option>
          </select>
        </div>
      </div>

      {/* Audit Log Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              Aucun événement dans le journal d'audit.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-semibold">Horodatage</th>
                  <th className="py-3 px-4 font-semibold">Acteur</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Action Réalisée</th>
                  <th className="py-3 px-4 font-semibold">Détails de l'Opération</th>
                  <th className="py-3 px-4 font-semibold text-right">Empreinte SHA-256</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-200 bg-slate-800 px-2 py-0.5 rounded text-[11px] font-mono">
                        {log.actor}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        log.entityType === 'PAYMENT' || log.entityType === 'RECEIPT'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : log.entityType === 'INVOICE'
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          : log.entityType === 'SECURITY'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {log.entityType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300 font-semibold">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="font-mono text-[10px] text-indigo-400 hover:text-indigo-300 bg-slate-950 px-2 py-1 rounded border border-slate-800"
                        title="Inspecter le bloc cryptographique"
                      >
                        {log.currentStateHash.slice(0, 10)}...
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* HASH INSPECT MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Hash className="w-5 h-5 text-indigo-400" />
                <span>Bloc d'Audit Cryptographique</span>
              </h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">ID Journal / Horodatage:</span>
                <span className="font-mono text-slate-200">{selectedLog.id} • {formatDateTime(selectedLog.timestamp)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Acteur / Action:</span>
                <span className="font-semibold text-slate-200">{selectedLog.actor} → {selectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Détails de l'événement:</span>
                <p className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300">{selectedLog.details}</p>
              </div>
              <div>
                <span className="text-slate-500 block">Hachage de l'état précédent (Chaining):</span>
                <span className="font-mono text-[10px] text-slate-400 break-all block bg-slate-950 p-2 rounded border border-slate-800">
                  {selectedLog.previousStateHash || 'GENESIS'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Hachage du bloc actuel (SHA-256):</span>
                <span className="font-mono text-[10px] text-emerald-400 break-all block bg-slate-950 p-2 rounded border border-slate-800">
                  {selectedLog.currentStateHash}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800 mt-4">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
