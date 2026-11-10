/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CreditCard,
  Printer,
  Ban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building2,
  Trash2,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { Customer, Invoice, PaymentMethod, PaymentEvidence, CurrencyCode, ServiceCatalogItem } from '../types.ts';
import { formatCurrency, formatDate, getInvoiceStatusBadge, getPaymentMethodLabel, numberToWordsFrench } from '../lib/formatters.ts';
import { api } from '../lib/api.ts';

interface InvoicesViewProps {
  invoices: Invoice[];
  customers: Customer[];
  defaultCurrency: CurrencyCode;
  defaultTaxRate: number;
  onCreateInvoice: (data: any) => Promise<void>;
  onRecordPayment: (invoiceId: string, evidence: any) => Promise<void>;
  onRefundInvoice?: (invoiceId: string, refundData: any) => Promise<void>;
  onCancelInvoice: (invoiceId: string, reason: string) => Promise<void>;
  onViewInvoice: (inv: Invoice) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  customers,
  defaultCurrency,
  defaultTaxRate,
  onCreateInvoice,
  onRecordPayment,
  onRefundInvoice,
  onCancelInvoice,
  onViewInvoice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [cancelModalInvoice, setCancelModalInvoice] = useState<Invoice | null>(null);
  const [refundModalInvoice, setRefundModalInvoice] = useState<Invoice | null>(null);

  // Catalog
  const [catalog, setCatalog] = useState<ServiceCatalogItem[]>([]);
  React.useEffect(() => {
    api.getCatalog().then((items) => setCatalog(items)).catch(() => {});
  }, []);

  // Refund states
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState<string>('');
  const [refundRef, setRefundRef] = useState<string>('');
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [refundError, setRefundError] = useState<string>('');

  // Form states for creating invoice
  const [formCustomerId, setFormCustomerId] = useState(customers[0]?.id || '');
  const [formIssueDate, setFormIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDeliveryDate, setFormDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDueDate, setFormDueDate] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [formCurrency, setFormCurrency] = useState<CurrencyCode>(defaultCurrency || 'XOF');
  const [formTaxRate, setFormTaxRate] = useState<number>(defaultTaxRate || 18);
  const [formNotes, setFormNotes] = useState('Prestation de services informatiques et accompagnement technique.');
  const [formTerms, setFormTerms] = useState('Paiement à 15 jours. Tout retard entraîne l\'application des pénalités légales conformément aux règles OHADA.');
  const [formItems, setFormItems] = useState([
    { description: 'Développement et intégration de services web', quantity: 1, unitPrice: 500000 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');
  const [cancelError, setCancelError] = useState('');

  // Form states for recording payment
  const [payMethod, setPayMethod] = useState<PaymentMethod>('MTN_MOMO');
  const [payRef, setPayRef] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 16));
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payNotes, setPayNotes] = useState('');
  const [payError, setPayError] = useState('');

  // Cancel form
  const [cancelReason, setCancelReason] = useState('');

  // Filtering
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerSnapshot.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.customerSnapshot.companyName && inv.customerSnapshot.companyName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchesCurrency = currencyFilter === 'ALL' || inv.currency === currencyFilter;
    return matchesSearch && matchesStatus && matchesCurrency;
  });

  const handleAddItem = () => {
    setFormItems([...formItems, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (idx: number) => {
    if (formItems.length === 1) return;
    setFormItems(formItems.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: string, value: any) => {
    const updated = [...formItems];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormItems(updated);
  };

  const calculateFormSubtotal = () => {
    return formItems.reduce((acc, curr) => acc + (Number(curr.quantity) || 0) * (Number(curr.unitPrice) || 0), 0);
  };
  const formSubtotal = calculateFormSubtotal();
  const formTaxAmount = Math.round((formSubtotal * (Number(formTaxRate) || 0)) / 100);
  const formTotal = formSubtotal + formTaxAmount;

  React.useEffect(() => {
    if (customers.length > 0 && (!formCustomerId || !customers.some(c => c.id === formCustomerId))) {
      setFormCustomerId(customers[0].id);
    }
  }, [customers, formCustomerId]);

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    const targetCustId = formCustomerId || customers[0]?.id;
    if (!targetCustId) {
      setCreateError('Veuillez créer ou sélectionner un client bénéficiaire.');
      return;
    }
    const validItems = formItems.filter((it) => it.description.trim() && Number(it.unitPrice) > 0);
    if (validItems.length === 0) {
      setCreateError('Veuillez spécifier une description et un tarif valide supérieur à 0 pour chaque prestation.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onCreateInvoice({
        customerId: targetCustId,
        issueDate: formIssueDate,
        deliveryDate: formDeliveryDate,
        dueDate: formDueDate,
        currency: formCurrency,
        taxRate: formTaxRate,
        notes: formNotes,
        terms: formTerms,
        items: validItems,
      });
      setIsCreateModalOpen(false);
      // Reset defaults
      setFormItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    } catch (err: any) {
      setCreateError(err.message || 'Erreur lors de la création de la facture.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPaymentModal = (inv: Invoice) => {
    setPaymentModalInvoice(inv);
    setPayAmount(inv.remainingBalance);
    setPayRef('');
    setPayDate(new Date().toISOString().slice(0, 16));
    setPayMethod('MTN_MOMO');
    setPayNotes('');
    setPayError('');
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;
    if (!payRef || payRef.trim().length < 4) {
      setPayError('La référence de transaction officielle (MoMo ID ou Réf Virement) est obligatoire.');
      return;
    }
    if (payAmount <= 0) {
      setPayError('Le montant réglé doit être supérieur à zéro.');
      return;
    }
    if (payAmount > paymentModalInvoice.remainingBalance + 0.01) {
      setPayError(`Le montant ne peut excéder le solde restant (${formatCurrency(paymentModalInvoice.remainingBalance, paymentModalInvoice.currency)}).`);
      return;
    }

    setIsSubmitting(true);
    setPayError('');
    try {
      await onRecordPayment(paymentModalInvoice.id, {
        paymentMethod: payMethod,
        transactionReference: payRef.trim(),
        paymentDate: new Date(payDate).toISOString(),
        amountPaid: Number(payAmount),
        currency: paymentModalInvoice.currency,
        notes: payNotes,
      });
      setPaymentModalInvoice(null);
    } catch (err: any) {
      setPayError(err.message || 'Erreur lors de l\'enregistrement du paiement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRefundModal = (inv: Invoice) => {
    setRefundModalInvoice(inv);
    setRefundAmount(inv.amountPaid);
    setRefundRef('');
    setRefundReason('');
    setRefundMethod('BANK_TRANSFER');
    setRefundError('');
  };

  const handleConfirmRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundModalInvoice) return;
    setRefundError('');
    if (!refundRef || refundRef.trim().length < 3) {
      setRefundError('La référence de virement ou transaction de remboursement est obligatoire.');
      return;
    }
    if (!refundReason || refundReason.trim().length < 5) {
      setRefundError('Un motif officiel de remboursement / avoir est obligatoire.');
      return;
    }
    if (refundAmount <= 0 || refundAmount > refundModalInvoice.amountPaid) {
      setRefundError(`Le montant du remboursement doit être compris entre 1 et ${formatCurrency(refundModalInvoice.amountPaid, refundModalInvoice.currency)}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (onRefundInvoice) {
        await onRefundInvoice(refundModalInvoice.id, {
          refundAmount: Number(refundAmount),
          reason: refundReason.trim(),
          transactionReference: refundRef.trim(),
          paymentMethod: refundMethod,
        });
      }
      setRefundModalInvoice(null);
    } catch (err: any) {
      setRefundError(err.message || 'Erreur lors de l\'émission du remboursement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCatalogItemPrice = (item: ServiceCatalogItem, curr: CurrencyCode): number => {
    if (curr === 'EUR') return item.unitPriceEUR;
    if (curr === 'USD') return item.unitPriceUSD;
    return item.unitPriceXOF;
  };

  const handleSelectCatalogItem = (serviceId: string) => {
    const item = catalog.find((c) => c.id === serviceId);
    if (!item) return;
    const price = getCatalogItemPrice(item, formCurrency);
    // If the only item is empty, replace it; otherwise append
    if (formItems.length === 1 && !formItems[0].description.trim() && formItems[0].unitPrice === 0) {
      setFormItems([{ description: item.title, quantity: 1, unitPrice: price }]);
    } else {
      setFormItems([...formItems, { description: item.title, quantity: 1, unitPrice: price }]);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalInvoice) return;
    setCancelError('');
    if (!cancelReason || cancelReason.trim().length < 5) {
      setCancelError('Un motif légitime d\'annulation est obligatoire.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onCancelInvoice(cancelModalInvoice.id, cancelReason);
      setCancelModalInvoice(null);
      setCancelReason('');
    } catch (err: any) {
      setCancelError(err.message || 'Erreur lors de l\'annulation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span>Gestion des Factures Commerciales</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Émission et suivi séquentiel des factures pour prestations numériques réelles au Bénin.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          <span>Nouvelle Facture</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par N° ou nom client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
            <span className="text-slate-500 px-2">Statut:</span>
            {['ALL', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                  statusFilter === st ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'ALL' ? 'Tous' : st === 'UNPAID' ? 'En attente' : st === 'PARTIALLY_PAID' ? 'Partiel' : st === 'PAID' ? 'Payée' : 'Annulée'}
              </button>
            ))}
          </div>

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

      {/* Invoices List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              Aucune facture ne correspond aux critères de recherche.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">N° Facture</th>
                  <th className="py-3.5 px-4 font-semibold">Date Émission</th>
                  <th className="py-3.5 px-4 font-semibold">Client / Entreprise</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Montant Total</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Encaissé</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Solde Dû</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Statut</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredInvoices.map((inv) => {
                  const badge = getInvoiceStatusBadge(inv.status);
                  const canPay = inv.status !== 'PAID' && inv.status !== 'CANCELLED' && inv.remainingBalance > 0;
                  const canRefund = (inv.amountPaid > 0 || inv.status === 'PAID' || inv.status === 'PARTIALLY_PAID') && inv.status !== 'REFUNDED';
                  const canCancel = inv.payments.length === 0 && inv.status !== 'CANCELLED';

                  return (
                    <tr key={inv.id} className="hover:bg-slate-850/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {formatDate(inv.issueDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">
                          {inv.customerSnapshot.companyName || inv.customerSnapshot.fullName}
                        </div>
                        {inv.customerSnapshot.companyName && (
                          <div className="text-[10px] text-slate-400">
                            Attn: {inv.customerSnapshot.fullName}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100">
                        {formatCurrency(inv.totalAmount, inv.currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-400">
                        {formatCurrency(inv.amountPaid, inv.currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-rose-400">
                        {formatCurrency(inv.remainingBalance, inv.currency)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${badge.bg} ${badge.textCol} ${badge.border}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => onViewInvoice(inv)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center transition-all"
                          title="Imprimer ou prévisualiser la facture officielle"
                        >
                          <Printer className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                          <span>PDF / Voir</span>
                        </button>

                        {canPay && (
                          <button
                            onClick={() => openPaymentModal(inv)}
                            className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold inline-flex items-center transition-all"
                            title="Enregistrer une preuve de paiement et émettre le reçu officiel"
                          >
                            <CreditCard className="w-3.5 h-3.5 mr-1" />
                            <span>Encaisser</span>
                          </button>
                        )}

                        {canRefund && (
                          <button
                            onClick={() => openRefundModal(inv)}
                            className="px-2.5 py-1 rounded bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold inline-flex items-center transition-all"
                            title="Émettre une note de crédit / avoir ou remboursement"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                            <span>Avoir / Rembourser</span>
                          </button>
                        )}

                        {canCancel && (
                          <button
                            onClick={() => {
                              setCancelModalInvoice(inv);
                              setCancelReason('');
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 transition-all"
                            title="Annuler cette facture"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CREATE INVOICE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <span>Émettre une Facture Commerciale Officielle</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Génération d'un document commercial séquentiel avec calcul automatique de la TVA béninoise.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="space-y-4 text-xs">
              {createError && (
                <div className="bg-rose-950/60 border border-rose-800 rounded-lg p-2.5 text-xs text-rose-300">
                  {createError}
                </div>
              )}
              
              {/* Customer selection */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Client Bénéficiaire (Fichier Clients) *
                </label>
                <select
                  value={formCustomerId}
                  onChange={(e) => setFormCustomerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                  required
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName ? `${c.companyName} (${c.fullName})` : c.fullName} • {c.city}, {c.country}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates & Currency Row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Date d'Émission *</label>
                  <input
                    type="date"
                    value={formIssueDate}
                    onChange={(e) => setFormIssueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Date Livraison Service *</label>
                  <input
                    type="date"
                    value={formDeliveryDate}
                    onChange={(e) => setFormDeliveryDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Échéance de Règlement *</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Devise Facturée *</label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value as CurrencyCode)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  >
                    <option value="XOF">XOF (FCFA)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              {/* Line Items */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                  <span className="font-semibold text-slate-300">
                    Prestations de Services Réelles Réalisées *
                  </span>
                  <div className="flex items-center space-x-2">
                    {catalog.length > 0 && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleSelectCatalogItem(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        defaultValue=""
                        className="bg-slate-900 border border-slate-800 text-[11px] text-indigo-300 rounded-lg px-2.5 py-1 focus:outline-none"
                      >
                        <option value="" disabled>+ Insérer depuis le Catalogue Réel</option>
                        {catalog.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title} ({formatCurrency(getCatalogItemPrice(c, formCurrency), formCurrency)})
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center bg-slate-950 px-2 py-1 rounded border border-slate-800"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Ligne manuelle
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {formItems.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Ex: Audit architecture cloud, développement API..."
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="w-full bg-transparent text-slate-200 text-xs focus:outline-none"
                          required
                        />
                      </div>
                      <div className="w-16">
                        <input
                          type="number"
                          placeholder="Qté"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-right text-slate-200 font-mono text-xs"
                          required
                        />
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          placeholder="Prix unitaire"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-right text-slate-200 font-mono text-xs"
                          required
                        />
                      </div>
                      <div className="w-28 text-right font-mono font-bold text-slate-300 text-xs">
                        {formatCurrency((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), formCurrency)}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={formItems.length === 1}
                        className="text-slate-500 hover:text-rose-400 disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Taxes & Totals */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Taux TVA Bénin (%):</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formTaxRate}
                      onChange={(e) => setFormTaxRate(Number(e.target.value))}
                      className="w-16 bg-slate-900 border border-slate-800 rounded p-1 text-right font-mono text-xs text-slate-200"
                    />
                    <span className="text-slate-400">%</span>
                  </div>
                </div>

                <div className="flex justify-between text-slate-400 text-xs">
                  <span>Sous-Total HT :</span>
                  <span className="font-mono text-slate-200 font-semibold">{formatCurrency(formSubtotal, formCurrency)}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-xs">
                  <span>TVA ({formTaxRate}%) :</span>
                  <span className="font-mono text-slate-200 font-semibold">{formatCurrency(formTaxAmount, formCurrency)}</span>
                </div>
                <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-slate-800">
                  <span>Montant Total Facturé TTC :</span>
                  <span className="font-mono text-indigo-400 font-black">{formatCurrency(formTotal, formCurrency)}</span>
                </div>

                {/* Live French numberToWords */}
                <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg text-slate-300 text-xs mt-2">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 block mb-0.5">
                    Arrêtée la présente facture à la somme de (en toutes lettres) :
                  </span>
                  <p className="italic font-medium text-slate-200">
                    « {numberToWordsFrench(formTotal, formCurrency)} »
                  </p>
                </div>
              </div>

              {/* Notes & Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Observations / Description complémentaire</label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Conditions de règlement (OHADA)</label>
                  <textarea
                    rows={2}
                    value={formTerms}
                    onChange={(e) => setFormTerms(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-900/30 flex items-center"
                >
                  {isSubmitting ? 'Émission en cours...' : 'Émettre la Facture Officielle'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT & ISSUE RECEIPT MODAL */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  <span>Enregistrer Encaissement & Émettre Quittance</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Facture <span className="font-mono text-indigo-300 font-bold">{paymentModalInvoice.invoiceNumber}</span> • Solde restant : {formatCurrency(paymentModalInvoice.remainingBalance, paymentModalInvoice.currency)}
                </p>
              </div>
              <button onClick={() => setPaymentModalInvoice(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Strict Regulatory Notice */}
            <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3 text-xs text-amber-200 mb-4 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Règle de Sécurité Comptable :</strong> Conformément à la législation, un reçu officiel ne peut être émis que sur base d'une preuve de transaction bancaire ou télécom réelle (MoMo / Virement).
              </p>
            </div>

            {payError && (
              <div className="bg-rose-950/60 border border-rose-800 rounded-lg p-2.5 text-xs text-rose-300 mb-3">
                {payError}
              </div>
            )}

            <form onSubmit={handleConfirmPayment} className="space-y-3.5 text-xs">
              
              <div>
                <label className="block text-slate-300 font-medium mb-1">Mode de Règlement Effectif *</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                >
                  <option value="MTN_MOMO">MTN Mobile Money Bénin</option>
                  <option value="MOOV_MONEY">Moov Money Flooz Bénin</option>
                  <option value="BANK_TRANSFER">Virement Bancaire (Ecobank, BOA, BIIC, SGB...)</option>
                  <option value="CREDIT_CARD">Carte Bancaire (Visa / Mastercard)</option>
                  <option value="CRYPTOCURRENCY">Paiement Crypto On-Chain (USDT/USDC)</option>
                  <option value="CHEQUE">Chèque Bancaire Certifié</option>
                  <option value="CASH">Espèces au Guichet</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Référence de Transaction Officielle * (Preuve de paiement)
                </label>
                <input
                  type="text"
                  placeholder="Ex: MOMO-CI-889140 ou VIR-ECOB-BJ-2026-091"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Identifiant non-modifiable figurant sur le relevé bancaire ou reçu télécom.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Montant Encaissé ({paymentModalInvoice.currency}) *</label>
                  <input
                    type="number"
                    min="1"
                    max={paymentModalInvoice.remainingBalance}
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Date & Heure du Règlement *</label>
                  <input
                    type="datetime-local"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Note de Rapprochement Comptable</label>
                <input
                  type="text"
                  placeholder="Ex: Rapproché sur compte commercial Ecobank Bénin"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950/40 flex items-center"
                >
                  {isSubmitting ? 'Traitement...' : 'Encaisser & Délivrer Reçu Officiel'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* REFUND / CREDIT NOTE MODAL */}
      {refundModalInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <RotateCcw className="w-5 h-5 text-purple-400" />
                  <span>Émettre un Remboursement / Avoir</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Facture <span className="font-mono text-indigo-300 font-bold">{refundModalInvoice.invoiceNumber}</span> • Déjà encaissé : {formatCurrency(refundModalInvoice.amountPaid, refundModalInvoice.currency)}
                </p>
              </div>
              <button onClick={() => setRefundModalInvoice(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Regulatory Notice */}
            <div className="bg-purple-950/40 border border-purple-800/60 rounded-xl p-3 text-xs text-purple-200 mb-4 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Traçabilité Comptable OHADA :</strong> Tout remboursement génère un avoir formel et une écriture inverse dans le journal des encaissements scellée par empreinte SHA-256.
              </p>
            </div>

            {refundError && (
              <div className="bg-rose-950/60 border border-rose-800 rounded-lg p-2.5 text-xs text-rose-300 mb-3">
                {refundError}
              </div>
            )}

            <form onSubmit={handleConfirmRefund} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Mode de Rétrocession / Remboursement *</label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                >
                  <option value="BANK_TRANSFER">Virement Bancaire (Compte Entreprise)</option>
                  <option value="MTN_MOMO">MTN Mobile Money Bénin</option>
                  <option value="MOOV_MONEY">Moov Money Flooz</option>
                  <option value="CREDIT_CARD">Recrédit Carte Bancaire</option>
                  <option value="CHEQUE">Chèque Bancaire</option>
                  <option value="CASH">Remboursement Espèces</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Référence de Transaction Bancaire / MoMo * (Preuve de rétrocession)
                </label>
                <input
                  type="text"
                  placeholder="Ex: VIR-REMB-2026-004 ou MOMO-REF-9921"
                  value={refundRef}
                  onChange={(e) => setRefundRef(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Montant à Rembourser ({refundModalInvoice.currency}) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={refundModalInvoice.amountPaid}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono font-bold"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Maximum remboursable : {formatCurrency(refundModalInvoice.amountPaid, refundModalInvoice.currency)}
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Motif Légal / Commercial du Remboursement *
                </label>
                <textarea
                  rows={2}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Ex: Résiliation conjointe d'étape de prestation / régularisation de trop-perçu..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRefundModalInvoice(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-950/40 flex items-center"
                >
                  {isSubmitting ? 'Traitement...' : 'Émettre l\'Avoir & Rembourser'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {cancelModalInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 text-slate-100">
            <h3 className="text-base font-bold text-white mb-2 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>Annulation de Facture</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Vous êtes sur le point d'annuler la facture <strong className="text-white">{cancelModalInvoice.invoiceNumber}</strong>. Cette action est irréversible et sera enregistrée de façon immuable dans le journal d'audit.
            </p>

            {cancelError && (
              <div className="bg-rose-950/60 border border-rose-800 rounded-lg p-2.5 text-xs text-rose-300 mb-3">
                {cancelError}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-slate-300 text-xs font-semibold mb-1">
                Motif réglementaire d'annulation *
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex: Erreur de saisie sur le montant avant tout encaissement / prestation annulée par accord mutuel..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                required
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setCancelModalInvoice(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Fermer
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                {isSubmitting ? 'Annulation...' : 'Confirmer l\'Annulation'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
