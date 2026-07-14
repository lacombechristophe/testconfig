'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var fs = require('node:fs');
var path = require('node:path');
var vm = require('node:vm');

var root = path.resolve(__dirname, '..');
var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
var advisor = fs.readFileSync(path.join(root, 'advisor-v2.js'), 'utf8');
var advisorCss = fs.readFileSync(path.join(root, 'advisor-v2.css'), 'utf8');
var advisorWorkflowCss = fs.readFileSync(path.join(root, 'advisor-workflow-v7.css'), 'utf8');
var configuratorWorkflow = fs.readFileSync(path.join(root, 'configurator-workflow-v2.js'), 'utf8');
var api = fs.readFileSync(path.join(root, 'api', 'send-email.ts'), 'utf8');

test('tous les scripts intégrés à la page restent syntaxiquement valides', function () {
  var scripts = Array.from(html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi));
  assert.ok(scripts.length > 0);
  scripts.forEach(function (match, index) {
    assert.doesNotThrow(function () {
      new vm.Script(match[1], { filename: 'index-inline-' + (index + 1) + '.js' });
    });
  });
});

test('un nouveau projet reverrouille les étapes du configurateur', function () {
  assert.match(configuratorWorkflow, /if \(options\.reset\) maxReached = index/);
  assert.match(advisor, /setConfiguratorStage\('basin', \{ focus: false, reset: true \}\)/);
  assert.match(html, /setConfiguratorStage\('basin', \{ focus: false, reset: true \}\)/);
});

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
  assert.match(html, /<span class="pc-p">Selon le modèle<\/span>/);
  assert.doesNotMatch(html, /dès 11 000 €/i);
  assert.doesNotMatch(html, /box\.dataset\.reference/);
});

test('le CTA recommandé reste visible dans le footer des résultats desktop', function () {
  assert.match(advisor, /recommended \? '<button type="button" class="advisor-button" data-action="choose"/);
  assert.doesNotMatch(advisorCss, /min-width:\s*901px[\s\S]{0,220}data-action='choose'[\s\S]{0,80}display:\s*none/);
});

test('les actions du détail produit restent parfaitement alignées', function () {
  assert.match(advisorWorkflowCss, /\.advisor-detail-footer\s*\{[^}]*align-items:\s*start;/);
  assert.match(advisorWorkflowCss, /\.advisor-detail-footer\s*>\s*\.advisor-info-button\s*\{[^}]*min-height:\s*54px;/);
  assert.match(advisorWorkflowCss, /\.advisor-detail-offer\s*\{[^}]*align-self:\s*center;/);
});

test('la vue des solutions précède le produit principal et le comparatif reste facultatif', function () {
  var resultsTemplate = advisor.match(/function resultsTemplate\(\)[\s\S]*?\n\s*function resultsOverviewTemplate/);
  assert.ok(resultsTemplate, 'le rendu des résultats doit rester identifiable');
  assert.ok(resultsTemplate[0].indexOf('resultsOverviewTemplate(top)') < resultsTemplate[0].indexOf('primaryResultTemplate(primary)'));
  assert.match(resultsTemplate[0], /state\.compare && top\.length > 1 \? compareTemplate\(top\)/);
  assert.doesNotMatch(resultsTemplate[0], /familyOverviewTemplate/);
  assert.match(advisor, /class="advisor-result-map"/);
  assert.match(resultsTemplate[0], /aria-expanded="' \+ state\.compare/);
  assert.match(advisor, /id="advisor-results-comparison"/);
  assert.match(advisor, /compareButton\.focus\(\{ preventScroll: true \}\)/);
  assert.match(advisor, /criteria = criteria\.filter/);
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
  assert.match(html, /La réponse vous sera envoyée à l’adresse/);
  assert.match(html, /S\.contactPreference === 'telephone'/);
  assert.match(html, /Vous serez rappelé au/);
  assert.doesNotMatch(html, /Réponse sous 48h|contactera sous <strong>48 h|rappelé sous <strong>48 h/);
  var prospectTemplate = api.match(/function prospectHtml\([\s\S]*?\n}\n\n\/\/ ─── Email interne/);
  assert.ok(prospectTemplate);
  assert.doesNotMatch(prospectTemplate[0], /48\s*(?:h|heures)/i);
});

test('le conseiller exige un choix explicite avant d’utiliser les dimensions 8 × 4', function () {
  assert.equal((advisor.match(/dimensionsKnown:\s*null/g) || []).length, 2);
  assert.equal((advisor.match(/length:\s*null/g) || []).length, 2);
  assert.equal((advisor.match(/width:\s*null/g) || []).length, 2);
  assert.match(advisor, /state\.screen === 'pool' && \(!state\.shapeConfirmed \|\| typeof state\.dimensionsKnown !== 'boolean'/);
  assert.match(advisor, /function goNext\(\)[\s\S]*?if \(!dimensionsValid\(\)\) \{[\s\S]*?showDimensionError\(\)/);
  assert.match(advisor, /updateDimensionFeedback\(\);\s*updateFooterOnly\(\);/);
  assert.match(advisor, /firstTabStop = typeof state\.dimensionsKnown !== 'boolean' && value === true/);
  assert.match(advisor, /if \(state\.dimensionsKnown !== true\) return false/);
});

test('le conseiller ne remplace jamais une priorité silencieusement', function () {
  assert.doesNotMatch(advisor, /priorities\.shift\(/);
  assert.match(advisor, /if \(state\.priorities\.length >= 2\) return;/);
  assert.match(advisor, /button\.disabled = limitReached && !selected/);
  assert.match(advisor, /Deux priorités sélectionnées/);
  assert.match(advisor, /class="advisor-hint-count">' \+ state\.priorities\.length \+ '\/2/);
  assert.match(advisorCss, /\.advisor-choice:disabled\s*\{/);
});

test('la forme du bassin doit être confirmée dans les deux parcours', function () {
  assert.equal((advisor.match(/shapeConfirmed:\s*false/g) || []).length, 2);
  assert.match(advisor, /var selected = state\.shapeConfirmed && state\.shape === value/);
  assert.match(advisor, /state\.screen === 'pool' && \(!state\.shapeConfirmed/);
  assert.match(advisor, /if \(key === 'shape'\) state\.shapeConfirmed = true/);
  assert.match(html, /shape:\s*'rect',\s*shapeConfirmed:\s*false/);
  assert.match(html, /class="shape-btn" id="sh-rect" role="radio" aria-checked="false"/);
  assert.match(html, /S\.shapeConfirmed && \(S\.shape === 'libre'/);
  assert.match(html, /shape: S\.shapeConfirmed \? S\.shape : ''/);
  assert.match(html, /setPriceContext\('Votre estimation', 'Choisissez la forme du bassin'\)/);
  assert.match(html, /function updateRuleStatus\(rr\)[\s\S]*?var gaps = getAllQualificationGaps\(\)/);
  assert.match(advisor, /var hasPoolShapeContext = \(source === 'guided' \|\| state\.poolCompleted\) && state\.shapeConfirmed/);
  assert.match(advisor, /clearAdvisorPoolDimensions\(hasPoolShapeContext \? state\.shape : 'rect', hasPoolShapeContext\)/);
  assert.match(html, /clearAdvisorPoolDimensions = function \(shape, shapeConfirmed\)/);
  assert.match(html, /confirmed: shapeConfirmed === true/);
  assert.match(html, /shapeGrid\.addEventListener\('keydown'/);
  assert.match(html, /b\.tabIndex = S\.shapeConfirmed \? \(selected \? 0 : -1\)/);
});

test('la forme ovale utilise un libellé non ambigu', function () {
  assert.match(advisor, /shapeButton\('oval', 'Ovale \/ ronde'\)/);
  assert.match(html, /<span>Ovale \/ ronde<\/span>/);
  assert.match(advisor, /la forme ou les dimensions sortent de sa plage connue/);
  assert.doesNotMatch(advisor + html, /Arrondie/);
});

test('le pied de page distingue estimation, informations manquantes et étude personnalisée', function () {
  assert.match(html, /function setPriceContext\(title, subtitle\)/);
  assert.match(html, /function supportsAutomaticEstimate\(product\)/);
  assert.match(html, /supportsAutomaticEstimate\(product\) \? 'Votre estimation' : 'Votre projet'/);
  assert.match(html, /setP\('À compléter', true\)/);
  assert.match(html, /setPriceContext\('Plage dimensionnelle à vérifier', 'Diskoov étudiera une configuration adaptée'\)/);
  assert.match(html, /setPriceContext\('Étude personnalisée', 'Prix établi après vérification du projet'\)/);
  assert.match(html, /setPriceContext\('Estimation TTC 2026', 'Avant validation technique du projet'\)/);
  assert.match(html, /rr\.eligible === false \? 'Hors plage dimensionnelle connue'/);
  assert.doesNotMatch(html, /Étude personnalisée'\s*\+\s*' · compatibilité à vérifier/);
  assert.doesNotMatch(html, /À vérifier — sur devis/);
});

test('les synchronisations silencieuses ne déclenchent ni toast ni invalidation conseiller', function () {
  var updateDimensions = html.match(/function updD\(options\)([\s\S]*?)function fixD/);
  var selectShape = html.match(/function selShape\(v, options\)([\s\S]*?)\/\* ── DIMENSION PRESETS/);
  assert.ok(updateDimensions);
  assert.ok(selectShape);
  assert.match(updateDimensions[1], /updateDimensionAvailability\(options && options\.silent \? \{ toast: false, notify: false \} : undefined\)/);
  assert.match(selectShape[1], /updateDimensionAvailability\(options && options\.silent \? \{ toast: false, notify: false \} : undefined\)/);
  assert.match(html, /if \(options\.notify !== false\) notifyAdvisorInvalidation/);
  assert.doesNotMatch(html, /dimensions au-delà de la matrice tarifaire actuelle/i);
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
  assert.match(html, /readPendingLeads\(\)\.map\(pendingLeadWithoutAttachment\)/);
  assert.match(html, /body:\s*JSON\.stringify\(pendingLeadWithoutAttachment\(lead\)\)/);
});

test('la vue des solutions garde ses icones centrees et son ordre explicite', function () {
  assert.match(advisor, /class="advisor-result-map-item advisor-prospect--/);
  assert.match(advisor, /class="advisor-result-map-rank" aria-hidden="true">0/);
  assert.match(advisorCss, /\.advisor-result-map-icon\s*\{[\s\S]*?display:\s*grid;[\s\S]*?place-items:\s*center/);
  assert.match(advisorCss, /\.advisor-result-map-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3/);
  assert.match(advisorCss, /\.advisor-result-map-item:first-child\s*\{[\s\S]*?box-shadow:\s*inset 3px 0 0 var\(--advisor-brand\)/);
});

test('la progression expose ses etapes et leur statut aux technologies d assistance', function () {
  assert.match(advisor, /<ol class="advisor-progress-stages/);
  assert.match(advisor, /<li class="advisor-progress-stage[\s\S]*?aria-current="step"/);
  assert.match(advisor, /class="advisor-sr-only">[\s\S]*?(?:en cours|terminé|à venir)/);
  assert.match(advisorCss, /\.advisor-sr-only\s*\{[\s\S]*?clip:\s*rect\(0, 0, 0, 0\)/);
});

test('la direction visuelle conserve une empreinte coherente par famille', function () {
  assert.match(advisor, /class="advisor-choice advisor-choice--/);
  assert.match(advisor, /advisor-compare-card advisor-prospect--/);
  assert.match(advisor, /advisor-compare-product/);
  assert.match(advisorCss, /\.advisor-prospect--covers[\s\S]*?--advisor-family-accent:\s*var\(--advisor-navy\)/);
  assert.match(advisorCss, /\.advisor-prospect--bar-cover[\s\S]*?--advisor-family-accent:\s*var\(--advisor-navy\)/);
  assert.match(advisorCss, /\.advisor-prospect--shutters[\s\S]*?--advisor-family-accent:\s*var\(--advisor-navy\)/);
  assert.match(advisorCss, /\.advisor-prospect--shelters[\s\S]*?--advisor-family-accent:\s*var\(--advisor-navy\)/);
  assert.match(advisorCss, /\.advisor-prospect--deck[\s\S]*?--advisor-family-accent:\s*var\(--advisor-navy\)/);
  assert.doesNotMatch(advisorCss, /--advisor-family-accent:\s*var\(--advisor-(?:water|brass|sage)/);
});

test('la palette moderne garde un repli et les cartes restent lisibles a 320 px', function () {
  assert.match(advisorCss, /--advisor-forest:\s*#1f407c/);
  assert.match(advisorCss, /--advisor-navy:\s*#1f407c/);
  assert.match(advisorCss, /--advisor-brass:\s*#f37021/);
  assert.match(advisorCss, /--advisor-control:\s*#7f8c9f/);
  assert.match(advisorCss, /@supports \(color: oklch\(50% \.1 180\)\)/);
  assert.match(advisorCss, /oklch\(from #1f407c l c h\)/);
  assert.match(advisorCss, /--advisor-focus:[^;]*var\(--advisor-accent-dark\)/);
  assert.match(advisorCss, /@media \(max-width: 360px\)[\s\S]*?\.advisor-family-item,[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/);
});

test('les couleurs fonctionnelles ne se confondent plus avec les familles produit', function () {
  assert.match(advisorCss, /\.advisor-detail-benefits > span\s*\{[\s\S]*?background:\s*var\(--advisor-brand-soft\)/);
  assert.match(advisorCss, /\.advisor-detail-section--notice\s*\{[\s\S]*?background:\s*var\(--advisor-brand-soft\)/);
  assert.match(advisorCss, /\.advisor-detail-proof svg,[\s\S]*?color:\s*var\(--advisor-brand\)/);
  assert.match(advisorCss, /\.advisor-detail-list li::before\s*\{[\s\S]*?border-left-color:\s*var\(--advisor-brand\)/);
  assert.match(advisorCss, /\.advisor-compare-criterion svg,[\s\S]*?color:\s*var\(--advisor-brand\)/);
  assert.match(advisorCss, /\.advisor-google-link > span,[\s\S]*?color:\s*var\(--advisor-brand\)/);
  assert.match(advisorCss, /@media \(max-width: 680px\)[\s\S]*?\.advisor-detail-footer\s*\{[\s\S]*?position:\s*sticky[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/);
});

test('l accueil garde un seul acces direct visible', function () {
  assert.match(advisorCss, /\.advisor-shell\[data-screen='welcome'\] \.advisor-header\s*\{\s*padding-bottom:\s*12px;/);
  assert.match(advisorCss, /\.advisor-shell\[data-screen='welcome'\] \.advisor-help\s*\{\s*display:\s*none;/);
  assert.match(advisor, /class="advisor-button advisor-button--secondary" data-action="direct">Explorer les protections/);
  assert.match(advisorCss, /@media \(max-width: 360px\)[\s\S]*\.advisor-shell\[data-screen='welcome'\] \.advisor-visual\s*\{[\s\S]*?min-height:\s*150px/);
});

test('la reassurance d accueil reste visuelle et factuelle', function () {
  assert.match(advisor, /Quelle protection choisir pour votre piscine&nbsp;\?/);
  assert.match(advisor, /Quelques questions simples suffisent pour comparer les solutions adaptées à votre bassin/);
  assert.match(advisor, /Trouver ma protection/);
  assert.match(advisor, /class="advisor-welcome-reassurance"/);
  assert.match(advisor, /Mesures approximatives/);
  assert.match(advisor, /Sans coordonnées[\s\S]*pour commencer/);
  assert.match(advisor, /Projet confirmé[\s\S]*avec un conseiller/);
  assert.match(advisor, /class="advisor-visual-families"/);
  assert.match(advisor, /4 familles de protections pour votre piscine/);
  assert.match(advisor, /class="advisor-welcome-assurance"/);
  assert.match(advisor, /Un conseiller Diskoov confirme votre projet/);
  assert.match(advisor, /Faisabilité, pose, accès et options avant devis/);
  assert.match(advisor, /class="advisor-button-icon"[\s\S]*?icon\('arrow-right'\)/);
  assert.match(advisor, /advisor-welcome-path-index[\s\S]*?>1<[\s\S]*?>2<[\s\S]*?>3</);
  assert.match(advisorCss, /\.advisor-shell\[data-screen='welcome'\] \.advisor-welcome-path\s*\{[\s\S]*?border-color:\s*#d7e0ea/);
  assert.match(advisorCss, /\.advisor-shell\[data-screen='welcome'\] \.advisor-welcome-proof-grid\s*\{/);
  assert.match(advisorCss, /\.advisor-shell\[data-screen='welcome'\] \.advisor-welcome-assurance,[\s\S]*?\.advisor-shell\[data-screen='welcome'\] \.advisor-google-proof\s*\{[\s\S]*?background:\s*transparent/);
  assert.match(advisorCss, /@media \(max-width: 960px\)[\s\S]*?\.advisor-visual-proof\s*\{\s*display:\s*none/);
  assert.doesNotMatch(advisor + html, /4,8\/5|150\+\s*avis|15\s*ans|Marc D\.|indépendant et objectif|SAV réactif|guide gratuit|réduisez vos coûts/i);
});

test('l accueil expose des preuves verifiables sans promesse universelle', function () {
  assert.match(advisor, /class="advisor-visual-trust"/);
  assert.match(advisor, /Plus de 13 ans[\s\S]*d’expérience piscine/);
  assert.match(advisor, /3 fabricants[\s\S]*partenaires/);
  assert.match(advisor, /Suivi du projet[\s\S]*avec un conseiller/);
  assert.match(advisor, /Un conseiller Diskoov confirme votre projet/);
  assert.match(advisor, /Merci pour vos précieux conseils et votre excellent accompagnement/);
  assert.match(advisor, /quoteAuthor: 'Dagmar S\.'/);
  assert.match(advisor, /· Avis Google/);
  assert.match(advisor, /class="advisor-google-proof"/);
  assert.match(advisor, /class="advisor-google-score"/);
  assert.match(advisor, /class="advisor-google-volume"/);
  assert.match(advisor, /class="advisor-google-quote"/);
  assert.match(advisor, /class="advisor-google-link"/);
  assert.match(advisor, /class="advisor-welcome-products"/);
  assert.match(advisor, /data-action="welcome-family" data-value="covers"/);
  assert.match(advisor, /data-action="welcome-family" data-value="shutters"/);
  assert.match(advisor, /data-action="welcome-family" data-value="shelters"/);
  assert.doesNotMatch(advisor + advisorCss + html, /Guide Diskoov|advisor-welcome-guide|advisor_guide_open|guideUrl|les-erreurs-a-eviter/i);
  assert.doesNotMatch(advisor, /pose incluse pour tous|comparatif indépendant|solutions testées et sélectionnées/i);
});

test('l accueil utilise le portrait officiel et des pictogrammes propres aux familles', function () {
  var portraitPath = 'assets/marque/xavier-dispot-diskoov.jpg';
  assert.equal(fs.existsSync(path.join(root, portraitPath)), true);
  assert.ok(fs.statSync(path.join(root, portraitPath)).size < 50 * 1024, 'le portrait doit rester léger');
  assert.match(advisor, new RegExp(portraitPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(advisor, /cover: '<path d="M5 5\.5h14l3 5\.5H2l3-5\.5Z"/);
  assert.match(advisor, /shutter: '<rect x="2" y="3\.5" width="20" height="16"/);
  assert.match(advisor, /shelter: '<path d="M2\.5 19v-6\.5a6\.5 6\.5/);
  assert.match(advisor, /deck: '<path d="m12 2 11 5\.5L12 13 1 7\.5 12 2Z"/);
  assert.match(advisorCss, /\.advisor-shell\[data-screen='welcome'\] \.advisor-footer\s*\{\s*display:\s*none/);
  assert.match(advisorCss, /@media \(min-width: 961px\) and \(max-width: 1100px\)[\s\S]*?\.advisor-welcome-path > div,[\s\S]*?grid-template-columns:\s*34px minmax\(0, 1fr\)/);
  assert.match(advisorCss, /@media \(min-width: 961px\) and \(max-width: 1100px\)[\s\S]*?\.advisor-welcome-proof-grid\s*\{[\s\S]*?grid-template-columns:\s*1fr/);
});

test('la note Google est sourcee, datee et facile a actualiser', function () {
  assert.match(advisor, /rating: '4,9\/5'/);
  assert.match(advisor, /volume: 'Plus de 30 avis clients'/);
  assert.match(advisor, /checkedAt: '2026-07-14'/);
  assert.match(advisor, /https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=Diskoov/);
  assert.match(advisor, /data-action="google-reviews"/);
  assert.match(advisor, /advisor_google_reviews_open/);
  assert.match(advisorCss, /\.advisor-google-stars svg\s*\{[\s\S]*?fill:\s*currentColor/);
  assert.match(advisorCss, /\.advisor-google-link:focus-visible/);
});

test('le logo Diskoov officiel remplace tous les monogrammes temporaires', function () {
  var logoPath = 'assets/marque/logo-diskoov-bleu-orange.png';
  assert.equal(fs.existsSync(path.join(root, logoPath)), true);
  assert.match(advisor, /class="advisor-brand-logo"[^>]*src="assets\/marque\/logo-diskoov-bleu-orange\.png"[^>]*width="273" height="75"/);
  assert.equal((html.match(/assets\/marque\/logo-diskoov-bleu-orange\.png/g) || []).length, 2);
  assert.doesNotMatch(advisor, /advisor-brand-mark/);
  assert.doesNotMatch(html, /class="(?:vi|ph)-mark"/);
});

test('le visuel principal du configurateur reste optimisé pour le mobile', function () {
  var heroPath = 'assets/produits/volets-hors-sol/volet-hors-sol-escalier-solaire.webp';
  assert.equal(fs.existsSync(path.join(root, heroPath)), true);
  assert.ok(fs.statSync(path.join(root, heroPath)).size < 400 * 1024, 'le visuel initial doit rester sous 400 Ko');
  assert.match(html, new RegExp(heroPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(html, /volet-hors-sol-escalier-solaire\.jpg/);
});

test('les listes produit aident a choisir avant de demander une etude', function () {
  assert.match(advisor, /Quelle protection choisir pour votre piscine&nbsp;\?/);
  assert.match(advisor, /Explorez les protections Diskoov/);
  assert.match(advisor, /Comparez selon vos priorités/);
  assert.match(advisor, /<\/div>'\s*\+ '<dl class="advisor-family-signals">/);
  assert.match(advisor, /class="advisor-family-signal"/);
  assert.match(advisor, /advisor-family-signal-icon/);
  assert.match(advisor, /advisor-family-story-fact-icon/);
  assert.match(advisor, /advisor-model-facts/);
  assert.match(advisor, /advisor-decision-icon/);
  assert.match(advisor, /advisor-result-map-icon/);
  assert.match(advisor, /advisor-primary-fact-icon/);
  assert.match(advisor, /bab: 'manual'/);
  assert.match(advisor, /family === 'shelter' \? 'move'/);
  assert.match(advisor, /Manipulation[\s\S]*Présence[\s\S]*À prévoir/);
  assert.match(advisor, /Vous recherchez l’abri le plus discret possible/);
  assert.match(advisor, /Vous voulez davantage de volume sous un abri bas/);
  assert.match(advisor, /Un seul rail de guidage, positionné du côté choisi avec vous/);
  assert.match(advisor, /Enroulement par manivelle et déroulement par sangle de rappel/);
  assert.match(advisor, /Choisir ce modèle/);
  assert.match(advisor, /function modelPositioning\(item\)/);
  assert.match(advisor, /Pour les bassins compacts · Motorisée/);
  assert.match(advisor, /Dimensions à étudier/);
  assert.match(advisor, /Cette forme demande une étude sur mesure/);
  assert.match(advisor, /function directUnavailableCopy\(item\)/);
  assert.doesNotMatch(advisor, /Hors plage (?:actuelle|connue)/);
  assert.match(advisor, /advisor-media-zoom/);
  assert.doesNotMatch(advisor, /familyImageNote\(family\) \+ '<\/div>'/);
  assert.match(advisor, /Projet sur mesure/);
  assert.doesNotMatch(advisor, /Visuel de gamme · à confirmer/);
  assert.match(advisorCss, /\.advisor-family-media\s*\{[\s\S]*?position:\s*relative/);
  assert.doesNotMatch(advisor, /advisor-result-rank/);
  assert.match(advisorCss, /\.advisor-direct-media:focus-visible/);
  assert.match(advisorCss, /\.advisor-direct-main:not\(:disabled\):hover/);
  assert.match(advisorCss, /\.advisor-detail-close\s*\{[\s\S]*?width:\s*44px;[\s\S]*?height:\s*44px;/);
  assert.match(advisorCss, /\.advisor-decision-icon/);
  assert.match(advisorCss, /\.advisor-model-facts > div:nth-child\(3\)\s*\{[^}]*display:\s*grid/);
  assert.doesNotMatch(advisorCss, /\.advisor-model-facts > div:nth-child\(3\)\s*\{[^}]*display:\s*none/);
  assert.match(advisorCss, /@media \(max-width: 360px\)[\s\S]*\.advisor-primary-result \.advisor-result-category/);
  assert.doesNotMatch(advisor, /Vérifier ce modèle|Vérifier mon projet|Dimensions non adaptées/);
});

test('les textes du conseiller restent directs et adaptes au prospect', function () {
  assert.match(advisor, /var STAGES = \['Vos priorités', 'Votre piscine', 'Vos recommandations'\]/);
  assert.match(advisor, /Qu’est-ce qui compte le plus pour vous/);
  assert.match(advisor, /Parlez-nous de votre piscine/);
  assert.match(advisor, /Trois solutions adaptées à vos priorités/);
  assert.match(advisor, /Comparez selon vos priorités/);
  assert.doesNotMatch(advisor, /Choisissez par l’usage, pas par le jargon|Partez de vos usages, pas des noms de produits|Première sélection en ligne|vérification humaine|simplifiera vraiment|ce qui change vraiment|approches cohérentes|piste prioritaire|sélection équilibrée|fausses pistes/i);
});

test('la nouvelle experience garde une motion courte et accessible', function () {
  assert.match(advisorCss, /--advisor-motion-screen:\s*220ms/);
  assert.match(advisor, /function animateRenderedScreen\(\)/);
  assert.match(advisor, /screen\.classList\.add\('is-entering'\)/);
  assert.match(advisorCss, /\.advisor-screen\.is-entering\s*\{[\s\S]*?translateY\(8px\)/);
  assert.match(advisor, /reducedMotionQuery\.matches \? 'auto' : 'smooth'/);
  assert.match(advisor, /window\.clearTimeout\(detailCleanupTimer\)/);
  assert.match(advisor, /window\.clearTimeout\(previewCleanupTimer\)/);
  assert.match(advisor, /image\.onerror = revealImage/);
  assert.match(advisorCss, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?animation:\s*none/);
  assert.doesNotMatch(advisorCss, /transition:\s*all/);
});

test('la piscine revele les dimensions apres la forme et reste empilee sur mobile', function () {
  assert.match(advisor, /var dimensionStep = state\.shapeConfirmed/);
  assert.match(advisor, /class="advisor-pool-disclosure"/);
  assert.match(advisor, /Deux mesures suffisent/);
  assert.match(advisorCss, /@media \(max-width: 680px\)[\s\S]*?\.advisor-pool-layout\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/);
});

test('les fiches produit masquent seulement les caracteristiques secondaires', function () {
  assert.match(advisor, /<details class="advisor-detail-more"><summary>[\s\S]*?Voir les caractéristiques[\s\S]*?Masquer les caractéristiques[\s\S]*?<\/summary>/);
  assert.match(advisor, /advisor-detail-benefits/);
  assert.match(advisor, /advisor-detail-selling--confirm/);
  assert.match(advisor, /advisor-detail-process/);
  assert.match(advisorCss, /\.advisor-detail-more summary:focus-visible/);
});

test('le passage au configurateur garde un langage prospect', function () {
  assert.match(advisor, /Solution retenue/);
  assert.match(advisor, /Modèle choisi/);
  assert.doesNotMatch(advisor, /Produit à vérifier|Piste retenue/);
});

test('les preuves commerciales restent limitees aux affirmations documentees', function () {
  assert.match(advisor, /Pose incluse lorsque Diskoov fournit et installe la couverture/);
  assert.match(advisor, /bab:\s*'Conçue selon la norme NF P90-308'/);
  assert.doesNotMatch(advisor + html, /garantie (?:de )?3 ans/i);
  assert.match(advisor, /La pose est étudiée et chiffrée selon le chantier/);
  assert.doesNotMatch(advisor, /Coverseal[^\n]{0,180}pose incluse/i);
  assert.doesNotMatch(advisor, /Coverseal[^\n]{0,180}Sécurité/i);
  assert.doesNotMatch(advisor, /motorisation solaire et finitions bois|1 ou 2 plateaux|surface utilisable|surface utile|Solution 3 en 1|Nage possible/i);
  assert.doesNotMatch(advisor, /volet_immerge:\s*'Norme de sécurité NF P90-308'/);
  assert.doesNotMatch(html, /13 890 €|11 490 €/);
  assert.match(html, /Dimensions, alimentation, options, pose et tarif Coverseal sont confirmés après étude du bassin/);
  assert.match(html, /Le chiffrage de la pose est confirmé selon les accès et le support autour du bassin/);
  assert.doesNotMatch(html, /Pose de référence intégrée|L’estimation de cet abri inclut une pose de référence/);
  assert.match(advisor, /Master Ultra Bas 1\.2/);
  assert.match(advisor, /Master Bas 5\.0/);
  assert.doesNotMatch(advisor + html, /Ultra Bas \/ Neo|Neo \/ Ultra Bas|Master 50/);
});

test('les coloris Oré hors standard déclenchent automatiquement leur option tarifaire', function () {
  assert.match(html, /S\.oreSpecialColor = \/\^\(gris_clair_654\|chocolat_7534\)\$\/.test\(value\)/);
  assert.match(html, /S\.oreSpecialColor = \/\^\(gris_clair_654\|chocolat_7534\)\$\/.test\(S\.productColor\)/);
  assert.doesNotMatch(html, /S\.oreSpecialColor = p\.get\('osc'\) === '1'/);
  assert.doesNotMatch(html, /id="prod-osc"/);
});

test('l’alimentation solaire Coverseal reste un choix explicite du prospect', function () {
  assert.match(html, /sol:\s*false, rtt:\s*false/);
  assert.match(html, /if \(S\.sol\) params\.set\('sol', '1'\)/);
  assert.match(html, /if \(p\.get\('sol'\) === '1'\) \{ S\.sol = true/);
  assert.match(html, /aria-label="Alimentation solaire souhaitée" id="t-sol"/);
  assert.doesNotMatch(html, /class="tog on"[^>]+id="t-sol"/);
});

test('les formes libres conservent uniquement les études produit documentées', function () {
  assert.match(advisor, /\['eden', 'volet_hs', 'volet_immerge'\]\.indexOf\(item\.id\)/);
  assert.match(html, /var CUSTOM_SHAPE_PRODUCTS = \{\s*eden: true,\s*volet_hs: true,\s*volet_immerge: true/);
  assert.doesNotMatch(html, /var CUSTOM_SHAPE_PRODUCTS = \{[^}]*masterdeck: true/);
});
