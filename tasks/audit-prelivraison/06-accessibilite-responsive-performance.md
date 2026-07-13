# Audit accessibilité, responsive et performance

Date : 2026-07-13

## Verdict

La base est exploitable, mais plusieurs détails empêchent de considérer la recette WCAG et mobile comme terminée : choix historiques non sémantiques, gestion incomplète du focus des modales, erreurs de formulaire insuffisamment reliées, critères supprimés sur mobile et images historiques chargées trop tôt.

## Priorités WCAG 2.2 AA

1. Utiliser de vrais boutons/radios pour les choix produit et assurer la navigation clavier attendue.
2. Rendre le focus visible sur tous les contrôles et conserver un ordre logique.
3. Relier chaque message d'erreur à son champ avec `aria-describedby` et annoncer le résumé dynamique.
4. Rendre le fond inert dans les modales, piéger le focus, fermer avec `Escape` et restaurer le déclencheur.
5. Assurer des cibles tactiles de 44 × 44 px sur mobile.
6. Respecter `prefers-reduced-motion` et éviter toute transition indispensable à la compréhension.
7. Corriger la structure des titres sans utiliser leur taille comme substitut visuel.

## Responsive

| Vue | Contrôle |
|---|---|
| 1440 / 1280 | Contenu centré, lignes lisibles, CTA visibles, images nettes |
| 1024 / 961 / 960 | Pas de rupture brutale de grille ni d'état différent non justifié |
| 768 / 720 | Navigation, comparateur et formulaire utilisables au tactile |
| 390 / 320 | Pas de débordement global, cartes directes compactes, textes de bouton lisibles |
| 568 × 320 | En-tête réduit, contenu non écrasé, actions accessibles malgré le clavier |
| Zoom 200 % | Reflow sans perte de contenu ni scroll horizontal global |

## Performance

- Charger les images du configurateur historique seulement lors de son ouverture.
- Utiliser les WebP de conseiller pour les listes et réserver les grands fichiers aux détails.
- Définir largeur/hauteur ou `aspect-ratio` pour limiter le CLS.
- Précharger seulement la police et l'image réellement critiques.
- Servir JS/CSS versionnés avec cache immutable ; garder `config.js` revalidable.
- Vérifier que le fallback SPA ne renvoie jamais l'HTML à la place d'un asset absent.

Budget proposé sur mobile médian : LCP <= 2,5 s, CLS <= 0,1, INP <= 200 ms, aucun asset initial inutile supérieur à 500 Ko et poids initial à maintenir sous 1,5 Mo. Ces valeurs doivent être mesurées sur une preview, pas déduites du local.

## Recette humaine non simulée

- Safari iOS sur iPhone réel, avec ouverture du clavier et photo.
- Chrome Android sur appareil réel, retour système et upload.
- VoiceOver iOS et NVDA/Firefox ou NVDA/Chrome.
- Zoom navigateur 200 % et taille de texte système agrandie.
- Connexion lente et appareil de gamme moyenne.

## Challenge

Augmenter toutes les cibles sans revoir la densité peut rendre le parcours inutilement long sur mobile. Les 44 px s'appliquent aux actions, pas à chaque bloc informatif. Reporter les images améliore le chargement initial, mais il faut réserver leur espace pour éviter un saut au moment de l'ouverture du configurateur.
