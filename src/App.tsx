/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { InvoicesView } from './components/InvoicesView.tsx';
import { ReceiptsView } from './components/ReceiptsView.tsx';
import { CustomersView } from './components/CustomersView.tsx';
import { VerificationView } from './components/VerificationView.tsx';
import { DerivComplianceView } from './components/DerivComplianceView.tsx';
import { AuditLogsView } from './components/AuditLogsView.tsx';
import { AccountingView } from './components/AccountingView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { DocumentPrintModal } from './components/DocumentPrintModal.tsx';
import { LoginModal } from './components/LoginModal.tsx';

import {
  BusinessProfile,
  Customer,
  Invoice,
  Receipt,
  AuditLog,
  CurrencyCode,
  UserSession,
} from './types.ts';
import { api, getStoredSession, saveSession } from './lib/api.ts';

export default function App() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [session, setSession] = useState<UserSession | null>(getStoredSession());
  const [stats, setStats] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [integrity, setIntegrity] = useState<{ isCompromised: boolean; totalLogs: number; brokenAtId?: string }>({
    isCompromised: false,
    totalLogs: 0,
  });

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('XOF');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [verifyInitialToken, setVerifyInitialToken] = useState<string>('');

  // Active document for modal view/print
  const [activePrintDoc, setActivePrintDoc] = useState<{
    type: 'INVOICE' | 'RECEIPT';
    invoice?: Invoice;
    receipt?: Receipt;
  } | null>(null);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  // Load all data
  const refreshData = useCallback(async () => {
    try {
      const [profData, statsData, invData, recData, custData, auditData] = await Promise.all([
        api.getProfile(),
        api.getStats(),
        api.getInvoices(),
        api.getReceipts(),
        api.getCustomers(),
        api.getAuditLogs(),
      ]);
      setProfile(profData);
      setStats(statsData);
      setInvoices(invData);
      setReceipts(recData);
      setCustomers(custData);
      setAuditLogs(auditData.logs);
      setIntegrity(auditData.integrity);
      if (profData?.primaryCurrency) {
        setSelectedCurrency(profData.primaryCurrency);
      }
    } catch (err) {
      console.error('Error loading enterprise data:', err);
    }
  }, []);

  // Check URL params for ?verify=... on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const verifyParam = params.get('verify');
      if (verifyParam) {
        setVerifyInitialToken(verifyParam);
        setCurrentTab('verify');
      }
    }
    refreshData();
  }, [refreshData]);

  // Auth handlers
  const handleLoginSuccess = (userSession: UserSession) => {
    saveSession(userSession);
    setSession(userSession);
    setIsLoginModalOpen(false);
    refreshData();
  };

  const handleLogout = () => {
    saveSession(null);
    setSession(null);
  };

  // Document Viewers
  const handleViewInvoice = (inv: Invoice) => {
    setActivePrintDoc({ type: 'INVOICE', invoice: inv });
  };

  const handleViewReceipt = (rec: Receipt) => {
    setActivePrintDoc({ type: 'RECEIPT', receipt: rec });
  };

  // Verify navigation
  const handleNavigateToVerify = (token: string) => {
    setVerifyInitialToken(token);
    setCurrentTab('verify');
    if (activePrintDoc) setActivePrintDoc(null);
  };

  // Actions
  const handleCreateInvoice = async (data: any) => {
    try {
      const inv = await api.createInvoice(data);
      await refreshData();
      showToast(`Facture ${inv.invoiceNumber} enregistrée avec succès !`);
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la création de la facture.', 'error');
      throw err;
    }
  };

  const handleRecordPayment = async (invoiceId: string, evidence: any) => {
    try {
      const res = await api.recordPayment(invoiceId, evidence);
      await refreshData();
      showToast(`Paiement enregistré ! Quittance ${res.receipt?.receiptNumber} émise.`);
      // Open receipt print preview automatically
      if (res.receipt) {
        setActivePrintDoc({ type: 'RECEIPT', receipt: res.receipt });
      }
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de l\'encaissement.', 'error');
      throw err;
    }
  };

  const handleCancelInvoice = async (invoiceId: string, reason: string) => {
    try {
      await api.cancelInvoice(invoiceId, reason);
      await refreshData();
      showToast('Facture annulée et enregistrée dans le journal d\'audit.');
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de l\'annulation.', 'error');
      throw err;
    }
  };

  const handleRefundInvoice = async (invoiceId: string, refundData: any) => {
    try {
      const res = await api.refundInvoice(invoiceId, refundData);
      await refreshData();
      showToast(`Remboursement enregistré ! Note d'avoir ${res.refundRecord?.refundNumber || ''} émise.`);
    } catch (err: any) {
      showToast(err.message || 'Erreur lors du remboursement.', 'error');
      throw err;
    }
  };

  const handleCreateCustomer = async (data: Partial<Customer>) => {
    try {
      const cust = await api.createCustomer(data);
      await refreshData();
      showToast(`Fiche client "${cust.fullName}" créée avec succès !`);
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la création du client.', 'error');
      throw err;
    }
  };

  const handleUpdateCustomer = async (id: string, data: Partial<Customer>) => {
    try {
      const cust = await api.updateCustomer(id, data);
      await refreshData();
      showToast(`Fiche client "${cust.fullName}" mise à jour !`);
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la mise à jour du client.', 'error');
      throw err;
    }
  };

  const handleUpdateProfile = async (updated: Partial<BusinessProfile>) => {
    try {
      const newProfile = await api.updateProfile(updated);
      setProfile(newProfile);
      await refreshData();
      showToast('Profil et coordonnées d\'entreprise enregistrés avec succès !');
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la mise à jour du profil.', 'error');
      throw err;
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="font-semibold text-sm tracking-wide">Initialisation du Registre Comptable & Fiscal (Bénin)...</span>
      </div>
    );
  }

  const unpaidCount = invoices.filter(
    (i) => i.status === 'UNPAID' || i.status === 'PARTIALLY_PAID'
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        profile={profile}
        session={session}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onNavigate={setCurrentTab}
        selectedCurrency={selectedCurrency}
        onCurrencyChange={setSelectedCurrency}
      />

      <div className="flex">
        
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          unpaidCount={unpaidCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto overflow-x-hidden">
          {currentTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              profile={profile}
              selectedCurrency={selectedCurrency}
              onNavigate={setCurrentTab}
              onViewInvoice={handleViewInvoice}
              onViewReceipt={handleViewReceipt}
              onCreateInvoice={() => setCurrentTab('invoices')}
            />
          )}

          {currentTab === 'invoices' && (
            <InvoicesView
              invoices={invoices}
              customers={customers}
              defaultCurrency={selectedCurrency}
              defaultTaxRate={profile.defaultTaxRate}
              onCreateInvoice={handleCreateInvoice}
              onRecordPayment={handleRecordPayment}
              onRefundInvoice={handleRefundInvoice}
              onCancelInvoice={handleCancelInvoice}
              onViewInvoice={handleViewInvoice}
            />
          )}

          {currentTab === 'receipts' && (
            <ReceiptsView
              receipts={receipts}
              onViewReceipt={handleViewReceipt}
              onVerifyReceipt={handleNavigateToVerify}
            />
          )}

          {currentTab === 'accounting' && (
            <AccountingView onRefreshAll={refreshData} />
          )}

          {currentTab === 'customers' && (
            <CustomersView
              customers={customers}
              invoices={invoices}
              receipts={receipts}
              profile={profile}
              onCreateCustomer={handleCreateCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onViewInvoice={handleViewInvoice}
              onViewReceipt={handleViewReceipt}
            />
          )}

          {currentTab === 'verify' && (
            <VerificationView initialToken={verifyInitialToken} />
          )}

          {currentTab === 'deriv' && (
            <DerivComplianceView
              profile={profile}
              invoices={invoices}
              receipts={receipts}
              customers={customers}
              onViewInvoice={handleViewInvoice}
              onViewReceipt={handleViewReceipt}
            />
          )}

          {currentTab === 'audit' && (
            <AuditLogsView
              logs={auditLogs}
              integrity={integrity}
              onRefresh={refreshData}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              onTriggerBackup={refreshData}
            />
          )}
        </main>

      </div>

      {/* Document View & Print Modal */}
      {activePrintDoc && (
        <DocumentPrintModal
          documentType={activePrintDoc.type}
          invoice={activePrintDoc.invoice}
          receipt={activePrintDoc.receipt}
          profile={profile}
          onClose={() => setActivePrintDoc(null)}
          onNavigateToVerify={handleNavigateToVerify}
        />
      )}

      {/* Login Modal */}
      {isLoginModalOpen && (
        <LoginModal
          onSuccess={handleLoginSuccess}
          onClose={() => setIsLoginModalOpen(false)}
        />
      )}

      {/* Floating System Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold animate-fade-in backdrop-blur-md bg-slate-900/95"
          style={{
            borderColor: toast.type === 'success' ? '#10b981' : '#f43f5e',
            color: toast.type === 'success' ? '#34d399' : '#fb7185',
          }}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-slate-100">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white ml-2 p-0.5 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}
