/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ReceiptText,
  Search,
  Filter,
  Printer,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Coins,
  Smartphone,
  Building2,
  FileCheck
} from 'lucide-react';
import { Receipt, PaymentMethod, CurrencyCode } from '../types.ts';
import { formatCurrency, formatDate, formatDateTime, getPaymentMethodLabel } from '../lib/formatters.ts';

interface ReceiptsViewProps {
  receipts: Receipt[];
  onViewReceipt: (rec: Receipt) => void;
  onVerifyReceipt: (token: string) => void;
}

export const ReceiptsView: React.FC<ReceiptsViewProps> = ({
  receipts,
  onViewReceipt,
  onVerifyReceipt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');

  const filteredReceipts = receipts.filter((rec) => {
    const matchesSearch =
      rec.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.transactionReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.customerSnapshot.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.customerSnapshot.companyName && rec.customerSnapshot.companyName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMethod = methodFilter === 'ALL' || rec.paymentMethod === methodFilter;
    const matchesCurrency = currencyFilter === 'ALL' || rec.currency === currencyFilter;

    return matchesSearch && matchesMethod && matchesCurrency;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <ReceiptText className="w-5 h-5 text-emerald-400" />
            <span>Registre des Quittances & Reçus Officiels</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Documents comptables authentiques générés exclusivement suite à encaissement vérifié avec référence de transaction.
          </p>
        </div>

        <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl px-4 py-2 text-xs flex items-center space-x-2 text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Intégrité Garantie : {receipts.length} quittances immuables au registre</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par N° reçu, facture ou réf MoMo/Banque..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-2 focus:outline-none"
          >
            <option value="ALL">Tous modes de paiement</option>
            <option value="MTN_MOMO">MTN Mobile Money</option>
            <option value="MOOV_MONEY">Moov Money</option>
            <option value="BANK_TRANSFER">Virement Bancaire</option>
            <option value="CREDIT_CARD">Carte Bancaire</option>
            <option value="CRYPTOCURRENCY">Crypto-Actifs</option>
          </select>

          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-2 focus:outline-none"
          >
            <option value="ALL">Toutes devises</option>
            <option value="XOF">XOF (FCFA)</option>
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
          </select>
        </div>

      </div>

      {/* Receipts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          {filteredReceipts.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              Aucun reçu officiel trouvé.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">N° Reçu Officiel</th>
                  <th className="py-3.5 px-4 font-semibold">Facture Associée</th>
                  <th className="py-3.5 px-4 font-semibold">Date & Heure Règlement</th>
                  <th className="py-3.5 px-4 font-semibold">Client</th>
                  <th className="py-3.5 px-4 font-semibold">Mode & Référence Transaction</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Montant Encaissé</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Solde Facture</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredReceipts.map((rec) => {
                  const methodInfo = getPaymentMethodLabel(rec.paymentMethod);
                  return (
                    <tr key={rec.id} className="hover:bg-slate-850/60 transition-colors">
                      
                      {/* Receipt Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        {rec.receiptNumber}
                      </td>

                      {/* Linked Invoice */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-indigo-300">
                        {rec.invoiceNumber}
                      </td>

                      {/* Payment Date & Time */}
                      <td className="py-3.5 px-4 text-slate-300">
                        <div>{formatDate(rec.paymentDateTime)}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {formatDateTime(rec.paymentDateTime).split(' ')[1] || ''}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">
                          {rec.customerSnapshot.companyName || rec.customerSnapshot.fullName}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                          {rec.customerSnapshot.city}, {rec.customerSnapshot.country}
                        </div>
                      </td>

                      {/* Payment Method & Ref */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-200 font-medium">{methodInfo.label}</div>
                        <div className="font-mono text-[11px] text-emerald-300 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40 inline-block mt-0.5">
                          {rec.transactionReference}
                        </div>
                      </td>

                      {/* Amount Received */}
                      <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-300 text-sm">
                        {formatCurrency(rec.amountReceived, rec.currency)}
                      </td>

                      {/* Remaining Balance */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        {rec.remainingInvoiceBalance === 0 ? (
                          <span className="text-emerald-400 text-[10px] font-bold uppercase bg-emerald-500/10 px-2 py-0.5 rounded">
                            Soldée
                          </span>
                        ) : (
                          <span className="text-amber-400 font-semibold">
                            {formatCurrency(rec.remainingInvoiceBalance, rec.currency)}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => onViewReceipt(rec)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center transition-all"
                          title="Imprimer ou enregistrer le reçu officiel en PDF"
                        >
                          <Printer className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                          <span>PDF / Voir</span>
                        </button>
                        <button
                          onClick={() => onVerifyReceipt(rec.verificationToken)}
                          className="px-2 py-1 rounded bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/50 text-xs font-medium inline-flex items-center transition-all"
                          title="Vérifier la validité de ce document au registre"
                        >
                          <QrCode className="w-3.5 h-3.5" />
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

    </div>
  );
};
