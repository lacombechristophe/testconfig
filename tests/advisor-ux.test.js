'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var fs = require('node:fs');
var path = require('node:path');

var root = path.resolve(__dirname, '..');
var advisor = fs.readFileSync(path.join(root, 'advisor-v2.js'), 'utf8');
var css = fs.readFileSync(path.join(root, 'advisor-v2.css'), 'utf8');

test('la reprise conserve le parcours guidé ou direct et son contexte complet', function () {
  var saved = advisor.match(/function saveState\(\)[\s\S]*?\n\s*function loadSavedState/);
  assert.ok(saved);
  ['mode', 'guidedScreen', 'priorities', 'shape', 'length', 'width', 'dimensionsKnown', 'compare', 'directFamily', 'activeProduct'].forEach(function (field) {
    assert.match(saved[0], new RegExp(field + ':\\s*state\\.' + field));
  });
  assert.match(advisor, /function resumeAdvisor\(\)[\s\S]*?state\.mode === 'direct' \|\| state\.screen === 'direct'/);
  assert.match(advisor, /function resumeGuidedMode\(\)/);
  assert.doesNotMatch(advisor, /state\.screen === 'welcome' \|\| state\.screen === 'direct'\) state\.screen = 'priorities'/);
});

test('la copie sans préférence reste neutre et les études sont séparées du classement', function () {
  assert.match(advisor, /function hasRankedPriorities\(\)/);
  assert.match(advisor, /hasRankedPriorities\(\) \? 'Classées selon vos priorités' : 'Repères pour comparer'/);
  assert.match(advisor, /hasRankedPriorities\(\)[\s\S]*?'À étudier en priorité'[\s\S]*?'Solution à comparer'/);
  assert.match(advisor, /function studiesTemplate\(products\)/);
  assert.match(advisor, /Autres solutions à étudier/);
  assert.match(advisor, /class="advisor-study-media"/);
  assert.match(advisor, /advisor-study-item advisor-study-item--group/);
  assert.match(advisor, /variants\.length > 1/);
  assert.match(advisor, /Voir ce modèle/);
  assert.doesNotMatch(advisor, /Sans classement|Découvrir cette piste/);
  assert.match(advisor, /Compatibilité à confirmer/);
  assert.doesNotMatch(advisor, /Piste non classée/);
});

test('le comparatif mobile conserve cinq critères de décision', function () {
  var block = advisor.match(/var mobileCriteria = \[([\s\S]*?)\n\s*\];/);
  assert.ok(block);
  ['Idéal pour', 'Manipulation', 'Présence visuelle', 'Effet thermique / période', 'À prévoir'].forEach(function (label) {
    assert.match(block[1], new RegExp(label.replace('/', '\\/')));
  });
  assert.equal((block[1].match(/^\s*\[/gm) || []).length, 5);
});

test('les détails mobiles sont progressifs et gardent titre et CTA dans le noyau compact', function () {
  assert.match(advisor, /class="advisor-family-more"/);
  assert.match(advisor, /class="advisor-model-more"/);
  assert.match(advisor, /Voir les détails/);
  assert.match(advisor, /Masquer les détails/);
  assert.match(advisor, /Voir les caractéristiques/);
  assert.match(advisor, /Masquer les caractéristiques/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*?\.advisor-family-item\s*\{[\s\S]*?grid-template-columns:\s*104px minmax\(0, 1fr\)/);
  assert.match(css, /\.advisor-family-item > \.advisor-direct-main\s*\{[\s\S]*?grid-column:\s*2;[\s\S]*?grid-row:\s*2/);
  assert.match(css, /\.advisor-model-more\s*\{[\s\S]*?grid-column:\s*1 \/ -1;[\s\S]*?grid-row:\s*3/);
  var finalMobileRules = css.slice(css.lastIndexOf('@media (max-width: 720px)'));
  assert.match(finalMobileRules, /\.advisor-family-item\s*\{[\s\S]*?grid-template-columns:\s*104px minmax\(0, 1fr\)/);
  assert.match(css, /\.advisor-family-more summary,[\s\S]*?min-height:\s*44px/);
  assert.match(css, /\.advisor-brand\s*\{[\s\S]*?min-height:\s*44px/);
  assert.match(advisor, /addEventListener\('toggle'[\s\S]*?aria-expanded/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*?\.advisor-direct-item,[\s\S]*?grid-template-columns:\s*104px minmax\(0, 1fr\)/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*?\.advisor-direct-buttons\s*\{[\s\S]*?grid-column:\s*2;[\s\S]*?grid-row:\s*2/);
});

test('les faits famille passent sur une colonne sous 360 px', function () {
  assert.match(css, /@media \(max-width: 360px\)[\s\S]*?\.advisor-family-story-facts,[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(css, /\.advisor-family-story-facts > div \+ div\s*\{[\s\S]*?border-top:\s*1px solid var\(--advisor-line\)/);
});

test('la validation des dimensions attend un blur ou une tentative', function () {
  assert.match(advisor, /addEventListener\('focusout'[\s\S]*?dimensionValidation\[event\.target\.getAttribute\('data-field'\)\] = true/);
  assert.match(advisor, /var invalid = shouldValidateDimension\(field\) && !isDimensionValueValid/);
  assert.match(advisor, /function shouldValidateDimension\(field\)[\s\S]*?dimensionValidation\.attempted/);
  assert.match(advisor, /function showDimensionError\(\)[\s\S]*?dimensionValidation\.attempted = true;[\s\S]*?updateDimensionFeedback\(\)/);
  assert.doesNotMatch(advisor, /nextDisabled[\s\S]{0,260}dimensionsKnown === true && !dimensionsValid/);
});

test('la lightbox garde un média 3:2 utile sans recadrage', function () {
  assert.match(advisor, /class="advisor-modal-frame"/);
  assert.match(css, /\.advisor-modal-frame\s*\{[\s\S]*?aspect-ratio:\s*3 \/ 2/);
  assert.match(css, /\.advisor-modal \.advisor-modal-frame img\s*\{[\s\S]*?object-fit:\s*contain/);
});

test('le visuel d’accueil utilise une source responsive sans dégrader la visionneuse', function () {
  assert.match(advisor, /var WELCOME_VISUAL_SMALL = 'assets\/produits\/conseiller\/ore-fermee-800\.webp'/);
  assert.match(advisor, /data-visual-image src="' \+ WELCOME_VISUAL_SMALL \+ '" srcset="' \+ WELCOME_VISUAL_SRCSET/);
  assert.match(advisor, /if \(src === WELCOME_VISUAL_SMALL\)[\s\S]*?setAttribute\('srcset'[\s\S]*?else \{[\s\S]*?removeAttribute\('srcset'/);
  assert.match(advisor, /data-advisor-modal-image src="' \+ TRANSPARENT_PIXEL \+ '"/);
  assert.match(advisor, /function openPreview\(src, alt, trigger\)[\s\S]*?modalImage\.src = src/);
  assert.match(advisor, /if \(!modal\.classList\.contains\('is-open'\)\) modalImage\.removeAttribute\('src'\)/);
});

test('les dialogues rendent le fond inerte et restaurent le focus', function () {
  assert.match(advisor, /data-advisor-modal[^>]* inert/);
  assert.match(advisor, /data-advisor-detail-modal[^>]* inert/);
  assert.match(advisor, /function setDialogEnvironment\(activeDialog\)/);
  assert.match(advisor, /node\.inert = Boolean\(activeDialog\)/);
  assert.match(advisor, /dialog\.inert = dialog !== activeDialog/);
  assert.match(advisor, /if \(!container\.contains\(document\.activeElement\)\)/);
  assert.match(advisor, /if \(restorePreviousFocus !== false\) restoreFocus/);
  assert.match(advisor, /event\.key === 'Escape'[\s\S]*?closeProductDetails\(\)[\s\S]*?else if[\s\S]*?closePreview\(\)/);
});

test('la durée de garantie BAB contradictoire a disparu', function () {
  assert.doesNotMatch(advisor, /garantie\s+3\s+ans/i);
  assert.match(advisor, /bab: 'Conçue selon la norme NF P90-308'/);
});

test('l’accueil reste exploitable sur un mobile tenu en paysage', function () {
  assert.match(css, /@media \(max-width: 960px\) and \(max-height: 560px\) and \(orientation: landscape\)/);
  assert.match(css, /advisor-shell\[data-screen='welcome'\] \.advisor-visual\s*\{[\s\S]*?height:\s*56px;[\s\S]*?min-height:\s*56px/);
  assert.match(css, /advisor-shell\[data-screen='welcome'\] \.advisor-screen\s*\{[\s\S]*?justify-content:\s*flex-start/);
});

test('le passage au configurateur évite de répéter le conseil', function () {
  assert.match(advisor, /var proof = guided && hasRankedPriorities\(\)/);
  assert.match(advisor, /var next = guided[\s\S]*?Prochaine étape/);
  assert.match(advisor, /var revisitLabel = guided \? 'Revoir' : 'Changer'/);
  assert.match(css, /\.guided-summary-row\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) auto/);
});

test('le transfert guidé ne montre pas une alerte héritée du produit précédent', function () {
  assert.match(advisor, /window\.selShape\(state\.shape, \{ silent: true \}\)/);
  assert.match(advisor, /window\.updD\(\{ silent: true \}\)/);
});
