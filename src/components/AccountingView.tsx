/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  FileSpreadsheet,
  Download,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  Receipt,
  Building,
  ShieldCheck,
  RefreshCw,
  Calendar,
  Layers,
  FileCheck
} from 'lucide-react';
import { AccountingJournals, CurrencyCode, Expense, ExpenseCategory, PaymentMethod } from '../types.ts';
import { formatCurrency, formatDate, formatDateTime, getPaymentMethodLabel } from '../lib/formatters.ts';
import { api } from '../lib/api.ts';

interface AccountingViewProps {
  onRefreshAll?: () => void;
}

export const AccountingView: React.FC<AccountingViewProps> = ({ onRefreshAll }) => {
  const [data, setData] = useState<AccountingJournals | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sales' | 'receipts' | 'expenses' | 'receivables'>('sales');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('XOF');
  const [searchTerm, setSearchTerm] = useState('');

  // Add Expense Modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('HEBERGEMENT_CLOUD');
  const [expenseSupplier, setExpenseSupplier] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseCurrency, setExpenseCurrency] = useState<CurrencyCode>('XOF');
  const [expenseMethod, setExpenseMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [expenseRef, setExpenseRef] = useState('');
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [expenseError, setExpenseError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getAccountingJournals();
      setData(res);
    } catch (err) {
      console.error('Failed to load accounting journals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseError('');
    if (!expenseSupplier.trim()) {
      setExpenseError('Le nom du fournisseur ou prestataire est obligatoire.');
      return;
    }
    if (!expenseDesc.trim()) {
      setExpenseError('La description de la charge est obligatoire.');
      return;
    }
    if (expenseAmount <= 0) {
      setExpenseError('Le montant de la dépense doit être supérieur à zéro.');
      return;
    }
    if (!expenseRef.trim()) {
      setExpenseError('La référence de paiement ou numéro de reçu fournisseur est obligatoire.');
      return;
    }

    setIsSubmittingExpense(true);
    try {
      await api.createExpense({
        date: expenseDate,
        category: expenseCategory,
        supplierName: expenseSupplier.trim(),
        description: expenseDesc.trim(),
        amount: Number(expenseAmount),
        currency: expenseCurrency,
        paymentMethod: expenseMethod,
        transactionReference: expenseRef.trim(),
      });
      setIsExpenseModalOpen(false);
      // Reset form
      setExpenseSupplier('');
      setExpenseDesc('');
      setExpenseAmount(0);
      setExpenseRef('');
      await loadData();
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      setExpenseError(err.message || 'Erreur lors de l\'enregistrement de la dépense.');
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  // CSV Exporter for each journal
  const exportCsv = (journalType: 'sales' | 'receipts' | 'expenses') => {
    if (!data) return;
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (journalType === 'sales') {
      csvContent += 'Date,N_Facture,Client,Montant_HT,Taux_TVA,Montant_TVA,Total_TTC,Montant_Paye,Solde_Restant,Devise,Statut\r\n';
      data.salesJournal.forEach((row) => {
        csvContent += `"${row.issueDate}","${row.invoiceNumber}","${row.customerName}",${row.subtotal},${row.taxRate},${row.taxAmount},${row.totalAmount},${row.amountPaid},${row.remainingBalance},"${row.currency}","${row.status}"\r\n`;
      });
    } else if (journalType === 'receipts') {
      csvContent += 'Date_Heure,N_Recu,N_Facture,Client,Montant_Recu,Devise,Mode_Reglement,Reference_Transaction,Operateur\r\n';
      data.receiptsJournal.forEach((row) => {
        csvContent += `"${row.paymentDateTime}","${row.receiptNumber}","${row.invoiceNumber}","${row.customerName}",${row.amountReceived},"${row.currency}","${row.paymentMethod}","${row.transactionReference}","${row.operator}"\r\n`;
      });
    } else {
      csvContent += 'Date,N_Depense,Categorie,Fournisseur,Description,Montant,Devise,Mode_Paiement,Reference_Transaction\r\n';
      data.expensesJournal.forEach((row) => {
        csvContent += `"${row.date}","${row.expenseNumber}","${row.category}","${row.supplierName}","${row.description}",${row.amount},"${row.currency}","${row.paymentMethod}","${row.transactionReference}"\r\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `journal_${journalType}_afriq_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mb-3" />
        <span className="text-xs font-semibold">Génération des Journaux Comptables & Rapprochement (OHADA)...</span>
      </div>
    );
  }

  // Dynamic calculations for selected currency
  const revHT = data.salesJournal.filter(s => s.currency === selectedCurrency).reduce((sum, s) => sum + s.subtotal, 0);
  const taxCol = data.salesJournal.filter(s => s.currency === selectedCurrency).reduce((sum, s) => sum + s.taxAmount, 0);
  const cashRec = data.receiptsJournal.filter(r => r.currency === selectedCurrency).reduce((sum, r) => sum + r.amountReceived, 0);
  const expTotal = data.expensesJournal.filter(e => e.currency === selectedCurrency).reduce((sum, e) => sum + e.amount, 0);
  const netCash = cashRec - expTotal;

  const currencyAging = data.receivablesAging.filter(r => r.currency === selectedCurrency);
  const outstanding = currencyAging.reduce((sum, r) => sum + r.remainingBalance, 0);
  const currentNotDue = currencyAging.filter(r => r.agingBucket === 'NOT_DUE' || r.daysOverdue <= 0).reduce((sum, r) => sum + r.remainingBalance, 0);
  const overdue30 = currencyAging.filter(r => r.agingBucket === '0_30_DAYS' || (r.daysOverdue > 0 && r.daysOverdue <= 30)).reduce((sum, r) => sum + r.remainingBalance, 0);
  const overdue60 = currencyAging.filter(r => r.agingBucket === '31_60_DAYS' || r.agingBucket === 'OVER_60_DAYS' || r.daysOverdue > 30).reduce((sum, r) => sum + r.remainingBalance, 0);

  // Filtered rows for active table
  const filteredSales = data.salesJournal.filter((row) => {
    const matchesSearch =
      row.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCurrency = selectedCurrency === row.currency;
    return matchesSearch && matchesCurrency;
  });

  const filteredReceipts = data.receiptsJournal.filter((row) => {
    const matchesSearch =
      row.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.transactionReference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCurrency = selectedCurrency === row.currency;
    return matchesSearch && matchesCurrency;
  });

  const filteredExpenses = data.expensesJournal.filter((row) => {
    const matchesSearch =
      row.expenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCurrency = selectedCurrency === row.currency;
    return matchesSearch && matchesCurrency;
  });

  const filteredReceivables = currencyAging.filter((row) => {
    const matchesSearch =
      row.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Comptabilité Générale, Journaux & Rapprochement</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Conformité SYSCOHADA & DGI Bénin : Ventes, Encaissements effectifs, Charges d'exploitation et Balance âgée des créances.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Currency selector */}
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value as CurrencyCode)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 font-mono font-bold focus:outline-none"
          >
            <option value="XOF">XOF (FCFA)</option>
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
          </select>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Enregistrer Dépense</span>
          </button>
        </div>
      </div>

      {/* Accounting Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>Facturation HT (Ventes)</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-lg font-black font-mono text-slate-100">
            {formatCurrency(revHT, selectedCurrency)}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Base imposable DGI</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>TVA Collectée (Bénin)</span>
            <Layers className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-black font-mono text-amber-400">
            {formatCurrency(taxCol, selectedCurrency)}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">À reverser au fisc</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>Encaissements Réels</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-black font-mono text-emerald-400">
            {formatCurrency(cashRec, selectedCurrency)}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Preuves bancaires & MoMo</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>Dépenses d'Exploitation</span>
            <ArrowDownLeft className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-lg font-black font-mono text-rose-400">
            {formatCurrency(expTotal, selectedCurrency)}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Charges déductibles</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>Solde Net Trésorerie</span>
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className={`text-lg font-black font-mono ${netCash >= 0 ? 'text-indigo-300' : 'text-rose-400'}`}>
            {formatCurrency(netCash, selectedCurrency)}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Encaissements - Dépenses</span>
        </div>

      </div>

      {/* Tabs and Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center space-x-1.5 ${
              activeTab === 'sales' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Journal des Ventes ({data.salesJournal.filter(s => s.currency === selectedCurrency).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('receipts')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center space-x-1.5 ${
              activeTab === 'receipts' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Journal des Encaissements ({data.receiptsJournal.filter(r => r.currency === selectedCurrency).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center space-x-1.5 ${
              activeTab === 'expenses' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Journal des Dépenses ({data.expensesJournal.filter(e => e.currency === selectedCurrency).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('receivables')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center space-x-1.5 ${
              activeTab === 'receivables' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Suivi des Créances ({currencyAging.length})</span>
          </button>
        </div>

        {/* Search & Export Buttons */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
            />
          </div>

          {activeTab !== 'receivables' && (
            <button
              onClick={() => exportCsv(activeTab)}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              <span>Exporter CSV</span>
            </button>
          )}
        </div>

      </div>

      {/* Tab 1: Journal des Ventes */}
      {activeTab === 'sales' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            {filteredSales.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                Aucune écriture de vente enregistrée dans cette devise ({selectedCurrency}).
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 font-semibold">Date Émission</th>
                    <th className="py-3 px-4 font-semibold">N° Facture</th>
                    <th className="py-3 px-4 font-semibold">Client / Entreprise</th>
                    <th className="py-3 px-4 text-right font-semibold">Montant HT</th>
                    <th className="py-3 px-4 text-center font-semibold">TVA</th>
                    <th className="py-3 px-4 text-right font-semibold">Montant TVA</th>
                    <th className="py-3 px-4 text-right font-semibold">Total TTC</th>
                    <th className="py-3 px-4 text-right font-semibold">Encaissé</th>
                    <th className="py-3 px-4 text-right font-semibold">Solde Dû</th>
                    <th className="py-3 px-4 text-center font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {filteredSales.map((row) => (
                    <tr key={row.invoiceNumber} className="hover:bg-slate-850/60 transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-sans">{formatDate(row.issueDate)}</td>
                      <td className="py-3 px-4 font-bold text-indigo-300">{row.invoiceNumber}</td>
                      <td className="py-3 px-4 font-sans font-semibold text-slate-200">{row.customerName}</td>
                      <td className="py-3 px-4 text-right text-slate-300">{formatCurrency(row.subtotal, row.currency)}</td>
                      <td className="py-3 px-4 text-center text-slate-400">{row.taxRate}%</td>
                      <td className="py-3 px-4 text-right text-amber-300">{formatCurrency(row.taxAmount, row.currency)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-100">{formatCurrency(row.totalAmount, row.currency)}</td>
                      <td className="py-3 px-4 text-right text-emerald-400">{formatCurrency(row.amountPaid, row.currency)}</td>
                      <td className="py-3 px-4 text-right font-bold text-rose-400">{formatCurrency(row.remainingBalance, row.currency)}</td>
                      <td className="py-3 px-4 text-center font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Journal des Encaissements */}
      {activeTab === 'receipts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            {filteredReceipts.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                Aucun encaissement validé dans cette devise ({selectedCurrency}).
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 font-semibold">Date & Heure</th>
                    <th className="py-3 px-4 font-semibold">N° Quittance</th>
                    <th className="py-3 px-4 font-semibold">Facture Réf.</th>
                    <th className="py-3 px-4 font-semibold">Client</th>
                    <th className="py-3 px-4 font-semibold">Mode Règlement</th>
                    <th className="py-3 px-4 font-semibold">Réf. Transaction (Preuve)</th>
                    <th className="py-3 px-4 text-right font-semibold">Montant Encaissé</th>
                    <th className="py-3 px-4 font-semibold">Agent Opérateur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredReceipts.map((row) => (
                    <tr key={row.receiptNumber} className="hover:bg-slate-850/60 transition-colors">
                      <td className="py-3 px-4 text-slate-400">{formatDateTime(row.paymentDateTime)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">{row.receiptNumber}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-indigo-300">{row.invoiceNumber}</td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{row.customerName}</td>
                      <td className="py-3 px-4 text-slate-300">
                        {getPaymentMethodLabel(row.paymentMethod).label}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-300 bg-emerald-950/20 px-2 py-1 rounded">
                        {row.transactionReference}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-400">
                        {formatCurrency(row.amountReceived, row.currency)}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">{row.operator}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Journal des Dépenses */}
      {activeTab === 'expenses' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                Aucune charge d'exploitation enregistrée dans cette devise ({selectedCurrency}).
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Réf. Dépense</th>
                    <th className="py-3 px-4 font-semibold">Catégorie</th>
                    <th className="py-3 px-4 font-semibold">Fournisseur / Prestataire</th>
                    <th className="py-3 px-4 font-semibold">Description de la Charge</th>
                    <th className="py-3 px-4 font-semibold">Mode & Réf Paiement</th>
                    <th className="py-3 px-4 text-right font-semibold">Montant ({selectedCurrency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-850/60 transition-colors">
                      <td className="py-3 px-4 text-slate-400">{formatDate(exp.date)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-rose-300">{exp.expenseNumber}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{exp.supplierName}</td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{exp.description}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {exp.paymentMethod} • <span className="text-slate-200">{exp.transactionReference}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                        -{formatCurrency(exp.amount, exp.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Suivi des Créances & Balance Âgée */}
      {activeTab === 'receivables' && (
        <div className="space-y-6">
          
          {/* Aging Buckets */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 font-semibold block mb-1">Total Créances Non Soldées</span>
              <div className="text-xl font-black font-mono text-rose-400">
                {formatCurrency(outstanding, selectedCurrency)}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Règlement en attente</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-emerald-400 font-semibold block mb-1">Non Échues (&lt; 30 jours)</span>
              <div className="text-xl font-black font-mono text-emerald-400">
                {formatCurrency(currentNotDue, selectedCurrency)}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Échéances respectées</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-amber-400 font-semibold block mb-1">Retard 1 à 30 jours</span>
              <div className="text-xl font-black font-mono text-amber-400">
                {formatCurrency(overdue30, selectedCurrency)}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Relance de niveau 1</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-rose-400 font-semibold block mb-1">Retard Critique (&gt; 30 jours)</span>
              <div className="text-xl font-black font-mono text-rose-400">
                {formatCurrency(overdue60, selectedCurrency)}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Mise en demeure OHADA</span>
            </div>
          </div>

          {/* Detailed Customer Receivables Aging Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Balance Âgée Individuelle par Facture Client
              </span>
              <span className="text-[11px] text-slate-400">
                {filteredReceivables.length} créance(s) active(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              {filteredReceivables.length === 0 ? (
                <div className="text-center py-16 text-emerald-400 text-xs">
                  ✅ Aucune créance en souffrance ! Tous les clients sont à jour de règlement en {selectedCurrency}.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4 font-semibold">Client Débiteur</th>
                      <th className="py-3 px-4 font-semibold">N° Facture</th>
                      <th className="py-3 px-4 font-semibold">Date d'Échéance</th>
                      <th className="py-3 px-4 text-center font-semibold">Jours de Retard</th>
                      <th className="py-3 px-4 text-right font-semibold">Montant Dû</th>
                      <th className="py-3 px-4 text-center font-semibold">Statut Recouvrement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredReceivables.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-850/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-200">{c.customerName}</td>
                        <td className="py-3 px-4 font-mono font-bold text-indigo-300">{c.invoiceNumber}</td>
                        <td className="py-3 px-4 text-slate-400">{formatDate(c.dueDate)}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold">
                          {c.daysOverdue > 0 ? (
                            <span className="text-rose-400">+{c.daysOverdue} j</span>
                          ) : (
                            <span className="text-emerald-400">{Math.abs(c.daysOverdue)} j restant(s)</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-rose-400">
                          {formatCurrency(c.remainingBalance, c.currency)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {c.daysOverdue > 30 ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                              Contentieux
                            </span>
                          ) : c.daysOverdue > 0 ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                              Relance
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                              En cours
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ADD EXPENSE MODAL */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-rose-400" />
                  <span>Enregistrer une Dépense d'Exploitation</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inscription au journal des achats/charges conformément au plan comptable SYSCOHADA.
                </p>
              </div>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {expenseError && (
              <div className="bg-rose-950/60 border border-rose-800 rounded-lg p-2.5 text-xs text-rose-300 mb-3">
                {expenseError}
              </div>
            )}

            <form onSubmit={handleCreateExpense} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Date de la Charge *</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Catégorie Comptable *</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  >
                    <option value="HEBERGEMENT_CLOUD">Serveurs Cloud & Hébergement</option>
                    <option value="COMMUNICATION_INTERNET">Télécom & Connexion Internet</option>
                    <option value="LOYER_LOCAUX">Loyer & Charges Locatives</option>
                    <option value="MATERIEL_INFORMATIQUE">Matériel & Équipements</option>
                    <option value="HONORAIRES_PRESTATION">Honoraires & Sous-traitance</option>
                    <option value="TAXES_ET_IMPOTS">Impôts, Taxes & Droits DGI</option>
                    <option value="AUTRES_CHARGES">Autres Charges d'Exploitation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Fournisseur / Bénéficiaire *</label>
                <input
                  type="text"
                  placeholder="Ex: OVHcloud, Google Cloud, MTN Bénin, SBEE..."
                  value={expenseSupplier}
                  onChange={(e) => setExpenseSupplier(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description Détaillée de la Dépense *</label>
                <input
                  type="text"
                  placeholder="Ex: Abonnement mensuel cluster bases de données Cotonou"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Montant Décaissé *</label>
                  <input
                    type="number"
                    min="1"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Devise *</label>
                  <select
                    value={expenseCurrency}
                    onChange={(e) => setExpenseCurrency(e.target.value as CurrencyCode)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  >
                    <option value="XOF">XOF (FCFA)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Mode de Règlement *</label>
                  <select
                    value={expenseMethod}
                    onChange={(e) => setExpenseMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  >
                    <option value="BANK_TRANSFER">Virement Bancaire</option>
                    <option value="MTN_MOMO">MTN Mobile Money Bénin</option>
                    <option value="MOOV_MONEY">Moov Money Flooz</option>
                    <option value="CREDIT_CARD">Carte Bancaire Visa / Master</option>
                    <option value="CASH">Caisse Espèces</option>
                    <option value="CHEQUE">Chèque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Réf. Paiement ou Justificatif *</label>
                  <input
                    type="text"
                    placeholder="Ex: FACT-FOURN-8812 ou MOMO-DEB-091"
                    value={expenseRef}
                    onChange={(e) => setExpenseRef(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingExpense}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-950/40 flex items-center"
                >
                  {isSubmittingExpense ? 'Enregistrement...' : 'Enregistrer la Dépense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
