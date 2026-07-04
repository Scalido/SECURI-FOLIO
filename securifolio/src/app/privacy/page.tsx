import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-brand-surface p-3 rounded-xl border border-brand-border">
            <Shield className="text-brand-primary" size={32} />
          </div>
          <div>
            <h1 className="font-display font-bold text-3xl text-brand-text">Politique de Confidentialité</h1>
            <p className="text-brand-primary font-mono text-sm mt-1">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
          </div>
        </div>

        <div className="prose prose-invert prose-slate max-w-none prose-headings:font-display prose-headings:text-brand-text prose-a:text-brand-primary hover:prose-a:text-brand-accent space-y-8">
          <section className="bg-brand-surface/50 border border-brand-border/50 p-8 rounded-2xl">
            <h2 className="font-display text-xl font-bold text-brand-text mb-4">1. Introduction</h2>
            <p className="text-brand-text leading-relaxed">
              La présente Politique de Confidentialité décrit la manière dont <strong>Sécurifolio RDC</strong>, une infrastructure numérique déployée pour le Ministère des Affaires Foncières de la République Démocratique du Congo et conçue par PNL Consulting, collecte, utilise et protège vos données personnelles.
            </p>
          </section>

          <section className="bg-brand-surface/50 border border-brand-border/50 p-8 rounded-2xl">
            <h2 className="font-display text-xl font-bold text-brand-text mb-4">2. Données Collectées</h2>
            <p className="text-brand-text leading-relaxed mb-4">
              Dans le cadre de l'utilisation de nos services (Anti-Folio, Smart-Archive, Foncier-Édu), nous pouvons être amenés à collecter :
            </p>
            <ul className="list-disc list-inside text-brand-text space-y-2 ml-4">
              <li><strong>Données documentaires :</strong> Numéros de certificats d'enregistrement, croquis cadastraux, et métadonnées extraites via Smart-Archive.</li>
              <li><strong>Données de navigation :</strong> Adresses IP, journaux de connexion et requêtes soumises à l'assistant IA (Foncier-Édu) pour l'amélioration du service.</li>
              <li><strong>Informations de contact :</strong> Si vous interagissez avec le support technique ou nos services administratifs.</li>
            </ul>
          </section>

          <section className="bg-brand-surface/50 border border-brand-border/50 p-8 rounded-2xl">
            <h2 className="font-display text-xl font-bold text-brand-text mb-4">3. Utilisation des Données</h2>
            <p className="text-brand-text leading-relaxed mb-4">Vos données sont exclusivement utilisées pour :</p>
            <ul className="list-disc list-inside text-brand-text space-y-2 ml-4">
              <li>L'authentification et la vérification des titres fonciers pour lutter contre la fraude (Anti-Folio).</li>
              <li>La numérisation et l'indexation intelligente des archives foncières (Smart-Archive).</li>
              <li>Fournir des réponses contextuelles et pertinentes via notre assistant IA (Foncier-Édu).</li>
              <li>La maintenance, la sécurité et l'optimisation technique de la plateforme.</li>
            </ul>
          </section>

          <section className="bg-brand-surface/50 border border-brand-border/50 p-8 rounded-2xl">
            <h2 className="font-display text-xl font-bold text-brand-text mb-4">4. Sécurité et Protection</h2>
            <p className="text-brand-text leading-relaxed">
              Sécurifolio RDC met en œuvre des mesures de sécurité de pointe (chiffrement des données en transit et au repos, protocoles d'accès stricts) pour prévenir tout accès non autorisé, altération ou fuite des informations foncières sensibles. L'infrastructure est auditée en continu pour garantir son intégrité.
            </p>
          </section>

          <section className="bg-brand-surface/50 border border-brand-border/50 p-8 rounded-2xl">
            <h2 className="font-display text-xl font-bold text-brand-text mb-4">5. Partage des Données</h2>
            <p className="text-brand-text leading-relaxed">
              Nous ne vendons, ne louons, ni ne commercialisons vos données. Celles-ci peuvent uniquement être partagées avec les autorités gouvernementales compétentes de la RDC dans le cadre strict de l'administration foncière ou sur injonction légale.
            </p>
          </section>

          <section className="bg-brand-surface/50 border border-brand-border/50 p-8 rounded-2xl">
            <h2 className="font-display text-xl font-bold text-brand-text mb-4">6. Vos Droits</h2>
            <p className="text-brand-text leading-relaxed">
              Conformément aux réglementations en vigueur, vous disposez d'un droit d'accès, de rectification et, le cas échéant, de suppression de vos données personnelles non soumises à l'obligation d'archivage d'État. Pour toute requête, contactez : <a href="mailto:pascalntwali@hotmail.com" className="text-brand-primary">pascalntwali@hotmail.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
