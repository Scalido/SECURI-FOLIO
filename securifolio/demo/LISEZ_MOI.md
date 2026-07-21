# Foncier Mabele IA (SECURI-FOLIO) - Kit de Démo

Ce dossier contient les éléments de test conçus spécifiquement pour les outils actuellement implémentés dans la plateforme.

## 1. Numérisation & Vérification (Smart Archive)
**Dossier : `1_smart_archive/`**

La page `/smart-archive` permet au Conservateur de numériser et vérifier un certificat. Cet outil utilise l'IA Gemini pour lire le document, et un algorithme spatial pour vérifier les coordonnées.

**Éléments fournis :**
   - **Images des Certificats (.png)** : `certificat_1_authentique.png`, `certificat_2_falsifie_rature.png`, etc., prêts à être envoyés à l'IA pour l'extraction de données.
   - **Fichiers RTK (.csv)** : Coordonnées GPS réelles à uploader lors de l'étape de localisation (Authentique, Falsifié par agrandissement, Conflit de voisinage).
   - *Note : Vous pouvez toujours utiliser le menu "Outils de Test" de la page pour générer des certificats à la volée.*

**Comment tester :**
1. Uploadez l'une des images `.png` fournies dans le dossier `1_smart_archive/` dans l'interface `/smart-archive` pour déclencher l'analyse IA.
2. Lorsqu'on vous demande les données RTK, uploadez l'un des fichiers `.csv` fournis dans le dossier `1_smart_archive/` :
   - `rtk_1_authentique_450m2.csv` : Coordonnées conformes.
   - `rtk_2_falsifie_superficie_1000m2.csv` : Levé topographique qui ne correspond pas au certificat (déclenche une alerte de superficie).
   - `rtk_3_conflit_voisin_decale.csv` : Déclenche un avertissement spatial.
3. Validez l'enregistrement à la fin pour que la donnée soit insérée dans la base Supabase.

## 2. Vérification Publique (Anti-Folio)
**Dossier : `2_anti_folio/`**

La page `/anti-folio` est le portail public qui interroge la base de données (Supabase) pour s'assurer qu'un titre n'est pas un faux.

**Comment tester :**
Lisez les instructions dans le fichier `2_anti_folio/requetes_test.md`. L'outil interrogeant la vraie base de données, vous devrez utiliser les identifiants des certificats que vous avez réellement numérisés et sauvegardés via Smart Archive lors de l'étape précédente pour obtenir un écran "Sain". Tapez un faux numéro (ex: `SU/XXX`) pour voir l'alerte "Faux Document".

---
*Note : Restez sur le code réel. Les données de ce kit sont conçues pour être exploitées par les composants existants du code source (extraction IA et appels base de données Supabase).*
