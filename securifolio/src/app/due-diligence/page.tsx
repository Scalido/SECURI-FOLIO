'use client';

import { useState } from 'react';
import { Search, ShieldCheck, AlertTriangle, XCircle, FileText, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function DueDiligencePage() {
  const [numeroCadastral, setNumeroCadastral] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroCadastral.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error } = await supabase
        .from('titres_fonciers')
        .select('numero_cadastral, nom_proprietaire, circonscription, statut, hash_signature, date_enregistrement')
        .eq('numero_cadastral', numeroCadastral.trim())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Aucun titre foncier trouvé pour ce numéro cadastral.');
        } else {
          setError('Erreur lors de la recherche. Veuillez réessayer.');
        }
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = (statut: string) => {
    switch (statut) {
      case 'Valide':
        return (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full font-bold">
            <CheckCircle2 className="w-5 h-5" /> Titre Authentique & Valide
          </div>
        );
      case 'Litige':
        return (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-full font-bold">
            <AlertTriangle className="w-5 h-5" /> En Litige (Superposition / Conflit)
          </div>
        );
      case 'Falsifié':
        return (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-full font-bold">
            <XCircle className="w-5 h-5" /> Falsifié / Invalide
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-4 py-2 rounded-full font-bold">
            <ShieldCheck className="w-5 h-5" /> En attente d'audit
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-brand-primary/10 rounded-3xl border border-brand-primary/20 text-brand-primary mb-2 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Portail <span className="text-brand-primary">Due Diligence</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto">
            Vérifiez instantanément l'authenticité et le statut juridique d'un titre foncier avant toute transaction immobilière.
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white dark:bg-brand-surface border border-slate-200 dark:border-brand-border rounded-3xl p-2 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <form onSubmit={handleSearch} className="flex items-center relative">
            <Search className="w-6 h-6 text-slate-400 absolute left-6" />
            <input
              type="text"
              value={numeroCadastral}
              onChange={(e) => setNumeroCadastral(e.target.value)}
              placeholder="Entrez le numéro cadastral (ex: SU/GOM/1023)..."
              className="w-full bg-transparent border-none py-6 pl-16 pr-32 text-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-0 font-mono"
            />
            <button
              type="submit"
              disabled={loading || !numeroCadastral.trim()}
              className="absolute right-2 top-2 bottom-2 bg-brand-primary hover:bg-emerald-400 text-brand-bg font-bold px-8 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
            >
              {loading ? 'Recherche...' : 'Vérifier'}
            </button>
          </form>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-6 text-center animate-in fade-in slide-in-from-bottom-4">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-1">Document introuvable</h3>
            <p className="text-red-600/80 dark:text-red-400/80">{error}</p>
          </div>
        )}

        {/* Result State */}
        {result && (
          <div className="bg-white dark:bg-brand-surface border border-slate-200 dark:border-brand-border rounded-3xl p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none animate-in fade-in slide-in-from-bottom-4 space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 dark:border-brand-border pb-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Certificat Numérique</p>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white font-mono">{result.numero_cadastral}</h2>
              </div>
              {renderStatus(result.statut)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Propriétaire Enregistré</p>
                <p className="text-lg font-medium text-slate-900 dark:text-white">{result.nom_proprietaire}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Circonscription</p>
                <p className="text-lg font-medium text-slate-900 dark:text-white">{result.circonscription}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-3 h-3" /> Empreinte Cryptographique (SHA-256)
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-brand-bg/50 p-3 rounded-xl break-all border border-slate-100 dark:border-brand-border/50">
                  {result.hash_signature || "Non générée (Titre ancien)"}
                </p>
              </div>
            </div>

            {/* Paywall Teaser */}
            <div className="mt-8 bg-brand-bg/50 border border-brand-primary/20 rounded-2xl p-6 text-center">
              <ShieldCheck className="w-8 h-8 text-brand-primary mx-auto mb-3" />
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">Rapport Détaillé & Historique des Mutations</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Pour obtenir l'historique complet des propriétaires précédents et le rapport topographique détaillé, débloquez le certificat premium.
              </p>
              <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity">
                Obtenir le rapport complet (15$)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
