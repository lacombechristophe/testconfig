# Configurateur Diskoov v15 — Guide de mise en production

## Checklist avant go-live (obligatoire)

### 1. Photos produit

Les 17 visuels reçus sont intégrés dans `assets/produits` et reliés aux parcours Oré, BAB, abris et volets. Les visuels principaux utilisés sont notamment :

| Fichier | Usage |
|---|---|
| `assets/produits/ore/*` | Oré et encombrements techniques |
| `assets/produits/bab/*` | Bâche à barres et Rolling-Up |
| `assets/produits/abris/*` | Ultra Bas, Master Bas et Mi-haut |
| `assets/produits/volets-*/*` | Volets hors-sol et immergés |

La cartographie exacte est documentée dans `docs-regles/ASSETS-PRODUITS.md`.

---

### 2. Image Open Graph
Créer un visuel configurateur au format 1200×630 px (screenshot ou mockup produit)  
et le déposer à : `https://configurateur.diskoov.fr/og-configurateur.jpg`  
Puis mettre à jour la balise `og:image` dans `<head>`.

---

### 3. Variables d'environnement Vercel

Dans **Vercel → Settings → Environment Variables** :

| Variable | Obligatoire | Description |
|---|---|---|
| `RESEND_API_KEY` | ✅ | Clé API Resend (resend.com) |
| `FROM_EMAIL` | ✅ | Ex : `xavier@diskoov.fr` |
| `INTERNAL_EMAIL` | ✅ | Email de réception des leads (xavier) |
| `CONTACT_NAME` | Optionnel | Nom du conseiller dans les emails (défaut : `Xavier Dispot`) |
| `CONTACT_PHONE` | Optionnel | Téléphone dans les emails (défaut : `06 20 54 25 04`) |
| `CONTACT_LOC` | Optionnel | Localisation de Xavier (défaut : `Showroom Saint-Laurent-des-Arbres`) |
| `CONTACT_ADDR` | Optionnel | Adresse siège social dans le footer (défaut : `494, rue Léon Blum 34 000 Montpellier`) |
| `SITE_URL` | Optionnel | URL du site (défaut : `https://diskoov.fr`) |
| `LOGO_URL` | Optionnel | URL du logo dans les emails (défaut : `https://configurateur.diskoov.fr/logo-diskoov.png`) |
| `KV_REST_API_URL` | Recommandé | Fourni automatiquement par Vercel KV |
| `KV_REST_API_TOKEN` | Recommandé | Fourni automatiquement par Vercel KV |
| `WEBHOOK_URL` | Optionnel | URL Make.com / Zapier |

**Activer Vercel KV** (rate-limiting persistant, 2 min) :  
Vercel Dashboard → Storage → Create KV Store → lier au projet.  
Les variables `KV_REST_API_URL` et `KV_REST_API_TOKEN` sont injectées automatiquement.

---

### 4. Webhook Make.com / Zapier (optionnel)

**Option A — via la page parente WordPress** (pour masquer l'URL au client) :
```html
<!-- Coller AVANT l'iframe dans la page WordPress -->
<script>window.DISKOOV_WEBHOOK = 'https://hook.eu1.make.com/VOTRE_ID';</script>
```

**Option B — directement dans index.html** (déconseillé, URL visible) :
```js
// Ligne ~930 dans index.html
window.DISKOOV_WEBHOOK = 'https://hook.eu1.make.com/VOTRE_ID';
```

---

### 5. Politique de confidentialité (RGPD — OBLIGATOIRE)
La page `https://diskoov.fr/privacy-policy/` est référencée dans le formulaire et la bannière cookies.
Si l'URL change, la modifier dans `config.js` → `DISKOOV_PRIVACY_URL`.
Contenu minimum requis (CNIL Art. 13) : finalité, base légale, durée 3 ans, DPO contact, droits.

### 6. Fonts Inter (auto-hébergées, RGPD)
Les polices Inter sont **déjà incluses** dans le dépôt (`/fonts/*.woff2`).
Aucune requête vers Google Fonts — conforme RGPD.

---

## Intégration WordPress (iframe recommandé)

Le configurateur utilise `overflow:hidden` et `100svh` — il ne peut pas être injecté directement dans une page WordPress. L'**iframe** est la seule méthode correcte.

### Option A — Sous-domaine dédié (recommandé)

```
https://configurateur.diskoov.fr
```

1. Déployer sur Vercel
2. Vercel → Settings → Domains → ajouter `configurateur.diskoov.fr`
3. DNS : CNAME `configurateur` → `cname.vercel-dns.com`

**Code à coller dans l'éditeur WordPress** :
```html
<style>
.diskoov-iframe-wrap{position:relative;width:100%;height:100svh;overflow:hidden}
.diskoov-iframe-wrap iframe{position:absolute;inset:0;width:100%;height:100%;border:none}
</style>
<div class="diskoov-iframe-wrap">
  <iframe
    src="https://configurateur.diskoov.fr"
    title="Configurateur piscine Diskoov"
    allow="autoplay; encrypted-media"
    loading="lazy"
    referrerpolicy="no-referrer-when-downgrade">
  </iframe>
</div>
```

**Masquer header/footer WordPress sur cette page** (dans `functions.php`) :
```php
add_action('wp_head', function() {
  if (is_page('configurateur')) {
    echo '<style>.site-header,.site-footer,.wpadminbar{display:none!important}
    body{margin:0!important;padding:0!important}</style>';
  }
});
```

### Option B — Lien direct (le plus simple)
```html
<a href="https://configurateur.diskoov.fr" target="_blank" rel="noopener noreferrer">
  Configurer ma piscine →
</a>
```

---

## Déploiement Vercel

```bash
npm install -g vercel
cd diskoov-configurateur
npm install
cp .env.example .env.local   # remplir les valeurs
vercel --prod
```

---

## Sécurité — ce qui est en place (v6)

| Mesure | Status |
|---|---|
| CORS strict (whitelist d'origines) | ✅ |
| Validation payload complète côté serveur | ✅ |
| Validation téléphone côté serveur (FR 10 chiffres) | ✅ |
| Sanitisation et troncature de tous les champs | ✅ |
| Échappement HTML dans les emails (anti-injection) | ✅ |
| Rate limiting par email via Vercel KV | ✅ (1 req/min, fallback in-memory) |
| Rate limiting par IP via Vercel KV | ✅ (10 req/min, fallback in-memory) |
| Honeypot anti-bot côté client | ✅ |
| Recalcul de la surface côté serveur (non trusted frontend) | ✅ |
| HSTS (Strict-Transport-Security) | ✅ |
| Fonts auto-hébergées (RGPD, pas de Google Fonts) | ✅ |
| Bannière consentement cookies (CNIL) | ✅ (si GTM activé) |
| Retry automatique des leads en cas d'échec réseau | ✅ |
| Sauvegarde localStorage des leads en attente | ✅ |

---

## Analytics

**Important** : le tracking GA4/GTM n'est activé qu'après consentement cookies (CNIL).
Pour activer, ajouter AVANT l'iframe dans la page WordPress :
```html
<script>window.DISKOOV_GTM_ID = 'G-XXXXXXXXXX';</script>
```

Événements pré-câblés :

| Événement | Déclencheur | Paramètres |
|---|---|---|
| `config_equipment` | Sélection équipement | `equipment` |
| `config_model` | Sélection modèle | `model`, `category` |
| `form_start` | Première saisie coordonnées | — |
| `lead_submitted` | Soumission réussie | `equipment`, `model`, `department`, `timeline`, `priority`, `email_sent` |

---

## Modifier la configuration (prix, contact, couleurs, URLs)

Toutes les valeurs modifiables sont dans le fichier **`config.js`** à la racine du projet.

### Comment modifier `config.js` sur GitHub :
1. Ouvrir le fichier `config.js` dans le dépôt GitHub
2. Cliquer sur l'icone crayon (modifier)
3. Changer les valeurs souhaitées
4. Cliquer sur **Commit changes**
5. Le site se met à jour automatiquement en quelques secondes

### Ce que contient `config.js` :

| Section | Ce qu'elle contrôle |
|---|---|
| `DISKOOV_PHONE_DISPLAY / PHONE_TEL` | Numéro de téléphone affiché |
| `DISKOOV_CONTACT_NAME` | Nom du conseiller (page confirmation) |
| `DISKOOV_CONTACT_EMAIL` | Email de contact (mention RGPD) |
| `DISKOOV_SITE_URL` | Lien retour vers le site principal |
| `DISKOOV_PRIVACY_URL` | Lien politique de confidentialité |
| `DISKOOV_PRICES` | Prix de base de chaque produit (TTC) |
| `DISKOOV_OPTIONS` | Prix des options (rail, motorisation) |
| `DISKOOV_MEMBRANE_COLORS` | Couleurs membrane + suppléments |
| `DISKOOV_COPING_COLORS` | Couleurs habillage (margelles) |
| `DISKOOV_STRUCTURE_COLORS` | Couleurs structure (abri) |
| `DISKOOV_GTM_ID` | ID Google Tag Manager |
| `DISKOOV_YT_ID` | ID vidéo YouTube |
| `DISKOOV_WEBHOOK` | URL webhook Make.com / Zapier |

**Ne modifiez PAS** le fichier `index.html` — toutes les valeurs personnalisables sont dans `config.js`.

---

## Payload webhook (Make.com / Zapier)

```json
{
  "prenom": "Jean",
  "nom": "Dupont",
  "email": "jean@email.com",
  "tel": "06 12 34 56 78",
  "categorie": "cov",
  "produit": "auto",
  "produit_label": "Coverseal Automatique",
  "longueur": 10,
  "largeur": 5,
  "surface": 50,
  "emplacement": "Extérieur",
  "membrane_ral": "RAL 7037",
  "membrane_label": "Gris poussière",
  "habillage_ral": "RAL 7037",
  "habillage_label": "Gris poussière",
  "option_motorisation_solaire": true,
  "option_rail_tout_terrain": false,
  "departement": "34 — Hérault",
  "delai": "Avant l'été (URGENT)",
  "source": "Google",
  "priorite": "URGENT",
  "timestamp": "2026-03-17T10:30:00.000Z",
  "email_sent": true
}
```
