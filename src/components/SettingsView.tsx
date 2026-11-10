/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Settings,
  Building2,
  MapPin,
  ShieldCheck,
  Save,
  Download,
  Upload,
  Database,
  Coins,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Mail,
  Phone,
  Globe
} from 'lucide-react';
import { BusinessProfile, CurrencyCode } from '../types.ts';
import { api } from '../lib/api.ts';

interface SettingsViewProps {
  profile: BusinessProfile;
  onUpdateProfile: (updated: Partial<BusinessProfile>) => Promise<void>;
  onTriggerBackup: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateProfile,
  onTriggerBackup,
}) => {
  const [formData, setFormData] = useState<BusinessProfile>({ ...profile });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [backupMsg, setBackupMsg] = useState('');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupsList, setBackupsList] = useState<Array<{ filename: string; size: number; createdAt: string }>>([]);

  // Keep form in sync when profile updates
  React.useEffect(() => {
    if (profile) {
      setFormData({ ...profile });
    }
  }, [profile]);

  // Load backups on mount
  React.useEffect(() => {
    api.getBackups().then(list => setBackupsList(list)).catch(() => {});
  }, []);

  const handleChange = (field: keyof BusinessProfile, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBankChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      bankDetails: {
        bankName: prev.bankDetails?.bankName || '',
        accountName: prev.bankDetails?.accountName || '',
        accountNumber: prev.bankDetails?.accountNumber || '',
        ibanRib: prev.bankDetails?.ibanRib || '',
        swiftBic: prev.bankDetails?.swiftBic || '',
        momoNumber: prev.bankDetails?.momoNumber || '',
        moovNumber: prev.bankDetails?.moovNumber || '',
        ...prev.bankDetails,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaveError('');
    setSaveSuccess(false);

    if (!formData.officialBusinessName?.trim()) {
      setSaveError('La raison sociale officielle est obligatoire.');
      return;
    }
    if (!formData.registeredAddress?.trim()) {
      setSaveError('L\'adresse du siège social est obligatoire.');
      return;
    }
    if (!formData.operatingAddress?.trim()) {
      setSaveError('L\'adresse des bureaux d\'exploitation est obligatoire.');
      return;
    }

    setIsSaving(true);
    try {
      await onUpdateProfile(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err: any) {
      setSaveError(err.message || 'Erreur lors de la mise à jour des paramètres.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    setBackupMsg('');
    try {
      const res = await api.createBackup();
      setBackupMsg(`✅ Sauvegarde système créée avec succès : ${res.filePath}`);
      const updatedList = await api.getBackups();
      setBackupsList(updatedList);
    } catch (err: any) {
      setBackupMsg(`Erreur sauvegarde : ${err.message}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        await api.restoreBackup(json);
        setBackupMsg('Base de données restaurée avec succès ! Les données ont été actualisées.');
        setTimeout(() => window.location.reload(), 1500);
      } catch (err: any) {
        setBackupMsg(`Échec de la restauration : ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <span>Paramètres de l'Entreprise & Registre Légal</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configuration du profil commercial, des immatriculations officielles au Bénin et des coordonnées bancaires.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {saveSuccess && (
            <div className="bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-xs px-3.5 py-2 rounded-xl flex items-center shadow-lg animate-fade-in font-semibold">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" />
              Paramètres enregistrés au registre !
            </div>
          )}
          {saveError && (
            <div className="bg-rose-950/80 border border-rose-600 text-rose-300 text-xs px-3.5 py-2 rounded-xl flex items-center shadow-lg animate-fade-in font-semibold">
              <AlertTriangle className="w-4 h-4 mr-1.5 text-rose-400" />
              {saveError}
            </div>
          )}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-950/40 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-1.5" />
            <span>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Business Identity & Legal Structure */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm border-b border-slate-800 pb-3">
            <Building2 className="w-4 h-4" />
            <span>1. Raison Sociale & Forme Juridique</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Raison Sociale Officielle (Statuts) *</label>
              <input
                type="text"
                value={formData.officialBusinessName}
                onChange={(e) => handleChange('officialBusinessName', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Nom Commercial / Marque Déposée *</label>
              <input
                type="text"
                value={formData.commercialName}
                onChange={(e) => handleChange('commercialName', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Structure Juridique Réelle *</label>
              <select
                value={formData.legalStructure}
                onChange={(e) => handleChange('legalStructure', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
              >
                <option value="Entreprise Individuelle (Établissement)">Entreprise Individuelle (Établissement)</option>
                <option value="Société à Responsabilité Limitée (SARL)">Société à Responsabilité Limitée (SARL)</option>
                <option value="Société par Actions Simplifiée (SAS)">Société par Actions Simplifiée (SAS)</option>
                <option value="Société Unipersonnelle (SUARL)">Société Unipersonnelle (SUARL)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Description de l'Activité Réelle *</label>
              <input
                type="text"
                value={formData.activityDescription}
                onChange={(e) => handleChange('activityDescription', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Nom Complet du Titulaire / Promoteur *</label>
              <input
                type="text"
                placeholder="Ex: KODJO Jean-Baptiste"
                value={formData.ownerFullName || ''}
                onChange={(e) => handleChange('ownerFullName', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Qualité / Titre du Titulaire *</label>
              <input
                type="text"
                placeholder="Ex: Titulaire / Promoteur / Fondateur"
                value={formData.ownerTitle || ''}
                onChange={(e) => handleChange('ownerTitle', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">Régime Fiscal DGI Bénin *</label>
              <select
                value={formData.taxRegime || 'Régime du Réel Simplifié (RSI)'}
                onChange={(e) => handleChange('taxRegime', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
              >
                <option value="Régime du Réel Simplifié (RSI)">Régime du Réel Simplifié (RSI)</option>
                <option value="Régime du Réel Normal (RN)">Régime du Réel Normal (RN)</option>
                <option value="Taxe Professionnelle Synthétique (TPS)">Taxe Professionnelle Synthétique (TPS)</option>
                <option value="Micro-Entreprise (Régime Forfaitaire)">Micro-Entreprise (Régime Forfaitaire)</option>
              </select>
            </div>
          </div>

          {/* Compliance Warning */}
          <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-3 text-xs text-amber-200/90 flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-[11px] leading-relaxed">
              <strong>Obligation d'Authenticité OHADA & DGI Bénin :</strong> Une Entreprise Individuelle (Établissement) ne dispose pas de capital social distinct et engage la responsabilité civile du titulaire. Ne jamais qualifier une entreprise individuelle de SARL ni lui inventer un capital social fictif.
            </div>
          </div>
        </div>

        {/* Section 2: Official Benin Registrations (RCCM & IFU) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm border-b border-slate-800 pb-3">
            <ShieldCheck className="w-4 h-4" />
            <span>2. Immatriculations Officielles au Bénin (RCCM & IFU)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-200">Numéro RCCM (Greffe Commercial)</label>
                <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] text-emerald-400">
                  <input
                    type="checkbox"
                    checked={formData.isRccmVerified}
                    onChange={(e) => handleChange('isRccmVerified', e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700"
                  />
                  <span>Officiellement Immatriculé</span>
                </label>
              </div>
              <input
                type="text"
                placeholder="Ex: RB/COT/23 B 38942"
                value={formData.rccmNumber}
                onChange={(e) => handleChange('rccmNumber', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-mono text-slate-100"
              />
              <span className="text-[10px] text-slate-500 block">Ne renseigner que si officiellement délivré par le Tribunal de Commerce.</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-200">Identifiant Fiscal Unique (IFU - DGI Bénin)</label>
                <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] text-emerald-400">
                  <input
                    type="checkbox"
                    checked={formData.isIfuVerified}
                    onChange={(e) => handleChange('isIfuVerified', e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700"
                  />
                  <span>Certificat IFU Détenu</span>
                </label>
              </div>
              <input
                type="text"
                placeholder="Ex: 3202314569801 (13 chiffres)"
                value={formData.ifuNumber}
                onChange={(e) => handleChange('ifuNumber', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-mono text-emerald-300 font-bold"
              />
              <span className="text-[10px] text-slate-500 block">Numéro fiscal obligatoire pour toute facturation avec TVA.</span>
            </div>
          </div>
        </div>

        {/* Section 3: Dual Addresses & Integrity (Strict Distinction) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
              <MapPin className="w-4 h-4" />
              <span>3. Adresses Commerciales Réelles & Distinction Référée</span>
            </div>
            <span className="text-[10px] text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded">
              Non-conflation légale
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Adresse du Siège Social Légal (Statuts) *
              </label>
              <input
                type="text"
                value={formData.registeredAddress}
                onChange={(e) => handleChange('registeredAddress', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Adresse Réelle des Bureaux d'Exploitation / Locaux Commerciaux *
              </label>
              <input
                type="text"
                value={formData.operatingAddress}
                onChange={(e) => handleChange('operatingAddress', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                required
              />
            </div>

            {/* Strictly Separate Owner Residential Address Field */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <label className="block text-slate-400 font-medium">
                Adresse de Résidence du Gérant (Optionnel & Strictement Séparé)
              </label>
              <input
                type="text"
                placeholder="Uniquement si légitimement requis par les autorités. Ne figurera pas sur les factures commerciales."
                value={formData.ownerResidentialAddress || ''}
                onChange={(e) => handleChange('ownerResidentialAddress', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-300"
              />
              <span className="text-[10px] text-slate-500 block">
                Garantie d'intégrité : Cette adresse personnelle n'est jamais automatiquement substituée à l'adresse commerciale de l'entreprise.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Ville</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Code Postal / BP</label>
                <input
                  type="text"
                  value={formData.postalCode || ''}
                  onChange={(e) => handleChange('postalCode', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Pays</label>
                <input
                  type="text"
                  value={formData.country}
                  disabled
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-400 cursor-not-allowed font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Contact & Signatory */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm border-b border-slate-800 pb-3">
            <UserCheck className="w-4 h-4" />
            <span>4. Coordonnées & Signataire Autorisé</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Téléphone Professionnel</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Email Professionnel</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Site Web Commercial</label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Taux TVA Bénin par défaut (%)</label>
              <input
                type="number"
                value={formData.defaultTaxRate}
                onChange={(e) => handleChange('defaultTaxRate', Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Nom du Signataire Autorisé *</label>
              <input
                type="text"
                value={formData.authorizedSignatoryName}
                onChange={(e) => handleChange('authorizedSignatoryName', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-semibold"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Titre / Fonction *</label>
              <input
                type="text"
                value={formData.authorizedSignatoryTitle}
                onChange={(e) => handleChange('authorizedSignatoryTitle', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 5: Official Bank Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm border-b border-slate-800 pb-3">
            <Coins className="w-4 h-4" />
            <span>5. Coordonnées Bancaires & Télécom Marchand (Bénin)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block text-slate-300 font-sans font-semibold mb-1">Nom de la Banque Partenaire</label>
              <input
                type="text"
                placeholder="Ex: Ecobank Bénin S.A."
                value={formData.bankDetails?.bankName || ''}
                onChange={(e) => handleBankChange('bankName', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-sans font-semibold mb-1">Intitulé du Compte Commercial</label>
              <input
                type="text"
                value={formData.bankDetails?.accountName || ''}
                onChange={(e) => handleBankChange('accountName', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-sans font-semibold mb-1">N° Compte Bancaire</label>
              <input
                type="text"
                value={formData.bankDetails?.accountNumber || ''}
                onChange={(e) => handleBankChange('accountNumber', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-sans font-semibold mb-1">RIB / IBAN Bénin</label>
              <input
                type="text"
                value={formData.bankDetails?.ibanRib || ''}
                onChange={(e) => handleBankChange('ibanRib', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-sans font-semibold mb-1">Numéro MTN MoMo Marchand</label>
              <input
                type="text"
                value={formData.bankDetails?.momoNumber || ''}
                onChange={(e) => handleBankChange('momoNumber', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-sans font-semibold mb-1">Numéro Moov Money Pro</label>
              <input
                type="text"
                value={formData.bankDetails?.moovNumber || ''}
                onChange={(e) => handleBankChange('moovNumber', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Submit Profile Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
          <div className="flex-1">
            {saveSuccess && (
              <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Modifications du profil enregistrées avec succès et horodatées dans l'audit.</span>
              </div>
            )}
            {saveError && (
              <div className="flex items-center space-x-2 text-rose-400 font-semibold text-xs animate-fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>{saveError}</span>
              </div>
            )}
            {!saveSuccess && !saveError && (
              <span className="text-xs text-slate-500">
                Toutes les modifications sont enregistrées dans la base de données et scellées par SHA-256.
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xl shadow-indigo-950/50 transition-all cursor-pointer shrink-0 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            <span>{isSaving ? 'Enregistrement en cours...' : 'Enregistrer les Modifications du Profil'}</span>
          </button>
        </div>

      </form>

      {/* Section 6: Database Backups & Export/Restore */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm border-b border-slate-800 pb-3">
          <Database className="w-4 h-4" />
          <span>6. Sauvegardes Système & Restauration des Données</span>
        </div>

        <p className="text-xs text-slate-400">
          Les sauvegardes capturent l'intégralité des factures, quittances, clients et chaînes d'audit SHA-256 dans un format JSON certifié.
        </p>

        {backupMsg && (
          <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-xs font-mono text-emerald-400 animate-fade-in">
            {backupMsg}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleCreateBackup}
            disabled={isBackingUp}
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <Database className="w-4 h-4 mr-2" />
            <span>{isBackingUp ? 'Création...' : 'Créer un Instantané de Sauvegarde'}</span>
          </button>

          <a
            href="/api/backups/export"
            download
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-all"
          >
            <Download className="w-4 h-4 mr-2 text-emerald-400" />
            <span>Télécharger Immédiatement la Base JSON</span>
          </a>

          <label className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-all cursor-pointer">
            <Upload className="w-4 h-4 mr-2 text-amber-400" />
            <span>Restaurer une Sauvegarde JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreDatabase}
              className="hidden"
            />
          </label>
        </div>

        {/* Existing Backups Table */}
        {backupsList.length > 0 && (
          <div className="pt-4 border-t border-slate-800/80">
            <span className="text-xs font-semibold text-slate-300 block mb-2">
              Historique des Instantanés de Sauvegarde Disponibles ({backupsList.length}) :
            </span>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {backupsList.map((b) => (
                <div key={b.filename} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <Database className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-mono text-slate-300 font-medium">{b.filename}</span>
                    <span className="text-[10px] text-slate-500">({Math.round(b.size / 1024)} KB)</span>
                  </div>
                  <a
                    href={`/api/backups/download/${encodeURIComponent(b.filename)}`}
                    download={b.filename}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] font-semibold inline-flex items-center"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    <span>Télécharger</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
