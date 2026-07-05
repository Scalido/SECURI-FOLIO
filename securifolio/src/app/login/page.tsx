'use client';

import { useState } from 'react';
import { login } from './actions';
import { ShieldCheck, Loader2, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await login(formData);
    
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // If successful, the server action will redirect
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-white dark:bg-brand-surface/80 backdrop-blur-xl border border-slate-200 dark:border-brand-border rounded-3xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative z-10">
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-brand-primary/10 rounded-2xl border border-brand-primary/20 text-brand-primary mb-2 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Accès <span className="text-brand-primary">Sécurisé</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Portail réservé aux agents habilités du Ministère des Affaires Foncières.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
              Identifiant / Email
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="agent@foncier.gouv.cd"
              className="w-full bg-brand-bg/50 border border-slate-200 dark:border-brand-border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brand-primary transition-colors font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
              Mot de Passe (L4 Clearance)
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••••••"
                className="w-full bg-brand-bg/50 border border-slate-200 dark:border-brand-border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brand-primary transition-colors font-mono pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-brand-primary transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary hover:bg-emerald-400 text-brand-bg font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            {loading ? 'Authentification...' : 'Ouvrir la session'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-200 dark:border-brand-border pt-6">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            Toute tentative d&apos;accès non autorisé est surveillée.
          </p>
        </div>
      </div>
    </div>
  );
}
