import { Shield } from "lucide-react";

export default function LegalNotice() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-brand-surface p-3 rounded-xl border border-brand-border">
            <Shield className="text-brand-primary" size={32} />
          </div>
          <div>
            <h1 className="font-display font-bold text-3xl text-brand-text">Mentions Légales</h1>
            <p className="text-brand-primary font-mono text-sm mt-1">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
          </div>
        </div>

        <div className="prose prose-invert prose-slate max-w-none prose-headings:font-display prose-headings:text-brand-text prose-a:text-brand-primary hover:prose-a:text-brand-accent space-y-8">
          <section className="bg-brand-surface/50 border border-brand-border/50 p-8 rounded-2xl">
            <h2 className="text-xl font-bold text-brand-text mb-4">1. Éditeur du Site</h2>
            <p className="text-brand-text leading-relaxed">
              Le présent site web et la plateforme <strong>Sécurifolio RDC</strong> sont édités pour le compte du :<br /><br />
              <strong>Ministère des Affaires Foncières</strong><br />
              République Démocratique du Congo<br />
              Kinshasa, RDC
            </p>
          </section>

          <section className="bg-brand-surface/50 border border-brand-border/50 p-8 rounded-2xl">
            <h2 className="text-xl font-bold text-brand-text mb-4">2. Conception et Développement</h2>
            <p className="text-brand-text leading-relaxed">
              L'ingénierie logicielle, l'intelligence artificielle, le design de l'interface et l'architecture système ont été réalisés par :<br /><br />
              <strong>PNL Consulting</strong><br />
              Site Web : <a href="https://www.pnlconsulting.online/" target="_blank" rel="noopener noreferrer">https://www.pnlconsulting.online/</a><br />
              Contact : <a href="mailto:pascalntwali@hotmail.com">pascalntwali@hotmail.com</a>
            </p>
          </section>

          <section className="bg-brand-surface/50 border border-brand-border/50 p-8 rounded-2xl">
            <h2 className="text-xl font-bold text-brand-text mb-4">3. Hébergement</h2>
            <p className="text-brand-text leading-relaxed">
              L'infrastructure matérielle et logicielle de Sécurifolio RDC est hébergée sur des serveurs Cloud hautement sécurisés. Le déploiement, la gestion des bases de données et la sécurité des serveurs sont assurés sous la supervision de PNL Consulting et des autorités informatiques du Ministère, garantissant une souveraineté et une protection optimale des données de l'État.
            </p>
          </section>

          <section className="bg-brand-surface/50 border border-brand-border/50 p-8 rounded-2xl">
            <h2 className="text-xl font-bold text-brand-text mb-4">4. Propriété Intellectuelle</h2>
            <p className="text-brand-text leading-relaxed">
              L'ensemble de ce site relève de la législation congolaise et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
