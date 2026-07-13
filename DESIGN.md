# Conseiller Diskoov - direction UI

## Intention

Le conseiller est un outil de décision pour un prospect qui ne connaît pas forcément les familles de protections. Le design doit rendre les différences reconnaissables avant d'être mémorisées, rassurer sur l'étude humaine et conserver un chemin court vers le devis.

Registre : professionnel, calme, précis et orienté piscine. L'interface n'est ni une landing page décorative ni un catalogue technique.

## Palette fonctionnelle

| Rôle | Token | Usage |
| --- | --- | --- |
| Action | `--advisor-forest` | CTA principal, titres structurants |
| Navigation | `--advisor-navy` | sélection courante, sélecteurs, accès direct |
| Guidage | `--advisor-water` | progression, focus, informations bassin |
| Accent | `--advisor-brass` | repère prioritaire et signature Diskoov, avec parcimonie |
| Validation humaine | `--advisor-sage` | accompagnement et famille abris |
| Structure | `--advisor-paper`, `--advisor-line` | fonds secondaires et séparateurs |

Les couleurs modernes sont définies en OKLCH, avec un repli hexadécimal. Tous les textes fonctionnels dépassent 4,5:1 de contraste. La couleur n'est jamais le seul indicateur d'un état : sélection, priorité et statut gardent aussi une icône ou un libellé.

## Empreinte des familles

La même couleur accompagne une famille dans l'accès direct, les fiches, la recommandation et le comparatif.

| Famille prospect | Couleur |
| --- | --- |
| Couvertures de piscine | Eau / turquoise |
| Couverture à barres | Laiton / orange Diskoov |
| Volets de piscine | Bleu marque |
| Abris télescopiques | Vert sauge |
| Terrasse mobile | Vert profond |

Ces couleurs servent à la reconnaissance, pas à qualifier la compatibilité. Une compatibilité ou une étude reste toujours exprimée par du texte.

## Composants

- **CTA principal** : vert profond, flèche laiton, une seule action dominante par zone.
- **Rail d’accueil** : trois étapes réellement séquentielles, différenciées par les couleurs navigation, bassin et comparaison ; accents colorés courts, jamais décoratifs hors de ce contexte.
- **Action secondaire** : fond clair, bord visible, texte bleu ou vert foncé.
- **Cartes de priorité** : icône teintée, description courte, état sélectionné avec fond, contour complet et coche.
- **Limite de choix** : deux priorités maximum ; les autres choix sont désactivés avec une explication visible, sans remplacement silencieux.
- **Sélecteurs segmentés** : icône + libellé, état actif bleu marque, navigation clavier par flèches.
- **Progression** : liste ordonnée sémantique, étape courante la plus visible, statut vocalisé hors écran.
- **Vue des solutions** : trois familles maximum, classées selon les priorités, avec couleur, fonctionnement et présence visuelle avant le développement du premier produit.
- **Réassurance** : fond sauge réservé à la vérification humaine ; engagements de processus vérifiables (choix modifiable, contraintes et pose confirmées), jamais de note, ancienneté ou témoignage sans source validée.
- **Avis Google** : module unique réunissant `4,9/5`, plus de 30 avis, un témoignage court et le lien vers la fiche publique ; données contrôlées le 12 juillet 2026 et nouvelle vérification obligatoire avant chaque publication.
- **Preuves d’expertise** : `13 ans` d’expérience terrain, partenariat Premium avec trois fabricants et accompagnement du projet repris du [site officiel Diskoov](https://diskoov.fr/), contrôlé le 12 juillet 2026.
- **Témoignage** : extrait court de l’avis Google de Dagmar S. publié sur le [site officiel Diskoov](https://diskoov.fr/) ; attribution visible et date de contrôle conservée dans le code.
- **Recommandation** : image réelle, catégorie, bénéfices, raison du classement, contrainte principale et CTA devis.
- **Comparatif** : mêmes couleurs et icônes que les familles ; tableau sur desktop, cartes sur mobile.
- **Détail produit** : dialogue focalisé, contrainte visible avant le CTA, caractéristiques secondaires repliables, fermeture 44 x 44 px et retour du focus au déclencheur.

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
