'use client';

import { useState } from 'react';
import { checkCadastralNumber } from './actions';
import { Search, ShieldAlert, ShieldCheck, Loader2, BookOpen, Code } from 'lucide-react';

export default function AntiFolioPage() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'valid' | 'fraud'>('idle');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [details, setDetails] = useState<any[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setStatus('loading');
    setDetails([]);

    try {
      const results = await checkCadastralNumber(query.trim());
      
      if (!results || results.length === 0) {
        setStatus('fraud');
        return;
      }

      setDetails(results);

      // Le phénomène "Folio" est détecté si :
      // 1. Un des titres a explicitement le statut "Falsifié" ou "Litige"
      // 2. Il y a plusieurs certificats pour un même numéro cadastral (superposition)
      const isFraud = results.some(r => r.statut === 'Falsifié' || r.statut === 'Litige') || results.length > 1;

      if (isFraud) {
        setStatus('fraud');
      } else if (results.some(r => r.statut === 'Valide')) {
        setStatus('valid');
      } else {
        setStatus('fraud');
      }
    } catch (err) {
      console.error(err);
      setStatus('fraud');
    }
  };

  return (
    <div className="min-h-screen bg-slate-55 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans selection:bg-[#007FFF]/20 transition-colors duration-200">
      <main className="max-w-4xl mx-auto px-6 py-16 flex flex-col items-center">
        {/* En-tête */}
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center justify-center p-3 bg-white dark:bg-slate-900 text-slate-850 dark:text-white rounded-2xl mb-3 shadow-sm dark:shadow-md border border-slate-200 dark:border-slate-880">
            <ShieldCheck className="w-8 h-8 text-[#F7D618]" />
          </div>
          <h1 className="font-display text-4xl font-black text-[#0a192f] dark:text-white tracking-tight leading-tight">
            Vérification Anti-Folio
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl mx-auto font-medium">
            Portail institutionnel de validation de conformité des titres fonciers de la RDC. Détectez instantanément les faux et les superpositions d&apos;enregistrement.
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="w-full max-w-2xl relative">
          <form onSubmit={handleSearch} className="relative bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-850 rounded-3xl p-2.5 shadow-sm flex flex-col sm:flex-row items-center transition-all focus-within:border-[#007FFF]/50 focus-within:ring-4 focus-within:ring-[#007FFF]/5">
            <div className="pl-4 text-slate-400 dark:text-slate-500 hidden sm:block">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="N° Cadastral (ex: SU/GOM/1023)"
              className="flex-1 w-full bg-transparent border-none py-3.5 px-4 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-0 text-sm font-semibold"
            />
            <button
              type="submit"
              disabled={status === 'loading' || !query.trim()}
              className="w-full sm:w-auto bg-[#007FFF] hover:bg-[#006bd6] text-white font-bold py-3.5 px-8 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 sm:mt-0 text-xs uppercase tracking-wider"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recherche...
                </>
              ) : (
                'Vérifier le titre'
              )}
            </button>
          </form>
        </div>

        {/* Zone de résultats */}
        <div className="w-full max-w-2xl mt-10 transition-all duration-500 ease-in-out">
          {status === 'valid' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden rounded-3xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 p-8 shadow-sm">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <ShieldCheck className="w-48 h-48 text-emerald-500" />
              </div>
              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 shadow-sm">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-emerald-700 dark:text-emerald-300 tracking-tight">
                  CERTIFICAT AUTHENTIQUE
                </h2>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-900/40">
                  Enregistrement Conforme & Valide
                </p>
                {details.length > 0 && (
                  <div className="w-full mt-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-850 shadow-sm text-left">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-1">Propriétaire enregistré</span>
                        <p className="font-bold text-slate-800 dark:text-slate-100 text-base">{details[0].nom_proprietaire}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-1">Circonscription</span>
                        <p className="font-bold text-slate-800 dark:text-slate-100 text-base">{details[0].circonscription}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-1">Volume / Folio</span>
                        <p className="font-bold text-slate-800 dark:text-slate-100 text-base">{details[0].volume} / {details[0].folio}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-1">N° Cadastral</span>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400 text-base">{details[0].numero_cadastral}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {status === 'fraud' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden rounded-3xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-8 shadow-sm animate-pulse-slow">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <ShieldAlert className="w-48 h-48 text-red-500" />
              </div>
              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="p-3 bg-red-105 dark:bg-red-900/30 rounded-full border border-red-200 dark:border-red-800 text-red-650 dark:text-red-400 shadow-sm">
                  <ShieldAlert className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-red-700 dark:text-red-300 tracking-tight uppercase">
                  Alerte : Anomalie Majeure Détectée
                </h2>
                <p className="text-sm font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 px-4 py-1.5 rounded-full border border-red-200 dark:border-red-900/40">
                  Risque de phénomène Folio ou faux certificat
                </p>
                <div className="text-red-650 dark:text-red-400 text-xs max-w-lg mt-2 leading-relaxed font-semibold">
                  Attention : Ce numéro cadastral n&apos;est pas enregistré dans le registre central ou présente des contradictions graves avec les livres cadastraux (ex: superposition de propriétaires).
                </div>
                
                {/* Affichage des conflits si plusieurs certificats trouvés */}
                {details.length > 1 && (
                  <div className="w-full mt-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-850 shadow-sm text-left">
                    <p className="text-red-650 dark:text-red-400 text-xs font-bold mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                      <ShieldAlert className="w-4.5 h-4.5" /> 
                      {details.length} Titres en conflit sur cette parcelle :
                    </p>
                    <div className="space-y-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                      {details.map((titre, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-950/50 p-3 rounded-xl border border-slate-200 dark:border-slate-850 text-xs">
                          <p className="text-slate-800 dark:text-slate-100 font-bold text-sm">{titre.nom_proprietaire}</p>
                          <p className="text-slate-500 dark:text-slate-450 mt-1 font-medium">Vol: {titre.volume} / Folio: {titre.folio} — Statut: <span className={titre.statut === 'Valide' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-red-600 dark:text-red-400 font-bold'}>{titre.statut}</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <section className="max-w-4xl mx-auto my-12 space-y-6">
          {/* Qu’est‑ce que le phénomène Folio ? */}
          <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">
              <BookOpen className="w-6 h-6 text-[#007FFF]" /> Qu’est‑ce que le phénomène Folio ?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Le phénomène « Folio » désigne la présence de plusieurs certificats d’enregistrement pour la même parcelle cadastrale, souvent indiquant des superpositions de propriété ou des falsifications. Cela peut résulter d’erreurs d’enregistrement, de fraudes volontaires ou de conflits de succession.
            </p>
          </div>
          {/* Comment fonctionne la validation ? */}
          <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">
              <Code className="w-6 h-6 text-[#007FFF]" /> Comment fonctionne la validation ?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Notre moteur analyse le certificat visuellement, compare le numéro cadastral avec le registre central et détecte les incohérences. Le résultat indique si le document est authentique, falsifié ou en litige, et signale les ratures ou superpositions suspectes.
            </p>
            <svg viewBox="0 0 200 80" className="mt-4 mx-auto w-full max-w-xs" aria-hidden="true">
              <path d="M10 40 L60 20 L110 40 L160 20" stroke="#007FFF" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
              <defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#007FFF" /></marker></defs>
            </svg>
          </div>
          {/* Rappels légaux */}
          <div className="flex flex-wrap gap-2">
            <span className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs font-medium px-3 py-1 rounded-full border border-amber-300 dark:border-amber-700">Loi n° 25/062 (Loi N'Sele)</span>
            <span className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-medium px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-700">Décret 1990/0012 – Cadastre</span>
            <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs font-medium px-3 py-1 rounded-full border border-indigo-300 dark:border-indigo-700">Loi n° 2015‑002 – Baux à loyer</span>
          </div>
        </section>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; border-color: rgba(239, 68, 68, 0.4); }
          50% { opacity: 0.9; border-color: rgba(239, 68, 68, 0.8); box-shadow: 0 0 50px rgba(239, 68, 68, 0.15); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.01);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0,0,0,0.2);
        }
      `}} />
    </div>
  );
}
