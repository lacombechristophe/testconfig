# QA finale exécutée

Date : 2026-07-13

## Verdict

**GO pour une preview client. GO production sous conditions externes.**

La refonte ne présente plus de bloqueur connu dans le code, le build ou les parcours testés. Une mise en production ne doit cependant pas être déclarée complète sans test des emails réels, appareils physiques, iframe sur le vrai domaine, validation juridique et réponses métier encore ouvertes.

## Preuves techniques

- Branche vérifiée : `refonte/conseiller-diskoov-v2`.
- Tests : **156 réussis sur 156**, aucun échec ou test ignoré.
- `npm run typecheck` : réussi.
- `node --check` : réussi pour les quatre scripts client.
- `npm audit --audit-level=high` : **0 vulnérabilité**, dépendances de production et de développement.
- `vercel build --yes` : réussi avec Node 24 ; fonction `api/send-email` présente.
- Artefact public limité à HTML, CSS, scripts, polices et images.
- Audits, tests, règles, fichiers Xavier, archives et ancien guide exclus du build public.
- 19 références d'assets contrôlées, aucune absente.
- HTML, CSS, JS, logo et image principale en HTTP 200 ; asset fictif en 404.
- Recherche de secret réel : aucun résultat.
- `git diff --check` : réussi.

## QA navigateur

Tailles contrôlées :

- 1440 × 900 ;
- 1280 × 800 ;
- 1024 × 768 ;
- seuils 961 et 960 px ;
- 768 × 1024 et 720 × 900 ;
- 390 × 844 et 320 × 568 ;
- 568 × 320 en paysage.

Pour chaque taille : aucun débordement horizontal, CTA principal entièrement visible et cliquable. Les cartes produit mobiles, le footer fixe et les sources d'image ont été contrôlés par mesure et capture.

Parcours rejoués :

1. accueil puis accès direct, famille, modèle et configurateur ;
2. conseil guidé avec deux priorités, rectangle et ovale, dimensions connues ;
3. résultat à une solution et résultat à trois solutions ;
4. comparatif mobile avec cinq critères par produit ;
5. visionneuse, fermeture par `Escape` et retour du focus ;
6. transfert vers Volet hors-sol avec forme et dimensions conservées ;
7. validation email invalide puis valide, consentement et CTA ;
8. photo présentée comme facultative avec bénéfice concret.

Le transfert final conserve `Rectangle`, `8 × 4 m` et `Volet hors-sol`, n'affiche plus l'alerte héritée d'Oré Compact et utilise `Votre projet · À compléter` au lieu d'un faux prix.

## Audit Lighthouse local

Résultats sur le serveur local non compressé :

| Catégorie | Score |
|---|---:|
| Accessibilité | 100 |
| Bonnes pratiques | 100 |
| SEO | 100 |
| Performance | 70 |

Le visuel initial a été rendu responsive : 80 Kio sur le profil Lighthouse au lieu de 303 Kio. La haute définition de la visionneuse ne se charge plus avant un clic. Le poids initial mesuré est passé d'environ 1,1 Mio à 815 Kio et le LCP simulé de 7,1 s à 5,7 s.

Le score performance n'est pas un score de production : le serveur Python local répond en HTTP/1.0 sans compression, alors que Vercel compresse les ressources. Un Lighthouse doit être refait sur la preview Vercel ; cible recommandée : au moins 85 sans régression des trois scores à 100.

## Règles et contenu

- Les 34 fichiers de `Documentations règles` ont été inventoriés et consolidés.
- Oré et la bâche à barres sont les seules familles autorisées à produire une estimation dans un cas complet documenté ; l'escalier ou une combinaison hors grille replace la bâche à barres sur étude.
- BAB avec escalier, volets, abris, Coverseal, Eden et MasterDeck restent protégés par des états sur devis ou étude lorsque nécessaire.
- Aucun terme interne interdit n'est présent dans les textes affichés.
- Le faux guide public est absent du parcours et du build.
- La durée de conservation non validée n'est plus affirmée dans l'interface.
- La note Google, son volume et la citation restent centralisés et datés pour recette.

## Conditions encore non validées

Ces points nécessitent un environnement, une décision ou une personne externe et ne sont pas remplacés par un test automatisé :

1. test d'un lead fictif autorisé avec les vraies variables Vercel et réception des deux emails ;
2. SPF, DKIM, DMARC et expéditeur Resend vérifiés ;
3. iframe testée sur `diskoov.fr` et refusée depuis une origine tierce ;
4. recette Safari sur iPhone et Chrome sur Android physiques ;
5. contrôle Google le jour de la recette et autorisation d'utiliser la citation ;
6. validation de la politique de confidentialité et de la durée de conservation ;
7. réponses écrites aux règles listées dans `QUESTIONS-XAVIER.md` ;
8. responsable du monitoring, seuil d'alerte et rollback attribués.

## Challenge final des décisions

1. **Besoin avant produit.** Cela aide le novice mais peut frustrer l'acheteur déjà informé. L'accès direct reste donc disponible, visuellement secondaire sur l'accueil mais évident ensuite.
2. **Une recommandation principale.** Cela réduit la charge de décision, mais un classement trop affirmatif serait trompeur. Les cas incertains utilisent `à étudier` et les alternatives non classées sont séparées.
3. **Prix conservateurs.** Le sur devis peut réduire les leads centrés budget. Afficher un total incomplet serait néanmoins pire pour la confiance, la marge et le commercial ; les informations qui permettent le devis restent explicites.
4. **Preuve Google sur l'accueil.** Elle rassure, mais devient une fausse preuve si la note, le volume ou la citation changent. La recette du jour du lancement est obligatoire.
5. **Palette unifiée.** Elle renforce Diskoov, mais peut rendre les familles moins distinctes. Les photos, icônes, libellés de fonctionnement et contraintes portent la différence sans palette arc-en-ciel.
6. **Animations courtes.** Elles modernisent les changements d'état sans ralentir la lecture. Davantage d'animation détournerait de la comparaison et dégraderait les petits appareils ; `prefers-reduced-motion` reste respecté.
7. **Résumé avant configurateur.** Il confirme le choix et la prochaine étape, mais prend de la hauteur sur mobile. Il a été réduit aux éléments utiles et ne doit pas redevenir une répétition complète du résultat.
8. **Pas de nouvelle chaîne de minification dans ce lot.** Une build chain ajoutée en fin de recette augmenterait le risque de casser l'API et le HTML monolithique. La source responsive apporte le gain sûr ; la minification devra être évaluée séparément sur une preview mesurée.
9. **Données locales minimales.** Cela protège les coordonnées et les pièces jointes, mais une panne peut obliger à redemander la photo. Cette perte contrôlée est préférable à la persistance d'un binaire sensible dans le navigateur.

## Conclusion

Le produit est abouti pour une présentation et une recette client. Il ne reste pas un lot caché de polish UI à appliquer avant la preview. Les prochaines actions utiles sont les validations de production ci-dessus et des tests avec de vrais prospects ; ajouter davantage de texte, badges, couleurs ou animations sans mesure serait désormais contre-productif.
