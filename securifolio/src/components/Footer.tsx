import Link from "next/link";
import { BookOpen, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-brand-border/80 bg-brand-bg py-12 lg:py-16 mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8">
          
          {/* Logo & Description */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-3 group inline-flex">
              <div className="relative flex items-center justify-center w-8 h-8 group-hover:scale-105 transition-transform duration-200">
                <BookOpen size={30} className="text-brand-primary" strokeWidth={2} />
              </div>
              <div>
                <h1 className="font-display font-black text-sm text-brand-text tracking-tight">
                  Sécurifolio <span className="text-brand-primary">RDC</span>
                </h1>
                <p className="text-[9px] text-brand-text-muted font-bold uppercase tracking-wider -mt-0.5">
                  Affaires Foncières
                </p>
              </div>
            </Link>
            <p className="text-brand-text-muted text-sm leading-relaxed mt-4">
              Infrastructure de Traitement Sécurisé et de Numérisation du Ministère des Affaires Foncières de la RDC.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-4 md:col-span-1">
            <h3 className="text-brand-text font-display font-bold tracking-wider text-sm uppercase">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/anti-folio" className="text-brand-text-muted hover:text-brand-primary transition-colors text-sm">
                  Vérification Anti-Folio
                </Link>
              </li>
              <li>
                <Link href="/smart-archive" className="text-brand-text-muted hover:text-brand-primary transition-colors text-sm">
                  Smart-Archive
                </Link>
              </li>
              <li>
                <Link href="/assistant" className="text-brand-text-muted hover:text-brand-primary transition-colors text-sm">
                  Assistant Foncier-Édu
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4 md:col-span-1">
            <h3 className="text-brand-text font-display font-bold tracking-wider text-sm uppercase">Légal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-brand-text-muted hover:text-brand-primary transition-colors text-sm">
                  Politique de Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-brand-text-muted hover:text-brand-primary transition-colors text-sm">
                  Conditions d'Utilisation
                </Link>
              </li>
              <li>
                <Link href="/legal" className="text-brand-text-muted hover:text-brand-primary transition-colors text-sm">
                  Mentions Légales
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4 md:col-span-1">
            <h3 className="text-brand-text font-display font-bold tracking-wider text-sm uppercase">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-brand-text-muted text-sm">
                <Mail size={16} className="text-brand-primary mt-0.5 shrink-0" />
                <a href="mailto:pascalntwali@hotmail.com" className="hover:text-brand-primary transition-colors break-all">
                  pascalntwali@hotmail.com
                </a>
              </li>
              <li className="flex items-start gap-3 text-brand-text-muted text-sm">
                <MapPin size={16} className="text-brand-primary mt-0.5 shrink-0" />
                <span>
                  Ministère des Affaires Foncières<br />
                  Kinshasa, RDC
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-brand-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-xs text-center md:text-left leading-relaxed">
            © {new Date().getFullYear()} Sécurifolio RDC. Tous droits réservés.<br className="md:hidden" />
            <span className="hidden md:inline"> | </span>Conçue par <a href="https://www.pnlconsulting.online/" target="_blank" rel="noopener noreferrer" className="text-brand-text-muted font-semibold hover:text-brand-primary transition-colors">PNL Consulting</a>
          </p>
          <div className="flex items-center gap-2 text-xs font-mono text-brand-primary/60">
            <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></span>
            SYSTÈME SÉCURISÉ ACTIF
          </div>
        </div>
      </div>
    </footer>
  );
}
