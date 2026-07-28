# Task 4 — Smart-Archive : attestation effective

## Statut

Implémenté. La migration doit encore être appliquée à l’environnement Supabase cible.

## Contrat serveur

- `saveCertificate(submission: unknown, ...)` refuse toute valeur autre que
  `submission.attested === true` avant la recherche ou la création d’un titre.
- Le schéma Zod `smartArchiveSubmissionSchema` exige aussi `attested: true`.
- Le client ne fournit ni l’identité, ni la version, ni le texte d’attestation.
- L’identité est relue dans `profiles` depuis l’utilisateur authentifié.
- La RPC transactionnelle exige également `p_attested = true`, reconstruit le texte
  canonique depuis le profil DB et journalise `agent_id`, `created_at`,
  `document_version = '1'` et `attestation_text`.

## RED

Commande :

```text
npx vitest run tests/integration/smart-archive-workflow.test.ts
```

Résultat attendu observé :

```text
Test Files  1 failed (1)
Tests       3 failed (3)
- requête forgée sans attestation : received { success: true }
- libellé de vérification déterministe : fonction absente
- verrou de soumission contrôlé : fonction absente
```

Le premier essai d’import direct de la page a aussi exposé une limite du transformeur
Vite 4/Vite 8 sur ce TSX Next volumineux. Le test final exerce donc les contrats purs
utilisés par la page, sans assertion textuelle sur le code source.

## GREEN

Commande ciblée :

```text
npx vitest run tests/integration/smart-archive-workflow.test.ts
```

Résultat :

```text
Test Files  1 passed (1)
Tests       3 passed (3)
```

## Changements

- Pourcentages de confiance aléatoires supprimés des champs OCR.
- Libellé fixe : `Extrait par IA — vérification humaine requise`.
- `isCertified` est contrôlé et remis à zéro à chaque nouveau cycle.
- Bouton de transmission inactif sans attestation ou pendant la sauvegarde.
- Libellé d’attestation construit avec `full_name`, `role`, `matricule`, `fonction`.
- `AF-7892` supprimé.
- Migration idempotente ajoutant `profiles.matricule`, `profiles.fonction`,
  `smart_archive_history.document_version` et
  `smart_archive_history.attestation_text`.
- Ancienne signature RPC supprimée pour éviter un chemin de création sans attestation.

## Vérifications

```text
npx tsc --noEmit
exit 0

npm run test:unit
Test Files  4 passed (4)
Tests       13 passed (13)

npm run test:security
Security checks passed

npm run build
Compiled successfully
Generating static pages (19/19)
exit 0

git diff --check
exit 0
```

## Hors périmètre / préoccupation

- Aucun changement de stockage privé (Task 5).
- Aucun workflow de dossier complet (Task 6).
- La migration SQL n’a pas été exécutée contre une base locale ou distante : aucun
  CLI Supabase/PostgreSQL n’est disponible dans cet environnement.

## Correctifs après revue indépendante — round 1/5

### Important 1 — identité obligatoirement visible

- L’état profil est désormais explicite : `loading`, `error` ou `ready`.
- La case et le bouton restent désactivés hors de l’état `ready`.
- Une erreur de chargement est rendue avec `role="alert"` et remet l’attestation à
  `false`.
- Un profil prêt exige rôle `agent`, nom, fonction et matricule non vides.
- Cette garde est répétée dans l’action serveur et dans la RPC.
- Le handler de transmission vérifie encore l’état `ready` avant tout upload.

RED additionnel :

```text
requête attested=true avec matricule vide
Expected: rejet "Profil agent incomplet…"
Received: { success: true }
```

GREEN ciblé :

```text
npx vitest run tests/integration/smart-archive-workflow.test.ts
Test Files  1 passed (1)
Tests       6 passed (6)
```

### Important 2 — version documentaire réelle

- `document_version` est un `INTEGER`.
- Le client et l’action ne définissent ni ne transmettent aucune version.
- La RPC prend un verrou transactionnel déterministe avec
  `pg_advisory_xact_lock(hashtextextended(numero_cadastral, 0))`.
- Sous ce verrou, elle calcule `MAX(document_version) + 1` pour le numéro cadastral
  puis journalise cette version dans la même transaction que le titre.
- `schema.sql` et la migration ont la même définition.

Le test PostgreSQL direct reste différé conformément à la revue : aucun runtime
Supabase/PostgreSQL n’est disponible.

### Important 3 — test du vrai rendu OCR

- `page.tsx` utilise réellement `ExtractionReviewLabel`.
- Testing Library rend ce composant sous espion `Math.random` et vérifie le libellé
  visible exact ainsi que zéro appel aléatoire.
- Les composants testables sont volontairement en `.ts` avec
  `React.createElement` : la configuration Vite/Vitest actuelle ne transforme pas
  le TSX Next sans plugin React. Cela permet un vrai test DOM sans grep du source.

RED observé :

```text
composants de rendu/garde absents, puis garde checkbox encore déclenchable
sous fireEvent après erreur profil
```

GREEN :

```text
npm run verify
Test Files  4 passed (4)
Tests       16 passed (16)
Security checks passed
Compiled successfully
Generating static pages (19/19)
exit 0
```

### Minor différés

- Audit de la tentative doublon : Task 6.
- Test DB réel : dès disponibilité d’un runtime PostgreSQL/Supabase.

## Correctif après rerevue — round 2/5

### Migration compatible avec l’ancienne colonne texte

Une nouvelle migration ordonnée
`20260728030000_smart_archive_history_version_security.sql` corrige les bases ayant
déjà appliqué la première version :

- validation préalable de toutes les valeurs non nulles avec le contrat entier
  positif 32 bits ;
- échec explicite avant cast si une valeur est invalide ou hors limites ;
- conversion explicite avec
  `ALTER COLUMN document_version TYPE INTEGER USING ...` ;
- backfill des lignes historiques nulles avec la version connue du même numéro
  cadastral, ou `1` pour un historique entièrement legacy ;
- contrainte finale `INTEGER NOT NULL` et `CHECK (document_version > 0)` ;
- suppression temporaire puis restauration du trigger append-only pendant le
  backfill transactionnel.

`schema.sql` porte le même état final et le même chemin de conversion.

### Version et attestation sous contrôle exclusif des RPC

- La policy INSERT directe `Agents peuvent insérer historique` est supprimée.
- `INSERT`, `UPDATE` et `DELETE` sont révoqués à `authenticated`, `anon` et
  `PUBLIC`; `SELECT` reste accordé à `authenticated` et filtré par la policy RLS.
- La RPC attestée réaffirme `SECURITY DEFINER`, `search_path = public`, révoque
  l’exécution à `PUBLIC`/`anon` et l’accorde à `authenticated`.
- Les écritures de statut continuent via leur RPC sécurisée.
- Le journal de doublon passe désormais par `record_smart_archive_duplicate`,
  RPC contrôlée sans paramètre de version ni texte d’attestation.
- Un trigger interne assigne la version courante aux événements métier qui ne
  créent pas une nouvelle version ; seule `create_title_with_history` calcule
  `MAX(document_version) + 1` sous verrou transactionnel.

### RED / GREEN

RED :

```text
npx vitest run tests/integration/smart-archive-migration-contract.test.ts
Test Files  1 failed (1)
Tests       3 failed (3)
- conversion TYPE INTEGER USING / NOT NULL absente
- policy et privilèges DML permissifs
- contexte et permissions RPC non explicités
```

GREEN ciblé :

```text
npx vitest run tests/integration/smart-archive-migration-contract.test.ts \
  tests/integration/smart-archive-workflow.test.ts
Test Files  2 passed (2)
Tests       9 passed (9)

npx tsc --noEmit
exit 0
```

Vérification finale :

```text
npm run verify
Test Files  5 passed (5)
Tests       19 passed (19)
Security checks passed
Compiled successfully
Generating static pages (19/19)
exit 0
```

Les tests SQL sont des contrats statiques exécutables, conformément à la rerevue :
aucun runtime PostgreSQL/Supabase n’est disponible dans cet environnement.
