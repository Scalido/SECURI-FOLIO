# Démo - Smart Archive

Ce dossier contient les fichiers nécessaires pour tester l'outil **Smart Archive** (Numérisation et Vérification des certificats fonciers).

## Fichiers RTK (Topographie)

Lors de la numérisation, l'agent doit importer les données géospatiales réelles levées par le géomètre. Utilisez ces fichiers pour simuler différents cas :

1. **`rtk_1_authentique_450m2.csv`**
   - **Scénario** : Parcelle parfaitement valide.
   - **Utilisation** : À uploader lorsque vous testez avec le scénario "Authentique" (450 m²). Les coordonnées généreront un polygone correspondant exactement à la superficie déclarée.

2. **`rtk_2_falsifie_superficie_1000m2.csv`**
   - **Scénario** : Tentative de spoliation ou d'agrandissement illégal.
   - **Utilisation** : À uploader pour tester les anomalies de superficie. Le certificat indique 450 m², mais le levé topographique indique plus de 1000 m². L'IA détectera cette anomalie (Drapeau Rouge).

3. **`rtk_3_conflit_voisin_decale.csv`**
   - **Scénario** : Empiètement sur une parcelle voisine.
   - **Utilisation** : Ce levé est décalé et provoquera un conflit spatial avec les parcelles déjà enregistrées dans le cadastre numérique.

## Certificats (Images)

Pour générer des images de certificats d'enregistrement avec des données factices parfaites pour les tests :
1. Allez sur la page `/smart-archive`
2. Déroulez le panneau **"Outils de Test (Démo)"** situé en bas à droite ou en haut.
3. Cliquez sur l'un des boutons de génération automatique (Authentique, Falsifié, etc.). Le système va générer et télécharger automatiquement une image PNG réaliste prête à être uploadée.
