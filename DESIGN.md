# Conseiller Diskoov - direction UI

## Intention

Le conseiller est un outil de décision pour un prospect qui ne connaît pas forcément les familles de protections. Le design doit rendre les différences reconnaissables avant d'être mémorisées, rassurer sur l'étude humaine et conserver un chemin court vers le devis.

Registre : professionnel, calme, précis et orienté piscine. L'interface n'est ni une landing page décorative ni un catalogue technique.

## Palette fonctionnelle

| Rôle | Token | Usage |
| --- | --- | --- |
| Marque et action | `--advisor-brand` (`#1F407C`) | CTA principal, titres, navigation et sélection |
| Fond de marque | `--advisor-brand-deep` (`#0F264D`) | panneau média et surfaces à fort contraste |
| Signature | `--advisor-accent` (`#F37021`) | flèches, étoiles et accents de marque courts |
| Accent fonctionnel | `--advisor-accent-dark` (`#9A3E00`) | focus, progression active et libellé du premier rang |
| Information bassin | `--advisor-water` | schémas et aides de mesure uniquement |
| Validation | `--advisor-success` | compatibilité ou confirmation réellement documentée |
| Structure | `--advisor-paper`, `--advisor-line` | fonds secondaires et séparateurs |

Le bleu et l'orange sont extraits du logo Diskoov fourni. La stratégie est restreinte : blanc et neutres bleutés structurent l'interface, le bleu porte l'identité et l'orange reste rare. Les couleurs modernes sont exprimées en OKLCH à partir des références de marque, avec un repli hexadécimal. Tous les textes fonctionnels dépassent 4,5:1 de contraste. La couleur n'est jamais le seul indicateur d'un état.

## Empreinte des familles

Les familles ne reçoivent plus de couleur propre. Une palette par famille obligeait le prospect à apprendre une légende, concurrençait les états métier et donnait un aspect de nuancier.

La reconnaissance repose sur quatre éléments stables : photo du produit, pictogramme physique, nom de la famille et trois repères comparables (`Manipulation`, `Présence`, `À prévoir`). Une légende précise lorsque l'image illustre un exemple ou un visuel de gamme. Une compatibilité ou une étude est toujours exprimée par un libellé.

## Composants

- **CTA principal** : bleu Diskoov, flèche orange, une seule action dominante par zone.
- **Rail d’accueil** : une seule bande blanche, trois étapes et des séparateurs ; numéros orange et pictogrammes bleus.
- **Action secondaire** : fond blanc, bord visible et texte bleu profond.
- **Choix de priorité** : surface neutre et pictogramme monochrome ; seul l'état sélectionné reçoit un fond et un contour bleus.
- **Limite de choix** : deux priorités maximum ; les autres choix sont désactivés avec une explication visible, sans remplacement silencieux.
- **Sélecteurs segmentés** : icône + libellé, état actif bleu marque, navigation clavier par flèches.
- **Progression** : liste ordonnée sémantique, étape courante la plus visible, statut vocalisé hors écran.
- **Vue des solutions** : un index classé dans une surface unique ; la première proposition est soulignée par le fond bleu clair et un libellé orange.
- **Réassurance** : une bande structurée par des séparateurs ; engagements de processus vérifiables, jamais de preuve non sourcée.
- **Avis Google** : module unique réunissant `4,9/5`, plus de 30 avis, un témoignage court et le lien vers la fiche publique ; données contrôlées le 12 juillet 2026 et nouvelle vérification obligatoire avant chaque publication.
- **Preuves d’expertise** : `13 ans` d’expérience terrain, partenariat Premium avec trois fabricants et accompagnement du projet repris du [site officiel Diskoov](https://diskoov.fr/), contrôlé le 12 juillet 2026.
- **Témoignage** : extrait court de l’avis Google de Dagmar S. publié sur le [site officiel Diskoov](https://diskoov.fr/) ; attribution visible et date de contrôle conservée dans le code.
- **Recommandation** : image réelle, catégorie, bénéfices, raison du classement, contrainte principale et CTA devis.
- **Comparatif** : pictogrammes monochromes ; tableau sur desktop, cartes sur mobile.
- **Détail produit** : dialogue focalisé, contrainte visible avant le CTA, CTA collant sur mobile, caractéristiques secondaires repliables, fermeture 44 x 44 px et retour du focus au déclencheur.

## Mouvement

- `150 ms` pour le retour tactile, `180 ms` pour un état et `220 ms` pour un changement d’écran.
- Le mouvement explique une navigation, une sélection, une révélation progressive ou l’ouverture d’un dialogue ; aucune animation décorative au scroll.
- Les écrans restent lisibles dans leur état initial : l’entrée utilise au maximum `8 px` de déplacement et un fondu partiel, jamais un contenu entièrement masqué.
- Les médias changent par fondu court après chargement. Les contenus d’un dialogue restent présents pendant sa fermeture.
- `prefers-reduced-motion` supprime les animations et remplace le défilement fluide JavaScript par un déplacement instantané.

## Mise en page

- Desktop : visuel contextualisant à gauche, tâche active à droite.
- Sous 960 px : disparition du panneau visuel hors accueil pour maximiser l'espace utile.
- Sous 680 px : une colonne, footer d'action collant, comparatif en cartes et images produit en pleine largeur.
- Sous 360 px : composition et textes restent lisibles sans réduction typographique supplémentaire.
- Aucune typographie ne rétrécit en fonction de la largeur du viewport.
- Les zones interactives font au moins 40 x 40 px, 44 px pour les actions mobiles principales.
- L’accueil du conseiller conserve une navigation focalisée : le logo et l’accès direct suffisent. La navigation complète du site n’est pas dupliquée afin de ne pas multiplier les sorties avant le démarrage.

## Garde-fous

- Ne pas ajouter une nouvelle couleur sans rôle réutilisable.
- Ne pas colorer un texte uniquement pour décorer.
- Ne pas multiplier les cartes imbriquées.
- Ne pas remplacer une photo produit utile par une illustration générique.
- Ne pas utiliser de promesse commerciale comme état visuel si elle n'est pas documentée.
- Ne jamais présenter un article ou un document interne comme un « guide Diskoov » sans ressource prospect validée.
- Employer des formulations directes côté prospect : nommer la question, l’information ou l’action concrète ; éviter les oppositions artificielles (« usage / jargon »), les intensifs vagues (« vraiment ») et les termes de processus (« vérification humaine »).
- Ne pas masquer une contrainte pour alléger une fiche produit.
- Ne jamais présélectionner silencieusement une réponse qui influence la compatibilité ou le devis.
- Respecter `prefers-reduced-motion` et limiter les transitions aux propriétés compositées ou aux états courts.
