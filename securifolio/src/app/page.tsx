import Link from "next/link";
import { 
  ArrowRight, 
  Scale, 
  Zap, 
  CheckCircle2, 
  ShieldAlert, 
  FileSearch, 
  Bot,
  Layers,
  Search
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 font-sans relative overflow-hidden pb-16 transition-colors duration-200">
      
      {/* Background Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 dark:opacity-60"></div>

      {/* Decorative Background Lights */}
      <div className="absolute top-0 right-10 w-[500px] h-[500px] bg-[#007FFF]/5 dark:bg-[#007FFF]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/4 left-10 w-[450px] h-[450px] bg-[#CE1126]/3 dark:bg-[#CE1126]/6 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/3 w-[400px] h-[400px] bg-[#F7D618]/3 dark:bg-[#F7D618]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-6 pt-16 md:pt-24 relative z-10 space-y-24">
        
        {/* HERO SECTION */}
        <section className="text-center max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
          
          {/* Badge */}
          <div className="inline-block bg-blue-50 dark:bg-blue-950/20 text-[#007FFF] dark:text-blue-400 border border-blue-200 dark:border-blue-900/30 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide">
            SÉCURIFOLIO RDC : Système de Sécurité et de Conformité Foncière
          </div>

          {/* Main Title */}
          <h1 className="font-display font-black text-[#0f172a] dark:text-white text-5xl md:text-7.5xl leading-tight tracking-tight">
            Sécurité Foncière &<br/>Analyse Foncière
          </h1>

          {/* Subtitle */}
          <div className="space-y-4 max-w-3xl mx-auto">
            <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl font-normal leading-relaxed">
              La plateforme institutionnelle pour la validation des titres, la sécurisation des archives et l&apos;assistance juridique du secteur foncier congolais.
            </p>
            <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-2xl shadow-sm text-left mt-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#007FFF]" /> Éradiquer l&apos;insécurité juridique en RDC
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Historiquement, le secteur foncier congolais souffre de défis majeurs : pertes d&apos;archives physiques, altérations manuelles de documents, et le fameux « phénomène Folio » (superposition de titres). <br className="hidden md:block"/>
                <strong className="text-slate-800 dark:text-slate-200 font-semibold">SÉCURIFOLIO RDC</strong> a été conçu comme la plateforme centralisée pour restaurer la confiance. Grâce à l&apos;intelligence artificielle et à l&apos;interconnexion avec le Registre Central, nous garantissons la transparence, l&apos;unicité foncière et la sécurité des investissements immobiliers.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              href="/anti-folio" 
              className="w-full sm:w-auto bg-[#0a192f] dark:bg-slate-900 hover:bg-[#112240] dark:hover:bg-slate-800 text-white font-bold py-3.5 px-8 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-sm transition-all"
            >
              <ShieldAlert size={15} />
              Lancer Anti-Folio
            </Link>
            <Link 
              href="/smart-archive" 
              className="w-full sm:w-auto border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold py-3.5 px-8 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all"
            >
              <FileSearch size={15} />
              Numérisation des Archives <ArrowRight size={14} className="text-slate-400" />
            </Link>
          </div>

          {/* Bottom Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-6">
            <span className="bg-red-50 dark:bg-red-950/20 text-[#CE1126] dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-full px-4 py-1.5 text-xs font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CE1126]"></span> Détection de Fraudes
            </span>
            <span className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900/30 rounded-full px-4 py-1.5 text-xs font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Extraction de Données
            </span>
            <span className="bg-blue-50 dark:bg-blue-950/20 text-[#007FFF] dark:text-blue-300 border border-blue-100 dark:border-blue-900/30 rounded-full px-4 py-1.5 text-xs font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#007FFF]"></span> Assistant Juridique en Ligne
            </span>
          </div>
        </section>

        {/* SERVICES ET MODULES */}
        <section className="space-y-10 text-center">
          <div className="space-y-4 max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
              Suite Outils SÉCURIFOLIO
            </div>
            <h2 className="font-display text-3xl md:text-4.5xl font-black text-[#0f172a] dark:text-white tracking-tight">
              Trois piliers pour assainir le foncier
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed">
              Une gamme de solutions technologiques intégrées pour résoudre les problèmes d&apos;archives altérées, de fraudes documentaires et de complexité juridique.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            
            {/* Anti-Folio */}
            <Link href="/anti-folio" className="group bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 hover:border-red-500/50 dark:hover:border-red-500/50 rounded-2xl p-8 space-y-6 shadow-sm transition-all duration-300">
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl inline-block border border-red-100 dark:border-red-900/30">
                <Search size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="font-display font-black text-slate-800 dark:text-white text-xl group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">Anti-Folio</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  Luttez contre la superposition de titres. Notre moteur vérifie l&apos;unicité de votre certificat foncier en temps réel pour garantir qu&apos;aucune autre personne ne revendique la même concession de bonne foi.
                </p>
              </div>
            </Link>

            {/* Smart-Archive */}
            <Link href="/smart-archive" className="group bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 hover:border-blue-500/50 dark:hover:border-blue-500/50 rounded-2xl p-8 space-y-6 shadow-sm transition-all duration-300">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl inline-block border border-blue-100 dark:border-blue-900/30">
                <Layers size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="font-display font-black text-slate-800 dark:text-white text-xl group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Smart-Archive</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  Sauvegardez le patrimoine foncier. Notre IA lit, structure et numérise instantanément les archives physiques, même détériorées, tout en détectant les falsifications visuelles (grattages, blanc correcteur).
                </p>
              </div>
            </Link>

            {/* Foncier-Édu */}
            <Link href="/assistant" className="group bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 hover:border-amber-500/50 dark:hover:border-amber-500/50 rounded-2xl p-8 space-y-6 shadow-sm transition-all duration-300">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl inline-block border border-amber-100 dark:border-amber-900/30">
                <Bot size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="font-display font-black text-slate-800 dark:text-white text-xl group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Foncier-Édu</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  Démocratisez l&apos;accès au droit. Un assistant juridique intelligent avec un verrou d&apos;intégrité strict, formé sur la législation congolaise pour éclairer les citoyens et orienter vers les Conservateurs officiels.
                </p>
              </div>
            </Link>

          </div>
        </section>

        {/* VALEUR AJOUTÉE DE LA PLATEFORME */}
        <section className="space-y-10 text-center">
          <div className="space-y-4 max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-block bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/30 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
              La technologie au service de l&apos;État
            </div>
            <h2 className="font-display text-3xl md:text-4.5xl font-black text-[#0f172a] dark:text-white tracking-tight">
              Pourquoi utiliser SÉCURIFOLIO RDC ?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed">
              SÉCURIFOLIO fiabilise et accélère le traitement des dossiers fonciers.
            </p>
          </div>

          {/* 4 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            
            {/* Card 1 */}
            <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 py-8 space-y-5 shadow-sm">
              <div className="bg-blue-50 dark:bg-blue-950/20 text-[#007FFF] w-10 h-10 rounded-full flex items-center justify-center border border-blue-100 dark:border-blue-900/30">
                <Zap size={18} />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">Vitesse de Traitement</h4>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed font-medium">
                  Indexation automatique et extraction des données des livrets volumineux en quelques secondes, optimisant les délais administratifs.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 py-8 space-y-5 shadow-sm">
              <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 w-10 h-10 rounded-full flex items-center justify-center border border-emerald-200 dark:border-emerald-900/30">
                <CheckCircle2 size={18} />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">Fiabilité des Données</h4>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed font-medium">
                  L&apos;extraction numérique automatique limite les erreurs de retranscription d&apos;archives anciennes et de croquis manuscrits altérés.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 py-8 space-y-5 shadow-sm">
              <div className="bg-amber-50 dark:bg-amber-950/20 text-[#d97706] w-10 h-10 rounded-full flex items-center justify-center border border-amber-100 dark:border-amber-900/30">
                <Scale size={18} />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">Expertise Juridique Continue</h4>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed font-medium">
                  Un module d&apos;assistance juridique actualisé en continu sur la jurisprudence et les arrêtés ministériels pour guider les agents de l&apos;administration.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 py-8 space-y-5 shadow-sm">
              <div className="bg-red-50 dark:bg-red-950/20 text-red-650 w-10 h-10 rounded-full flex items-center justify-center border border-red-100 dark:border-red-900/30">
                <ShieldAlert size={18} />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">Sécurité des Titres</h4>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed font-medium">
                  Identification précoce d&apos;anomalies de formats, numéros de volume erronés ou signatures suspectes pour bloquer toute tentative de fraude ou de double enregistrement.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* FOOTER */}
        <footer className="text-center pt-16 border-t border-slate-200 dark:border-slate-900 text-slate-450 dark:text-slate-500 text-xs space-y-2 font-medium">
          <p>
            SÉCURIFOLIO RDC — Système de numérisation et de conformité foncière.
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-600">
            Conçu pour le traitement des archives et la conformité foncière. © 2026 Tous droits réservés.
          </p>
        </footer>

      </div>
    </div>
  );
}
