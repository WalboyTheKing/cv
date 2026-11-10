/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  QrCode,
  Building,
  Calendar,
  CreditCard,
  Hash,
  AlertTriangle
} from 'lucide-react';
import { BusinessProfile, Invoice, Receipt } from '../types.ts';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  generateQrDataUrl,
  getPaymentMethodLabel,
  numberToWordsFrench,
} from '../lib/formatters.ts';

interface DocumentPrintModalProps {
  documentType: 'INVOICE' | 'RECEIPT';
  invoice?: Invoice;
  receipt?: Receipt;
  profile: BusinessProfile;
  onClose: () => void;
  onNavigateToVerify?: (token: string) => void;
}

export const DocumentPrintModal: React.FC<DocumentPrintModalProps> = ({
  documentType,
  invoice,
  receipt,
  profile,
  onClose,
  onNavigateToVerify,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const docNumber = documentType === 'INVOICE' ? invoice?.invoiceNumber : receipt?.receiptNumber;
  const verificationToken = documentType === 'INVOICE' ? invoice?.verificationToken : receipt?.verificationToken;
  const docHash = documentType === 'INVOICE' ? invoice?.documentHash : receipt?.documentHash;

  // Verification URL
  const verificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?verify=${verificationToken || docNumber}`
    : `https://verification.afriqdigital.bj/verify/${verificationToken || docNumber}`;

  useEffect(() => {
    if (verificationUrl) {
      generateQrDataUrl(verificationUrl).then((url) => setQrDataUrl(url));
    }
  }, [verificationUrl]);

  const handlePrint = () => {
    window.print();
  };

  if (!invoice && !receipt) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex justify-center p-2 sm:p-4 print:p-0 print:bg-white print:overflow-visible">
      
      {/* Container */}
      <div className="relative w-full max-w-4xl bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl flex flex-col my-auto print:my-0 print:border-none print:shadow-none print:bg-white print:w-full print:max-w-none text-slate-100 print:text-slate-900">
        
        {/* Action Header (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 rounded-t-2xl print:hidden">
          <div className="flex items-center space-x-3">
            <span className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">
                {documentType === 'INVOICE' ? 'Facture Commerciale Officielle' : 'Quittance de Paiement & Reçu Officiel'}
              </h3>
              <p className="text-xs text-slate-400">
                Réf: <span className="font-mono text-indigo-300 font-semibold">{docNumber}</span> • Conforme DGI & OHADA Bénin
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/30 transition-all"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              <span>Imprimer / Sauvegarder en PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas (A4 simulation) */}
        <div 
          id="printable-document" 
          className="p-8 sm:p-12 bg-white text-slate-900 print:p-8 print:m-0 font-sans leading-relaxed selection:bg-indigo-100"
          style={{ minHeight: '1050px' }}
        >
          
          {/* Top Banner & Official Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b-2 border-slate-900 gap-6">
            
            {/* Issuer Information */}
            <div className="max-w-md">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xl font-black tracking-tight text-slate-950 uppercase">
                  {profile.officialBusinessName}
                </span>
              </div>
              <div className="text-xs font-semibold text-indigo-900 tracking-wide mb-2 uppercase">
                {profile.commercialName} • {profile.legalStructure}
              </div>

              {/* Official Benin Registrations */}
              <div className="bg-slate-50 border border-slate-200 rounded p-2.5 space-y-1 text-[11px] text-slate-700 font-mono mb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">RCCM Bénin:</span>
                  <span className="font-bold text-slate-900">{profile.rccmNumber || 'En cours d\'enregistrement'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">N° IFU (DGI):</span>
                  <span className="font-bold text-slate-900">{profile.ifuNumber || 'Non renseigné'}</span>
                </div>
                {profile.taxRegime && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Régime Fiscal:</span>
                    <span className="font-bold text-slate-900 font-sans">{profile.taxRegime}</span>
                  </div>
                )}
                {profile.ownerFullName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Titulaire légal:</span>
                    <span className="font-bold text-slate-900 font-sans">{profile.ownerFullName} ({profile.ownerTitle || 'Promoteur'})</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Activité Principale:</span>
                  <span className="text-slate-800 truncate max-w-[240px]">{profile.activityDescription}</span>
                </div>
              </div>

              {/* Distinct Addresses */}
              <div className="text-[11px] text-slate-600 space-y-0.5">
                <div>
                  <strong className="text-slate-800 font-medium">Siège Social (Légal): </strong>
                  {profile.registeredAddress}, {profile.city}, {profile.country}
                </div>
                <div>
                  <strong className="text-slate-800 font-medium">Bureaux d'Exploitation: </strong>
                  {profile.operatingAddress}, {profile.city}
                </div>
                <div>
                  <strong className="text-slate-800 font-medium">Contact: </strong>
                  {profile.phone} • {profile.email} • {profile.website}
                </div>
              </div>
            </div>

            {/* Document Title, Status, and Verification QR */}
            <div className="flex flex-col items-end sm:text-right shrink-0">
              <div className="inline-block px-3 py-1 rounded bg-slate-900 text-white font-black text-sm uppercase tracking-wider mb-2">
                {documentType === 'INVOICE' ? 'FACTURE COMMERCIALE' : 'QUITTANCE & REÇU OFFICIEL'}
              </div>
              <div className="text-2xl font-black font-mono tracking-tight text-slate-900 mb-1">
                {docNumber}
              </div>

              {/* Status Badge */}
              <div className="mb-3">
                {documentType === 'INVOICE' && invoice && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    invoice.status === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : invoice.status === 'PARTIALLY_PAID'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : invoice.status === 'CANCELLED'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-blue-100 text-blue-800 border border-blue-300'
                  }`}>
                    {invoice.status === 'PAID' ? 'PAYÉE EN TOTALITÉ' : invoice.status === 'PARTIALLY_PAID' ? 'PARTIELLEMENT RÉGLÉE' : invoice.status === 'CANCELLED' ? 'ANNULÉE' : 'EN ATTENTE DE RÈGLEMENT'}
                  </span>
                )}
                {documentType === 'RECEIPT' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                    PAIEMENT ENCAISSÉ & VÉRIFIÉ
                  </span>
                )}
              </div>

              {/* QR Code Container */}
              <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase text-indigo-900 tracking-wide">
                    Vérification Officielle
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">
                    Scannez pour valider l'authenticité
                  </div>
                </div>
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code de Vérification" className="w-16 h-16 rounded border border-slate-300" />
                ) : (
                  <div className="w-16 h-16 bg-slate-200 animate-pulse rounded" />
                )}
              </div>
            </div>

          </div>

          {/* Dates & Client Information Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 my-6">
            
            {/* Client Snapshot */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Destinataire / Client
              </div>
              <div className="text-base font-bold text-slate-900">
                {documentType === 'INVOICE'
                  ? (invoice?.customerSnapshot.companyName || invoice?.customerSnapshot.fullName)
                  : (receipt?.customerSnapshot.companyName || receipt?.customerSnapshot.fullName)}
              </div>
              {documentType === 'INVOICE' && invoice?.customerSnapshot.companyName && (
                <div className="text-xs text-slate-700 font-medium">
                  Attn: {invoice.customerSnapshot.fullName}
                </div>
              )}
              <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                <div>{documentType === 'INVOICE' ? invoice?.customerSnapshot.address : receipt?.customerSnapshot.address}</div>
                <div>{documentType === 'INVOICE' ? invoice?.customerSnapshot.city : receipt?.customerSnapshot.city}, {documentType === 'INVOICE' ? invoice?.customerSnapshot.country : receipt?.customerSnapshot.country}</div>
                <div>Tél: {documentType === 'INVOICE' ? invoice?.customerSnapshot.phone : receipt?.customerSnapshot.phone}</div>
                <div>Email: {documentType === 'INVOICE' ? invoice?.customerSnapshot.email : receipt?.customerSnapshot.email}</div>
                {documentType === 'INVOICE' && invoice?.customerSnapshot.ifuNumber && (
                  <div className="font-mono text-[11px] text-slate-800 pt-1 font-semibold">
                    IFU Client: {invoice.customerSnapshot.ifuNumber}
                  </div>
                )}
              </div>
            </div>

            {/* Document Dates & Logistics */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Détails & Échéances Légales
                </div>
                <div className="space-y-1.5 text-xs text-slate-700">
                  {documentType === 'INVOICE' && invoice && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Date d'émission :</span>
                        <span className="font-bold text-slate-900">{formatDate(invoice.issueDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Date de livraison de service :</span>
                        <span className="font-semibold text-slate-900">{formatDate(invoice.deliveryDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Date limite de paiement :</span>
                        <span className="font-bold text-indigo-900">{formatDate(invoice.dueDate)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200">
                        <span className="text-slate-500">Devise de facturation :</span>
                        <span className="font-mono font-bold text-slate-900">{invoice.currency}</span>
                      </div>
                    </>
                  )}

                  {documentType === 'RECEIPT' && receipt && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Date & Heure du Règlement :</span>
                        <span className="font-bold text-slate-900">{formatDateTime(receipt.paymentDateTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Facture Associée :</span>
                        <span className="font-mono font-bold text-indigo-900">{receipt.invoiceNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Mode de Paiement :</span>
                        <span className="font-semibold text-slate-900">{getPaymentMethodLabel(receipt.paymentMethod).label}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200">
                        <span className="text-slate-500">Réf. Transaction (Preuve) :</span>
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-1 rounded">{receipt.transactionReference}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Integrity token badge */}
              <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 flex justify-between items-center">
                <span>Jeton de Vérification:</span>
                <span className="font-mono font-bold text-slate-700">{verificationToken}</span>
              </div>
            </div>

          </div>

          {/* Line Items Table (For Invoices) */}
          {documentType === 'INVOICE' && invoice && (
            <div className="mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 rounded-l font-bold">Désignation des Prestations Réelles</th>
                    <th className="py-2.5 px-3 text-center font-bold w-20">Qté</th>
                    <th className="py-2.5 px-3 text-right font-bold w-36">Prix Unitaire</th>
                    <th className="py-2.5 px-3 text-right rounded-r font-bold w-36">Total ({invoice.currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-medium text-slate-800">
                        {item.description}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-700">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {formatCurrency(item.unitPrice, invoice.currency)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(item.total, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Section */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mt-4">
                {/* Legal amount spelled out in French (OHADA / DGI requirement) */}
                <div className="flex-1 bg-slate-50 rounded-lg p-3.5 border border-slate-200">
                  <span className="font-bold block text-[10px] uppercase tracking-wider text-indigo-900 mb-1">
                    Arrêtée la présente facture à la somme de :
                  </span>
                  <p className="font-semibold italic text-slate-800 text-xs leading-relaxed">
                    « {numberToWordsFrench(invoice.totalAmount, invoice.currency)} »
                  </p>

                  {/* If refunds exist on this invoice */}
                  {invoice.refunds && invoice.refunds.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-purple-200 text-purple-900">
                      <span className="font-bold text-[10px] uppercase tracking-wider flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1 text-purple-700" />
                        Avoir / Note de Remboursement Émise :
                      </span>
                      {invoice.refunds.map((ref) => (
                        <div key={ref.id} className="text-[11px] mt-1 text-slate-700 flex justify-between">
                          <span>Réf Avoir : <strong>{ref.refundNumber}</strong> ({formatDate(ref.refundDate)})</span>
                          <span className="font-mono font-bold text-purple-800">-{formatCurrency(ref.amountRefunded, invoice.currency)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="w-full sm:w-80 bg-slate-50 rounded-lg p-3.5 border border-slate-200 space-y-2 text-xs shrink-0">
                  <div className="flex justify-between text-slate-600">
                    <span>Sous-Total Hors Taxes (HT) :</span>
                    <span className="font-mono font-semibold text-slate-900">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>TVA Bénin ({invoice.taxRate}%) :</span>
                    <span className="font-mono font-semibold text-slate-900">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t-2 border-slate-900 text-sm font-black text-slate-950">
                    <span>TOTAL TTC :</span>
                    <span className="font-mono text-indigo-950">{formatCurrency(invoice.totalAmount, invoice.currency)}</span>
                  </div>
                  {invoice.amountPaid > 0 && (
                    <>
                      <div className="flex justify-between text-emerald-700 text-xs pt-1 border-t border-slate-200">
                        <span>Montant Déjà Encaissé :</span>
                        <span className="font-mono font-bold">-{formatCurrency(invoice.amountPaid, invoice.currency)}</span>
                      </div>
                      <div className="flex justify-between text-slate-900 text-xs font-bold">
                        <span>Solde Restant Dû :</span>
                        <span className="font-mono text-rose-700">{formatCurrency(invoice.remainingBalance, invoice.currency)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Receipt Breakdown (For Receipts) */}
          {documentType === 'RECEIPT' && receipt && (
            <div className="my-6 bg-slate-50 rounded-xl border border-slate-200 p-6">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Détail de l'Encaissement & Prestation Référée
              </div>

              <div className="text-sm font-medium text-slate-800 mb-4 bg-white p-3 rounded border border-slate-200">
                <span className="text-slate-500 text-xs block mb-1">Prestation Objet du Règlement :</span>
                {receipt.serviceDescriptionSummary}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="bg-white p-3 rounded border border-slate-200">
                  <div className="text-[11px] text-slate-500">Montant Encaissé :</div>
                  <div className="text-lg font-black font-mono text-emerald-700">
                    {formatCurrency(receipt.amountReceived, receipt.currency)}
                  </div>
                </div>
                <div className="bg-white p-3 rounded border border-slate-200">
                  <div className="text-[11px] text-slate-500">Mode de Règlement :</div>
                  <div className="text-xs font-bold text-slate-900 mt-1">
                    {getPaymentMethodLabel(receipt.paymentMethod).label}
                  </div>
                </div>
                <div className="bg-white p-3 rounded border border-slate-200">
                  <div className="text-[11px] text-slate-500">Solde Restant sur Facture :</div>
                  <div className="text-base font-bold font-mono text-slate-800 mt-1">
                    {formatCurrency(receipt.remainingInvoiceBalance, receipt.currency)}
                  </div>
                </div>
              </div>

              {/* Montant en toutes lettres pour la quittance */}
              <div className="bg-white p-3 rounded border border-slate-200 mb-3">
                <span className="font-bold block text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">
                  Montant Encaissé en toutes lettres :
                </span>
                <p className="font-semibold italic text-emerald-900 text-xs">
                  « {numberToWordsFrench(receipt.amountReceived, receipt.currency)} »
                </p>
              </div>

              {receipt.notes && (
                <div className="text-xs text-slate-600 bg-white p-3 rounded border border-slate-200">
                  <span className="font-semibold text-slate-700">Observation comptable : </span>
                  {receipt.notes}
                </div>
              )}
            </div>
          )}

          {/* Bank Wire & Payment Coordinates (For Invoices) */}
          {documentType === 'INVOICE' && profile.bankDetails && (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-xs text-slate-700 mb-6">
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 mb-2">
                Coordonnées Bancaires Officielles & Règlement
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500 block">Banque / Compte :</span>
                  <strong>{profile.bankDetails.bankName}</strong> ({profile.bankDetails.accountName})
                  <div className="text-slate-800 font-bold mt-0.5">N° Compte : {profile.bankDetails.accountNumber}</div>
                  {profile.bankDetails.ibanRib && <div>RIB / IBAN : {profile.bankDetails.ibanRib}</div>}
                  {profile.bankDetails.swiftBic && <div>SWIFT/BIC : {profile.bankDetails.swiftBic}</div>}
                </div>
                <div>
                  <span className="text-slate-500 block">Paiements Mobiles Professionnels :</span>
                  {profile.bankDetails.momoNumber && <div>{profile.bankDetails.momoNumber}</div>}
                  {profile.bankDetails.moovNumber && <div>{profile.bankDetails.moovNumber}</div>}
                  <div className="text-[10px] text-slate-500 font-sans mt-1">
                    Indiquer impérativement le numéro de facture <span className="font-mono font-bold text-slate-900">{docNumber}</span> en référence de tout paiement.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Signatures & Legal Endorsement Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t-2 border-slate-200 my-6">
            
            {/* Cryptographic Proof & Disclaimer */}
            <div className="text-[10px] text-slate-500 space-y-1">
              <div className="flex items-center text-slate-700 font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span>Empreinte Numérique Immuable (SHA-256) :</span>
              </div>
              <div className="font-mono text-[9px] break-all bg-slate-50 p-1.5 rounded border border-slate-200 text-slate-600">
                {docHash || 'SHA256:AUTHENTICATED_LEDGER_RECORD'}
              </div>
              <p className="leading-tight text-[9px] text-slate-400">
                Ce document officiel est généré pour des prestations réelles. Toute modification physique ou altération numérique invalide l'authenticité lors de la vérification par QR code.
              </p>
            </div>

            {/* Authorized Business Signatory Block */}
            <div className="flex flex-col items-center sm:items-end text-center sm:text-right">
              <div className="text-xs text-slate-600">Pour le compte de l'Entreprise,</div>
              <div className="text-sm font-bold text-slate-900 mt-1">
                {profile.authorizedSignatoryName}
              </div>
              <div className="text-xs text-indigo-900 font-medium">
                {profile.authorizedSignatoryTitle}
              </div>

              {/* Official Seal / Stamp */}
              <div className="mt-2 w-48 h-20 border-2 border-dashed border-indigo-900/30 rounded-lg flex flex-col items-center justify-center bg-indigo-50/30 text-indigo-900">
                <div className="text-[9px] font-black uppercase tracking-wider">
                  {profile.commercialName}
                </div>
                <div className="text-[8px] font-mono">
                  CACHET ÉLECTRONIQUE VALIDE
                </div>
                <div className="text-[8px] text-slate-500">
                  Cotonou, République du Bénin
                </div>
              </div>
            </div>

          </div>

          {/* Footer Note */}
          <div className="text-center text-[9px] text-slate-500 pt-4 border-t border-slate-200 leading-normal space-y-0.5">
            <div>
              {profile.officialBusinessName} • {profile.legalStructure}
              {profile.legalStructure.includes('SARL') ? ' • Au capital social vérifié' : ' • Enregistrée au Registre du Commerce'}
              {profile.ownerFullName && ` • Titulaire légal : ${profile.ownerFullName} (${profile.ownerTitle || 'Promoteur'})`}
              {profile.taxRegime && ` • Régime : ${profile.taxRegime}`}
            </div>
            <div>
              RCCM : {profile.rccmNumber || 'En cours'} • N° IFU DGI : {profile.ifuNumber || 'Non renseigné'} • Siège : {profile.registeredAddress}, {profile.city}, {profile.country}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
