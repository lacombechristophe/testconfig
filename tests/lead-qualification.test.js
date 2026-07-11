'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var fs = require('node:fs');
var path = require('node:path');

var root = path.resolve(__dirname, '..');
var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
var advisor = fs.readFileSync(path.join(root, 'advisor-v2.js'), 'utf8');
var advisorCss = fs.readFileSync(path.join(root, 'advisor-v2.css'), 'utf8');
var api = fs.readFileSync(path.join(root, 'api', 'send-email.ts'), 'utf8');

test('le contexte du conseiller suit le prospect jusqu’au payload', function () {
  assert.match(advisor, /setAdvisorContext/);
  assert.match(advisor, /recommendations:\s*recommendations/);
  assert.match(advisor, /choiceReason:\s*choiceReason/);
  assert.match(html, /advisor_priorites:\s*S\.advisorPriorities/);
  assert.match(html, /advisor_recommandations:\s*S\.advisorRecommendations/);
  assert.match(html, /advisor_raison_choix:\s*S\.advisorChoiceReason/);
  assert.match(api, /Contexte du conseil/);
});

test('tous les produits reçoivent le socle de qualification chantier', function () {
  assert.match(html, /function hasTechnicalQualification\(product\)\s*{\s*return !!product;/);
  assert.match(html, /état d’avancement du projet/);
  assert.match(html, /prestation souhaitée/);
  assert.match(html, /support autour du bassin/);
  assert.match(html, /margelles \/ niveau des plages/);
  assert.match(html, /S\.installation === 'fourniture_pose' && !S\.siteAccess/);
});

test('une forme libre exige au moins une description ou un fichier', function () {
  assert.match(html, /S\.shape === 'libre'.*!String\(S\.planDesc \|\| ''\)\.trim\(\).*!S\.planB64/s);
  assert.match(html, /getAllQualificationGaps\(\)\.length/);
});

test('la localisation précise est requise côté navigateur et côté API', function () {
  assert.match(html, /id="postal-code"/);
  assert.match(html, /id="city"/);
  assert.match(html, /code_postal:\s*S\.postalCode/);
  assert.match(html, /ville:\s*S\.city/);
  assert.match(api, /'code_postal', 'ville', 'departement'/);
  assert.match(api, /POSTAL_CODE_RE/);
  assert.match(api, /CITY_RE/);
  assert.match(api, /if \(!PHONE_RE\.test\(cleanedTel\)\)/);
});

test('la largeur globale accepte 2 m et laisse les minimums aux règles produit', function () {
  assert.match(html, /id="d-w"[^>]*min="2"[^>]*max="12"/);
  assert.match(html, /if \(pw >= 2 && pw <= 12\)/);
  assert.match(html, /S\.wid >= 2 && S\.wid <= 12/);
});

test('la localisation ne conserve pas un département devenu incohérent', function () {
  assert.match(html, /autocomplete="address-level1"/);
  assert.match(html, /if \(select\) select\.value = '';\s*S\.dept = '';/);
});

test('le budget reste facultatif et n’entre pas dans les règles tarifaires', function () {
  assert.match(html, /Budget envisagé <span class="field-optional">Facultatif<\/span>/);
  assert.match(html, /budget_projet:\s*BUDGET_LABELS\[S\.projectBudget\]/);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'product-rules.js'), 'utf8'), /projectBudget|budget_projet/);
});

test('la mesure de progression ne transmet aucune valeur de qualification', function () {
  assert.match(html, /track\('config_qualification_field',\s*{\s*field:\s*key,\s*completed:\s*!!value,\s*product:\s*activeProduct\(\)/s);
  assert.doesNotMatch(html, /track\('config_qualification_field',[\s\S]{0,160}\bvalue\s*:/);
  assert.match(html, /qualification_complete:\s*getAllQualificationGaps\(\)\.length === 0/);
  assert.match(html, /advisor_mode:\s*S\.advisorMode === 'Conseil guidé' \? 'guided' : 'direct'/);
});

test('la famille couverture n’affiche aucun prix statique contradictoire', function () {
  assert.match(html, /<span class="pc-n">Couvertures motorisées<\/span>/);
  assert.match(html, /<span class="pc-p">Estimation selon modèle<\/span>/);
  assert.doesNotMatch(html, /dès 11 000 €/i);
  assert.doesNotMatch(html, /box\.dataset\.reference/);
});

test('le CTA recommandé reste visible dans le footer des résultats desktop', function () {
  assert.match(advisor, /recommended \? '<button type="button" class="advisor-button" data-action="choose"/);
  assert.doesNotMatch(advisorCss, /min-width:\s*901px[\s\S]{0,220}data-action='choose'[\s\S]{0,80}display:\s*none/);
});

test('la reprise d’un résultat recalcule la recommandation avant le visuel', function () {
  assert.match(advisor, /if \(state\.screen === 'results' && !state\.results\) \{\s*state\.results = engine\.recommend\(state, rules\);/);
});

test('le brouillon de session restaure seulement la configuration non personnelle', function () {
  var paramsBuilder = html.match(/function buildConfigParams\(\)\s*{[\s\S]*?\n\s*}\n\n\s*function shareConfig/);
  assert.ok(paramsBuilder, 'le sérialiseur de configuration doit rester identifiable');
  assert.match(html, /sessionStorage\.setItem\(CONFIG_DRAFT_KEY/);
  assert.match(html, /CONFIG_DRAFT_TTL/);
  assert.match(html, /explicitFields\.some/);
  assert.match(html, /restoreFromURL\(new URLSearchParams\(draft\.params/);
  ['S.fn', 'S.ln', 'S.em', 'S.ph', 'S.postalCode', 'S.city', 'S.dept', 'S.note', 'S.planB64', 'S.ok'].forEach(function (field) {
    assert.doesNotMatch(paramsBuilder[0], new RegExp(field.replace('.', '\\.')), field + ' ne doit pas être conservé dans le brouillon');
  });
});

test('l’email prospect reste public et ne promet pas un périmètre de pose non validé', function () {
  var prospectTemplate = api.match(/function prospectHtml\([\s\S]*?\n}\n\n\/\/ ─── Email interne/);
  assert.ok(prospectTemplate, 'le modèle d’email prospect doit rester identifiable');
  assert.match(api, /PUBLIC_CONTACT_EMAIL/);
  assert.doesNotMatch(prospectTemplate[0], /Xavier/i);
  assert.doesNotMatch(prospectTemplate[0], /partout en France/i);
  assert.match(prospectTemplate[0], /après confirmation du support et des accès/);
  assert.match(prospectTemplate[0], /p\.preference_contact === 'Email'/);
});

test('la confirmation respecte la préférence de contact choisie', function () {
  assert.match(html, /S\.contactPreference === 'email'/);
  assert.match(html, /Vous recevrez une réponse sous <strong>48 h<\/strong>/);
  assert.match(html, /S\.contactPreference === 'telephone'/);
  assert.match(html, /Vous serez rappelé sous <strong>48 h<\/strong>/);
});

test('l’API ne confirme jamais un lead que l’email interne n’a pas reçu', function () {
  assert.doesNotMatch(api, /Promise\.allSettled/);
  assert.match(api, /internalResponse\.error \|\| !internalResponse\.data/);
  assert.match(api, /return res\.status\(502\)\.json\(\{ ok: false/);
  assert.match(api, /await markLeadProcessed\(dedupeKey\)/);
  assert.match(api, /if \(await wasLeadProcessed\(dedupeKey\)\)/);
  assert.match(api, /prospectResponse\.error \|\| !prospectResponse\.data/);
});

test('le filet local conserve un lead même si la pièce jointe dépasse le quota', function () {
  assert.match(html, /queuePendingLead\(payload\)/);
  assert.match(html, /function pendingLeadWithoutAttachment\(payload\)/);
  assert.match(html, /plan_base64:\s*''/);
  assert.match(html, /lightweightLeads\.map\(pendingLeadWithoutAttachment\)/);
});

test('la comparaison garde ses icones centrees et son badge dans la copie', function () {
  assert.match(advisor, /class="advisor-family-overview-copy"[\s\S]*?\+ \(index === 0 \? '<small>Piste prioritaire<\/small>' : ''\) \+ '<\/div><\/article>'/);
  assert.doesNotMatch(advisorCss, /\.advisor-family-overview-item small\s*\{[^}]*grid-column/);
  assert.doesNotMatch(advisorCss, /\.advisor-family-overview-item span\s*[,\{]/);
  assert.match(advisorCss, /\.advisor-family-overview-icon svg\s*\{[^}]*display:\s*block/);
});

test('l entete d accueil conserve un espace sous le bouton d acces direct', function () {
  assert.match(advisorCss, /\.advisor-shell\[data-screen='welcome'\] \.advisor-header\s*\{\s*padding-bottom:\s*12px;/);
});
