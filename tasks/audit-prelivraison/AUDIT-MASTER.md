# Audit pré-livraison du conseiller Diskoov

Date : 2026-07-13

## Résumé franc

Le conseiller est devenu une expérience crédible : la proposition de valeur est compréhensible, le mode guidé et l'accès direct répondent à deux profils, les produits disposent de vrais visuels et la preuve Google est vérifiable. La structure commerciale peut donner envie de demander un devis sans forcer.

Ce qui empêchait une livraison sérieuse était moins visible : déploiement Vercel incomplet, règles tarifaires parfois plus affirmatives que les sources, reprise de lead fragile, confiance excessive accordée au payload client, incohérences responsive/clavier et rupture visuelle entre conseiller et configurateur. Ces sujets sont P0/P1. Les ajouts décoratifs ne le sont pas.

## Décision

**GO sous conditions après intégration et QA.** Le code peut être rendu prêt pour une preview client. La mise en production reste conditionnée à : validation écrite des règles ambiguës, politique de confidentialité adaptée, test réel des emails, recette iPhone/Android et attribution du monitoring.

## Priorités

### P0 avant livraison technique

| ID | Action | Critère de sortie |
|---|---|---|
| P0-01 | Corriger la livraison Vercel des assets et l'iframe | HTML, CSS, JS, logo et image en 200 ; iframe autorisée seulement sur les domaines prévus |
| P0-02 | Durcir `/api/send-email` | Allowlist produits, consentement, fichier <= 3 Mio, déduplication et référence serveur testés |
| P0-03 | Fiabiliser l'outbox | Aucun binaire persistant, suppression après 2xx, TTL 48 h, même dossier au retry |
| P0-04 | Neutraliser les prix non validés | Volets/abris sur devis ; BAB avec escalier sur devis ; Oré uniquement si cas complet |
| P0-05 | Éliminer les faux succès | État partiel explicite si seule la confirmation prospect échoue |

### P1 avant mise en production

| ID | Action | Critère de sortie |
|---|---|---|
| P1-01 | Reprise complète du contexte | Mode, bassin, priorités et produit restaurés sans PII inutile |
| P1-02 | Accessibilité des choix et modales | Clavier, focus, `Escape`, erreurs ARIA et cibles mobiles validés |
| P1-03 | Accès direct et comparaison mobile | Cartes compactes, cinq critères visibles, pas de scroll artificiellement long |
| P1-04 | Harmoniser le design | Tokens Diskoov communs, composants et états cohérents, aucune couleur arbitraire |
| P1-05 | Nettoyer la copy | Aucun jargon interne ni promesse non sourcée dans l'interface prospect |
| P1-06 | Performance initiale | Images historiques différées, ratios réservés et cache des assets vérifié |

### P2 après lancement mesuré

- Tester le wording des deux CTA d'entrée sur le taux de démarrage, sans changer simultanément la mise en page.
- Mesurer la consultation des détails, l'ajout de photo et les abandons par étape après consentement.
- Conduire cinq tests utilisateurs non experts avant d'allonger le questionnaire.
- Ajuster l'ordre des alternatives à partir des demandes qualifiées et des ventes réelles, jamais uniquement des clics.

## Écran par écran

### Accueil

Conserver l'image réelle, la promesse simple, le choix guidé/direct, les trois étapes et la preuve Google. Ne pas recréer le guide inexistant ni multiplier les badges.

### Questions

Montrer l'utilité de chaque réponse, rendre l'inconnu légitime et ne pas prétendre classer selon des priorités absentes.

### Résultats

Présenter une recommandation expliquée et deux alternatives. Montrer bénéfice, contrainte et certitude. Garder les cinq critères sur mobile.

### Accès direct

Réduire la hauteur initiale des cartes et ouvrir la technique à la demande. Préserver un retour évident vers le conseil guidé.

### Configurateur

Aligner palette et composants avec le conseiller, corriger les choix clavier, masquer les options commerciales non validées et conduire vers la première information réellement manquante.

### Devis et succès

Expliquer l'intérêt de la photo, empêcher le double envoi, utiliser la référence serveur et distinguer réception de la demande et envoi de la confirmation.

## Produit par produit

- **Oré** : vendre l'automatisation et la protection basse ; demander explicitement alimentation et situation de filtration avant toute estimation.
- **BAB** : vendre la simplicité et la polyvalence ; ne pas publier de garantie contradictoire ni calculer un escalier non documenté.
- **Volets** : vendre le confort et l'intégration ; garder le prix sur devis jusqu'à validation de toutes les composantes.
- **Abris** : vendre la protection physique et le prolongement d'usage ; nuancer formalités, encombrement et transport.
- **Coverseal/Eden** : alternatives à étudier, sans compatibilité ni prix implicites.
- **MasterDeck** : vendre l'espace récupéré, mais qualifier structure, dégagement et géométrie sur mesure.

## Éléments explicitement rejetés

- palette différente et saturée par famille ;
- carrousel produit ;
- animations décoratives continues ;
- avis Google répétés à chaque écran ;
- promesses de délai, pose, garantie ou prix non validées ;
- questionnaire long avant d'avoir montré une recommandation ;
- nouveau framework de composants pour ce lot.

## Challenge des décisions

1. **Masquer les prix non validés** protège la confiance mais peut réduire les leads très orientés budget. Compensation : expliquer ce qui permet le chiffrage et demander l'information utile au bon moment.
2. **Cartes plus compactes** améliorent la comparaison mais risquent de minimiser les contraintes. La contrainte principale reste visible, les détails secondaires sont repliés.
3. **Une palette unifiée** renforce la marque mais peut réduire la distinction des familles. Les photos, icônes et bénéfices assurent cette distinction.
4. **Un état partiel d'email** évite les doublons mais peut inquiéter. Le message doit confirmer clairement la réception par Diskoov avant de parler de la confirmation absente.
5. **La reprise locale minimale** protège les données mais récupère moins d'informations après une panne longue. Elle doit conserver le dossier utile sans photo ni texte sensible superflu.
6. **L'analytics soumis au consentement** réduit le volume mesuré. Il évite en contrepartie une instrumentation incompatible avec le choix du visiteur et empêche les PII de fuiter.

## Livrables associés

- `00-baseline.md`
- `01-regles-metier.md`
- `02-ux-parcours.md`
- `03-design-ui-motion.md`
- `04-commercial-copy-conversion.md`
- `05-leads-e2e.md`
- `06-accessibilite-responsive-performance.md`
- `07-donnees-securite-analytics.md`
- `08-red-team-prospects.md`
- `09-qa-finale.md`
- `DECISIONS.md`
- `QUESTIONS-XAVIER.md`
- `CHECKLIST-QA.md`
- `RUNBOOK-LANCEMENT.md`
