import { Shield } from "lucide-react";

export default function TermsOfUse() {
  return (
    <div className="w-full flex-1 pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-brand-surface p-3 rounded-xl border border-brand-border">
            <Shield className="text-brand-primary" size={32} />
          </div>
          <div>
            <h1 className="font-display font-bold text-3xl text-brand-text">Conditions d'Utilisation</h1>
            <p className="text-brand-primary font-mono text-sm mt-1">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
          </div>
        </div>

        <div className="prose prose-invert prose-slate max-w-none prose-headings:font-display prose-headings:text-brand-text prose-a:text-brand-primary hover:prose-a:text-brand-accent space-y-8">
          <section className="bg-brand-surface/50 border border-brand-border/50 p-8 rounded-2xl">
            <h2 className="font-display text-xl font-bold text-brand-text mb-4">1. Objet</h2>
            <p className="text-brand-text leading-relaxed">
              Les présentes Conditions d'Utilisation régissent l'accès et l'utilisation de la plateforme <strong>Sécurifolio RDC</strong>. En accédant à nos services, vous acceptez d'être lié par ces conditions. Sécurifolio RDC est un outil d'authentification et de numérisation destiné à moderniser la gestion foncière en République Démocratique du Congo.
            </p>
          </section>

          <section className="bg-brand-surface/50 border border-brand-border/50 p-8 rounded-2xl">
            <h2 className="font-display text-xl font-bold text-brand-text mb-4">2. Accès aux Services</h2>
            <p className="text-brand-text leading-relaxed">
              L'accès à certaines fonctionnalités avancées (notamment Smart-Archive) peut être restreint aux agents assermentés de l'État ou nécessiter une authentification gouvernementale. Vous vous engagez à ne pas tenter d'accéder sans autorisation aux systèmes sous-jacents ou à contourner les mesures de sécurité.
            </p>
          </section>

          <section className="bg-brand-surface/50 border border-brand-border/50 p-8 rounded-2xl">
            <h2 className="font-display text-xl font-bold text-brand-text mb-4">3. Responsabilités de l'Utilisateur</h2>
            <p className="text-brand-text leading-relaxed mb-4">En utilisant Sécurifolio RDC, vous vous engagez à :</p>
            <ul className="list-disc list-inside text-brand-text space-y-2 ml-4">
              <li>Ne soumettre que des documents et des requêtes légitimes.</li>
              <li>Ne pas introduire de données fausses, altérées, ou de nature à corrompre les bases de données foncières.</li>
              <li>Signaler immédiatement toute faille de sécurité ou activité suspecte constatée.</li>
            </ul>
          </section>

          <section className="bg-brand-surface/50 border border-brand-border/50 p-8 rounded-2xl">
            <h2 className="font-display text-xl font-bold text-brand-text mb-4">4. Limitations liées à l'IA (Foncier-Édu)</h2>
            <p className="text-brand-text leading-relaxed">
              Le module <strong>Foncier-Édu</strong> utilise des technologies d'Intelligence Artificielle pour fournir des informations et analyser des documents basés sur les lois foncières de la RDC. Ces informations sont fournies à titre <strong>indicatif et éducatif</strong>. Elles ne sauraient se substituer à un avis juridique professionnel, à un décret officiel ou à une décision de justice.
            </p>
          </section>

          <section className="bg-brand-surface/50 border border-brand-border/50 p-8 rounded-2xl">
            <h2 className="font-display text-xl font-bold text-brand-text mb-4">5. Propriété Intellectuelle</h2>
            <p className="text-brand-text leading-relaxed">
              L'architecture technologique, le code source, et le design "Dark Luxe Tech" de la plateforme ont été conçus par <strong>PNL Consulting</strong>. Les données foncières, archives, lois et contenus officiels demeurent la propriété exclusive et inaliénable de la République Démocratique du Congo.
            </p>
          </section>

          <section className="bg-brand-surface/50 border border-brand-border/50 p-8 rounded-2xl">
            <h2 className="font-display text-xl font-bold text-brand-text mb-4">6. Modification des Conditions</h2>
            <p className="text-brand-text leading-relaxed">
              Sécurifolio RDC se réserve le droit de modifier ces conditions à tout moment pour les adapter aux évolutions légales ou techniques. L'utilisation continue de la plateforme après modification vaut acceptation des nouvelles conditions.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
