# Intégration au configurateur — cartographie et vérification

Date d'intégration : 7 juillet 2026.

## Principe commercial appliqué

Le configurateur distingue désormais trois cas :

- **prix calculé** : uniquement lorsqu'une règle univoque est disponible ;
- **estimation indicative** : calcul source exploitable mais options, accès, pose ou validation fabricant encore à confirmer ;
- **sur devis** : données contradictoires, combinaison hors grille, forme spéciale ou donnée technique manquante.

Le devis concurrent Pisceen/DERCYA `S021` reste un benchmark de présentation uniquement. Aucun prix, produit, remise ou référence de ce devis n'est présent dans `product-rules.js`.

Le catalogue AquaMaster est traité comme une source technique et, si Xavier le confirme, comme une base de rentabilité interne. Les prix visibles côté prospect doivent rester issus des fichiers Excel Diskoov lorsqu'une méthode commerciale complète existe. Les coûts d'achat, marges et prix fournisseur ne doivent pas être exposés dans l'interface publique.

## Cartographie source → moteur → interface

| Produit | Règles intégrées au moteur | Interface reliée | Statut affiché |
|---|---|---|---|
| Coverseal Auto / Semi | Grille, limites, pose et options à confirmer | Modèle, membrane, habillage, rail transmis pour étude | Sur devis, sans ancien prix public affiché |
| Oré Compact | Matrice HT 3–7 m × 2,5–3,5 m, palier supérieur, TVA, transport 428 € HT, pose incluse si demandée, options Oré validées | Choix Compact, support, margelles, plage mécanisme, prestation, options et images | TTC indicatif avec base et options détaillées |
| Oré Essential | Matrice HT 3–12 m × 2,5–5 m, TVA, transport 428 € HT, pose 310 € HT si demandée, mêmes contraintes techniques | Choix Essential et mêmes questions | TTC indicatif avec base et options détaillées |
| BAB Secu Classic | Surface `(L+0,50)×(l+0,50)`, PU 36,04 € HT/m², remise 35 %, emballage 96 € HT, transport 132 € HT, petite surface, pans coupés, anti-abrasion, découpe, escalier et Rolling-Up | Produit dédié, options, support, margelles, prestation et images | TTC indicatif ; garantie 3 ans |
| Volet hors-sol | Limites 12×6/72 m², structures Excel selon dimensions, 11 paliers de lames, PVC/polycarbonate, emballage et transport par département | Produit dédié, matériau, électricité, support, margelles, prestation et images | TTC indicatif ; escalier, solaire et variantes non arbitrées sur devis |
| Volet immergé | Limites 14×6/84 m², VRSUB4/5/6, palier lames, PVC/polycarbonate, emballage et transport | Même qualification spécifique | TTC indicatif pour paroi simple ; intégrations spéciales et VRSUB6 >5 m sur devis |
| Master Ultra Bas 1.2 / Master 18 / Master 30 | Agrandissement +20/+30 cm, classe de corde, prix publics Excel, remise 33 %, pose 850 € TTC, transport de référence, limites catalogue | Choix hauteur, options, couleur, questions chantier et images | TTC indicatif uniquement pour le scénario 8 × 4 explicitement documenté ; autres dimensions sur devis |
| Master Bas 5.0 / Mi-haut | Limites de corde du catalogue intégrées ; méthode commerciale insuffisamment cohérente | Questions chantier et images de gamme signalées comme telles | Sur devis ; un nombre de modules non confirmé ne bloque plus le prospect |
| MasterDeck | Caractéristiques techniques conservées dans la documentation ; matrice et moteurs contradictoires | Produit, questions chantier et visuel générique piscine | Sur devis |

## Règles de sécurité contre les faux prix

- Une forme non rectangulaire bascule sur étude sur mesure pour les nouveaux moteurs.
- Une dimension hors matrice n'est jamais extrapolée.
- Les dimensions Oré inférieures au premier palier basculent sur étude ; le premier prix n'est jamais appliqué à un bassin plus petit sans règle source et le projet n'est pas déclaré techniquement impossible.
- Les formes arrondies/libres désactivent côté interface les modèles sans périmètre documenté : Coverseal auto/semi, Oré Compact/Essential, BAB, abris et MasterDeck. Eden reste accessible comme étude au cas par cas ; les volets restent accessibles sur devis conformément à la règle « formes libres : sur devis ».
- Les modèles avec plage dimensionnelle connue sont désactivés dès le choix produit si la taille renseignée dépasse leur grille : Oré Compact/Essential, BAB, volets et abris. Pour les abris, seule la corde catalogue bloque automatiquement ; la longueur reste sur étude tant que la table officielle longueur → modules n'est pas fournie. Un ancien lien partagé ou un appel JS ne peut pas forcer une sélection hors plage ; le modèle actif est désélectionné si l'utilisateur modifie ensuite les dimensions.
- Les produits issus des règles Xavier exigent maintenant une qualification minimale avant envoi : prestation souhaitée, support autour du bassin et niveau des margelles/plages.
- Oré exige explicitement la plage côté mécanisme avant estimation. Le côté du rail et le coloris sont collectés pour la visite technique.
- Les volets exigent l'information d'alimentation électrique. Le volet immergé exige aussi le type d'intégration : flasques sur paroi, fond de bassin/caillebotis ou autre.
- Oré avec moins de 80 cm de plage côté mécanisme bascule sur devis ; sous 60 cm, la configuration standard est indiquée hors grille.
- Supports non standards, margelles/plages incompatibles ou fourniture seule sur des grilles intégrant la pose basculent sur devis au lieu de conserver un prix automatique.
- Les anciennes bases fixes des abris ne sont plus utilisées.
- Le calcul générique du nombre de modules d'abri est retiré. Le scénario source 8 × 4 conserve ses quatre modules documentés ; toute autre longueur reste sur devis. La corde catalogue est contrôlée avant ce statut afin de ne jamais présenter une largeur hors gamme comme étudiable.
- Les montants historiques Coverseal et les plus-values de couleur/rail ne sont plus affichés tant que Xavier n'a pas fourni une grille qualifiée.
- L'alimentation solaire Coverseal n'est plus précochée : elle est transmise uniquement lorsque le prospect l'a explicitement demandée, puis reste à confirmer pendant l'étude.
- Les options d'abri à dépendances techniques ne sont plus ajoutées avec les anciens forfaits fixes ; si motorisation ou rail est sélectionné, le produit passe explicitement « sur devis ».
- La plus-value BAB de 15 % est ajoutée comme supplément réel, sans reproduire la formule source erronée à 115 %.
- Le Rolling-Up BAB est bloqué au-delà de la largeur documentée de 5,30 m.
- Les volets sont bloqués sous la largeur minimale documentée de 2,45 m.
- Le volet manuel VRMANU est qualifié uniquement pour les petits bassins jusqu'à 3 × 6 m sans alimentation électrique.
- Le volet polycarbonate remplace le prix PVC au lieu d'ajouter deux tabliers.
- L'option solaire/pré-équipement volet est transmise, mais force un devis manuel car la plus-value et la compatibilité moteur ne sont pas arbitrées.
- Un coloris de lames polycarbonate active automatiquement le tarif polycarbonate afin d'éviter un prix PVC incohérent.
- Un escalier de volet force un devis tant que la forme, les deux dimensions utiles et la finition équerre/lisse ne sont pas toutes qualifiées.
- Le volet immergé ne donne une base indicative que pour une intégration simple avec flasques sur paroi ; fond de bassin, caillebotis, mur, poutre et équerres restent sur devis.
- Le scénario immergé « 12×6 » dupliqué n'est pas utilisé.
- Au-delà de 5 m de largeur, VRSUB6 force un devis pour valider le renfort anti-flexion lié à la garantie.
- Corse, DOM et départements absents de la grille transport restent sur devis.
- Si un escalier est activé, l'interface ne laisse plus un état partiel : type droit par défaut, position intérieure, côté largeur et largeur 1,5 m sont préremplis, puis modifiables. Les escaliers d'angle reçoivent un coin par défaut afin que le schéma ne soit jamais incohérent.
- L'option « Échelle amovible » a été retirée du parcours, des liens partagés, du payload API et des e-mails, car elle n'est pas utile selon Xavier.

## Données transmises à Xavier

Le lead contient maintenant, en plus des données historiques : produit exact, prestation souhaitée, support, type de margelles, plage mécanisme Oré, côté de guidage Oré, coloris produit, alimentation électrique volet, intégration volet immergé, options produit, qualification complète/incomplète, informations manquantes, prix estimé, statut du prix, éligibilité, référence de calcul, avertissements et données techniques du moteur.

Le dossier commercial conserve également le contexte du conseiller : mode guidé/direct, priorités exprimées, solutions recommandées, raison du choix et présence ou non de dimensions connues. Le formulaire final ajoute l'avancement du projet, l'accès chantier lorsque la pose est demandée, le code postal, la ville, une préférence de contact et un budget facultatif. Ce budget sert uniquement au traitement commercial et n'entre jamais dans les règles tarifaires.

La configuration technique non personnelle est restaurée pendant deux heures dans l'onglet courant en cas de rafraîchissement. Les coordonnées, textes libres, consentements et pièces jointes en sont exclus. Côté envoi, l'API ne confirme le succès qu'après réception de l'email interne ; les nouvelles tentatives d'un même dossier sont dédupliquées par leur horodatage. Si une pièce jointe dépasse le quota de sauvegarde du navigateur lors d'une panne réseau, le dossier texte reste conservé pour ne pas perdre le lead.

Ces champs sont validés et bornés côté serveur, puis affichés dans les e-mails prospect et interne. Les prix Oré sont maintenant affichés en TTC indicatif, sur base HT validée par Xavier.

## Images reliées

Les 17 images sources sont conservées dans `assets/produits`. Les parcours affichent les visuels principaux par gamme et, dans le formulaire, les vues techniques pertinentes : encombrement Oré, Rolling-Up BAB, tablier hors-sol et volet immergé. Aucun visuel n'est chargé depuis le devis concurrent.

Les chemins d'assets, polices et scripts sont volontairement relatifs (`assets/...`, `fonts/...`, `product-rules.js`, `config.js`) afin que le configurateur fonctionne aussi en sous-dossier, iframe ou prévisualisation locale. Seul l'appel API `/api/send-email` reste absolu, car il cible la route Vercel.

Sur mobile, le visuel est réduit par défaut puis se compacte en bandeau dès que l'utilisateur scrolle dans le formulaire. Le pied prix est également allégé pour préserver la surface utile des questions et coordonnées.

## Vérification automatisée et manuelle

- Tests Node : normalisation, bornes et paliers Oré, options Oré automatiques, limites BAB, largeur standard 5 m, limite Rolling-Up, options BAB, largeur minimale volets, seuil motorisé 3 m, VRMANU, VRSIL80S/VRSILC120, escalier volet, transport, intégration immergée, VRSUB6, prix Excel abri 8×4, remise Master 30 à 33 %, contrôle de corde avant modules, modules non confirmés sur devis, exclusion concurrente, images relatives et matrice de sûreté sur tous les produits.
- Compilation TypeScript de l'API e-mail.
- Contrôle de syntaxe des scripts intégrés à `index.html`.
- Vérification de tous les chemins d'assets utilisés.
- Parcours navigateur desktop : BAB + Rolling-Up, Oré Essential + plage insuffisante, Master 18, volet hors-sol + département + polycarbonate.
- Parcours navigateur mobile 390×844 : grille produit, section technique, prix fixe en pied, absence de débord horizontal.
- Restauration d'une configuration partagée avec produit, prestation, support et option.
- Console navigateur : aucune erreur ni alerte.

## Décisions restant à fixer par Xavier

Ces points sont volontairement visibles comme estimatifs ou sur devis :

- Volets : remises du devis versus simulateurs, escaliers et options avancées ;
- Abris : règle officielle du nombre de modules, zones de livraison/transport et dépendances d'options ;
- MasterDeck : correspondance MOT1/MOT2, matrice commerciale finale, usages et charges admissibles du plancher ;
- Coverseal et Eden : fiches commerciales, limites, fonctionnement, options, pose, photos qualifiées et grille tarifaire ;
- Volet immergé : source produit explicite autorisant l'affichage public de la norme NF P90-308.

Ces arbitrages peuvent être modifiés dans le moteur central sans réécrire les parcours de l'interface.
