'use client';

import { useState, useEffect } from 'react';
import { checkCadastralNumber, saveScanHistory, getScanHistory } from './actions';
import { Search, ShieldAlert, ShieldCheck, Loader2, Clock, Brain, Map, CheckCircle, Database, BookOpen } from 'lucide-react';
import { classifyTitleResults, type VerificationStatus } from './verification';

export default function AntiFolioPage() {
  const [query, setQuery] = useState('');
  const [circonscription, setCirconscription] = useState('all');
  const [status, setStatus] = useState<'idle' | 'loading' | VerificationStatus>('idle');
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
    const linkedQuery = new URLSearchParams(window.location.search).get('q')?.trim();
    if (linkedQuery) {
      setQuery(linkedQuery);
      void runSearch(linkedQuery, 'all');
    }
  // Run the linked query once on arrival; subsequent searches use the form.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSearch = async (search: string, selectedZone: string) => {
    if (!search.trim()) return;
    setStatus('loading');
    setDetails([]);

    try {
      const results = await checkCadastralNumber(search.trim(), selectedZone);
      const currentStatus = classifyTitleResults(results);
      setDetails(results || []);
      setStatus(currentStatus);

      if (currentStatus === 'valid' || currentStatus === 'pending' || currentStatus === 'falsified') {
        try {
          await saveScanHistory(search.trim(), currentStatus === 'falsified' ? 'fraud' : currentStatus);
          const newHistory = await getScanHistory();
          setHistory(newHistory || []);
        } catch (historyError) {
          console.error('Historique indisponible :', historyError);
        }
      }

    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void runSearch(query, circonscription);
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
            Consultation des titres fonciers enregistrés. Le résultat reprend le statut disponible dans le registre et peut nécessiter une vérification administrative.
          </p>
        </div>

        {/* Barre de recherche et Filtres */}
        <div className="w-full max-w-2xl relative space-y-3">
          <form onSubmit={handleSearch} className="relative bg-white dark:bg-brand-surface/50 backdrop-blur-xl border border-slate-200 dark:border-brand-border rounded-3xl p-2.5 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-center transition-all focus-within:border-brand-primary/50 focus-within:shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            
            {/* Selecteur de Circonscription */}
            <div className="w-full sm:w-1/3 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-brand-border/50 p-1 mb-2 sm:mb-0">
              <select 
                className="w-full bg-transparent border-none py-2.5 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-0 text-xs font-bold uppercase tracking-wider appearance-none cursor-pointer"
                value={circonscription}
                onChange={(e) => setCirconscription(e.target.value)}
              >
                <option value="all" className="text-slate-900">National (Toutes zones)</option>
                <option value="Gombe" className="text-slate-900">Kinshasa - Gombe</option>
                <option value="Ngaliema" className="text-slate-900">Kinshasa - Ngaliema</option>
                <option value="Goma" className="text-slate-900">Nord-Kivu - Goma</option>
                <option value="Lubumbashi" className="text-slate-900">Lubumbashi</option>
              </select>
            </div>

            <div className="pl-4 text-brand-primary hidden sm:block">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="N° de volume/folio ou parcelle (ex: Vol AMA 171 Folio 68)"
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
                'Rechercher le Titre'
              )}
            </button>
          </form>

          {/* Formats acceptés */}
          <div className="px-4 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Formats acceptés : <strong className="text-brand-primary">Vol XXX Folio YY</strong> (ex: Vol AMA 171 Folio 68) ou <strong className="text-brand-primary">Numéro cadastral</strong> (ex: 1178).
          </div>

          {/* Disclaimer d'Intégrité */}
          <div className="flex items-start gap-2 px-4">
             <ShieldAlert size={14} className="text-brand-accent mt-0.5 shrink-0" />
             <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
               <strong className="text-slate-400">Portée de la consultation :</strong> Une absence de résultat ne prouve ni la fraude ni l'inexistence du titre. Consultez la conservation compétente pour une confirmation officielle.
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
                    title={item.resultat === 'fraud' ? 'Résultat historique à reconfirmer' : undefined}
                    onClick={() => {
                      setQuery(item.numero_cadastral);
                    }}
                    className={`flex items-center gap-2 text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg border transition-colors hover:opacity-80 ${
                      item.resultat === 'valid' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
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
                    TITRE ENREGISTRÉ
                  </h2>
                  <p className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-4 py-1.5 mt-2 inline-block rounded-full border border-brand-primary/20 tracking-wide uppercase">
                    Statut du registre : Valide
                  </p>
                </div>
              </div>

              {/* Portée de la consultation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 mb-8">
                {/* Statut administratif */}
                <div className="bg-brand-bg/60 border border-slate-200 dark:border-brand-border rounded-2xl p-5 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-brand-primary/20 text-brand-primary rounded-lg border border-brand-primary/30">
                      <Database size={18} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Registre des titres</h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1 mt-0.5">
                        <CheckCircle size={10} className="text-brand-primary" /> Statut enregistré
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Ce titre porte le statut « Valide » dans les données consultées. Cette recherche ne vérifie pas l'authenticité d'un document présenté.
                  </p>
                </div>

                {/* Limites de la consultation */}
                <div className="bg-brand-bg/60 border border-slate-200 dark:border-brand-border rounded-2xl p-5 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-brand-primary/20 text-brand-primary rounded-lg border border-brand-primary/30">
                      <Map size={18} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Vérification complémentaire</h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1 mt-0.5">
                        <Clock size={10} className="text-brand-primary" /> À confirmer auprès du service compétent
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    La recherche dans le registre ne constitue pas une analyse des limites de la parcelle ni une attestation de l'absence de conflit.
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

          {status === 'pending' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden rounded-3xl bg-white dark:bg-brand-surface/80 backdrop-blur-md border border-amber-500/40 p-8 shadow-[0_0_40px_rgba(245,158,11,0.15)] animate-pulse-slow">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <ShieldAlert className="w-64 h-64 text-amber-500" />
              </div>
              
              <div className="relative z-10 flex flex-col items-center text-center space-y-4 mb-8">
                <div className="p-4 bg-amber-500/10 rounded-full border border-amber-500/30 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                  <Clock className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                    EN ATTENTE DE VALIDATION
                  </h2>
                  <p className="text-xs font-bold text-amber-500 bg-amber-500/10 px-4 py-1.5 mt-2 inline-block rounded-full border border-amber-500/20 tracking-wide uppercase">
                    Statut du registre : {details[0]?.statut}
                  </p>
                </div>
              </div>

              {/* Portée de la consultation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 mb-8">
                {/* Couche 1 : IA */}
                <div className="bg-brand-bg/60 border border-slate-200 dark:border-brand-border rounded-2xl p-5 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg border border-amber-500/30">
                      <Brain size={18} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Registre des titres</h3>
                      <p className="text-[10px] uppercase tracking-widest font-semibold flex items-center gap-1 mt-0.5 text-amber-500">
                        <Clock size={10} className="text-amber-500" /> Validation en cours
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Le titre porte un statut intermédiaire dans le registre. Il ne peut pas encore être présenté comme définitivement validé.
                  </p>
                </div>

                {/* Couche 2 : Spatial */}
                <div className="bg-brand-bg/60 border border-slate-200 dark:border-brand-border rounded-2xl p-5 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg border border-amber-500/30">
                      <Map size={18} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Vérification complémentaire</h3>
                      <p className="text-[10px] uppercase tracking-widest font-semibold flex items-center gap-1 mt-0.5 text-amber-500">
                        <Clock size={10} className="text-amber-500" /> Non attestée ici
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Aucune conclusion spatiale ou documentaire ne découle de cette consultation. Renseignez-vous auprès de la conservation compétente.
                  </p>
                </div>
              </div>
                
              {/* Détails du Titre */}
              {details.length > 0 && (
                <div className="w-full relative z-10 bg-brand-bg/80 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/20 text-left shadow-inner">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] font-bold block mb-1.5">Propriétaire</span>
                      <p className="font-bold text-slate-900 dark:text-white text-sm opacity-50">{details[0].nom_proprietaire} (Non validé)</p>
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
                      <p className="font-bold text-amber-500 text-sm">{details[0].numero_cadastral}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {(status === 'falsified' || status === 'disputed') && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden rounded-3xl bg-white dark:bg-brand-surface/80 backdrop-blur-md border border-red-500/40 p-8 shadow-[0_0_40px_rgba(239,68,68,0.15)]">
              <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldAlert className="w-64 h-64 text-red-500" /></div>
              <div className="relative z-10 flex flex-col items-center text-center space-y-4 mb-8">
                <div className="p-4 bg-red-500/10 rounded-full border border-red-500/30 text-red-500"><ShieldAlert className="w-10 h-10" /></div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                    {status === 'falsified' ? 'STATUT : FALSIFIÉ' : 'STATUT : LITIGE'}
                  </h2>
                  <p className="text-xs font-bold text-red-400 bg-red-500/10 px-4 py-1.5 mt-2 inline-block rounded-full border border-red-500/20 tracking-wide uppercase">
                    Statut enregistré dans le registre
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 mb-8">
                <div className="bg-brand-bg/60 border border-red-500/40 rounded-2xl p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">Donnée consultée</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Ce titre porte le statut « {details[0]?.statut} » dans le registre. Le motif et les pièces justificatives doivent être confirmés par le service compétent.
                  </p>
                </div>
                <div className="bg-brand-bg/60 border border-slate-200 dark:border-brand-border rounded-2xl p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">Portée</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Cette consultation ne constitue ni une expertise documentaire ni une analyse de chevauchement des parcelles.
                  </p>
                </div>
              </div>
              <div className="w-full relative z-10 bg-red-500/5 rounded-2xl p-6 border border-red-500/30 text-left text-xs">
                <p className="text-slate-900 dark:text-white font-bold text-sm">{details[0]?.numero_cadastral}</p>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Vol : {details[0]?.volume} / Folio : {details[0]?.folio} — {details[0]?.circonscription}</p>
              </div>
            </div>
          )}

          {(['missing', 'error', 'multiple', 'unknown'] as VerificationStatus[]).includes(status as VerificationStatus) && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden rounded-3xl bg-white dark:bg-brand-surface/80 backdrop-blur-md border border-amber-500/40 p-8 shadow-[0_0_40px_rgba(245,158,11,0.15)]">
              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-amber-500/10 rounded-full border border-amber-500/30 text-amber-500"><ShieldAlert className="w-10 h-10" /></div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                  {status === 'missing' ? 'Aucun titre trouvé' : status === 'error' ? 'Recherche indisponible' : status === 'multiple' ? 'Plusieurs titres trouvés' : 'Statut à confirmer'}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl">
                  {status === 'missing' ? "Aucun enregistrement ne correspond à cette recherche dans les données accessibles. Cela ne prouve pas que le titre est frauduleux ou inexistant."
                    : status === 'error' ? 'La consultation a échoué. Veuillez réessayer ou contacter le service compétent.'
                    : status === 'multiple' ? 'Plusieurs enregistrements correspondent au volume et au folio saisis. Une vérification administrative est nécessaire ; aucun chevauchement spatial ne peut en être déduit.'
                    : `Le statut « ${details[0]?.statut ?? 'non renseigné'} » nécessite une vérification administrative.`}
                </p>
              </div>
              {status === 'multiple' && (
                <div className="relative z-10 mt-8 space-y-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                  {details.map((titre, idx) => (
                    <div key={titre.id || idx} className="bg-brand-bg/80 p-4 rounded-xl border border-amber-500/20 text-xs">
                      <p className="text-slate-900 dark:text-white font-bold">{titre.numero_cadastral}</p>
                      <p className="text-slate-500 dark:text-slate-400">{titre.circonscription} — Statut : {titre.statut}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <section className="max-w-4xl mx-auto my-16 space-y-12 w-full">
          {/* Section: Comment ça fonctionne */}
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 text-center flex items-center justify-center gap-3">
              <BookOpen className="w-6 h-6 text-brand-primary" />
              Comment fonctionne la consultation Anti-Folio ?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6 relative">
              {/* Ligne de connexion visuelle (desktop) */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent -translate-y-1/2 z-0" />
              
              {/* Etape 1 */}
              <div className="bg-white dark:bg-brand-surface/60 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-brand-border shadow-lg relative z-10 hover:border-brand-primary/50 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-500 group-hover:text-brand-primary group-hover:bg-brand-primary/10 transition-colors border border-slate-200 dark:border-brand-border">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-wide">1. Interrogation</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  L'utilisateur saisit un numéro cadastral ou un volume et folio. Le système recherche les enregistrements accessibles dans le registre.
                </p>
              </div>

              {/* Etape 2 */}
              <div className="bg-white dark:bg-brand-surface/60 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-brand-border shadow-lg relative z-10 hover:border-brand-primary/50 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-500 group-hover:text-brand-primary group-hover:bg-brand-primary/10 transition-colors border border-slate-200 dark:border-brand-border">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-wide">2. Lecture du statut</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Le résultat indique le statut administratif enregistré : valide, en attente, litige ou falsifié. Il ne certifie pas le document présenté.
                </p>
              </div>

              {/* Etape 3 */}
              <div className="bg-white dark:bg-brand-surface/60 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-brand-border shadow-lg relative z-10 hover:border-brand-primary/50 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-500 group-hover:text-brand-primary group-hover:bg-brand-primary/10 transition-colors border border-slate-200 dark:border-brand-border">
                  <Map className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-wide">3. Confirmation officielle</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Pour une transaction ou un désaccord, la conservation compétente confirme les pièces, les droits et les limites de la parcelle.
                </p>
              </div>
            </div>
          </div>

          {/* L'Architecture Hybride : Défense en Profondeur */}
          <div className="group bg-white dark:bg-brand-surface/40 backdrop-blur-sm border border-slate-200 dark:border-brand-border rounded-2xl p-8 hover:border-brand-primary/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.05)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
              <Database className="w-40 h-40 text-brand-primary" />
            </div>
            <div className="relative z-10">
              <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 dark:text-white mb-4">
                <ShieldCheck className="w-6 h-6 text-brand-primary group-hover:scale-110 transition-transform" /> Portée de la recherche
              </h2>
              <div className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed space-y-4">
                <p>
                  Cette recherche donne un premier accès aux données disponibles. Une absence de résultat ou plusieurs résultats appellent une vérification administrative.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="bg-brand-bg/50 p-5 rounded-xl border border-slate-200 dark:border-brand-border/50">
                    <strong className="text-slate-900 dark:text-white flex items-center gap-2 mb-2"><Database size={16} className="text-brand-primary" /> Statut du registre</strong>
                    <p className="text-xs">Le statut affiché est celui de l'enregistrement consulté. Il ne résulte pas d'une expertise de signature ou de document.</p>
                  </div>
                  <div className="bg-brand-bg/50 p-5 rounded-xl border border-slate-200 dark:border-brand-border/50">
                    <strong className="text-slate-900 dark:text-white flex items-center gap-2 mb-2"><Map size={16} className="text-brand-primary" /> Limites spatiales</strong>
                    <p className="text-xs">Cette consultation n'établit pas les limites de parcelle et ne conclut pas à l'absence ou à l'existence d'un chevauchement.</p>
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
