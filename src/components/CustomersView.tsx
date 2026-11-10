/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Building,
  Mail,
  Phone,
  MapPin,
  FileText,
  ReceiptText,
  Printer,
  Download,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  X
} from 'lucide-react';
import { Customer, Invoice, Receipt, BusinessProfile } from '../types.ts';
import { formatCurrency, formatDate } from '../lib/formatters.ts';

interface CustomersViewProps {
  customers: Customer[];
  invoices: Invoice[];
  receipts: Receipt[];
  profile: BusinessProfile;
  onCreateCustomer: (data: Partial<Customer>) => Promise<void>;
  onUpdateCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
  onViewInvoice: (inv: Invoice) => void;
  onViewReceipt: (rec: Receipt) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  invoices,
  receipts,
  profile,
  onCreateCustomer,
  onUpdateCustomer,
  onViewInvoice,
  onViewReceipt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'BUSINESS' | 'INDIVIDUAL'>('ALL');
  
  // Selected Customer for Details / Statement
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isStatementOpen, setIsStatementOpen] = useState(false);

  // Modal create/edit
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('Cotonou');
  const [formCountry, setFormCountry] = useState('Bénin');
  const [formIfu, setFormIfu] = useState('');
  const [formType, setFormType] = useState<'BUSINESS' | 'INDIVIDUAL'>('BUSINESS');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormCompany('');
    setFormEmail('');
    setFormPhone('+229 ');
    setFormAddress('');
    setFormCity('Cotonou');
    setFormCountry('Bénin');
    setFormIfu('');
    setFormType('BUSINESS');
    setFormNotes('');
    setFormError('');
    setIsCustomerModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormError('');
    setFormName(cust.fullName);
    setFormCompany(cust.companyName || '');
    setFormEmail(cust.email);
    setFormPhone(cust.phone);
    setFormAddress(cust.address);
    setFormCity(cust.city);
    setFormCountry(cust.country);
    setFormIfu(cust.ifuNumber || '');
    setFormType(cust.customerType);
    setFormNotes(cust.notes || '');
    setIsCustomerModalOpen(true);
  };

  const handleSubmitCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formName || !formPhone || !formAddress) {
      setFormError('Le nom complet, le téléphone et l\'adresse légitime sont obligatoires.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: Partial<Customer> = {
        fullName: formName,
        companyName: formCompany || undefined,
        email: formEmail,
        phone: formPhone,
        address: formAddress,
        city: formCity,
        country: formCountry,
        ifuNumber: formIfu || undefined,
        customerType: formType,
        notes: formNotes,
      };

      if (editingCustomer) {
        await onUpdateCustomer(editingCustomer.id, payload);
      } else {
        await onCreateCustomer(payload);
      }
      setIsCustomerModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de l\'enregistrement du client.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.companyName && c.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm);
    const matchesType = typeFilter === 'ALL' || c.customerType === typeFilter;
    return matchesSearch && matchesType;
  });

  // Calculate customer financials
  const getCustomerMetrics = (customerId: string) => {
    const clientInvoices = invoices.filter((i) => i.customerId === customerId && i.status !== 'CANCELLED');
    const clientReceipts = receipts.filter((r) => r.customerId === customerId);
    const totalInvoiced = clientInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalPaid = clientInvoices.reduce((acc, curr) => acc + curr.amountPaid, 0);
    const outstanding = clientInvoices.reduce((acc, curr) => acc + curr.remainingBalance, 0);
    return {
      invoices: clientInvoices,
      receipts: clientReceipts,
      totalInvoiced,
      totalPaid,
      outstanding,
    };
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>Fichier Clients & CRM Entreprise</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestion des coordonnées certifiées, historique des transactions et relevés de compte clients.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40 transition-all cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          <span>Nouveau Client</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, entreprise, téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
          <span className="text-slate-500 px-2">Type :</span>
          {(['ALL', 'BUSINESS', 'INDIVIDUAL'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                typeFilter === t ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'ALL' ? 'Tous' : t === 'BUSINESS' ? 'Entreprises' : 'Particuliers'}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => {
          const metrics = getCustomerMetrics(cust.id);
          return (
            <div
              key={cust.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 font-bold border border-slate-700">
                      {cust.companyName ? <Building className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">
                        {cust.companyName || cust.fullName}
                      </h3>
                      {cust.companyName && (
                        <p className="text-xs text-slate-400 font-medium">Attn: {cust.fullName}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    cust.customerType === 'BUSINESS'
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {cust.customerType === 'BUSINESS' ? 'Entreprise' : 'Particulier'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 py-2 border-y border-slate-800/80">
                  <div className="flex items-center space-x-2 text-slate-400 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{cust.address}, {cust.city}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="font-mono text-slate-300">{cust.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-400 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{cust.email || 'Aucun email'}</span>
                  </div>
                  {cust.ifuNumber && (
                    <div className="text-[11px] text-emerald-400 font-mono">
                      IFU: {cust.ifuNumber}
                    </div>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-2 text-center my-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Facturé</span>
                    <span className="font-mono text-xs font-bold text-slate-200">
                      {formatCurrency(metrics.totalInvoiced, 'XOF')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Encaissé</span>
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {formatCurrency(metrics.totalPaid, 'XOF')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Solde Dû</span>
                    <span className={`font-mono text-xs font-bold ${metrics.outstanding > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                      {formatCurrency(metrics.outstanding, 'XOF')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 mt-2">
                <button
                  onClick={() => openEditModal(cust)}
                  className="text-xs text-slate-400 hover:text-white font-medium"
                >
                  Modifier
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedCustomer(cust);
                      setIsStatementOpen(true);
                    }}
                    className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold inline-flex items-center transition-all"
                  >
                    <FileText className="w-3.5 h-3.5 mr-1" />
                    <span>Relevé</span>
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* CUSTOMER CREATE / EDIT MODAL */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>{editingCustomer ? 'Modifier la Fiche Client' : 'Nouveau Client Certifié'}</span>
              </h3>
              <button onClick={() => setIsCustomerModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmitCustomer} className="space-y-3.5 text-xs">
              {formError && (
                <div className="bg-rose-950/60 border border-rose-800 rounded-lg p-2.5 text-xs text-rose-300">
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Type de Client *</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  >
                    <option value="BUSINESS">Entreprise / Société</option>
                    <option value="INDIVIDUAL">Particulier / Professionnel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nom Complet du Contact *</label>
                  <input
                    type="text"
                    placeholder="Ex: Amina Adebayo"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                    required
                  />
                </div>
              </div>

              {formType === 'BUSINESS' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Raison Sociale Entreprise</label>
                    <input
                      type="text"
                      placeholder="Ex: Adebayo Consulting SARL"
                      value={formCompany}
                      onChange={(e) => setFormCompany(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">N° IFU Client (Optionnel B2B)</label>
                    <input
                      type="text"
                      placeholder="13 chiffres"
                      value={formIfu}
                      onChange={(e) => setFormIfu(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Téléphone Professionnel *</label>
                  <input
                    type="text"
                    placeholder="+229 97 00 00 00"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Email Professionnel</label>
                  <input
                    type="email"
                    placeholder="client@domaine.bj"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Adresse Physique Légitime & Validée *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Lot 42, Rue des Palmiers, Quartier Cadjèhoun"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Ville</label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Pays</label>
                  <input
                    type="text"
                    value={formCountry}
                    onChange={(e) => setFormCountry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Notes Internes / Référence contrat</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  {isSubmitting ? 'Enregistrement...' : editingCustomer ? 'Mettre à jour' : 'Créer le Client'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER STATEMENT MODAL (RELEVÉ DE COMPTE) */}
      {selectedCustomer && isStatementOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex justify-center p-4 print:p-0 print:bg-white">
          <div className="relative w-full max-w-4xl bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl flex flex-col my-auto print:my-0 print:border-none print:shadow-none print:bg-white text-slate-100 print:text-slate-900">
            
            {/* Header controls (hidden on print) */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 rounded-t-2xl print:hidden">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span>Relevé de Compte Commercial & Historique des Opérations</span>
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  <Printer className="w-4 h-4 mr-1.5" />
                  <span>Imprimer / PDF</span>
                </button>
                <button
                  onClick={() => setIsStatementOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Statement Sheet */}
            <div className="p-8 sm:p-12 bg-white text-slate-900 print:p-8">
              
              <div className="flex justify-between items-start pb-6 border-b-2 border-slate-900">
                <div>
                  <h1 className="text-xl font-black text-slate-950 uppercase">{profile.officialBusinessName}</h1>
                  <p className="text-xs text-indigo-900 font-semibold">{profile.commercialName} • RCCM: {profile.rccmNumber} • IFU: {profile.ifuNumber}</p>
                  <p className="text-xs text-slate-600 mt-1">{profile.registeredAddress}, {profile.city}, {profile.country}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black font-mono text-slate-900">RELEVÉ DE COMPTE CLIENT</div>
                  <div className="text-xs text-slate-500">Date d'édition: {formatDate(new Date().toISOString())}</div>
                </div>
              </div>

              {/* Customer info */}
              <div className="my-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Titulaire du Compte :</span>
                <div className="text-base font-bold text-slate-900">{selectedCustomer.companyName || selectedCustomer.fullName}</div>
                <div className="text-xs text-slate-600 mt-1">
                  <div>Adresse: {selectedCustomer.address}, {selectedCustomer.city}, {selectedCustomer.country}</div>
                  <div>Tél: {selectedCustomer.phone} • Email: {selectedCustomer.email}</div>
                  {selectedCustomer.ifuNumber && <div>IFU: {selectedCustomer.ifuNumber}</div>}
                </div>
              </div>

              {/* Ledger Table */}
              <div className="mb-6">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px] uppercase">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Nature de l'Opération</th>
                      <th className="py-2 px-3">Réf. Document / Preuve</th>
                      <th className="py-2 px-3 text-right">Débit (Facturé)</th>
                      <th className="py-2 px-3 text-right">Crédit (Encaissé)</th>
                      <th className="py-2 px-3 text-right">Solde Restant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {getCustomerMetrics(selectedCustomer.id).invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-600">{formatDate(inv.issueDate)}</td>
                        <td className="py-2 px-3 font-medium text-slate-800">Facture Commerciale</td>
                        <td className="py-2 px-3 font-mono font-bold text-indigo-900">{inv.invoiceNumber}</td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">{formatCurrency(inv.totalAmount, inv.currency)}</td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-700">{formatCurrency(inv.amountPaid, inv.currency)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">{formatCurrency(inv.remainingBalance, inv.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signoff */}
              <div className="flex justify-between items-end pt-6 border-t border-slate-200 text-xs">
                <div className="text-[10px] text-slate-500 max-w-sm">
                  Document officiel de synthèse comptable délivré à titre de relevé commercial pour valider les écritures entre les parties.
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-800">{profile.authorizedSignatoryName}</div>
                  <div className="text-[11px] text-slate-500">{profile.authorizedSignatoryTitle}</div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
