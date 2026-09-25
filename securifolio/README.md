# Sécurifolio

Application Next.js de consultation et d'archivage des titres fonciers. Les décisions administratives restent humaines ; une concordance de champs ne prouve ni l'authenticité juridique ni l'absence de chevauchement.

## Démarrer en local

1. Installer les dépendances avec `npm ci` si elles sont absentes.
2. Copier `.env.example` vers `.env.local` et renseigner les valeurs de l'environnement de test. Ne jamais committer les secrets.
3. Lancer `npm run dev`.

Pour tester le build de production : `npm run build`, puis `npm run start -- --hostname 127.0.0.1 --port 3100`. Ne pas lancer build et dev simultanément dans le même dossier `.next`.

## Vérifier les corrections

- `npm run test:unit` : tests métier, géométrie, dates, classement des titres, navigation, frontières API et contrôles administrateur. Les services externes sont remplacés aux frontières des tests ; aucune base distante n'est modifiée.
- `npm run test:security` : contrôles statiques complémentaires, qui ne prouvent pas l'efficacité des règles déployées.
- `npm run test:api` : contrôles HTTP sans session contre `http://127.0.0.1:3100` (modifiable via `SMOKE_BASE_URL`). Nécessite le serveur lancé.
- `npm test` : les trois suites ci-dessus.
- `npm run lint` et `npm run build` : contrôles de code, types et compilation.

## Accès et stockage

Les rôles métier sont `agent`, `chef_cadastre`, `conservateur`, `notaire` et `citoyen`. L'accès administrateur est déterminé côté serveur par `ADMIN_EMAILS`, pas par des métadonnées modifiables par l'utilisateur. Les opérations sensibles exigent le MFA, y compris en développement.

Les documents sans localisation restent en attente ; une géométrie valide est requise pour leur validation cadastrale. Les dates inconnues sont conservées comme telles. Les médias temporaires sont nettoyés au mieux ; les politiques de suppression du bucket doivent le permettre.

## Validation encore nécessaire avant production

Le projet Supabase Securifolio est en pause. Aucun changement de base ni déploiement ne doit être déduit du succès des tests locaux. Restent notamment : audit des politiques RLS réelles et fermeture des écritures directes contournant les RPC ; contrôle MFA/transition/historique atomique dans la base ; quota public durable partagé ; stockage privé et liens signés avec reprise des références existantes ; reprise des documents sans géométrie ; recette par rôle sur données fictives et sauvegarde restaurable.

Les URL publiques existantes des scans sont conservées par compatibilité tant que la migration du stockage n'a pas été validée. Les anciens résultats d'historique `fraud` peuvent refléter un ancien classement erroné et ne doivent pas être interprétés comme une preuve de falsification.
