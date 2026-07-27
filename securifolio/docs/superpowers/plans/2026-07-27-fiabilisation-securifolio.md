# Plan d’implémentation — Fiabilisation de Securifolio

> **Pour les agents d’implémentation :** SOUS-COMPÉTENCE REQUISE : utiliser `superpowers:subagent-driven-development` (recommandé) ou `superpowers:executing-plans`. Toutes les étapes utilisent des cases à cocher pour le suivi.

**Objectif :** aligner Anti‑Folio, Smart‑Archive et Foncier‑Édu sur leurs capacités réelles, puis implémenter les contrôles documentaires, spatiaux, juridiques et de sécurité actuellement annoncés mais absents.

**Architecture :** Supabase demeure le registre applicatif et le système de permissions. Smart‑Archive constitue les dossiers et leurs preuves, Anti‑Folio produit des constats techniques fondés sur ces preuves sans se substituer au Conservateur, et Foncier‑Édu répond à partir de passages documentaires identifiables. Les verdicts, documents et décisions administratives restent séparés.

**Stack :** Next.js 14.2.35, React 18, TypeScript, Supabase/PostgreSQL, PostGIS, Gemini 2.5 Flash, Zod, Vitest, Testing Library.

## Contraintes globales

- Les seuls modules visibles restent Anti‑Folio, Smart‑Archive et Foncier‑Édu.
- Aucun résultat technique ne doit être présenté comme une décision juridique définitive.
- `introuvable`, `erreur technique`, `ambigu`, `chevauchement détecté` et `fraude confirmée administrativement` sont des états distincts.
- Aucun scan foncier ne doit être accessible par URL publique.
- Aucun score aléatoire, identifiant d’agent codé en dur ou résultat simulé ne doit apparaître en production.
- Un titre ne peut devenir `Valide` que par le workflow actuel du Conservateur avec MFA.
- Les réponses de Foncier‑Édu doivent afficher leurs sources et signaler explicitement les points non couverts.
- Les résumés internes ne doivent pas être présentés comme des textes officiels intégraux.
- Le module de paiement et la route isolée `/due-diligence` sont hors périmètre.

---

## Cartographie des changements

### Fichiers existants à modifier

- `src/app/page.tsx` — rendre les promesses commerciales conformes aux capacités livrées.
- `src/app/anti-folio/page.tsx` — afficher des constats techniques explicites.
- `src/app/anti-folio/actions.ts` — retourner un résultat typé et ne plus transformer les erreurs en fraude.
- `src/app/smart-archive/page.tsx` — supprimer les simulations, compléter le dossier et exiger l’attestation réelle.
- `src/app/smart-archive/actions.ts` — stockage privé, empreintes, versions et pièces du dossier.
- `src/app/api/analyze-document/route.ts` — extraction structurée et provenance des champs.
- `src/lib/validations.ts` — mentions légales et pièces obligatoires.
- `src/app/api/chat/route.ts` — recherche documentaire et citations contrôlées.
- `src/app/assistant/page.tsx` — citations visibles et quota imposé côté serveur.
- `src/app/cadastre-dashboard/actions.ts` — décision cadastrale fondée sur les pièces et constats spatiaux.
- `src/app/conservateur-dashboard/actions.ts` — décision finale et justification.
- `supabase/schema.sql` — reflet final du schéma de référence.
- `package.json` — commandes de tests automatisés.

### Fichiers à créer

- `src/lib/anti-folio/types.ts` — contrat des résultats Anti‑Folio.
- `src/lib/anti-folio/verdict.ts` — interprétation déterministe des résultats.
- `src/lib/anti-folio/spatial.ts` — normalisation GeoJSON et appel du contrôle spatial.
- `src/lib/documents/integrity.ts` — SHA‑256 et représentation canonique des métadonnées.
- `src/lib/knowledge/manifest.ts` — provenance et niveau d’autorité du corpus.
- `src/lib/knowledge/chunks.ts` — découpage déterministe par titre/article.
- `src/lib/knowledge/retrieval.ts` — sélection des passages pertinents.
- `src/lib/knowledge/citations.ts` — validation des citations générées.
- `src/components/SourceCitation.tsx` — affichage d’une source vérifiable.
- `supabase/migrations/<timestamp>_truthful_verification.sql`
- `supabase/migrations/<timestamp>_private_documents.sql`
- `supabase/migrations/<timestamp>_postgis_parcels.sql`
- `supabase/migrations/<timestamp>_complete_land_files.sql`
- `supabase/migrations/<timestamp>_foncier_edu_usage.sql`
- `tests/unit/anti-folio-verdict.test.ts`
- `tests/unit/document-integrity.test.ts`
- `tests/unit/knowledge-retrieval.test.ts`
- `tests/unit/citations.test.ts`
- `tests/integration/anti-folio-actions.test.ts`
- `tests/integration/smart-archive-workflow.test.ts`
- `tests/integration/chat-citations.test.ts`

---

## Phase 0 — Installer une base de tests fiable

### Tâche 1 : Ajouter les tests unitaires TypeScript

**Fichiers :**

- Modifier : `package.json`
- Créer : `vitest.config.ts`
- Créer : `tests/setup.ts`

**Produit :** commandes reproductibles pour tester chaque correction avant le build.

- [ ] Ajouter `vitest`, `@testing-library/react`, `@testing-library/jest-dom` et `jsdom` aux dépendances de développement.
- [ ] Ajouter les scripts :

```json
{
  "test:unit": "vitest run",
  "test:unit:watch": "vitest",
  "verify": "npm run test:unit && npm run test:security && npm run build"
}
```

- [ ] Configurer l’alias `@` vers `src` et l’environnement `jsdom`.
- [ ] Ajouter un test minimal important `src/lib/anti-folio/verdict.ts` pour vérifier que la suite échoue avant création du module.
- [ ] Exécuter `npm run test:unit` et constater l’échec attendu.
- [ ] Créer le fichier minimal exportant les types nécessaires.
- [ ] Réexécuter `npm run test:unit`.
- [ ] Commit de contrôle :

```bash
git add package.json package-lock.json vitest.config.ts tests
git commit -m "test: add unit test foundation"
```

---

## Phase 1 — Supprimer immédiatement les résultats trompeurs

### Tâche 2 : Introduire un résultat Anti‑Folio typé

**Fichiers :**

- Créer : `src/lib/anti-folio/types.ts`
- Créer : `src/lib/anti-folio/verdict.ts`
- Créer : `tests/unit/anti-folio-verdict.test.ts`

**Interface produite :**

```ts
export type SearchState =
  | 'match'
  | 'not_found'
  | 'ambiguous'
  | 'technical_error';

export type SpatialState =
  | 'not_checked'
  | 'geometry_missing'
  | 'clear'
  | 'overlap_detected'
  | 'technical_error';

export type AdministrativeStatus =
  | 'Valide'
  | 'Litige'
  | 'Falsifié'
  | 'En attente de validation cadastrale'
  | 'Validé techniquement';

export interface AntiFolioOutcome {
  searchState: SearchState;
  spatialState: SpatialState;
  administrativeStatus: AdministrativeStatus | null;
  records: LandTitleSummary[];
  evidence: string[];
  requiresHumanReview: boolean;
}
```

- [ ] Écrire les tests suivants avant l’implémentation :

```ts
it('classe zéro résultat comme introuvable, jamais comme fraude');
it('classe une erreur Supabase comme erreur technique');
it('classe plusieurs résultats comme ambiguïté');
it('conserve Falsifié uniquement comme statut administratif existant');
it('exige une revue humaine lors d’un chevauchement');
```

- [ ] Implémenter `deriveAntiFolioOutcome()` comme fonction pure.
- [ ] Interdire tout libellé `authentique` ou `fraude` dérivé uniquement du nombre de résultats.
- [ ] Exécuter `npm run test:unit -- anti-folio-verdict`.

### Tâche 3 : Corriger la recherche et l’interface Anti‑Folio

**Fichiers :**

- Modifier : `src/app/anti-folio/actions.ts`
- Modifier : `src/app/anti-folio/page.tsx`
- Modifier : `src/app/page.tsx`
- Créer : `tests/integration/anti-folio-actions.test.ts`

**Interface consommée :** `AntiFolioOutcome` de la tâche 2.

- [ ] Faire retourner à `checkCadastralNumber()` une union explicite :

```ts
type SearchResponse =
  | { ok: true; records: LandTitleSummary[] }
  | { ok: false; code: 'UNAUTHENTICATED' | 'DATABASE_ERROR'; message: string };
```

- [ ] Écrire le test démontrant qu’une erreur de base n’est plus convertie en fraude.
- [ ] Remplacer les états React `valid | fraud | pending` par `AntiFolioOutcome`.
- [ ] Afficher :

```text
Correspondance trouvée
Titre introuvable dans Securifolio
Plusieurs correspondances — vérification requise
Vérification indisponible — aucune conclusion possible
```

- [ ] Afficher le statut administratif stocké séparément du constat technique.
- [ ] Remplacer « Certificat authentique » par « Correspondance trouvée dans le registre Securifolio ».
- [ ] Retirer les mentions « IA », « PostGIS » et « chevauchement calculé » jusqu’à la livraison de la phase 3.
- [ ] Corriger l’accueil : remplacer « détecte les documents falsifiés et bloque instantanément les superpositions » par une description exacte de la version courante.
- [ ] Étendre `anti_folio_history.resultat` par migration aux états `match`, `not_found`, `ambiguous`, `technical_error`, `overlap_detected`.
- [ ] Exécuter les tests unitaires, les contrôles de sécurité et le build.
- [ ] Commit :

```bash
git add src/app/anti-folio src/app/page.tsx src/lib/anti-folio tests supabase/migrations
git commit -m "fix: make Anti-Folio outcomes evidence-based"
```

---

## Phase 2 — Sécuriser et compléter Smart‑Archive

### Tâche 4 : Supprimer les données simulées et rendre l’attestation effective

**Fichiers :**

- Modifier : `src/app/smart-archive/page.tsx`
- Modifier : `src/app/smart-archive/actions.ts`
- Modifier : `src/lib/validations.ts`
- Créer : `tests/integration/smart-archive-workflow.test.ts`

- [ ] Écrire un test qui échoue si la confiance d’un champ provient de `Math.random()`.
- [ ] Supprimer les pourcentages aléatoires et afficher `Extrait par IA — vérification humaine requise`.
- [ ] Transformer la case `certify` en état React contrôlé `isCertified`.
- [ ] Désactiver `Transmettre pour validation` tant que `isCertified === false`.
- [ ] Remplacer `AF-7892` par le nom, le rôle et le futur matricule issus du profil connecté.
- [ ] Ajouter `matricule VARCHAR(100)` et `fonction VARCHAR(100)` à `profiles`.
- [ ] Enregistrer dans l’historique l’utilisateur, la date, la version du document et le texte de l’attestation acceptée.
- [ ] Refuser côté serveur toute sauvegarde sans `attested: true`; ne jamais dépendre uniquement de la case du navigateur.
- [ ] Tester qu’une requête forgée sans attestation est rejetée.

### Tâche 5 : Passer les documents en stockage privé et vérifier leur intégrité

**Fichiers :**

- Créer : `src/lib/documents/integrity.ts`
- Créer : `tests/unit/document-integrity.test.ts`
- Créer : `supabase/migrations/<timestamp>_private_documents.sql`
- Modifier : `src/app/smart-archive/page.tsx`
- Modifier : `src/app/smart-archive/actions.ts`

**Interfaces produites :**

```ts
export function sha256(bytes: Uint8Array): string;
export function canonicalizeTitleMetadata(input: CertificateData): string;
export function buildIntegrityEnvelope(
  fileHash: string,
  metadata: CertificateData,
  actorId: string
): IntegrityEnvelope;
```

- [ ] Écrire les tests prouvant qu’un octet ou un champ modifié change l’empreinte.
- [ ] Configurer `scans_certificats` comme bucket privé.
- [ ] Supprimer `getPublicUrl()` du flux de sauvegarde.
- [ ] Stocker uniquement `storage_path`, `file_sha256`, `metadata_hmac` et `version`.
- [ ] Générer les URL signées uniquement côté serveur, après contrôle RBAC et pour une durée maximale de cinq minutes.
- [ ] Calculer SHA‑256 sur les octets du fichier original, pas sur son URL.
- [ ] Nettoyer les objets temporaires après analyse, succès ou erreur.
- [ ] Ajouter un contrôle d’intégrité à chaque consultation administrative.
- [ ] Journaliser `integrity_check_passed` ou `integrity_check_failed`.
- [ ] Exécuter les tests, puis vérifier qu’aucune occurrence de `getPublicUrl` ne subsiste pour ce bucket.

### Tâche 6 : Transformer le certificat isolé en dossier foncier structuré

**Justification documentaire :**

- Guide, constitution du dossier et pièces de soubassement.
- Guide, procès-verbal de mesurage et bornage signé par le géomètre et le concessionnaire.
- Guide, mentions du certificat : volume, folio, date, situation, description, superficie, croquis, charges, sceau et signature.

**Fichiers :**

- Créer : `supabase/migrations/<timestamp>_complete_land_files.sql`
- Modifier : `supabase/schema.sql`
- Modifier : `src/lib/validations.ts`
- Modifier : `src/app/smart-archive/page.tsx`
- Modifier : `src/app/smart-archive/actions.ts`
- Modifier : `src/app/cadastre-dashboard/actions.ts`
- Modifier : `src/app/conservateur-dashboard/actions.ts`

**Schéma produit :**

```sql
CREATE TABLE dossiers_fonciers (
  id uuid PRIMARY KEY,
  numero_dossier text NOT NULL,
  circonscription text NOT NULL,
  created_by uuid NOT NULL,
  statut text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pieces_dossier (
  id uuid PRIMARY KEY,
  dossier_id uuid NOT NULL REFERENCES dossiers_fonciers(id),
  type_piece text NOT NULL,
  storage_path text NOT NULL,
  file_sha256 text NOT NULL,
  version integer NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

- [ ] Définir les types de pièces :

```text
demande
fiche_parcellaire
pv_enquete
pv_mesurage_bornage
croquis
contrat_concession
preuve_paiement
minute_certificat
certificat_enregistrement
copie_certifiee
autre
```

- [ ] Ajouter au certificat les champs `description_immeuble`, `situation`, `charges_reelles`, `droits_constates`, `date_sceau`, `signataire_conservateur`.
- [ ] Lier `titres_fonciers` à `dossiers_fonciers`.
- [ ] Afficher une checklist documentaire calculée côté serveur.
- [ ] Empêcher la validation cadastrale si le PV de mesurage/bornage ou le croquis requis manque.
- [ ] Empêcher la validation du Conservateur si la minute, la preuve de paiement ou la justification de contrôle manque.
- [ ] Conserver chaque nouvelle pièce comme une version, sans écraser la précédente.
- [ ] Tester un dossier complet, un dossier incomplet et le remplacement versionné d’une pièce.

### Tâche 7 : Étendre le journal d’audit au cycle juridique du titre

**Fichiers :**

- Créer : `supabase/migrations/<timestamp>_title_event_log.sql`
- Modifier : `supabase/schema.sql`
- Modifier : `src/app/smart-archive/actions.ts`
- Modifier : `src/app/cadastre-dashboard/actions.ts`
- Modifier : `src/app/conservateur-dashboard/actions.ts`

**Schéma produit :**

```sql
CREATE TABLE title_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_id uuid NOT NULL REFERENCES titres_fonciers(id),
  event_type text NOT NULL,
  actor_id uuid NOT NULL,
  reason text,
  previous_state jsonb,
  new_state jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

- [ ] Journaliser création, ajout de pièce, nouvelle version, contrôle d’intégrité, décision cadastrale, décision du Conservateur, litige, annulation et copie certifiée.
- [ ] Exiger un motif pour `Litige`, `Falsifié` et toute annulation.
- [ ] Conserver le renvoi entre certificat antérieur et nouveau certificat.
- [ ] Rendre `title_events` append-only avec le trigger existant adapté.
- [ ] Ajouter un écran chronologique en lecture seule dans les dashboards.
- [ ] Tester que `UPDATE` et `DELETE` d’un événement sont rejetés.

---

## Phase 3 — Implémenter la vraie détection spatiale

### Tâche 8 : Ajouter PostGIS et normaliser les parcelles

**Fichiers :**

- Créer : `supabase/migrations/<timestamp>_postgis_parcels.sql`
- Modifier : `supabase/schema.sql`
- Créer : `src/lib/anti-folio/spatial.ts`
- Créer : `tests/unit/spatial-normalization.test.ts`

**Interface produite :**

```ts
export interface SpatialConflict {
  titleId: string;
  overlapAreaM2: number;
  overlapRatio: number;
}

export async function checkSpatialConflicts(
  geoJson: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  excludedTitleId?: string
): Promise<SpatialConflict[]>;
```

- [ ] Activer `postgis`.
- [ ] Ajouter `geom geometry(MultiPolygon, 4326)` et un index GiST.
- [ ] Valider les polygones : anneau fermé, absence d’auto-intersection, coordonnées plausibles, surface positive.
- [ ] Convertir le GeoJSON validé en géométrie PostGIS côté base.
- [ ] Créer une fonction SQL `find_parcel_overlaps(p_geom, p_excluded_title_id)` utilisant `ST_Intersects`, `ST_Intersection` et `ST_Area(...::geography)`.
- [ ] Retourner surface et ratio de chevauchement; ne pas qualifier juridiquement le résultat.
- [ ] Écrire les tests : parcelles séparées, bord commun sans surface, chevauchement partiel, inclusion totale, géométrie invalide.

### Tâche 9 : Connecter le contrôle spatial aux trois workflows

**Fichiers :**

- Modifier : `src/app/smart-archive/actions.ts`
- Modifier : `src/app/anti-folio/actions.ts`
- Modifier : `src/app/anti-folio/page.tsx`
- Modifier : `src/app/cadastre-dashboard/actions.ts`
- Modifier : `src/app/page.tsx`
- Créer : `tests/integration/spatial-workflow.test.ts`

- [ ] À la transmission Smart‑Archive, calculer les conflits spatiaux lorsque la géométrie est disponible.
- [ ] Stocker chaque conflit comme constat technique dans `title_events`.
- [ ] Passer le dossier en revue cadastrale sans le déclarer frauduleux.
- [ ] Dans Anti‑Folio, afficher les titres en conflit, la surface et le ratio calculés.
- [ ] Afficher `Géométrie absente — contrôle spatial non effectué` si aucune coordonnée n’est disponible.
- [ ] Réintroduire la mention PostGIS sur l’accueil uniquement après réussite des tests d’intégration.
- [ ] Réserver les statuts administratifs `Litige` ou `Falsifié` aux actions habilitées existantes.
- [ ] Tester qu’un conflit spatial ne transforme jamais automatiquement un titre en `Falsifié`.

---

## Phase 4 — Rendre Foncier‑Édu vérifiable

### Tâche 10 : Établir la provenance du corpus

**Fichiers :**

- Créer : `src/lib/knowledge/manifest.ts`
- Modifier : les en-têtes des six fichiers `src/lib/knowledge/*.md`
- Créer : `tests/unit/knowledge-manifest.test.ts`

**Interface produite :**

```ts
export type AuthorityLevel =
  | 'official_full_text'
  | 'official_guide'
  | 'internal_summary';

export interface KnowledgeSource {
  id: string;
  title: string;
  authority: AuthorityLevel;
  legalReference: string;
  sourceUrl?: string;
  effectiveDate?: string;
  contentHash: string;
}
```

- [ ] Classer chaque fichier sans prétendre qu’un résumé est un texte intégral.
- [ ] Calculer et vérifier un hash du contenu au démarrage.
- [ ] Marquer les deux arrêtés actuellement résumés comme `internal_summary` jusqu’à remplacement par leurs textes officiels intégraux.
- [ ] Interdire qu’un tarif ou une sanction provenant uniquement d’un résumé interne soit présenté comme certitude.
- [ ] Ajouter un rapport de corpus listant source, date, niveau d’autorité et lacunes.
- [ ] Faire valider ce rapport par un juriste foncier avant publication institutionnelle.

### Tâche 11 : Ajouter recherche documentaire et citations contrôlées

**Fichiers :**

- Créer : `src/lib/knowledge/chunks.ts`
- Créer : `src/lib/knowledge/retrieval.ts`
- Créer : `src/lib/knowledge/citations.ts`
- Créer : `src/components/SourceCitation.tsx`
- Modifier : `src/app/api/chat/route.ts`
- Modifier : `src/app/assistant/page.tsx`
- Créer : `tests/unit/knowledge-retrieval.test.ts`
- Créer : `tests/unit/citations.test.ts`
- Créer : `tests/integration/chat-citations.test.ts`

**Contrat API produit :**

```ts
interface ChatAnswer {
  role: 'assistant';
  content: string;
  coverage: 'covered' | 'partial' | 'not_covered';
  citations: Array<{
    chunkId: string;
    sourceId: string;
    label: string;
    article?: string;
  }>;
}
```

- [ ] Découper les documents par article ou section avec des identifiants stables.
- [ ] Sélectionner les passages pertinents avant l’appel Gemini; ne plus envoyer aveuglément tout le corpus.
- [ ] Demander une réponse JSON structurée avec les seuls `chunkId` fournis.
- [ ] Rejeter toute citation inexistante.
- [ ] Si aucune source suffisante n’est retrouvée, répondre avec `coverage: not_covered`.
- [ ] Afficher sous la réponse : document, article/section et niveau d’autorité.
- [ ] Ajouter un bouton permettant d’ouvrir le passage exact, sans exposer tout le fichier serveur.
- [ ] Tester une question couverte, partiellement couverte, non couverte et une citation inventée par le modèle.

### Tâche 12 : Déplacer la limite publique côté serveur

**Fichiers :**

- Créer : `supabase/migrations/<timestamp>_foncier_edu_usage.sql`
- Modifier : `src/app/api/chat/route.ts`
- Modifier : `src/app/assistant/page.tsx`
- Modifier : `src/lib/security/rateLimit.ts`

- [ ] Remplacer `localStorage` comme autorité de quota.
- [ ] Pour un utilisateur connecté, compter par `user_id`.
- [ ] Pour un visiteur, stocker uniquement un HMAC quotidien de l’IP, jamais l’IP brute.
- [ ] Fixer explicitement la règle produit : trois questions publiques par jour.
- [ ] Retourner `429` avec `remaining` et `resetAt`.
- [ ] Conserver `localStorage` uniquement pour l’affichage optimiste, jamais pour la décision.
- [ ] Ajouter une purge automatique des identifiants visiteurs après 30 jours.
- [ ] Tester le quatrième appel, le changement de navigateur avec même identité serveur et la remise à zéro.

---

## Phase 5 — Validation globale et communication honnête

### Tâche 13 : Audit final des promesses et tests de bout en bout

**Fichiers :**

- Modifier : `src/app/page.tsx`
- Modifier : `src/app/privacy/page.tsx`
- Modifier : `src/app/terms/page.tsx`
- Modifier : `README.md`
- Modifier : `tests/api-smoke-tests.mjs`
- Créer : `docs/capability-matrix.md`

- [ ] Créer une matrice `Promesse → Code → Test → Limite`.
- [ ] Rechercher les expressions `infalsifiable`, `authentique`, `fraude`, `PostGIS`, `IA`, `institutionnelle`, `auditée en continu`.
- [ ] Pour chaque occurrence, fournir un test probant ou réduire la formulation.
- [ ] Documenter que Securifolio produit des aides techniques et que la décision juridique appartient aux autorités habilitées.
- [ ] Mettre à jour la politique de confidentialité pour le stockage privé, Gemini, les journaux et les durées de conservation.
- [ ] Étendre les smoke tests aux états Anti‑Folio et aux citations Foncier‑Édu.
- [ ] Exécuter :

```bash
npm run test:unit
npm run test:security
npm run test:api
npm run build
```

- [ ] Réaliser une recette manuelle avec quatre scénarios :

```text
1. titre existant, données concordantes, géométrie sans conflit
2. titre absent
3. erreur Supabase simulée
4. titre avec chevauchement spatial et décision humaine ultérieure
```

- [ ] Faire contrôler le modèle de dossier et les libellés juridiques par un Conservateur ou juriste foncier.
- [ ] Commit final :

```bash
git add src supabase tests docs README.md package.json package-lock.json
git commit -m "feat: deliver evidence-based Securifolio verification"
```

---

## Ordre de livraison recommandé

| Lot | Contenu | Condition de sortie |
|---|---|---|
| 1 | Tests + vérité Anti‑Folio | aucune panne/absence transformée en fraude |
| 2 | Smart‑Archive sécurisé | aucun scan public, aucune donnée simulée |
| 3 | Dossier foncier complet | pièces légales et versions contrôlées |
| 4 | PostGIS | conflits spatiaux réellement calculés |
| 5 | Foncier‑Édu vérifiable | chaque réponse juridique possède des sources valides |
| 6 | Audit final | toutes les promesses publiques sont démontrées |

## Points nécessitant une validation humaine

Les éléments suivants ne doivent pas être décidés uniquement par le développement :

1. liste exacte des pièces obligatoires selon le type de dossier ;
2. statut officiel des versions du corpus ;
3. seuil d’interprétation d’un chevauchement spatial ;
4. règles de conservation et d’accès aux archives publiques ;
5. formulation juridique des décisions et avertissements ;
6. habilitation et matricule des agents ;
7. procédure d’annulation ou remplacement d’un certificat.

## Critère final d’acceptation

Le projet est terminé seulement si :

- les trois modules visibles correspondent à la matrice des capacités ;
- aucun résultat automatique ne prononce une fraude ou une authenticité juridique ;
- tous les documents sont privés, versionnés et contrôlables par empreinte ;
- un chevauchement affiché provient d’un calcul PostGIS testable ;
- toutes les décisions sensibles sont attribuées à un agent habilité avec MFA et motif ;
- Foncier‑Édu cite un passage existant ou déclare que le corpus ne couvre pas la question ;
- `npm run verify` réussit ;
- la recette métier est approuvée par un représentant foncier habilité.
