---
title: "Guide d'Utilisation - Sécurifolio"
author: "Foncier Mabele IA"
pdf_options:
  format: A4
  margin: 20mm
css: |
  body {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    color: #1a1a1a;
    background-color: #ffffff;
    line-height: 1.6;
  }
  h1 {
    color: #0f4c81;
    font-size: 24pt;
    text-align: center;
    border-bottom: 2px solid #0f4c81;
    padding-bottom: 10px;
    margin-bottom: 30px;
  }
  h2 {
    color: #0f4c81;
    font-size: 16pt;
    margin-top: 25px;
    margin-bottom: 15px;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 5px;
  }
  h3 {
    color: #10b981;
    font-size: 14pt;
    margin-top: 20px;
    margin-bottom: 10px;
  }
  p, ul, li {
    font-size: 11pt;
  }
  .warning {
    background-color: #fffbeb;
    border-left: 4px solid #f59e0b;
    padding: 10px;
    margin: 15px 0;
  }
---

<h1>Guide d'Utilisation Officiel : Sécurifolio</h1>

**Sécurifolio** est la plateforme intelligente d'assainissement et de sécurisation des titres fonciers. Ce guide détaille les procédures pour les trois niveaux de responsabilité au sein de la Conservation Foncière (Agents, Cadastre, Conservateurs) ainsi que pour les utilisateurs publics (Notaires, Banques, Citoyens).

## 1. Accès au Système (Agents Uniquement)

L'accès en écriture au système est strictement réservé aux agents disposant d'une habilitation officielle.

1. Allez sur la page de connexion : `https://[votre-domaine]/login`
2. Saisissez votre **Email Officiel** (ex: `agent@foncier.gouv.cd`) et votre **Mot de passe**.
3. Cliquez sur **Ouvrir la session**.
4. En cas de succès, le système vous redirigera automatiquement vers le tableau de bord correspondant à votre rôle (Agent, Chef de Cadastre, ou Conservateur).

<div class="warning">
<strong>Attention :</strong> Toute tentative de connexion non autorisée est enregistrée dans l'historique d'audit du système.
</div>

## 2. Niveau 1 : Numérisation et Saisie (Smart Archive - Agents)

C'est ici que les agents transforment les archives papier en brouillons de certificats numériques.

### Étape 2.1 : Upload du Document
1. Dans le tableau de bord **Smart Archive**, cliquez sur la zone d'upload ou glissez-déposez la photo / le scan du **Certificat d'Enregistrement**.
2. Notre intelligence artificielle (Gemini Vision) va analyser le document en quelques secondes pour extraire les données textuelles et les entités nommées.

### Étape 2.2 : Vérification des Données Extraites
Une fois l'analyse terminée, le formulaire se remplit automatiquement. L'Agent doit **vérifier** et corriger les informations suivantes si nécessaire :
- Numéro Cadastral (ex: SU/GOM/1023)
- Nom du Propriétaire
- Volume & Folio
- Superficie et Circonscription
- Date d'établissement

### Étape 2.3 : Topographie et Numérisation Spatiale
1. L'Agent utilise la carte interactive présente sur la page pour dessiner le polygone de la parcelle, s'il est capable de l'identifier avec précision.
2. Si les coordonnées ne sont pas disponibles, cochez la case *Topographie Requise*.

### Étape 2.4 : Scellement Initial et Mise en Attente Cadastrale
1. Cliquez sur le bouton de soumission.
2. Le document est enregistré avec le statut initial **"En attente de validation cadastrale"**. *Le document est ainsi transmis au niveau 2 (Cadastre) pour contrôle.*

## 3. Niveau 2 : Vérification Technique (Dashboard Cadastre - Chef du Cadastre)

Le Chef du Cadastre (Rôle: `chef_cadastre`) est responsable de valider techniquement et spatialement les brouillons saisis par les Agents.

1. Allez sur le tableau de bord : `https://[votre-domaine]/cadastre-dashboard` (redirection automatique après login).
2. Vérifiez l'exactitude des informations techniques (Superficie, Mesurage) des dossiers "En attente".
3. Assurez-vous qu'il n'y a **aucune superposition** spatiale avec des parcelles voisines en consultant le plan cadastral numérique.
4. **Valider Techniquement** : Le dossier passe au statut "Validé techniquement" et est envoyé au Conservateur.
5. **Rejeter (Falsifié / Litige)** : Le dossier est rejeté s'il comporte des erreurs fatales ou de fausses informations techniques.

## 4. Niveau 3 : Validation Juridique et Scellement (Dashboard Conservateur)

Le Conservateur des Titres Immobiliers (Rôle: `conservateur`) possède la compétence juridique exclusive pour sceller un titre. Il n'évalue que les titres ayant déjà été techniquement validés par le Cadastre.

1. Allez sur le tableau de bord : `https://[votre-domaine]/conservateur-dashboard` (redirection automatique après login).
2. Vous y verrez la file d'attente des titres ayant le statut **"Validé techniquement"**.
3. Vérifiez l'historique juridique, l'authenticité des signatures originelles, et l'identité des propriétaires.
4. **Approuver** : Le Conservateur appose sa signature numérique. Le titre est cryptographiquement scellé et obtient le statut définitif **"Valide"**.
5. **Rejeter** : Marque le titre comme "Falsifié" ou en "Litige" si une irrégularité juridique est découverte in extremis.

## 5. Portail Public de Due Diligence (Anti-Folio)

Ce portail permet aux acheteurs, notaires et banques de vérifier instantanément l'état et la légitimité d'un titre avant de s'engager dans une transaction.

1. Rendez-vous sur la page publique : `https://[votre-domaine]/anti-folio`
2. Dans la barre de recherche, saisissez le **Numéro Cadastral exact** (ex: `SU/GOM/1023`).
3. Cliquez sur **Scanner le Titre**.

### Interprétation des Résultats Visuels

*   🟢 **Titre Authentique & Valide (Bouclier Vert) :** Le terrain est "clean". Le titre a passé toutes les étapes de validation jusqu'au Conservateur. L'empreinte est sécurisée et l'historique est limpide.
*   🟠 **En attente de validation (Horloge Orange) :** Le document a été saisi par un agent, et est en cours de traitement soit au niveau du Cadastre (vérification technique), soit chez le Conservateur (signature juridique). Il n'est pas encore garanti par l'État.
*   🔴 **En Litige (Alerte Rouge - Conflit Spatial) :** Le terrain fait l'objet d'un conflit de superposition ou de double-titre ("Phénomène Folio"). La transaction est fortement déconseillée.
*   🔴 **Falsifié / Inconnu (Alerte Rouge - Faux Titre) :** Ce titre n'est pas reconnu par le registre numérique de l'État ou a été formellement rejeté par les instances de validation. C'est potentiellement une escroquerie.

---

*Fin du guide. Pour tout problème technique, veuillez contacter l'administrateur système.*
