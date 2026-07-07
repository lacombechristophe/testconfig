# Référentiel des règles du configurateur Diskoov

Version de consolidation : 7 juillet 2026.

## Objet

Ce dossier regroupe les règles métier, contraintes techniques, tarifs 2026, formules de calcul, prestations, options et exemples de devis présents dans `Documentations règles`.

Les documents sont organisés par famille :

- `REGLES-ABRIS-AQUAMASTER.md` : abris bas, mi-hauts, hauts, Master Deck, Master Spa et logique du simulateur d'abris.
- `REGLES-BAB.md` : couvertures à barres (BAB).
- `REGLES-ORE.md` : couvertures motorisées Oré Essentiel et Oré Compact.
- `REGLES-VOLETS.md` : volets hors-sol, volets immergés, lames, escaliers, emballages, transport et installation.
- `AUDIT-SOURCES-ET-ECARTS.md` : couverture des 34 fichiers sources, conflits entre sources et écarts avec le configurateur actuel.
- `ANNEXE-DONNEES-SOURCES.md` : transcription exhaustive et auditable des PDF, Word et feuilles Excel, avec formules.
- `ASSETS-PRODUITS.md` : correspondance des 17 images avec les parcours et options produit.
- `IMPLEMENTATION-CONFIGURATEUR.md` : cartographie source → moteur → interface, protections contre les faux prix, vérifications et arbitrages encore ouverts.

## Statut des informations

Les marqueurs suivants doivent être conservés lors de l'implémentation :

- **Confirmé** : information concordante dans plusieurs sources ou explicitement définie dans une grille 2026.
- **Source unique** : information présente dans un seul fichier, exploitable mais à conserver avec sa provenance.
- **À arbitrer** : contradiction entre deux sources ; ne pas choisir silencieusement une valeur.
- **Sur devis / validation technique** : le configurateur doit collecter les données et produire une estimation ou une demande, pas un prix ferme.

## Règles communes de calcul

- TVA utilisée dans les simulations et devis : `20 %`, soit `TTC = HT × 1,20`, sauf lignes explicitement « NET » ou totaux sources incohérents à arbitrer.
- Les remises de vente sont appliquées sur le tarif public HT : `PV_HT = tarif_public_HT × (1 - remise_vente)`.
- Le coût d'achat fournisseur est souvent calculé avec une remise fournisseur de `55 %`, donc `PA_HT = tarif_public_HT × 0,45`.
- Transport, pose et emballage sont généralement non remisés dans les feuilles de simulation.
- Les dimensions doivent être stockées dans une unité unique en interne. Recommandation : centimètres entiers pour les gabarits et mètres décimaux pour les surfaces.
- Toute estimation doit afficher son millésime tarifaire (`2026`) et préciser qu'elle reste soumise à la validation technique du fabricant/Diskoov lorsque la source l'impose.

## Formulaire commun minimal

Les projets Word BAB et Oré demandent au minimum :

- nom et prénom ;
- code postal et ville, obligatoires dès qu'une visite technique ou une installation est chiffrée ;
- forme du bassin ;
- dimensions intérieures maximales ;
- type de support/plage ;
- confirmation que margelles et terrasse sont de même niveau ;
- présence d'un bloc de filtration (Desjoyaux, Magiline, etc.) ;
- type, dimensions et position d'un escalier ;
- choix livraison seule / installation, lorsque disponible.

## Règle de priorité avant mise en production

Les grilles datées 2026 sont les références de données. Les devis datés de juillet 2026 servent de tests de calcul et de libellés client. Les feuilles « simulateur » décrivent la logique commerciale Diskoov, mais plusieurs cellules sont anciennes, dupliquées ou contradictoires. Toutes les lignes marquées **À arbitrer** dans l'audit doivent être validées par Xavier avant d'être codées comme prix contractuels.

Le devis Pisceen/DERCYA de 2022 est une source concurrentielle de benchmark uniquement. Il est explicitement exclu des tarifs et règles contractuelles Diskoov.
