# Audit design, UI et motion

Date : 2026-07-13

## Direction retenue

Le conseiller doit ressembler à un outil de conseil premium, calme et précis, pas à une landing page décorative. Le système visuel repose sur le bleu Diskoov, un bleu profond pour le texte, l'orange de marque pour les accents et des neutres légèrement bleutés. Le vert et le rouge sont réservés aux états sémantiques. Les familles se distinguent par leur iconographie et leur contenu, pas par des aplats de couleurs arbitraires.

## Ce qui fonctionne

- Logo réel et photographie produit dès le premier écran.
- Hiérarchie plus nette entre promesse, actions et preuve.
- Icônes cohérentes dans les composants récents.
- Rayon contenu, bordures fines et densité compatible avec un outil professionnel.

## Points à corriger

### UI-01 - Important - Deux langages visuels

Le conseiller bleu/orange et certains écrans historiques noir/or doivent être alignés sur les mêmes tokens, boutons, champs et états. La transition vers le configurateur ne doit pas donner l'impression de quitter le produit.

### UI-02 - Important - Cartes de recommandations trop « blocs colorés »

Les cartes doivent utiliser une base blanche commune, une bordure de sélection, un accent discret et une hiérarchie constante : rang, image/icône, titre, bénéfice, contrainte, CTA. Une couleur de fond différente pour chaque famille réduit la lisibilité et paraît décorative.

### UI-03 - Important - Informations techniques sans composition

Les couples `Fonctionnement` / `À prévoir` ne doivent pas être de simples cellules séparées par une ligne. Utiliser deux lignes de caractéristiques avec icône, libellé court et valeur, ou un mini-tableau sans cadre externe.

### UI-04 - Important - Cibles et états

Tous les contrôles interactifs doivent atteindre 40 px sur desktop et 44 px sur mobile, avec focus visible, hover non mobile, état pressé, sélection et désactivation explicites. Les icônes doivent être centrées optiquement dans une boîte de taille stable.

### UI-05 - Important - Modales et images

Le fond doit être inert, le focus piégé puis restauré, `Escape` doit fermer. Les images conservent leur ratio avec `object-fit` adapté ; aucune lightbox ne doit recadrer une information technique importante.

### UI-06 - Polish - Mouvement trop pauvre ou gratuit selon les zones

Ajouter seulement des transitions fonctionnelles de 160 à 240 ms : sélection, disclosure, changement d'étape, message inline. Pas de mouvement continu, parallaxe, dégradé animé ou entrée en cascade longue. Respecter `prefers-reduced-motion`.

## Système de composants cible

| Composant | Règle |
|---|---|
| Bouton principal | Bleu profond, libellé d'action, icône directionnelle si utile, état loading stable |
| Bouton secondaire | Fond blanc, bordure bleue, même hauteur que le principal |
| Carte de choix | Surface neutre, icône 20–24 px, sélection par bordure + fond subtil + coche |
| Carte produit | Image au ratio stable, bénéfice avant technique, CTA aligné en bas |
| Repère de confiance | Une preuve vérifiable et datée, sans badge décoratif |
| Caractéristique | Icône sémantique, libellé court, valeur lisible, pas de carte imbriquée |
| Erreur | Texte proche du champ, icône et couleur sémantique, lien ARIA |
| Succès | Référence dossier, prochaine étape, délai uniquement s'il est validé |

## Contrôles responsive

- 1440/1280 : largeur de lecture contenue, pas de vide artificiel ni de hero surdimensionné.
- 1024/768/720 : grilles qui passent progressivement à deux puis une colonne sans rupture à 960/961.
- 390/320 : aucun texte tassé dans les boutons, pas de footer recouvrant, cartes compactes.
- 568 × 320 : réduction de l'en-tête et priorité au contenu/formulaire.
- Zoom 200 % : aucune action inaccessible et aucun scroll horizontal global.

## Challenge

Une harmonisation trop stricte peut gommer la personnalité des produits. La différenciation doit venir des vraies images, des bénéfices et des pictogrammes, non d'une palette arc-en-ciel. Ajouter plus d'animations donnerait une impression de modernité en capture, mais ralentirait un parcours de décision ; seules les transitions qui expliquent un changement d'état sont justifiées.
