# Audit de couverture des sources et écarts

## Résultat de la vérification

- 34 fichiers inventoriés et consultés.
- 6 PDF, 97 pages au total, texte extrait page par page et rendu visuel contrôlé.
- 2 DOCX, 58 paragraphes extraits ; rendu Word contrôlé visuellement.
- 9 classeurs, 22 feuilles et toutes les cellules non vides/formules exportées.
- 17 images inspectées à leur résolution d'origine.
- Les données détaillées sont reprises dans les documents métier et dans `ANNEXE-DONNEES-SOURCES.md`.
- Le registre avec empreintes et traitement de chaque fichier se trouve dans `COUVERTURE-SOURCES-ORIGINALES.md`.

## Matrice de couverture — 34/34

| ID | Source | Contenu repris |
|---|---|---|
| S001 | Abri_Master-mi-haut.jpg | Visuel Master mi-haut ; classification d'asset |
| S002 | Abri_Master_bas_1.2.jpg | Visuel Ultra Bas 1.2 |
| S003 | Abri_Master_Bas_1.8.jpg | Visuel Master Bas 1.8 |
| S004 | Tarif 2026 Aquamaster HT — abris.pdf | 34 pages : caractéristiques, références, prix HT, options, pose/livraison, piscines et PLV |
| S005 | Tarif 2026 Aquamaster TTC — abris.pdf | 34 pages : prix TTC/commerciaux et comparaison HT |
| S006 | Tarifs Abris 1.2 & 1.8.xls | Dimensions dérivées, remises, options, paiements, exemple 8×4 |
| S007 | Tarifs ABRIS 3.0.xls | Table Master et simulateur Bas 3.0, coûts/marges |
| S008 | BAB Rolling up.JPG | Visuel accessoire Rolling-Up |
| S009 | BAB.JPG | Visuel couverture à barres installée |
| S010 | Devis BAB 2026.xls | Grille produits/options, formules et exemple de prix |
| S011 | DV0003845_BAB_TEST.pdf | Fiche technique BAB, devis test, échéancier et contraintes |
| S012 | PROJET Simulateur BAB.docx | Champs formulaire, dimensions maxi, formule de surface, options |
| S013 | DV0003844_Devis Test_ORE ESSENTIEL.pdf | Technique Oré, implantation, devis test, coloris, garantie, délais |
| S014 | Oré Découpe bloc.jpg | Visuel de découpe de bloc de filtration |
| S015 | Oré Encombrements.jpg | Cotes visuelles 60 cm, 80 cm, hauteur 45 cm |
| S016 | Oré2.jpg | Visuel Oré fermé |
| S017 | Oré5 (2).jpg | Visuel Oré ouvert/enroulé |
| S018 | PROJET Simulateur Oré.docx | Formulaire, max Essentiel/Compact, prestations/options |
| S019 | Tarif_Ore_Compact.xlsx | Matrice Compact, prestations, options et feuille détaillée |
| S020 | Tarif_Ore_Essentiel.xlsx | Matrice Essentiel, recul supplémentaire, prestations et détaillé |
| S021 | Devis CONCU_PISCEEN_DEVIS (1).pdf | Devis concurrent Pisceen/DERCYA 2022 : benchmark de composition, câblage et pose uniquement ; prix exclus du moteur Diskoov |
| S022 | DV0003839_Volet Hors-Sol Aquamaster.pdf | Fiche technique, coloris, options, devis test, échéancier |
| S023 | LAMES - ESCALIER ET EMBALLAGES 2026.xlsm | Toutes les références/prix lames, escaliers, découpes, emballages |
| S024 | SIMU Volet immergé 2026.xls | Structures, murs, poutres, caillebotis, formules et scénarios |
| S025 | Simu Volets hors-sol 2026.xls | Structures fixes/Mouv & Roll, options, formules et exemple |
| S026 | Tarifs livraison + installation volets 2026.xlsx | 95 départements, Belgique/Corse, suppléments de pose |
| S027 | Volet Fond bassin2.JPG | Visuel volet immergé avec mur/caillebotis |
| S028 | Volet Fondbassin3.JPG | Visuel fosse/caillebotis immergé |
| S029 | Volet horssol 3.jpg | Visuel hors-sol avec escalier roman et alimentation solaire |
| S030 | Volet horssol1.JPG | Visuel structure/enroulement hors-sol |
| S031 | Volet horssol2.JPG | Visuel tablier hors-sol |
| S032 | Volet immergé 1.JPG | Visuel tablier immergé gris |
| S033 | Volet immergé 2.JPG | Visuel immergé ouvert |
| S034 | Volet immergé 3.JPG | Visuel immergé blanc |

## Conflits tarifaires bloquants

### Source concurrente exclue

Le devis S021 Pisceen/DERCYA est un document concurrent. Aucune référence, aucun prix, aucune remise et aucune condition commerciale de ce devis ne doit être importé dans les règles Diskoov. Seuls son niveau de détail, ses prérequis de câblage et sa présentation livraison/installation peuvent servir de benchmark fonctionnel.

### BAB

- Xavier a validé pour le configurateur : PU SECU CLASSIC `36,04 €/m² HT`, remise client `35 %`, emballage `96 € HT`, transport `132 € HT`, garantie `3 ans`.
- Le devis test (`35,33 €/m²`, remise `40 %`, transport `128 € HT`) reste un scénario de contrôle et ne doit pas devenir la grille tarifaire.

### Oré

- Base 10×5 : feuille détaillée `7 598`, matrice Essentiel `7 298`.
- Classeur Compact duplique un exemple 10×5 hors périmètre.
- Xavier a confirmé que les matrices sont HT et que le prix prospect doit venir des Excel.
- Le configurateur retient la feuille prestations pour transport `428 € HT`, pose Essential `310 € HT`, pose Compact incluse et options principales à remise `20 %`.
- Le recul supplémentaire suit le barème par largeur `180-300 € HT`; la couleur hors standard suit `5 %` de la base.

### Abris

- Prix publics des feuilles et catalogue MAJ 02/2026 non concordants.
- Deux méthodes de prix client dans les mêmes classeurs : remise commerciale sur public ou coût d'achat + marge. Xavier confirme que l'Excel sert au prix client et le catalogue AquaMaster aux limites techniques / calculs internes.
- Pour Master 30, Xavier demande le même taux de remise que les autres références : `33 %`.
- Pose : `850 € TTC`. Transport : selon zone, à relier ensuite ; le moteur garde un transport de référence tant que la zone abri n'est pas automatisée.
- La feuille 1.2/1.8 contient un lien externe vers le classeur 3.0.

### Volets

- Remises du devis hors-sol (35 % structure, 38 % lames) différentes de la feuille (30 % et 40 %).
- Garantie lames 3 ans dans le devis contre 5 ans dans la fiche.
- OXEO `214,60 €` dans la grille, `315 €` dans les simulations.
- Emballage immergé `149 €` dans la grille Subwater, `126 €` facturé/`96 €` coût dans les exemples.
- Scénario « 12×6 » dupliqué sur 10×5.
- Option polycarbonate hors-sol ajoutée comme prix complet au lieu d'un delta.

## Décisions encore nécessaires

1. Volets : confirmer les remises finales à utiliser quand le devis et le simulateur divergent, ainsi que le traitement automatique des escaliers/solaire/polycarbonate.
2. Abris : relier la livraison à une vraie zone/département et valider la formule finale du nombre de modules.
3. Abris : préciser quelles options avancées doivent rester sur devis ou devenir automatiques.
4. MasterDeck : corriger/valider la matrice commerciale et la correspondance moteurs.
5. Produits non exposés du catalogue AquaMaster : confirmer s'ils restent hors configurateur pour l'instant.

## Critères d'acceptation pour l'intégration

- Chaque prix retourné doit pointer vers une référence source et un millésime.
- Aucun calcul ne doit dépendre d'un lien Excel externe.
- Les valeurs « sur devis » ne doivent jamais produire un prix ferme.
- Les tests doivent couvrir toutes les bornes de dimensions, notamment 3,90/4,80/5,80 m, 4/5/6 m et 50/72/84 m².
- Des tests de non-régression doivent reproduire les quatre devis/scénarios de contrôle, avec les écarts attendus explicitement documentés.
