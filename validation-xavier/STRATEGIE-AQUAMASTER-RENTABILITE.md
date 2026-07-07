# Stratégie recommandée pour le catalogue AquaMaster

## Décision recommandée

Ne pas utiliser le catalogue AquaMaster brut comme prix prospect, sauf validation explicite de Xavier.

Le rôle recommandé est :

1. **Prix affiché au prospect** : fichiers Excel Diskoov, quand la méthode commerciale est complète.
2. **Limites techniques** : catalogue AquaMaster, car il donne les gammes, cordes, modules, références et dépendances d'options.
3. **Rentabilité interne Xavier** : catalogue AquaMaster / colonnes d'achat / prix publics fournisseur, uniquement dans l'e-mail interne ou un futur back-office.
4. **Donnée contradictoire ou incomplète** : affichage prospect en `sur devis`, sans extrapolation.

## Pourquoi

Les sources montrent deux logiques différentes :

- les feuilles de simulation vendent au client avec des remises commerciales, pose et transport ;
- les tables fournisseur contiennent aussi des bases d'achat, marges, prix publics et options techniques.

Mélanger ces deux usages dans le configurateur créerait un risque de faux prix client ou de marge exposée indirectement.

## Ce qu'il faut demander à Xavier

1. Le catalogue AquaMaster est-il une base fournisseur/pro, un prix public client, ou les deux selon les gammes ?
2. Les prix prospect doivent-ils toujours venir des fichiers Excel Diskoov lorsqu'ils existent ?
3. Les colonnes `ACHAT`, `PA HT`, `Marge` et remises fournisseur doivent-elles être utilisées uniquement pour une rentabilité interne ?
4. Faut-il afficher un prix automatique pour Master 50 et Mi-haut, ou les laisser sur devis tant que la règle commerciale n'est pas validée ?
5. Si un prix Excel diffère du catalogue AquaMaster, quelle source gagne pour le prospect ?

## Règle d'intégration actuelle

Le moteur sépare maintenant :

- `abriCommercial` : prix et remises issus des classeurs Excel Diskoov ;
- `abriCatalog` / `abriTechnical` : contraintes techniques issues du catalogue AquaMaster.

Cette séparation doit rester stricte : aucune donnée de rentabilité fournisseur ne doit apparaître côté prospect.
