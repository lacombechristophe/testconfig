'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var fs = require('node:fs');
var path = require('node:path');
var vm = require('node:vm');
var rules = require('../product-rules.js');

var COMMON = { shape: 'rect', installation: 'fourniture_pose', support: 'beton', margelles: 'niveau' };
var ORE_COMMON = Object.assign({}, COMMON, { clearance: '80_plus', electricity: 'oui' });
var VOLET_COMMON = Object.assign({}, COMMON, { electricity: 'oui', department: '69 - Rhône' });
var IMMERGE_COMMON = Object.assign({}, VOLET_COMMON, { immergedIntegration: 'paroi' });
var ALL_PRODUCTS = Object.keys(rules.PRODUCTS);
var SAFE_STATUSES = ['exact', 'indicative', 'quote'];

function fullInput(product, extra) {
  var input = Object.assign({
    length: 8,
    width: 4,
    shape: 'rect',
    installation: 'fourniture_pose',
    support: 'beton',
    margelles: 'niveau',
    clearance: '80_plus',
    electricity: 'oui',
    department: '69 - Rhône',
    immergedIntegration: 'paroi',
    options: {}
  }, extra || {});

  if (product === 'ore_compact') {
    input.length = 7;
    input.width = 3.5;
  }
  if (product === 'bab') {
    input.options = Object.assign({ antiAbrasion: true, blockCut: true, stair: true }, input.options || {});
  }
  return input;
}

function assertSafeResult(product, r) {
  assert.ok(r, product + ' doit retourner un résultat');
  assert.ok(SAFE_STATUSES.indexOf(r.status) !== -1, product + ' statut invalide: ' + r.status);
  assert.equal(r.product, product);
  assert.equal(typeof r.label, 'string');
  assert.equal(typeof r.image, 'string');
  assert.ok(Array.isArray(r.warnings), product + ' warnings doit être un tableau');
  assert.ok(Array.isArray(r.breakdown), product + ' breakdown doit être un tableau');
  r.breakdown.forEach(function (line) {
    assert.doesNotMatch(line.label, /Excel|grille|Xavier|référence interne|moteur tarifaire|qualification/i, product + ' expose un terme interne dans le détail de prix');
  });
  assert.equal(typeof r.technical, 'object');
}

test('tous les produits exposent une image relative existante', function () {
  ALL_PRODUCTS.forEach(function (product) {
    var image = rules.PRODUCTS[product].image;
    assert.ok(image, product + ' doit exposer une image');
    assert.equal(image.charAt(0), 'a', product + ' image doit rester relative: ' + image);
    assert.equal(image.indexOf('..'), -1, product + ' image ne doit pas remonter de dossier');
    assert.ok(/\.(jpe?g|png|webp)$/i.test(image), product + ' extension image inattendue: ' + image);
    assert.ok(fs.existsSync(path.join(__dirname, '..', image)), product + ' image introuvable: ' + image);
  });
});

test('tous les produits retournent un état sûr sur configuration complète', function () {
  ALL_PRODUCTS.forEach(function (product) {
    assertSafeResult(product, rules.calculate(product, fullInput(product)));
  });
});

test('tous les produits restent maîtrisés avec données chantier manquantes', function () {
  ALL_PRODUCTS.forEach(function (product) {
    var r = rules.calculate(product, { length: 8, width: 4, shape: 'rect', options: {} });
    assertSafeResult(product, r);
    assert.equal(r.status, 'quote', product + ' doit basculer en devis si les données clés manquent');
  });
});

test('formes atypiques et libres ne produisent jamais de faux prix automatique', function () {
  ['oval', 'libre'].forEach(function (shape) {
    ALL_PRODUCTS.forEach(function (product) {
      var r = rules.calculate(product, fullInput(product, { shape: shape }));
      assertSafeResult(product, r);
      assert.equal(r.status, 'quote', product + ' doit passer sur devis pour forme ' + shape);
      assert.equal(r.total, null);
    });
  });
});

test('une forme absente ou inconnue reste une information manquante pour tous les produits', function () {
  ALL_PRODUCTS.forEach(function (product) {
    [undefined, '', 'haricot'].forEach(function (shape) {
      var input = fullInput(product, { shape: shape });
      if (shape === undefined) delete input.shape;
      var r = rules.calculate(product, input);
      assert.equal(r.status, 'quote', product + ' ne doit pas supposer une forme rectangulaire');
      assert.equal(r.total, null);
      assert.deepEqual(r.technical.missingInputs, ['forme du bassin']);
    });
  });
});

test('combinaisons d’options client restent déterministes sur tous les produits', function () {
  ALL_PRODUCTS.forEach(function (product) {
    var r = rules.calculate(product, fullInput(product, {
      options: {
        antiAbrasion: true,
        blockCut: true,
        stair: true,
        rollingUp: true,
        cutCorners: true,
        polycarbonate: true,
        voletSolar: true,
        oreSolar: true,
        oreBlockCut: true,
        oreAntiWind: true,
        oreWinterStrap: true,
        oreExtraRetreat: true,
        oreSpecialColor: true,
        motorisation: true,
        groundRail: true
      }
    }));
    assertSafeResult(product, r);
  });
});

test('normalise toujours le grand côté en longueur', function () {
  assert.deepEqual(rules.normalizedDimensions({ length: 4, width: 8 }), { length: 8, width: 4, area: 32 });
});

test('conserve la surface brute sans arrondi pour les seuils', function () {
  var dims = rules.normalizedDimensions({ length: 10.0001, width: 5 });
  assert.equal(dims.area, 10.0001 * 5);
  assert.ok(dims.area > 50);
});

test('Oré Compact sélectionne le palier supérieur', function () {
  var r = rules.calculate('ore_compact', Object.assign({ length: 6.2, width: 3.1 }, ORE_COMMON));
  assert.equal(r.status, 'indicative');
  assert.equal(r.eligible, true);
  assert.equal(r.total, 6853.2);
  assert.equal(r.technical.selectedLength, 7);
  assert.equal(r.technical.selectedWidth, 3.5);
  assert.equal(r.technical.sourceCurrency, 'HT');
});

test('Oré refuse les dimensions hors matrice', function () {
  var r = rules.calculate('ore_essential', Object.assign({ length: 12.1, width: 4 }, ORE_COMMON));
  assert.equal(r.status, 'quote');
  assert.equal(r.eligible, false);
  assert.equal(r.total, null);
});

test('Oré bascule sur devis si la plage mécanisme est inférieure à 80 cm', function () {
  var r = rules.calculate('ore_essential', Object.assign({}, ORE_COMMON, { length: 8, width: 4, clearance: '60_79' }));
  assert.equal(r.status, 'quote');
  assert.equal(r.total, null);
});

test('Oré bloque une configuration sans plage mécanisme', function () {
  var r = rules.calculate('ore_essential', Object.assign({}, ORE_COMMON, { length: 8, width: 4, clearance: '' }));
  assert.equal(r.status, 'quote');
  assert.deepEqual(r.technical.missingInputs, ['plage côté mécanisme']);
});

test('Oré exige une réponse explicite sur la prise électrique', function () {
  var missingElectricity = Object.assign({}, ORE_COMMON, { length: 8, width: 4, electricity: '' });
  var missing = rules.calculate('ore_essential', missingElectricity);
  var unavailable = rules.calculate('ore_essential', Object.assign({}, missingElectricity, { electricity: 'non' }));

  assert.deepEqual(missing.technical.missingInputs, ['prise électrique disponible']);
  assert.equal(unavailable.status, 'quote');
  assert.equal(unavailable.total, null);
  assert.match(unavailable.warnings[0], /prise électrique confirmée/i);
});

test('Oré avec filtration hors-bord attend une décision explicite de découpe', function () {
  var unresolved = rules.calculate('ore_essential', Object.assign({}, ORE_COMMON, {
    length: 8,
    width: 4,
    options: { blockCut: true }
  }));
  var confirmed = rules.calculate('ore_essential', Object.assign({}, ORE_COMMON, {
    length: 8,
    width: 4,
    options: { blockCut: true, oreBlockCut: true }
  }));

  assert.equal(unresolved.status, 'quote');
  assert.equal(unresolved.total, null);
  assert.match(unresolved.warnings[0], /sans décision explicite de découpe/i);
  assert.equal(confirmed.status, 'indicative');
  assert.ok(confirmed.breakdown.some(function (line) { return line.label.indexOf('Découpe bloc filtration') !== -1; }));
});

test('BAB applique la surface de facturation et les options', function () {
  var r = rules.calculate('bab', Object.assign({
    length: 8,
    width: 4,
    options: { antiAbrasion: true, blockCut: true, rollingUp: true }
  }, COMMON));
  assert.equal(r.status, 'indicative');
  assert.equal(r.eligible, true);
  assert.equal(r.technical.billingSurface, 38.25);
  assert.equal(r.breakdown[0].amount, rules.money(38.25 * 36.04 * 0.65 * 1.20));
  assert.equal(r.breakdown[1].amount, rules.money(38.25 * 3.64 * 0.70 * 1.20));
  assert.equal(r.breakdown[2].amount, rules.money(137.07 * 0.70 * 1.20));
  assert.equal(r.breakdown[3].amount, rules.money(947.50 * 0.70 * 1.20));
});

test('BAB place toujours l’option escalier sur étude', function () {
  var r = rules.calculate('bab', Object.assign({
    length: 8,
    width: 4,
    options: { stair: true, stairType: 'roman', stairWidth: 2.5 }
  }, COMMON));
  assert.equal(r.status, 'quote');
  assert.equal(r.total, null);
  assert.equal(r.technical.stairType, 'roman');
  assert.match(r.warnings[0], /sans forfait|forfait fiable/i);
});

test('BAB utilise la surface brute autour du seuil de 15 m²', function () {
  var widthAtThreshold = (15 / 4.5) - 0.5;
  var below = rules.calculate('bab', Object.assign({ length: 4, width: widthAtThreshold - 0.00001, options: {} }, COMMON));
  var above = rules.calculate('bab', Object.assign({ length: 4, width: widthAtThreshold + 0.00001, options: {} }, COMMON));

  assert.ok(below.technical.billingSurface < 15);
  assert.ok(above.technical.billingSurface > 15);
  assert.equal(rules.money(below.technical.billingSurface), 15);
  assert.equal(rules.money(above.technical.billingSurface), 15);
  assert.ok(below.breakdown.some(function (line) { return line.label.indexOf('Majoration petite surface') !== -1; }));
  assert.equal(above.breakdown.some(function (line) { return line.label.indexOf('Majoration petite surface') !== -1; }), false);
});

test('BAB ne publie aucune garantie de trois ans', function () {
  var r = rules.calculate('bab', Object.assign({ length: 8, width: 4, options: {} }, COMMON));
  var source = fs.readFileSync(path.join(__dirname, '..', 'product-rules.js'), 'utf8');
  assert.doesNotMatch(r.warnings.join(' '), /garantie\s*:?\s*3 ans/i);
  assert.doesNotMatch(source, /garantie\s*:?\s*3 ans/i);
});

test('BAB respecte la limite technique maximale', function () {
  var r = rules.calculate('bab', Object.assign({ length: 12, width: 5.41 }, COMMON));
  assert.equal(r.eligible, false);
  assert.equal(r.total, null);
});

test('BAB entre 5 et 5,40 m reste sur étude au lieu de recevoir un faux prix standard', function () {
  var r = rules.calculate('bab', Object.assign({ length: 12, width: 5.2 }, COMMON));
  assert.equal(r.status, 'quote');
  assert.equal(r.eligible, null);
  assert.equal(r.total, null);
});

test('BAB refuse Rolling-Up au-delà de 5,30 m de largeur', function () {
  var r = rules.calculate('bab', Object.assign({ length: 12, width: 5.35, options: { rollingUp: true } }, COMMON));
  assert.equal(r.status, 'quote');
  assert.equal(r.eligible, false);
});

test('volet hors-sol choisit VRSIL80S et le transport du Rhône', function () {
  var r = rules.calculate('volet_hs', Object.assign({}, VOLET_COMMON, { length: 8, width: 4, options: {} }));
  assert.equal(r.status, 'quote');
  assert.equal(r.technical.structureRef, 'VRSIL80S');
  assert.equal(rules.shippingPrice('69 - Rhône', 'hors_sol'), 776.62);
  assert.equal(r.total, null);
  assert.deepEqual(r.technical.pricingValidationPending, ['livraison/pose', 'régime HT/TTC', 'emballage', 'bornes SUB/C120']);
});

test('volet hors-sol motorisé sous 3 m reste sur devis faute de structure documentée', function () {
  var r = rules.calculate('volet_hs', Object.assign({}, VOLET_COMMON, { length: 6, width: 2.5, options: {} }));
  assert.equal(r.status, 'quote');
  assert.equal(r.eligible, null);
  assert.equal(r.total, null);
});

test('volet hors-sol choisit VRSILC120 pour un bassin 9 × 4', function () {
  var r = rules.calculate('volet_hs', Object.assign({}, VOLET_COMMON, { length: 9, width: 4, department: '26' }));
  assert.equal(r.status, 'quote');
  assert.equal(r.technical.structureRef, 'VRSILC120');
  assert.equal(r.total, null);
});

test('volet hors-sol conserve les bornes candidates VRSIL80S, C120 et VRSIL200S sans total', function () {
  var v80 = rules.calculate('volet_hs', Object.assign({}, VOLET_COMMON, { length: 8, width: 4, department: '26' }));
  var c120AfterLength = rules.calculate('volet_hs', Object.assign({}, VOLET_COMMON, { length: 8.0001, width: 4, department: '26' }));
  var c120AtWidth = rules.calculate('volet_hs', Object.assign({}, VOLET_COMMON, { length: 10, width: 5, department: '26' }));
  var v200 = rules.calculate('volet_hs', Object.assign({}, VOLET_COMMON, { length: 10, width: 5.0001, department: '26' }));

  assert.equal(v80.technical.structureRef, 'VRSIL80S');
  assert.equal(c120AfterLength.technical.structureRef, 'VRSILC120');
  assert.equal(c120AtWidth.technical.structureRef, 'VRSILC120');
  assert.equal(v200.technical.structureRef, 'VRSIL200S');
  [v80, c120AfterLength, c120AtWidth, v200].forEach(function (r) {
    assert.equal(r.status, 'quote');
    assert.equal(r.total, null);
  });
});

test('volet hors-sol laisse sur devis une combinaison non couverte sans ambiguïté', function () {
  var r = rules.calculate('volet_hs', Object.assign({}, VOLET_COMMON, { length: 11, width: 4, department: '26' }));
  assert.equal(r.status, 'quote');
  assert.equal(r.eligible, null);
});

test('volet avec escalier ne produit pas de prix incomplet', function () {
  var r = rules.calculate('volet_hs', Object.assign({}, VOLET_COMMON, {
    length: 8,
    width: 4,
    options: { stair: true, stairType: 'roman', stairWidth: 3 }
  }));
  assert.equal(r.status, 'quote');
  assert.equal(r.total, null);
  assert.equal(r.technical.stairType, 'roman');
});

test('un coloris polycarbonate ne peut pas conserver un prix PVC', function () {
  var r = rules.calculate('volet_hs', Object.assign({}, VOLET_COMMON, {
    length: 8,
    width: 4,
    productColor: 'poly_bleu',
    options: {}
  }));
  assert.equal(r.status, 'quote');
  assert.equal(r.technical.material, 'polycarbonate');
  assert.equal(r.total, null);
});

test('volet hors-sol bloque une largeur inférieure à 2,45 m', function () {
  var r = rules.calculate('volet_hs', Object.assign({}, VOLET_COMMON, { length: 6, width: 2.4 }));
  assert.equal(r.status, 'quote');
  assert.equal(r.eligible, false);
});

test('volet hors-sol peut qualifier VRMANU sans alimentation sur petit bassin', function () {
  var r = rules.calculate('volet_hs', Object.assign({}, COMMON, { length: 6, width: 3, electricity: 'non', department: '26' }));
  assert.equal(r.status, 'quote');
  assert.equal(r.technical.structureRef, 'VRMANU');
  assert.equal(r.total, null);
});

test('volet immergé bascule en VRSUB6 au-delà de 50 m²', function () {
  var r = rules.calculate('volet_immerge', Object.assign({}, IMMERGE_COMMON, { length: 11, width: 5, department: '26' }));
  assert.equal(r.status, 'quote');
  assert.equal(r.technical.structureRef, 'VRSUB6');
  assert.equal(r.eligible, true);
  assert.equal(r.total, null);
});

test('volet immergé conserve la surface brute à la frontière SUB de 50 m²', function () {
  var atLimit = rules.calculate('volet_immerge', Object.assign({}, IMMERGE_COMMON, { length: 10, width: 5, department: '26' }));
  var aboveLimit = rules.calculate('volet_immerge', Object.assign({}, IMMERGE_COMMON, { length: 10.0001, width: 5, department: '26' }));

  assert.equal(atLimit.technical.structureRef, 'VRSUB5');
  assert.equal(aboveLimit.technical.structureRef, 'VRSUB6');
  assert.equal(atLimit.total, null);
  assert.equal(aboveLimit.total, null);
});

test('volets conservent les limites brutes de 72 et 84 m²', function () {
  var horsSolAtLimit = rules.calculate('volet_hs', Object.assign({}, VOLET_COMMON, { length: 12, width: 6, department: '26' }));
  var horsSolAbove = rules.calculate('volet_hs', Object.assign({}, VOLET_COMMON, { length: 12.0001, width: 6, department: '26' }));
  var immergeAtLimit = rules.calculate('volet_immerge', Object.assign({}, IMMERGE_COMMON, { length: 14, width: 6, department: '26' }));
  var immergeAbove = rules.calculate('volet_immerge', Object.assign({}, IMMERGE_COMMON, { length: 14.0001, width: 6, department: '26' }));

  assert.notEqual(horsSolAtLimit.eligible, false);
  assert.equal(horsSolAbove.eligible, false);
  assert.notEqual(immergeAtLimit.eligible, false);
  assert.equal(immergeAbove.eligible, false);
  [horsSolAtLimit, horsSolAbove, immergeAtLimit, immergeAbove].forEach(function (r) {
    assert.equal(r.status, 'quote');
    assert.equal(r.total, null);
  });
});

test('volet immergé bloque sans type d’intégration', function () {
  var r = rules.calculate('volet_immerge', Object.assign({}, VOLET_COMMON, { length: 8, width: 4 }));
  assert.equal(r.status, 'quote');
  assert.deepEqual(r.technical.missingInputs, ['type d’intégration du volet immergé']);
});

test('volet sans grille transport reste sur devis', function () {
  var r = rules.calculate('volet_immerge', Object.assign({}, IMMERGE_COMMON, { length: 8, width: 4, department: '2A - Corse-du-Sud' }));
  assert.equal(r.status, 'quote');
  assert.equal(r.eligible, true);
  assert.equal(r.total, null);
});

test('abri 8 × 4 reproduit 4 modules et la corde 480', function () {
  var r = rules.calculate('m18', Object.assign({ length: 8, width: 4 }, COMMON));
  assert.equal(r.status, 'quote');
  assert.equal(r.technical.modules, 4);
  assert.equal(r.technical.chordCm, 430);
  assert.equal(r.technical.selectedChordCm, 480);
  assert.equal(r.total, null);
  assert.deepEqual(r.technical.pricingValidationPending, ['remise', 'couleurs', 'transport par zone']);
});

test('Oré avec option validée ajoute le prix option au détail TTC', function () {
  var r = rules.calculate('ore_essential', Object.assign({
    length: 8,
    width: 4,
    options: { oreSolar: true }
  }, ORE_COMMON));
  assert.equal(r.status, 'indicative');
  assert.equal(r.total, 8793.6);
  assert.ok(r.breakdown.some(function (line) { return line.label.indexOf('Panneau solaire') !== -1; }));
});

test('les remises abris documentaires ne réactivent aucun total automatique', function () {
  ['ul', 'm18', 'm30'].forEach(function (product) {
    var r = rules.calculate(product, Object.assign({ length: 8, width: 4 }, COMMON));
    assert.equal(typeof rules._data.abriCommercial[product].discount, 'number');
    assert.equal(r.status, 'quote');
    assert.equal(r.total, null);
  });
});

test('aucun abri techniquement qualifié ne produit de total automatique', function () {
  ['ul', 'm18', 'm30', 'm50', 'mid'].forEach(function (product) {
    var r = rules.calculate(product, Object.assign({ length: 8, width: 4 }, COMMON));
    assert.equal(r.status, 'quote', product);
    assert.equal(r.total, null, product);
    assert.equal(r.breakdown.length, 0, product);
  });
});

test('les bornes de corde abri restent contrôlées avant les modules', function () {
  var atMinimum = rules.calculate('m18', Object.assign({ length: 8, width: 3 }, COMMON));
  var belowMinimum = rules.calculate('m18', Object.assign({ length: 8, width: 2.98 }, COMMON));
  var atMaximum = rules.calculate('m18', Object.assign({ length: 8, width: 5.5 }, COMMON));
  var aboveMaximum = rules.calculate('m18', Object.assign({ length: 8, width: 5.51 }, COMMON));

  assert.equal(atMinimum.technical.chordCm, 330);
  assert.notEqual(atMinimum.eligible, false);
  assert.equal(belowMinimum.eligible, false);
  assert.equal(atMaximum.technical.chordCm, 580);
  assert.notEqual(atMaximum.eligible, false);
  assert.equal(aboveMaximum.eligible, false);
});

test('Oré place les dimensions sous le premier palier sur étude', function () {
  var r = rules.calculate('ore_compact', Object.assign({ length: 2.9, width: 2.5 }, ORE_COMMON));
  assert.equal(r.status, 'quote');
  assert.equal(r.eligible, null);
});

test('Master Bas 5.0 vérifie les limites techniques avant le devis', function () {
  var compatible = rules.calculate('m50', Object.assign({ length: 8, width: 4 }, COMMON));
  var tooWide = rules.calculate('m50', Object.assign({ length: 8, width: 6 }, COMMON));
  assert.equal(compatible.status, 'quote');
  assert.equal(compatible.eligible, true);
  assert.equal(tooWide.eligible, false);
});

test('un nombre de modules non confirmé demande une étude sans déclarer le projet incompatible', function () {
  var r = rules.calculate('m18', Object.assign({ length: 15, width: 4 }, COMMON));
  assert.equal(r.status, 'quote');
  assert.equal(r.eligible, null);
  assert.equal(r.total, null);
});

test('un abri hors scénario dimensionnel documenté reste à qualifier sur devis', function () {
  var r = rules.calculate('m18', Object.assign({ length: 10, width: 5.2 }, COMMON));
  assert.equal(r.status, 'quote');
  assert.equal(r.eligible, null);
  assert.equal(r.total, null);
});

test('la corde maximale abri est contrôlée avant le nombre de modules', function () {
  var r = rules.calculate('m18', Object.assign({ length: 15, width: 7 }, COMMON));
  assert.equal(r.status, 'quote');
  assert.equal(r.eligible, false);
  assert.equal(r.total, null);
});

test('Master Bas 5.0 et MasterDeck restent explicitement sur devis', function () {
  assert.equal(rules.calculate('m50', Object.assign({ length: 8, width: 4 }, COMMON)).status, 'quote');
  assert.equal(rules.calculate('masterdeck', { length: 8, width: 4 }).status, 'quote');
});

test('abri avec option motorisation passe sur devis', function () {
  var r = rules.calculate('m18', Object.assign({ length: 8, width: 4, options: { motorisation: true } }, COMMON));
  assert.equal(r.status, 'quote');
  assert.equal(r.total, null);
});

test('une forme non rectangulaire est toujours qualifiée sur mesure', function () {
  var r = rules.calculate('volet_hs', { length: 8, width: 4, shape: 'oval', department: '26' });
  assert.equal(r.status, 'quote');
  assert.equal(r.eligible, null);
});

test('aucune donnée concurrente Pisceen/DERCYA n’entre dans le moteur', function () {
  var serialized = JSON.stringify(rules);
  assert.equal(/Pisceen|DERCYA|S021/i.test(serialized), false);
});

test('la configuration publique neutralise prix, palettes et webhook non validés', function () {
  var source = fs.readFileSync(path.join(__dirname, '..', 'config.js'), 'utf8');
  var context = { window: {} };
  vm.runInNewContext(source, context);

  assert.deepEqual(Object.keys(context.window.DISKOOV_PRICES), []);
  assert.deepEqual(Object.keys(context.window.DISKOOV_OPTIONS), []);
  ['DISKOOV_MEMBRANE_COLORS', 'DISKOOV_COPING_COLORS', 'DISKOOV_STRUCTURE_COLORS'].forEach(function (key) {
    assert.equal(Array.isArray(context.window[key]), true, key);
    assert.equal(context.window[key].length, 0, key);
  });
  assert.doesNotMatch(source, /13890|11490|\b800\b/);
  assert.doesNotMatch(source, /DISKOOV_WEBHOOK|hook\.eu1\.make\.com/i);
});
