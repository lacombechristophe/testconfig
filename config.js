// ╔══════════════════════════════════════════════════════════════╗
// ║  CONFIGURATION DISKOOV                                      ║
// ║                                                              ║
// ║  Modifiez les valeurs ci-dessous puis enregistrez le         ║
// ║  fichier. Le site se met à jour automatiquement après        ║
// ║  quelques secondes.                                          ║
// ║                                                              ║
// ║  ⚠ Ne supprimez pas les guillemets ni les points-virgules.   ║
// ║  ⚠ Ne modifiez PAS le fichier index.html.                    ║
// ╚══════════════════════════════════════════════════════════════╝


// ── CONTACT ──────────────────────────────────────────────────────
// Numéro affiché sur le site et dans les emails de confirmation

window.DISKOOV_PHONE_DISPLAY = '06 20 54 25 04';
window.DISKOOV_PHONE_TEL     = 'tel:0620542504';
window.DISKOOV_PUBLIC_CONTACT_LABEL = 'l’équipe Diskoov';
window.DISKOOV_CONTACT_NAME  = 'Équipe Diskoov';
window.DISKOOV_CONTACT_EMAIL = 'contact@diskoov.fr';


// ── URLS ─────────────────────────────────────────────────────────
// Liens vers le site principal et la page politique de confidentialité

window.DISKOOV_SITE_URL    = 'https://diskoov.fr';
window.DISKOOV_PRIVACY_URL = 'https://diskoov.fr/privacy-policy/';


// ── TRACKING ─────────────────────────────────────────────────────
// Décommentez (retirez les //) et renseignez pour activer
// Laisser commenté = désactivé

// window.DISKOOV_GTM_ID  = 'GTM-XXXXXXX';
// window.DISKOOV_YT_ID   = 'VBytJ5-paDc';
// window.DISKOOV_WEBHOOK = 'https://hook.eu1.make.com/XXXX';


// ── PRIX DE BASE (en euros TTC) ─────────────────────────────────
// Ces prix s'affichent en bas du configurateur comme estimation

window.DISKOOV_PRICES = {
  auto: 13890,    // Coverseal Automatique
  semi: 11490     // Coverseal Semi-Automatique
};


// ── PRIX DES OPTIONS (en euros TTC) ─────────────────────────────

window.DISKOOV_OPTIONS = {
  rtt:      800   // Rail tout-terrain Coverseal
};


// ── COULEURS MEMBRANE ────────────────────────────────────────────
// h = couleur (code hexadécimal)
// r = code RAL
// l = nom de la couleur (en français)
// delta = supplément en euros (0 = pas de supplément)

window.DISKOOV_MEMBRANE_COLORS = [
  { h: '#898176', r: 'RAL 7037', l: 'Gris poussière', delta: 0 },
  { h: '#C4C4C4', r: 'RAL 7035', l: 'Gris clair',    delta: 0 },
  { h: '#E8DEBA', r: 'RAL 1015', l: 'Ivoire clair',   delta: 459 },
  { h: '#9E8B69', r: 'RAL 1019', l: 'Beige gris',     delta: 459 },
  { h: '#1F78B4', r: 'RAL 5015', l: 'Bleu ciel',      delta: 459 },
  { h: '#003591', r: 'RAL 5002', l: 'Bleu cobalt',     delta: 459 },
  { h: '#86A47C', r: 'RAL 6021', l: 'Vert pâle',      delta: 459 },
  { h: '#006B54', r: 'RAL 6026', l: 'Vert opale',      delta: 459 },
  { h: '#0A0A0A', r: 'RAL 9005', l: 'Noir pur',       delta: 459 }
];


// ── COULEURS HABILLAGE (MARGELLES) ───────────────────────────────

window.DISKOOV_COPING_COLORS = [
  { h: '#898176', r: 'RAL 7037', l: 'Gris poussière' },
  { h: '#C4C4C4', r: 'RAL 7035', l: 'Gris clair' },
  { h: '#E8DEBA', r: 'RAL 1015', l: 'Ivoire clair' },
  { h: '#9E8B69', r: 'RAL 1019', l: 'Beige gris' },
  { h: '#D95B1A', r: 'RAL 2004', l: 'Orange' },
  { h: '#7A1C20', r: 'RAL 3004', l: 'Bordeaux' },
  { h: '#4A5568', r: 'RAL 7016', l: 'Anthracite' },
  { h: '#2C3E50', r: 'RAL 5011', l: 'Bleu nuit' },
  { h: '#3E5C36', r: 'RAL 6009', l: 'Vert sapin' },
  { h: '#0A0A0A', r: 'RAL 9005', l: 'Noir pur' }
];


// ── COULEURS STRUCTURE (ABRI TÉLESCOPIQUE) ───────────────────────

window.DISKOOV_STRUCTURE_COLORS = [
  { h: '#FFFFFF', r: 'RAL 9016', l: 'Blanc' },
  { h: '#C4C4C4', r: 'RAL 7035', l: 'Gris clair' },
  { h: '#4A5568', r: 'RAL 7016', l: 'Anthracite' },
  { h: '#898176', r: 'RAL 7037', l: 'Gris poussière' },
  { h: '#E8DEBA', r: 'RAL 1015', l: 'Ivoire clair' },
  { h: '#9E8B69', r: 'RAL 1019', l: 'Beige gris' },
  { h: '#3E5C36', r: 'RAL 6009', l: 'Vert sapin' },
  { h: '#2C3E50', r: 'RAL 5011', l: 'Bleu nuit' },
  { h: '#7A1C20', r: 'RAL 3004', l: 'Bordeaux' },
  { h: '#0A0A0A', r: 'RAL 9005', l: 'Noir pur' }
];
