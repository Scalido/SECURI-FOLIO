# Espace de traçage géomètre — conception

## Objectif

Améliorer la saisie spatiale de Smart Archive sans alourdir l'écran principal. La carte reste compacte dans le formulaire et s'ouvre en plein écran lorsque l'utilisateur choisit d'importer un levé RTK ou de tracer une parcelle manuellement.

## Parcours utilisateur

1. L'utilisateur atteint l'étape « Résolution spatiale » de Smart Archive.
2. La carte compacte présente le tracé courant et un bouton principal « Ouvrir l'espace de traçage ».
3. En plein écran, l'utilisateur choisit l'une des méthodes suivantes :
   - « Importer un levé RTK » pour charger un fichier CSV ou TXT ;
   - « Tracer manuellement » pour dessiner un polygone sur la carte.
4. Après l'import ou la création, l'utilisateur peut modifier les sommets du polygone.
5. La superficie est recalculée après chaque création ou modification.
6. « Valider le tracé » enregistre le GeoJSON dans l'état du formulaire et ferme le plein écran.
7. « Annuler » ferme le plein écran et restaure le tracé présent avant son ouverture.

## Interface

### Carte compacte

- Conserver les dimensions actuelles dans la page Smart Archive.
- Afficher le tracé validé, la superficie calculée et le bouton d'ouverture du plein écran.
- Conserver l'option « Localisation spatiale inconnue ».

### Mode plein écran

- Utiliser toute la surface disponible sous un en-tête fixe.
- Présenter clairement les actions « Importer un levé RTK », « Tracer manuellement », « Annuler » et « Valider le tracé ».
- Conserver les fonds Satellite et Plan, la recherche d'adresse et la géolocalisation GPS.
- Appliquer la charte claire institutionnelle SÉCURIFOLIO : fond blanc, bordures ardoise et action principale bleu ciel.
- Rester utilisable sur ordinateur, tablette et téléphone en orientation paysage.

## Comportement cartographique

- Autoriser un seul polygone de parcelle à la fois.
- L'import RTK remplace le polygone temporaire affiché dans l'éditeur.
- Le tracé manuel remplace le polygone temporaire précédent après confirmation visuelle par l'utilisateur.
- Activer la création, l'édition et la suppression des polygones Leaflet.
- Exiger au moins trois sommets distincts.
- Fermer automatiquement l'anneau GeoJSON avant transmission.
- Recalculer la surface avec Turf après création et après chaque modification.
- Ajuster automatiquement la carte à l'emprise d'un fichier RTK importé.

## État et validation

Le composant cartographique distingue deux états :

- `committedGeometry` : tracé validé utilisé par le formulaire Smart Archive ;
- `draftGeometry` : tracé temporaire modifié dans l'espace plein écran.

À l'ouverture, le brouillon est initialisé depuis le tracé validé. « Valider le tracé » remplace l'état validé par le brouillon. « Annuler » détruit le brouillon et préserve le tracé validé.

La validation est refusée lorsque :

- aucun polygone n'est présent ;
- le polygone contient moins de trois sommets distincts ;
- la surface calculée est nulle ou invalide.

Les erreurs sont affichées dans l'espace de traçage sans fermer la carte.

## Compatibilité des fichiers

Cette évolution conserve le format existant :

- fichiers `.csv` et `.txt` ;
- colonnes reconnues : `latitude`, `lat` ou `y`, et `longitude`, `lon`, `lng` ou `x` ;
- valeurs en degrés décimaux ;
- au moins trois lignes de coordonnées valides.

Le support KML reste hors périmètre de cette évolution et ne doit plus être annoncé comme disponible dans l'interface.

## Composants concernés

- `src/app/smart-archive/page.tsx` : gestion de l'ouverture, du brouillon, de la validation et de l'annulation.
- `src/components/MapDigitizer.tsx` : import RTK, tracé manuel, édition, suppression et synchronisation du polygone.

L'interface entre les composants doit permettre de fournir une géométrie initiale et de remonter le GeoJSON ainsi que la superficie calculée, sans déplacer la logique de persistance serveur.

## Vérification

- Importer un CSV RTK et vérifier l'ouverture plein écran, le cadrage et la superficie.
- Modifier un sommet importé et vérifier le recalcul de la superficie.
- Créer un polygone manuellement et le valider.
- Annuler une modification et vérifier la restauration du tracé antérieur.
- Refuser la validation d'un tracé absent ou invalide.
- Vérifier le fonctionnement sur ordinateur et sur un écran mobile en paysage.
- Vérifier que le GeoJSON validé reste transmis à `saveCertificate` sans modification du contrat serveur.

## Hors périmètre

- Import KML, GPX ou fichiers propriétaires d'appareils RTK.
- Conversion de systèmes de coordonnées projetées vers WGS84.
- Détection PostGIS des chevauchements entre parcelles.
- Signature électronique du levé par le géomètre.
