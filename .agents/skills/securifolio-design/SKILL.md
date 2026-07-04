---
name: securifolio-design
description: Directives graphiques, règles d'intégrité et principes de design premium pour la plateforme SÉCURIFOLIO RDC. Utiliser pour toute modification d'interface, d'assistant conversationnel ou de mise en page pour le Ministère des Affaires Foncières.
version: 1.0.0
---

Ce skill fournit les directives strictes de design et de code pour maintenir l'intégrité visuelle et institutionnelle de **SÉCURIFOLIO RDC**.

## 1. Philosophie & Posture Institutionnelle

*   **Sobriété Opérationnelle** : La plateforme est un outil administratif destiné aux Conservations des Titres Immobiliers (CTI), magistrats, notaires et citoyens.
*   **Ton Professionnel** : Éviter tout ton politique ou promotionnel. L'application met en œuvre de manière neutre et technique la législation foncière (**Loi n° 25/062 du 30 décembre 2025**).
*   **Aucune Hallucination Juridique** : L'assistant *Foncier-Édu* doit fonder ses réponses uniquement sur le texte de loi fourni, sans extrapolations.

## 2. Charte Graphique "Fond Clair Épuré"

*   **Arrière-plan Global** : Fond clair très doux (`bg-slate-50`) pour l'ensemble du corps de la page.
*   **Bleu Nuit Institutionnel** : Couleur dominante pour les structures (`bg-[#0a192f]` ou `text-[#0a192f]`), notamment pour la barre latérale (Sidebar) et les en-têtes majeurs.
*   **Accents Drapeau RDC** :
    *   **Bleu ciel** (`#007FFF`) : Boutons d'action principaux, liens actifs, focus de formulaires.
    *   **Jaune or** (`#F7D618`) : Éléments de distinction (logos, surbrillances, icône Bot).
    *   **Rouge** (`#CE1126`) : Bannières d'alerte critique, lignes fines d'accent.
*   **Composants Glassmorphism Clair** :
    *   Utiliser des cartes blanches semi-transparentes (`bg-white border-slate-200 shadow-sm`).
    *   Ajouter des transitions fluides et micro-animations de soulèvement (`hover:-translate-y-1 hover:shadow-md transition-all duration-300`).

## 3. Directives d'Implémentation Technique

### A. API Gemini (Chat)
*   **Ordre de l'Historique** : L'API Gemini exige que le premier message d'un historique (`history`) provienne d'un utilisateur (`user`). Ne jamais envoyer un message d'accueil de type `model` en premier élément de l'historique Gemini.

### B. Smart-Archive & Ingestion OCR
*   **Traitement base64 en Client** : Utiliser un `FileReader` côté client pour envoyer le document encodé directement au format base64 vers l'API, évitant ainsi le stockage temporaire non sécurisé.
*   **Vérification automatique** : Croiser systématiquement les données extraites avec le registre Supabase (`titres_fonciers`) et afficher clairement les badges de conformité (`Conforme` ou `Divergent`) à côté de chaque champ.

### C. Échappement TSX
*   **Syntaxe ESLint** : Toujours échapper les apostrophes et guillemets dans les fichiers TSX (utiliser `d&apos;établissement` ou `d&#39;établissement`) pour éviter les erreurs d'analyse syntaxique lors du build Next.js.
