# Règles configurateur — Couverture à barres (BAB)

## Périmètre et éligibilité

- Produit principal utilisé dans la feuille de simulation : **SECU CLASSIC**.
- Dimensions maximales indiquées par le projet Word : bassin intérieur `12 × 5 m`.
- Largeur intérieure maximale indiquée par la fiche technique : `5,40 m` (limite transport).
- Rolling-Up : bassin maximal `12 × 5,30 m` dans le devis test.
- La couverture ajoute un débord de `25 cm` sur chacun des quatre côtés, soit `50 cm` au total par dimension.
- Surface tarifée : `(longueur_bassin + 0,50) × (largeur_bassin + 0,50)` en m².
- Forme rectangulaire dans la grille tarifaire. Les pans coupés sont une plus-value.
- Ancrage sous réserve d'un support béton ou de lambourdes sur plots béton pour une plage bois.
- Installation à la charge du client dans le devis test, suivant la notice fabricant.

## Caractéristiques SECU CLASSIC

- Toile PVC `630 g/m²`, anti-UV et anti-cryptogamique/antifongicide.
- Ourlets sur les longueurs et sangles longitudinales anti-soulèvement.
- Barres aluminium anodisé de diamètre `45 mm`, espacées d'environ `1,30 m` et au maximum `1,50 m`.
- Fixations par pitons escamotables `12 mm`, cinq points d'accroche.
- Enroulement par manivelle manuelle démultipliée ; déroulement par sangle de rappel.
- Trous d'évacuation des eaux pluviales.
- Encombrement enroulé maximal : environ `30 cm` de diamètre.
- Norme indiquée : NF P 90-308. La fiche extraite contient une coquille « NF-P90-309 » ; retenir NF P 90-308, confirmée par le devis.
- Garantie : la fiche annonce 10 ans, le devis fabricant annonce 3 ans. **À arbitrer avant affichage.**
- Ne rien poser sur la couverture ; déneiger en cas de neige afin d'éviter la déformation des barres.

## Tarifs publics fournisseur 2026 — HT

| Réf. | Produit | Prix public HT | Achat net après remise 55 % |
|---|---|---:|---:|
| BABAS | SECU BASIC | 31,21 €/m² | 14,05 €/m² |
| BAPRI | SECU PRIMO | 33,63 €/m² | 15,13 €/m² |
| BAHS | SECU HORS SOL / COVER WOOD | 35,04 €/m² | 15,77 €/m² |
| BACLA | SECU CLASSIC | 36,04 €/m² | 16,22 €/m² |
| BACLATOP | SECU TOP, bande anti-abrasion incluse | 39,68 €/m² | 17,86 €/m² |
| BACLAFC | SECU EASY CLIP | 42,53 €/m² | 19,14 €/m² |
| BASEC+ | SECU + | 34,44 €/m² | 15,50 €/m² |

## Coloris disponibles

Bleu/beige, vert/beige, amande/beige, beige/beige, gris/beige et anthracite/beige. La fiche produit montre les faces visibles bleu, gris, anthracite, vert, amande et beige, avec envers sable/beige.

## Options et frais fournisseur

| Réf. | Option | Public HT | Achat net 55 % |
|---|---|---:|---:|
| ACDECASPI | Découpe bloc immergé / filtration | 137,07 € | 61,68 € |
| ACESBAR | Escalier | 168,43 € | 75,80 € |
| RUPCDE | Rolling-Up commandé avec la bâche | 947,50 € | 426,38 € |
| RUPSEUL | Rolling-Up commandé seul | 1 082,68 € | 487,21 € |
| RUPMANIV | Rolling-Up + manivelle manuelle, avec bâche | 1 115,05 € | 501,77 € |
| CR | Contre-remboursement France | 40,00 € net | 40,00 € |
| ENLEVBA | Enlèvement atelier | 10,00 € net | 10,00 € |

- Bande anti-abrasion : feuille simulateur `3,64 €/m² HT public`; devis test `3,60 €/m² HT`, remise client 40 %. **À arbitrer.**
- Bassin inférieur à `15 m²` : plus-value `15 %`.
- Pans coupés : plus-value `15 %`.
- Option filet dans la feuille : `20 × ((L + longueur_escalier) + 0,80) × (l + 0,80)` HT public.
- Barre de charge requise pour réaliser un escalier sur la longueur.
- Découpe échelle/bloc de filtration : sur devis dans la fiche technique.

## Logique commerciale de la feuille « Prix TEST »

Pour SECU CLASSIC :

1. `surface = (L + 0,50) × (l + 0,50)`.
2. `public_HT = surface × 36,04`.
3. Feuille : remise de vente `35 %`, donc `PV_HT = public_HT × 0,65`.
4. Achat fournisseur : `PA_HT = public_HT × 0,45`.
5. Emballage : `96 € HT`, sans remise.
6. Transport exemple : `132 € HT`, sans remise.
7. `TTC = HT × 1,20`.
8. Paiement client : acompte `50 %`, solde `50 %`.

Le devis du 6 juillet 2026 applique toutefois une remise client de `40 %`, un transport de `128 € HT` et facture un contre-remboursement de `40 €`. Ces valeurs contredisent la feuille et doivent être arbitrées.

## Exemple de contrôle — devis DV0003845

- Bassin intérieur : `9,50 × 3,50 m`.
- Surface facturée : `40,00 m²`.
- BAB : PU `35,33 € HT`, remise `40 %`, montant `847,92 € HT`.
- Transport : `128,00 € HT`.
- Contre-remboursement : `40,00 €`.
- Total : `1 015,92 € HT`, TVA `195,18 €`, total `1 211,10 € TTC`.
- Options non incluses : anti-abrasion `103,68 € TTC` et Rolling-Up `649,21 € TTC`.

Le PU de `35,33 € HT` ne correspond à aucun PU de la grille 2026 (`36,04 €` pour CLASSIC). **Ne pas utiliser ce devis comme grille tarifaire sans validation.**

## Anomalies de formule à ne pas reproduire

- Les cellules de plus-value « pans coupés » et « bassin < 15 m² » utilisent `PU = prix_base × 1,15` puis ajoutent cette ligne au total. Si la quantité vaut 1, cela ajoute 115 % au lieu de 15 %. Implémenter une vraie surcharge : `supplément = prix_base × 0,15`.
- L'escalier utilise le « rayon » comme quantité dans la feuille. Le tarif source est unitaire ; collecter le type et la dimension, puis appliquer une quantité explicite.
- Plusieurs cellules de la feuille tarifs contiennent `#REF!` dans une colonne secondaire. Ne pas importer ces formules cassées.
