import Link from "next/link";
import { 
  Scale, 
  Zap, 
  CheckCircle2, 
  ShieldAlert, 
  FileSearch, 
  Bot,
  Lock,
  Database
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-brand-bg text-slate-600 dark:text-slate-300 font-sans selection:bg-brand-primary/30 selection:text-brand-primary overflow-x-hidden">
      
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-primary/5 blur-[120px] rounded-full pointer-events-none" />

      {/* HEADER SECTION */}
      <header className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-brand-primary/30 bg-brand-primary/5 text-brand-primary text-sm font-medium tracking-wide uppercase mb-10 shadow-[0_0_15px_rgba(16,185,129,0.15)] backdrop-blur-sm">
            <Lock size={16} />
            Système Foncier Sécurisé
          </div>

          <h1 className="font-display font-black text-slate-900 dark:text-white text-5xl md:text-7xl lg:text-8xl leading-[1.1] tracking-tight max-w-5xl">
            L&apos;Intégrité Numérique <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">du Foncier Congolais</span>
          </h1>

          <p className="mt-8 text-slate-500 dark:text-slate-400 text-lg md:text-2xl font-light leading-relaxed max-w-3xl">
            La plateforme institutionnelle haute sécurité pour la validation des titres, la protection des archives et l&apos;assistance juridique.
          </p>
          
          <div className="mt-14 flex flex-col sm:flex-row gap-6">
            <Link 
              href="/smart-archive" 
              className="group relative inline-flex items-center justify-center gap-3 bg-brand-primary text-slate-900 dark:text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-brand-secondary transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
            >
              <Database size={20} className="group-hover:animate-pulse" />
              Accéder aux Archives
            </Link>
            
            <Link 
              href="/anti-folio" 
              className="group inline-flex items-center justify-center gap-3 bg-transparent border border-slate-700 text-slate-900 dark:text-white px-8 py-4 rounded-xl font-bold text-lg hover:border-brand-primary/50 hover:bg-brand-primary/10 transition-all duration-300"
            >
              <ShieldAlert size={20} className="text-brand-primary" />
              Vérifier un Titre
            </Link>
          </div>
        </div>
      </header>

      {/* THREE PILLARS SECTION */}
      <section className="py-24 px-6 relative border-t border-slate-200 dark:border-brand-border/50 bg-white dark:bg-brand-surface/30">
        <div className="max-w-7xl mx-auto">
          
          <div className="mb-16 flex flex-col items-center text-center space-y-4">
            <h2 className="font-display text-3xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
              Périmètre de Sécurité
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl max-w-2xl font-light">
              Des modules spécialisés pour auditer, protéger et clarifier la situation juridique des concessions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Anti-Folio */}
            <Link href="/anti-folio" className="group bg-white dark:bg-brand-surface border border-slate-200 dark:border-brand-border hover:border-brand-primary/50 rounded-2xl p-8 space-y-6 transition-all duration-300 hover:shadow-[0_0_25px_rgba(16,185,129,0.1)] block relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary/0 group-hover:bg-brand-primary transition-all duration-300" />
              <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-xl inline-block border border-brand-primary/20">
                <ShieldAlert size={28} />
              </div>
              <div className="space-y-3">
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-2xl group-hover:text-brand-primary transition-colors">Anti-Folio</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  Détection algorithmique des superpositions. Vérifiez l&apos;unicité d&apos;un certificat foncier pour garantir qu&apos;aucune autre personne ne revendique la même parcelle.
                </p>
              </div>
            </Link>

            {/* Smart-Archive */}
            <Link href="/smart-archive" className="group bg-white dark:bg-brand-surface border border-slate-200 dark:border-brand-border hover:border-brand-primary/50 rounded-2xl p-8 space-y-6 transition-all duration-300 hover:shadow-[0_0_25px_rgba(16,185,129,0.1)] block relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary/0 group-hover:bg-brand-primary transition-all duration-300" />
              <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-xl inline-block border border-brand-primary/20">
                <FileSearch size={28} />
              </div>
              <div className="space-y-3">
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-2xl group-hover:text-brand-primary transition-colors">Smart-Archive</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  Numérisation et extraction OCR des livrets cadastraux. Remplacez la fouille manuelle par une recherche instantanée sur des archives infalsifiables.
                </p>
              </div>
            </Link>

            {/* Foncier-Edu */}
            <Link href="/assistant" className="group bg-white dark:bg-brand-surface border border-slate-200 dark:border-brand-border hover:border-brand-accent/50 rounded-2xl p-8 space-y-6 transition-all duration-300 hover:shadow-[0_0_25px_rgba(245,158,11,0.1)] block relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-accent/0 group-hover:bg-brand-accent transition-all duration-300" />
              <div className="p-3 bg-brand-accent/10 text-brand-accent rounded-xl inline-block border border-brand-accent/20">
                <Bot size={28} />
              </div>
              <div className="space-y-3">
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-2xl group-hover:text-brand-accent transition-colors">Foncier-Édu</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  Assistant d&apos;intelligence artificielle spécialisé dans la législation congolaise pour éclairer les citoyens et assister les agents de l&apos;État.
                </p>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* METRICS SECTION */}
      <section className="py-24 px-6 border-t border-slate-200 dark:border-brand-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-white dark:bg-brand-surface border border-slate-200 dark:border-brand-border rounded-2xl p-6 flex items-start space-x-4 hover:border-brand-primary/30 transition-colors">
              <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg">
                <Zap size={20} />
              </div>
              <div>
                <h4 className="font-display font-bold text-slate-900 dark:text-white text-lg">Vitesse</h4>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 leading-relaxed">Extraction immédiate des archives volumineuses.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-brand-surface border border-slate-200 dark:border-brand-border rounded-2xl p-6 flex items-start space-x-4 hover:border-brand-primary/30 transition-colors">
              <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h4 className="font-display font-bold text-slate-900 dark:text-white text-lg">Fiabilité</h4>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 leading-relaxed">Réduction drastique des erreurs de retranscription.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-brand-surface border border-slate-200 dark:border-brand-border rounded-2xl p-6 flex items-start space-x-4 hover:border-brand-accent/30 transition-colors">
              <div className="p-2 bg-brand-accent/10 text-brand-accent rounded-lg">
                <Scale size={20} />
              </div>
              <div>
                <h4 className="font-display font-bold text-slate-900 dark:text-white text-lg">Conformité</h4>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 leading-relaxed">Alignement continu avec les arrêtés ministériels.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-brand-surface border border-slate-200 dark:border-brand-border rounded-2xl p-6 flex items-start space-x-4 hover:border-red-500/30 transition-colors">
              <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h4 className="font-display font-bold text-slate-900 dark:text-white text-lg">Protection</h4>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 leading-relaxed">Blocage anticipé des superpositions de titres.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
