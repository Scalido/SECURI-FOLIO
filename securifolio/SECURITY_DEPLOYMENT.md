# Déploiement sécurité SÉCURIFOLIO

## 1. Appliquer le SQL Supabase

Le schéma durci est versionné dans :

- `supabase/schema.sql`
- `supabase/migrations/20260718111000_security_hardening.sql`

À appliquer dans Supabase SQL Editor ou via Supabase CLI avant de déployer le code applicatif.

Ordre obligatoire :

1. Sauvegarder la base.
2. Appliquer la migration SQL.
3. Vérifier que les fonctions RPC existent :
   - `create_title_with_history`
   - `update_title_status_with_history`
4. Vérifier que les triggers append-only existent :
   - `prevent_smart_archive_history_mutation`
   - `prevent_anti_folio_history_mutation`

## 2. Variables d'environnement obligatoires

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CERTIFICATE_HMAC_SECRET=
ADMIN_EMAILS=
```

`CERTIFICATE_HMAC_SECRET` doit être une valeur longue, aléatoire, stockée uniquement côté serveur.

## 3. MFA rôles sensibles

Les rôles suivants exigent une session Supabase MFA `aal2` :

- `admin`
- `chef_cadastre`
- `conservateur`

Le parcours `/mfa` permet :

1. d'enrôler un facteur TOTP si aucun facteur vérifié n'existe ;
2. de scanner le QR code ;
3. de valider le code à 6 chiffres ;
4. de rediriger l'utilisateur vers son tableau de bord métier.

## 4. Contrôles pré-déploiement

```bash
npm run test:security
npm run lint
npm run build
npm run audit:deps
```

Si `npm audit` retourne `403 Forbidden`, relancer depuis un environnement autorisé à contacter le registre npm.
