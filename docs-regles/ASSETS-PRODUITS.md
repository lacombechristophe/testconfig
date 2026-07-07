# Correspondance des images produit

Les 17 images du dossier source ont été copiées sous `assets/produits/` avec des noms normalisés pour le Web. Elles doivent être affichées uniquement dans le parcours correspondant.

## Abris Aquamaster

| Fichier | Produit / usage |
|---|---|
| `assets/produits/abris/master-ultra-bas-1-2.jpg` | Carte et aperçu Master Ultra Bas 1.2 |
| `assets/produits/abris/master-bas-1-8.jpg` | Carte et aperçu Master Bas 1.8 |
| `assets/produits/abris/master-mi-haut.jpg` | Carte et aperçu Master Mi-Haut |

Ne pas utiliser l'image 1.8 pour représenter automatiquement les modèles 3.0 ou 5.0 sans mention « visuel non contractuel ».

## Couverture à barres

| Fichier | Produit / usage |
|---|---|
| `assets/produits/bab/couverture-a-barres.jpg` | Visuel principal BAB |
| `assets/produits/bab/rolling-up.jpg` | Option Rolling-Up |

## Oré

| Fichier | Produit / usage |
|---|---|
| `assets/produits/ore/ore-fermee.jpg` | État fermé |
| `assets/produits/ore/ore-ouverte.jpg` | État ouvert/enroulé |
| `assets/produits/ore/decoupe-bloc-filtration.jpg` | Option découpe bloc filtrant |
| `assets/produits/ore/encombrements-60-80-45cm.jpg` | Aide dimensionnelle et contrôle d'éligibilité |

L'image d'encombrement doit accompagner les champs relatifs aux plages disponibles ; elle contient les cotes métier 60 cm, 80 cm et 45 cm.

## Volets hors-sol

| Fichier | Produit / usage |
|---|---|
| `assets/produits/volets-hors-sol/volet-hors-sol-escalier-solaire.jpg` | Visuel principal, escalier roman et alimentation solaire |
| `assets/produits/volets-hors-sol/enroulement-hors-sol.jpg` | Détail structure/enroulement |
| `assets/produits/volets-hors-sol/tablier-hors-sol.jpg` | Tablier déployé |

## Volets immergés

| Fichier | Produit / usage |
|---|---|
| `assets/produits/volets-immerges/volet-immerge-gris.jpg` | Tablier gris fermé |
| `assets/produits/volets-immerges/volet-immerge-blanc.jpg` | Tablier blanc partiellement ouvert |
| `assets/produits/volets-immerges/volet-immerge-ouvert.jpg` | Bassin avec volet ouvert |
| `assets/produits/volets-immerges/fond-bassin-caillebotis-1.jpg` | Mur/fosse et caillebotis |
| `assets/produits/volets-immerges/fond-bassin-caillebotis-2.jpg` | Variante de caillebotis immergé |

## Règles d'intégration

- Fournir un texte alternatif décrivant le produit, pas le nom du fichier.
- Conserver le ratio original avec `object-fit: cover` pour les cartes et `contain` pour les schémas/cotes.
- Ne pas mélanger les visuels hors-sol et immergés.
- Afficher les images d'option seulement lorsque l'option ou l'aide associée est visible.
- Les petites images historiques peuvent être utilisées en vignette, pas comme image plein écran.
- Les fichiers sont des JPEG sources ; une conversion WebP/AVIF optimisée pourra être faite lors de l'intégration UI sans supprimer les originaux.

## Devis concurrent

`Devis CONCU_PISCEEN_DEVIS (1).pdf` est un devis concurrent Pisceen/DERCYA daté de 2022. Il sert uniquement de benchmark de composition d'offre, de câblage, de livraison et d'installation. Ses références, prix, remises et conditions ne doivent jamais alimenter les calculs Diskoov.
