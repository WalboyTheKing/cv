/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CurrencyCode = 'XOF' | 'EUR' | 'USD';

export type InvoiceStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | 'REFUNDED';

export type PaymentMethod = 
  | 'MTN_MOMO'
  | 'MOOV_MONEY'
  | 'BANK_TRANSFER'
  | 'CREDIT_CARD'
  | 'CASH'
  | 'CRYPTOCURRENCY'
  | 'CHEQUE';

export type UserRole = 'ADMIN' | 'BILLING_OFFICER' | 'AUDITOR';

export interface UserSession {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  token: string;
}

export interface BusinessProfile {
  officialBusinessName: string;
  commercialName: string;
  legalStructure: string; // e.g. "SARL", "SAS", "SUARL", "Entreprise Individuelle"
  rccmNumber: string; // e.g. "RB/COT/23 B 12345"
  isRccmVerified: boolean;
  ifuNumber: string; // 13-digit IFU tax ID
  isIfuVerified: boolean;
  taxRegime: string; // e.g. "Régime du Réel Normal (TVA 18%)", "Régime Synthétique / TPS", "Régime Réel Simplifié"
  ownerFullName: string; // Titulaire / Représentant légal
  ownerTitle: string; // Gérant, Titulaire exploitant, Directeur Général
  registeredAddress: string; // Legal registered address (Siège social)
  operatingAddress: string; // Actual operating address (Bureaux/Locaux)
  ownerResidentialAddress?: string; // Strictly separate, never conflated with business address
  country: string; // Benin
  city: string; // Cotonou, Porto-Novo, Parakou, etc.
  postalCode?: string;
  email: string;
  phone: string;
  website: string;
  logoUrl?: string;
  activityDescription: string;
  primaryCurrency: CurrencyCode;
  supportedCurrencies: CurrencyCode[];
  authorizedSignatoryName: string;
  authorizedSignatoryTitle: string;
  defaultTaxRate: number; // e.g., 18 for 18% TVA, or 0
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    ibanRib?: string;
    swiftBic?: string;
    momoNumber?: string;
    moovNumber?: string;
  };
}

export interface ServiceCatalogItem {
  id: string;
  title: string;
  category: string;
  description: string;
  unitPriceXOF: number;
  unitPriceEUR: number;
  unitPriceUSD: number;
}

export interface Customer {
  id: string;
  fullName: string;
  companyName?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  ifuNumber?: string; // Optional client tax ID (B2B)
  customerType: 'INDIVIDUAL' | 'BUSINESS';
  createdAt: string;
  notes?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PaymentEvidence {
  paymentMethod: PaymentMethod;
  transactionReference: string; // Telecom MoMo ref or Bank wire ref
  paymentDate: string; // ISO date-time
  amountPaid: number;
  currency: CurrencyCode;
  notes?: string;
  recordedBy: string; // Staff username
  evidenceFileRef?: string;
}

export interface RefundRecord {
  id: string;
  refundNumber: string; // e.g. AVOIR-2026-0001
  invoiceId: string;
  invoiceNumber: string;
  amountRefunded: number;
  currency: CurrencyCode;
  refundDate: string; // ISO
  reason: string;
  transactionReference: string;
  paymentMethod: PaymentMethod;
  recordedBy: string;
  receiptId?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g., INV-2026-0001
  issueDate: string; // YYYY-MM-DD
  deliveryDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  customerId: string;
  customerSnapshot: {
    fullName: string;
    companyName?: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    ifuNumber?: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  remainingBalance: number;
  currency: CurrencyCode;
  status: InvoiceStatus;
  notes?: string;
  terms?: string;
  payments: PaymentEvidence[];
  receiptIds: string[]; // Linked receipts
  refunds?: RefundRecord[];
  verificationToken: string; // Secure token for public verification
  documentHash: string; // SHA-256 cryptographic hash of contents
  createdAt: string;
  updatedAt: string;
  cancellationReason?: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string; // e.g., REC-2026-0001
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerSnapshot: {
    fullName: string;
    companyName?: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  serviceDescriptionSummary: string;
  amountReceived: number;
  currency: CurrencyCode;
  paymentMethod: PaymentMethod;
  paymentDateTime: string; // ISO string
  transactionReference: string; // Non-negotiable evidence ref
  remainingInvoiceBalance: number;
  authorizedSignatory: string;
  authorizedTitle: string;
  verificationToken: string; // Public verification token
  documentHash: string; // SHA-256 fingerprint
  createdAt: string;
  notes?: string;
}

export type ExpenseCategory =
  | 'HEBERGEMENT_CLOUD'
  | 'COMMUNICATION_INTERNET'
  | 'LOYER_LOCAUX'
  | 'MATERIEL_INFORMATIQUE'
  | 'HONORAIRES_PRESTATION'
  | 'TAXES_ET_IMPOTS'
  | 'AUTRES_CHARGES';

export interface Expense {
  id: string;
  expenseNumber: string; // e.g. DEP-2026-0001
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  description: string;
  supplierName: string;
  amount: number;
  currency: CurrencyCode;
  paymentMethod: PaymentMethod;
  transactionReference: string;
  receiptFileRef?: string;
  recordedBy: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entityType: 'INVOICE' | 'RECEIPT' | 'CUSTOMER' | 'PROFILE' | 'PAYMENT' | 'BACKUP' | 'SECURITY' | 'EXPENSE' | 'REFUND';
  entityId: string;
  details: string;
  previousStateHash?: string;
  currentStateHash: string;
  ipAddress?: string;
}

export interface PublicVerificationResult {
  isValid: boolean;
  isRevoked: boolean;
  documentType: 'INVOICE' | 'RECEIPT' | 'CREDIT_NOTE';
  documentNumber: string;
  issueDate: string;
  businessName: string;
  commercialName: string;
  legalStructure: string;
  rccmNumber?: string;
  ifuNumber?: string;
  registeredCity: string;
  country: string;
  currency: CurrencyCode;
  totalAmountOrReceived: number;
  paymentStatus: InvoiceStatus | 'PAID';
  transactionReference?: string;
  paymentMethod?: string;
  verificationTimestamp: string;
  digitalFingerprint: string;
  clientMaskedName: string;
}

export interface DerivComplianceItem {
  id: string;
  category: 'BUSINESS_IDENTITY' | 'TAX_REGISTRATION' | 'PROOF_OF_COMMERCIAL_ADDRESS' | 'TRANSACTION_LEGITIMACY';
  title: string;
  description: string;
  isCompliant: boolean;
  details: string;
  officialRequirementNote: string;
}

export interface AccountingJournals {
  salesJournal: Array<{
    invoiceNumber: string;
    issueDate: string;
    deliveryDate: string;
    customerName: string;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    totalAmount: number;
    amountPaid: number;
    remainingBalance: number;
    currency: CurrencyCode;
    status: InvoiceStatus;
  }>;
  receiptsJournal: Array<{
    receiptNumber: string;
    paymentDateTime: string;
    invoiceNumber: string;
    customerName: string;
    paymentMethod: PaymentMethod;
    transactionReference: string;
    amountReceived: number;
    currency: CurrencyCode;
    bankOrAccount: string;
    operator: string;
  }>;
  expensesJournal: Expense[];
  receivablesAging: Array<{
    invoiceNumber: string;
    customerName: string;
    issueDate: string;
    dueDate: string;
    totalAmount: number;
    amountPaid: number;
    remainingBalance: number;
    currency: CurrencyCode;
    daysOverdue: number;
    agingBucket: 'NOT_DUE' | '0_30_DAYS' | '31_60_DAYS' | 'OVER_60_DAYS';
  }>;
  reconciliationSummary: {
    matchedTransactions: number;
    pendingReconciliation: number;
    totalInflowsXOF: number;
    totalOutflowsXOF: number;
    netCashPositionXOF: number;
  };
}
