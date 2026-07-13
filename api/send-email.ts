import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'node:crypto';
import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.error('[Diskoov] RESEND_API_KEY manquante — les emails ne seront pas envoyés');
}
const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Contact (éditables via variables d'environnement Vercel) ────────────────
const PUBLIC_CONTACT_NAME = process.env.PUBLIC_CONTACT_NAME || "l'équipe Diskoov";
const PUBLIC_CONTACT_EMAIL = process.env.PUBLIC_CONTACT_EMAIL || 'contact@diskoov.fr';
const CONTACT_PHONE = process.env.CONTACT_PHONE || '06 20 54 25 04';
const CONTACT_LOC = process.env.CONTACT_LOC || 'Conseil et étude personnalisée';
const CONTACT_ADDR = process.env.CONTACT_ADDR || '494, rue Léon Blum 34 000 Montpellier';
const SITE_URL = process.env.SITE_URL || 'https://diskoov.fr';
const LOGO_URL = process.env.LOGO_URL || 'https://configurateur.diskoov.fr/assets/marque/logo-diskoov-bleu-orange.png';

// ─── Origines autorisées (contrôle navigateur CORS, pas authentification) ────
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
type CategoryId = 'cov' | 'shl' | 'oth';
type ShapeId = 'rect' | 'oval' | 'libre';

interface ValidatedAttachment {
  filename: string;
  content: Buffer;
  kind: 'photo' | 'plan';
}

interface LeadPayload {
  dossier_id: string;
  prenom: string;
  nom: string;
  email: string;
  tel: string;
  code_postal: string;
  ville: string;
  statut_projet?: string;
  acces_chantier?: string;
  budget_projet?: string;
  preference_contact?: string;
  advisor_mode?: string;
  advisor_priorites?: string;
  advisor_recommandations?: string;
  advisor_raison_choix?: string;
  advisor_dimensions_connues?: boolean;
  advisor_version?: string;
  source?: string;
  forme: ShapeId;
  forme_label: string;
  categorie: CategoryId;
  produit: string;
  produit_label: string;
  longueur: number | null;
  largeur: number | null;
  surface: number | null;
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
  attachment?: ValidatedAttachment;
  consentement: true;
  consentement_relances?: boolean;
  priorite: 'URGENT' | 'NORMAL';
  timestamp: string;
}

// ─── Validation serveur complète ──────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^0[1-9]\d{8}$/;
const POSTAL_CODE_RE = /^\d{5}$/;
const CITY_RE = /^[\p{L}\p{M}\d][\p{L}\p{M}\d .,'’()\/-]*$/u;
const VALID_CATS = ['cov', 'shl', 'oth'] as const;
const VALID_PRIO = ['URGENT', 'NORMAL'] as const;
const CLIENT_DOSSIER_RE = /^DKCLIENT-[A-Za-z0-9_-]{16,80}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KEY_DERIVATION_SECRET = process.env.KEY_DERIVATION_SECRET || process.env.RESEND_API_KEY;

const FORM_LABELS: Record<ShapeId, string> = {
  rect: 'Rectangulaire',
  oval: 'Ovale / ronde',
  libre: 'Forme libre',
};

const PRODUCT_CATALOG: Record<string, { categorie: CategoryId; label: string }> = {
  auto: { categorie: 'cov', label: 'Coverseal Automatique' },
  semi: { categorie: 'cov', label: 'Coverseal Semi-Automatique' },
  ore_compact: { categorie: 'cov', label: 'Oré Compact' },
  ore_essential: { categorie: 'cov', label: 'Oré Essential' },
  eden: { categorie: 'cov', label: 'Couverture Eden' },
  ul: { categorie: 'shl', label: 'Abri Master Ultra Bas 1.2' },
  m18: { categorie: 'shl', label: 'Abri Master 18' },
  m30: { categorie: 'shl', label: 'Abri Master 30' },
  m50: { categorie: 'shl', label: 'Abri Master Bas 5.0' },
  mid: { categorie: 'shl', label: 'Abri Mi-haut' },
  bab: { categorie: 'oth', label: 'Bâche à barres Secu Classic' },
  volet_hs: { categorie: 'oth', label: 'Volet hors-sol' },
  volet_immerge: { categorie: 'oth', label: 'Volet immergé' },
  masterdeck: { categorie: 'oth', label: 'Terrasse mobile MasterDeck' },
};

const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;
const BASE64_RE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const ATTACHMENT_TYPES: Record<string, { mime: string; kind: 'photo' | 'plan' }> = {
  jpg: { mime: 'image/jpeg', kind: 'photo' },
  jpeg: { mime: 'image/jpeg', kind: 'photo' },
  png: { mime: 'image/png', kind: 'photo' },
  webp: { mime: 'image/webp', kind: 'photo' },
  pdf: { mime: 'application/pdf', kind: 'plan' },
};

function storageKey(scope: string, value: string): string {
  if (!KEY_DERIVATION_SECRET) {
    throw new Error('KEY_DERIVATION_SECRET ou RESEND_API_KEY doit être configurée');
  }
  const digest = createHmac('sha256', KEY_DERIVATION_SECRET)
    .update(`${scope}\0${value}`)
    .digest('hex');
  return `dk_${scope}:${digest}`;
}

function hasAttachmentMagic(content: Buffer, extension: string): boolean {
  if (extension === 'jpg' || extension === 'jpeg') {
    return content.length >= 3 && content[0] === 0xff && content[1] === 0xd8 && content[2] === 0xff;
  }
  if (extension === 'png') {
    return content.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (extension === 'webp') {
    return content.length >= 12
      && content.subarray(0, 4).toString('ascii') === 'RIFF'
      && content.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  return extension === 'pdf' && content.subarray(0, 5).toString('ascii') === '%PDF-';
}

function validateAttachment(b: Record<string, unknown>):
  { ok: true; attachment?: ValidatedAttachment } | { ok: false; error: string } {
  for (const field of ['plan_filename', 'plan_base64', 'piece_jointe_type', 'photo_filename'] as const) {
    if (b[field] !== undefined && b[field] !== null && typeof b[field] !== 'string') {
      return { ok: false, error: 'Pièce jointe invalide : métadonnées incorrectes' };
    }
  }

  const rawFilename = typeof b.plan_filename === 'string' ? b.plan_filename.trim() : '';
  const dataUrl = typeof b.plan_base64 === 'string' ? b.plan_base64.trim() : '';
  const requestedKind = typeof b.piece_jointe_type === 'string' ? b.piece_jointe_type.trim() : '';
  const photoFilename = typeof b.photo_filename === 'string' ? b.photo_filename.trim() : '';
  if (!rawFilename && !dataUrl && !requestedKind && !photoFilename) return { ok: true };
  if (!rawFilename || !dataUrl) {
    return { ok: false, error: 'Pièce jointe invalide : fichier et contenu sont requis ensemble' };
  }
  if (rawFilename.length > 255) {
    return { ok: false, error: 'Pièce jointe invalide : nom de fichier trop long' };
  }
  if (requestedKind && requestedKind !== 'photo' && requestedKind !== 'plan') {
    return { ok: false, error: 'Pièce jointe invalide : type inconnu' };
  }

  const extensionMatch = rawFilename.match(/\.([a-z0-9]+)$/i);
  const extension = extensionMatch?.[1].toLowerCase();
  const expectedType = extension ? ATTACHMENT_TYPES[extension] : undefined;
  if (!extension || !expectedType) {
    return { ok: false, error: 'Pièce jointe invalide : extension non autorisée' };
  }

  const dataUrlMatch = dataUrl.match(/^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!dataUrlMatch) {
    return { ok: false, error: 'Pièce jointe invalide : data URL base64 requise' };
  }
  const [, mime, base64Data] = dataUrlMatch;
  if (mime !== expectedType.mime) {
    return { ok: false, error: 'Pièce jointe invalide : MIME et extension incohérents' };
  }
  if (requestedKind && requestedKind !== expectedType.kind) {
    return { ok: false, error: 'Pièce jointe invalide : nature du fichier incohérente' };
  }
  if (photoFilename && (expectedType.kind !== 'photo' || photoFilename !== rawFilename)) {
    return { ok: false, error: 'Pièce jointe invalide : nom de photo incohérent' };
  }
  if (!BASE64_RE.test(base64Data) || base64Data.length % 4 !== 0) {
    return { ok: false, error: 'Pièce jointe invalide : base64 incorrect' };
  }
  if (base64Data.length > Math.ceil(MAX_ATTACHMENT_BYTES / 3) * 4) {
    return { ok: false, error: 'Pièce jointe trop volumineuse (maximum 3 Mio)' };
  }

  const content = Buffer.from(base64Data, 'base64');
  if (!content.length || content.length > MAX_ATTACHMENT_BYTES) {
    return { ok: false, error: 'Pièce jointe trop volumineuse ou vide (maximum 3 Mio)' };
  }
  if (content.toString('base64') !== base64Data) {
    return { ok: false, error: 'Pièce jointe invalide : base64 non canonique' };
  }
  if (!hasAttachmentMagic(content, extension)) {
    return { ok: false, error: 'Pièce jointe invalide : signature de fichier incohérente' };
  }

  const maxStemLength = 99 - extension.length;
  const safeStem = rawFilename.slice(0, -(extension.length + 1))
    .replace(/[^\w.-]/g, '_')
    .slice(0, maxStemLength) || 'piece-jointe';
  return {
    ok: true,
    attachment: {
      filename: `${safeStem}.${extension}`,
      content,
      kind: expectedType.kind,
    },
  };
}

function dimensionIsUnknown(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'number') return value === 0;
  if (typeof value === 'string') return !value.trim() || Number(value) === 0;
  return false;
}

function validatePayload(p: unknown): { ok: true; data: LeadPayload } | { ok: false; error: string } {
  if (!p || typeof p !== 'object') return { ok: false, error: 'Payload invalide' };
  const b = p as Record<string, unknown>;

  if (b.website !== undefined && (typeof b.website !== 'string' || b.website.trim())) {
    return { ok: false, error: 'Payload invalide' };
  }

  // Champs texte obligatoires
  for (const f of ['dossier_id', 'prenom', 'nom', 'email', 'tel', 'code_postal', 'ville', 'departement', 'delai', 'produit', 'emplacement', 'priorite', 'categorie', 'timestamp'] as const) {
    if (typeof b[f] !== 'string' || !(b[f] as string).trim()) {
      return { ok: false, error: `Champ manquant ou invalide : ${f}` };
    }
  }

  if (b.consentement !== true) {
    return { ok: false, error: 'Consentement principal obligatoire' };
  }

  const dossierId = (b.dossier_id as string).trim();
  if (!CLIENT_DOSSIER_RE.test(dossierId) && !UUID_RE.test(dossierId)) {
    return { ok: false, error: 'Identifiant de dossier invalide' };
  }

  if (!EMAIL_RE.test(b.email as string)) return { ok: false, error: 'Email invalide' };

  const codePostal = (b.code_postal as string).trim();
  if (!POSTAL_CODE_RE.test(codePostal)) return { ok: false, error: 'Code postal invalide' };

  const ville = (b.ville as string).trim().replace(/\s+/g, ' ');
  if (ville.length > 100 || !CITY_RE.test(ville)) return { ok: false, error: 'Ville invalide' };

  const timestamp = (b.timestamp as string).trim().slice(0, 40);
  const timestampMs = Date.parse(timestamp);
  if (!Number.isFinite(timestampMs)) {
    return { ok: false, error: 'Horodatage invalide' };
  }

  // Validation téléphone français (10 chiffres commençant par 0)
  const cleanedTel = (b.tel as string).replace(/\s/g, '');
  if (!PHONE_RE.test(cleanedTel)) {
    return { ok: false, error: 'Numéro de téléphone invalide' };
  }

  if (!VALID_CATS.includes(b.categorie as CategoryId)) return { ok: false, error: 'Catégorie invalide' };
  if (!VALID_PRIO.includes(b.priorite as 'URGENT' | 'NORMAL')) return { ok: false, error: 'Priorité invalide' };

  if (typeof b.forme !== 'string' || !Object.prototype.hasOwnProperty.call(FORM_LABELS, b.forme)) {
    return { ok: false, error: 'Forme invalide' };
  }
  const forme = b.forme as ShapeId;

  const produit = (b.produit as string).trim();
  if (!Object.prototype.hasOwnProperty.call(PRODUCT_CATALOG, produit)) {
    return { ok: false, error: 'Produit invalide' };
  }
  const product = PRODUCT_CATALOG[produit];
  if (product.categorie !== b.categorie) {
    return { ok: false, error: 'Produit incompatible avec la catégorie' };
  }

  const longueurInconnue = dimensionIsUnknown(b.longueur);
  const largeurInconnue = dimensionIsUnknown(b.largeur);
  if (forme !== 'libre' && (longueurInconnue || largeurInconnue)) {
    return { ok: false, error: 'Dimensions obligatoires pour cette forme' };
  }
  if (longueurInconnue !== largeurInconnue) {
    return { ok: false, error: 'Longueur et largeur doivent être renseignées ensemble' };
  }

  const lon = longueurInconnue ? null : Number(b.longueur);
  const lar = largeurInconnue ? null : Number(b.largeur);
  if (lon !== null && (!Number.isFinite(lon) || lon < 1 || lon > 50)) {
    return { ok: false, error: 'Longueur invalide (1–50 m)' };
  }
  if (lar !== null && (!Number.isFinite(lar) || lar < 1 || lar > 25)) {
    return { ok: false, error: 'Largeur invalide (1–25 m)' };
  }

  const attachmentValidation = validateAttachment(b);
  if ('error' in attachmentValidation) {
    return { ok: false, error: attachmentValidation.error };
  }

  // Champs optionnels : sanitiser les strings
  const sanitizeStr = (v: unknown) => typeof v === 'string' ? v.slice(0, 500) : undefined;
  const sanitizeLongStr = (v: unknown) => typeof v === 'string' ? v.slice(0, 2000) : undefined;
  const sanitizeBool = (v: unknown) => typeof v === 'boolean' ? v : undefined;
  const sanitizeOptionalStr = (v: unknown, maxLength = 500) => {
    if (typeof v !== 'string') return undefined;
    const value = v.trim().slice(0, maxLength);
    return value || undefined;
  };

  // Une forme libre n'est jamais assimilée à un rectangle pour calculer sa surface.
  const surf = lon === null || lar === null || forme === 'libre'
    ? null
    : forme === 'oval'
      ? Math.round(Math.PI * (lon / 2) * (lar / 2) * 10) / 10
      : Math.round(lon * lar * 10) / 10;

  return {
    ok: true,
    data: {
      dossier_id: dossierId,
      prenom: (b.prenom as string).trim().slice(0, 100),
      nom: (b.nom as string).trim().slice(0, 100),
      email: (b.email as string).trim().toLowerCase().slice(0, 254),
      tel: (b.tel as string).trim().slice(0, 20),
      code_postal: codePostal,
      ville,
      statut_projet: sanitizeOptionalStr(b.statut_projet),
      acces_chantier: sanitizeOptionalStr(b.acces_chantier),
      budget_projet: sanitizeOptionalStr(b.budget_projet),
      preference_contact: sanitizeOptionalStr(b.preference_contact),
      advisor_mode: sanitizeOptionalStr(b.advisor_mode),
      advisor_priorites: sanitizeOptionalStr(b.advisor_priorites, 2000),
      advisor_recommandations: sanitizeOptionalStr(b.advisor_recommandations, 2000),
      advisor_raison_choix: sanitizeOptionalStr(b.advisor_raison_choix, 2000),
      advisor_dimensions_connues: lon !== null && lar !== null,
      advisor_version: sanitizeOptionalStr(b.advisor_version),
      forme,
      forme_label: FORM_LABELS[forme],
      categorie: b.categorie as CategoryId,
      produit,
      produit_label: product.label,
      longueur: lon === null ? null : Math.round(lon * 10) / 10,
      largeur: lar === null ? null : Math.round(lar * 10) / 10,
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
      timestamp,
      source: sanitizeStr(b.source),
      commentaire: sanitizeStr(b.commentaire),
      description_forme: sanitizeStr(b.description_forme),
      attachment: attachmentValidation.attachment,
      consentement: true,
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
      options_produit: sanitizeLongStr(b.options_produit),
      // Résultats du moteur navigateur volontairement neutralisés jusqu'à un recalcul serveur.
    },
  };
}

// ─── Stockage et rate limiting best-effort ───────────────────────────────────
// Les séquences get/set KV ne sont pas atomiques. Le fallback est local au
// processus, non persistant et non atomique ; il limite seulement les abus simples.
let kv: { get: (k: string) => Promise<unknown>; set: (k: string, v: unknown, opts?: { ex?: number }) => Promise<unknown> } | null = null;
let kvInitialized = false;

async function initKV() {
  if (kvInitialized) return;
  kvInitialized = true;
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const { kv: vercelKv } = await import('@vercel/kv');
      kv = vercelKv;
    } else {
      console.warn('[Diskoov] KV non configuré — fallback mémoire local et non atomique');
    }
  } catch {
    console.warn('[Diskoov] KV indisponible — fallback mémoire local et non atomique');
  }
}

const inMemoryRateMap = new Map<string, number>();
const inMemoryIpRateMap = new Map<string, number[]>();

type ProspectStatus = 'fulfilled' | 'rejected';

interface ProcessedLeadRecord {
  processedAt: number;
  ref: string;
  prospect?: ProspectStatus;
}

interface DossierReferenceRecord {
  createdAt: number;
  ref: string;
}

const LEAD_TTL_SECONDS = 48 * 60 * 60;
const inMemoryLeadSuccessMap = new Map<string, ProcessedLeadRecord>();
const inMemoryDossierReferenceMap = new Map<string, DossierReferenceRecord>();

async function isRateLimited(email: string): Promise<boolean> {
  const key = storageKey('rl_email', email);
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

  const last = inMemoryRateMap.get(key);
  if (last && now - last < 15_000) return true;
  inMemoryRateMap.set(key, now);
  // Nettoyage périodique pour éviter les fuites mémoire
  if (inMemoryRateMap.size > 1000) {
    for (const [k, v] of inMemoryRateMap.entries()) {
      if (now - v > 15_000) inMemoryRateMap.delete(k);
    }
  }
  return false;
}

async function clearEmailRateLimit(email: string): Promise<void> {
  const key = storageKey('rl_email', email);
  inMemoryRateMap.delete(key);
  if (kv) {
    try { await kv.set(key, 0, { ex: 1 }); } catch { /* Le fallback mémoire suffit pour la nouvelle tentative locale. */ }
  }
}

function leadSuccessKey(p: LeadPayload): string {
  return storageKey('lead_ok', p.dossier_id);
}

function isProcessedLeadRecord(value: unknown): value is ProcessedLeadRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<ProcessedLeadRecord>;
  return typeof record.processedAt === 'number'
    && typeof record.ref === 'string'
    && /^DK-[A-F0-9]{6}-[A-F0-9]{6}$/.test(record.ref);
}

async function getProcessedLead(key: string): Promise<ProcessedLeadRecord | null> {
  const inMemory = inMemoryLeadSuccessMap.get(key);
  if (inMemory && Date.now() - inMemory.processedAt < LEAD_TTL_SECONDS * 1000) return inMemory;

  if (kv) {
    try {
      const stored = await kv.get(key);
      if (isProcessedLeadRecord(stored)) {
        inMemoryLeadSuccessMap.set(key, stored);
        return stored;
      }
    } catch { /* Fallback mémoire. */ }
  }
  return null;
}

async function wasLeadProcessed(key: string): Promise<boolean> {
  return Boolean(await getProcessedLead(key));
}

function stageLeadProcessed(key: string, record: ProcessedLeadRecord): void {
  inMemoryLeadSuccessMap.set(key, record);
}

async function markLeadProcessed(key: string): Promise<void> {
  const record = inMemoryLeadSuccessMap.get(key);
  if (!record) throw new Error('Dossier traité sans enregistrement préparé');
  if (inMemoryLeadSuccessMap.size > 1000) {
    for (const [storedKey, storedRecord] of inMemoryLeadSuccessMap.entries()) {
      if (Date.now() - storedRecord.processedAt > LEAD_TTL_SECONDS * 1000) {
        inMemoryLeadSuccessMap.delete(storedKey);
      }
    }
  }
  if (kv) {
    try { await kv.set(key, record, { ex: LEAD_TTL_SECONDS }); } catch { /* Fallback mémoire. */ }
  }
}

async function getDossierReference(dossierId: string): Promise<string> {
  const key = storageKey('lead_ref', dossierId);
  const inMemory = inMemoryDossierReferenceMap.get(key);
  if (inMemory) return inMemory.ref;

  if (kv) {
    try {
      const stored = await kv.get(key);
      if (typeof stored === 'string' && /^DK-[A-F0-9]{6}-[A-F0-9]{6}$/.test(stored)) {
        inMemoryDossierReferenceMap.set(key, { createdAt: Date.now(), ref: stored });
        return stored;
      }
    } catch { /* Référence HMAC déterministe disponible en fallback. */ }
  }

  const ref = genRef(dossierId);
  inMemoryDossierReferenceMap.set(key, { createdAt: Date.now(), ref });
  if (inMemoryDossierReferenceMap.size > 1000) {
    for (const [storedKey, record] of inMemoryDossierReferenceMap.entries()) {
      if (Date.now() - record.createdAt > LEAD_TTL_SECONDS * 1000) {
        inMemoryDossierReferenceMap.delete(storedKey);
      }
    }
  }
  if (kv) {
    try { await kv.set(key, ref, { ex: LEAD_TTL_SECONDS }); } catch { /* Fallback mémoire et HMAC. */ }
  }
  return ref;
}

// ─── Rate limiting par IP (10 req/min, best-effort non atomique) ──────────────

async function isIpRateLimited(ip: string): Promise<boolean> {
  const key = storageKey('rl_ip', ip);
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

  const timestamps = inMemoryIpRateMap.get(key) || [];
  const recent = timestamps.filter(t => now - t < windowMs);
  if (recent.length >= maxRequests) return true;
  recent.push(now);
  inMemoryIpRateMap.set(key, recent);
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

// Référence stable et opaque : même dossier_id + même secret => même référence.
function genRef(dossierId: string): string {
  const digest = storageKey('reference', dossierId).split(':')[1].toUpperCase();
  return `DK-${digest.slice(0, 6)}-${digest.slice(6, 12)}`;
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
  const contactAction = p.preference_contact === 'Email'
    ? 'vous répondra par email'
    : (p.preference_contact === 'Téléphone' ? 'vous appellera' : 'prendra contact avec vous');

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
    pRow('Forme', esc(p.forme_label)),
    p.forme !== 'libre' && p.longueur !== null && p.largeur !== null && p.surface !== null
      ? pRow('Dimensions', `${p.longueur.toFixed(1).replace('.', ',')} &times; ${p.largeur.toFixed(1).replace('.', ',')} m &mdash; ${p.surface} m²`)
      : '',
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
    p.prix_estime ? pRow('Estimation configurateur', `≈ ${p.prix_estime.toLocaleString('fr-FR')} € TTC <span style="color:#999;font-weight:400">indicative</span>`) : '',
  ].filter(Boolean).join('');

  const projectRows = [
    pRow('Localisation', `${esc(p.code_postal)} ${esc(p.ville)}`),
    p.statut_projet ? pRow('Avancement du projet', esc(p.statut_projet)) : '',
    p.advisor_priorites ? pRow('Vos priorités', esc(p.advisor_priorites)) : '',
    p.preference_contact ? pRow('Préférence de contact', esc(p.preference_contact)) : '',
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
    <h1 style="margin:0 0 14px;font-size:24px;font-weight:700;color:#111;letter-spacing:-.03em;line-height:1.3">Merci ${esc(p.prenom)}, votre demande a bien été reçue.</h1>
    <p style="margin:0;font-size:14.5px;color:#555;line-height:1.8">
      ${esc(PUBLIC_CONTACT_NAME)} ${contactAction} pour échanger sur votre projet et préparer une étude personnalisée.
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
      ${projectRows}
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
            <p style="margin:0 0 3px;font-size:10px;color:#c9a96e;font-weight:700;text-transform:uppercase;letter-spacing:.1em">Votre équipe conseil</p>
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
          <strong style="color:#111">${esc(PUBLIC_CONTACT_NAME)} reprend contact avec vous</strong> selon la préférence indiquée pour préciser votre projet.
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
          <strong style="color:#111">Préparation de la pose</strong> si elle est retenue, après confirmation du support et des accès.
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- ▼ SIGNATURE -->
  <tr><td style="padding:28px 40px 36px">
    <p style="margin:0;font-size:14.5px;color:#555;line-height:1.8">
      À bientôt,<br>
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
          <a href="mailto:${PUBLIC_CONTACT_EMAIL}" style="color:rgba(255,255,255,.4);text-decoration:none">${esc(PUBLIC_CONTACT_EMAIL)}</a>
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

  const hasAdvisorContext = Boolean(
    p.statut_projet
    || p.budget_projet
    || p.advisor_mode
    || p.advisor_priorites
    || p.advisor_recommandations
    || p.advisor_raison_choix
    || p.advisor_version
    || typeof p.advisor_dimensions_connues === 'boolean'
  );

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
    <p style="margin:4px 0 0;font-size:13px;color:#888">${esc(CAT_LABEL[p.categorie] || p.categorie)}${p.produit_label ? ` · <strong style="color:#555">${esc(p.produit_label)}</strong>` : ''} · ${esc(p.code_postal)} ${esc(p.ville)}</p>
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
      ${p.preference_contact ? iRow('Préférence de contact', esc(p.preference_contact)) : ''}
      ${p.source ? iRow('Source', esc(p.source)) : ''}
    </table>

    <p style="margin:0 0 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#c9a96e;border-bottom:1px solid #f0efe8;padding-bottom:8px">Bassin</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px">
      ${iRow('Forme', esc(p.forme_label))}
      ${p.forme !== 'libre' && p.longueur !== null && p.largeur !== null && p.surface !== null ? iRow('Dimensions', `<strong>${p.longueur.toFixed(1).replace('.', ',')} × ${p.largeur.toFixed(1).replace('.', ',')} m</strong> — ${p.surface} m²`) : ''}
      ${iRow('Emplacement', esc(p.emplacement))}
      ${stairDesc ? iRow('Escalier', esc(stairDesc)) : ''}
      ${p.filtration_hors_bord ? iRow('Filtration HB', '✓') : ''}
      ${p.description_forme ? iRow('Forme libre', esc(p.description_forme)) : ''}
      ${p.attachment ? iRow(p.attachment.kind === 'photo' ? 'Photo piscine' : 'Plan / fichier', `📎 ${esc(p.attachment.filename)}`) : ''}
    </table>

    ${hasAdvisorContext ? `
    <p style="margin:0 0 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#c9a96e;border-bottom:1px solid #f0efe8;padding-bottom:8px">Contexte du conseil</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px">
      ${p.statut_projet ? iRow('Statut projet', esc(p.statut_projet)) : ''}
      ${p.budget_projet ? iRow('Budget projet', esc(p.budget_projet)) : ''}
      ${p.advisor_mode ? iRow('Mode du conseil', esc(p.advisor_mode)) : ''}
      ${p.advisor_priorites ? iRow('Priorités', esc(p.advisor_priorites)) : ''}
      ${p.advisor_recommandations ? iRow('Recommandations', esc(p.advisor_recommandations)) : ''}
      ${p.advisor_raison_choix ? iRow('Raison du choix', esc(p.advisor_raison_choix)) : ''}
      ${typeof p.advisor_dimensions_connues === 'boolean' ? iRow('Dimensions connues', p.advisor_dimensions_connues ? 'Oui' : 'Non') : ''}
      ${p.advisor_version ? iRow('Version du conseil', esc(p.advisor_version)) : ''}
    </table>` : ''}

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
      ${p.prix_estime ? iRow('Estimation', `<strong>≈ ${p.prix_estime.toLocaleString('fr-FR')} € TTC</strong> · ${esc(p.statut_prix || 'indicative')}`) : iRow('Prix', 'Sur devis')}
      ${p.eligibilite ? iRow('Éligibilité', esc(p.eligibilite)) : ''}
      ${p.reference_tarifaire ? iRow('Référence calcul', esc(p.reference_tarifaire)) : ''}
      ${p.donnees_techniques ? iRow('Données moteur', esc(p.donnees_techniques)) : ''}
      ${p.avertissements_tarifaires ? iRow('Points à valider', esc(p.avertissements_tarifaires)) : ''}
    </table>

    <p style="margin:0 0 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#c9a96e;border-bottom:1px solid #f0efe8;padding-bottom:8px">Logistique</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:${p.commentaire ? '18px' : '0'}">
      ${iRow('Localisation', `<strong>${esc(p.code_postal)} ${esc(p.ville)}</strong>`)}
      ${iRow('Département', `<strong>${esc(p.departement)}</strong>`)}
      ${p.acces_chantier ? iRow('Accès chantier', esc(p.acces_chantier)) : ''}
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

  // CORS limite les navigateurs ; l'absence d'Origin reste valide pour les appels server-side.
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
  const dedupeKey = leadSuccessKey(p);

  if (await wasLeadProcessed(dedupeKey)) {
    const processedLead = (await getProcessedLead(dedupeKey))!;
    const prospectRejected = processedLead.prospect !== 'fulfilled';
    return res.status(200).json({
      ok: !prospectRejected,
      status: prospectRejected ? 'partial' : 'deduplicated',
      prospect: prospectRejected ? 'rejected' : 'deduplicated',
      internal: 'fulfilled',
      ref: processedLead.ref,
    });
  }

  const ref = await getDossierReference(p.dossier_id);

  // Rate limiting par IP (10 req/min)
  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress) || 'unknown';
  if (await isIpRateLimited(clientIp)) {
    return res.status(429).json({ ok: false, error: 'Trop de demandes — veuillez patienter une minute.', ref });
  }

  // Rate limiting par email (15 s, persistant via KV si disponible)
  if (await isRateLimited(p.email)) {
    return res.status(429).json({ ok: false, error: 'Trop de demandes — veuillez patienter une minute.', ref });
  }

  const from = process.env.FROM_EMAIL || PUBLIC_CONTACT_EMAIL;
  const internal = process.env.INTERNAL_EMAIL || 'xavier.dispot@diskoov.fr';
  const prodName = p.produit_label || CAT_LABEL[p.categorie] || 'Projet';
  const attachmentTag = p.attachment ? (p.attachment.kind === 'photo' ? ' + PHOTO' : ' + PJ') : '';
  const attachments = p.attachment
    ? [{ filename: p.attachment.filename, content: p.attachment.content }]
    : [];

  let internalResponse;
  try {
    internalResponse = await resend.emails.send({
      from: `Configurateur Diskoov <${from}>`,
      to: [internal],
      subject: `[${p.priorite}${attachmentTag}] ${p.prenom} ${p.nom} — ${prodName} — ${p.departement}`,
      html: internalHtml(p, ref),
      ...(attachments.length ? { attachments } : {}),
    });
  } catch (error) {
    await clearEmailRateLimit(p.email);
    console.error('[Diskoov] Email interne KO:', error);
    return res.status(502).json({ ok: false, error: 'Transmission temporairement indisponible', ref });
  }
  if (internalResponse.error || !internalResponse.data) {
    await clearEmailRateLimit(p.email);
    console.error('[Diskoov] Email interne KO:', internalResponse.error);
    return res.status(502).json({ ok: false, error: 'Transmission temporairement indisponible', ref });
  }

  const processedAt = Date.now();
  stageLeadProcessed(dedupeKey, { processedAt, ref });
  await markLeadProcessed(dedupeKey);

  let prospectStatus: ProspectStatus = 'fulfilled';
  try {
    const prospectResponse = await resend.emails.send({
      from: `Diskoov <${from}>`,
      to: [p.email],
      subject: `Votre projet ${prodName} — Confirmation Diskoov`,
      html: prospectHtml(p, ref),
    });
    if (prospectResponse.error || !prospectResponse.data) {
      prospectStatus = 'rejected';
      console.error('[Diskoov] Email prospect KO:', prospectResponse.error);
    }
  } catch (error) {
    prospectStatus = 'rejected';
    console.error('[Diskoov] Email prospect KO:', error);
  }

  stageLeadProcessed(dedupeKey, { processedAt, ref, prospect: prospectStatus });
  await markLeadProcessed(dedupeKey);
  const partial = prospectStatus === 'rejected';

  return res.status(200).json({
    ok: !partial,
    status: partial ? 'partial' : 'fulfilled',
    prospect: prospectStatus,
    internal: 'fulfilled',
    ref,
  });
}
