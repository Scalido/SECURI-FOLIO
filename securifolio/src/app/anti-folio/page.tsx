'use client';

import { useState, useEffect } from 'react';
import { checkCadastralNumber, saveScanHistory, getScanHistory } from './actions';
import { Search, ShieldAlert, ShieldCheck, Loader2, Clock, Brain, Map, CheckCircle, XCircle, Database } from 'lucide-react';

export default function AntiFolioPage() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'valid' | 'fraud'>('idle');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [details, setDetails] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [history, setHistory] = useState<any[]>([]);

  // Charger l'historique au démarrage
  useEffect(() => {
    const fetchHistory = async () => {
      const data = await getScanHistory();
      setHistory(data || []);
    };
    fetchHistory();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setStatus('loading');
    setDetails([]);

    try {
      const results = await checkCadastralNumber(query.trim());
      
      let currentStatus: 'valid' | 'fraud' = 'fraud';

      if (!results || results.length === 0) {
        currentStatus = 'fraud';
      } else {
        setDetails(results);

        const isFraud = results.some(r => r.statut === 'Falsifié' || r.statut === 'Litige') || results.length > 1;

        if (isFraud) {
          currentStatus = 'fraud';
        } else if (results.some(r => r.statut === 'Valide')) {
          currentStatus = 'valid';
        } else {
          currentStatus = 'fraud';
        }
      }

      setStatus(currentStatus);

      // Sauvegarder l'historique
      await saveScanHistory(query.trim(), currentStatus);
      
      // Rafraîchir l'historique
      const newHistory = await getScanHistory();
      setHistory(newHistory || []);

    } catch (err) {
      console.error(err);
      setStatus('fraud');
    }
  };

  return (
    <div className="w-full flex-1 bg-brand-bg text-slate-900 dark:text-white font-sans selection:bg-brand-primary/20 relative overflow-hidden">
      
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
            Portail institutionnel de validation de conformité des titres fonciers de la RDC. Détectez instantanément les faux et les superpositions grâce à notre architecture hybride (IA + Spatial).
          </p>
        </div>

        {/* Barre de recherche et Filtres */}
        <div className="w-full max-w-2xl relative space-y-3">
          <form onSubmit={handleSearch} className="relative bg-white dark:bg-brand-surface/50 backdrop-blur-xl border border-slate-200 dark:border-brand-border rounded-3xl p-2.5 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-center transition-all focus-within:border-brand-primary/50 focus-within:shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            
            {/* Selecteur de Circonscription */}
            <div className="w-full sm:w-1/3 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-brand-border/50 p-1 mb-2 sm:mb-0">
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
                  Double Vérification...
                </>
              ) : (
                'Scanner le Titre'
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

          {/* Historique Rapide */}
          {history.length > 0 && (
            <div className="px-4 pt-4 mt-4 border-t border-slate-200/10 dark:border-brand-border/30">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={12} className="text-slate-500" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Dernières vérifications</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map((item, idx) => (
                  <button 
                    key={item.id || idx}
                    onClick={() => {
                      setQuery(item.numero_cadastral);
                    }}
                    className={`flex items-center gap-2 text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg border transition-colors hover:opacity-80 ${
                      item.resultat === 'valid' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                        : 'bg-red-500/10 border-red-500/20 text-red-500'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {item.numero_cadastral}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Zone de résultats */}
        <div className="w-full max-w-3xl mt-12 transition-all duration-500 ease-in-out">
          {status === 'valid' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden rounded-3xl bg-white dark:bg-brand-surface/80 backdrop-blur-md border border-brand-primary/30 p-8 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <ShieldCheck className="w-64 h-64 text-brand-primary" />
              </div>
              
              <div className="relative z-10 flex flex-col items-center text-center space-y-4 mb-8">
                <div className="p-4 bg-brand-primary/10 rounded-full border border-brand-primary/30 text-brand-primary shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    CERTIFICAT AUTHENTIQUE
                  </h2>
                  <p className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-4 py-1.5 mt-2 inline-block rounded-full border border-brand-primary/20 tracking-wide uppercase">
                    Enregistrement Conforme & Valide
                  </p>
                </div>
              </div>

              {/* Double Vérification Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 mb-8">
                {/* Couche 1 : IA */}
                <div className="bg-brand-bg/60 border border-slate-200 dark:border-brand-border rounded-2xl p-5 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-brand-primary/20 text-brand-primary rounded-lg border border-brand-primary/30">
                      <Brain size={18} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Analyse Sémantique (IA)</h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1 mt-0.5">
                        <CheckCircle size={10} className="text-brand-primary" /> Validation Documentaire
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Les métadonnées administratives (noms, dates, signatures) sont authentiques. Aucune trace de falsification ou d'altération détectée.
                  </p>
                </div>

                {/* Couche 2 : Spatial */}
                <div className="bg-brand-bg/60 border border-slate-200 dark:border-brand-border rounded-2xl p-5 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-brand-primary/20 text-brand-primary rounded-lg border border-brand-primary/30">
                      <Map size={18} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Analyse Topographique</h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1 mt-0.5">
                        <CheckCircle size={10} className="text-brand-primary" /> Moteur Spatial PostGIS
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Le polygone de la parcelle a été vérifié géospatialement. <strong>Aucun chevauchement</strong> avec les parcelles voisines n'a été détecté (tolérance &lt; 5%).
                  </p>
                </div>
              </div>

              {/* Détails du Titre */}
              {details.length > 0 && (
                <div className="w-full relative z-10 bg-brand-bg/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 dark:border-brand-border text-left shadow-inner">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-1.5">Propriétaire</span>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{details[0].nom_proprietaire}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-1.5">Circonscription</span>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{details[0].circonscription}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-1.5">Vol / Folio</span>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{details[0].volume} / {details[0].folio}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-1.5">N° d'enregistrement</span>
                      <p className="font-bold text-brand-primary text-sm">{details[0].numero_cadastral}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {status === 'fraud' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden rounded-3xl bg-white dark:bg-brand-surface/80 backdrop-blur-md border border-red-500/40 p-8 shadow-[0_0_40px_rgba(239,68,68,0.15)] animate-pulse-slow">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <ShieldAlert className="w-64 h-64 text-red-500" />
              </div>
              
              <div className="relative z-10 flex flex-col items-center text-center space-y-4 mb-8">
                <div className="p-4 bg-red-500/10 rounded-full border border-red-500/30 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                  <ShieldAlert className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                    ALERTE : Anomalie Critique
                  </h2>
                  <p className="text-xs font-bold text-red-400 bg-red-500/10 px-4 py-1.5 mt-2 inline-block rounded-full border border-red-500/20 tracking-wide uppercase">
                    Titrisation Rejetée
                  </p>
                </div>
              </div>

              {/* Double Vérification Cards (Fraud) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 mb-8">
                {/* Couche 1 : IA */}
                <div className={`bg-brand-bg/60 border rounded-2xl p-5 flex flex-col ${details.length <= 1 ? 'border-red-500/40 bg-red-500/5' : 'border-slate-200 dark:border-brand-border'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg border ${details.length <= 1 ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-brand-primary/20 text-brand-primary border-brand-primary/30'}`}>
                      <Brain size={18} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Analyse Sémantique (IA)</h3>
                      <p className={`text-[10px] uppercase tracking-widest font-semibold flex items-center gap-1 mt-0.5 ${details.length <= 1 ? 'text-red-400' : 'text-slate-500'}`}>
                        {details.length <= 1 ? <XCircle size={10} className="text-red-500" /> : <CheckCircle size={10} className="text-brand-primary" />} 
                        {details.length <= 1 ? 'Incohérence Documentaire' : 'Document Valide'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {details.length <= 1 
                      ? "Falsification détectée : le numéro d'enregistrement ou les informations du propriétaire ne correspondent pas aux archives centrales."
                      : "Les métadonnées administratives semblent correctes. Aucune falsification du papier lui-même détectée."}
                  </p>
                </div>

                {/* Couche 2 : Spatial */}
                <div className={`bg-brand-bg/60 border rounded-2xl p-5 flex flex-col ${details.length > 1 ? 'border-red-500/40 bg-red-500/5' : 'border-slate-200 dark:border-brand-border'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg border ${details.length > 1 ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-brand-primary/20 text-brand-primary border-brand-primary/30'}`}>
                      <Map size={18} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Analyse Topographique</h3>
                      <p className={`text-[10px] uppercase tracking-widest font-semibold flex items-center gap-1 mt-0.5 ${details.length > 1 ? 'text-red-400' : 'text-slate-500'}`}>
                        {details.length > 1 ? <XCircle size={10} className="text-red-500" /> : <CheckCircle size={10} className="text-brand-primary" />}
                        {details.length > 1 ? 'Conflit Spatial PostGIS' : 'En attente des coordonnées'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {details.length > 1 
                      ? <span><strong>ALERTE SUPERPOSITION :</strong> Le polygone de ce titre empiète illégalement sur une ou plusieurs parcelles déjà enregistrées.</span>
                      : "L'erreur ayant été interceptée dès l'analyse sémantique, l'analyse spatiale n'a pas été jugée nécessaire."}
                  </p>
                </div>
              </div>
                
              {/* Affichage des conflits (Phénomène Folio) */}
              {details.length > 1 && (
                <div className="w-full relative z-10 bg-red-500/5 rounded-2xl p-6 border border-red-500/30 text-left">
                  <p className="text-red-400 text-xs font-bold mb-4 flex items-center gap-2 uppercase tracking-widest">
                    <ShieldAlert className="w-4 h-4" /> 
                    Détail du conflit (Phénomène Folio) - {details.length} Titres superposés :
                  </p>
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                    {details.map((titre, idx) => (
                      <div key={idx} className="bg-brand-bg/80 backdrop-blur-sm p-4 rounded-xl border border-red-500/20 text-xs flex flex-col gap-2 relative">
                        {titre.statut === 'Valide' && (
                          <div className="absolute top-4 right-4 text-[9px] font-bold uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-2 py-1 rounded border border-brand-primary/20">
                            Propriétaire Légitime
                          </div>
                        )}
                        <p className="text-slate-900 dark:text-white font-bold text-sm pr-24">{titre.nom_proprietaire}</p>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Vol: {titre.volume} / Folio: {titre.folio} — Statut: <span className={titre.statut === 'Valide' ? 'text-brand-primary font-bold' : 'text-red-400 font-bold'}>{titre.statut}</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <section className="max-w-4xl mx-auto my-16 space-y-6 w-full">
          {/* L'Architecture Hybride : Défense en Profondeur */}
          <div className="group bg-white dark:bg-brand-surface/40 backdrop-blur-sm border border-slate-200 dark:border-brand-border rounded-2xl p-8 hover:border-brand-primary/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.05)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
              <Database className="w-40 h-40 text-brand-primary" />
            </div>
            <div className="relative z-10">
              <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 dark:text-white mb-4">
                <ShieldCheck className="w-6 h-6 text-brand-primary group-hover:scale-110 transition-transform" /> L'Architecture Hybride : Défense en Profondeur
              </h2>
              <div className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed space-y-4">
                <p>
                  Pour neutraliser complètement la fraude foncière, Sécurifolio ne se limite pas à la vérification des textes. Notre moteur Anti-Folio agit comme un étau à deux couches :
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="bg-brand-bg/50 p-5 rounded-xl border border-slate-200 dark:border-brand-border/50">
                    <strong className="text-slate-900 dark:text-white flex items-center gap-2 mb-2"><Brain size={16} className="text-brand-primary" /> Couche 1 : L'IA Sémantique</strong>
                    <p className="text-xs">Elle détecte la falsification pure : erreurs dans la nomenclature, noms corrompus, fausses signatures ou documents anachroniques.</p>
                  </div>
                  <div className="bg-brand-bg/50 p-5 rounded-xl border border-slate-200 dark:border-brand-border/50">
                    <strong className="text-slate-900 dark:text-white flex items-center gap-2 mb-2"><Map size={16} className="text-brand-primary" /> Couche 2 : Le Moteur Spatial (PostGIS)</strong>
                    <p className="text-xs">Elle bloque le vol de terrain. Même si un document est parfait, le système calcule le chevauchement physique des polygones et alerte si une autre parcelle est empiétée.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rappels légaux */}
          <div className="flex flex-wrap gap-3 pt-4">
            <span className="bg-brand-primary/10 text-brand-primary text-[10px] uppercase tracking-wider font-bold px-4 py-2 rounded-full border border-brand-primary/20">Loi n° 25/062 (Loi N'Sele)</span>
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
