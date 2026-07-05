# 📚 Securi-Folio : Fonctionnement de Smart Archive et Sécurité

Ce document explique le fonctionnement de bout en bout du module **Smart Archive**, comment nous avons résolu les blocages récents, et comment la sécurité de vos données est garantie.

## 1. Comment fonctionne l'enregistrement (Smart Archive) ?

Le processus d'ajout d'un nouveau certificat via le module Smart Archive se déroule en plusieurs étapes hautement sécurisées :

1. **Vérification d'Identité (RBAC)** : Dès que vous cliquez sur "Confirmer et Sceller", le serveur vérifie que vous êtes bien connecté et que votre profil dans la table `profiles` possède le rôle `agent`. Si ce n'est pas le cas, la requête est immédiatement rejetée.
2. **Validation Zod** : Les données extraites (numéro cadastral, nom, superficie, etc.) passent dans un filtre strict de validation (Zod) pour s'assurer que le format est correct (par exemple, que le numéro cadastral fait bien au minimum 2 caractères).
3. **Détection de Doublons** : Le système interroge la table `titres_fonciers`. 
   - S'il trouve un titre existant avec le même numéro cadastral, le statut du titre existant bascule automatiquement en **"Litige"** et l'opération est bloquée pour le nouveau document.
4. **Insertion Sécurisée** : S'il s'agit d'un nouveau document, il est inséré dans `titres_fonciers` avec le statut initial **"En attente d'audit"**.
5. **Traçabilité (Historique)** : Qu'il y ait eu succès ou rejet (doublon), une trace de l'action est enregistrée dans la table `smart_archive_history`.

## 2. Le Journal d'Audit (Historique)

Vous avez désormais accès à un **Journal d'Audit en temps réel** affiché en bas de la page Smart Archive. 
Initialement, ce journal ne s'affichait pas suite à un blocage de compilation sur Vercel (lié à des règles strictes TypeScript/ESLint). Le problème est résolu :

- Chaque document scellé avec succès ou bloqué (doublon) apparaît instantanément.
- Les données sont récupérées via une fonction serveur ultra-sécurisée (`getHistoryServer`) qui garantit qu'un agent ne voit que **ses propres actions**.
- Aucune API ouverte côté client n'est exposée pour la lecture.

## 3. Sécurité : Le Blindage Ultime (RLS)

> [!CAUTION]
> Lors du paramétrage initial, l'absence de règles sur certaines tables bloquait silencieusement le système. Nous avons rectifié le tir, et même renforcé les règles au niveau maximum de paranoïa (Zero Trust).

**Bilan du Blindage :**
- **Côté API (Code)** : L'admin client a été supprimé. On utilise les cookies de l'agent. Le code filtre automatiquement par `user.id` et vérifie le rôle `agent`.
- **Côté Base de Données (RLS)** : Supabase rejette tout accès non autorisé à la racine, indépendamment de ce que fait le code.

### 🛡️ Le Code SQL Définitif

Ce code lie la sécurité (RLS) à la table `profiles` et force l'usurpation d'identité à être impossible (`auth.uid() = agent_id`) :

```sql
-------------------------------------------------------------------------
-- 1. BLINDAGE DE LA TABLE "titres_fonciers"
-------------------------------------------------------------------------
DROP POLICY IF EXISTS "Les agents peuvent inserer des titres" ON public.titres_fonciers;
CREATE POLICY "Les agents peuvent inserer des titres" 
ON public.titres_fonciers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'agent'
  )
);

DROP POLICY IF EXISTS "Les agents peuvent mettre a jour des titres" ON public.titres_fonciers;
CREATE POLICY "Les agents peuvent mettre a jour des titres" 
ON public.titres_fonciers
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'agent'
  )
);

-------------------------------------------------------------------------
-- 2. BLINDAGE DE LA TABLE "smart_archive_history" (Le Journal)
-------------------------------------------------------------------------
-- Un agent ne peut insérer que SES propres actions
DROP POLICY IF EXISTS "Agents can insert history" ON public.smart_archive_history;
CREATE POLICY "Agents can insert history" 
ON public.smart_archive_history
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = agent_id AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'agent'
  )
);

-- Un agent ne peut lire que SON propre historique
DROP POLICY IF EXISTS "Agents can read history" ON public.smart_archive_history;
CREATE POLICY "Agents can read history" 
ON public.smart_archive_history
FOR SELECT
TO authenticated
USING (
  auth.uid() = agent_id AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'agent'
  )
);
```

Avec ces règles, c'est Supabase lui-même qui bloquera toute tentative suspecte venant d'un citoyen ou d'un compte compromis. C'est le niveau de sécurité maximal attendu pour ce type de registre d'État.
