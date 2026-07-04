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
      // 2. Il y a plusieurs certificats pour un même numéro d'enregistrement (superposition)
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
    <div className="min-h-screen bg-brand-bg text-slate-900 dark:text-white font-sans selection:bg-brand-primary/20 relative overflow-hidden">
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <main className="max-w-4xl mx-auto px-6 py-16 flex flex-col items-center relative z-10">
        {/* En-tête */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-white dark:bg-brand-surface border border-slate-200 dark:border-brand-border rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.15)] mb-2">
            <ShieldCheck className="w-8 h-8 text-brand-primary" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Vérification <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-emerald-300">Anti-Folio</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base max-w-xl mx-auto font-medium">
            Portail institutionnel de validation de conformité des titres fonciers de la RDC. Détectez instantanément les faux et les superpositions d&apos;enregistrement.
          </p>
        </div>

        {/* Barre de recherche et Filtres */}
        <div className="w-full max-w-2xl relative space-y-3">
          <form onSubmit={handleSearch} className="relative bg-white dark:bg-brand-surface/50 backdrop-blur-xl border border-slate-200 dark:border-brand-border rounded-3xl p-2.5 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-center transition-all focus-within:border-brand-primary/50 focus-within:shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            
            {/* Selecteur de Circonscription */}
            <div className="w-full sm:w-1/3 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-brand-border/50 p-1">
              <select 
                className="w-full bg-transparent border-none py-2.5 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-0 text-xs font-bold uppercase tracking-wider appearance-none cursor-pointer"
                defaultValue="all"
              >
                <option value="all" className="text-slate-900">National (Toutes zones)</option>
                <option value="kin-gombe" className="text-slate-900">Kinshasa - Gombe (Numérisé)</option>
                <option value="kin-ngaliema" className="text-slate-900">Kinshasa - Ngaliema (Numérisé)</option>
                <option value="goma" className="text-slate-900">Nord-Kivu - Goma (En cours)</option>
                <option value="lushi" className="text-slate-900">Katanga - Lubumbashi (Non numérisé)</option>
              </select>
            </div>

            <div className="pl-4 text-brand-primary hidden sm:block">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="N° d'enregistrement (ex: SU/GOM/1023)"
              className="flex-1 w-full bg-transparent border-none py-3.5 px-4 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-0 text-sm font-semibold"
            />
            <button
              type="submit"
              disabled={status === 'loading' || !query.trim()}
              className="w-full sm:w-auto bg-brand-primary hover:bg-emerald-400 text-brand-bg font-bold py-3.5 px-8 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 sm:mt-0 text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
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

          {/* Disclaimer d'Intégrité */}
          <div className="flex items-start gap-2 px-4">
             <ShieldAlert size={14} className="text-brand-accent mt-0.5 shrink-0" />
             <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
               <strong className="text-slate-400">Transparence des Données (Phase 1) :</strong> Seules les circonscriptions numérisées et validées par le Conservateur des Titres Immobiliers sont interrogeables en temps réel. Un titre "Inconnu" dans une zone non numérisée nécessite une vérification manuelle aux archives physiques.
             </p>
          </div>
        </div>

        {/* Zone de résultats */}
        <div className="w-full max-w-2xl mt-12 transition-all duration-500 ease-in-out">
          {status === 'valid' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden rounded-3xl bg-white dark:bg-brand-surface/80 backdrop-blur-md border border-brand-primary/30 p-8 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <ShieldCheck className="w-48 h-48 text-brand-primary" />
              </div>
              <div className="relative z-10 flex flex-col items-center text-center space-y-5">
                <div className="p-4 bg-brand-primary/10 rounded-full border border-brand-primary/30 text-brand-primary shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <ShieldCheck className="w-12 h-12" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  CERTIFICAT AUTHENTIQUE
                </h2>
                <p className="text-sm font-bold text-brand-primary bg-brand-primary/10 px-5 py-2 rounded-full border border-brand-primary/20 tracking-wide uppercase">
                  Enregistrement Conforme & Valide
                </p>
                {details.length > 0 && (
                  <div className="w-full mt-8 bg-brand-bg/50 rounded-2xl p-6 border border-slate-200 dark:border-brand-border text-left">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-1.5">Propriétaire enregistré</span>
                        <p className="font-bold text-slate-900 dark:text-white text-base">{details[0].nom_proprietaire}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-1.5">Circonscription</span>
                        <p className="font-bold text-slate-900 dark:text-white text-base">{details[0].circonscription}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-1.5">Volume / Folio</span>
                        <p className="font-bold text-slate-900 dark:text-white text-base">{details[0].volume} / {details[0].folio}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-1.5">N° d&apos;enregistrement</span>
                        <p className="font-bold text-brand-primary text-base">{details[0].numero_cadastral}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {status === 'fraud' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden rounded-3xl bg-white dark:bg-brand-surface/80 backdrop-blur-md border border-red-500/30 p-8 shadow-[0_0_40px_rgba(239,68,68,0.1)] animate-pulse-slow">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <ShieldAlert className="w-48 h-48 text-red-500" />
              </div>
              <div className="relative z-10 flex flex-col items-center text-center space-y-5">
                <div className="p-4 bg-red-500/10 rounded-full border border-red-500/30 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                  <ShieldAlert className="w-12 h-12" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                  Alerte : Anomalie Majeure
                </h2>
                <p className="text-sm font-bold text-red-400 bg-red-500/10 px-5 py-2 rounded-full border border-red-500/20 tracking-wide uppercase">
                  Risque de Phénomène Folio ou Faux
                </p>
                <div className="text-slate-600 dark:text-slate-300 text-sm max-w-lg mt-4 leading-relaxed">
                 <strong className="text-red-400 block mb-2">Attention :</strong> Ce numéro d&apos;enregistrement n&apos;est pas validé par le registre central ou présente des contradictions graves avec les livres fonciers (ex: superposition de propriétaires).
                </div>
                
                {/* Affichage des conflits si plusieurs certificats trouvés */}
                {details.length > 1 && (
                  <div className="w-full mt-6 bg-brand-bg/50 rounded-2xl p-6 border border-red-500/20 text-left">
                    <p className="text-red-400 text-xs font-bold mb-4 flex items-center gap-2 uppercase tracking-widest">
                      <ShieldAlert className="w-4 h-4" /> 
                      {details.length} Titres en conflit sur cette parcelle :
                    </p>
                    <div className="space-y-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                      {details.map((titre, idx) => (
                        <div key={idx} className="bg-white dark:bg-brand-surface p-4 rounded-xl border border-slate-200 dark:border-brand-border text-xs flex flex-col gap-2">
                          <p className="text-slate-900 dark:text-white font-bold text-sm">{titre.nom_proprietaire}</p>
                          <p className="text-slate-500 dark:text-slate-400 font-medium">Vol: {titre.volume} / Folio: {titre.folio} — Statut: <span className={titre.statut === 'Valide' ? 'text-brand-primary font-bold' : 'text-red-400 font-bold'}>{titre.statut}</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <section className="max-w-4xl mx-auto my-16 space-y-6 w-full">
          {/* Qu’est‑ce que le phénomène Folio ? */}
          <div className="group bg-white dark:bg-brand-surface/40 backdrop-blur-sm border border-slate-200 dark:border-brand-border rounded-2xl p-8 hover:border-brand-primary/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.05)]">
            <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 dark:text-white mb-4">
              <BookOpen className="w-6 h-6 text-brand-primary group-hover:scale-110 transition-transform" /> Qu’est‑ce que le phénomène Folio ?
            </h2>
            <div className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed space-y-4">
              <p>
                Le phénomène « Folio » survient lorsque l&apos;administration émet par erreur (ou suite à des fraudes) plusieurs certificats d&apos;enregistrement authentiques pour une seule et même concession. Cela crée des conflits interminables entre propriétaires légitimes de bonne foi.
              </p>
              <div className="bg-brand-bg/50 p-5 rounded-xl border border-slate-200 dark:border-brand-border/50">
                <strong className="text-slate-900 dark:text-white mb-2 block">Notre système de classification :</strong>
                <ul className="space-y-2 mt-3">
                  <li className="flex items-center gap-2"><span className="text-brand-primary">■</span> <strong className="text-slate-200 w-24">Valide</strong> Certificat unique, conforme et sans contestation.</li>
                  <li className="flex items-center gap-2"><span className="text-brand-accent">■</span> <strong className="text-slate-200 w-24">Litige</strong> Titre gelé administrativement ou judiciairement.</li>
                  <li className="flex items-center gap-2"><span className="text-red-500">■</span> <strong className="text-slate-200 w-24">Falsifié</strong> Incohérence majeure avec le registre.</li>
                  <li className="flex items-center gap-2"><span className="text-slate-400 dark:text-slate-500">■</span> <strong className="text-slate-200 w-24">Inconnu</strong> Numéro introuvable, contrefaçon intégrale.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Comment fonctionne la validation ? */}
          <div className="group bg-white dark:bg-brand-surface/40 backdrop-blur-sm border border-slate-200 dark:border-brand-border rounded-2xl p-8 hover:border-brand-primary/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.05)]">
            <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 dark:text-white mb-4">
              <Code className="w-6 h-6 text-brand-primary group-hover:scale-110 transition-transform" /> Comment fonctionne la validation ?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Notre moteur analyse le certificat visuellement, compare le numéro d&apos;enregistrement avec le registre central et détecte les incohérences. Le résultat indique si le document est authentique, falsifié ou en litige, et signale les ratures ou superpositions suspectes.
            </p>
          </div>
          
          {/* Rappels légaux */}
          <div className="flex flex-wrap gap-3 pt-4">
            <span className="bg-brand-primary/10 text-brand-primary text-[10px] uppercase tracking-wider font-bold px-4 py-2 rounded-full border border-brand-primary/20">Loi n° 25/062 (Loi N&apos;Sele)</span>
            <span className="bg-brand-accent/10 text-brand-accent text-[10px] uppercase tracking-wider font-bold px-4 py-2 rounded-full border border-brand-accent/20">Décret 1990/0012 – Foncier</span>
          </div>
        </section>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-slow {
          0%, 100% { border-color: rgba(239, 68, 68, 0.3); box-shadow: 0 0 40px rgba(239, 68, 68, 0.1); }
          50% { border-color: rgba(239, 68, 68, 0.6); box-shadow: 0 0 60px rgba(239, 68, 68, 0.2); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.5);
        }
      `}} />
    </div>
  );
}
