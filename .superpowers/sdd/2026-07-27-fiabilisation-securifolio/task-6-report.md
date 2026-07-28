# Task 6 — Dossiers fonciers structurés

## Résultat

- Ajout de `dossiers_fonciers` et `pieces_dossier`, avec le vocabulaire documentaire approuvé, clés étrangères, contraintes et RLS.
- Lien `titres_fonciers.dossier_id` et six mentions du certificat : description, situation, charges, droits, date du sceau, conservateur signataire.
- Création transactionnelle dossier + titre + première pièce `certificat_enregistrement`.
- Ajout immuable d’une pièce par RPC : verrou consultatif, `MAX(version) + 1`, aucune version fournie par le client et aucun `UPDATE` de pièce.
- Checklist documentaire calculée par RPC côté serveur et affichée dans Smart Archive.
- Validation cadastrale bloquée sans `pv_mesurage_bornage` et `croquis`.
- Validation du Conservateur bloquée sans `minute_certificat`, `bordereau_versement`, `attestation_paiement_banque` et justification non vide.
- Défense en profondeur dans les actions des deux tableaux de bord; les contrôles SQL restent autoritaires.
- Backfill compatible des titres existants ayant un événement de création autoritatif et une enveloppe documentaire.
- Intégration Task 5 : stockage privé conservé, empreinte de chaque pièce, politique de suppression étendue, HMAC des nouvelles mentions sans casser les titres antérieurs.
- Résolution du reliquat Task 4 : `rejected_duplicate` reprend explicitement la version et l’attestation du titre autoritatif.

## TDD

- RED : module `@/lib/land-files` et migration absents.
- GREEN ciblé : 3 fichiers, 25 tests.
- Suite complète : 10 fichiers, 66 tests.

## Vérifications

- `npx tsc --noEmit` : succès.
- `npm run verify` : succès.
  - tests unitaires : 66/66;
  - contrôles sécurité : succès;
  - build Next.js : succès.
- `git diff --check` : succès.
- La migration et la section canonique ajoutée à `schema.sql` sont identiques.

## Limite d’environnement

- Aucun moteur PostgreSQL/Supabase local n’est disponible dans le dépôt; les garanties SQL sont couvertes par des tests de contrat, mais la migration devra aussi être appliquée sur un environnement Supabase de recette avant production.

## Fix round 1

- HMAC versionné : schéma 1 reproduit explicitement les titres Task 5; schéma 2 protège les six nouvelles mentions et est enregistré côté SQL sur tout nouveau dossier.
- Six tests unitaires et six tests du parcours administratif altèrent séparément chaque mention et exigent l’échec d’intégrité.
- Ajout de l’interface authentifiée de pièces dans Smart Archive : 11 types exacts, upload privé, remplacement versionné, checklist et versions serveur, erreurs et cleanup.
- Test d’interaction : remplacement en version 2 et nettoyage lors d’une interruption de transport.
- Contrat SQL resserré sur le corps de `update_title_status_with_history`.
- Vérification finale : `npx tsc --noEmit` réussi; `npm run verify` réussi, 81/81 tests, sécurité et build réussis.

## Fix round 2

- Backfill HMAC v1 limité aux titres possédant une enveloppe Task 5 complète; les titres sans enveloppe conservent une version nulle.
- Contrainte SQL couplée : enveloppe et version sont soit toutes absentes, soit complètes avec une version explicite 1 ou 2.
- Consultation administrative fermée pour toute version absente, inconnue ou non entière.
- Dates HMAC v2 normalisées vers l’instant ISO UTC complet : deux représentations du même instant concordent, deux heures distinctes restent différentes.
- Accès durable aux dossiers existants dans Smart Archive : liste autorisée, filtre de circonscription, rechargement serveur de la checklist et remplacement via le gestionnaire réel.
- Tests ciblés : 6 fichiers, 61/61.
- `npx tsc --noEmit` : succès.
- `npm run verify` : succès — 13 fichiers, 89/89 tests, contrôles sécurité et build Next.js réussis.

## Fix round 3 — Canonicalisation HMAC v1

- `date_etablissement` est désormais normalisée dans le schéma legacy v1, sans changer ses champs ni le payload versionné : la forme Node historique `.000Z` reste identique et la forme PostgREST `+00:00` produit le même HMAC.
- RED observé : le round-trip `buildIntegrityEnvelope`/`verifyIntegrityEnvelope` v1 avec sérialisation PostgREST échouait, et deux offsets du même instant produisaient des HMAC différents.
- Régressions ajoutées : round-trip v1 réel, offsets équivalents identiques, instants distincts différents.
- Tests ciblés : 6 fichiers, 64/64.
- `npx tsc --noEmit` : succès.

## Fix round 3 — Reprise legacy un-à-un

- Chaque titre legacy attribuable reçoit un dossier déterministe distinct fondé sur son `id`, même quand plusieurs titres partagent le même numéro cadastral.
- Aucun `created_by` n’est inventé : un titre sans événement `insert` attribuable reste non lié et fait l’objet d’un `NOTICE`.
- Le backfill est idempotent et ne remplace aucun lien existant.
- Pré-test production initial : échec `23505` sur l’ancien modèle, puis `ROLLBACK` explicite; contrôle post-rollback confirmé sans persistance.

## Fix round 4 — Alignement sur le Guide d’acquisition

- Taxonomie étendue aux pièces expressément citées dans le Guide, avec libellés français lisibles dans l’interface.
- Formes documentaires explicites : demande recommandée, exemplaires des PV et certificats, signatures et couleurs des croquis.
- Les preuves bancaires sont séparées en bordereau de versement et attestation de paiement.
- Les formats PDF/JPEG/PNG sont présentés comme une politique technique Securifolio, non comme une exigence légale du Guide.
- Validation par signature binaire côté navigateur et côté serveur; l’extension stockée est dérivée des octets.
- `validationReady` remplace l’ambiguïté `complete` : il s’agit uniquement des contrôles documentaires requis pour les deux validations.
- RED observé sur la taxonomie, les deux preuves, les signatures binaires et la sémantique de readiness.
- GREEN ciblé : 5 fichiers, 46/46 tests.
- Vérification complète : 13 fichiers, 100/100 tests, contrôles sécurité et build Next.js réussis.
- `npx tsc --noEmit`, `git diff --check` et miroir migration/schema : succès.
- Revue indépendante round 2 : approuvée, aucun blocage.
