/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbManager } from './src/server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Request logging for security and diagnostics
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API ${req.method}] ${req.path}`);
  }
  next();
});

// Simple auth middleware helper
const getActor = (req: express.Request): string => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token.includes('user-admin')) return 'admin';
    if (token.includes('user-billing')) return 'comptable';
    if (token.includes('user-auditor')) return 'auditeur';
  }
  return (req.headers['x-actor'] as string) || 'admin';
};

// --- AUTH ---
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Identifiant et mot de passe requis.' });
    }
    const session = dbManager.authenticate(username, password);
    if (!session) {
      return res.status(401).json({ error: 'Identifiants invalides. Vérifiez votre nom d\'utilisateur ou mot de passe.' });
    }
    return res.json({ session });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// --- STATS & DASHBOARD ---
app.get('/api/stats', (req, res) => {
  try {
    const invoices = dbManager.getInvoices();
    const receipts = dbManager.getReceipts();
    const customers = dbManager.getCustomers();

    // Group revenues by currency
    const totalRevenueByCurrency: Record<string, number> = { XOF: 0, EUR: 0, USD: 0 };
    const outstandingByCurrency: Record<string, number> = { XOF: 0, EUR: 0, USD: 0 };

    invoices.forEach(inv => {
      if (inv.status !== 'CANCELLED') {
        const curr = inv.currency || 'XOF';
        if (!totalRevenueByCurrency[curr]) totalRevenueByCurrency[curr] = 0;
        if (!outstandingByCurrency[curr]) outstandingByCurrency[curr] = 0;

        totalRevenueByCurrency[curr] += inv.amountPaid;
        outstandingByCurrency[curr] += inv.remainingBalance;
      }
    });

    const invoiceCounts = {
      total: invoices.length,
      paid: invoices.filter(i => i.status === 'PAID').length,
      partiallyPaid: invoices.filter(i => i.status === 'PARTIALLY_PAID').length,
      unpaid: invoices.filter(i => i.status === 'UNPAID').length,
      cancelled: invoices.filter(i => i.status === 'CANCELLED').length,
    };

    const recentReceipts = receipts.slice(-5).reverse();
    const recentInvoices = invoices.slice(-5).reverse();

    return res.json({
      totalRevenueByCurrency,
      outstandingByCurrency,
      invoiceCounts,
      totalReceipts: receipts.length,
      totalCustomers: customers.length,
      recentReceipts,
      recentInvoices,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// --- PROFILE ---
app.get('/api/profile', (req, res) => {
  try {
    const profile = dbManager.getProfile();
    return res.json(profile);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/profile', (req, res) => {
  try {
    const actor = getActor(req);
    const updated = dbManager.updateProfile(req.body, actor);
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// --- CUSTOMERS ---
app.get('/api/customers', (req, res) => {
  try {
    const list = dbManager.getCustomers();
    return res.json(list);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', (req, res) => {
  try {
    const actor = getActor(req);
    const { fullName, email, phone, address, city, country, companyName, ifuNumber, customerType, notes } = req.body;
    if (!fullName || !phone || !address) {
      return res.status(400).json({ error: 'Le nom complet, le téléphone et l\'adresse légitime sont obligatoires.' });
    }
    const customer = dbManager.createCustomer(
      {
        fullName,
        email: email || '',
        phone,
        address,
        city: city || 'Cotonou',
        country: country || 'Bénin',
        companyName,
        ifuNumber,
        customerType: customerType || 'BUSINESS',
        notes,
      },
      actor
    );
    return res.json(customer);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/customers/:id', (req, res) => {
  try {
    const actor = getActor(req);
    const customer = dbManager.updateCustomer(req.params.id, req.body, actor);
    return res.json(customer);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// --- INVOICES ---
app.get('/api/invoices', (req, res) => {
  try {
    const list = dbManager.getInvoices();
    return res.json(list);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/invoices/:id', (req, res) => {
  try {
    const inv = dbManager.getInvoiceById(req.params.id);
    if (!inv) return res.status(404).json({ error: 'Facture introuvable' });
    return res.json(inv);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices', (req, res) => {
  try {
    const actor = getActor(req);
    const { customerId, issueDate, deliveryDate, dueDate, items, currency, taxRate, notes, terms } = req.body;
    if (!customerId || !issueDate || !deliveryDate || !dueDate || !items || !items.length) {
      return res.status(400).json({ error: 'Veuillez renseigner le client, les dates et au moins une prestation de service réelle.' });
    }
    const invoice = dbManager.createInvoice(
      {
        customerId,
        issueDate,
        deliveryDate,
        dueDate,
        items,
        currency: currency || 'XOF',
        taxRate: Number(taxRate) >= 0 ? Number(taxRate) : 18,
        notes,
        terms,
      },
      actor
    );
    return res.json(invoice);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Payment recording with strict evidence validation (Receipt issuance)
app.post('/api/invoices/:id/payment', (req, res) => {
  try {
    const actor = getActor(req);
    const { paymentMethod, transactionReference, paymentDate, amountPaid, currency, notes } = req.body;

    if (!paymentMethod || !transactionReference || !amountPaid) {
      return res.status(400).json({
        error: 'Preuve de paiement obligatoire : Mode de règlement, référence de transaction (MoMo / Virement) et montant requis.',
      });
    }

    const result = dbManager.recordPayment(
      req.params.id,
      {
        paymentMethod,
        transactionReference: transactionReference.trim(),
        paymentDate: paymentDate || new Date().toISOString(),
        amountPaid: Number(amountPaid),
        currency: currency || 'XOF',
        notes,
      },
      actor
    );

    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

app.post('/api/invoices/:id/cancel', (req, res) => {
  try {
    const actor = getActor(req);
    const { reason } = req.body;
    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ error: 'Un motif légitime d\'annulation est obligatoire.' });
    }
    const invoice = dbManager.cancelInvoice(req.params.id, reason, actor);
    return res.json(invoice);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Refund / Credit Note issuance
app.post('/api/invoices/:id/refund', (req, res) => {
  try {
    const actor = getActor(req);
    const { amountRefunded, reason, transactionReference, paymentMethod, refundDate } = req.body;
    const result = dbManager.refundInvoice(
      req.params.id,
      {
        amountRefunded: Number(amountRefunded),
        reason,
        transactionReference,
        paymentMethod: paymentMethod || 'BANK_TRANSFER',
        refundDate,
      },
      actor
    );
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// --- SERVICE CATALOG ---
app.get('/api/catalog', (req, res) => {
  try {
    const catalog = dbManager.getServiceCatalog();
    return res.json(catalog);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// --- EXPENSES JOURNAL ---
app.get('/api/expenses', (req, res) => {
  try {
    const list = dbManager.getExpenses();
    return res.json(list);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', (req, res) => {
  try {
    const actor = getActor(req);
    const { date, category, description, supplierName, amount, currency, paymentMethod, transactionReference, receiptFileRef } = req.body;
    const newExp = dbManager.createExpense(
      {
        date: date || new Date().toISOString().split('T')[0],
        category,
        description,
        supplierName,
        amount: Number(amount),
        currency: currency || 'XOF',
        paymentMethod: paymentMethod || 'BANK_TRANSFER',
        transactionReference,
        receiptFileRef,
      },
      actor
    );
    return res.json(newExp);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// --- COMPTABILITÉ & JOURNAUX ---
app.get('/api/accounting', (req, res) => {
  try {
    const journals = dbManager.getAccountingJournals();
    return res.json(journals);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// --- RECEIPTS ---
app.get('/api/receipts', (req, res) => {
  try {
    const list = dbManager.getReceipts();
    return res.json(list);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/receipts/:id', (req, res) => {
  try {
    const rec = dbManager.getReceiptById(req.params.id);
    if (!rec) return res.status(404).json({ error: 'Reçu introuvable' });
    return res.json(rec);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// --- PUBLIC DOCUMENT VERIFICATION ---
// Endpoint accessible without login; strictly protects customer sensitive data
app.get('/api/verify/:identifier', (req, res) => {
  try {
    const result = dbManager.verifyDocument(req.params.identifier);
    if (!result) {
      return res.status(404).json({
        isValid: false,
        error: 'Document introuvable ou référence de vérification inexistante dans le registre officiel.',
      });
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// --- AUDIT LOGS ---
app.get('/api/audit-logs', (req, res) => {
  try {
    const logs = dbManager.getAuditLogs();
    const integrity = dbManager.verifyAuditLogIntegrity();
    return res.json({ logs, integrity });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/backups/create', (req, res) => {
  try {
    const filePath = dbManager.createBackup();
    return res.json({ success: true, filePath: path.basename(filePath) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/backups', (req, res) => {
  try {
    const list = dbManager.listBackups();
    return res.json(list);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/backups/download/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.resolve(process.cwd(), 'data/backups', filename);
    if (!filePath.startsWith(path.resolve(process.cwd(), 'data/backups'))) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    return res.download(filePath, filename);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/backups/export', (req, res) => {
  try {
    const raw = dbManager.getRawDatabase();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="benin-bizdocs-export-${Date.now()}.json"`);
    return res.send(JSON.stringify(raw, null, 2));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/backups/restore', (req, res) => {
  try {
    const actor = getActor(req);
    const { backupData } = req.body;
    dbManager.restoreRawDatabase(backupData, actor);
    return res.json({ success: true, message: 'Base de données restaurée avec succès.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// --- FRONTEND INTEGRATION (Vite in Dev, Dist in Prod) ---
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Benin BizDocs Enterprise] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
