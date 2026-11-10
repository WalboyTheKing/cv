/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, User, Key, ShieldCheck, X } from 'lucide-react';
import { UserSession } from '../types.ts';
import { api } from '../lib/api.ts';

interface LoginModalProps {
  onSuccess: (session: UserSession) => void;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onSuccess, onClose }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('AdminPass2026!');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await api.login(username, password);
      onSuccess(res.session);
    } catch (err: any) {
      setError(err.message || 'Identifiants invalides.');
    } finally {
      setIsLoading(false);
    }
  };

  const setRoleDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 text-slate-100">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Lock className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">Authentification Staff Sécurisée</h3>
              <p className="text-xs text-slate-400">Contrôle d'accès basé sur les rôles (RBAC)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-rose-950/60 border border-rose-800 rounded-lg p-2.5 text-xs text-rose-300 mb-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Identifiant Staff *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Mot de Passe Sécurisé *</label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                required
              />
            </div>
          </div>

          {/* Quick role presets for instant review */}
          <div className="pt-2 border-t border-slate-800">
            <span className="text-[10px] text-slate-500 block mb-1.5 font-medium">
              Comptes de Démonstration Pré-configurés :
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRoleDemo('admin', 'AdminPass2026!')}
                className="p-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 font-mono"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setRoleDemo('comptable', 'Compta2026!')}
                className="p-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 font-mono"
              >
                Comptable
              </button>
              <button
                type="button"
                onClick={() => setRoleDemo('auditeur', 'Audit2026!')}
                className="p-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 font-mono"
              >
                Auditeur
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
            >
              Fermer
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-950/40"
            >
              {isLoading ? 'Connexion...' : 'Se Connecter'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
