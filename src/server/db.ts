/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  BusinessProfile,
  Customer,
  Invoice,
  Receipt,
  AuditLog,
  PaymentEvidence,
  PublicVerificationResult,
  UserSession,
  Expense,
  ServiceCatalogItem,
  RefundRecord,
  AccountingJournals,
  PaymentMethod,
} from '../types.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const BACKUPS_DIR = path.resolve(DATA_DIR, 'backups');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

interface DatabaseSchema {
  version: number;
  businessProfile: BusinessProfile;
  serviceCatalog: ServiceCatalogItem[];
  customers: Customer[];
  invoices: Invoice[];
  receipts: Receipt[];
  expenses: Expense[];
  auditLogs: AuditLog[];
  sequentialCounters: {
    invoiceYear: number;
    invoiceSeq: number;
    receiptYear: number;
    receiptSeq: number;
    expenseYear: number;
    expenseSeq: number;
    refundYear: number;
    refundSeq: number;
  };
  users: Array<{
    id: string;
    username: string;
    passwordHash: string;
    name: string;
    role: 'ADMIN' | 'BILLING_OFFICER' | 'AUDITOR';
  }>;
}

// Compute SHA-256 hash of object or string
export function computeHash(data: unknown): string {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(str).digest('hex');
}

// Mask customer name safely for public verification (e.g., "John Doe" -> "J*** D***")
export function maskName(fullName: string): string {
  if (!fullName) return '***';
  const parts = fullName.trim().split(/\s+/);
  return parts
    .map(p => (p.length > 1 ? p[0] + '*'.repeat(Math.min(3, p.length - 1)) : p))
    .join(' ');
}

// Generate secure verification token
export function generateVerificationToken(prefix: string): string {
  const randomPart = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${randomPart}`;
}

const DEFAULT_PROFILE: BusinessProfile = {
  officialBusinessName: 'AFRIQ DIGITAL SOLUTIONS SARL',
  commercialName: 'AFRIQ DIGITAL TECHNOLOGIES',
  legalStructure: 'Société à Responsabilité Limitée (SARL)',
  rccmNumber: 'RB/COT/23 B 38942',
  isRccmVerified: true,
  ifuNumber: '3202314569801',
  isIfuVerified: true,
  taxRegime: 'Régime du Réel Normal (TVA 18%)',
  ownerFullName: 'Sabi K. Issa',
  ownerTitle: 'Directeur Général & Gérant Associé',
  registeredAddress: 'Lot 1425, Immeuble Le Phare, Quartier Haie Vive, Cotonou',
  operatingAddress: 'Bureau 302, 3ème Étage, Zone Commerciale Ganhi, Cotonou',
  ownerResidentialAddress: '', // strictly empty by default, kept separate
  country: 'Bénin',
  city: 'Cotonou',
  postalCode: 'BP 1204',
  email: 'contact@afriqdigital.bj',
  phone: '+229 21 30 45 88',
  website: 'https://afriqdigital.bj',
  activityDescription: 'Services Numériques, Ingénierie Logicielle, Hébergement Cloud, Conseil en Systèmes d\'Information',
  primaryCurrency: 'XOF',
  supportedCurrencies: ['XOF', 'EUR', 'USD'],
  authorizedSignatoryName: 'Sabi K. Issa',
  authorizedSignatoryTitle: 'Directeur Général & Gérant',
  defaultTaxRate: 18,
  bankDetails: {
    bankName: 'Ecobank Bénin S.A.',
    accountName: 'AFRIQ DIGITAL SOLUTIONS SARL',
    accountNumber: '001012345678901',
    ibanRib: 'BJ061 01001 001012345678 90',
    swiftBic: 'ECOCBJBJ',
    momoNumber: '+229 97 00 11 22 (MTN MoMo Marchand: 554210)',
    moovNumber: '+229 95 33 44 55 (Moov Money Pro: 887211)',
  },
};

const DEFAULT_CATALOG: ServiceCatalogItem[] = [
  {
    id: 'srv-1',
    title: 'Développement d\'Application Web & API Sécurisée',
    category: 'Ingénierie Logicielle',
    description: 'Conception, développement full-stack, tests et mise en production de plateforme web d\'entreprise.',
    unitPriceXOF: 1200000,
    unitPriceEUR: 1850,
    unitPriceUSD: 2000,
  },
  {
    id: 'srv-2',
    title: 'Audit & Sécurisation des Systèmes d\'Information',
    category: 'Cybersécurité',
    description: 'Audit d\'architecture réseau, tests d\'intrusion, durcissement serveur et conformité des données.',
    unitPriceXOF: 850000,
    unitPriceEUR: 1300,
    unitPriceUSD: 1400,
  },
  {
    id: 'srv-3',
    title: 'Intégration Passerelle de Paiement MoMo & Carte Bancaire',
    category: 'Fintech & Paiement',
    description: 'Interfaçage API direct MTN Mobile Money Bénin, Moov Money et passerelle carte Visa/Mastercard.',
    unitPriceXOF: 450000,
    unitPriceEUR: 700,
    unitPriceUSD: 750,
  },
  {
    id: 'srv-4',
    title: 'Déploiement Cloud & DevOps (Docker, CI/CD, SSL)',
    category: 'Cloud & Infrastructure',
    description: 'Configuration serveurs cloud dédiés, conteneurisation, certificats de sécurité et pipelines CI/CD.',
    unitPriceXOF: 600000,
    unitPriceEUR: 920,
    unitPriceUSD: 1000,
  },
  {
    id: 'srv-5',
    title: 'Contrat Mensuel de Maintenance & Support Technique',
    category: 'Support & Infogérance',
    description: 'Supervision 24/7, sauvegardes quotidiennes chiffrées, mises à jour correctives et assistance prioritaire.',
    unitPriceXOF: 250000,
    unitPriceEUR: 380,
    unitPriceUSD: 420,
  },
  {
    id: 'srv-6',
    title: 'Conseil & Accompagnement à la Transformation Numérique',
    category: 'Conseil & Stratégie',
    description: 'Élaboration de schéma directeur des systèmes d\'information et accompagnement à la digitalisation.',
    unitPriceXOF: 500000,
    unitPriceEUR: 760,
    unitPriceUSD: 850,
  },
];

const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    expenseNumber: 'DEP-2026-0001',
    date: '2026-02-05',
    category: 'HEBERGEMENT_CLOUD',
    description: 'Souscription serveurs Cloud VPS dédiés & CDN sécurisé',
    supplierName: 'OVHcloud SAS',
    amount: 175000,
    currency: 'XOF',
    paymentMethod: 'CREDIT_CARD',
    transactionReference: 'CARTE-VISA-OVH-882190',
    recordedBy: 'comptable',
    createdAt: '2026-02-05T10:00:00Z',
  },
  {
    id: 'exp-2',
    expenseNumber: 'DEP-2026-0002',
    date: '2026-02-08',
    category: 'COMMUNICATION_INTERNET',
    description: 'Ligne Fibre Optique Professionnelle haut débit Cotonou Ganhi',
    supplierName: 'Bénin Télécoms Services (SBIN)',
    amount: 85000,
    currency: 'XOF',
    paymentMethod: 'MTN_MOMO',
    transactionReference: 'MOMO-SBIN-BJ-900213',
    recordedBy: 'comptable',
    createdAt: '2026-02-08T14:30:00Z',
  },
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    fullName: 'Amina Adebayo',
    companyName: 'Adebayo Consulting Services',
    email: 'amina.adebayo@adebayoconsulting.com',
    phone: '+229 97 45 67 89',
    address: 'Carrefour Club des Rois, Cadjèhoun, Cotonou',
    city: 'Cotonou',
    country: 'Bénin',
    ifuNumber: '1202209876543',
    customerType: 'BUSINESS',
    createdAt: '2026-01-15T09:00:00Z',
    notes: 'Long-term corporate client for enterprise portal maintenance.',
  },
  {
    id: 'cust-2',
    fullName: 'Marcelle Hounhouenou',
    companyName: 'Novéa Logistics & Freight',
    email: 'm.hounhouenou@novealog.bj',
    phone: '+229 96 12 34 56',
    address: 'Avenue Jean-Paul II, Zone Portuaire, Cotonou',
    city: 'Cotonou',
    country: 'Bénin',
    ifuNumber: '2202105432198',
    customerType: 'BUSINESS',
    createdAt: '2026-02-01T10:30:00Z',
    notes: 'Fleet GPS tracking and backend API client.',
  },
  {
    id: 'cust-3',
    fullName: 'Jean-Luc Dossou',
    email: 'jl.dossou@gmail.com',
    phone: '+229 95 88 77 66',
    address: 'Quartier Fidjrossè Calvaire, Cotonou',
    city: 'Cotonou',
    country: 'Bénin',
    customerType: 'INDIVIDUAL',
    createdAt: '2026-02-20T14:15:00Z',
    notes: 'Individual professional web development client.',
  },
];

class DatabaseManager {
  private db: DatabaseSchema;
  private lastAuditHash: string = 'GENESIS_HASH_BENIN_BIZDOCS_00000000';

  constructor() {
    this.ensureDirs();
    this.db = this.loadDatabase();
    if (this.db.auditLogs.length > 0) {
      this.lastAuditHash = this.db.auditLogs[this.db.auditLogs.length - 1].currentStateHash;
    }
  }

  private ensureDirs() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        
        // Ensure new schema fields exist if upgrading
        if (!parsed.serviceCatalog || parsed.serviceCatalog.length === 0) {
          parsed.serviceCatalog = DEFAULT_CATALOG;
        }
        if (!parsed.expenses) {
          parsed.expenses = INITIAL_EXPENSES;
        }
        if (!parsed.sequentialCounters.expenseSeq) {
          parsed.sequentialCounters.expenseYear = 2026;
          parsed.sequentialCounters.expenseSeq = parsed.expenses.length;
        }
        if (!parsed.sequentialCounters.refundSeq) {
          parsed.sequentialCounters.refundYear = 2026;
          parsed.sequentialCounters.refundSeq = 0;
        }
        if (!parsed.businessProfile.taxRegime) {
          parsed.businessProfile.taxRegime = DEFAULT_PROFILE.taxRegime;
        }
        if (!parsed.businessProfile.ownerFullName) {
          parsed.businessProfile.ownerFullName = DEFAULT_PROFILE.ownerFullName;
        }
        if (!parsed.businessProfile.ownerTitle) {
          parsed.businessProfile.ownerTitle = DEFAULT_PROFILE.ownerTitle;
        }

        return parsed;
      } catch (err) {
        console.error('Error reading database file, loading default schema:', err);
      }
    }

    // Default Seed Data
    const initialDb: DatabaseSchema = {
      version: 2,
      businessProfile: DEFAULT_PROFILE,
      serviceCatalog: DEFAULT_CATALOG,
      customers: INITIAL_CUSTOMERS,
      invoices: [],
      receipts: [],
      expenses: INITIAL_EXPENSES,
      auditLogs: [],
      sequentialCounters: {
        invoiceYear: 2026,
        invoiceSeq: 0,
        receiptYear: 2026,
        receiptSeq: 0,
        expenseYear: 2026,
        expenseSeq: INITIAL_EXPENSES.length,
        refundYear: 2026,
        refundSeq: 0,
      },
      users: [
        {
          id: 'user-admin',
          username: 'admin',
          passwordHash: computeHash('AdminPass2026!'),
          name: 'Directeur Général',
          role: 'ADMIN',
        },
        {
          id: 'user-billing',
          username: 'comptable',
          passwordHash: computeHash('Compta2026!'),
          name: 'Responsable Facturation',
          role: 'BILLING_OFFICER',
        },
        {
          id: 'user-auditor',
          username: 'auditeur',
          passwordHash: computeHash('Audit2026!'),
          name: 'Commissaire aux Comptes',
          role: 'AUDITOR',
        },
      ],
    };

    // Seed realistic first legitimate invoice and receipt
    this.seedInitialDocuments(initialDb);
    this.saveToFile(initialDb);
    return initialDb;
  }

  private seedInitialDocuments(db: DatabaseSchema) {
    const cust = db.customers[0];
    const year = 2026;
    db.sequentialCounters.invoiceSeq = 1;
    const invNum = `INV-${year}-0001`;
    const invToken = generateVerificationToken('INV');
    const invDate = '2026-02-10';

    const items = [
      {
        id: 'item-1',
        description: 'Audit et Sécurisation de l\'Architecture Cloud Hybride',
        quantity: 1,
        unitPrice: 850000,
        total: 850000,
      },
      {
        id: 'item-2',
        description: 'Déploiement API Passerelle de Paiement MoMo & Carte',
        quantity: 1,
        unitPrice: 400000,
        total: 400000,
      },
    ];

    const subtotal = 1250000;
    const taxRate = 18;
    const taxAmount = 225000;
    const totalAmount = 1475000;
    const amountPaid = 1475000;
    const remainingBalance = 0;

    const paymentEvidence: PaymentEvidence = {
      paymentMethod: 'BANK_TRANSFER',
      transactionReference: 'VIR-ECOB-BJ-20260212-99824',
      paymentDate: '2026-02-12T11:42:00Z',
      amountPaid: 1475000,
      currency: 'XOF',
      notes: 'Virement bancaire Ecobank reçu et rapproché sur le compte commercial.',
      recordedBy: 'comptable',
    };

    db.sequentialCounters.receiptSeq = 1;
    const recNum = `REC-${year}-0001`;
    const recToken = generateVerificationToken('REC');

    const invoice: Invoice = {
      id: 'inv-1',
      invoiceNumber: invNum,
      issueDate: invDate,
      deliveryDate: '2026-02-11',
      dueDate: '2026-02-25',
      customerId: cust.id,
      customerSnapshot: {
        fullName: cust.fullName,
        companyName: cust.companyName,
        email: cust.email,
        phone: cust.phone,
        address: cust.address,
        city: cust.city,
        country: cust.country,
        ifuNumber: cust.ifuNumber,
      },
      items,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      amountPaid,
      remainingBalance,
      currency: 'XOF',
      status: 'PAID',
      notes: 'Prestation livrée conformément au cahier des charges et validée.',
      terms: 'Paiement à 15 jours. Pénalités de retard applicables selon la réglementation OHADA.',
      payments: [paymentEvidence],
      receiptIds: ['rec-1'],
      refunds: [],
      verificationToken: invToken,
      documentHash: computeHash({ invNum, totalAmount, custId: cust.id, invDate }),
      createdAt: '2026-02-10T08:30:00Z',
      updatedAt: '2026-02-12T11:45:00Z',
    };

    const receipt: Receipt = {
      id: 'rec-1',
      receiptNumber: recNum,
      invoiceId: invoice.id,
      invoiceNumber: invNum,
      customerId: cust.id,
      customerSnapshot: {
        fullName: cust.fullName,
        companyName: cust.companyName,
        email: cust.email,
        phone: cust.phone,
        address: cust.address,
        city: cust.city,
        country: cust.country,
      },
      serviceDescriptionSummary: 'Audit et Sécurisation Cloud & Déploiement API Passerelle',
      amountReceived: 1475000,
      currency: 'XOF',
      paymentMethod: 'BANK_TRANSFER',
      paymentDateTime: paymentEvidence.paymentDate,
      transactionReference: paymentEvidence.transactionReference,
      remainingInvoiceBalance: 0,
      authorizedSignatory: DEFAULT_PROFILE.authorizedSignatoryName,
      authorizedTitle: DEFAULT_PROFILE.authorizedSignatoryTitle,
      verificationToken: recToken,
      documentHash: computeHash({ recNum, invNum, amountReceived: 1475000, ref: paymentEvidence.transactionReference }),
      createdAt: '2026-02-12T11:45:00Z',
      notes: 'Paiement complet vérifié et quittance officielle délivrée.',
    };

    db.invoices.push(invoice);
    db.receipts.push(receipt);

    // Initial audit log
    const logHash = computeHash({ action: 'INITIAL_GENESIS', time: '2026-02-10T08:30:00Z' });
    db.auditLogs.push({
      id: 'log-1',
      timestamp: '2026-02-10T08:30:00Z',
      actor: 'SYSTEM_GENESIS',
      action: 'SYSTEM_INITIALIZED',
      entityType: 'SECURITY',
      entityId: 'SYS',
      details: 'Initialisation sécurisée du registre comptable et fiscal pour AFRIQ DIGITAL SOLUTIONS SARL (Bénin).',
      previousStateHash: '0000000000000000000000000000000000000000000000000000000000000000',
      currentStateHash: logHash,
    });
  }

  private saveToFile(db: DatabaseSchema) {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  public appendAuditLog(
    actor: string,
    action: string,
    entityType: AuditLog['entityType'],
    entityId: string,
    details: string,
    ipAddress?: string
  ) {
    const prevHash = this.lastAuditHash;
    const timestamp = new Date().toISOString();
    const currentHash = computeHash({
      prevHash,
      timestamp,
      actor,
      action,
      entityType,
      entityId,
      details,
    });

    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      actor,
      action,
      entityType,
      entityId,
      details,
      previousStateHash: prevHash,
      currentStateHash: currentHash,
      ipAddress,
    };

    this.db.auditLogs.push(newLog);
    this.lastAuditHash = currentHash;
    this.saveToFile(this.db);
  }

  // Backups
  public createBackup(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.resolve(BACKUPS_DIR, `backup-${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(this.db, null, 2), 'utf-8');
    this.appendAuditLog('SYSTEM', 'DATABASE_BACKUP_CREATED', 'BACKUP', timestamp, `Automated system backup created: backup-${timestamp}.json`);
    return backupFile;
  }

  public listBackups(): Array<{ filename: string; size: number; createdAt: string }> {
    if (!fs.existsSync(BACKUPS_DIR)) return [];
    const files = fs.readdirSync(BACKUPS_DIR);
    return files
      .filter(f => f.endsWith('.json'))
      .map(filename => {
        const stat = fs.statSync(path.resolve(BACKUPS_DIR, filename));
        return {
          filename,
          size: stat.size,
          createdAt: stat.mtime.toISOString(),
        };
      })
      .reverse();
  }

  // Business Profile
  public getProfile(): BusinessProfile {
    return this.db.businessProfile;
  }

  public updateProfile(updated: Partial<BusinessProfile>, actor: string): BusinessProfile {
    this.db.businessProfile = {
      ...this.db.businessProfile,
      ...updated,
      country: 'Bénin',
    };
    this.appendAuditLog(actor, 'UPDATE_BUSINESS_PROFILE', 'PROFILE', 'PROFILE', 'Updated commercial and legal business profile settings.');
    this.saveToFile(this.db);
    return this.db.businessProfile;
  }

  // Service Catalog
  public getServiceCatalog(): ServiceCatalogItem[] {
    return this.db.serviceCatalog || DEFAULT_CATALOG;
  }

  // Customers
  public getCustomers(): Customer[] {
    return this.db.customers;
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.db.customers.find(c => c.id === id);
  }

  public createCustomer(data: Omit<Customer, 'id' | 'createdAt'>, actor: string): Customer {
    const newCustomer: Customer = {
      ...data,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.db.customers.push(newCustomer);
    this.appendAuditLog(actor, 'CREATE_CUSTOMER', 'CUSTOMER', newCustomer.id, `Created customer record for "${newCustomer.fullName}".`);
    this.saveToFile(this.db);
    return newCustomer;
  }

  public updateCustomer(id: string, updates: Partial<Customer>, actor: string): Customer {
    const idx = this.db.customers.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Customer not found');
    this.db.customers[idx] = { ...this.db.customers[idx], ...updates };
    this.appendAuditLog(actor, 'UPDATE_CUSTOMER', 'CUSTOMER', id, `Updated customer profile for "${this.db.customers[idx].fullName}".`);
    this.saveToFile(this.db);
    return this.db.customers[idx];
  }

  // Invoices
  public getInvoices(): Invoice[] {
    return this.db.invoices;
  }

  public getInvoiceById(id: string): Invoice | undefined {
    return this.db.invoices.find(inv => inv.id === id);
  }

  public getInvoiceByNumber(invoiceNumber: string): Invoice | undefined {
    return this.db.invoices.find(inv => inv.invoiceNumber.toLowerCase() === invoiceNumber.toLowerCase());
  }

  public getInvoiceByToken(token: string): Invoice | undefined {
    return this.db.invoices.find(inv => inv.verificationToken === token);
  }

  public createInvoice(
    data: {
      customerId: string;
      issueDate: string;
      deliveryDate: string;
      dueDate: string;
      items: Array<{ description: string; quantity: number; unitPrice: number }>;
      currency: 'XOF' | 'EUR' | 'USD';
      taxRate: number;
      notes?: string;
      terms?: string;
    },
    actor: string
  ): Invoice {
    const customer = this.getCustomerById(data.customerId);
    if (!customer) throw new Error('Customer not found');

    const year = new Date(data.issueDate).getFullYear() || new Date().getFullYear();
    if (this.db.sequentialCounters.invoiceYear !== year) {
      this.db.sequentialCounters.invoiceYear = year;
      this.db.sequentialCounters.invoiceSeq = 0;
    }
    this.db.sequentialCounters.invoiceSeq += 1;
    const seqStr = String(this.db.sequentialCounters.invoiceSeq).padStart(4, '0');
    const invoiceNumber = `INV-${year}-${seqStr}`;

    const items = data.items.map((it, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      description: it.description,
      quantity: Number(it.quantity) || 1,
      unitPrice: Number(it.unitPrice) || 0,
      total: (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0),
    }));

    const subtotal = items.reduce((acc, curr) => acc + curr.total, 0);
    const taxRate = Number(data.taxRate) >= 0 ? Number(data.taxRate) : 0;
    const taxAmount = Math.round((subtotal * taxRate) / 100);
    const totalAmount = subtotal + taxAmount;

    const verificationToken = generateVerificationToken('INV');
    const documentHash = computeHash({
      invoiceNumber,
      customerId: customer.id,
      totalAmount,
      currency: data.currency,
      issueDate: data.issueDate,
      items,
    });

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      issueDate: data.issueDate,
      deliveryDate: data.deliveryDate,
      dueDate: data.dueDate,
      customerId: customer.id,
      customerSnapshot: {
        fullName: customer.fullName,
        companyName: customer.companyName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        country: customer.country,
        ifuNumber: customer.ifuNumber,
      },
      items,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      amountPaid: 0,
      remainingBalance: totalAmount,
      currency: data.currency,
      status: 'UNPAID',
      notes: data.notes || '',
      terms: data.terms || 'Paiement à 30 jours net. Pénalités de retard au taux légal en vigueur en République du Bénin.',
      payments: [],
      receiptIds: [],
      refunds: [],
      verificationToken,
      documentHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.db.invoices.push(newInvoice);
    this.appendAuditLog(
      actor,
      'CREATE_INVOICE',
      'INVOICE',
      newInvoice.id,
      `Issued sequential invoice ${newInvoice.invoiceNumber} to ${customer.fullName} for ${totalAmount} ${data.currency}.`
    );
    this.saveToFile(this.db);
    return newInvoice;
  }

  // Payment Recording & Receipt Generation
  public recordPayment(
    invoiceId: string,
    evidence: {
      paymentMethod: PaymentEvidence['paymentMethod'];
      transactionReference: string;
      paymentDate: string;
      amountPaid: number;
      currency: 'XOF' | 'EUR' | 'USD';
      notes?: string;
    },
    actor: string
  ): { invoice: Invoice; receipt: Receipt } {
    const invoice = this.getInvoiceById(invoiceId);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'CANCELLED') throw new Error('Cannot record payment on a cancelled invoice');
    if (invoice.status === 'PAID') throw new Error('Invoice is already fully paid');

    if (!evidence.transactionReference || evidence.transactionReference.trim().length < 4) {
      throw new Error('Mandatory payment evidence missing: A valid telecom or bank transaction reference is required.');
    }
    if (!evidence.amountPaid || evidence.amountPaid <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }
    if (evidence.amountPaid > invoice.remainingBalance + 0.01) {
      throw new Error(`Amount paid (${evidence.amountPaid}) exceeds remaining invoice balance (${invoice.remainingBalance}).`);
    }

    const recordedPayment: PaymentEvidence = {
      ...evidence,
      recordedBy: actor,
    };

    invoice.payments.push(recordedPayment);
    invoice.amountPaid += evidence.amountPaid;
    invoice.remainingBalance = Math.max(0, invoice.totalAmount - invoice.amountPaid);

    if (invoice.remainingBalance <= 0) {
      invoice.status = 'PAID';
    } else {
      invoice.status = 'PARTIALLY_PAID';
    }
    invoice.updatedAt = new Date().toISOString();

    const currentYear = new Date(evidence.paymentDate).getFullYear() || new Date().getFullYear();
    if (this.db.sequentialCounters.receiptYear !== currentYear) {
      this.db.sequentialCounters.receiptYear = currentYear;
      this.db.sequentialCounters.receiptSeq = 0;
    }
    this.db.sequentialCounters.receiptSeq += 1;
    const seqReceiptStr = String(this.db.sequentialCounters.receiptSeq).padStart(4, '0');
    const receiptNumber = `REC-${currentYear}-${seqReceiptStr}`;

    const receiptToken = generateVerificationToken('REC');
    const receiptDocHash = computeHash({
      receiptNumber,
      invoiceNumber: invoice.invoiceNumber,
      amountReceived: evidence.amountPaid,
      currency: evidence.currency,
      transactionReference: evidence.transactionReference,
      paymentDate: evidence.paymentDate,
    });

    const serviceSummary = invoice.items.map(it => it.description).slice(0, 2).join('; ') + (invoice.items.length > 2 ? '...' : '');

    const newReceipt: Receipt = {
      id: `rec-${Date.now()}`,
      receiptNumber,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerSnapshot: { ...invoice.customerSnapshot },
      serviceDescriptionSummary: serviceSummary,
      amountReceived: evidence.amountPaid,
      currency: evidence.currency,
      paymentMethod: evidence.paymentMethod,
      paymentDateTime: evidence.paymentDate,
      transactionReference: evidence.transactionReference,
      remainingInvoiceBalance: invoice.remainingBalance,
      authorizedSignatory: this.db.businessProfile.authorizedSignatoryName,
      authorizedTitle: this.db.businessProfile.authorizedSignatoryTitle,
      verificationToken: receiptToken,
      documentHash: receiptDocHash,
      createdAt: new Date().toISOString(),
      notes: evidence.notes || 'Quittance de paiement officielle délivrée suite à encaissement effectif.',
    };

    invoice.receiptIds.push(newReceipt.id);
    this.db.receipts.push(newReceipt);

    this.appendAuditLog(
      actor,
      'PAYMENT_RECORDED_AND_RECEIPT_ISSUED',
      'PAYMENT',
      newReceipt.id,
      `Verified payment of ${evidence.amountPaid} ${evidence.currency} for invoice ${invoice.invoiceNumber}. Ref: ${evidence.transactionReference}. Official receipt ${receiptNumber} generated.`
    );

    this.saveToFile(this.db);
    return { invoice, receipt: newReceipt };
  }

  // Refunds & Credit Notes (Avoirs)
  public refundInvoice(
    invoiceId: string,
    data: {
      amountRefunded: number;
      reason: string;
      transactionReference: string;
      paymentMethod: PaymentMethod;
      refundDate?: string;
    },
    actor: string
  ): { invoice: Invoice; refundRecord: RefundRecord } {
    const invoice = this.getInvoiceById(invoiceId);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.amountPaid <= 0) {
      throw new Error('Cannot issue a refund on an invoice with no recorded payments.');
    }
    if (!data.amountRefunded || data.amountRefunded <= 0) {
      throw new Error('Refund amount must be greater than zero.');
    }
    if (data.amountRefunded > invoice.amountPaid + 0.01) {
      throw new Error(`Refund amount (${data.amountRefunded}) exceeds total paid amount (${invoice.amountPaid}).`);
    }
    if (!data.reason || data.reason.trim().length < 5) {
      throw new Error('A legitimate reason is required for any commercial refund / credit note.');
    }
    if (!data.transactionReference || data.transactionReference.trim().length < 4) {
      throw new Error('A valid bank transfer or MoMo refund reference is required as transaction evidence.');
    }

    const currentYear = new Date().getFullYear();
    if (this.db.sequentialCounters.refundYear !== currentYear) {
      this.db.sequentialCounters.refundYear = currentYear;
      this.db.sequentialCounters.refundSeq = 0;
    }
    this.db.sequentialCounters.refundSeq += 1;
    const seqStr = String(this.db.sequentialCounters.refundSeq).padStart(4, '0');
    const refundNumber = `AVOIR-${currentYear}-${seqStr}`;

    const refundRecord: RefundRecord = {
      id: `ref-${Date.now()}`,
      refundNumber,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amountRefunded: data.amountRefunded,
      currency: invoice.currency,
      refundDate: data.refundDate || new Date().toISOString(),
      reason: data.reason,
      transactionReference: data.transactionReference.trim(),
      paymentMethod: data.paymentMethod,
      recordedBy: actor,
    };

    if (!invoice.refunds) invoice.refunds = [];
    invoice.refunds.push(refundRecord);

    invoice.amountPaid = Math.max(0, invoice.amountPaid - data.amountRefunded);
    invoice.remainingBalance = Math.max(0, invoice.totalAmount - invoice.amountPaid);

    if (invoice.amountPaid === 0) {
      invoice.status = 'REFUNDED';
    } else {
      invoice.status = 'PARTIALLY_PAID';
    }
    invoice.updatedAt = new Date().toISOString();

    this.appendAuditLog(
      actor,
      'INVOICE_REFUND_ISSUED',
      'REFUND',
      refundRecord.id,
      `Credit note ${refundNumber} issued for invoice ${invoice.invoiceNumber}. Amount: ${data.amountRefunded} ${invoice.currency}. Reason: ${data.reason}`
    );

    this.saveToFile(this.db);
    return { invoice, refundRecord };
  }

  // Cancel invoice
  public cancelInvoice(invoiceId: string, reason: string, actor: string): Invoice {
    const invoice = this.getInvoiceById(invoiceId);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.payments.length > 0) {
      throw new Error('Cannot cancel an invoice with verified payments. Issue a refund / credit note instead.');
    }
    if (!reason || reason.trim().length < 5) {
      throw new Error('A legitimate reason is required to cancel an invoice.');
    }

    invoice.status = 'CANCELLED';
    invoice.cancellationReason = reason;
    invoice.updatedAt = new Date().toISOString();

    this.appendAuditLog(actor, 'CANCEL_INVOICE', 'INVOICE', invoice.id, `Invoice ${invoice.invoiceNumber} cancelled. Reason: ${reason}`);
    this.saveToFile(this.db);
    return invoice;
  }

  // Receipts
  public getReceipts(): Receipt[] {
    return this.db.receipts;
  }

  public getReceiptById(id: string): Receipt | undefined {
    return this.db.receipts.find(r => r.id === id);
  }

  public getReceiptByNumber(receiptNumber: string): Receipt | undefined {
    return this.db.receipts.find(r => r.receiptNumber.toLowerCase() === receiptNumber.toLowerCase());
  }

  public getReceiptByToken(token: string): Receipt | undefined {
    return this.db.receipts.find(r => r.verificationToken === token);
  }

  // Expenses Journal
  public getExpenses(): Expense[] {
    return this.db.expenses || [];
  }

  public createExpense(
    data: {
      date: string;
      category: Expense['category'];
      description: string;
      supplierName: string;
      amount: number;
      currency: 'XOF' | 'EUR' | 'USD';
      paymentMethod: PaymentMethod;
      transactionReference: string;
      receiptFileRef?: string;
    },
    actor: string
  ): Expense {
    if (!data.description || !data.amount || !data.supplierName) {
      throw new Error('Description, fournisseur et montant sont obligatoires pour toute dépense.');
    }
    if (!data.transactionReference || data.transactionReference.trim().length < 3) {
      throw new Error('Une référence de paiement réelle est exigée pour la justification comptable.');
    }

    const currentYear = new Date(data.date).getFullYear() || new Date().getFullYear();
    if (this.db.sequentialCounters.expenseYear !== currentYear) {
      this.db.sequentialCounters.expenseYear = currentYear;
      this.db.sequentialCounters.expenseSeq = 0;
    }
    this.db.sequentialCounters.expenseSeq += 1;
    const seqStr = String(this.db.sequentialCounters.expenseSeq).padStart(4, '0');
    const expenseNumber = `DEP-${currentYear}-${seqStr}`;

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      expenseNumber,
      date: data.date,
      category: data.category,
      description: data.description,
      supplierName: data.supplierName,
      amount: Number(data.amount),
      currency: data.currency || 'XOF',
      paymentMethod: data.paymentMethod,
      transactionReference: data.transactionReference.trim(),
      receiptFileRef: data.receiptFileRef,
      recordedBy: actor,
      createdAt: new Date().toISOString(),
    };

    if (!this.db.expenses) this.db.expenses = [];
    this.db.expenses.push(newExpense);

    this.appendAuditLog(
      actor,
      'CREATE_EXPENSE',
      'EXPENSE',
      newExpense.id,
      `Recorded operating expense ${expenseNumber}: ${data.description} (${data.amount} ${data.currency}) to ${data.supplierName}.`
    );

    this.saveToFile(this.db);
    return newExpense;
  }

  // Accounting Journals & Reconciliation Report
  public getAccountingJournals(): AccountingJournals {
    const invoices = this.getInvoices();
    const receipts = this.getReceipts();
    const expenses = this.getExpenses();

    // 1. Sales Journal (Chronological, valid commercial sales)
    const salesJournal = invoices
      .filter(i => i.status !== 'CANCELLED')
      .map(inv => ({
        invoiceNumber: inv.invoiceNumber,
        issueDate: inv.issueDate,
        deliveryDate: inv.deliveryDate,
        customerName: inv.customerSnapshot.companyName || inv.customerSnapshot.fullName,
        subtotal: inv.subtotal,
        taxRate: inv.taxRate,
        taxAmount: inv.taxAmount,
        totalAmount: inv.totalAmount,
        amountPaid: inv.amountPaid,
        remainingBalance: inv.remainingBalance,
        currency: inv.currency,
        status: inv.status,
      }))
      .sort((a, b) => b.issueDate.localeCompare(a.issueDate));

    // 2. Receipts Journal (Cash Inflows)
    const receiptsJournal = receipts
      .map(rec => ({
        receiptNumber: rec.receiptNumber,
        paymentDateTime: rec.paymentDateTime,
        invoiceNumber: rec.invoiceNumber,
        customerName: rec.customerSnapshot.companyName || rec.customerSnapshot.fullName,
        paymentMethod: rec.paymentMethod,
        transactionReference: rec.transactionReference,
        amountReceived: rec.amountReceived,
        currency: rec.currency,
        bankOrAccount: rec.paymentMethod === 'BANK_TRANSFER' ? 'Ecobank Bénin S.A.' : rec.paymentMethod === 'MTN_MOMO' ? 'MTN MoMo Marchand' : rec.paymentMethod === 'MOOV_MONEY' ? 'Moov Money Flooz' : 'Caisse / Compte',
        operator: rec.authorizedSignatory,
      }))
      .sort((a, b) => b.paymentDateTime.localeCompare(a.paymentDateTime));

    // 3. Receivables Aging
    const today = new Date().toISOString().split('T')[0];
    const receivablesAging = invoices
      .filter(i => i.status !== 'CANCELLED' && i.status !== 'PAID' && i.remainingBalance > 0)
      .map(inv => {
        const diffMs = new Date(today).getTime() - new Date(inv.dueDate).getTime();
        const daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        let agingBucket: 'NOT_DUE' | '0_30_DAYS' | '31_60_DAYS' | 'OVER_60_DAYS' = 'NOT_DUE';
        if (daysOverdue > 60) agingBucket = 'OVER_60_DAYS';
        else if (daysOverdue > 30) agingBucket = '31_60_DAYS';
        else if (daysOverdue > 0) agingBucket = '0_30_DAYS';

        return {
          invoiceNumber: inv.invoiceNumber,
          customerName: inv.customerSnapshot.companyName || inv.customerSnapshot.fullName,
          issueDate: inv.issueDate,
          dueDate: inv.dueDate,
          totalAmount: inv.totalAmount,
          amountPaid: inv.amountPaid,
          remainingBalance: inv.remainingBalance,
          currency: inv.currency,
          daysOverdue,
          agingBucket,
        };
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue);

    // Summary calculations
    const totalInflowsXOF = receipts
      .filter(r => r.currency === 'XOF')
      .reduce((sum, r) => sum + r.amountReceived, 0);

    const totalOutflowsXOF = expenses
      .filter(e => e.currency === 'XOF')
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      salesJournal,
      receiptsJournal,
      expensesJournal: expenses.slice().reverse(),
      receivablesAging,
      reconciliationSummary: {
        matchedTransactions: receipts.length + expenses.length,
        pendingReconciliation: invoices.filter(i => i.status === 'PARTIALLY_PAID' || i.status === 'UNPAID').length,
        totalInflowsXOF,
        totalOutflowsXOF,
        netCashPositionXOF: totalInflowsXOF - totalOutflowsXOF,
      },
    };
  }

  // Public Verification Mechanism
  public verifyDocument(identifier: string): PublicVerificationResult | null {
    if (!identifier) return null;
    const cleanId = identifier.trim();

    // Check by token or by document number
    const invoice =
      this.getInvoiceByToken(cleanId) ||
      this.getInvoiceByNumber(cleanId) ||
      this.db.invoices.find(i => i.id === cleanId);

    if (invoice) {
      const isRevoked = invoice.status === 'CANCELLED';
      return {
        isValid: !isRevoked,
        isRevoked,
        documentType: 'INVOICE',
        documentNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate,
        businessName: this.db.businessProfile.officialBusinessName,
        commercialName: this.db.businessProfile.commercialName,
        legalStructure: this.db.businessProfile.legalStructure,
        rccmNumber: this.db.businessProfile.isRccmVerified ? this.db.businessProfile.rccmNumber : undefined,
        ifuNumber: this.db.businessProfile.isIfuVerified ? this.db.businessProfile.ifuNumber : undefined,
        registeredCity: this.db.businessProfile.city,
        country: this.db.businessProfile.country,
        currency: invoice.currency,
        totalAmountOrReceived: invoice.totalAmount,
        paymentStatus: invoice.status,
        verificationTimestamp: new Date().toISOString(),
        digitalFingerprint: invoice.documentHash,
        clientMaskedName: maskName(invoice.customerSnapshot.companyName || invoice.customerSnapshot.fullName),
      };
    }

    const receipt =
      this.getReceiptByToken(cleanId) ||
      this.getReceiptByNumber(cleanId) ||
      this.db.receipts.find(r => r.id === cleanId);

    if (receipt) {
      const parentInvoice = this.getInvoiceById(receipt.invoiceId);
      const isRevoked = parentInvoice?.status === 'CANCELLED';
      return {
        isValid: !isRevoked,
        isRevoked: Boolean(isRevoked),
        documentType: 'RECEIPT',
        documentNumber: receipt.receiptNumber,
        issueDate: receipt.paymentDateTime.split('T')[0],
        businessName: this.db.businessProfile.officialBusinessName,
        commercialName: this.db.businessProfile.commercialName,
        legalStructure: this.db.businessProfile.legalStructure,
        rccmNumber: this.db.businessProfile.isRccmVerified ? this.db.businessProfile.rccmNumber : undefined,
        ifuNumber: this.db.businessProfile.isIfuVerified ? this.db.businessProfile.ifuNumber : undefined,
        registeredCity: this.db.businessProfile.city,
        country: this.db.businessProfile.country,
        currency: receipt.currency,
        totalAmountOrReceived: receipt.amountReceived,
        paymentStatus: 'PAID',
        transactionReference: receipt.transactionReference,
        paymentMethod: receipt.paymentMethod,
        verificationTimestamp: new Date().toISOString(),
        digitalFingerprint: receipt.documentHash,
        clientMaskedName: maskName(receipt.customerSnapshot.companyName || receipt.customerSnapshot.fullName),
      };
    }

    return null;
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    return [...this.db.auditLogs].reverse();
  }

  public verifyAuditLogIntegrity(): { isCompromised: boolean; totalLogs: number; brokenAtId?: string } {
    let expectedHash = '0000000000000000000000000000000000000000000000000000000000000000';
    for (let i = 0; i < this.db.auditLogs.length; i++) {
      const log = this.db.auditLogs[i];
      if (i > 0 && log.previousStateHash !== expectedHash) {
        return { isCompromised: true, totalLogs: this.db.auditLogs.length, brokenAtId: log.id };
      }
      expectedHash = log.currentStateHash;
    }
    return { isCompromised: false, totalLogs: this.db.auditLogs.length };
  }

  // Auth
  public authenticate(username: string, pass: string): UserSession | null {
    const user = this.db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) return null;
    if (user.passwordHash !== computeHash(pass)) return null;

    const token = `biztok_${user.id}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    this.appendAuditLog(user.username, 'USER_LOGIN', 'SECURITY', user.id, `User ${user.username} logged in with role ${user.role}.`);
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      token,
    };
  }

  // Database snapshot export
  public getRawDatabase(): DatabaseSchema {
    return this.db;
  }

  public restoreRawDatabase(imported: DatabaseSchema, actor: string) {
    if (!imported.businessProfile || !Array.isArray(imported.invoices)) {
      throw new Error('Invalid database backup structure');
    }
    this.createBackup();
    this.db = imported;
    this.appendAuditLog(actor, 'DATABASE_RESTORED', 'BACKUP', 'RESTORE', 'Database restored from uploaded backup payload.');
    this.saveToFile(this.db);
  }
}

export const dbManager = new DatabaseManager();
