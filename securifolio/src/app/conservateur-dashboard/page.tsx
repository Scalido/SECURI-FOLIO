'use client';

import { useState, useEffect } from 'react';
import { getPendingTitles, updateTitleStatus } from './actions';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Clock, Search, ExternalLink, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function ConservateurDashboard() {
  const [titles, setTitles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingTitles();
  }, []);

  const fetchPendingTitles = async () => {
    setLoading(true);
    const { success, data, error: fetchError } = await getPendingTitles();
    if (success) {
      setTitles(data);
    } else {
      setError(fetchError || 'Erreur lors du chargement des titres');
    }
    setLoading(false);
  };

  const handleAction = async (id: string, newStatus: 'Valide' | 'Falsifié') => {
    setActionLoading(id);
    const { success, error: actionError } = await updateTitleStatus(id, newStatus);
    
    if (success) {
      // Remove the processed title from the list
      setTitles(titles.filter(t => t.id !== id));
    } else {
      alert(actionError || 'Une erreur est survenue');
    }
    setActionLoading(null);
  };

  return (
    <div className="min-h-screen bg-brand-bg py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-brand-surface border border-slate-200 dark:border-brand-border rounded-3xl p-8 shadow-xl">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-8 h-8 text-brand-primary" />
              <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Portail <span className="text-brand-primary">Conservateur</span>
              </h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Vérification et scellement définitif des numérisations Smart Archive.
            </p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-6 py-4 rounded-2xl flex items-center gap-4">
            <Clock className="w-8 h-8 text-amber-500" />
            <div>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">En attente de signature</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{titles.length}</p>
            </div>
          </div>
        </div>

        {/* Instructions d'utilisation */}
        <div className="w-full bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-2xl p-5 flex items-start gap-4">
          <BookOpen className="w-6 h-6 text-blue-500 shrink-0" />
          <div>
            <h3 className="text-blue-600 dark:text-blue-400 font-bold text-sm uppercase tracking-wide">Instructions pour le Conservateur (CTI)</h3>
            <ul className="text-sm text-blue-700/80 dark:text-blue-300/80 mt-2 space-y-1 list-disc list-inside">
              <li>Vérifiez l'historique juridique et l'identité des propriétaires pour chaque dossier.</li>
              <li>Ces dossiers ont déjà passé la validation technique et spatiale du <strong>Cadastre</strong>.</li>
              <li>Si le titre est juridiquement valable, cliquez sur "Approuver" pour le sceller définitivement.</li>
              <li>En cas d'irrégularité juridique, cliquez sur la croix rouge pour le rejeter.</li>
            </ul>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 flex items-center gap-3">
            <ShieldAlert className="w-6 h-6" />
            <p className="font-bold">{error}</p>
          </div>
        )}

        {/* Table / List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Chargement des dossiers...</p>
          </div>
        ) : titles.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-brand-surface border border-slate-200 dark:border-brand-border rounded-3xl">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Aucun dossier en attente</h3>
            <p className="text-slate-500">Tous les titres numérisés ont été audités.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-brand-surface border border-slate-200 dark:border-brand-border rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-brand-border">
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">N° Cadastral</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Propriétaire</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Date Numérisation</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-brand-border/50">
                  {titles.map((title) => (
                    <tr key={title.id} className="hover:bg-slate-50 dark:hover:bg-brand-bg/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <Link href={`/anti-folio?q=${encodeURIComponent(title.numero_cadastral)}`} target="_blank" className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg hover:bg-brand-primary/20 transition-colors">
                            <Search className="w-4 h-4" />
                          </Link>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white font-mono">{title.numero_cadastral}</p>
                            <p className="text-xs text-amber-500 font-semibold">{title.statut}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-semibold text-slate-900 dark:text-white">{title.nom_proprietaire}</p>
                        <p className="text-xs text-slate-500">{title.circonscription} (Vol: {title.volume} / Folio: {title.folio})</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {new Date(title.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction(title.id, 'Falsifié')}
                            disabled={actionLoading === title.id}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50"
                            title="Rejeter (Falsifié)"
                          >
                            <XCircle className="w-6 h-6" />
                          </button>
                          <button
                            onClick={() => handleAction(title.id, 'Valide')}
                            disabled={actionLoading === title.id}
                            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold transition-colors disabled:opacity-50 text-sm"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {actionLoading === title.id ? '...' : 'Approuver'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
