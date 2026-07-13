# Runbook de lancement

## 1. Préconditions

- Branche de release : `refonte/conseiller-diskoov-v2`.
- Réponses métier bloquantes enregistrées dans `validation-xavier` ou un document équivalent versionné.
- Politique de confidentialité et texte du formulaire validés.
- Responsables nommés pour recette, réception des leads et incident.

## 2. Variables

Vérifier sans exposer les valeurs :

- `RESEND_API_KEY`
- `KEY_DERIVATION_SECRET`
- `FROM_EMAIL`
- `INTERNAL_EMAIL`
- `PUBLIC_CONTACT_NAME`
- `PUBLIC_CONTACT_EMAIL`
- `CONTACT_PHONE`
- `CONTACT_LOC`
- `SITE_URL`
- `LOGO_URL`
- variables KV nécessaires à la déduplication

Le domaine de `FROM_EMAIL` doit être vérifié chez le fournisseur email. `KEY_DERIVATION_SECRET` doit être indépendant, aléatoire et conservé comme secret.

## 3. Preview

1. Déployer une preview depuis la branche autorisée.
2. Vérifier 200 pour HTML, CSS, JS, logo, image produit et `OPTIONS /api/send-email`.
3. Vérifier qu'un asset inexistant ne reçoit pas le document HTML.
4. Tester l'iframe depuis le domaine Diskoov prévu et son refus depuis une origine tierce.
5. Exécuter `CHECKLIST-QA.md` sans considérer les tests non réalisés comme réussis.

## 4. Test de lead contrôlé

Avec autorisation et données manifestement fictives :

1. Soumettre sans pièce jointe.
2. Confirmer réception interne, confirmation prospect et référence identique.
3. Soumettre avec une image ou un PDF valide inférieur à 3 Mio.
4. Provoquer un fichier invalide, un consentement absent et un doublon.
5. Simuler l'échec de la confirmation prospect sans renvoyer l'email interne.
6. Vérifier qu'aucune donnée personnelle ou base64 ne se retrouve dans URL, analytics, console et stockage persistant.

## 5. Mise en production

1. Noter le déploiement actuellement valide et sa procédure de restauration.
2. Promouvoir la preview validée, sans reconstruire depuis une autre branche.
3. Effectuer immédiatement un smoke test des assets, du parcours guidé, de l'accès direct et du formulaire.
4. Envoyer un unique lead synthétique de production autorisé.
5. Confirmer sa réception avec le responsable Diskoov.

## 6. Surveillance

- Surveiller statuts 4xx/5xx de `/api/send-email`, erreurs du fournisseur et ratio succès/tentatives.
- Déclencher une alerte après deux tests synthétiques consécutifs en échec.
- Proposer un seuil initial de 95 % de succès sur 15 minutes uniquement si le volume le rend pertinent ; Diskoov doit l'ajuster.
- Ne pas interpréter une absence de leads comme incident sans baseline de trafic.
- Ne jamais journaliser le payload, les coordonnées, commentaires ou pièces jointes.

## 7. Incident et rollback

1. Confirmer si l'échec touche l'interface, l'API, le fournisseur email ou la boîte interne.
2. Suspendre toute campagne qui envoie du trafic si les demandes sont perdues.
3. Restaurer le dernier déploiement validé.
4. Vérifier une demande synthétique contrôlée.
5. Identifier les dossiers potentiellement concernés grâce aux références non sensibles.
6. Documenter heure, impact, cause, correctif et action préventive.

## 8. Conditions de GO

Zéro bloqueur connu, tests automatisés propres, preview vérifiée, lead réel contrôlé, appareils physiques testés, règles et contenus signés, politique de données cohérente, monitoring et rollback attribués.

Sans test email réel, appareil physique ou validation juridique, le statut reste `GO sous conditions`, jamais `GO complet`.
