'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var advisor = require('../advisor-engine.js');
var rules = require('../product-rules.js');

test('le conseil retourne trois familles comprises par le prospect lorsque possible', function () {
  var result = advisor.recommend({ priorities: ['safety', 'clean'], shape: 'rect', length: 8, width: 4 }, rules);
  assert.equal(result.recommendations.length, 3);
  assert.equal(new Set(result.recommendations.map(function (r) { return r.prospectFamily; })).size, 3);
});

test('les variantes Oré, Coverseal et Eden appartiennent à une seule famille prospect', function () {
  var covers = ['ore_compact', 'ore_essential', 'auto', 'semi', 'eden'].map(function (id) {
    return advisor.findCandidate(id).prospectFamily;
  });
  assert.deepEqual(new Set(covers), new Set(['covers']));
});

test('une contrainte technique dure exclut le produit des recommandations', function () {
  var result = advisor.recommend({ priorities: ['automatic'], shape: 'rect', length: 14, width: 7 }, rules);
  assert.equal(result.compatible.some(function (r) { return r.id === 'ore_compact'; }), false);
  assert.equal(result.excluded.some(function (r) { return r.id === 'ore_compact'; }), true);
});

test('le conseiller ne confond pas plage dimensionnelle et compatibilité de pose', function () {
  var result = advisor.recommend({ priorities: ['safety', 'clean'], shape: 'rect', length: 8, width: 4 }, rules);
  var checked = result.compatible.filter(function (item) { return item.certainty === 'dimension_fit'; });
  assert.ok(checked.length > 0);
  assert.equal(result.compatible.some(function (item) { return item.certainty === 'compatible'; }), false);
  assert.ok(checked.every(function (item) { return item.reasons.indexOf('Dimensions dans la plage connue') !== -1; }));
});

test('une forme libre ne recommande que les familles documentées pour une étude', function () {
  var result = advisor.recommend({ priorities: ['aesthetics', 'space'], shape: 'libre', length: 8, width: 4 }, rules);
  assert.ok(['volet_hs', 'volet_immerge'].indexOf(result.recommendations[0].id) !== -1);
  assert.equal(result.recommendations.some(function (item) { return ['auto', 'semi', 'eden', 'masterdeck'].indexOf(item.id) !== -1; }), false);
  assert.equal(result.compatible.some(function (item) { return item.id === 'eden'; }), true);
  assert.equal(result.compatible.some(function (item) { return item.id === 'auto' || item.id === 'ore_essential'; }), false);
});

test('sans dimensions connues, le conseil compare les familles sans simuler une compatibilité', function () {
  var result = advisor.recommend({ priorities: ['automatic'], dimensionsKnown: false, shape: 'rect' }, rules);
  assert.equal(result.recommendations.length, 3);
  assert.ok(result.recommendations.every(function (item) { return item.certainty === 'to_confirm' || item.certainty === 'custom'; }));
  assert.ok(result.compatible.some(function (item) { return item.reasons.indexOf('Dimensions du bassin à préciser') !== -1; }));
});

test('des dimensions nulles ne deviennent jamais des mesures connues', function () {
  var input = advisor.normalise({ dimensionsKnown: null, length: null, width: null });
  assert.equal(input.dimensionsKnown, false);
});

test('des dimensions inconnues ne neutralisent jamais la contrainte de forme', function () {
  var result = advisor.recommend({ priorities: ['automatic'], dimensionsKnown: false, shape: 'libre' }, rules);
  assert.ok(result.compatible.length > 0);
  assert.ok(result.compatible.every(function (item) {
    return ['eden', 'volet_hs', 'volet_immerge'].indexOf(item.id) !== -1;
  }));
});

test('la priorité sécurité ne valorise que les produits documentés sur ce point', function () {
  ['auto', 'semi', 'eden', 'ul', 'm18', 'm30', 'm50', 'mid', 'masterdeck'].forEach(function (id) {
    assert.equal(advisor.findCandidate(id).strengths.indexOf('safety'), -1, id);
  });
  ['ore_compact', 'ore_essential', 'bab', 'volet_hs'].forEach(function (id) {
    assert.notEqual(advisor.findCandidate(id).strengths.indexOf('safety'), -1, id);
  });
  assert.equal(advisor.findCandidate('volet_immerge').strengths.indexOf('safety'), -1);
});

test('Coverseal et Eden restent explorables sans entrer dans le classement guidé', function () {
  var result = advisor.recommend({ priorities: ['clean', 'aesthetics'], shape: 'rect', length: 8, width: 4 }, rules);
  ['auto', 'semi', 'eden'].forEach(function (id) {
    assert.equal(result.recommendations.some(function (item) { return item.id === id; }), false, id);
    assert.equal(result.compatible.some(function (item) { return item.id === id; }), true, id);
  });
});

test('les priorités structurantes orientent la première famille sans casser la diversité', function () {
  var economy = advisor.recommend({ priorities: ['economy', 'safety'], shape: 'rect', length: 8, width: 4 }, rules);
  var season = advisor.recommend({ priorities: ['season', 'clean'], shape: 'rect', length: 8, width: 4 }, rules);
  var space = advisor.recommend({ priorities: ['space', 'aesthetics'], shape: 'rect', length: 8, width: 4 }, rules);

  assert.equal(economy.recommendations[0].id, 'bab');
  assert.equal(season.recommendations[0].prospectFamily, 'shelters');
  assert.equal(space.recommendations[0].id, 'masterdeck');
  [economy, season, space].forEach(function (result) {
    assert.equal(new Set(result.recommendations.map(function (item) { return item.prospectFamily; })).size, 3);
  });
});

test('le moteur ne complète jamais un résultat contraint avec un doublon de famille', function () {
  var result = advisor.recommend({ priorities: ['safety', 'automatic'], shape: 'rect', length: 20, width: 12 }, rules);
  var families = result.recommendations.map(function (item) { return item.prospectFamily; });
  assert.equal(new Set(families).size, families.length);
  assert.ok(result.recommendations.length >= 1 && result.recommendations.length <= 3);
});

test('le budget reste facultatif et ne supprime jamais les solutions compatibles', function () {
  var unknown = advisor.recommend({ priorities: ['safety'], budget: 'unknown' }, rules);
  var constrained = advisor.recommend({ priorities: ['safety'], budget: 'under5' }, rules);
  assert.equal(unknown.compatible.length, constrained.compatible.length);
  assert.equal(constrained.recommendations[0].id, 'bab');
});

test('les paramètres sont bornés et les priorités limitées à deux', function () {
  var input = advisor.normalise({ length: 100, width: -4, priorities: ['safety', 'clean', 'season', 'invalid'] });
  assert.equal(input.length, 20);
  assert.equal(input.width, 2);
  assert.deepEqual(input.priorities, ['safety', 'clean']);
});

test('toutes les recommandations pointent vers une sélection V1 valide', function () {
  advisor.CANDIDATES.forEach(function (item) {
    assert.ok(['cov', 'shl', 'oth'].indexOf(item.eq) !== -1);
    assert.ok(['cm', 'sm', 'otherProduct'].indexOf(item.selectionType) !== -1);
    assert.ok(item.image === '' || item.image.indexOf('assets/produits/') === 0);
    assert.ok(advisor.PROSPECT_FAMILIES[item.prospectFamily]);
  });
});
