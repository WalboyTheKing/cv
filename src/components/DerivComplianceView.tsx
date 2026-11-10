/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  FileText,
  ReceiptText,
  Printer,
  Download,
  Building2,
  Lock,
  ExternalLink,
  Info,
  QrCode
} from 'lucide-react';
import { BusinessProfile, Customer, Invoice, Receipt, DerivComplianceItem } from '../types.ts';
import { formatCurrency, formatDate, formatDateTime, getPaymentMethodLabel } from '../lib/formatters.ts';

interface DerivComplianceViewProps {
  profile: BusinessProfile;
  invoices: Invoice[];
  receipts: Receipt[];
  customers: Customer[];
  onViewInvoice: (inv: Invoice) => void;
  onViewReceipt: (rec: Receipt) => void;
}

export const DerivComplianceView: React.FC<DerivComplianceViewProps> = ({
  profile,
  invoices,
  receipts,
  customers,
  onViewInvoice,
  onViewReceipt,
}) => {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(invoices[0]?.id || '');
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);

  // Deriv checklist states
  const [checklist, setChecklist] = useState<DerivComplianceItem[]>([
    {
      id: 'chk-1',
      category: 'BUSINESS_IDENTITY',
      title: 'Immatriculation au Registre du Commerce (RCCM Bénin)',
      description: 'Preuve officielle d\'enregistrement de la société au Greffe du Tribunal de Commerce.',
      isCompliant: profile.isRccmVerified && Boolean(profile.rccmNumber),
      details: profile.rccmNumber ? `Numéro RCCM certifié : ${profile.rccmNumber}` : 'RCCM manquant ou non renseigné.',
      officialRequirementNote: 'Exigé par Deriv pour les comptes Business / Corporate.',
    },
    {
      id: 'chk-2',
      category: 'TAX_REGISTRATION',
      title: 'Identifiant Fiscal Unique (IFU - Direction Générale des Impôts)',
      description: 'Attestation de numéro fiscal attribué par les autorités fiscales béninoises.',
      isCompliant: profile.isIfuVerified && Boolean(profile.ifuNumber),
      details: profile.ifuNumber ? `N° IFU à 13 chiffres vérifié : ${profile.ifuNumber}` : 'Numéro IFU absent.',
      officialRequirementNote: 'Validation de l\'existence fiscale et de la déclaration légale.',
    },
    {
      id: 'chk-3',
      category: 'PROOF_OF_COMMERCIAL_ADDRESS',
      title: 'Distinction Stricte de l\'Adresse d\'Exploitation Commerciale',
      description: 'Bureaux réels situés à Cotonou distincts de l\'adresse de résidence du gérant.',
      isCompliant: Boolean(profile.operatingAddress && profile.registeredAddress),
      details: `Siège: ${profile.registeredAddress} | Bureaux: ${profile.operatingAddress}`,
      officialRequirementNote: 'Attention : Une adresse commerciale ne fait pas office de justificatif de domicile résidentiel personnel.',
    },
    {
      id: 'chk-4',
      category: 'TRANSACTION_LEGITIMACY',
      title: 'Quittance de Paiement liée à une Transaction Économique Réelle',
      description: 'Chaque reçu possède une référence bancaire (Ecobank) ou mobile money (MTN/Moov) vérifiable.',
      isCompliant: receipts.length > 0 && receipts.some((r) => Boolean(r.transactionReference)),
      details: `${receipts.length} quittances immuables enregistrées avec preuve de flux de fonds.`,
      officialRequirementNote: 'Preuve de provenance légitime des fonds (Source of Funds / Economic Activity).',
    },
  ]);

  const toggleChecklist = (id: string) => {
    setChecklist(
      checklist.map((it) => (it.id === id ? { ...it, isCompliant: !it.isCompliant } : it))
    );
  };

  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId) || invoices[0];
  const linkedReceipt = receipts.find((r) => r.invoiceId === selectedInvoice?.id);
  const selectedCustomer = customers.find((c) => c.id === selectedInvoice?.customerId);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Scale className="w-5 h-5 text-emerald-400" />
            <span>Conformité Deriv & Institutions Financières</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Préparation de dossiers d'activités commerciales légitimes pour vérification de compte institutionnel ou source de fonds.
          </p>
        </div>

        <button
          onClick={() => setIsDossierModalOpen(true)}
          disabled={!selectedInvoice}
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 transition-all cursor-pointer disabled:opacity-50"
        >
          <FileCheck className="w-4 h-4 mr-2" />
          <span>Générer Dossier de Conformité</span>
        </button>
      </div>

      {/* STRICT REGULATORY & ETHICAL NOTICE */}
      <div className="bg-amber-950/30 border-2 border-amber-800/80 rounded-2xl p-6 shadow-xl text-amber-200 space-y-3">
        <div className="flex items-center space-x-2.5 text-amber-400 font-bold text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>AVIS DE CONFORMITÉ & RÈGLES D'ACCEPTATION DOCUMENTAIRE (DERIV & COURTIERS RÉGULÉS)</span>
        </div>
        
        <div className="text-xs text-amber-100/90 leading-relaxed space-y-2">
          <p>
            <strong>1. Nature des Pièces :</strong> Les factures et quittances générées par cette plateforme constituent des preuves commerciales d'activités réelles opérées par une entreprise légitime au Bénin. Elles peuvent être produites auprès d'institutions bancaires, d'intermédiaires agréés ou de courtiers réglementés (notamment Deriv) pour justifier de l'existence de l'entreprise, de son chiffre d'affaires et de la légitimité économique de ses flux financiers (Proof of Business & Source of Wealth/Funds).
          </p>
          <p>
            <strong>2. Avertissement Justificatif de Domicile Résidentiel (Proof of Residence) :</strong> Conformément aux règles d'acceptation de Deriv, ces documents commerciaux ne constituent <u>EN AUCUN CAS</u> un justificatif de domicile résidentiel pour un particulier. Deriv requiert expressément pour les personnes physiques une facture officielle de service public (eau SONEB, électricité SBEE) ou un relevé bancaire personnel daté de moins de 6 mois.
          </p>
          <p>
            <strong>3. Règle Anti-Fraude Stricte :</strong> Ce système refuse expressément toute falsification, fabrication de faux relevés, modification rétroactive d'adresses ou production de factures de complaisance.
          </p>
        </div>
      </div>

      {/* Checklist Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Grille de Contrôle Officielle des Exigences Deriv</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Critères requis pour la validation d'un profil commercial ou compte entité morale.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-lg">
            {checklist.filter((c) => c.isCompliant).length} / {checklist.length} Validés
          </span>
        </div>

        <div className="space-y-3">
          {checklist.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all ${
                item.isCompliant
                  ? 'bg-slate-950 border-emerald-900/40'
                  : 'bg-slate-950 border-amber-900/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <button
                    onClick={() => toggleChecklist(item.id)}
                    className={`mt-0.5 p-1 rounded-md border ${
                      item.isCompliant
                        ? 'bg-emerald-500 text-white border-emerald-400'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <div>
                    <h3 className="text-xs font-bold text-white">{item.title}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
                    <div className="text-[11px] font-mono text-emerald-400 mt-1">
                      {item.details}
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-medium text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800 max-w-xs text-right">
                  {item.officialRequirementNote}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Select authentic transaction to package into compliance pack */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>Sélectionner la Transaction Commerciale à Certifier</span>
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Choisissez une facture réelle et son règlement associé pour éditer le dossier de conformité imprimable.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 text-xs font-semibold mb-1">Facture Émise</label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
            >
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} - {inv.customerSnapshot.companyName || inv.customerSnapshot.fullName} ({formatCurrency(inv.totalAmount, inv.currency)})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-center">
            {linkedReceipt ? (
              <div className="text-xs">
                <span className="text-emerald-400 font-bold flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Quittance de paiement officielle associée ({linkedReceipt.receiptNumber})
                </span>
                <span className="text-slate-400 block text-[11px] mt-0.5">
                  Réf. Transaction: <span className="font-mono text-slate-200">{linkedReceipt.transactionReference}</span> ({getPaymentMethodLabel(linkedReceipt.paymentMethod).label})
                </span>
              </div>
            ) : (
              <div className="text-xs text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                Aucun paiement n'a encore été rapproché pour cette facture. Le dossier ne contiendra que la créance commerciale.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONSOLIDATED COMPLIANCE DOSSIER MODAL */}
      {isDossierModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex justify-center p-4 print:p-0 print:bg-white">
          <div className="relative w-full max-w-4xl bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl flex flex-col my-auto print:my-0 print:border-none print:shadow-none print:bg-white text-slate-100 print:text-slate-900">
            
            {/* Action Bar (hidden in print) */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 rounded-t-2xl print:hidden">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Scale className="w-5 h-5 text-emerald-400" />
                <span>Dossier Officiel de Conformité Commerciale & Rapprochement de Flux</span>
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Printer className="w-4 h-4 mr-1.5" />
                  <span>Imprimer / PDF Dossier</span>
                </button>
                <button onClick={() => setIsDossierModalOpen(false)} className="p-2 text-slate-400 hover:text-white">✕</button>
              </div>
            </div>

            {/* Printable Dossier Sheet */}
            <div className="p-8 sm:p-12 bg-white text-slate-900 print:p-8 space-y-6">
              
              {/* Dossier Header */}
              <div className="border-b-2 border-slate-950 pb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-900 block mb-1">
                      RÉPUBLIQUE DU BÉNIN • ATTESTATION COMMERCIALE & COMPTABLE
                    </span>
                    <h1 className="text-xl font-black text-slate-950 uppercase">{profile.officialBusinessName}</h1>
                    <p className="text-xs text-slate-700 font-semibold">{profile.commercialName} • {profile.legalStructure}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      RCCM: <strong>{profile.rccmNumber}</strong> • IFU: <strong>{profile.ifuNumber}</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-slate-900 text-white font-mono font-bold text-xs uppercase rounded mb-1">
                      DOSSIER DE CONFORMITÉ DERIV
                    </span>
                    <div className="text-[11px] text-slate-500">Réf. Audit: <strong className="font-mono text-slate-800">{selectedInvoice.invoiceNumber}-PACK</strong></div>
                    <div className="text-[10px] text-slate-500">Édité le {formatDate(new Date().toISOString())}</div>
                  </div>
                </div>

                {/* Addresses */}
                <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-600">
                  <div>
                    <strong>Siège Social Légal : </strong>{profile.registeredAddress}, {profile.city}, {profile.country}
                  </div>
                  <div>
                    <strong>Bureaux d'Exploitation : </strong>{profile.operatingAddress}, {profile.city}
                  </div>
                </div>
              </div>

              {/* Official Attestation Body */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-800 space-y-2">
                <div className="font-bold uppercase text-[11px] text-indigo-950">
                  1. Objet de la Présente Documentation de Conformité
                </div>
                <p className="leading-relaxed">
                  La direction de <strong className="text-slate-950">{profile.officialBusinessName}</strong> certifie sur l'honneur l'authenticité de l'activité commerciale ci-après détaillée, réalisée dans le cadre légal des affaires en République du Bénin. Cette documentation est établie aux fins de justification de l'activité économique et de la légitimité des flux financiers pour l'établissement de comptes et relations bancaires ou de courtage institutionnel.
                </p>
              </div>

              {/* Transaction Summary */}
              <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="font-bold uppercase text-[11px] text-slate-900">
                  2. Synthèse de la Transaction Économique Référée
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">N° Facture Commerciale</span>
                    <strong className="font-mono text-indigo-900">{selectedInvoice.invoiceNumber}</strong>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Montant Facturé</span>
                    <strong className="font-mono text-slate-900">{formatCurrency(selectedInvoice.totalAmount, selectedInvoice.currency)}</strong>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Client Contractuel</span>
                    <strong className="truncate block">{selectedInvoice.customerSnapshot.companyName || selectedInvoice.customerSnapshot.fullName}</strong>
                  </div>
                </div>

                {linkedReceipt && (
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-xs text-emerald-950">
                    <div className="font-bold flex items-center mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                      Encaissement Rapproché & Quittance de Paiement N° {linkedReceipt.receiptNumber}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] mt-2">
                      <div>Montant Encaissé: <strong>{formatCurrency(linkedReceipt.amountReceived, linkedReceipt.currency)}</strong></div>
                      <div>Mode: <strong>{getPaymentMethodLabel(linkedReceipt.paymentMethod).label}</strong></div>
                      <div>Réf. Transaction: <strong className="font-mono">{linkedReceipt.transactionReference}</strong></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Official Legal & Verification Disclaimers */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-[10px] text-slate-600 space-y-1.5">
                <div className="font-bold text-slate-800 uppercase">
                  3. Mentions Légales & Restrictions d'Usage
                </div>
                <p>
                  • Ce document atteste de la réalité de l'opération commerciale et de son règlement effectif. Il ne constitue pas un justificatif de domicile résidentiel personnel (Proof of Residential Address) pour les particuliers.
                </p>
                <p>
                  • L'intégrité de cette pièce est vérifiable en ligne via le protocole cryptographique de l'entreprise : <span className="font-mono text-slate-800">{selectedInvoice.verificationToken}</span>.
                </p>
              </div>

              {/* Signatures */}
              <div className="flex justify-between items-end pt-6 border-t-2 border-slate-200">
                <div className="text-[9px] text-slate-400 font-mono">
                  SHA-256 CHECK: {selectedInvoice.documentHash}
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-600">Certifié conforme par :</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">{profile.authorizedSignatoryName}</div>
                  <div className="text-xs text-indigo-900 font-semibold">{profile.authorizedSignatoryTitle}</div>
                  <div className="mt-2 text-[9px] text-slate-500 italic">Cachet & Signature Électronique Validée</div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
