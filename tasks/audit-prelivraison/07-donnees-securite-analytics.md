# Audit donnees, securite, analytics et exploitation

Date : 2026-07-13

## Verdict

NO-GO technique avant correction des points `SEC-01` a `SEC-06`. Les controles serveur de base sont serieux (validation des champs, rate limiting, anti-doublon, origine autorisee, echappement HTML), mais la configuration de livraison, les pieces jointes et la minimisation locale comportent des risques concrets.

## Findings

### SEC-01 - BLOQUANT - Deploiement statique incomplet

- Ecran/fichier : `vercel.json`
- Scenario : deployer le depot avec la configuration actuelle, puis demander `advisor-v2.css`, `advisor-v2.js` ou une image produit.
- Preuve : la propriete legacy `builds` n'autorise que `api/**/*.ts`, `index.html`, `config.js` et `fonts/*.woff2`. Un `vercel build --yes` local lie au projet confirme que l'output statique contient uniquement ces fichiers ; CSS, scripts applicatifs, logo et images sont absents. Vercel precise que lorsqu'au moins un build est declare, seuls ses outputs sont inclus.
- Impact : interface non stylisee ou inutilisable, scripts et visuels absents en production.
- Recommandation : supprimer l'allowlist `builds`, laisser Vercel detecter les fichiers statiques et l'API, puis conserver un fallback SPA qui respecte les fichiers existants.
- Critere d'acceptation : un smoke test de preview obtient 200 pour HTML, CSS, JS, logo, image produit et API ; aucun asset ne retourne le HTML de fallback.
- Effort : S
- Confiance : forte
- Dependance Diskoov : aucune
- Source externe : https://vercel.com/docs/project-configuration/vercel-json

### SEC-02 - BLOQUANT - En-tete incompatible avec l'iframe WordPress

- Ecran/fichier : `vercel.json`, section Integration WordPress du `README.md`
- Scenario : integrer `configurateur.diskoov.fr` dans une page `diskoov.fr` via l'iframe recommandee.
- Preuve : `X-Frame-Options: SAMEORIGIN` n'autorise que la meme origine exacte, alors que le configurateur et WordPress sont sur deux sous-domaines. La CSP contient deja une liste `frame-ancestors` explicite.
- Impact : blocage possible de l'iframe selon le navigateur et perte totale du parcours.
- Recommandation : retirer `X-Frame-Options` et conserver `frame-ancestors 'self' https://diskoov.fr https://*.diskoov.fr` comme controle moderne.
- Critere d'acceptation : l'iframe fonctionne depuis `diskoov.fr` et reste bloquee depuis une origine non autorisee.
- Effort : S
- Confiance : forte
- Dependance Diskoov : confirmer les domaines d'integration definitifs.

### SEC-03 - BLOQUANT - PDF accepte mais trop volumineux pour Vercel

- Ecran/fichier : `index.html`, upload du plan
- Scenario : joindre un PDF de 4 Mo, taille actuellement acceptee, puis soumettre.
- Preuve : le base64 ajoute environ 33 %, soit environ 5,3 Mo avant meme le reste du JSON. La limite de requete Vercel Functions est 4,5 Mo.
- Impact : erreur 413 en amont de l'API et demande potentiellement perdue.
- Recommandation : limiter toute piece jointe preparee a 3 Mo maximum et tester la taille finale du payload avant l'envoi.
- Critere d'acceptation : le client refuse clairement un PDF superieur a 3 Mo ; un payload maximal reste sous 4,5 Mo ; l'erreur ne produit aucun faux succes.
- Effort : S
- Confiance : forte
- Dependance Diskoov : aucune
- Source externe : https://vercel.com/docs/functions/limitations

### SEC-04 - IMPORTANT - Consentement principal non verifie par l'API

- Ecran/fichier : `index.html`, `api/send-email.ts`
- Scenario : appeler directement l'API avec un payload valide sans avoir coche le consentement principal.
- Preuve : le client exige `S.ok`, mais le payload et l'interface `LeadPayload` ne contiennent que `consentement_relances`. L'API n'exige donc pas le choix principal.
- Impact : contournement de la regle affichee et preuve de consentement incoherente.
- Recommandation : transmettre `consentement_demande: true` et l'exiger cote serveur. Faire valider separement par le conseil juridique la base legale et le texte affiche.
- Critere d'acceptation : l'API retourne 400 si la valeur n'est pas strictement `true` et accepte le meme payload lorsqu'elle vaut `true`.
- Effort : S
- Confiance : forte sur la coherence technique, moyenne sur la formulation juridique
- Dependance Diskoov : validation juridique du texte et de la duree de conservation.

### SEC-05 - IMPORTANT - Stockage local plus large que necessaire

- Ecran/fichier : `index.html`, cles `dk_last_lead` et `dk_pending_leads`
- Scenario : soumettre avec coordonnees et photo, ou subir une panne reseau.
- Preuve : `dk_last_lead` recoit le payload complet en session, y compris commentaire et base64. Le premier essai de `dk_pending_leads` conserve aussi le payload complet en localStorage ; la piece jointe n'est retiree qu'en cas de quota depasse.
- Impact : exposition locale inutile de donnees personnelles et d'une photo du domicile ; risque de quota et reprise non transparente.
- Recommandation : ne conserver dans `dk_last_lead` que les champs de contact necessaires a la saisie redondante. Toujours retirer le binaire des retries persistants, signaler au commercial qu'une piece devra etre redemandee et supprimer les entrees apres 48 h.
- Critere d'acceptation : aucune chaine `data:*;base64` dans sessionStorage/localStorage ; le dernier contact ne contient que les champs explicitement reutilises ; le retry expire et reste exploitable.
- Effort : M
- Confiance : forte
- Dependance Diskoov : arbitrer conservation automatique du lead en echec reseau contre minimisation.

### SEC-06 - IMPORTANT - Validation de fichier fondee sur l'extension

- Ecran/fichier : `api/send-email.ts`
- Scenario : envoyer des octets arbitraires encodes en base64 avec un nom finissant par `.jpg`.
- Preuve : l'API teste seulement l'extension puis appelle `Buffer.from(..., 'base64')`; elle ne controle ni MIME, ni signature, ni taille decodee, ni coherence extension/contenu.
- Impact : piece jointe corrompue ou contenu inattendu envoye au commercial ; consommation memoire inutile.
- Recommandation : exiger un data URL autorise, verifier MIME, extension, base64 canonique, signature magique et taille decodee <= 3 Mo ; rejeter le payload invalide avant l'email.
- Critere d'acceptation : JPG, PNG, WebP et PDF valides passent ; extension usurpee, base64 invalide, signature invalide et fichier trop grand retournent 400.
- Effort : M
- Confiance : forte
- Dependance Diskoov : aucune

### SEC-07 - IMPORTANT - Ressources publiques annoncees absentes

- Ecran/fichier : `index.html`, `api/send-email.ts`, `.env.example`
- Scenario : partager le configurateur ou recevoir un email avec la configuration par defaut.
- Preuve : `/og-configurateur.jpg` et `/logo-diskoov.png` n'existent pas. Le logo reel est `assets/marque/logo-diskoov-bleu-orange.png`.
- Impact : apercu social sans image et logo casse dans les emails.
- Recommandation : pointer les metadonnees et l'email vers des assets reels et deployes ; ajouter un test d'existence.
- Critere d'acceptation : les deux URL publiques retournent une image et aucun meta tag ne reference un fichier absent.
- Effort : S
- Confiance : forte
- Dependance Diskoov : aucune

### SEC-08 - IMPORTANT - Dependance de production vulnerable

- Ecran/fichier : `package-lock.json`
- Scenario : lancer `npm audit --omit=dev --audit-level=high`.
- Preuve : une vulnerabilite haute transitive `js-cookie <= 3.0.5` est remontee via `resend`; npm propose `3.0.8`.
- Impact : dette securite et controle de livraison en echec, meme si le chemin vulnerable n'est pas appele directement par l'application.
- Recommandation : appliquer le correctif lockfile non cassant, mettre a jour `@vercel/node` separement si les types et le build restent propres, puis relancer l'audit complet.
- Critere d'acceptation : zero vulnerabilite haute/critique sur les dependances de production ; les vulnerabilites de dev restantes sont documentees ou corrigees.
- Effort : S a M
- Confiance : forte
- Dependance Diskoov : aucune

### SEC-09 - MINEUR - Garde analytics implicite

- Ecran/fichier : `index.html`, fonction `track`
- Scenario : un script hote cree `window.dataLayer` avant le choix du bandeau local.
- Preuve : `track` pousse des evenements des que `dataLayer` existe, sans relire `dk_cookie_consent`.
- Impact : emission possible d'evenements avant consentement dans une integration future ou mal configuree.
- Recommandation : rendre le consentement `accepted` obligatoire dans `track` et documenter que les evenements pre-consentement sont abandonnes.
- Critere d'acceptation : aucune entree analytics avant acceptation ; aucun parametre ne contient nom, email, telephone, ville, code postal, commentaire ou nom de fichier.
- Effort : S
- Confiance : moyenne
- Dependance Diskoov : choix de l'outil analytics et validation juridique.

### SEC-10 - IMPORTANT - Exploitation sans alerte de perte de leads

- Ecran/fichier : documentation de livraison
- Scenario : Resend ou les variables d'environnement echouent plusieurs heures.
- Preuve : aucune alerte, aucun tableau de reception ni procedure de smoke test/rollback n'est defini dans le depot.
- Impact : pertes de demandes invisibles et diagnostic tardif.
- Recommandation : appliquer le runbook ci-dessous et nommer un responsable de surveillance.
- Critere d'acceptation : un test synthetique controle, un seuil d'alerte, un canal d'escalade et un rollback sont attribues.
- Effort : M
- Confiance : forte
- Dependance Diskoov : responsables et outils de monitoring.

## Plan analytics sans PII

Consentement requis pour tous les evenements. Proprietes interdites : nom, email, telephone, adresse, ville, code postal, departement si la volumetrie est faible, texte libre, nom de fichier et URL contenant des parametres personnels.

| Evenement | Proprietes autorisees | Objectif |
|---|---|---|
| `advisor_view` | `mode`, `viewport_group` | Entrees |
| `advisor_start` | `mode` | Demarrages |
| `advisor_step_complete` | `step`, `mode` | Friction par etape |
| `advisor_results_view` | `mode`, `dimensions_known`, `result_count` | Resultats utiles |
| `advisor_family_view` | `family`, `source` | Interet famille |
| `advisor_product_view` | `product`, `source` | Interet produit |
| `quote_start` | `product`, `mode` | Passage au devis |
| `attachment_added` | `kind`, `size_bucket` | Valeur de la photo |
| `lead_submit` | `product`, `mode`, `qualification_complete` | Tentatives |
| `lead_success` | `product`, `mode`, `retry` | Conversion |
| `lead_error` | `stage`, `status_bucket` | Fiabilite |

Les UTM peuvent etre conserves uniquement apres allowlist de `utm_source`, `utm_medium` et `utm_campaign`, longueur bornee et sans les transmettre a des outils avant consentement.

## Checklist donnees personnelles

- [ ] Base legale, texte du consentement et retention de 3 ans valides par la personne competente.
- [ ] Politique de confidentialite accessible et coherente avec les champs reels.
- [ ] Coordonnees de contact pour les droits confirmees.
- [ ] Aucun binaire persistant dans le navigateur.
- [ ] TTL de 48 h teste pour les retries.
- [ ] Aucun PII dans analytics, URL, console ou sujet d'erreur.
- [ ] Acces Resend, Vercel et boite interne limites aux personnes necessaires.
- [ ] Procedure d'effacement/export des demandes definie hors application.

## Runbook production

1. Verifier `RESEND_API_KEY`, `FROM_EMAIL`, `INTERNAL_EMAIL`, `PUBLIC_CONTACT_NAME`, `PUBLIC_CONTACT_EMAIL`, `CONTACT_PHONE`, `SITE_URL`, `LOGO_URL`, les origines et le stockage KV.
2. Deployer d'abord une preview depuis `refonte/conseiller-diskoov-v2`.
3. Smoke test : HTML, CSS, JS, logo, image, API OPTIONS, API 400 sans consentement, parcours guide/direct, formulaire sans soumission reelle.
4. Avec autorisation, envoyer un lead fictif identifie vers une boite controlee, avec puis sans piece jointe <= 3 Mo.
5. Confirmer email interne, email prospect, contenu, reference, piece jointe et absence de faux succes.
6. Surveiller les statuts 4xx/5xx de `/api/send-email`, les erreurs Resend et le taux `lead_success / lead_submit`.
7. Alerter si deux tests synthetiques consecutifs echouent, si le taux de succes tombe sous 95 % sur 15 minutes ou si aucune demande n'arrive pendant une periode habituellement active. Diskoov doit confirmer ces seuils selon sa volumetrie.
8. Rollback : restaurer le dernier deploiement Vercel valide, desactiver le webhook optionnel, verifier la reception, puis documenter l'incident.

## Validations humaines requises

- Validation juridique : base legale, wording, retention, cookies et politique.
- Validation Diskoov : domaines iframe, boite interne, contact public, seuils d'alerte et responsable.
- Validation production : une preview Vercel liee, une boite email controlee et un test de piece jointe.

## Challenge de l'audit

- Exiger le consentement cote serveur est coherent avec l'interface actuelle, mais la bonne base legale pourrait etre l'execution de mesures precontractuelles plutot que le consentement. Le correctif ne doit pas figer une analyse juridique non validee.
- Retirer les pieces jointes du stockage persistant reduit le risque local mais peut diminuer la qualite d'un lead recupere apres panne. Le commercial doit etre averti qu'il faut redemander le fichier.
- Supprimer `X-Frame-Options` reduit une protection historique, mais la CSP `frame-ancestors` est plus precise et necessaire a l'iframe inter-sous-domaines. La liste des domaines doit rester minimale.
- Mettre a jour toutes les dependances majeures en une seule fois augmenterait inutilement le risque. Seuls les correctifs prouvables et testes doivent entrer dans ce lot.
- Les seuils d'alerte proposes sont des points de depart, pas des chiffres metier valides ; une faible volumetrie peut rendre 95 % peu interpretable.
