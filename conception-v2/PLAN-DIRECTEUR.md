# Diskoov V2 — Plan directeur du conseiller piscine

Statut : proposition de conception, aucun code V2 implémenté  
Branche : `refonte/conseiller-diskoov-v2`  
Date : 8 juillet 2026

## 1. Mission

Transformer le configurateur actuel en un conseiller commercial numérique capable de :

- guider un particulier qui ne connaît pas les produits ;
- reconnaître un prospect qui sait déjà ce qu'il veut ;
- comparer honnêtement les familles de protections ;
- recommander une solution compatible et expliquer pourquoi ;
- produire une estimation fiable à partir des grilles Diskoov ;
- qualifier un projet sans donner l'impression de remplir un dossier technique ;
- transmettre à Xavier un lead directement exploitable ;
- préserver toutes les règles métier et les sécurités tarifaires actuelles.

La V2 ne doit pas être « un formulaire plus joli ». Elle doit devenir un parcours de vente conseillé.

## 2. Hypothèses de travail

- L'objectif principal est le nombre de leads qualifiés, pas le volume brut de formulaires.
- Le public principal est un propriétaire de piscine privée, souvent non spécialiste.
- Le mobile est prioritaire pour l'acquisition ; le desktop reste important pour comparer.
- Les visiteurs peuvent arriver depuis la page d'accueil, une publicité générique ou une page produit.
- Les tarifs visibles viennent exclusivement des simulateurs Excel Diskoov.
- Le catalogue fournisseur reste une source de contraintes techniques et d'informations internes.
- Les cas non couverts ou ambigus restent en étude personnalisée.
- Les informations internes, prix d'achat, marges et références techniques internes restent invisibles.

Risques si ces hypothèses sont fausses : mauvais ordre des questions, mauvais niveau de détail, recommandations commerciales inadaptées ou collecte de leads insuffisante.

## 3. Diagnostic synthétique de la V1

### Forces à préserver

- moteur tarifaire déjà poussé ;
- nombreuses contraintes métier intégrées ;
- blocage des faux prix ;
- compatibilité dimensions, formes et produits ;
- images par produit ;
- partage par URL ;
- formulaire et email de qualification ;
- tests automatisés métier ;
- affichage responsive déjà fonctionnel.

### Faiblesses structurelles à résoudre

1. La première image évoque un volet et biaise la compréhension.
2. Le parcours commence par la forme et les dimensions sans expliquer sa promesse.
3. Les besoins du prospect ne sont jamais demandés.
4. Le choix des familles reflète l'organisation interne plutôt que le raisonnement d'un particulier.
5. La photo facultative arrive avant que l'outil ait fourni de la valeur.
6. Le prix sticky occupe de la place avant qu'un prix soit disponible.
7. Le prospect choisit un produit mais ne reçoit pas de recommandation argumentée.
8. Les alternatives ne sont pas comparables sur une grille cohérente.
9. Les preuves Diskoov apparaissent trop peu dans le tunnel.
10. Les événements analytics ne permettent pas de comprendre précisément l'abandon.

## 4. Positionnement de la V2

### Promesse principale

> Trouvez la protection adaptée à votre piscine et obtenez une première estimation en quelques minutes.

### Proposition de valeur

- conseil adapté au bassin et aux priorités ;
- comparaison compréhensible ;
- prix indicatifs TTC issus des grilles Diskoov ;
- compatibilité technique contrôlée ;
- accompagnement humain avant fabrication.

### Vocabulaire public

Employer :

- protection de piscine ;
- solution adaptée ;
- estimation ;
- à vérifier ensemble ;
- compatible sous réserve ;
- étude personnalisée ;
- pose comprise / non comprise ;
- ce qui est inclus.

Éviter :

- moteur tarifaire ;
- qualification manuelle ;
- règle simplifiée ;
- référence interne ;
- configuration incomplète ;
- contrôle devis ;
- jargon fabricant sans explication.

### Périmètre produit à préserver

La refonte ne doit supprimer ni fusionner silencieusement aucune offre actuellement documentée :

| Famille publique | Produits / modèles à couvrir | Rôle des sources |
|---|---|---|
| Couvertures automatiques 4 saisons | Coverseal automatique et semi-automatique, Oré Compact, Oré Essential, Eden | Excel Diskoov pour les prix disponibles ; documentation fabricant pour limites et contenu |
| Abris télescopiques | Neo / Ultra Bas, Master 18, Master 30, Master 50, Mi-haut | Excel commercial pour chiffrage couvert ; catalogue AquaMaster pour limites techniques |
| Bâche à barres | Secu Classic et options documentées | Excel BAB pour prix, remises, transport et compatibilités |
| Volets | Volet hors-sol et volet immergé, modèles déterminés par dimensions | Simulateurs volets Diskoov pour puissance, structure, options, remises et transport |
| Terrasse mobile | MasterDeck | Étude personnalisée tant qu'aucune grille client complète fiable n'est disponible |

Les noms publics pourront être simplifiés dans l'étape de conseil, mais le modèle exact doit réapparaître dans la configuration, le résumé, l'email et le dossier reçu par Xavier.

## 5. Architecture des entrées

### Entrée A — Parcours guidé

Origines : accueil Diskoov, SEO générique, publicité « protection piscine », recommandation.

Action principale : `Trouver ma solution`.

### Entrée B — Parcours direct

Origines : page Oré, Coverseal, volet, abri, bâche ou MasterDeck.

Action principale : `Estimer ce produit`.

Le produit est présélectionné, mais un lien discret permet de `Comparer avec d'autres solutions`.

### Entrée C — Reprise

Origines : lien partagé, email, retour ultérieur.

L'état est restauré avec un message clair : `Votre projet a été repris`.

## 6. Parcours guidé cible

```text
Accueil conseillé
    ↓
Priorités du prospect
    ↓
Piscine et projet
    ↓
Budget et délai
    ↓
Recommandation + alternatives
    ↓
Configuration du produit retenu
    ↓
Photo / informations de chantier
    ↓
Coordonnées
    ↓
Résumé + prochaines étapes
```

Ces écrans ne doivent pas être présentés comme neuf étapes. L'indicateur public reste limité à quatre macro-étapes : `Votre besoin · Votre piscine · Nos recommandations · Votre projet`. Les sous-écrans servent à alléger chaque décision sans donner l'impression d'un tunnel interminable.

### Étape 0 — Accueil

Question répondue : « Que va faire cet outil pour moi ? »

Contenu :

- promesse claire ;
- durée réaliste ;
- trois preuves maximum ;
- CTA principal `Trouver ma solution` ;
- lien `Je connais déjà le produit souhaité` ;
- aperçu de plusieurs familles, sans produit visuellement dominant.

État mobile : image compacte ou mosaïque courte, promesse et CTA visibles sans scroll.

### Étape 1 — Priorités

Question : `Qu'attendez-vous surtout de votre future protection ?`

Choisir jusqu'à deux réponses :

- garder une eau propre toute l'année ;
- sécuriser facilement la piscine ;
- prolonger la saison de baignade ;
- préserver l'esthétique du jardin ;
- automatiser l'ouverture et la fermeture ;
- créer ou libérer de l'espace autour du bassin ;
- privilégier la solution la plus économique ;
- je ne sais pas, conseillez-moi.

Le système ne recommande encore aucun produit. Il apprend l'intention.

### Étape 2 — Piscine et projet

- piscine existante ou en projet ;
- extérieure ou intérieure ;
- forme ;
- dimensions intérieures ;
- escalier seulement si nécessaire pour filtrer les familles ;
- option `Je ne connais pas les dimensions exactes`.

Les questions de support, margelles, électricité et dégagement restent différées.

### Étape 3 — Budget et délai

Budget à valider avec Xavier à partir des grilles :

- moins de 5 000 € ;
- 5 000 à 10 000 € ;
- 10 000 à 15 000 € ;
- 15 000 à 25 000 € ;
- plus de 25 000 € ;
- je souhaite d'abord comprendre les solutions.

Délai :

- dès que possible ;
- avant la prochaine saison ;
- dans l'année ;
- simple réflexion.

Le budget est facultatif, oriente la recommandation et ne rend pas automatiquement un produit incompatible. Son emplacement avant ou après une première recommandation devra être testé : le demander trop tôt peut provoquer un ancrage négatif ou faire fuir un prospect premium.

### Étape 4 — Recommandation

Présenter une recommandation principale et deux alternatives maximum. Un lien secondaire `Voir toutes les solutions compatibles` reste disponible afin de ne pas donner l'impression que Diskoov cache des options.

Chaque résultat contient :

- nom public de la solution ;
- image réelle ;
- estimation ou fourchette TTC ;
- statut de compatibilité ;
- trois raisons issues des réponses ;
- bénéfices essentiels ;
- principal compromis dans `À savoir` ;
- pose incluse ou non ;
- CTA `Configurer cette solution` ;
- action `Comparer`.

Exemple de justification :

> Adaptée à votre bassin 8 × 4 m, à votre priorité d'entretien simplifié et à votre souhait d'une solution automatique discrète.

### Étape 5 — Comparaison

Comparer au maximum trois solutions sur :

- budget indicatif TTC ;
- norme de sécurité applicable ;
- confort quotidien ;
- propreté de l'eau ;
- maintien de la chaleur ;
- prolongation de baignade ;
- discrétion visuelle ;
- encombrement autour du bassin ;
- adaptation aux formes atypiques ;
- pose ;
- entretien ;
- délai ou étude nécessaire.

Sur mobile, la comparaison devient une succession de critères avec colonne recommandée fixe, pas un tableau horizontal illisible.

### Étape 6 — Configuration technique

Réutiliser les règles actuelles, mais ne montrer que les questions qui ont un impact réel sur le produit choisi.

Ordre recommandé :

1. prestation et pose ;
2. support et margelles ;
3. contraintes du mécanisme ;
4. options fonctionnelles ;
5. esthétique et coloris ;
6. résultat tarifaire.

Chaque indisponibilité doit afficher la raison et la solution possible.

### Étape 7 — Photo et chantier

La photo devient un accélérateur, jamais un prérequis :

> Une photo permet à Diskoov de vérifier plus vite les margelles, l'accès et l'intégration de la solution.

Prévoir :

- photo ou plan ;
- aperçu et suppression ;
- prise directe depuis le téléphone ;
- aide au cadrage ;
- formats et poids visibles ;
- confidentialité expliquée ;
- bouton `Passer cette étape`.

### Étape 8 — Coordonnées

À tester avec Xavier :

- prénom ;
- nom ;
- téléphone ;
- email ;
- code postal ou département ;
- préférence de contact ;
- créneau éventuel ;
- commentaire facultatif ;
- consentement devis ;
- consentement commercial séparé et facultatif.

Deux variantes devront être testées : téléphone et email obligatoires, ou au moins un moyen de contact obligatoire. La décision finale dépendra du taux de joignabilité et de qualification réellement constaté par Xavier.

CTA : `Recevoir mon estimation détaillée`.

Expliquer pourquoi téléphone et email sont demandés si les deux restent obligatoires.

### Étape 9 — Résultat

- confirmation claire ;
- référence de projet ;
- solution retenue ;
- prix ou statut d'étude ;
- inclus / à vérifier ;
- délai de réponse ;
- prochaines étapes ;
- possibilité de télécharger, partager ou modifier ;
- accès au contact Diskoov sans créer de compte.

## 7. Architecture de recommandation

La recommandation doit être séparée du calcul tarifaire.

### Niveau 1 — Éligibilité technique

Contraintes strictes : forme, dimensions, support, margelles, dégagement, alimentation, escalier, rail, hauteur, portée, accès et zones documentées.

### Niveau 2 — Pertinence d'usage

Scores issus des préférences : budget, automatisation, esthétique, chaleur, entretien, sécurité, espace et saison de baignade.

### Niveau 3 — Confiance

- `compatible` : données suffisantes et règles couvertes ;
- `compatible sous réserve` : une vérification chantier reste nécessaire ;
- `étude personnalisée` : cas valable mais tarif ou contrainte non automatisable ;
- `non compatible` : blocage documenté.

### Niveau 4 — Explication

Chaque score doit générer des raisons publiques. Une recommandation non explicable est interdite.

### Garde-fous

- ne jamais recommander selon la marge seule ;
- ne jamais inventer un prix hors grille ;
- ne pas masquer une alternative compatible ;
- ne pas présenter `sur devis` comme une erreur ;
- permettre de poursuivre vers Xavier même sans recommandation automatique.

## 8. Brainstorm — Inventaire d'améliorations

### Stratégie et conversion

1. Double entrée guidée/directe.
2. Reprise d'un projet partagé.
3. Recommandation avant configuration.
4. Alternatives expliquées.
5. Budget utilisé comme préférence, pas comme sanction.
6. Valeur fournie avant collecte des coordonnées.
7. CTA évolutif selon l'étape.
8. Résumé prospect différent du dossier interne Xavier.
9. Lead score interne fondé sur complétude, photo et délai.
10. Boucle de retour Xavier : qualifié, rendez-vous, gagné, perdu, motif.

### UX et information

11. Une décision principale par écran.
12. Retour visible et navigateur précédent fonctionnel.
13. `Je ne sais pas` sur les questions techniques.
14. Questions conditionnelles uniquement.
15. Raisons visibles pour les choix désactivés.
16. Comparaison limitée à trois solutions.
17. Résumé modifiable sans perdre la progression.
18. Sauvegarde locale et lien partageable.
19. Aucun scroll automatique sur les comparaisons.
20. Focus déplacé vers le bon titre après changement d'étape.

### Contenu et confiance

21. Présenter Xavier et son expérience vérifiée.
22. Montrer la responsabilité réelle de la pose pour chaque produit.
23. Afficher les normes uniquement lorsqu'elles sont confirmées.
24. Montrer de vraies réalisations et leur contexte.
25. Ajouter avis réels avec source consultable.
26. Présenter clairement inclusions et exclusions tarifaires.
27. Donner le déroulement du projet après la demande.
28. Expliquer les compromis, pas seulement les avantages.
29. Adapter les arguments à la priorité choisie.
30. Remplacer les notes internes par une aide publique concise.

### Interface et média

31. Mosaïque produit neutre sur l'accueil.
32. Visuel contextuel après sélection.
33. Images agrandissables partout où elles expliquent un produit.
34. Points focaux par image et breakpoint.
35. Comparateur visuel avant/après si de vraies photos existent.
36. Galerie de réalisations filtrée par famille.
37. Prix, dimensions et compatibilité avec typographie tabulaire.
38. Icônes dessinées à partir des objets réels : rail, lames, abri, toile.
39. Limiter les cartes et les pilules décoratives.
40. Utiliser des séparateurs inspirés des lignes d'eau et de mesure.

### Mobile

41. CTA sticky unique, jamais deux actions concurrentes.
42. Prix sticky seulement après disponibilité.
43. Image compacte et contextuelle, non dominante au démarrage.
44. Comparaison verticale optimisée au pouce.
45. Prise photo directe et aperçu immédiat.
46. Zones tactiles confortables.
47. Clavier numérique pour dimensions et code postal.
48. Reprise après interruption ou changement d'orientation.
49. Aucune information essentielle dans un tooltip.
50. Barre de progression textuelle courte : `Besoin · Piscine · Résultat · Projet`.

### Technique, performance et qualité

51. Précharger uniquement l'image du premier écran.
52. Charger les galeries et détails produit à la demande.
53. Définir les dimensions des médias pour éviter les décalages.
54. Tester chaque règle tarifaire avant et après refonte.
55. Tests de navigation clavier.
56. Tests mobile 360, 390, 430 et tablette.
57. Test reduced-motion.
58. Journaux analytics par étape et par source.
59. Mesure des erreurs et des retours arrière.
60. Vérification manuelle des emails prospect et équipe.

## 9. Directions visuelles explorées

### Direction A — Ligne d'eau — recommandée

Concept : précision technique et sérénité d'un bassin propre.

- composition claire, asymétrique mais calme ;
- ligne continue qui porte progression, mesures et comparaison ;
- images réelles lumineuses ;
- surfaces minérales et traits fins ;
- priorité à la lisibilité et aux produits ;
- personnalité premium sans luxe ostentatoire.

Risque : devenir trop clinique si les preuves humaines sont absentes.

### Direction B — L'atelier de Xavier

Concept : conseil personnel d'un spécialiste expérimenté.

- portrait, annotations et conseils de terrain ;
- interface plus chaleureuse ;
- recommandations présentées comme une fiche de conseil ;
- preuve humaine très forte.

Risque : trop dépendante de Xavier et moins scalable.

### Direction C — Galerie architecturale

Concept : protection piscine comme élément de l'architecture extérieure.

- très grandes photos ;
- rythme éditorial ;
- comparaison par ambiances et usages ;
- forte perception premium.

Risque : moins efficace pour un parcours technique et mobile.

### Choix

Adopter `Ligne d'eau`, enrichie de quelques preuves humaines de `L'atelier de Xavier`.

Rejeter une direction générique fond crème + serif + terracotta, les gradients violets, le glassmorphism, les grosses cartes arrondies identiques et les animations de défilement décoratives.

## 10. Système visuel proposé

### Palette de travail

- `Bassin profond` — `#10251C` : texte fort, header, actions principales.
- `Porcelaine` — `#F5F7F3` : fond principal lumineux.
- `Eau claire` — `#3B8395` : information, progression et liens.
- `Laiton Diskoov` — `#C49A52` : sélection, prix et signature de marque.
- `Brume` — `#DDE8E3` : surfaces secondaires et compatibilité.
- `Corail sécurité` — `#B94E3D` : erreur et blocage uniquement.

Le bleu ne doit pas transformer l'interface en site générique de piscine. Le vert profond et le laiton conservent l'identité Diskoov.

### Typographie

- Titres : `Familjen Grotesk`, expressif avec retenue, à valider avec Xavier et à auto-héberger seulement si son coût de chargement reste acceptable.
- Corps et contrôles : `Inter`, pour la continuité et la lisibilité.
- Prix et dimensions : chiffres tabulaires d'Inter, pas de police décorative.

Fallbacks système obligatoires et validation du chargement avant adoption.

### Géométrie

- rayons 8 à 12 px ;
- boutons suffisamment hauts, peu de pilules ;
- traits de 1 px ;
- ombres rares et fonctionnelles ;
- sélection par bordure, fond et coche, pas par couleur seule ;
- espace généreux autour des décisions importantes.

### Layout desktop

```text
┌────────────────────────────────────────────────────────────┐
│ Logo                    Étape 2 sur 4        Besoin d'aide │
├──────────────────────────┬─────────────────────────────────┤
│ Contexte / produit       │ Question principale             │
│ image réelle             │ aide courte                     │
│ raisons / résumé         │ choix                           │
│                          │                                 │
│                          │ Retour                 Continuer│
└──────────────────────────┴─────────────────────────────────┘
```

La colonne d'action utilise une largeur fluide d'environ 460 à 620 px selon le viewport. Le visuel ne doit plus réduire le formulaire à une bande étroite ni devenir secondaire sur les grands écrans.

### Layout mobile

```text
┌─────────────────────────┐
│ Diskoov       Étape 2/4 │
├─────────────────────────┤
│ Titre de la question    │
│ Aide courte             │
│                         │
│ Choix                   │
│ Choix                   │
│ Choix                   │
│                         │
├─────────────────────────┤
│ Retour        Continuer │
└─────────────────────────┘
```

Le média est intégré à l'étape seulement lorsqu'il aide la décision.

## 11. Détails signature

### La ligne d'eau

Job : relier progression, dimensions et résultat dans un langage propre à la piscine.

- trait horizontal ou vertical discret ;
- se remplit lors de la progression ;
- devient une échelle de comparaison sur le résultat ;
- aucune information ne dépend de l'animation ;
- version reduced-motion instantanée.

### La fiche conseil

Job : rendre la recommandation vérifiable.

- `Pourquoi cette solution` ;
- `Compatible avec votre piscine` ;
- `À savoir avant de choisir` ;
- lien vers les réponses ayant influencé le choix.

### La transition photo-produit

Job : montrer la causalité entre le choix et le produit affiché.

- fondu court avec léger recadrage ;
- aucun zoom spectaculaire ;
- interruption possible ;
- image nette immédiatement en reduced-motion.

## 12. Motion

### Tokens

- instant : 100 ms ;
- rapide : 150 ms ;
- standard : 220 ms ;
- vue : 320 ms maximum ;
- easing entrée : décélération douce ;
- easing sortie : plus rapide que l'entrée.

### Jobs autorisés

- confirmation d'un choix ;
- continuité entre étapes ;
- apparition d'une question conditionnelle ;
- mise à jour de la recommandation ou du prix ;
- ouverture d'une photo ;
- confirmation d'envoi.

Interdits : parallaxe, scroll hijacking, cartes qui flottent, cascades de fade-up, vidéo autoplay et animation perpétuelle près du formulaire.

## 13. Composants et états

Composants nécessaires :

- shell du parcours ;
- en-tête et progression ;
- carte de priorité ;
- choix simple ou multiple ;
- saisie de dimensions ;
- carte produit ;
- badge de compatibilité ;
- comparateur ;
- panneau prix ;
- résumé modifiable ;
- uploader photo ;
- champs de contact ;
- alerte et aide contextuelle ;
- confirmation finale ;
- lightbox image.

Chaque composant doit couvrir : repos, hover, focus visible, pressé, sélectionné, désactivé avec raison, chargement, erreur et succès lorsque pertinent.

## 14. Contenu et preuve

À obtenir de Xavier avant validation finale :

- expérience exacte et formulation autorisée ;
- zones d'intervention ;
- responsabilités de visite, pose, livraison et SAV par produit ;
- garanties ;
- normes confirmées ;
- délais réels ;
- inclusions et exclusions ;
- avis clients avec source ;
- photos de réalisations utilisables ;
- coordonnées et showroom à mettre en avant ;
- définition d'un lead qualifié ;
- motifs habituels de perte d'une vente.

Aucune preuve ne sera inventée pour le prototype présenté à Xavier.

## 15. Analytics et retour commercial

Événements minimum :

- `advisor_opened` ;
- `entry_mode_selected` ;
- `step_viewed` ;
- `step_completed` ;
- `step_back` ;
- `unknown_answer_selected` ;
- `recommendation_shown` ;
- `alternative_compared` ;
- `recommended_product_selected` ;
- `price_shown` ;
- `custom_study_required` ;
- `photo_added` ;
- `form_started` ;
- `lead_submitted` ;
- `lead_qualified` ;
- `appointment_created` ;
- `sale_won` / `sale_lost` et motif.

North star : taux de leads qualifiés par session éligible.

Garde-fous : taux de faux prix, volume d'études manuelles, abandon par étape, erreurs, performance mobile et satisfaction de Xavier sur les dossiers reçus.

## 16. Accessibilité et performance

- WCAG 2.2 AA ;
- labels visibles et associés ;
- focus jamais masqué par le sticky footer ;
- navigation clavier complète ;
- changements d'état annoncés ;
- aucune interaction drag-only ;
- alternative reduced-motion ;
- contraste texte et contrôles ;
- cibles tactiles confortables ;
- saisies conservées après erreur ;
- LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1 au 75e percentile ;
- images responsive, dimensions réservées, lazy loading après le premier média ;
- aucun framework ou moteur d'animation ajouté sans besoin démontré.

## 17. Plan de réalisation

### Phase 0 — Décisions avec Xavier

- valider la mission ;
- définir le lead qualifié ;
- valider les familles publiques ;
- remplir la matrice priorité → produit ;
- valider budgets et inclusions ;
- inventorier les preuves et médias.

Gate : aucune recommandation ne peut être prototypée sans matrice explicable.

### Phase 1 — Prototype UX

- construire accueil, priorités, piscine, recommandation, comparaison et contact ;
- utiliser du contenu réel ou clairement marqué à confirmer ;
- tester desktop et mobile ;
- tester six scénarios de prospects.

Gate : 80 % des testeurs doivent terminer sans aide et expliquer le résultat.

### Phase 2 — Système visuel

- valider `Ligne d'eau` ;
- produire les tokens ;
- définir composants et états ;
- préparer les médias ;
- valider le premier écran avec Xavier.

Gate : offre, prochaine action et preuve doivent être comprises en quelques secondes.

### Phase 3 — Intégration fonctionnelle

- préserver le moteur métier ;
- ajouter la couche de recommandation ;
- implémenter les deux modes d'entrée ;
- intégrer résumé, comparaison et photo tardive ;
- instrumenter les événements ;
- conserver URL partageable et emails.

Gate : tous les tests métier existants restent verts et les nouveaux tests de recommandation passent.

### Phase 4 — QA complète

- combinaisons produits et non-happy paths ;
- desktop, tablette, mobile ;
- clavier, focus, lecteur d'écran de premier niveau ;
- reduced-motion ;
- images, recadrages et lightboxes ;
- emails prospect et équipe ;
- analytics ;
- performances ;
- comparaison avec la V1.

Gate : aucun blocage critique, aucun faux prix, aucune fuite d'information interne.

### Phase 5 — Lancement et apprentissage

- mesurer une baseline ;
- vérifier la qualité des événements ;
- recueillir le jugement de Xavier sur chaque lead ;
- analyser les abandons ;
- améliorer les questions avant de tester des variations cosmétiques.

## 18. Scénarios de recette prioritaires

1. Prospect novice, piscine rectangulaire 8 × 4, entretien prioritaire.
2. Prospect venu de la page volet hors-sol.
3. Petit budget et bassin compatible avec bâche à barres.
4. Priorité baignade longue saison : abri recommandé.
5. Priorité optimisation d'espace : MasterDeck considéré.
6. Forme libre : solutions incompatibles écartées avec explication.
7. Dimensions inconnues : parcours poursuivable.
8. Dimensions hors grille : étude personnalisée, jamais faux prix.
9. Photo ajoutée sur mobile.
10. Abandon puis reprise par URL.
11. Navigation arrière sans perte de réponses.
12. Produit direct devenu incompatible après dimensions.
13. Coordonnées invalides puis correction sans perte du projet.
14. Mode reduced-motion.
15. Parcours entièrement clavier.

## 19. Idées rejetées pour la première proposition

- chatbot comme point d'entrée ;
- configurateur 3D ;
- compte obligatoire ;
- photo obligatoire ;
- longue landing page avant l'outil ;
- comparateur de toutes les références en même temps ;
- recommandation basée sur un best-seller ;
- avis ou statistiques fictifs ;
- prix exact lorsque la documentation ne le permet pas ;
- ajout d'un framework uniquement pour moderniser l'apparence ;
- scroll narratif et animations décoratives.

## 20. Critères d'acceptation de la proposition à Xavier

- `main` reste intacte et démontrable ;
- la V2 vit sur une branche séparée ;
- le premier écran ne ressemble plus à une page volet ;
- le parcours guidé et le parcours direct sont tous deux démontrables ;
- la recommandation est explicable ;
- les produits incompatibles sont justifiés ;
- le prix conserve la source Excel Diskoov ;
- la photo intervient après la valeur ;
- les textes internes sont absents ;
- mobile est recomposé ;
- toutes les images utiles sont inspectables ;
- les états difficiles sont prévus ;
- le résultat est moderne sans suivre une mode générique ;
- les tests métier, UX, accessibilité et performance sont documentés.

### Scorecard provisoire du plan

Échelle : 1 faible, 3 correct mais incomplet, 5 prêt et vérifié.

| Dimension | Score | Motif |
|---|---:|---|
| Clarté business | 5 | Le rôle de conseiller et le lead qualifié sont prioritaires |
| Adaptation aux prospects | 4 | Parcours novice et direct couverts ; validation utilisateur manquante |
| Intégrité métier | 4 | Sources et familles préservées ; matrice de recommandation à construire |
| Recherche et benchmark | 4 | Sources sectorielles et UX intégrées ; analytics Diskoov réels manquants |
| Architecture UX | 4 | Flux et non-happy paths définis ; prototype non testé |
| Direction visuelle | 4 | Concept spécifique et tokens proposés ; validation de marque manquante |
| Confiance et preuves | 3 | Stratégie claire mais preuves réelles à fournir par Xavier |
| Mobile | 4 | Recomposition définie ; rendu non testé |
| Accessibilité | 4 | Cible et exigences explicites ; audit sur prototype manquant |
| Performance | 4 | Budgets et risques définis ; mesures réelles manquantes |
| Mesure de conversion | 4 | Funnel complet prévu ; connexion au retour commercial à organiser |
| Faisabilité technique | 3 | Moteur existant réutilisable ; architecture V2 pas encore décidée |

Verdict : `PASS POUR PROTOTYPAGE`, `REVISE AVANT PRODUCTION`.

## 21. Sources de conception

- Diskoov : https://diskoov.fr/
- Configurateur Coverseal : https://config.coverseal.com/
- Abridéal : https://www.abrideal.com/
- GOV.UK Question pages : https://design-system.service.gov.uk/patterns/question-pages/
- W3C Forms : https://www.w3.org/WAI/tutorials/forms/
- WCAG 2.2 : https://www.w3.org/TR/WCAG22/
- Nielsen Norman Group, heuristiques : https://www.nngroup.com/articles/ten-usability-heuristics/
- Nielsen Norman Group, confiance : https://www.nngroup.com/articles/trustworthy-design/
- Baymard, formulaires : https://baymard.com/learn/form-design
- DGCCRF, sécurité piscine : https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/piscines-respectez-les-exigences-de-securite
- Fédération des Professionnels de la Piscine : https://www.propiscines.fr/
- CNIL : https://www.cnil.fr/
- Core Web Vitals : https://web.dev/articles/defining-core-web-vitals-thresholds

## 22. Challenge final des décisions

Ce red-team est réalisé avant le début de l'implémentation. Une décision n'est conservée que si elle résout un problème identifié et reste vérifiable.

| Décision attaquée | Risque / objection | Décision finale | Garde-fou |
|---|---|---|---|
| Transformer le configurateur en conseiller | Le parcours peut devenir plus long que la V1 | Conserver | Mode direct disponible et quatre macro-étapes seulement |
| Une décision par écran | Trop de clics et fatigue | Réviser | Regrouper les informations étroitement liées ; ne pas appliquer une règle rigide « un champ par page » |
| Deux modes d'entrée | Double maintenance et incohérences | Conserver | Mêmes composants, même état et même moteur ; seule l'entrée change |
| Mosaïque neutre au démarrage | Peut être chargée, lente ou peu lisible | À prototyper | Trois ou quatre vraies familles maximum, poids média strict, alternative statique simple |
| Ne pas montrer un produit dominant | Diskoov souhaite peut-être pousser une offre premium | Conserver pour l'entrée générique | Les pages produit continuent d'entrer directement sur leur solution |
| Demander les priorités avant les dimensions | Les dimensions déterminent fortement l'éligibilité | Conserver | Priorités très courtes, puis dimensions immédiatement ; aucune recommandation avant les contraintes minimales |
| Demander un budget | Peut faire fuir, sous-déclarer le budget ou ancrer négativement | Réviser | Question facultative, réponse d'incertitude et test de son emplacement |
| Afficher trois solutions maximum | Peut masquer une alternative pertinente | Réviser | Top 3 plus accès à toutes les solutions compatibles |
| Recommandation principale | Risque de recommandation biaisée ou commercialement intéressée | Conserver sous condition | Score explicable, alternatives visibles, aucune marge dans le score public |
| Score de recommandation | Complexité, dette et faux sentiment de précision | Conserver sous condition | Matrice lisible, coefficients documentés, tests unitaires et niveau de confiance |
| Comparaison détaillée | Peut recréer une surcharge d'information | Réviser | Dix à douze critères maximum, ordre adapté aux priorités du prospect, résumé en premier |
| Déplacer la photo après la recommandation | Une photo peut révéler tôt une incompatibilité | Conserver | Upload accessible en raccourci, mais jamais imposé ni visuellement dominant avant la valeur |
| Prix ou fourchette dès la recommandation | Risque d'afficher un montant trop tôt ou incomplet | Conserver sous condition | Fourchette issue des grilles ; prix précis seulement après données suffisantes |
| Sticky CTA unique sur mobile | Une action secondaire peut devenir difficile à trouver | Conserver | Retour dans l'en-tête ou le contenu, action principale seule dans le sticky |
| Masquer le sticky prix au début | L'utilisateur peut ne pas comprendre qu'une estimation existe | Réviser | Afficher une promesse discrète ; activer le prix sticky seulement dès qu'il a une valeur |
| Présenter Xavier dans le tunnel | Dépendance excessive à une personne | Réviser | Xavier comme preuve ponctuelle ; Diskoov, fabricants et processus restent la marque principale |
| Preuves près du CTA | Risque de bruit et de ralentissement | Conserver | Deux ou trois preuves vérifiées maximum, adaptées à l'étape |
| Nouvelle police et nouvelle palette | Dérive de marque et coût de performance | Réviser | Tokens provisoires, comparaison avec l'identité existante, police de titre auto-hébergée ou abandon |
| Signature « ligne d'eau » | Peut devenir un gadget décoratif | Conserver sous condition | Elle doit porter progression ou mesure ; suppression immédiate si elle n'améliore pas la compréhension |
| Animations de transition | Risque de lenteur, mal des transports et fragilité | Conserver avec retenue | CSS d'abord, 320 ms maximum, interruption, reduced-motion et aucune donnée cachée |
| Colonne de formulaire plus large | Réduit l'impact des photos premium | Réviser | Largeur fluide 460–620 px et équilibre différent selon accueil, comparaison et configuration |
| Lead score interne | Risque de surautomatisation et de traitement opaque | Reporter | Pas de décision automatique ; commencer par des tags factuels et le jugement de Xavier |
| Téléphone et email obligatoires | Friction inutile | À tester | Comparer double obligation à « au moins un contact » selon la joignabilité réelle |
| Barre de progression en quatre étapes | Certaines branches ont des longueurs différentes | Conserver | Macro-étapes stables, pas de pourcentage trompeur ni de total de questions |
| Conserver l'architecture monofichier | La V2 pourrait devenir difficile à maintenir | Ne pas décider maintenant | ADR technique après prototype ; ne migrer que si la complexité le justifie |
| Ajouter un framework moderne | Peut alourdir le site sans bénéfice prospect | Rejeter par défaut | Autorisé seulement après preuve d'un besoin de composants, état ou tests non maîtrisable simplement |
| Objectif de 80 % en test utilisateur | Petit échantillon et fausse précision statistique | Réviser | Seuil qualitatif de passage, complété par observation des erreurs et compréhension du résultat |

### Décisions réellement modifiées après challenge

1. Le parcours conserve neuf écrans conceptuels mais n'affiche que quatre macro-étapes.
2. La règle devient « une décision cohérente par vue », pas « un champ par page ».
3. Le budget devient facultatif et son emplacement doit être testé.
4. Le top 3 n'empêche pas de consulter toutes les solutions compatibles.
5. La largeur desktop devient fluide, pas figée à 500 px.
6. La typographie et la palette sont des hypothèses à valider, pas encore des choix de production.
7. Le lead score est reporté au profit de tags factuels et du retour de Xavier.
8. Le choix téléphone/email doit être décidé avec des données commerciales.
9. Le choix d'architecture technique est repoussé après validation du prototype.
10. Le seuil de test utilisateur est un gate qualitatif, pas une preuve statistique.

### Premortem — si la V2 échoue, causes probables

- Le parcours est plus beau mais trop long : mesurer l'abandon à chaque vue et raccourcir avant d'ajouter des effets.
- La recommandation semble arbitraire : afficher les réponses utilisées et permettre de comparer.
- Les prix font perdre confiance : distinguer fourchette, estimation et étude personnalisée.
- Xavier reçoit plus de leads mais moins bons : connecter le retour commercial au funnel.
- Les photos ralentissent le mobile : budgets de poids, crops dédiés et chargement différé.
- Le design paraît générique : utiliser produits, preuves, vocabulaire et détails propres à Diskoov.
- Le code devient fragile : isoler état, règles, rendu et analytics ; décider l'architecture avant implémentation.
- Les règles métier régressent : maintenir les tests actuels et ajouter les scénarios de recommandation.
- La V2 favorise trop les produits premium : rendre les alternatives et compromis visibles.
- Le prototype plaît à l'équipe mais pas aux prospects : tests utilisateurs obligatoires avant finition.

### Verdict du challenge

`PASS POUR PROTOTYPAGE`, pas pour implémentation complète.

Les inconnues bloquant la production sont : matrice priorité → produit, budgets publics, preuves commerciales, politique de contact et choix technique d'architecture. Le prochain livrable doit être un prototype de parcours, pas une refonte immédiate du moteur.

## 23. Prochaine décision

Avant de coder, présenter à Xavier :

1. le nouveau positionnement de conseiller ;
2. les deux modes d'entrée ;
3. le parcours en neuf étapes ;
4. un wireframe desktop et mobile ;
5. la direction visuelle `Ligne d'eau` ;
6. la matrice de recommandation à compléter avec lui ;
7. les preuves et contenus qu'il doit fournir.

Après validation, commencer la Phase 1 sur cette branche sans modifier `main`.
