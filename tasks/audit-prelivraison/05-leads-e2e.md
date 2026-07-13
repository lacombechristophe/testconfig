# Audit du lead de bout en bout

Date : 2026-07-13

## Flux attendu

`Interface -> validation client -> payload minimal -> validation API -> email interne -> email prospect -> réponse API -> confirmation UI`

Une demande doit posséder un `dossier_id` stable créé côté client et une référence stable attribuée par le serveur. Un nouvel essai réseau du même dossier ne doit ni créer une nouvelle référence ni renvoyer un doublon au commercial.

## Risques identifiés

### LEAD-01 - Bloquant - Données commerciales déclaratives

L'API acceptait des libellés, prix, statuts, références et conclusions techniques fournis par le client. Elle doit reconstruire les couples famille/produit depuis une allowlist et traiter les informations commerciales comme non fiables.

### LEAD-02 - Bloquant - Reprise pouvant perdre ou dupliquer

La file locale retirait une demande avant de connaître le résultat réseau. L'outbox doit conserver l'entrée jusqu'à un 2xx, réutiliser le même identifiant, expirer après 48 h et ne jamais persister le binaire.

### LEAD-03 - Important - Références divergentes

La référence affichée au prospect et celle reçue par email pouvaient différer. Le serveur devient l'autorité et renvoie la référence à l'UI dans tous les états exploitables.

### LEAD-04 - Important - Succès partiel mal représenté

Si l'email interne part mais la confirmation prospect échoue, renvoyer une erreur globale pousserait à soumettre de nouveau. L'API doit retourner un état `partial` avec la même référence ; l'UI confirme la réception et précise que l'email de confirmation n'a pas pu être envoyé.

### LEAD-05 - Important - Forme libre rejetée

Le client peut légitimement envoyer une forme libre sans dimensions. L'API doit accepter cette inconnue uniquement pour la forme libre ; rectangle et ovale gardent des dimensions obligatoires lorsque le cas exige un calcul.

### LEAD-06 - Important - Pièce jointe

La limite finale est 3 Mio décodés. Le client et l'API doivent vérifier type, extension, base64 canonique, signature magique et taille. Les formats autorisés sont JPG, PNG, WebP et PDF.

## Payload minimal utile au commercial

- dossier, date et provenance du parcours ;
- famille et produit canoniques ;
- priorités exprimées ;
- forme, dimensions connues ou inconnues ;
- contraintes utiles au produit ;
- informations manquantes à vérifier ;
- coordonnées, préférence de contact et consentements ;
- commentaire libre ;
- pièce jointe valide, lorsqu'elle est fournie.

Les prix, références documentaires, règles internes, scores de recommandation et conclusions de compatibilité calculées côté client ne sont pas des données de confiance.

## Matrice de tests

| Cas | Résultat attendu |
|---|---|
| Sans pièce jointe | Un email interne, confirmation prospect, référence identique |
| JPG/PNG/WebP/PDF valide <= 3 Mio | Accepté et joint |
| Faux type, signature invalide ou > 3 Mio | 400 avant envoi |
| Double clic | Un seul envoi en cours |
| Même `dossier_id` répété | Dédupliqué, même référence |
| Timeout avant réponse | Entrée conservée dans l'outbox, aucun faux succès |
| 4xx de validation | Erreur actionnable, pas de retry automatique infini |
| 5xx / réseau | Retry borné, sans binaire persistant |
| Interne réussi, prospect échoué | État partiel, demande confirmée, pas de renvoi interne |
| Consentement principal absent | 400 |
| Honeypot rempli | Rejet silencieux ou réponse anti-spam définie, aucun email |

## Tests nécessitant un environnement contrôlé

- réception réelle dans la boîte Diskoov ;
- rendu des deux emails sur Gmail, Outlook et mobile ;
- domaine d'envoi, SPF, DKIM et DMARC ;
- pièce jointe proche de 3 Mio sur Vercel ;
- panne Resend et reprise KV ;
- monitoring et alerte de perte de leads.

## Challenge

Une déduplication forte peut bloquer une correction volontaire si le client réutilise le même dossier après avoir changé ses coordonnées. L'identifiant doit représenter une soumission logique et être renouvelé uniquement lorsqu'une nouvelle demande est explicitement commencée. La file locale protège contre une panne courte, mais ne doit pas se transformer en stockage durable de données personnelles.
