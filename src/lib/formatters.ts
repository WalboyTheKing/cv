/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import QRCode from 'qrcode';
import { CurrencyCode, InvoiceStatus, PaymentMethod } from '../types.ts';
export { numberToWordsFrench } from './numberToWords.ts';

export function formatCurrency(amount: number, currency: CurrencyCode = 'XOF'): string {
  const num = Number(amount) || 0;
  if (currency === 'XOF') {
    return new Intl.NumberFormat('fr-BJ', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0,
    }).format(num).replace('CFA', 'FCFA');
  } else if (currency === 'EUR') {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(num);
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  }
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function getPaymentMethodLabel(method: PaymentMethod): { label: string; iconName: string; detail: string } {
  switch (method) {
    case 'MTN_MOMO':
      return { label: 'MTN Mobile Money Bénin', iconName: 'Smartphone', detail: 'Paiement mobile instantané' };
    case 'MOOV_MONEY':
      return { label: 'Moov Money Flooz Bénin', iconName: 'Smartphone', detail: 'Paiement mobile sécurisé' };
    case 'BANK_TRANSFER':
      return { label: 'Virement Bancaire (UEMOA / Interbancaire)', iconName: 'Building2', detail: 'Compensation bancaire' };
    case 'CREDIT_CARD':
      return { label: 'Carte Bancaire (Visa / Mastercard)', iconName: 'CreditCard', detail: 'Règlement par carte' };
    case 'CRYPTOCURRENCY':
      return { label: 'Crypto-Actif (USDT / USDC)', iconName: 'Coins', detail: 'Règlement On-Chain vérifié' };
    case 'CHEQUE':
      return { label: 'Chèque Certifié', iconName: 'FileCheck', detail: 'Chèque bancaire déposé' };
    case 'CASH':
      return { label: 'Espèces (Encaissement Caisse)', iconName: 'Banknote', detail: 'Paiement physique au guichet' };
    default:
      return { label: method, iconName: 'CheckCircle', detail: 'Règlement enregistré' };
  }
}

export function getInvoiceStatusBadge(status: InvoiceStatus): { text: string; bg: string; textCol: string; border: string } {
  switch (status) {
    case 'PAID':
      return { text: 'Payée', bg: 'bg-emerald-950/60', textCol: 'text-emerald-400', border: 'border-emerald-800/60' };
    case 'PARTIALLY_PAID':
      return { text: 'Partiellement Payée', bg: 'bg-amber-950/60', textCol: 'text-amber-400', border: 'border-amber-800/60' };
    case 'UNPAID':
      return { text: 'En Attente de Règlement', bg: 'bg-rose-950/60', textCol: 'text-rose-400', border: 'border-rose-800/60' };
    case 'CANCELLED':
      return { text: 'Annulée', bg: 'bg-slate-800/80', textCol: 'text-slate-400', border: 'border-slate-700' };
    case 'REFUNDED':
      return { text: 'Remboursée', bg: 'bg-purple-950/60', textCol: 'text-purple-400', border: 'border-purple-800/60' };
    default:
      return { text: status, bg: 'bg-slate-800', textCol: 'text-slate-300', border: 'border-slate-700' };
  }
}

export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 256,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}
