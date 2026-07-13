# Red-team prospects et décisions

Date : 2026-07-13

## Profils simulés

Douze situations ont servi à challenger le parcours : novice complet, propriétaire pressé, budget serré, priorité sécurité, priorité esthétique, recherche d'automatisation, bassin atypique, aucune mesure, projet complexe, utilisateur mobile, utilisateur clavier et prospect connaissant déjà un produit.

## Échecs les plus plausibles

1. **Le novice confond recommandation et garantie.** Une carte très affirmative peut faire croire que la pose et le prix sont acquis. Le niveau de certitude et le principal point à vérifier doivent être visibles.
2. **Le prospect sans mesure pense être bloqué.** Il doit obtenir une orientation, puis comprendre précisément ce que les mesures permettront d'affiner.
3. **Le prospect pressé abandonne l'accès direct.** Des cartes longues avant toute comparaison augmentent fortement le scroll mobile.
4. **Le budget serré interprète un total partiel comme un devis.** Aucun chiffrage ne doit apparaître si transport, pose ou option indispensable restent ambigus.
5. **Le bassin atypique est faussement normalisé.** Une forme libre ne doit pas devenir un rectangle ou produire une surface fictive.
6. **L'utilisateur clavier ne peut pas choisir un produit historique.** Les tuiles cliquables doivent être des contrôles natifs.
7. **La panne réseau crée une double demande.** La reprise doit utiliser le même dossier et la même référence.
8. **Le succès partiel déclenche un renvoi.** L'UI doit dire que Diskoov a bien reçu la demande même si l'email prospect manque.
9. **La preuve commerciale paraît fabriquée.** Note, volume, citation et lien Google doivent rester vérifiables ; aucun guide inexistant.
10. **Le vocabulaire trahit l'outil interne.** Les termes de tableur, moteur, qualification ou référence documentaire doivent être filtrés de toute sortie prospect.

## Idées rejetées

- Une couleur forte par famille : améliore le repérage en maquette, mais fragmente la marque et réduit la comparabilité.
- Un carrousel de produits : masque des options et crée une interaction supplémentaire.
- Des animations d'entrée sur chaque section : ajoutent du délai sans expliquer une décision.
- Des avis répétés à chaque étape : paraissent insistant et consomment l'espace utile.
- Un prix « à partir de » non sourcé : attire le clic mais crée une attente commerciale dangereuse.
- Un questionnaire plus long pour maximiser la qualification : augmente l'abandon ; demander tôt seulement les informations qui changent réellement la recommandation.

## Verdict provisoire

`GO sous conditions` après correction des bloqueurs techniques et recette finale. Les règles de prix non validées, la politique de données, l'envoi email réel et les tests appareils physiques restent des conditions externes. L'absence de ces validations ne doit jamais être transformée en GO implicite.

## Challenge final

La stratégie de prudence protège la confiance, mais peut rendre l'outil trop générique si chaque produit finit « à étudier ». La contrepartie nécessaire est une explication personnalisée et concrète : pourquoi la solution mérite l'étude, ce qu'elle apporte et quelle information permettra de trancher. Le formulaire doit qualifier sans exiger toutes les données avant d'avoir créé suffisamment de valeur.
