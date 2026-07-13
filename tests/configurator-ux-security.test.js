'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var fs = require('node:fs');
var path = require('node:path');
var vm = require('node:vm');

var root = path.resolve(__dirname, '..');
var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('les scripts inline restent syntaxiquement valides', function () {
  var scripts = Array.from(html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi));
  assert.ok(scripts.length > 0);
  scripts.forEach(function (match, index) {
    assert.doesNotThrow(function () {
      new vm.Script(match[1], { filename: 'index-inline-' + (index + 1) + '.js' });
    });
  });
});

test('les pieces jointes sont limitees a 3 Mio et tout echec les efface', function () {
  assert.match(html, /var MAX_ATTACHMENT_BYTES = 3 \* 1024 \* 1024;/);
  assert.match(html, /isPdf[\s\S]{0,320}file\.size > MAX_ATTACHMENT_BYTES/);
  assert.match(html, /prepared\.size > MAX_ATTACHMENT_BYTES/);
  assert.match(html, /function rejectFile\([\s\S]*?clearPreparedFile\(\)[\s\S]*?input\.value = ''/);
  assert.match(html, /img\.onerror = function \(\) \{[\s\S]*?done\(null, false\)/);
  assert.match(html, /reader\.onerror = function \(\) \{[\s\S]*?clearPreparedFile\(\)/);
});

test('dk_last_lead reste un resume sans payload ni base64', function () {
  assert.match(html, /function saveLastLeadSummary\(payload, reference\)/);
  assert.match(html, /reference: String\(reference \|\| ''\)/);
  assert.match(html, /sessionStorage\.setItem\('dk_last_lead', JSON\.stringify\(summary\)\)/);
  assert.doesNotMatch(html, /sessionStorage\.setItem\('dk_last_lead', JSON\.stringify\(payload\)\)/);
  assert.doesNotMatch(html, /var summary = \{[\s\S]{0,800}plan_base64/);
});

test('un dossier logique conserve le meme identifiant', function () {
  assert.match(html, /function ensureDossierId\(\)/);
  assert.match(html, /if \(!S\.dossierId\) S\.dossierId =/);
  assert.match(html, /dossier_id: ensureDossierId\(\)/);
  assert.match(html, /dossier_id: String\(payload\.dossier_id \|\| ''\)/);
  assert.match(html, /S\.dossierId = ''/);
});

test('les retries gardent la file en vol et acquittent seulement un 2xx', function () {
  assert.match(html, /function fetchLeadWithTimeout\([\s\S]*?new AbortController\(\)[\s\S]*?signal: controller\.signal/);
  assert.match(html, /function pendingLeadWithoutAttachment\([\s\S]*?plan_base64: ''/);
  assert.match(html, /body: JSON\.stringify\(pendingLeadWithoutAttachment\(lead\)\)/);
  assert.match(html, /if \(!result\.response\.ok\) \{/);
  assert.match(html, /if \(!isAcceptedLeadResponse\(result\.serverData\)\) return false;/);
  assert.match(html, /removePendingLeadAfterSuccess\(pendingLeadKey\(lead\)\)/);
  assert.match(html, /var PENDING_LEAD_TTL = 48 \* 60 \* 60 \* 1000;/);
  assert.doesNotMatch(html, /Vider imm.diatement pour .viter les doubles retries/);
});

test('send-email est l unique succes canonique et son JSON pilote la confirmation', function () {
  assert.doesNotMatch(html, /DISKOOV_WEBHOOK/);
  assert.match(html, /fetchLeadWithTimeout\('\/api\/send-email'/);
  assert.match(html, /response\.json\(\)/);
  assert.match(html, /serverData\.ref/);
  assert.match(html, /consentement: true/);
  assert.match(html, /function isAcceptedLeadResponse\(serverData\)/);
  assert.match(html, /serverData\.internal === 'fulfilled'/);
  assert.match(html, /serverData\.prospect === 'rejected'/);
  assert.match(html, /confirmation par email n['\u2019]a pas pu \u00eatre envoy\u00e9e/i);
  assert.doesNotMatch(html, /var ref = 'DK-'/);
});

test('le footer et les champs de contact exposent leurs etats accessibles', function () {
  assert.match(html, /id="submit-feedback"[^>]*role="alert"/);
  assert.ok(html.indexOf('id="submit-feedback"') < html.indexOf('id="cta"'));
  assert.match(html, /id="cta"[^>]*aria-busy="false"/);
  assert.match(html, /Envoi en cours\u2026/);
  assert.match(html, /\.cta\.spin\s*\{[\s\S]*?background:\s*var\(--brand\);[\s\S]*?color:\s*#fff/);
  assert.match(html, /id="missing-action"[^>]*onclick="focusFirstMissing\(\)"/);
  ['em', 'ph', 'postal-code'].forEach(function (id) {
    assert.match(html, new RegExp('id="' + id + '"[^>]*aria-invalid="false"[^>]*aria-describedby="' + id + '-err"'));
  });
  assert.match(html, /function validateContactFields\([\s\S]*?firstInvalid\.focus/);
});

test('les controles produit, titres et medias sont structures', function () {
  ['bab', 'volet_hs', 'volet_immerge', 'masterdeck'].forEach(function (product) {
    assert.match(html, new RegExp('<button[^>]+id="op-' + product + '"[^>]+role="radio"'));
  });
  assert.match(html, /function setupLegacyProductKeyboard\([\s\S]*?ArrowRight[\s\S]*?tabIndex/);
  assert.match(html, /<h2 class="sl" id="lbl-shape">/);
  assert.match(html, /<h1 class="st" id="suc-t"/);
  assert.match(html, /id="vi-shl"[^>]*data-src=/);
  assert.match(html, /function ensureLegacyConfiguratorImages\(/);
  assert.match(html, /\.product-media\s*\{[\s\S]*?aspect-ratio:\s*16\s*\/\s*9/);
  assert.match(html, /id="op-volet_hs"[\s\S]{0,240}Sur devis[\s\S]{0,240}pose chiffrée sur devis/);
  assert.match(html, /id="op-volet_immerge"[\s\S]{0,240}Sur devis[\s\S]{0,240}pose chiffrée sur devis/);
});

test('le responsive, le consentement et les qualifications metier sont explicites', function () {
  assert.match(html, /\.root\.success-active/);
  assert.match(html, /@media\s*\(max-height:\s*560px\)\s*and\s*\(orientation:\s*landscape\)/);
  assert.match(html, /function track\(event, params\)\s*\{[\s\S]*?dk_cookie_consent[\s\S]*?accepted/);
  assert.match(html, /product === 'ore_compact' \|\| product === 'ore_essential'[\s\S]{0,600}!S\.electricity/);
  assert.match(html, /Prise \u00e0 port\u00e9e du c\u00e2ble fourni de 10 m/i);
  assert.match(html, /S\.filtration && !S\.oreBlockDecision/);
  assert.match(html, /filtration: S\.filtration/);
  assert.match(html, /Bloc filtration Or\u00e9 : \u00e9tude n\u00e9cessaire/i);
  assert.doesNotMatch(html, /\+ 0\s*(?:&euro;|\u20ac)/);
  assert.match(html, /Les formalit\u00e9s d\u00e9pendent du bassin, de la hauteur, du PLU et de la zone\./i);
  assert.doesNotMatch(html, /garantie de 3 ans/i);
  assert.doesNotMatch(html, /conservées?\s+3\s+ans/i);
  assert.match(html, /La durée de conservation est précisée dans la politique de/);
});

test('les primitives et metadonnees suivent la direction Diskoov', function () {
  assert.match(html, /--brand:\s*#1f407c;/);
  assert.match(html, /--accent:\s*#f37021;/);
  assert.match(html, /\.d-btn\s*\{[\s\S]*?min-width:\s*40px;[\s\S]*?min-height:\s*40px/);
  assert.match(html, /\.tog\s*\{[\s\S]*?min-width:\s*44px;[\s\S]*?min-height:\s*40px/);
  assert.doesNotMatch(html, /og-configurateur\.jpg|logo-diskoov\.png/);
  assert.match(html, /og:image" content="https:\/\/configurateur\.diskoov\.fr\/assets\/produits\/conseiller\/ore-fermee\.webp/);
  assert.match(html, /og:image:height" content="753"/);
  assert.match(html, /rel="preload" as="image" href="assets\/produits\/conseiller\/ore-fermee-800\.webp"/);
  assert.match(html, /imagesrcset="assets\/produits\/conseiller\/ore-fermee-800\.webp 800w, assets\/produits\/conseiller\/ore-fermee\.webp 1400w"/);
  assert.equal(fs.existsSync(path.join(root, 'assets', 'produits', 'conseiller', 'ore-fermee-800.webp')), true);
  assert.match(html, /id="visual-lightbox-img"[\s\S]{0,180}width="1" height="1"/);
  assert.equal(fs.existsSync(path.join(root, 'assets', 'produits', 'conseiller', 'ore-fermee.webp')), true);
});
