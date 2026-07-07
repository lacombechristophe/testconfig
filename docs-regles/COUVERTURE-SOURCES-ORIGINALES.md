# Registre exhaustif des sources originales

Audit réalisé le 7 juillet 2026 sur le contenu exact du dossier `Documentations règles`.

## Résultat

- `34/34` fichiers ouverts et contrôlés.
- `97/97` pages PDF extraites et contrôlées visuellement.
- `22/22` feuilles des 9 classeurs lues, valeurs et formules comprises.
- `58/58` paragraphes des 2 documents Word extraits et rendu visuel contrôlé.
- `17/17` images inspectées à leur résolution d’origine.

Le mot **intégré** signifie ici que chaque information a un traitement explicite : calcul automatique, contrôle de compatibilité, collecte dans le formulaire, bascule sur devis, documentation interne ou exclusion motivée. Une donnée contradictoire n’est jamais transformée en faux prix.

## Hiérarchie appliquée

1. Les feuilles Excel Diskoov 2026 alimentent les estimations commerciales lorsqu’une règle est exploitable.
2. Les catalogues AquaMaster alimentent les limites techniques, références, dépendances et arguments produit.
3. Les devis Diskoov servent de scénarios de contrôle et révèlent les écarts de remise, pose, transport et garantie.
4. Toute contradiction non arbitrée force une étude personnalisée et figure dans `validation-xavier/`.
5. Le devis Pisceen/DERCYA est un benchmark concurrent uniquement ; aucune de ses valeurs n’entre dans le moteur.

Le PDF fournisseur contient davantage de gammes que le parcours Diskoov actuel : XXL 1.8/3.0/5.0, Master 180, Master Haut, Master Spa, piscines Quickly et PLV. Elles sont intégralement transcrites dans `ANNEXE-DONNEES-SOURCES.md`, mais ne sont pas exposées aux prospects tant que Xavier n’a pas confirmé qu’elles font partie du catalogue commercial Diskoov.

## Registre 34/34

| ID | Fichier original | Contrôle | Traitement dans le configurateur | SHA-256 (début) |
|---|---|---|---|---|
| S001 | `Simu Abri Aquamaster/Abri_Master-mi-haut.jpg` | Image 1200×680 | Visuel Master mi-haut | `d886c5ffcdb4` |
| S002 | `Simu Abri Aquamaster/Abri_Master_bas_1.2.jpg` | Image 1200×680 | Visuel Ultra Bas 1.2 | `ae14e8f646eb` |
| S003 | `Simu Abri Aquamaster/Abri_Master_Bas_1.8.jpg` | Image 3000×2000 | Visuel Master 18 | `d33e2ab2d9dd` |
| S004 | `Simu Abri Aquamaster/TARIF 2026 AQUAMASTER HT VERSION AC - ABRIS.pdf` | 34 pages | Contrôle croisé HT, options et divergences | `8ded9b0ed79f` |
| S005 | `Simu Abri Aquamaster/TARIF 2026 AQUAMASTER TTC VERSION AC - ABRIS.pdf` | 34 pages | Limites techniques, références et prestations TTC | `ef83d15ef53c` |
| S006 | `Simu Abri Aquamaster/Tarifs Abris 1.2 & 1.8.xls` | 1 feuille | Remise 33 %, transport, pose et scénario commercial | `62ac582eb4e9` |
| S007 | `Simu Abri Aquamaster/Tarifs ABRIS 3.0.xls` | 2 feuilles | Prix publics Excel par modèle, remise 28 % Master 30 | `e7c8c73569c1` |
| S008 | `Simu BAB/BAB Rolling up.JPG` | Image 310×315 | Visuel secondaire Rolling-Up | `9711bc94243f` |
| S009 | `Simu BAB/BAB.JPG` | Image 2592×1936 | Visuel principal BAB | `8c44c0f5a4d2` |
| S010 | `Simu BAB/Devis BAB 2026.xls` | 3 feuilles | Surface, PU, remise, options, emballage et transport | `6750807ec200` |
| S011 | `Simu BAB/DV0003845_BAB_TEST.pdf` | 9 pages | Technique, contrôle devis et conflits documentés | `bb9cea4365f5` |
| S012 | `Simu BAB/PROJET Simulateur BAB.docx` | 23 paragraphes | Champs requis, max 12×5 et options | `f6182ec13c95` |
| S013 | `Simu Oré/DV0003844_Devis Test_ORE ESSENTIEL.pdf` | 8 pages | Technique, encombrements, pose et conflits de prix | `1eaf024433e9` |
| S014 | `Simu Oré/Oré Découpe bloc.jpg` | Image 1600×900 | Visuel option découpe bloc | `77e1f9d5fd76` |
| S015 | `Simu Oré/Oré Encombrements.jpg` | Image 2016×1512 | Visuel cliquable 60/80/45 cm | `69900f6caf6e` |
| S016 | `Simu Oré/Oré2.jpg` | Image 4031×2795 | Visuel Oré fermé | `3f25d7d470cf` |
| S017 | `Simu Oré/Oré5 (2).jpg` | Image 3388×2470 | Visuel Oré ouvert | `d18483658456` |
| S018 | `Simu Oré/PROJET Simulateur Oré.docx` | 35 paragraphes | Champs, max Essential/Compact et options | `6de3b8ac49b6` |
| S019 | `Simu Oré/Tarif_Ore_Compact.xlsx` | 3 feuilles | Matrice 15 prix ; options contradictoires sur devis | `410cb1c8edc3` |
| S020 | `Simu Oré/Tarif_Ore_Essentiel.xlsx` | 3 feuilles | Matrice 60 prix ; recul/prestations à arbitrer | `81f2efa5e33a` |
| S021 | `Simu Volet/Devis CONCU_PISCEEN_DEVIS (1).pdf` | 2 pages | Benchmark concurrent, totalement exclu du moteur | `6a30c3e71bec` |
| S022 | `Simu Volet/DV0003839_Volet Hors-Sol Aquamaster_V.PIPAULT_DISKOOV.pdf` | 10 pages | Technique, contrôle 4×4, pose incluse et conflits | `51d11db10f39` |
| S023 | `Simu Volet/LAMES -  ESCALIER ET EMBALLAGES VOLETS 2026_SIMULATEUR.xlsm` | 1 feuille | 11 paliers PVC/polycarbonate, escaliers et emballages | `26481fc476a7` |
| S024 | `Simu Volet/SIMU Volet immergé 2026.xls` | 5 feuilles | VRSUB4/5/6, murs, poutres, caillebotis et scénarios | `188ce54ee6e0` |
| S025 | `Simu Volet/Simu Volets hors-sol 2026.xls` | 3 feuilles | Structures fixes/Mouv & Roll, options et simulation | `e5bdb61918ed` |
| S026 | `Simu Volet/Tarifs livraison + installation volets 2026.xlsx` | 1 feuille | 94 départements métropolitains contrôlés, Corse sur devis | `7dac047c36ed` |
| S027 | `Simu Volet/Volet Fond bassin2.JPG` | Image 220×165 | Visuel fond de bassin ; faible définition non utilisée en héros | `1e073be35da6` |
| S028 | `Simu Volet/Volet Fondbassin3.JPG` | Image 232×160 | Visuel fosse ; faible définition non utilisée en héros | `930898bf04bd` |
| S029 | `Simu Volet/Volet horssol 3.jpg` | Image 5312×2988 | Visuel principal hors-sol haute définition | `9dec9baf4b65` |
| S030 | `Simu Volet/Volet horssol1.JPG` | Image 235×215 | Documentation visuelle, pas de héros | `eb44a6403744` |
| S031 | `Simu Volet/Volet horssol2.JPG` | Image 227×145 | Documentation visuelle, pas de héros | `91e404ad2d19` |
| S032 | `Simu Volet/Volet immergé 1.JPG` | Image 641×611 | Visuel secondaire immergé | `799364938faa` |
| S033 | `Simu Volet/Volet immergé 2.JPG` | Image 230×136 | Faible définition, remplacée par S034 dans le formulaire | `36c4cecfdb95` |
| S034 | `Simu Volet/Volet immergé 3.JPG` | Image 3264×2448 | Visuel principal immergé haute définition | `24b541c03897` |

## Contrôles croisés automatisés

- Matrice Oré Compact : `15/15` cellules identiques au moteur.
- Matrice Oré Essential : `60/60` cellules identiques au moteur.
- Paliers de lames : `11/11` paliers PVC et polycarbonate identiques au moteur.
- Livraison/installation volets : `94/94` départements métropolitains identiques au moteur.
- Scénario abri 8×4, 4 modules, corde 480 : Ultra Bas/Master 18 = `9 380,76 € TTC` selon la méthode commerciale Excel 33 % + transport + pose.
- Devis concurrent : test de non-régression garantissant l’absence de `Pisceen`, `DERCYA` ou référence concurrente dans le moteur.

## Anomalies sources neutralisées

- Feuille immergé « 12×6 » : copie des dimensions et montants 10×4/10×5 ; jamais utilisée.
- Oré Compact : exemple détaillé 10×5 hors limite 7×3,5 ; jamais utilisé.
- Oré : options avec trois remises et plusieurs prix concurrents ; sélection = devis personnalisé.
- Abris : méthodes « remise sur public » et « achat + marge » incompatibles ; la première est utilisée pour les modèles couverts, les autres restent à valider.
- Master 30 : la simulation 8×4 reprend `11 948 €` alors que la table Master 30 indique `12 200 €` ; la table nommée du modèle est retenue et le conflit est transmis à Xavier.
- Volet : escaliers sans finition et dimensions complètes ; sélection = devis personnalisé.
- Volet immergé >5 m : renfort VRSUB6 nécessaire à valider pour la garantie ; sélection = devis personnalisé.
- MasterDeck : libellés MOT/MOT1/MOT2 contradictoires ; aucun prix automatique.
