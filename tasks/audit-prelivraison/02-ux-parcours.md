# Audit UX et parcours prospect

Date : 2026-07-13

## Résumé franc

L'entrée guidée par le besoin et l'accès direct répondent à deux intentions réelles. L'accueil donne désormais une proposition de valeur crédible, des repères de parcours et une preuve Google vérifiable. Le principal risque n'est plus l'absence de guidage, mais la densité et la continuité : certaines cartes produit sont trop longues sur mobile, les critères de comparaison disparaissent, la reprise perd du contexte et le formulaire n'amène pas toujours directement vers l'information manquante.

## Parcours cible

1. Comprendre en moins de cinq secondes que Diskoov aide à choisir une protection adaptée au bassin et aux usages.
2. Choisir entre `Être conseillé` et `Voir les solutions` sans jargon produit imposé.
3. Répondre à des questions courtes dont l'utilité est visible : priorités, forme, dimensions et contraintes.
4. Voir une recommandation principale expliquée, puis deux alternatives comparables.
5. Ouvrir le produit retenu sans rupture de contexte.
6. Compléter uniquement les informations indispensables au chiffrage ou à l'étude.
7. Demander un devis avec une promesse claire de vérification humaine et comprendre l'intérêt d'une photo.

## Problèmes prioritaires

### UX-01 - Important - Reprise incomplète

Le retour depuis le configurateur peut perdre le produit, le mode d'entrée ou des réponses non personnelles. La reprise doit restaurer le mode, le bassin, les priorités et le produit sans conserver inutilement les données personnelles.

### UX-02 - Important - Accès direct trop long sur mobile

Les fiches détaillées successives produisent plusieurs écrans de défilement avant de comparer. La première vue doit montrer une carte compacte : image, bénéfice principal, trois repères et action. Les détails techniques restent disponibles via un disclosure explicite.

### UX-03 - Important - Comparaison mobile appauvrie

Masquer des critères oblige à mémoriser les fiches précédentes. Les cinq critères essentiels doivent rester présents dans une version compacte et horizontalement stable.

### UX-04 - Important - Correction d'une information manquante trop indirecte

Après une recommandation ou dans le devis, le premier champ bloquant doit être annoncé avec une action `Compléter maintenant`, puis recevoir le focus sans saut incohérent.

### UX-05 - Important - Paysage mobile contraint

À 568 × 320, les en-têtes et actions fixes peuvent laisser trop peu d'espace au formulaire. Le mode faible hauteur doit réduire les éléments non essentiels et conserver des actions tactiles de 44 px.

### UX-06 - Polish - Détails ouverts/fermés peu explicites

Les contrôles doivent utiliser `Voir les détails` / `Masquer les détails`, refléter `aria-expanded` et conserver la position de lecture.

## Recommandations écran par écran

### Accueil

- Conserver le duo guidé/direct, la photographie réelle, les trois étapes et le module Google.
- Garder une seule promesse principale et éviter d'empiler des slogans.
- Ne pas ajouter de faux guide, de carrousel ou de métriques non vérifiées.

### Priorités

- Expliquer l'effet de la sélection en une phrase courte.
- Autoriser l'absence de priorité sans prétendre ensuite classer « selon vos priorités ».
- Limiter le nombre de sélections et rendre l'ordre visible si le classement en dépend.

### Piscine et projet

- Montrer visuellement rectangle, ovale et forme libre.
- Expliquer que les dimensions affinent la compatibilité et le prix, sans bloquer une première orientation.
- Distinguer « je ne sais pas » d'une valeur nulle.

### Recommandations

- Une solution principale, deux alternatives maximum au premier niveau.
- Pour chaque solution : raison de présence, bénéfice concret, principale contrainte, niveau de certitude et action.
- En l'absence de priorités, utiliser un titre neutre comme `Solutions adaptées à votre projet`.

### Accès direct

- Cartes compactes, comparables, avec détails à la demande.
- Ne pas utiliser une couleur complète différente par famille ; les icônes et accents suffisent.
- Préserver un chemin évident vers le mode guidé.

### Configurateur et devis

- Continuité visuelle et contextuelle avec le conseiller.
- Afficher un état de chargement précis, empêcher le double clic et conserver la référence serveur.
- Si l'email interne est envoyé mais la confirmation prospect échoue, annoncer la situation sans faire renvoyer la demande.

## Test utilisateur recommandé

Séance de 30 minutes avec cinq propriétaires non experts. Tâches : trouver une protection sans connaître les produits, modifier une priorité, traiter un bassin sans dimensions, comparer deux familles, puis commencer un devis. Mesures : compréhension initiale, temps jusqu'aux résultats, retours arrière, questions spontanées, produit cru « garanti compatible », capacité à expliquer la recommandation et intention de demander un devis.

## Challenge

Réduire le texte peut supprimer des contraintes utiles. La bonne cible n'est pas « moins de contenu » partout, mais une information progressive : bénéfice et décision d'abord, preuve et technique à la demande. Un accès direct trop compact peut aussi cacher les différences ; les cinq critères communs doivent rester visibles avant l'ouverture des détails.
