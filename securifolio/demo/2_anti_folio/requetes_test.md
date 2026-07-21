# Démo - Anti-Folio (Vérification Publique)

L'outil **Anti-Folio** permet de vérifier l'authenticité et le statut d'un certificat d'enregistrement en interrogeant directement la base de données (Supabase).

**IMPORTANT :** Puisque le système interroge la véritable base de données, un numéro cadastral ne sera reconnu comme "Sain" ou "Litige" que **SI VOUS L'AVEZ D'ABORD TRAITÉ ET SAUVEGARDÉ DANS SMART-ARCHIVE**.

Voici le processus pour une démo réussie :

### Étape 1 : Enregistrement dans Smart-Archive
1. Allez sur `/smart-archive`.
2. Utilisez le bouton de test "Certificat Authentique (SU/GOM/1023)" et chargez le CSV RTK authentique.
3. Allez jusqu'au bout du processus et validez le document pour l'inscrire dans la base de données.
4. Répétez l'opération avec un certificat en litige (ex: `SU/KIM/871`).

### Étape 2 : Vérification dans Anti-Folio
Une fois les titres enregistrés, rendez-vous sur `/anti-folio` et testez les identifiants :

- **Titre Valide (Sain)**
  - Entrez l'ID que vous venez de valider (ex: `SU/GOM/1023`).
  - L'interface interrogera la base et affichera les détails validés en vert.

- **Titre Inexistant (Faux/Spoliation)**
  - Entrez un ID inventé (ex: `SU/XXX/999`).
  - L'interface interrogera la base, ne trouvera rien, et affichera immédiatement une alerte rouge indiquant que le document est frauduleux.
