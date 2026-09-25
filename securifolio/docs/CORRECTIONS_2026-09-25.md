# Corrections Securifolio — 25 septembre 2026

Branche locale : `codex/audit-corrections`, point de départ `561d56d`.
Pas de déploiement, de modification de base distante ou de compte réel. Extract RDC et le Simulateur CEEC sont hors périmètre.

## Changements locaux

| Audit | État | Changement |
|---|---|---|
| F01/F02 | Corrigé localement | Anti-Folio distingue erreur, absence, résultats multiples et statut enregistré ; aucune conclusion de fraude sans statut explicite. Claims de vérification de signature/chevauchement retirés, y compris accueil. Les anciens historiques « fraud » restent affichés prudemment. |
| F03/F14 | Corrigé localement | Localisation inconnue acceptée en attente ; absence de date conservée comme null ; formats français/ISO validés sans ambiguïté ni remplacement par aujourd'hui. |
| F04 | En attente | RLS réellement déployées, droits directs et invariants dans les RPC doivent être audités sur une base isolée avant une migration. Aucun SQL appliqué. |
| F05 | Renforcé localement | URL OCR limitée aux liens signés du bucket configuré ; redirections interdites, délai borné, flux arrêté au-delà de 8 Mo et MIME contrôlé. L'accès effectif aux objets reste à vérifier avec les politiques de stockage. |
| F06 | Corrigé localement | Pourcentages OCR aléatoires supprimés ; relecture humaine et éventuels écarts au registre affichés. Une absence d'alerte visuelle n'est plus présentée comme une preuve d'intégrité. |
| F07 | Corrigé localement | Historique IA borné aux échanges récents, dernière question conservée ; validation des rôles/contenus/tailles. Conversation de 25 tours testée à la frontière fournisseur simulée. |
| F08 | Partiel | Compteur client incrémenté après réponse réussie, question conservée lors d'erreur. Quota durable partagé côté serveur encore à implémenter sur un stockage disponible. Le rate limit en mémoire existant n'est pas un quota distribué. |
| F09/F10 | Corrigé localement | Filtre circonscription appliqué, liens `?q=` repris ; rapport premium explicitement indisponible. |
| F11 | Corrigé localement | Erreur DB/configuration distincte de titre absent et de JSON invalide. |
| F12 | Corrigé localement, recette distante requise | Accès aux données administrateur via client serveur privilégié après allowlist/MFA ; pagination des comptes et tables, borne explicite sans résultat tronqué silencieusement. |
| F13 | Partiel | Nettoyage des uploads OCR temporaires et des scans après rejet explicite. Les erreurs de transport à issue incertaine ne déclenchent pas la suppression d'un scan potentiellement référencé. Migration privée, idempotence de bout en bout et nettoyage des anciens orphelins restent à valider sur la base réelle. |
| F15/F17 | Corrigé localement | Rôle de navigation résolu côté serveur ; compte allowlisté administrateur correctement orienté après MFA ; rôle effacé/rechargé lors des changements de session. |
| F16 | Corrigé localement | Validation des coordonnées, anneaux, doublons de sommets, surface recalculée et auto-intersections ; contrôle serveur à l'archivage et avant validation cadastrale ; import CSV rejette les coordonnées invalides. |
| F18 | En attente | Variables administrateur/signature absentes localement. Un `.env.example` sans secrets est fourni. Aucun secret inventé ni renouvelé. |
| Complément | Corrigé localement | Suppression du bypass MFA en développement, avec test AAL1/AAL2 pour chaque rôle sensible. |

## Méthode et garde-fous

Tests de régression écrits avant les corrections sensibles : géométrie, archivage/date, frontières API, conversation longue, administration/MFA, classement Anti-Folio et navigation. Les tests exécutent les fonctions applicatives réelles, avec substitutions limitées aux accès Supabase/Gemini et à l'enveloppe HTTP.

Choix : branche dédiée dans le checkout existant, sans copie des dépendances, compte tenu du disque limité. Fichiers personnels préexistants (`.DS_Store`, maquette HTML non suivie) préservés. Design visuel conservé ; textes corrigés pour correspondre aux capacités réelles.

## Recette et déploiement restant

1. Réactiver un environnement Securifolio isolé ou fournir une base locale ; sauvegarder et tester une restauration avant migration.
2. Vérifier par rôle/circonscription et AAL1/AAL2 les RPC et accès REST directs, transitions concurrentes et historique transactionnel.
3. Définir le quota serveur durable, la politique d'accès aux scans et la migration compatible des anciennes URL.
4. Compléter le parcours de mise à jour topographique des dossiers sans coordonnées. Ceux-ci sont conservés en attente et ne peuvent pas être approuvés techniquement par l'action corrigée.
5. Recette avec sessions réelles : connexion, MFA, document fictif, correction OCR, archivage, validations, historique et lecture des scans. Aucun résultat local ne remplace ces vérifications.
6. Préproduction puis production uniquement après levée de ces réserves.

## Revue indépendante

Deux anomalies supplémentaires ont été reproduites puis corrigées avec tests : anneaux intérieurs hors parcelle ou imbriqués ; réponse IA longue bloquant la question suivante. La vérification des anneaux conserve les trous valides et rejette les autres ; le contexte IA transmis est borné indépendamment du texte affiché.

## Résultats d'exécution

- `npm test` : 32 tests unitaires réussis, contrôles de sécurité réussis et 3 contrôles HTTP réussis.
- Compilation finale `npm run build`, lint et TypeScript : réussis après les corrections issues de revue.
- Chrome local : une recherche Due Diligence affiche correctement « Le registre est temporairement indisponible » lorsque la configuration administrateur manque. Cela ne constitue pas une vérification de la base distante.
- Assistant : réponse reçue et compteur passé de 0/3 à 1/3. L'interception navigateur prévue pour simuler une erreur n'a pas intercepté la requête : un appel IA réel a donc eu lieu, coût éventuel non vérifié. Aucun autre appel IA lancé ensuite. La récupération après erreur n'est pas validée par cette recette navigateur.
- Vue mobile 390 × 844 inspectée sur la conversation et le formulaire ; aucun débordement horizontal visible sur la capture. Aucune erreur JavaScript retournée par le navigateur pendant cette recette ciblée.
- La recette complète avec comptes, MFA et stockage reste bloquée par l'absence de base disponible. Les substitutions des tests automatisés ne remplacent pas cette recette.
