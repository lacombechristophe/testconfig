# Conseiller et configurateur Diskoov

Application statique avec une fonction Vercel pour :

- guider un prospect à partir de ses priorités et de sa piscine ;
- comparer les familles de protections Diskoov ;
- ouvrir directement un produit pour un visiteur qui sait déjà ce qu'il cherche ;
- préparer une demande de devis qualifiée sans afficher les règles internes ;
- envoyer la demande à Diskoov et une confirmation au prospect.

La branche de travail client est `refonte/conseiller-diskoov-v2`.

## Prérequis

- Node.js 24.x ;
- npm ;
- Vercel CLI pour reproduire le build de déploiement.

```powershell
npm install
npm test
npm run typecheck
npx vercel@latest build --yes
```

Pour une vérification visuelle statique, servir la racine puis ouvrir :

```text
http://127.0.0.1:5179/index.html?advisor=1
```

## Structure utile

| Chemin | Rôle |
|---|---|
| `index.html` | Configurateur, formulaire et orchestration du lead |
| `advisor-v2.js` | Parcours guidé, accès direct, comparaison et passage au configurateur |
| `advisor-v2.css` | Direction visuelle et responsive du conseiller |
| `advisor-engine.js` | Classement conservateur des solutions |
| `product-rules.js` | Compatibilités et estimations autorisées par les sources |
| `api/send-email.ts` | Validation serveur, déduplication et envoi des emails |
| `assets/produits` | Visuels produit optimisés |
| `docs-regles` | Consolidation interne des documents métier |
| `tasks/audit-prelivraison` | Audit, décisions, questions et runbook de lancement |
| `tests` | Tests métier, UX, sécurité et déploiement |

Le build public est filtré par `.vercelignore`. Les audits, tests, documents métier,
archives et fichiers d'environnement ne doivent jamais apparaître dans
`.vercel/output/static`.

## Règles commerciales

- Oré peut afficher une estimation uniquement lorsque toutes les données nécessaires sont présentes.
- BAB reste sur devis dès qu'un escalier ne peut pas être chiffré sans ambiguïté.
- Volets et abris restent sur devis tant que leurs composantes tarifaires ne sont pas validées par écrit.
- Coverseal, Eden et MasterDeck restent des solutions à étudier lorsque les règles écrites ne permettent pas de conclure.
- Une information manquante produit un état à préciser ou sur devis, jamais une fausse incompatibilité.

La source de vérité et les points encore à faire signer sont documentés dans
`tasks/audit-prelivraison/01-regles-metier.md` et
`tasks/audit-prelivraison/QUESTIONS-XAVIER.md`.

## Variables Vercel

Créer les valeurs de preview et de production à partir de `.env.example` :

| Variable | Statut | Usage |
|---|---|---|
| `RESEND_API_KEY` | Requise | Envoi via Resend |
| `KEY_DERIVATION_SECRET` | Requise en production | Dérivation HMAC des clés de stockage |
| `FROM_EMAIL` | Requise | Expéditeur appartenant à un domaine vérifié |
| `INTERNAL_EMAIL` | Requise | Réception interne des demandes |
| `PUBLIC_CONTACT_NAME` | Optionnelle | Nom affiché dans l'email prospect |
| `PUBLIC_CONTACT_EMAIL` | Optionnelle | Contact public |
| `CONTACT_PHONE` | Optionnelle | Téléphone public |
| `CONTACT_LOC` | Optionnelle | Libellé de la zone de contact |
| `CONTACT_ADDR` | Optionnelle | Adresse affichée dans l'email |
| `SITE_URL` | Optionnelle | Site principal Diskoov |
| `LOGO_URL` | Optionnelle | Logo absolu utilisé dans les emails |
| `KV_REST_API_URL` | Recommandée | Stockage partagé pour déduplication et limites |
| `KV_REST_API_TOKEN` | Recommandée | Accès au stockage partagé |

Le client ne contient aucun webhook. Toute intégration externe doit rester côté
serveur et être revue avant ajout.

## Sécurité du lead

- consentement, origine, champs, produit et pièce jointe sont validés côté serveur ;
- la compatibilité et le prix envoyés par le navigateur ne sont jamais considérés comme fiables ;
- JPG, PNG, WebP et PDF sont contrôlés par signature et limités à 3 Mio ;
- le dossier est dédupliqué avec une référence serveur stable ;
- l'email prospect n'est envoyé qu'après réception interne réussie ;
- l'outbox locale expire après 48 h et ne conserve pas la pièce jointe en base64 ;
- les paramètres analytics n'incluent ni coordonnées, ni commentaire, ni contenu du fichier.

`npm audit --audit-level=high` doit rester à zéro avant livraison.

## Intégration iframe

Le CSP autorise l'intégration depuis `https://diskoov.fr` et ses sous-domaines.
L'origine finale doit être testée sur une preview avant mise en production.

```html
<div style="position:relative;width:100%;height:100svh;overflow:hidden">
  <iframe
    src="https://configurateur.diskoov.fr/?advisor=1"
    title="Conseiller piscine Diskoov"
    style="position:absolute;inset:0;width:100%;height:100%;border:0"
    referrerpolicy="strict-origin-when-cross-origin">
  </iframe>
</div>
```

## Analytics

Le tracking ne s'active qu'après consentement. Les principaux événements sont :

| Événement | Mesure |
|---|---|
| `advisor_start`, `advisor_resume` | Entrée et reprise du parcours |
| `advisor_step_view`, `advisor_step_exit` | Progression et durée par étape |
| `advisor_results_view` | Résultats proposés |
| `advisor_configurator_open` | Passage vers un produit |
| `config_qualification_field` | Avancement d'un champ, sans sa valeur |
| `config_attachment_added`, `config_attachment_failed` | Usage de la photo par type et tranche de poids |
| `lead_submit_attempt`, `lead_submitted`, `lead_submit_failed` | Conversion et échecs réseau |

## Conditions de livraison

Le code peut être livré en preview lorsque tests, audit npm, build Vercel et QA
navigateur passent. Un GO production exige en plus :

1. validation écrite des règles et promesses encore ouvertes ;
2. vérification de la note Google le jour de la recette ;
3. validation juridique du consentement et de la durée de conservation ;
4. test réel des deux emails avec les variables de production ;
5. recette sur iPhone Safari et Android Chrome physiques ;
6. responsable de monitoring et procédure de rollback attribués.

Voir `tasks/audit-prelivraison/RUNBOOK-LANCEMENT.md` et
`tasks/audit-prelivraison/CHECKLIST-QA.md` avant toute promotion en production.
