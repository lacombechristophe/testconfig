# Audit des règles métier

Date : 2026-07-13

## Périmètre et méthode

L'inventaire a couvert les 34 fichiers du dossier `Documentations règles`, soit les PDF, DOCX, classeurs Excel et visuels transmis pour Oré, BAB, les volets et les abris Aquamaster. Les consolidations de `docs-regles` et les décisions de `validation-xavier` ont été recoupées avec le code et les tests. Une consolidation n'est pas considérée comme une validation si la source originale reste ambiguë.

## Verdict

Le moteur peut présenter les compatibilités techniques connues, mais il ne doit chiffrer automatiquement que les cas dont toutes les composantes sont sourcées sans ambiguïté. Au moment de l'audit, seul Oré dispose d'une base suffisamment cohérente pour un prix indicatif, sous conditions explicites. BAB doit basculer sur devis dès qu'un escalier intervient. Les prix automatiques des volets et abris doivent rester désactivés jusqu'aux réponses écrites de Diskoov.

## Matrice produit

| Famille / produit | Ce qui peut être affirmé | Chiffrage public | Garde-fou requis |
|---|---|---|---|
| Oré Essentiel / Compact | Compatibilité dimensionnelle et options présentes dans les tarifs fournis | Oui, uniquement avec dimensions, électricité explicitement disponible et décision explicite si la filtration est hors bassin | Aucun prix si une donnée indispensable manque ; découpe du bloc à confirmer dans les cas concernés |
| Couverture à barres BAB | Compatibilité générale et options documentées | Base et options calculables uniquement sans escalier ambigu ; sinon devis | Remise base 35 %, options 30 % ; ne pas publier une durée de garantie contradictoire |
| Volet hors-sol / immergé | Compatibilité technique et contraintes d'implantation | Non, tant que la colonne livraison/installation, le régime HT/TTC, les frais et bornes ne sont pas validés | Retourner `sur devis`, jamais un total partiel présenté comme complet |
| Abris Aquamaster | Limites dimensionnelles, corde et logique de modules lorsqu'elles sont présentes dans les sources | Non, tant que remises, couleurs et zones de transport ne sont pas validées | Compatibilité technique distincte de la disponibilité commerciale et du prix |
| Coverseal / Eden | Solution à étudier selon le bassin | Non | Ne pas classer comme compatible certaine sans règles écrites complètes |
| MasterDeck | Piste possible, notamment pour certains projets atypiques | Non | Pour une forme libre, rester en étude personnalisée et ne pas annoncer une compatibilité acquise |

## Règles transversales

- La forme ne doit jamais être transformée silencieusement en rectangle.
- Pour un ovale, la surface indicative est `π / 4 × longueur × largeur`.
- Pour une forme libre, aucune surface ne doit être inventée à partir de dimensions absentes.
- Les seuils métier s'appliquent aux valeurs brutes ; l'arrondi sert uniquement à l'affichage.
- Une donnée manquante produit un état `à préciser` ou `sur devis`, pas une exclusion arbitraire.
- Les préférences de budget non sourcées ne doivent pas influencer le classement.
- Une compatibilité technique ne vaut ni disponibilité, ni prix définitif, ni conformité du chantier.

## Bloqueurs de validation Diskoov

1. Confirmer par écrit la nature et l'assiette de chaque colonne de livraison/installation des volets, le régime HT/TTC, les emballages et les limites dimensionnelles réellement vendues.
2. Confirmer les remises Aquamaster, les coloris commercialisables et la règle de transport par zone.
3. Donner une formule ou une table BAB non ambiguë pour chaque type d'escalier.
4. Trancher la durée de garantie BAB contradictoire dans les sources.
5. Confirmer les cas Oré avec filtration hors bassin et la responsabilité/coût de la découpe du bloc.
6. Fournir les règles écrites de Coverseal, Eden et MasterDeck si Diskoov souhaite les classer autrement que comme solutions à étudier.

## Critères d'acceptation

- Aucun prix public non traçable vers une source et un cas complet.
- Aucun produit présenté comme incompatible uniquement parce qu'une information manque.
- Les tests couvrent rectangle, ovale, forme libre, valeurs limites et données inconnues.
- Les références internes, noms de fichiers et termes de tableur restent absents de l'interface prospect.

## Challenge

Désactiver les prix de volets et d'abris réduit l'effet immédiat du configurateur, mais afficher un montant incomplet serait plus dommageable pour la confiance et la marge. À l'inverse, rendre tout systématiquement « sur devis » dévaloriserait l'outil : les compatibilités techniques certaines et les raisons de l'étude doivent donc rester visibles et utiles.
