# Conseiller Diskoov V3 - audit, decisions et criteres de validation

Date : 11 juillet 2026
Branche : `refonte/conseiller-diskoov-v2`

## 1. Diagnostic franc

La base actuelle est deja plus credibile qu'un prototype : les images sont reelles, les regles dimensionnelles sont reliees au configurateur, les produits peuvent etre approfondis et le parcours distingue un mode guide d'un acces direct.

Elle ne remplit toutefois pas encore assez bien sa promesse commerciale. Le prospect repond longtemps avant de voir de la valeur, les resultats peuvent presenter trois variantes de couvertures comme trois familles differentes, et le passage vers le configurateur peut afficher une preselection incompatible avec les dimensions declarees. Ce dernier point est un blocage de confiance et de conversion.

Le travail prioritaire n'est pas d'ajouter de la decoration. Il consiste a rendre le raisonnement visible, raccourcir le parcours avant resultat, comparer de vraies familles, puis assurer une continuite parfaite entre la recommandation et la demande de devis.

## 2. Ce qui fonctionne

- La promesse de conseil est visible des l'arrivee.
- Le choix entre accompagnement guide et acces direct repond a deux niveaux de connaissance.
- La forme et les dimensions sont demandees avant d'annoncer une compatibilite.
- Les fiches produit expliquent deja un usage, des benefices et un point de vigilance.
- Les limites documentees sont preservees dans le moteur de regles et les cas incertains restent sur devis.
- Le pied d'action mobile garde la prochaine etape accessible.
- Le formulaire final collecte les informations techniques utiles au traitement du lead.

## 3. Problemes priorises

### Bloquants conversion

1. **Fausse diversite des recommandations.** `cover`, `coverseal` et `custom-cover` sont des familles techniques internes, mais le prospect les percoit toutes comme des couvertures. Un resultat compose de Coverseal, Eden et Ore n'est pas une comparaison de trois familles.
2. **Transition produit incoherente.** Un produit ouvert depuis l'acces direct peut etre annonce dans le resume du configurateur alors que la V1 le deselectionne immediatement pour incompatibilite dimensionnelle.
3. **Resume non fiable.** Le resume peut citer le produit demande plutot que le produit effectivement selectionne dans la V1.
4. **Retour inoperant.** Le bouton permettant de revoir les pistes depuis le configurateur ne reouvre pas toujours le conseiller.
5. **Tracking de soumission faux.** `lead_submitted` est envoye meme lorsque tous les canaux reseau ont echoue.

### Importants

1. L'etape projet presente quinze choix mobiles avant les recommandations, alors que budget et calendrier sont facultatifs.
2. Le resultat vend d'abord un modele, sans rendre assez claire la difference entre couverture, volet, abri, couverture a barres et terrasse mobile.
3. Le comparatif mobile repete trop de texte et devient tres long.
4. Les CTA de la carte principale et du pied fixe sont visibles simultanement sur mobile.
5. L'acces direct est pertinent, mais les cartes famille sont trop denses et les differences entre modeles restent faibles.
6. Plusieurs preuves importantes sont dispersees : pose incluse lorsqu'elle est documentee, norme de securite, garantie, accompagnement et role concret de la photo.
7. Le focus programme sur le titre utilise le contour orange par defaut du navigateur.
8. Les evenements ne permettent pas de localiser les abandons, erreurs, ajouts de photo et echecs de soumission.

### Polish

1. L'icone entretien ressemble a une lettre et n'est pas comprise instantanement.
2. Les titres et visuels prennent encore trop de hauteur dans certains ecrans mobiles.
3. Les etats selectionne + focus creent parfois une double bordure lourde.
4. L'action d'acces direct dans l'en-tete manque de contraste.
5. Certains textes expliquent le systeme au lieu d'aider a choisir.

## 4. Trois architectures envisagees

### A. Parcours guide court, puis comparaison de familles - retenu

1. Besoin principal et secondaire.
2. Forme et dimensions du bassin.
3. Trois familles reellement differentes, chacune representee par son meilleur modele.
4. Fiche detaillee, puis qualification technique et devis.

Avantages : valeur obtenue rapidement, logique compréhensible, bon compromis conversion/qualite du lead, reutilise le moteur existant.
Risque : budget et calendrier n'influencent plus le premier classement. Ils restent collectes dans le configurateur, apres que le prospect a compris la valeur.

### B. Conversation adaptative, une question par ecran

Le parcours ajoute des questions conditionnelles sur la manipulation, la presence visuelle, le niveau de saison et le chantier.

Avantages : recommandation potentiellement plus fine et pedagogie progressive.
Risques : tunnel plus long, logique difficile a tester, impression de questionnaire commercial avant d'avoir vu les produits. Cette option n'est justifiee qu'apres donnees d'usage montrant que les trois premieres questions ne departagent pas assez les familles.

### C. Catalogue famille d'abord, qualification ensuite

Le premier ecran montre couverture, volet, abri, couverture a barres et terrasse mobile ; le prospect choisit puis renseigne son bassin.

Avantages : rapide pour un visiteur deja informe, tres visuel.
Risques : un novice choisit avec ses a priori et peut manquer une meilleure solution. Cette architecture est conservee comme acces direct, pas comme parcours principal.

## 5. Architecture retenue

- Deux entrees explicites : `Etre conseille` et `Explorer les protections`.
- Parcours guide en trois macro-etapes : besoin, piscine, solutions.
- Deux priorites maximum pour eviter une recommandation qui veut tout optimiser.
- Resultats diversifies par famille prospect : couvertures motorisees, couverture a barres, volets, abris, terrasse mobile.
- Un meilleur modele par famille dans le premier resultat ; les autres modeles restent accessibles dans l'exploration directe.
- Comparaison centree sur les compromis que le prospect comprend : usage, manipulation, presence visuelle, effet sur la saison, contrainte principale.
- Budget et calendrier retires de l'avant-resultat. Le delai reste collecte avant envoi ; le budget ne doit revenir que si Diskoov definit des fourchettes fiables et utiles.
- Aucun produit direct n'est declare compatible a partir des dimensions par defaut du configurateur.
- Une photo reste facultative, avec une explication concrete : elle aide a verifier les abords, le support, les acces et les obstacles visibles.

## 6. Regles commerciales d'affichage

- Ne jamais transformer une plage dimensionnelle en validation de pose.
- Utiliser `dimensions coherentes`, `a confirmer` ou `etude sur mesure`, jamais `compatible` sans verification complete.
- Afficher un prix uniquement lorsqu'il provient d'une regle qualifiee. Sinon : `estimation apres verification` ou `sur devis`.
- Afficher la pose incluse uniquement dans les cas documentes : Ore Compact en fourniture + pose ; abris Ultra Bas, Master 18 et Master 30 avec pose de reference integree ; volets lorsque la base calculee inclut livraison et installation.
- Ne pas generaliser les garanties, delais ou normes d'un modele a toute une famille.
- Ne jamais exposer les termes de travail ou de source interne dans l'interface prospect.

## 7. Positionnement commercial par famille

### Couvertures motorisees

Vendre la discretion, la protection basse et la simplicite quotidienne. Comparer clairement bassin compact, couverture quatre saisons, confort Coverseal et projet sur mesure. Objections a traiter : place du mecanisme, support, alimentation, manipulation selon version et niveau de budget.

### Couverture a barres

Vendre une securite simple et robuste, avec un budget plus cadre. Ne pas la presenter comme automatique. Expliquer les ancrages, la manipulation manuelle, les decoupes et la garantie documentee de trois ans.

### Volets

Vendre l'ouverture automatique et le choix entre installation hors-sol visible et integration immergee plus discrete. Expliquer l'electricite, l'escalier, le coffre/mecanisme et la dependance de la pose au projet.

### Abris

Vendre d'abord la saison de baignade et la protection contre les salissures. La hauteur doit etre un choix d'usage : discretion, nage sous abri, circulation. Expliquer la presence visuelle, le refoulement, les acces et la terrasse.

### Terrasse mobile

Vendre la surface recuperee et le projet paysager, pas seulement une couverture. Assumer qu'il s'agit d'une etude sur mesure avec contraintes d'abords, de portee et de finition.

## 8. Copywriting directeur

- `Recevoir mes recommandations` devient `Trouver ma protection` : plus concret, moins proche d'une collecte de coordonnees.
- `Je connais deja le type de protection` devient `Explorer les protections` : plus court et naturel.
- `Nos recommandations` devient `Les solutions les plus coherentes` : moins absolu tant que la pose n'est pas validee.
- `Preparer mon etude` devient `Verifier mon projet` dans le conseiller, puis `Recevoir mon devis personnalise` seulement au formulaire complet.
- `Prix prudent` est interdit : utiliser un statut factuel lie a la source disponible.
- `Affiche seulement si les donnees suffisent` est remplace par une explication utile : `Une estimation apparait apres les informations indispensables.`

## 9. Mesure du funnel

Evenements minimum :

- vue, demarrage guide, entree directe et reprise ;
- vue de chaque etape, retour, recommencement et duree de l'etape ;
- selection/desselection de priorite et erreurs de dimensions ;
- vue resultat avec familles affichees, ouverture comparaison et fiche produit ;
- choix d'un produit avec origine guide/direct ;
- arrivee configurateur, ajout/suppression/echec photo ;
- debut du formulaire, erreurs de validation, tentative d'envoi ;
- succes reel, echec total et succes apres nouvelle tentative.

Les donnees doivent permettre de comparer les taux `arrivee -> resultat`, `resultat -> configurateur` et `configurateur -> lead envoye`, sans enregistrer de donnee personnelle dans les evenements analytics.

## 10. Questions precises restantes pour Xavier

1. Quelles preuves sociales publie-t-on : nombre de poses, zones desservies, avis verifies, photos avant/apres ?
2. Quels delais moyens peut-on annoncer par famille, et avec quelle periode de validite ?
3. Coverseal : limites dimensionnelles/formes, contenu exact du prix historique et pose incluse ou non ?
4. Ore : la garantie cinq ans et la norme NF P90-308 s'appliquent-elles aux deux modeles commercialises par Diskoov ?
5. Volets : texte de garantie unique pour PVC et polycarbonate, et modeles hors-sol effectivement vendus ?
6. Abris : table officielle longueur -> modules, transport par zone et texte reglementaire pour les hauteurs concernees ?
7. MasterDeck : photos de realisations Diskoov et matrice commerciale stabilisee ?
8. Quel est le perimetre geographique de pose/visite et quels cas doivent etre bloques avant envoi ?
9. Telephone et email doivent-ils rester tous deux obligatoires, ou un seul moyen de contact suffit-il ?
10. Quel retour commercial sera enregistre pour chaque lead : joignable, rendez-vous, devis, gagne/perdu et motif ?
11. Quelle borne de largeur faut-il afficher partout ? Le conseiller accepte 2 m, la grille Ore commence a 2,5 m, les volets documentent 2,45 m et la V1 impose encore 3 m a la saisie manuelle.

## 11. Challenge des decisions

- **Retirer l'etape projet peut reduire la qualification.** C'est acceptable seulement si le formulaire final conserve le delai et si le taux de passage au resultat augmente. Mesurer la qualite des leads, pas seulement leur volume.
- **Trois familles peuvent diluer une recommandation forte.** La premiere doit rester nettement priorisee et les deux autres presentees comme des compromis, pas comme un classement arbitraire.
- **Une famille prospect masque les differences entre modeles.** Le resultat doit nommer le modele retenu et l'acces direct doit permettre de comparer les variantes de la famille.
- **Un comparatif peut surcharger le mobile.** Il doit rester court, avec des formulations distinctes, et etre replie si les tests montrent qu'il repousse le CTA.
- **Les icones peuvent decorer sans informer.** Elles ne sont conservees que pour identifier une famille ou un benefice stable ; le texte doit rester comprehensible sans elles.
- **Une interface premium peut sembler plus chere.** La couverture a barres et les options economiques doivent rester visibles afin que le conseil ne ressemble pas a une montee en gamme forcee.
- **La photo peut inquieter.** Elle reste facultative, sa valeur est expliquee et aucune promesse d'analyse automatique n'est faite.
- **Le direct peut contourner le conseil.** C'est volontaire pour les visiteurs informes, mais aucune compatibilite ne doit etre deduite de valeurs qu'ils n'ont pas saisies.
- **Un grand refactoring technique peut introduire plus de regressions qu'il n'en retire.** La V3 reste en JavaScript/CSS statique pour cette iteration ; une migration de framework n'est pas justifiee sans besoin de maintenance prouve.
- **Changer Inter seulement parce qu'un detecteur le juge courant serait une mauvaise decision.** Pour cette interface de tache, la familiarite et la lisibilite priment. Une nouvelle police ne doit arriver qu'avec une direction de marque Diskoov validee et ses fichiers auto-heberges.
- **Supprimer les accents lateraux peut reduire la saillance.** Les statuts prioritaires restent donc exprimes par le texte, la teinte de surface et les icones, plutot que par une barre decorative qui donnait un aspect de template.
- **Ajouter du mouvement partout degraderait le parcours.** Le feedback tactile est limite aux commandes, les grands choix restent stables et `prefers-reduced-motion` neutralise les transitions.
- **Le visuel mobile consomme de la hauteur.** Il est conserve parce qu'il montre le produit reel des l'arrivee ; a 390 px, les deux CTA et la reprise restent visibles avant le premier defilement significatif.
- **Les alertes automatiques ne sont pas des verdicts.** Les images sans `src` sont alimentees avant affichage, les numeros 01/02/03 decrivent une vraie sequence, et les transitions de hauteur restantes servent le repli du visuel et du detail de prix. Les remplacer uniquement pour faire passer un detecteur serait une regression.

## 12. Criteres de sortie

- Les trois recommandations appartiennent a trois familles prospect distinctes lorsque trois familles sont disponibles.
- Une recommandation guidee selectionne exactement le meme produit dans le configurateur.
- Un choix direct ne reutilise pas silencieusement un bassin 8 x 4 fictif.
- Aucun produit hors limite connue ne peut etre presente comme preselectionne.
- Le retour vers le conseiller fonctionne apres toute mise a jour du configurateur.
- Le parcours principal atteint les resultats apres deux ecrans de questions.
- Aucun texte prospect ne contient de vocabulaire interne interdit.
- Aucun debord horizontal ni recouvrement sur 390, 768, 1024 et 1440 px.
- Tous les controles sont utilisables au clavier avec un focus visible et non masque.
- `lead_submitted` n'est emis qu'apres un succes reseau reel.
- Les tests metier, le typecheck, la syntaxe et les scenarios navigateur sont verts avant commit.
