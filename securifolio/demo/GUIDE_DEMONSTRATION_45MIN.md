# Guide de Démonstration : Foncier Mabele IA (SECURI-FOLIO)

Ce guide est conçu pour une présentation de **45 minutes** en salle de réunion avec un projecteur. L'objectif est de captiver l'audience dès les premières minutes et de prouver la robustesse du système (No BS).

---

## 1. Recommandation Logistique : Local ou En Ligne ?

**Recommandation ferme : Faites la démo sur la version en ligne (Vercel).**

**Pourquoi ?**
1. **L'Effet "Wow" Public** : Le point d'orgue de votre démo sera l'outil *Anti-Folio*. Si l'application est en ligne, vous pouvez afficher un QR code au projecteur et dire à l'audience : *"Sortez vos téléphones, allez sur ce lien et vérifiez vous-mêmes ce titre"*. C'est l'argument ultime pour prouver que le système est réel et opérationnel.
2. **Dépendance Cloud** : Même si vous tournez en local (`npm run dev`), l'application dépend de **Gemini IA** et de **Supabase**. Si le Wi-Fi de la salle coupe, le local plantera aussi au moment de l'analyse IA.

**Le Plan de Sécurité (Plan B) :**
- Venez avec votre propre connexion **hotspot 4G/5G** via votre téléphone, au cas où le Wi-Fi de la salle bloquerait certains ports ou serait trop lent pour l'upload.
- Ayez l'application qui tourne en local (`npm run dev`) en arrière-plan sur votre machine. Si Vercel tombe en panne (extrêmement rare), vous switchez sur l'onglet local sans perdre la face.

---

## 2. Déroulé de la Démo (45 Minutes)

### Phase 1 : Le Constat et la Vision (0 - 10 min)
*Ne montrez pas l'application tout de suite. Captez l'attention.*
- **(2 min)** L'accroche : *"Aujourd'hui, en RDC, un morceau de papier avec un faux tampon suffit pour voler la terre de quelqu'un. Les banques ont peur de prêter, l'État perd des revenus, les citoyens perdent leurs économies."*
- **(3 min)** La solution classique vs SECURI-FOLIO : Expliquez que numériser ne suffit pas (un PDF peut être falsifié). La vraie solution, c'est l'intelligence artificielle couplée à la vérification spatiale (topographie) et à la Blockchain/Cloud immuable.
- **(5 min)** Présentez brièvement les 2 acteurs de votre démo : Le **Conservateur** (qui numérise et contrôle) et le **Public/Acheteur** (qui vérifie).

### Phase 2 : Le Cœur du Réacteur - Smart Archive (10 - 25 min)
*Passez sur l'application, projetez la page `/smart-archive`.*
- **(3 min)** **La Numérisation Initiale (Le Titre Parfait)** : 
  - Uploadez `certificat_1_authentique.png`.
  - Pendant que l'IA "réfléchit", expliquez : *"Je suis l'Opérateur de Niveau 1. Je numérise ce vieux document. L'IA m'aide pour l'OCR, mais elle ne valide rien seule."*
  - Uploadez `rtk_1_authentique_3049m2.csv`. **Cliquez sur Envoyer.**
  - **Le Storytelling :** *"Le dossier vient de disparaître de mon écran. Il passe au Chef du Cadastre (Niveau 2) puis au Conservateur (Niveau 3). C'est le Conservateur qui 'Scelle' le document. Ce n'est qu'à cet instant que le terrain devient une forteresse numérique."*
- **(6 min)** **La Forteresse Anti-Fraude (La Falsification Subtile)** : 
  - Rafraîchissez la page. *"Faisons une avance rapide. Le terrain est scellé depuis un an. Que se passe-t-il si un faussaire crée un faux document visuellement parfait ?"*
  - Uploadez `certificat_2_falsifie_subtil.png`. Montrez que l'IA extrait tout sans détecter de rature visuelle, mais qu'elle trouve une divergence en interrogeant la forteresse (la base de données).
  - Expliquez : *"À l'œil nu, ce document indique 6000m² pour Mosele Mombanga. L'agent pourrait le valider. Mais l'IA l'extrait et le compare à notre Forteresse Anti-Fraude. La base de données de l'État indique 3049m² pour le vrai propriétaire. Fraude bloquée. L'IA protège la chaîne humaine."*
- **(6 min)** **Le Conflit Spatial (Empiètement)** :
  - *(Optionnel si le temps le permet)* Uploadez le fichier `rtk_3_conflit_voisin_decale.csv` pour montrer comment le système détecte qu'un terrain chevauche un terrain existant.

### Phase 3 : L'Arme Fatale - Anti-Folio (25 - 35 min)
*La phase interactive. Changez d'onglet pour `/anti-folio`.*
- **(2 min)** Expliquez : *"Nous avons sécurisé la source. Maintenant, donnons le pouvoir à l'acheteur ou au banquier."*
- **(3 min)** **Test en Direct** : 
  - Tapez le numéro que vous avez validé en Phase 2 (ex: `Vol AMA 171 Folio 68`). L'écran vert apparaît. *"L'acheteur sait qu'il peut payer son acompte en toute sécurité."*
- **(5 min)** **Test Public (Le Climax)** : 
  - Mettez l'URL de votre application sur le projecteur (ou un QR Code généré à l'avance).
  - Demandez à l'audience : *"Sortez vos téléphones. Allez sur ce lien. Tapez un numéro au hasard, inventez-le."*
  - Ils verront l'écran **ROUGE (Faux Document / Inexistant)** sur leurs propres téléphones.
  - L'argument : *"Plus personne ne peut vendre un terrain avec de faux papiers, car n'importe qui avec un smartphone peut le démasquer en 5 secondes."*

### Phase 4 : Vision Future & Q&A (35 - 45 min)
- **(3 min)** Ce qui arrive ensuite : Mentionnez que les briques que vous venez de montrer sont le socle. Une fois la donnée propre, le cadastre peut visualiser des "cartes thermiques" des litiges et détecter les fraudes par intelligence artificielle.
- **(7 min)** Questions & Réponses : Soyez cash. Si on vous demande *"Et si l'agent de l'État est corrompu ?"*, répondez : *"L'IA agit comme un auditeur impitoyable. L'agent ne peut pas forcer la validation d'un faux RTK sans laisser une trace indélébile dans le système."*

---

## 🎯 Checklist de Survie (À faire 1h avant la démo)
- [ ] Videz la base de données Supabase des numéros cadastraux que vous allez utiliser, pour éviter un conflit "Titre déjà existant" lors de la phase 2.
- [ ] Mettez tous les fichiers de la démo (les 4 PNG et les 3 CSV) dans un dossier facile d'accès sur votre bureau (ex: "DEMO_FICHIERS").
- [ ] Testez votre propre hotspot mobile sur votre ordinateur.
- [ ] Préparez un onglet avec un générateur de QR code gratuit pointant vers la page Vercel d'Anti-Folio.

---

## 🛡️ ANNEXE : Argumentaire de Défense (Q&A Avancé)

Si un Directeur technique ou le Secrétaire Général tente de vous piéger sur les limites de l'Intelligence Artificielle visuelle, utilisez ces arguments :

### 1. "L'IA visuelle n'est pas un laboratoire scientifique"
Si on vous dit : *"Mais si le faussaire imprime un faux parfait sur le vrai papier de l'État avec un vrai stylo, votre IA ne verra rien !"*

**Votre réponse (No BS) :**
> *"Exactement. L'IA visuelle ne remplace pas la police scientifique. Face à un faux papier parfait, l'IA visuelle est trompée, tout comme l'agent de guichet. Mais c'est précisément pour cela que SECURI-FOLIO est un système hybride. Si le faussaire passe le mur visuel, il s'écrase sur le mur sémantique et topographique. Son papier indique 6000m², mais en un dixième de seconde, l'outil interroge le registre central inviolable qui hurle : 'Faux, ce titre fait 3049m²'. C'est le croisement de la vue, de la base de données et de la géolocalisation qui rend la fraude impossible."*

### 2. Les 4 Vrais Intérêts Stratégiques du Check Visuel
Si on vous demande : *"Si le croisement avec la base de données fait tout le travail, à quoi sert l'IA visuelle ?"*

**Votre réponse :**
> *"Le check visuel a 4 fonctions vitales pour l'administration :*
> 
> 1. **Filtrer 90% des faussaires amateurs** : La majorité des fraudes sont grossières (blanc correcteur, ratures). L'IA arrête immédiatement le fraudeur au guichet sans lancer de requête complexe.
> 2. **Le filet de sécurité pour les vieux titres (Trous Noirs)** : Si un citoyen amène un vieux certificat des années 80 qui n'a *jamais* été informatisé, la base de données répondra 'Inconnu'. Dans ce cas précis, le check visuel devient notre **seule ligne de défense**. Si l'IA dit 'Titre inconnu MAIS aucune altération visuelle', on peut le numériser avec confiance.
> 3. **L'Audit Interne (Lutte anti-corruption)** : Si un agent corrompu force la validation d'un document raturé malgré l'alerte visuelle de l'IA, le système garde une trace indélébile de son action.
> 4. **Détecter les usines à faux** : L'IA repère les anomalies de pixels invisibles à l'œil nu (comme un faux tampon copié-collé sur Photoshop), démantelant les réseaux organisés avant même de lire le texte."*

### 3. "Nos vieux certificats n'ont pas les mêmes mots"
Si on vous demande : *"Que se passe-t-il avec nos vieux certificats des années 80 qui utilisent d'anciens termes comme 'Zone' au lieu de 'Commune' ?"*

**Votre réponse :**
> *"C'est la différence entre un vieux logiciel (OCR) et notre Intelligence Artificielle. Un logiciel classique crasherait car il cherche des mots exacts. Notre modèle d'IA est sémantique : s'il lit 'Zone de Limete', il comprend que c'est la 'Circonscription'. Il s'adapte au jargon de l'époque et déchiffre 60 ans d'archives diverses. S'il manque une donnée, l'IA ne bloque pas : elle avertit l'agent de l'État qui prend le relais. L'outil s'adapte à la réalité du terrain."*
