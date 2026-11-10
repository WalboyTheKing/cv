/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  QrCode,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Search,
  Building2,
  Calendar,
  Lock,
  ExternalLink,
  Coins,
  FileCheck,
  Hash
} from 'lucide-react';
import { PublicVerificationResult } from '../types.ts';
import { api } from '../lib/api.ts';
import { formatCurrency, formatDate } from '../lib/formatters.ts';

interface VerificationViewProps {
  initialToken?: string;
}

export const VerificationView: React.FC<VerificationViewProps> = ({ initialToken }) => {
  const [searchToken, setSearchToken] = useState(initialToken || '');
  const [result, setResult] = useState<PublicVerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (initialToken) {
      handleVerify(initialToken);
    }
  }, [initialToken]);

  const handleVerify = async (queryToRun?: string) => {
    const q = queryToRun || searchToken;
    if (!q || !q.trim()) return;

    setIsLoading(true);
    setErrorMessage('');
    setResult(null);
    setHasSearched(true);

    try {
      const data = await api.verifyDocument(q.trim());
      setResult(data);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Le document spécifié est introuvable ou ne correspond à aucun enregistrement dans le registre officiel de l\'entreprise.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Institutional Verification Header */}
      <div className="text-center space-y-2 py-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Portail Public d'Authentification Documentaire</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Vérification Officielle de Factures & Quittances
        </h1>
        <p className="text-xs text-slate-400 max-w-xl mx-auto">
          Scannez le code QR présent sur le document commercial ou saisissez son jeton de vérification pour attester de son authenticité et de son statut légal au Bénin.
        </p>
      </div>

      {/* Search Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <QrCode className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ex: Jeton de vérification (INV-...) ou Réf (INV-2026-0001, REC-2026-0001)"
              value={searchToken}
              onChange={(e) => setSearchToken(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 font-mono focus:border-indigo-500 focus:outline-none shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !searchToken.trim()}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-900/40 transition-all flex items-center justify-center shrink-0 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Vérification...
              </span>
            ) : (
              <span className="flex items-center">
                <Search className="w-4 h-4 mr-2" />
                Contrôler la Validité
              </span>
            )}
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span>Protection des données personnelles : coordonnées privées strictement masquées.</span>
          </div>
          <span className="font-mono text-slate-400">Algorithme SHA-256</span>
        </div>
      </div>

      {/* Verification Results Display */}
      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-fade-in">
          
          {/* Validity Status Banner */}
          <div className={`p-6 border-b ${
            result.isValid && !result.isRevoked
              ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/50 text-rose-300'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className={`p-2.5 rounded-xl border ${
                  result.isValid && !result.isRevoked
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                }`}>
                  {result.isValid && !result.isRevoked ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <ShieldAlert className="w-6 h-6" />
                  )}
                </span>
                <div>
                  <h2 className="text-lg font-black tracking-tight">
                    {result.isValid && !result.isRevoked
                      ? 'DOCUMENT COMMERCIAL AUTHENTIQUE & VALIDE'
                      : 'DOCUMENT RÉVOQUÉ OU NON-CONFORME'}
                  </h2>
                  <p className="text-xs opacity-90 mt-0.5">
                    Certifié enregistré dans les livres officiels de {result.businessName} (République du Bénin).
                  </p>
                </div>
              </div>

              <div className="text-right hidden sm:block">
                <span className="text-[10px] uppercase font-mono block opacity-75">Horodatage de contrôle</span>
                <span className="text-xs font-mono font-semibold">{formatDate(result.verificationTimestamp)}</span>
              </div>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 space-y-6 text-xs text-slate-300">
            
            {/* Document Core Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Type de Document</span>
                <span className="font-bold text-slate-100 text-sm">
                  {result.documentType === 'INVOICE' ? 'Facture Commerciale' : 'Quittance / Reçu de Paiement'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">N° d'Enregistrement Officiel</span>
                <span className="font-mono font-bold text-indigo-400 text-sm">
                  {result.documentNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Date d'Émission / Règlement</span>
                <span className="font-semibold text-slate-200 text-sm">
                  {formatDate(result.issueDate)}
                </span>
              </div>
            </div>

            {/* Issuer Profile */}
            <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/60 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Identité de l'Entreprise Émettrice (Bénin)</span>
              </div>
              <div className="text-sm font-bold text-white">
                {result.businessName} ({result.commercialName})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                <div>
                  <span className="text-slate-500">Forme : </span>
                  <span className="font-medium text-slate-200">{result.legalStructure}</span>
                </div>
                <div>
                  <span className="text-slate-500">RCCM Bénin : </span>
                  <span className="font-mono font-semibold text-slate-200">{result.rccmNumber || 'Enregistré'}</span>
                </div>
                <div>
                  <span className="text-slate-500">N° IFU (DGI) : </span>
                  <span className="font-mono font-bold text-emerald-400">{result.ifuNumber || 'Vérifié'}</span>
                </div>
              </div>
            </div>

            {/* Financial and Payment Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/60">
                <span className="text-slate-500 text-[10px] uppercase block mb-1">Montant Certifié</span>
                <div className="text-xl font-black font-mono text-white">
                  {formatCurrency(result.totalAmountOrReceived, result.currency)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Devise contractuelle : <strong className="text-slate-200">{result.currency}</strong>
                </div>
              </div>

              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/60">
                <span className="text-slate-500 text-[10px] uppercase block mb-1">Statut du Règlement</span>
                <div className="inline-block px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {result.paymentStatus === 'PAID' ? 'RÈGLEMENT CONFIRMÉ' : result.paymentStatus}
                </div>
                {result.transactionReference && (
                  <div className="text-[11px] text-slate-400 mt-2 font-mono">
                    Réf. Transaction : <span className="text-emerald-300 font-bold">{result.transactionReference}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Masked Customer Identity (GDPR / Privacy Compliance) */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Destinataire Vérifié</span>
                <div className="font-semibold text-slate-200 mt-0.5">
                  {result.clientMaskedName}
                </div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                Identité protégée contre l'usurpation
              </span>
            </div>

            {/* Cryptographic SHA-256 Fingerprint */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] uppercase tracking-wider font-semibold mb-1">
                <Hash className="w-3.5 h-3.5 text-indigo-400" />
                <span>Empreinte Numérique Cryptographique (SHA-256)</span>
              </div>
              <div className="font-mono text-[10px] text-indigo-300 break-all select-all bg-slate-900 p-2 rounded border border-slate-800">
                {result.digitalFingerprint}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Cette empreinte certifie que le document physique ou numérique présenté n'a subi aucune modification depuis sa signature électronique.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* Error / Not Found Display */}
      {errorMessage && (
        <div className="bg-rose-950/40 border border-rose-800/80 rounded-2xl p-6 shadow-xl text-rose-200 space-y-2">
          <div className="flex items-center space-x-2 text-rose-400 font-bold text-base">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>Document Invalide ou Introuvable</span>
          </div>
          <p className="text-xs leading-relaxed text-rose-300">
            {errorMessage}
          </p>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-rose-900/40">
            Avertissement de sécurité : Si ce document vous a été présenté comme une facture ou quittance authentique, veuillez contacter directement la direction au registre officiel afin de signaler une potentielle contrefaçon.
          </div>
        </div>
      )}

    </div>
  );
};
