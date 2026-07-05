'use client';

import { useState } from 'react';
import { createAgentAccount } from './actions';
import { ShieldAlert, Loader2, UserPlus, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await createAgentAccount(formData);
    
    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setSuccess(result.message || "Compte créé avec succès.");
      (e.target as HTMLFormElement).reset();
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-white dark:bg-brand-surface/80 backdrop-blur-xl border border-slate-200 dark:border-brand-border rounded-3xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative z-10">
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-500 mb-2 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Console <span className="text-red-500">L5</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Création de comptes de niveau L4 (Agents Fonciers).
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
              Email de l&apos;Agent
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="agent@foncier.gouv.cd"
              className="w-full bg-brand-bg/50 border border-slate-200 dark:border-brand-border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500 transition-colors font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
              Mot de Passe Temporaire
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="••••••••••••"
                className="w-full bg-brand-bg/50 border border-slate-200 dark:border-brand-border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-red-500 transition-colors font-mono pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-red-500 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {loading ? 'Création en cours...' : 'Générer le compte'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-200 dark:border-brand-border pt-6 flex flex-col gap-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            Les comptes créés sont automatiquement confirmés.
          </p>
          <Link href="/smart-archive" className="text-xs text-brand-primary font-bold hover:underline">
            Retour à l&apos;application
          </Link>
        </div>
      </div>
    </div>
  );
}
