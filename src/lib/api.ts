/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BusinessProfile,
  Customer,
  Invoice,
  Receipt,
  AuditLog,
  PaymentEvidence,
  PublicVerificationResult,
  UserSession,
} from '../types.ts';

const TOKEN_KEY = 'bizdocs_session';

export function getStoredSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: UserSession | null) {
  if (session) {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const session = getStoredSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (session?.token) {
    headers['Authorization'] = `Bearer ${session.token}`;
    headers['x-actor'] = session.username;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `Erreur ${res.status}: ${res.statusText}`;
    try {
      const body = await res.json();
      if (body.error) errorMsg = body.error;
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Auth
  login: async (username: string, password: string): Promise<{ session: UserSession }> => {
    return request<{ session: UserSession }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  // Stats
  getStats: async () => {
    return request<{
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
    }>('/api/stats');
  },

  // Profile
  getProfile: async (): Promise<BusinessProfile> => {
    return request<BusinessProfile>('/api/profile');
  },
  updateProfile: async (data: Partial<BusinessProfile>): Promise<BusinessProfile> => {
    return request<BusinessProfile>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Customers
  getCustomers: async (): Promise<Customer[]> => {
    return request<Customer[]>('/api/customers');
  },
  createCustomer: async (data: Partial<Customer>): Promise<Customer> => {
    return request<Customer>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateCustomer: async (id: string, data: Partial<Customer>): Promise<Customer> => {
    return request<Customer>(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Invoices
  getInvoices: async (): Promise<Invoice[]> => {
    return request<Invoice[]>('/api/invoices');
  },
  getInvoice: async (id: string): Promise<Invoice> => {
    return request<Invoice>(`/api/invoices/${id}`);
  },
  createInvoice: async (data: {
    customerId: string;
    issueDate: string;
    deliveryDate: string;
    dueDate: string;
    items: Array<{ description: string; quantity: number; unitPrice: number }>;
    currency: 'XOF' | 'EUR' | 'USD';
    taxRate: number;
    notes?: string;
    terms?: string;
  }): Promise<Invoice> => {
    return request<Invoice>('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  recordPayment: async (
    invoiceId: string,
    evidence: {
      paymentMethod: PaymentEvidence['paymentMethod'];
      transactionReference: string;
      paymentDate: string;
      amountPaid: number;
      currency: 'XOF' | 'EUR' | 'USD';
      notes?: string;
    }
  ): Promise<{ invoice: Invoice; receipt: Receipt }> => {
    return request<{ invoice: Invoice; receipt: Receipt }>(`/api/invoices/${invoiceId}/payment`, {
      method: 'POST',
      body: JSON.stringify(evidence),
    });
  },
  cancelInvoice: async (invoiceId: string, reason: string): Promise<Invoice> => {
    return request<Invoice>(`/api/invoices/${invoiceId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
  refundInvoice: async (
    invoiceId: string,
    data: {
      amountRefunded: number;
      reason: string;
      transactionReference: string;
      paymentMethod: PaymentEvidence['paymentMethod'];
      refundDate?: string;
    }
  ): Promise<{ invoice: Invoice; refundRecord: any }> => {
    return request<{ invoice: Invoice; refundRecord: any }>(`/api/invoices/${invoiceId}/refund`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Service Catalog
  getCatalog: async (): Promise<any[]> => {
    return request<any[]>('/api/catalog');
  },

  // Expenses
  getExpenses: async (): Promise<any[]> => {
    return request<any[]>('/api/expenses');
  },
  createExpense: async (data: any): Promise<any> => {
    return request<any>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Accounting & Financial Journals
  getAccountingJournals: async (): Promise<any> => {
    return request<any>('/api/accounting');
  },

  // Receipts
  getReceipts: async (): Promise<Receipt[]> => {
    return request<Receipt[]>('/api/receipts');
  },
  getReceipt: async (id: string): Promise<Receipt> => {
    return request<Receipt>(`/api/receipts/${id}`);
  },

  // Public Verification
  verifyDocument: async (identifier: string): Promise<PublicVerificationResult> => {
    return request<PublicVerificationResult>(`/api/verify/${encodeURIComponent(identifier)}`);
  },

  // Audit Logs
  getAuditLogs: async (): Promise<{ logs: AuditLog[]; integrity: { isCompromised: boolean; totalLogs: number; brokenAtId?: string } }> => {
    return request<{ logs: AuditLog[]; integrity: { isCompromised: boolean; totalLogs: number; brokenAtId?: string } }>('/api/audit-logs');
  },

  createBackup: async (): Promise<{ success: boolean; filePath: string }> => {
    return request<{ success: boolean; filePath: string }>('/api/backups/create', {
      method: 'POST',
    });
  },
  getBackups: async (): Promise<Array<{ filename: string; size: number; createdAt: string }>> => {
    return request<Array<{ filename: string; size: number; createdAt: string }>>('/api/backups');
  },
  restoreBackup: async (backupData: any): Promise<{ success: boolean; message: string }> => {
    return request<{ success: boolean; message: string }>('/api/backups/restore', {
      method: 'POST',
      body: JSON.stringify({ backupData }),
    });
  },
};
