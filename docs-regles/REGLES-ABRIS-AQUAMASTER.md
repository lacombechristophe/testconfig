# Règles configurateur — Abris Aquamaster

## Gammes présentes dans les sources

- Master Plat amovible cintré ;
- Master Ultra Bas 1.2 ;
- Master Bas 1.8, 3.0 et 5.0 ;
- Master XXL 1.8, 3.0 et 5.0 ;
- Master 180 ;
- Master Mi-Haut ;
- Master Haut ;
- Master Deck ;
- Master Spa.

Les catalogues HT et TTC 2026 contiennent les grilles complètes, reproduites dans `ANNEXE-DONNEES-SOURCES.md`. La feuille de simulation fournie ne couvre directement que les Master Bas 1.2, 1.8 et 3.0.

## Données d'entrée et dimensions dérivées

Dans les feuilles de simulation :

- `longueur_abri_cm = longueur_bassin_cm + 20` ;
- `largeur_abri_cm = largeur_bassin_cm + 30` ;
- exemple `8,00 × 4,00 m` intérieur → abri `8,20 × 4,30 m`, quatre modules, corde 480.

La largeur/corde détermine la colonne tarifaire. Le nombre de modules/éléments doit être déterminé par une table ou une règle validée par Xavier : aucune formule générale fiable n'est fournie.

## Limites et règles techniques

| Gamme | Corde maximale | Largeur maxi par élément | Règles complémentaires |
|---|---:|---:|---|
| Master Plat | 5,50 m | 2,10 m | Façade transparente seulement entre 4,90 et 5,50 m ; gris 7016 uniquement |
| Ultra Bas 1.2 | catalogue : 5,30 m | 2,10 m | Guides Omega ; le tableau contient une référence `-2-570`, contradiction à arbitrer |
| Bas 1.8 / 3.0 / 5.0 | 5,80 m | 2,10 m | Guides Omega, façades démontables |
| Master XXL | 10,00 m | 2,15 m | Rail anti-soulèvement obligatoire de 8 à 10 m de corde |
| Master 180 | 10,00 m | 2,15 m | Rail anti-soulèvement obligatoire de 8 à 10 m |
| Master Mi-Haut | 10,00 m | 2,15 m | Faîtage maximal 1,80 m ; rail anti-soulèvement de 8 à 10 m |
| Master Haut | 10,00 m | 2,15 m | Hauteur nominale 1,90 m ; rail anti-soulèvement de 8 à 10 m |

Règles de grandissement :

- abris bas : `+6 cm` par voûte supplémentaire en hauteur et `2 × 6 cm` en largeur ;
- stockage des abris bas : `218 cm + (nombre_voûtes - 1) × 5 cm` ;
- mi-haut/haut : `+7,5 cm` par voûte supplémentaire en hauteur et `2 × 7,5 cm` en largeur.

## Composition standard des abris bas

- toiture polycarbonate alvéolaire 8 mm ;
- latéraux polycarbonate plein transparent ;
- façades polycarbonate 8 mm alvéolaire translucide ;
- façades démontables ;
- guides Omega ;
- couleurs standard relevées : RAL 7016, RAL 7037, Noir sable 2100, Mars sable 2525, Lichen fine texture, RAL 7022 fine texture.

## Sélection du tarif public

La clé de lookup est :

`(gamme, nombre_elements, classe_corde)`

Classes des Master Bas :

- `330 à 390 cm` ;
- `>390 à 480 cm` ;
- troisième palier selon modèle : `>480/530 à 530/540/550/570/580 cm`.

Classes XXL : `600-700`, `>700-800`, `>800-900`, `>900-1000 cm`.

Classes mi-haut/haut : `400-500`, `>500-600`, `>600-700`, `>700-800`, `>800-1000 cm`.

Ne pas extrapoler entre deux lignes : sélectionner une référence exacte. En dehors d'une classe publiée, basculer sur « sur devis ».

## Logique commerciale des feuilles de simulation

### Master Bas 1.2 / 1.8

- Tarif public TTC récupéré dans la table `Tarifs MASTER`.
- `public_HT = public_TTC / 1,20`.
- Remise de vente sur la base : `33 %`.
- Remise de vente sur les options : `30 %`.
- Transport et pose : `0 %` de remise.
- Achat fournisseur : `50 %` du public HT pour produit/options ; transport et pose à 100 %.
- Exemple 8 × 4 : public base `11 948 € TTC`, transport `525,60 € TTC`, pose `850 € TTC`, prix client calculé `9 380,76 € TTC`.

### Master Bas 3.0

- Même logique, avec la remise de vente base `33 %` confirmée par Xavier pour chaque référence.
- Exemple 8 × 4 : prix client calculé `9 549,60 € TTC` avec le transport de référence actuellement câblé.

### Échéanciers de la feuille

- Client : `30 %` d'acompte, `40 %` à la visite technique, `30 %` de solde.
- Achat : `30 %` d'acompte fournisseur, `70 %` de solde.

## Options simplifiées de la feuille — prix publics TTC saisis

| Option | TTC source |
|---|---:|
| Façade démontable grand module | 385 € |
| Façade transparente petit/grand module | 385 € |
| Petit relevable 12 cm petite/grande façade | 385 € |
| Ouverture VISIO petit élément | 715 € |
| Découpe façade | 595 € |
| Canne de manipulation | 160 € |
| Plat escalier / adaptation plate | 715 € |
| Poutre | 375 € |
| Double poutre | 715 € |
| Motorisation | 4 057 € |

Ces valeurs sont une simplification et ne remplacent pas les options détaillées du catalogue 2026. Exemples de dépendances obligatoires du catalogue :

- découpe de façade uniquement avec installation Aquamaster ;
- petit relevable Ultra Bas 1.2 seulement à partir de cinq éléments ;
- motorisation tarifée différemment pour 4-5 éléments, 6-10 éléments, petit/grand élément et grande corde ;
- option « View » limitée à cinq voûtes et 480 cm de corde ;
- autre couleur non remisable, délai estimé à six semaines ;
- rail anti-soulèvement obligatoire pour certaines cordes ;
- adaptation spéciale nécessitant un gabarit.

## Installation et livraison

Les feuilles utilisent un forfait fixe `850 € TTC` de pose et `525,60 € TTC` de transport pour l'exemple. Xavier a confirmé la pose à `850 € TTC` et un transport **selon zone**. Le configurateur conserve donc `525,60 € TTC` comme transport de référence tant que la table zone/département des abris n'est pas reliée.

- catalogue HT : installation Master/Bas/Ultra Bas/Spa `1 400 €` ;
- catalogue TTC : même référence à `850 € TTC` ;
- feuille : `850 € TTC`.

La table catalogue par zone doit être reliée au département client avant de transformer le transport de référence en prix automatique définitif.

## Master Deck

- structure aluminium 6060T6, garantie annoncée 10 ans ;
- guides aluminium anodisé des deux côtés, sans encastrement ;
- visserie inox A4, roulettes inox concaves, filet, brosse et porte-brosse ;
- tarif structure en matrice `longueur plateau × portée plateau` ;
- plancher : `120 €/m²` ; bois Kebony sans plus-value dans la grille ;
- motorisation et nombre de moteurs dépendent du nombre de plateaux et de la surface ; les libellés de la source semblent inverser `MOT1` et `MOT2`, à vérifier.

## Master Spa

- deux éléments, diamètre intérieur 350 cm ;
- aluminium Qualicoat/Qualimarine, toiture polycarbonate Platinum 8 mm, latéraux 3 mm ;
- une partie fixe et une mobile, poids 250 kg, RAL 7016 uniquement ;
- tarif HT source `8 066,66 €`, installation `708,33 € HT` dans la page produit, à comparer au forfait catalogue.

## Conflits à arbitrer avant codage

- Les prix des feuilles ne correspondent pas toujours aux catalogues MAJ 02/2026.
- La table `Tarifs MASTER` calcule aussi un prix de vente à partir de `PA + marge 25/30 %`, différent du calcul de remise `33 %` ou `28 %` utilisé par les feuilles de devis.
- La feuille `Tarifs Abris 1.2 & 1.8.xls` dépend d'un lien externe vers `Tarifs ABRIS 3.0.xls`.
- Les prix HT/TTC d'installation du catalogue sont incohérents entre eux.
- Le configurateur actuel a des prix de base uniques par hauteur ; la source exige un prix par gamme, nombre d'éléments et classe de corde.
