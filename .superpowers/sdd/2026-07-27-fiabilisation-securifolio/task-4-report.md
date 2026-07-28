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
