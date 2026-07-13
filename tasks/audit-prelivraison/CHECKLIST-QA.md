# Checklist QA finale

Cette checklist doit être remplie sur une preview de la branche `refonte/conseiller-diskoov-v2`. Une case non testée reste non cochée.

Les contrôles locaux déjà exécutés et leurs preuves sont consignés dans `09-qa-finale.md`. Les cases restent volontairement vierges afin que la recette de la preview soit réalisée par l'équipe de lancement, notamment pour les emails, appareils physiques, domaines et validations Diskoov.

## Dépôt et build

- [ ] Branche correcte, aucune modification étrangère au lot.
- [ ] `npm test` passe intégralement.
- [ ] `npm run typecheck` passe.
- [ ] `node --check` passe sur les scripts client.
- [ ] `npm audit --omit=dev --audit-level=high` ne remonte aucun high/critical non accepté.
- [ ] `vercel build --yes` contient HTML, CSS, JS, logo et images.
- [ ] Aucun secret ou webhook public n'est présent dans le client ou le dépôt.

## Assets et intégration

- [ ] L'URL HTML, le CSS, les scripts, le logo et une image produit répondent 200.
- [ ] Un asset absent retourne 404, pas l'HTML du fallback.
- [ ] L'iframe fonctionne depuis chaque domaine Diskoov autorisé.
- [ ] Une origine tierce ne peut pas embarquer le configurateur.
- [ ] L'image Open Graph existe et possède un ratio adapté au partage.

## Parcours guidé

- [ ] Accueil compris en cinq secondes, CTA guidé et direct distincts.
- [ ] Aucune priorité sélectionnée produit un résultat au wording neutre.
- [ ] Une, deux et trois priorités donnent un feedback clair.
- [ ] Rectangle, ovale et forme libre fonctionnent.
- [ ] Dimensions connues, inconnues, minimales et maximales sont testées.
- [ ] Retour, modification et recommencement conservent un état cohérent.
- [ ] Les résultats expliquent bénéfice, contrainte et certitude.
- [ ] Les cinq critères de comparaison restent disponibles sur mobile.

## Accès direct et produits

- [ ] Toutes les familles et tous les produits s'ouvrent.
- [ ] Les détails se déplient/replient et annoncent leur état.
- [ ] Le retour reprend la bonne position et le bon produit.
- [ ] Les images conservent leur ratio et leur netteté.
- [ ] Aucun prix, coloris, garantie, pose ou délai non validé n'est affiché.
- [ ] Volets et abris restent sur devis tant que les validations manquent.
- [ ] BAB avec escalier ambigu reste sur devis.
- [ ] Oré ne chiffre pas sans alimentation et décisions indispensables.

## Formulaire et lead

- [ ] Le premier champ manquant est annoncé et peut recevoir le focus.
- [ ] Email, téléphone, code postal et consentements invalides sont rejetés clairement.
- [ ] Les erreurs sont reliées aux champs et annoncées.
- [ ] Double clic, touche Entrée répétée et navigation pendant l'envoi ne doublonnent pas.
- [ ] JPG, PNG, WebP et PDF valides <= 3 Mio passent.
- [ ] Mauvais type, fausse extension, base64 invalide et fichier > 3 Mio échouent.
- [ ] Aucune pièce jointe base64 n'est dans localStorage/sessionStorage.
- [ ] Un retry conserve le même dossier et la même référence.
- [ ] L'outbox garde l'entrée jusqu'à un 2xx et expire après 48 h.
- [ ] L'état partiel confirme la réception interne sans proposer de renvoi.
- [ ] Le succès affiche la référence renvoyée par le serveur.

## Accessibilité

- [ ] Tout le parcours est réalisable au clavier seul.
- [ ] Focus visible et ordre logique sur chaque écran.
- [ ] Les groupes de choix ont un nom accessible et les flèches fonctionnent si attendues.
- [ ] Modales : focus piégé, fond inert, `Escape`, retour au déclencheur.
- [ ] Titres et régions forment une structure logique.
- [ ] Contrastes texte, focus, sélection, erreur et désactivé sont conformes.
- [ ] Les cibles mobiles interactives font au moins 44 × 44 px.
- [ ] `prefers-reduced-motion` supprime les transitions non nécessaires.
- [ ] Zoom 200 % sans perte de contenu ni scroll horizontal global.

## Responsive et navigateurs

- [ ] 1440 × 900 Chrome/Edge.
- [ ] 1280 × 800 Chrome/Edge.
- [ ] 1024 × 768 et limites 961/960.
- [ ] 768 × 1024 et 720 px.
- [ ] 390 × 844 et 320 × 568.
- [ ] 568 × 320 paysage avec clavier/formulaire.
- [ ] Safari iPhone réel.
- [ ] Chrome Android réel.
- [ ] Aucun footer, CTA, texte ou image ne recouvre un autre élément.

## Contenu et conversion

- [ ] Aucun terme interne : Xavier, Excel, grille, moteur tarifaire, qualification, référence interne, règle simplifiée.
- [ ] Aucun guide ou preuve inexistant.
- [ ] La note Google et son lien sont vérifiés le jour de la recette.
- [ ] L'intérêt de joindre une photo est concret et la photo reste facultative.
- [ ] Pose incluse uniquement lorsqu'elle est vraie pour le cas affiché.
- [ ] Les formalités d'urbanisme sont formulées comme une vérification locale, pas une certitude.
- [ ] Les CTA décrivent la prochaine action réelle.

## Production

- [ ] Variables Vercel de preview et production vérifiées.
- [ ] Test email fictif autorisé reçu en interne et côté prospect.
- [ ] SPF, DKIM, DMARC et expéditeur validés.
- [ ] Monitoring, seuil, canal d'alerte et responsable nommés.
- [ ] Rollback vers le dernier déploiement valide testé/documenté.
- [ ] Politique de confidentialité et durée de conservation validées.
- [ ] Recette Diskoov signée avec les exceptions explicites.
