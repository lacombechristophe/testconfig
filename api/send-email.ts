import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.error('[Diskoov] RESEND_API_KEY manquante — les emails ne seront pas envoyés');
}
const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Contact (éditables via variables d'environnement Vercel) ────────────────
const CONTACT_NAME = process.env.CONTACT_NAME || 'Xavier Dispot';
const PUBLIC_CONTACT_NAME = process.env.PUBLIC_CONTACT_NAME || "l'équipe Diskoov";
const CONTACT_PHONE = process.env.CONTACT_PHONE || '06 20 54 25 04';
const CONTACT_LOC = process.env.CONTACT_LOC || 'Showroom Saint-Laurent-des-Arbres';
const CONTACT_ADDR = process.env.CONTACT_ADDR || '494, rue Léon Blum 34 000 Montpellier';
const SITE_URL = process.env.SITE_URL || 'https://diskoov.fr';
const LOGO_URL = process.env.LOGO_URL || `${process.env.SITE_URL || 'https://configurateur.diskoov.fr'}/logo-diskoov.png`;

// ─── Origines autorisées (CORS strict) ───────────────────────────────────────
// Ajouter ici les domaines de preview Vercel si nécessaire (ex: *.vercel.app)
const ALLOWED_ORIGINS = [
  'https://configurateur.diskoov.fr',
  'https://diskoov.fr',
  // Preview Vercel (staging) — actif uniquement si VERCEL_URL est défini
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
].filter(Boolean);

function getAllowedOrigin(req: VercelRequest): string | null {
  const origin = req.headers['origin'] as string | undefined;
  if (!origin) return null;
  return ALLOWED_ORIGINS.includes(origin) ? origin : null;
}

// ─── Payload type ─────────────────────────────────────────────────────────────
interface LeadPayload {
  prenom: string;
  nom: string;
  email: string;
  tel: string;
  source?: string;
  forme: 'rect' | 'oval' | 'libre';
  forme_label?: string;
  categorie: 'cov' | 'shl' | 'oth';
  produit: string;
  produit_label: string;
  longueur: number;
  largeur: number;
  surface: number;
  emplacement: string;
  escalier?: boolean;
  escalier_type?: string;
  escalier_position?: string;
  escalier_cote?: string;
  escalier_coin?: string;
  escalier_largeur?: number;
  escalier_description?: string;
  filtration_hors_bord?: boolean;
  membrane_ral?: string;
  membrane_label?: string;
  habillage_ral?: string;
  habillage_label?: string;
  option_motorisation_solaire?: boolean;
  option_rail_tout_terrain?: boolean;
  option_motorisation_abri?: boolean;
  option_rail_sol?: boolean;
  couleur_structure?: string;
  prestation_souhaitee?: string;
  support_bassin?: string;
  margelles?: string;
  plage_mecanisme?: string;
  alimentation_electrique?: string;
  couleur_produit?: string;
  cote_guidage?: string;
  integration_volet?: string;
  informations_manquantes?: string;
  qualification_complete?: string;
  options_produit?: string;
  prix_estime?: number;
  statut_prix?: string;
  eligibilite?: string;
  reference_tarifaire?: string;
  avertissements_tarifaires?: string;
  donnees_techniques?: string;
  departement: string;
  delai: string;
  commentaire?: string;
  description_forme?: string;
  plan_filename?: string;
  plan_base64?: string;
  piece_jointe_type?: string;
  photo_filename?: string;
  consentement_relances?: boolean;
  priorite: 'URGENT' | 'NORMAL';
  timestamp: string;
}

// ─── Validation serveur complète ──────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^0[1-9]\d{8}$/;
const VALID_CATS = ['cov', 'shl', 'oth'] as const;
const VALID_PRIO = ['URGENT', 'NORMAL'] as const;

function validatePayload(p: unknown): { ok: true; data: LeadPayload } | { ok: false; error: string } {
  if (!p || typeof p !== 'object') return { ok: false, error: 'Payload invalide' };
  const b = p as Record<string, unknown>;

  // Champs texte obligatoires
  for (const f of ['prenom', 'nom', 'email', 'tel', 'departement', 'delai', 'produit', 'produit_label', 'emplacement', 'priorite', 'categorie', 'timestamp'] as const) {
    if (typeof b[f] !== 'string' || !(b[f] as string).trim()) {
      return { ok: false, error: `Champ manquant ou invalide : ${f}` };
    }
  }

  if (!EMAIL_RE.test(b.email as string)) return { ok: false, error: 'Email invalide' };

  // Validation téléphone français (10 chiffres commençant par 0)
  const cleanedTel = (b.tel as string).replace(/\s/g, '');
  if (cleanedTel.length === 10 && !PHONE_RE.test(cleanedTel)) {
    return { ok: false, error: 'Numéro de téléphone invalide' };
  }

  if (!VALID_CATS.includes(b.categorie as 'cov' | 'shl' | 'oth')) return { ok: false, error: 'Catégorie invalide' };
  if (!VALID_PRIO.includes(b.priorite as 'URGENT' | 'NORMAL')) return { ok: false, error: 'Priorité invalide' };

  const lon = Number(b.longueur);
  const lar = Number(b.largeur);
  if (isNaN(lon) || lon < 1 || lon > 50) return { ok: false, error: 'Longueur invalide (1–50 m)' };
  if (isNaN(lar) || lar < 1 || lar > 25) return { ok: false, error: 'Largeur invalide (1–25 m)' };

  // Champs optionnels : sanitiser les strings
  const sanitizeStr = (v: unknown) => typeof v === 'string' ? v.slice(0, 500) : undefined;
  const sanitizeLongStr = (v: unknown) => typeof v === 'string' ? v.slice(0, 2000) : undefined;
  const sanitizeBool = (v: unknown) => typeof v === 'boolean' ? v : undefined;

  // Forme
  const validForms = ['rect', 'oval', 'libre'];
  const forme = validForms.includes(b.forme as string) ? (b.forme as 'rect' | 'oval' | 'libre') : 'rect';

  // Surface : recalculée côté serveur
  const surf = forme === 'oval'
    ? Math.round(Math.PI * (lon / 2) * (lar / 2) * 10) / 10
    : Math.round(lon * lar * 10) / 10;

  return {
    ok: true,
    data: {
      prenom: (b.prenom as string).trim().slice(0, 100),
      nom: (b.nom as string).trim().slice(0, 100),
      email: (b.email as string).trim().toLowerCase().slice(0, 254),
      tel: (b.tel as string).trim().slice(0, 20),
      forme,
      forme_label: sanitizeStr(b.forme_label),
      categorie: b.categorie as 'cov' | 'shl' | 'oth',
      produit: (b.produit as string).trim().slice(0, 50),
      produit_label: (b.produit_label as string).trim().slice(0, 100),
      longueur: Math.round(lon * 10) / 10,
      largeur: Math.round(lar * 10) / 10,
      surface: surf,
      emplacement: (b.emplacement as string).trim().slice(0, 20),
      escalier: sanitizeBool(b.escalier),
      escalier_type: (['droit', 'roman', 'angle', 'autre'].includes(b.escalier_type as string) ? b.escalier_type as string : sanitizeStr(b.escalier_type)),
      escalier_position: (['interieur', 'exterieur'].includes(b.escalier_position as string) ? b.escalier_position as string : 'interieur'),
      escalier_cote: sanitizeStr(b.escalier_cote),
      escalier_coin: sanitizeStr(b.escalier_coin) || sanitizeStr(b.stairCorner),
      escalier_largeur: typeof b.escalier_largeur === 'number' ? b.escalier_largeur : undefined,
      escalier_description: sanitizeStr(b.escalier_description),
      filtration_hors_bord: sanitizeBool(b.filtration_hors_bord),
      departement: (b.departement as string).trim().slice(0, 60),
      delai: (b.delai as string).trim().slice(0, 80),
      priorite: b.priorite as 'URGENT' | 'NORMAL',
      timestamp: (b.timestamp as string).trim(),
      source: sanitizeStr(b.source),
      commentaire: sanitizeStr(b.commentaire),
      description_forme: sanitizeStr(b.description_forme),
      plan_filename: sanitizeStr(b.plan_filename),
      plan_base64: typeof b.plan_base64 === 'string' ? b.plan_base64.slice(0, 7_000_000) : undefined,
      piece_jointe_type: sanitizeStr(b.piece_jointe_type),
      photo_filename: sanitizeStr(b.photo_filename),
      consentement_relances: sanitizeBool(b.consentement_relances),
      couleur_structure: sanitizeStr(b.couleur_structure),
      membrane_ral: sanitizeStr(b.membrane_ral),
      membrane_label: sanitizeStr(b.membrane_label),
      habillage_ral: sanitizeStr(b.habillage_ral),
      habillage_label: sanitizeStr(b.habillage_label),
      option_motorisation_solaire: sanitizeBool(b.option_motorisation_solaire),
      option_rail_tout_terrain: sanitizeBool(b.option_rail_tout_terrain),
      option_motorisation_abri: sanitizeBool(b.option_motorisation_abri),
      option_rail_sol: sanitizeBool(b.option_rail_sol),
      prestation_souhaitee: sanitizeStr(b.prestation_souhaitee),
      support_bassin: sanitizeStr(b.support_bassin),
      margelles: sanitizeStr(b.margelles),
      plage_mecanisme: sanitizeStr(b.plage_mecanisme),
      alimentation_electrique: sanitizeStr(b.alimentation_electrique),
      couleur_produit: sanitizeStr(b.couleur_produit),
      cote_guidage: sanitizeStr(b.cote_guidage),
      integration_volet: sanitizeStr(b.integration_volet),
      informations_manquantes: sanitizeLongStr(b.informations_manquantes),
      qualification_complete: sanitizeStr(b.qualification_complete),
      options_produit: sanitizeLongStr(b.options_produit),
      prix_estime: typeof b.prix_estime === 'number' && Number.isFinite(b.prix_estime) && b.prix_estime >= 0 && b.prix_estime <= 1_000_000 ? Math.round(b.prix_estime) : undefined,
      statut_prix: sanitizeStr(b.statut_prix),
      eligibilite: sanitizeStr(b.eligibilite),
      reference_tarifaire: sanitizeStr(b.reference_tarifaire),
      avertissements_tarifaires: sanitizeLongStr(b.avertissements_tarifaires),
      donnees_techniques: sanitizeLongStr(b.donnees_techniques),
    },
  };
}

// ─── Rate limiting robuste avec Vercel KV (si disponible) ────────────────────
// Fallback in-memory si KV non configuré (acceptable en dev / petit volume)
let kv: { get: (k: string) => Promise<unknown>; set: (k: string, v: unknown, opts?: { ex?: number }) => Promise<unknown> } | null = null;

async function initKV() {
  if (kv) return;
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const { kv: vercelKv } = await import('@vercel/kv');
      kv = vercelKv;
    } else {
      console.warn('[Diskoov] KV non configuré — rate limiting en mémoire (non persistant entre redéploiements)');
    }
  } catch {
    console.warn('[Diskoov] KV indisponible — fallback in-memory');
  }
}

const inMemoryRateMap = new Map<string, number>();

async function isRateLimited(email: string): Promise<boolean> {
  const key = `dk_rl:${email}`;
  const now = Date.now();

  if (kv) {
    try {
      const last = await kv.get(key);
      if (last && typeof last === 'number' && now - last < 15_000) return true;
      await kv.set(key, now, { ex: 15 });
      return false;
    } catch {
      // Si KV fail, fallback in-memory
    }
  }

  const last = inMemoryRateMap.get(email);
  if (last && now - last < 15_000) return true;
  inMemoryRateMap.set(email, now);
  // Nettoyage périodique pour éviter les fuites mémoire
  if (inMemoryRateMap.size > 1000) {
    for (const [k, v] of inMemoryRateMap.entries()) {
      if (now - v > 15_000) inMemoryRateMap.delete(k);
    }
  }
  return false;
}

// ─── Rate limiting par IP (10 req/min) ────────────────────────────────────────
const inMemoryIpRateMap = new Map<string, number[]>();

async function isIpRateLimited(ip: string): Promise<boolean> {
  const key = `dk_rl_ip:${ip}`;
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 10;

  if (kv) {
    try {
      const timestamps = (await kv.get(key)) as number[] | null;
      const recent = timestamps ? timestamps.filter((t: number) => now - t < windowMs) : [];
      if (recent.length >= maxRequests) return true;
      recent.push(now);
      await kv.set(key, recent, { ex: 60 });
      return false;
    } catch {
      // Si KV fail, fallback in-memory
    }
  }

  const timestamps = inMemoryIpRateMap.get(ip) || [];
  const recent = timestamps.filter(t => now - t < windowMs);
  if (recent.length >= maxRequests) return true;
  recent.push(now);
  inMemoryIpRateMap.set(ip, recent);
  // Nettoyage périodique pour éviter les fuites mémoire
  if (inMemoryIpRateMap.size > 1000) {
    for (const [k, v] of inMemoryIpRateMap.entries()) {
      if (v.every(t => now - t > windowMs)) inMemoryIpRateMap.delete(k);
    }
  }
  return false;
}

// ─── Helpers email ────────────────────────────────────────────────────────────
const CAT_LABEL: Record<string, string> = {
  cov: 'Couverture',
  shl: 'Abri télescopique',
  oth: 'Bâche / Volet / MasterDeck',
};

function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Europe/Paris',
    });
  } catch {
    return iso;
  }
}

// Échappement HTML pour éviter toute injection dans les emails
function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Generate a short reference number from timestamp + random
function genRef(): string {
  const d = new Date();
  const y = String(d.getFullYear()).slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const r = String(Math.floor(Math.random() * 9000) + 1000);
  return `DK-${y}${m}-${r}`;
}

// ─── Prospect email rows (refined style) ─────────────────────────────────────
function pRow(label: string, value: string, last = false): string {
  return `<tr>
    <td style="padding:10px 14px;font-size:12.5px;color:#888;width:40%;vertical-align:top;border-bottom:${last ? 'none' : '1px solid #f0efe8'};letter-spacing:.01em">${esc(label)}</td>
    <td style="padding:10px 14px;font-size:13px;font-weight:600;color:#222;text-align:right;vertical-align:top;border-bottom:${last ? 'none' : '1px solid #f0efe8'}">${value}</td>
  </tr>`;
}

function pSection(title: string): string {
  return `<tr><td colspan="2" style="padding:14px 14px 6px;font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#c9a96e">${esc(title)}</td></tr>`;
}

// ─── Internal email rows ─────────────────────────────────────────────────────
function iRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:7px 0;font-size:13px;color:#999;width:38%;vertical-align:top">${esc(label)}</td>
    <td style="padding:7px 0;font-size:13px;font-weight:600;color:#111;text-align:right;vertical-align:top">${value}</td>
  </tr>`;
}


// ─── Email prospect ─────────────────────────────────────────────
function prospectHtml(p: LeadPayload, ref: string): string {
  const isCov = p.categorie === 'cov';
  const isCS = isCov && (p.produit === 'auto' || p.produit === 'semi');
  const isShl = p.categorie === 'shl';
  const prodLabel = p.produit_label || CAT_LABEL[p.categorie] || 'Projet';

  const FL: Record<string, string> = { rect: 'Rectangulaire', oval: 'Arrondie / Ovale', libre: 'Forme libre' };
  const STL: Record<string, string> = { droit: 'Droit', roman: 'Roman', angle: 'Angle', autre: 'Autre' };
  const CL: Record<string, string> = { hg: 'Haut-gauche', hd: 'Haut-droit', bg: 'Bas-gauche', bd: 'Bas-droit' };

  let stairLine = '';
  if (p.escalier && p.escalier_type) {
    stairLine = (STL[p.escalier_type] || p.escalier_type)
      + ` · ${p.escalier_position === 'exterieur' ? 'Extérieur' : 'Intérieur'}`
      + (p.escalier_cote ? ` · Côté ${p.escalier_cote}` : '')
      + (p.escalier_coin ? ` · ${CL[p.escalier_coin] || p.escalier_coin}` : '')
      + (p.escalier_largeur && p.escalier_type !== 'autre' && p.escalier_type !== 'angle' ? ` · ${p.escalier_largeur} m` : '')
      + (p.escalier_description ? ` · ${p.escalier_description}` : '');
  }

  // Build rows array using pRow (refined prospect style)
  const bassinRows = [
    pRow('Forme', esc(FL[p.forme] || p.forme_label || 'Rectangulaire')),
    p.forme !== 'libre' ? pRow('Dimensions', `${p.longueur.toFixed(1).replace('.', ',')} &times; ${p.largeur.toFixed(1).replace('.', ',')} m &mdash; ${p.surface} m²`) : '',
    pRow('Emplacement', esc(p.emplacement)),
    stairLine ? pRow('Escalier', esc(stairLine)) : '',
    p.filtration_hors_bord ? pRow('Filtration hors-bord', 'Oui') : '',
  ].filter(Boolean).join('');

  const equipRows = [
    pRow('Équipement', esc(CAT_LABEL[p.categorie] || p.categorie)),
    p.produit_label ? pRow('Modèle', `<strong style="color:#111">${esc(p.produit_label)}</strong>`) : '',
    isCS && p.membrane_label ? pRow('Membrane', `${esc(p.membrane_label)} <span style="color:#aaa">${esc(p.membrane_ral || '')}</span>`) : '',
    isCS && p.habillage_label ? pRow('Habillage', `${esc(p.habillage_label)} <span style="color:#aaa">${esc(p.habillage_ral || '')}</span>`) : '',
    isCS && p.option_motorisation_solaire ? pRow('Motorisation solaire', 'Incluse') : '',
    isCS && p.option_rail_tout_terrain ? pRow('Rail tout-terrain', 'Oui') : '',
    isShl && p.option_motorisation_abri ? pRow('Motorisation abri', 'Oui') : '',
    isShl && p.option_rail_sol ? pRow('Rail au sol', 'Oui') : '',
    isShl && p.couleur_structure ? pRow('Couleur structure', esc(p.couleur_structure)) : '',
    p.prestation_souhaitee ? pRow('Prestation', esc(p.prestation_souhaitee)) : '',
    p.support_bassin ? pRow('Support', esc(p.support_bassin)) : '',
    p.margelles ? pRow('Margelles', esc(p.margelles)) : '',
    p.plage_mecanisme ? pRow('Plage mécanisme', esc(p.plage_mecanisme)) : '',
    p.alimentation_electrique ? pRow('Alimentation électrique', esc(p.alimentation_electrique)) : '',
    p.options_produit ? pRow('Options produit', esc(p.options_produit)) : '',
    p.prix_estime ? pRow('Estimation configurateur', `≈ ${p.prix_estime.toLocaleString('fr-FR')} ${p.produit.startsWith('ore_') ? '€ <span style="color:#999;font-weight:400">à confirmer après validation technique</span>' : '€ TTC <span style="color:#999;font-weight:400">indicative</span>'}`) : '',
  ].filter(Boolean).join('');

  const logRows = [
    pRow('Département', esc(p.departement)),
    pRow('Délai souhaité', `<strong style="color:#111">${esc(p.delai)}</strong>`, true),
  ].filter(Boolean).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Confirmation — ${esc(prodLabel)} — Diskoov</title></head>
<body style="margin:0;padding:0;background:#f2f2f0;font-family:'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f0"><tr><td style="padding:48px 16px" align="center">

<!-- Main card -->
<table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.06)">

  <!-- ▼ HEADER: logo on dark background -->
  <tr><td style="background:#111111;padding:32px 40px;text-align:center">
    <img src="${LOGO_URL}" alt="Diskoov" width="150" height="auto" style="display:inline-block;max-width:150px;height:auto" />
  </td></tr>

  <!-- ▼ GOLD ACCENT -->
  <tr><td style="height:3px;background:linear-gradient(90deg,#b8944f,#c9a96e,#dfc088,#c9a96e,#b8944f);font-size:0;line-height:0">&nbsp;</td></tr>

  <!-- ▼ GREETING -->
  <tr><td style="padding:36px 40px 0">
    <p style="margin:0 0 6px;font-size:12px;color:#c9a96e;font-weight:600;text-transform:uppercase;letter-spacing:.1em">Confirmation de demande</p>
    <h1 style="margin:0 0 14px;font-size:24px;font-weight:700;color:#111;letter-spacing:-.03em;line-height:1.3">Merci ${esc(p.prenom)}, votre projet est entre de bonnes mains.</h1>
    <p style="margin:0;font-size:14.5px;color:#555;line-height:1.8">
      ${esc(PUBLIC_CONTACT_NAME)} prendra contact avec vous sous <strong style="color:#111">48 heures</strong>
      au <strong style="color:#111">${esc(p.tel)}</strong> pour échanger sur votre projet et préparer une étude personnalisée.
    </p>
  </td></tr>

  <!-- ▼ REFERENCE -->
  <tr><td style="padding:20px 40px 0">
    <table cellpadding="0" cellspacing="0" style="background:#fafaf8;border-radius:8px;border:1px solid #f0efe8">
      <tr>
        <td style="padding:10px 16px;font-size:12px;color:#999">Référence</td>
        <td style="padding:10px 16px;font-size:13px;font-weight:700;color:#111;letter-spacing:.04em">${ref}</td>
      </tr>
    </table>
  </td></tr>

  <!-- ▼ CONFIG: Bassin -->
  <tr><td style="padding:28px 40px 0">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;border:1px solid #f0efe8;overflow:hidden">
      ${pSection('Votre bassin')}
      ${bassinRows}
      ${pSection('Équipement sélectionné')}
      ${equipRows}
      ${pSection('Projet')}
      ${logRows}
    </table>
  </td></tr>

  ${p.commentaire || p.description_forme ? `
  <!-- ▼ NOTE -->
  <tr><td style="padding:20px 40px 0">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf8;border-left:3px solid #c9a96e;border-radius:0 10px 10px 0">
      <tr><td style="padding:16px 20px">
        <p style="margin:0 0 6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#c9a96e">Votre message</p>
        <p style="margin:0;font-size:13.5px;color:#444;line-height:1.7">${esc(p.commentaire || p.description_forme || '')}</p>
      </td></tr>
    </table>
  </td></tr>` : ''}

  <!-- ▼ CONTACT CARD -->
  <tr><td style="padding:28px 40px 0">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border-radius:12px;overflow:hidden">
      <tr><td style="padding:24px 28px">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="vertical-align:middle">
            <p style="margin:0 0 3px;font-size:10px;color:#c9a96e;font-weight:700;text-transform:uppercase;letter-spacing:.1em">Votre interlocuteur dédié</p>
            <p style="margin:0;font-size:20px;font-weight:700;color:#fff;letter-spacing:-.02em">${esc(PUBLIC_CONTACT_NAME)}</p>
            <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,.45)">${esc(CONTACT_LOC)}</p>
          </td>
          <td style="text-align:right;vertical-align:middle">
            <a href="tel:${CONTACT_PHONE.replace(/\s/g, '')}" style="display:inline-block;background:#c9a96e;color:#111;font-size:14px;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;letter-spacing:-.01em">${esc(CONTACT_PHONE)}</a>
          </td>
        </tr></table>
      </td></tr>
    </table>
  </td></tr>

  <!-- ▼ NEXT STEPS -->
  <tr><td style="padding:28px 40px 0">
    <p style="margin:0 0 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#c9a96e">Prochaines étapes</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="width:28px;vertical-align:top;padding:0 0 12px">
          <div style="width:24px;height:24px;border-radius:50%;background:#c9a96e;color:#111;font-size:12px;font-weight:800;text-align:center;line-height:24px">1</div>
        </td>
        <td style="padding:2px 0 12px 12px;font-size:13.5px;color:#444;line-height:1.6">
          <strong style="color:#111">${esc(PUBLIC_CONTACT_NAME)} vous rappelle</strong> sous 48h pour comprendre votre projet en détail.
        </td>
      </tr>
      <tr>
        <td style="width:28px;vertical-align:top;padding:0 0 12px">
          <div style="width:24px;height:24px;border-radius:50%;background:#c9a96e;color:#111;font-size:12px;font-weight:800;text-align:center;line-height:24px">2</div>
        </td>
        <td style="padding:2px 0 12px 12px;font-size:13.5px;color:#444;line-height:1.6">
          <strong style="color:#111">Étude technique</strong> et devis détaillé adapté à votre terrain et vos envies.
        </td>
      </tr>
      <tr>
        <td style="width:28px;vertical-align:top">
          <div style="width:24px;height:24px;border-radius:50%;background:#c9a96e;color:#111;font-size:12px;font-weight:800;text-align:center;line-height:24px">3</div>
        </td>
        <td style="padding:2px 0 0 12px;font-size:13.5px;color:#444;line-height:1.6">
          <strong style="color:#111">Installation</strong> par nos équipes qualifiées, partout en France.
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- ▼ SIGNATURE -->
  <tr><td style="padding:28px 40px 36px">
    <p style="margin:0;font-size:14.5px;color:#555;line-height:1.8">
      Nous avons hâte de donner vie à votre projet,<br>
      <strong style="color:#111">${esc(PUBLIC_CONTACT_NAME)}</strong>
    </p>
  </td></tr>

  <!-- ▼ FOOTER -->
  <tr><td style="background:#111;padding:28px 40px">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="text-align:center">
        <img src="${LOGO_URL}" alt="Diskoov" width="80" height="auto" style="display:inline-block;max-width:80px;height:auto;opacity:.6;margin-bottom:14px" />
        <p style="margin:0 0 3px;font-size:11.5px;color:rgba(255,255,255,.4);line-height:1.6">
          ${esc(CONTACT_ADDR)}
        </p>
        <p style="margin:0 0 3px;font-size:11.5px;color:rgba(255,255,255,.4);line-height:1.6">
          <a href="tel:${CONTACT_PHONE.replace(/\s/g, '')}" style="color:rgba(255,255,255,.4);text-decoration:none">${esc(CONTACT_PHONE)}</a>
          &nbsp;&middot;&nbsp;
          <a href="mailto:xavier@diskoov.fr" style="color:rgba(255,255,255,.4);text-decoration:none">xavier@diskoov.fr</a>
          &nbsp;&middot;&nbsp;
          <a href="${SITE_URL}" style="color:rgba(255,255,255,.4);text-decoration:none">${SITE_URL.replace(/^https?:\/\//, '')}</a>
        </p>
        <p style="margin:14px 0 0;font-size:10px;color:rgba(255,255,255,.2);line-height:1.6">
          Diskoov est une marque de Sokoov SAS &middot; Réf. ${ref}<br>
          Cet email confirme votre demande sur ${SITE_URL.replace(/^https?:\/\//, '')}. Données utilisées uniquement pour votre projet.
        </p>
      </td></tr>
    </table>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

// ─── Email interne (Xavier) ───────────────────────────────────────────────────
function internalHtml(p: LeadPayload, ref: string): string {
  const isUrgent = p.priorite === 'URGENT';
  const isCov = p.categorie === 'cov';
  const isCS = isCov && (p.produit === 'auto' || p.produit === 'semi');
  const isShl = p.categorie === 'shl';

  const FL: Record<string, string> = { rect: 'Rectangulaire', oval: 'Arrondie', libre: 'Forme libre' };
  const CL: Record<string, string> = { hg: 'Haut-gauche', hd: 'Haut-droit', bg: 'Bas-gauche', bd: 'Bas-droit' };

  const covOpts: string[] = [];
  if (p.option_motorisation_solaire) covOpts.push('Motorisation solaire');
  if (p.option_rail_tout_terrain) covOpts.push('Rail tout-terrain');

  const shlOpts: string[] = [];
  if (p.option_motorisation_abri) shlOpts.push('Motorisation');
  if (p.option_rail_sol) shlOpts.push('Rail au sol');
  if (p.couleur_structure) shlOpts.push(`Couleur struct. : ${esc(p.couleur_structure)}`);

  let stairDesc = '';
  if (p.escalier && p.escalier_type) {
    const STF: Record<string, string> = { droit: 'Droit', roman: 'Roman', angle: 'Angle', autre: 'Autre' };
    stairDesc = (STF[p.escalier_type] || p.escalier_type)
      + ` · ${p.escalier_position === 'exterieur' ? 'Ext.' : 'Int.'}`
      + (p.escalier_cote ? ` · ${p.escalier_cote}` : '')
      + (p.escalier_coin ? ` · ${CL[p.escalier_coin] || p.escalier_coin}` : '')
      + (p.escalier_largeur && p.escalier_type !== 'autre' && p.escalier_type !== 'angle' ? ` · ${p.escalier_largeur}m` : '')
      + (p.escalier_description ? ` · ${p.escalier_description}` : '');
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>[${esc(p.priorite)}] ${esc(p.prenom)} ${esc(p.nom)}</title></head>
<body style="margin:0;padding:0;background:#f2f2f0;font-family:'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f0"><tr><td style="padding:28px 16px" align="center">

<table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">

  <!-- Header -->
  <tr><td style="background:#111;padding:18px 28px">
    <table cellpadding="0" cellspacing="0" width="100%"><tr>
      <td style="vertical-align:middle">
        <span style="background:${isUrgent ? '#dc2626' : '#16a34a'};color:#fff;font-size:10px;font-weight:800;padding:4px 12px;border-radius:20px;letter-spacing:.08em;text-transform:uppercase">${esc(p.priorite)}</span>
        <span style="color:rgba(255,255,255,.35);font-size:11px;margin-left:10px">${ref}</span>
      </td>
      <td style="text-align:right;vertical-align:middle;color:rgba(255,255,255,.5);font-size:11px">${fmt(p.timestamp)}</td>
    </tr></table>
  </td></tr>

  <!-- Accent -->
  <tr><td style="height:3px;background:${isUrgent ? 'linear-gradient(90deg,#dc2626,#ff4444,#dc2626)' : 'linear-gradient(90deg,#c9a96e,#dfc088,#c9a96e)'};font-size:0;line-height:0">&nbsp;</td></tr>

  <!-- Lead summary -->
  <tr><td style="padding:22px 28px 0">
    <p style="margin:0;font-size:22px;font-weight:700;color:#111;letter-spacing:-.02em">${esc(p.prenom)} ${esc(p.nom)}</p>
    <p style="margin:4px 0 0;font-size:13px;color:#888">${esc(CAT_LABEL[p.categorie] || p.categorie)}${p.produit_label ? ` · <strong style="color:#555">${esc(p.produit_label)}</strong>` : ''} · ${esc(p.departement)}</p>
  </td></tr>

  <!-- CTA buttons -->
  <tr><td style="padding:16px 28px 0">
    <table cellpadding="0" cellspacing="0" width="100%"><tr>
      <td style="padding-right:6px;width:60%">
        <a href="tel:${esc(p.tel)}" style="display:block;background:#111;color:#fff;font-size:14px;font-weight:700;padding:12px 0;border-radius:8px;text-decoration:none;text-align:center">
          📞&nbsp; ${esc(p.tel)}
        </a>
      </td>
      <td style="padding-left:6px;width:40%">
        <a href="mailto:${esc(p.email)}" style="display:block;background:#f5f5f3;color:#111;font-size:13px;font-weight:600;padding:12px 0;border-radius:8px;text-decoration:none;text-align:center">
          ✉&nbsp; Email
        </a>
      </td>
    </tr></table>
  </td></tr>

  <!-- Data sections -->
  <tr><td style="padding:22px 28px 0">

    <p style="margin:0 0 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#c9a96e;border-bottom:1px solid #f0efe8;padding-bottom:8px">Contact</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px">
      ${iRow('Nom', `<strong>${esc(p.prenom)} ${esc(p.nom)}</strong>`)}
      ${iRow('Téléphone', `<a href="tel:${esc(p.tel)}" style="color:#111;text-decoration:none;font-weight:700">${esc(p.tel)}</a>`)}
      ${iRow('Email', `<a href="mailto:${esc(p.email)}" style="color:#111;text-decoration:none">${esc(p.email)}</a>`)}
      ${p.source ? iRow('Source', esc(p.source)) : ''}
    </table>

    <p style="margin:0 0 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#c9a96e;border-bottom:1px solid #f0efe8;padding-bottom:8px">Bassin</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px">
      ${iRow('Forme', esc(FL[p.forme] || p.forme_label || 'Rectangulaire'))}
      ${p.forme !== 'libre' ? iRow('Dimensions', `<strong>${p.longueur.toFixed(1).replace('.', ',')} × ${p.largeur.toFixed(1).replace('.', ',')} m</strong> — ${p.surface} m²`) : ''}
      ${iRow('Emplacement', esc(p.emplacement))}
      ${stairDesc ? iRow('Escalier', esc(stairDesc)) : ''}
      ${p.filtration_hors_bord ? iRow('Filtration HB', '✓') : ''}
      ${p.description_forme ? iRow('Forme libre', esc(p.description_forme)) : ''}
      ${p.plan_filename ? iRow(p.piece_jointe_type === 'photo' ? 'Photo piscine' : 'Plan / fichier', `📎 ${esc(p.plan_filename)}`) : ''}
    </table>

    <p style="margin:0 0 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#c9a96e;border-bottom:1px solid #f0efe8;padding-bottom:8px">Équipement</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px">
      ${iRow('Catégorie', esc(CAT_LABEL[p.categorie] || p.categorie))}
      ${p.produit_label ? iRow('Modèle', `<strong>${esc(p.produit_label)}</strong>`) : ''}
      ${isCS && p.membrane_label ? iRow('Membrane', `${esc(p.membrane_label)} · ${esc(p.membrane_ral || '')}`) : ''}
      ${isCS && p.habillage_label ? iRow('Habillage', `${esc(p.habillage_label)} · ${esc(p.habillage_ral || '')}`) : ''}
      ${isCS && covOpts.length ? iRow('Options', covOpts.join(', ')) : ''}
      ${isShl && shlOpts.length ? iRow('Options', shlOpts.join(', ')) : ''}
      ${p.prestation_souhaitee ? iRow('Prestation', esc(p.prestation_souhaitee)) : ''}
      ${p.support_bassin ? iRow('Support', esc(p.support_bassin)) : ''}
      ${p.margelles ? iRow('Margelles', esc(p.margelles)) : ''}
      ${p.plage_mecanisme ? iRow('Plage mécanisme', esc(p.plage_mecanisme)) : ''}
      ${p.alimentation_electrique ? iRow('Électricité', esc(p.alimentation_electrique)) : ''}
      ${p.couleur_produit ? iRow('Coloris produit', esc(p.couleur_produit)) : ''}
      ${p.cote_guidage ? iRow('Côté guidage Oré', esc(p.cote_guidage)) : ''}
      ${p.integration_volet ? iRow('Intégration volet', esc(p.integration_volet)) : ''}
      ${p.qualification_complete ? iRow('Qualification technique', esc(p.qualification_complete)) : ''}
      ${p.informations_manquantes ? iRow('Infos manquantes', esc(p.informations_manquantes)) : ''}
      ${p.options_produit ? iRow('Options produit', esc(p.options_produit)) : ''}
      ${p.prix_estime ? iRow('Estimation', `<strong>≈ ${p.prix_estime.toLocaleString('fr-FR')} ${p.produit.startsWith('ore_') ? '€*' : '€ TTC'}</strong> · ${p.produit.startsWith('ore_') ? 'fiscalité à confirmer' : esc(p.statut_prix || 'indicative')}`) : iRow('Prix', 'Sur devis')}
      ${p.eligibilite ? iRow('Éligibilité', esc(p.eligibilite)) : ''}
      ${p.reference_tarifaire ? iRow('Référence calcul', esc(p.reference_tarifaire)) : ''}
      ${p.donnees_techniques ? iRow('Données moteur', esc(p.donnees_techniques)) : ''}
      ${p.avertissements_tarifaires ? iRow('Points à valider', esc(p.avertissements_tarifaires)) : ''}
    </table>

    <p style="margin:0 0 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#c9a96e;border-bottom:1px solid #f0efe8;padding-bottom:8px">Logistique</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:${p.commentaire ? '18px' : '0'}">
      ${iRow('Département', `<strong>${esc(p.departement)}</strong>`)}
      ${iRow('Délai', `<strong>${esc(p.delai)}</strong>`)}
      ${p.consentement_relances ? iRow('Relances', '<span style="color:#16a34a;font-weight:600">Acceptées ✓</span>') : ''}
    </table>

    ${p.commentaire ? `
    <div style="background:#fffbf0;border-left:3px solid #c9a96e;border-radius:0 8px 8px 0;padding:14px 18px">
      <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#c9a96e">Note du client</p>
      <p style="margin:0;font-size:13.5px;color:#333;line-height:1.7;font-style:italic">"${esc(p.commentaire)}"</p>
    </div>` : ''}

  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:20px 28px;margin-top:16px;background:#fafaf8;border-top:1px solid #f0efe8">
    <p style="margin:0;font-size:11px;color:#bbb;line-height:1.5;text-align:center">
      Réf. ${ref} · Configurateur ${SITE_URL.replace(/^https?:\/\//, '')}
    </p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

// ─── Handler principal ────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  await initKV();

  const allowedOrigin = getAllowedOrigin(req);

  // CORS strict : refuser les origines non autorisées (sauf OPTIONS sans origin = appel server-side)
  if (req.method === 'OPTIONS') {
    if (allowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rejeter les requêtes cross-origin non autorisées
  const origin = req.headers['origin'] as string | undefined;
  if (origin && !allowedOrigin) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Vary', 'Origin');
  }

  // Validation complète du payload
  const validation = validatePayload(req.body);
  if (!validation.ok) {
    return res.status(400).json({ error: 'error' in validation ? validation.error : 'Payload invalide' });
  }
  const p = validation.data;

  // Rate limiting par IP (10 req/min)
  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress) || 'unknown';
  if (await isIpRateLimited(clientIp)) {
    return res.status(429).json({ error: 'Trop de demandes — veuillez patienter une minute.' });
  }

  // Rate limiting par email (1 req/min, persistant via KV si disponible)
  if (await isRateLimited(p.email)) {
    return res.status(429).json({ error: 'Trop de demandes — veuillez patienter une minute.' });
  }

  const from = process.env.FROM_EMAIL || 'xavier@diskoov.fr';
  const internal = process.env.INTERNAL_EMAIL || 'xavier.dispot@diskoov.fr';
  const prodName = p.produit_label || CAT_LABEL[p.categorie] || 'Projet';
  const attachmentTag = p.plan_filename ? (p.piece_jointe_type === 'photo' ? ' + PHOTO' : ' + PJ') : '';

  // Préparer la pièce jointe photo / plan si présente
  const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|webp|pdf)$/i;
  const attachments: Array<{ filename: string; content: Buffer }> = [];
  if (p.plan_base64 && p.plan_filename && ALLOWED_EXTENSIONS.test(p.plan_filename)) {
    try {
      // Format data:image/jpeg;base64,xxxx ou data:application/pdf;base64,xxxx
      const base64Data = p.plan_base64.includes(',') ? p.plan_base64.split(',')[1] : p.plan_base64;
      attachments.push({
        filename: p.plan_filename.replace(/[^\w.\-]/g, '_').slice(0, 100),
        content: Buffer.from(base64Data, 'base64'),
      });
    } catch { /* Pièce jointe invalide — continuer sans */ }
  }

  const ref = genRef();

  const [toProspect, toInternal] = await Promise.allSettled([
    resend.emails.send({
      from: `Diskoov <${from}>`,
      to: [p.email],
      subject: `Votre projet ${prodName} — Confirmation Diskoov`,
      html: prospectHtml(p, ref),
    }),
    resend.emails.send({
      from: `Configurateur Diskoov <${from}>`,
      to: [internal],
      subject: `[${p.priorite}${attachmentTag}] ${p.prenom} ${p.nom} — ${prodName} — ${p.departement}`,
      html: internalHtml(p, ref),
      ...(attachments.length ? { attachments } : {}),
    }),
  ]);

  if (toProspect.status === 'rejected') console.error('[Diskoov] Email prospect KO:', toProspect.reason);
  if (toInternal.status === 'rejected') console.error('[Diskoov] Email interne KO:', toInternal.reason);

  // On répond 200 même si un email fail : le lead est loggé, Xavier sera averti via l'email interne
  return res.status(200).json({
    ok: true,
    prospect: toProspect.status,
    internal: toInternal.status,
  });
}
