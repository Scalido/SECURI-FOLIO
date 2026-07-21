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
- **(3 min)** **Cas Nominal (Le Titre Parfait)** : 
  - Uploadez `certificat_1_authentique.png`.
  - Pendant que l'IA "réfléchit" et charge, expliquez : *"Ici, l'IA lit le document comme un humain, repère les signatures, vérifie qu'il n'y a pas de ratures."*
  - À l'étape spatiale, uploadez le fichier du géomètre (`rtk_1_authentique_450m2.csv`). Montrez comment le polygone se dessine parfaitement sur la carte satellite. **Validez l'enregistrement.**
- **(6 min)** **Le Crash Test (La Spoliation)** : 
  - Rafraîchissez la page. *"Que se passe-t-il si quelqu'un essaie d'insérer un document falsifié pour voler un terrain voisin ?"*
  - Uploadez `certificat_2_falsifie_rature.png`. Montrez comment l'IA détecte la rature.
  - À l'étape spatiale, uploadez `rtk_2_falsifie_superficie_1000m2.csv`.
  - **Boom.** Montrez l'alerte rouge : le certificat dit 450m², le terrain physique fait 1000m². Expliquez : *"Le système empêche la fraude à la source. L'agent ne peut pas outrepasser cette alerte."*
- **(6 min)** **Le Conflit Spatial (Empiètement)** :
  - *(Optionnel si le temps le permet)* Uploadez le fichier `rtk_3_conflit_voisin_decale.csv` pour montrer comment le système détecte qu'un terrain chevauche un terrain existant.

### Phase 3 : L'Arme Fatale - Anti-Folio (25 - 35 min)
*La phase interactive. Changez d'onglet pour `/anti-folio`.*
- **(2 min)** Expliquez : *"Nous avons sécurisé la source. Maintenant, donnons le pouvoir à l'acheteur ou au banquier."*
- **(3 min)** **Test en Direct** : 
  - Tapez le numéro que vous avez validé en Phase 2 (ex: `SU/GOM/1023`). L'écran vert apparaît. *"L'acheteur sait qu'il peut payer son acompte en toute sécurité."*
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
