# SÉCURIFOLIO RDC : Fondements et Vision de la Suite Technologique Foncière

SÉCURIFOLIO RDC est la plateforme institutionnelle dédiée à l'assainissement, la conformité et la sécurisation du secteur foncier et immobilier en République Démocratique du Congo. Cet écosystème repose sur trois piliers technologiques complémentaires visant à éradiquer l'insécurité juridique, la falsification documentaire et la superposition de titres de propriété.

---

## 1. Anti-Folio : La Transparence et l'Unicité Foncère

Le module **Anti-Folio** s'attaque au problème le plus ravageur du droit foncier congolais : la **superposition de titres de propriété** (communément appelée le « phénomène Folio »).

### Le Problème Historique
En raison d'erreurs d'archivage, de pertes physiques de documents ou d'actes de corruption, l'administration foncière a parfois émis plusieurs certificats d'enregistrement authentiques pour une seule et même parcelle physique. Cela crée des conflits interminables où plusieurs propriétaires légitimes de bonne foi revendiquent la même terre.

### Les Principes Fondamentaux de l'Outil
* **Clé unique (Numéro Cadastral) :** La recherche ne se fait pas sur le nom du propriétaire (facilement falsifiable), mais sur le numéro cadastral unique géographiquement (ex : `SU/GOM/1023`).
* **Détection automatique de superposition :** Si la base de données retourne plus d'un certificat actif pour un seul numéro cadastral, l'outil lève immédiatement une alerte rouge de fraude.
* **Classification par statuts de sécurité :** Chaque parcelle est auditée en temps réel et classée selon un statut de conformité clair :
  * **Valide** (Certificat unique, conforme et sans contestation).
  * **Litige** (Titre gelé administrativement ou judiciairement).
  * **Falsifié** (Incohérence entre les données physiques du papier et le registre central numérique).
  * **Inconnu** (Numéro inexistant, indiquant une contrefaçon intégrale).

---

## 2. Smart-Archive : La Numérisation Intelligente et l'Audit de Sécurité

Le module **Smart-Archive** assure la transition sécurisée des documents papier de l'administration vers la base de données numérique centralisée.

### Le Problème Historique
Les archives des Affaires Foncières en RDC sont majoritairement physiques et conservées dans des conditions précaires. De nombreux certificats anciens sont froissés, partiellement effacés ou falsifiés manuellement en altérant le texte physique (grattages, blanc correcteur/Tipp-Ex pour modifier la superficie, le volume ou le folio).

### Les Principes Fondamentaux de l'Outil
* **OCR Intelligent par Vision AI :** Utilisation d'un modèle d'IA multimodale de pointe (*Gemini Vision*) pour lire et structurer les données textuelles et cadastrales à partir d'images scannées, même très dégradées.
* **Détection visuelle des altérations physiques :** L'outil effectue un audit graphique minutieux pour repérer toute trace de retouche manuelle, d'effacement physique ou de correction suspecte sur les chiffres et les noms (phénomène d'altération de folio).
* **Validation croisée instantanée :** Une fois les métadonnées extraites (nom, volume, folio, superficie), elles sont immédiatement confrontées à la base de données centrale pour vérifier si le papier correspond exactement au registre numérique historique de l'État.

---

## 3. Foncier-Édu : La Vulgarisation Juridique et le Verrou d'Intégrité

Le module **Foncier-Édu** est un assistant virtuel en ligne spécialisé dans la législation foncière, cadastrale et locative de la RDC.

### Le Problème Historique
Les litiges fonciers et locatifs naissent souvent de l'ignorance des citoyens. De nombreux acheteurs ne connaissent pas les taxes officielles d'établissement de titre, les règles relatives à la garantie locative ou la nullité des morcellements de parcelles effectués sans autorisation administrative préalable.

### Les Principes Fondamentaux de l'Outil
* **Base réglementaire consolidée :** L'assistant intègre l'ensemble de la législation congolaise :
  1. La *Loi Foncière (Loi 73-021 modifiée par la Loi 25/062 de 2025)* (régime général des biens, concessions).
  2. L'*Ordonnance n° 74/148 de 1974* (mesures d'exécution de la loi foncière).
  3. La *Loi n° 15/025 du 31 décembre 2015* sur les baux à loyer non professionnels (garantie locative limitée à 3 mois, préavis obligatoire de 3 mois, interdiction d'expulsion arbitraire).
  4. L'*Arrêté Interministériel n° 0075 du 08 mai 2023* (tarification des droits et taxes foncières).
  5. L'*Arrêté n° 90-0012 du 31 mars 1990* (règles de mesurage, de bornage et superficie minimale de 300 m² pour morcellement en zone urbaine).
* **Verrou d'intégrité légale strict :** Pour éviter les conseils juridiques erronés ou les extrapolations dangereuses, l'assistant a interdiction de faire des déductions ou d'utiliser des connaissances externes. S'il n'a pas la réponse exacte dans les textes fournis, il renvoie systématiquement l'utilisateur vers un Conservateur officiel des Titres Immobiliers.
