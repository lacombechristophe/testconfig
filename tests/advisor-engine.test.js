'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var advisor = require('../advisor-engine.js');
var rules = require('../product-rules.js');

test('le conseil retourne trois familles distinctes lorsque possible', function () {
  var result = advisor.recommend({ priorities: ['safety', 'clean'], shape: 'rect', length: 8, width: 4 }, rules);
  assert.equal(result.recommendations.length, 3);
  assert.equal(new Set(result.recommendations.map(function (r) { return r.family; })).size, 3);
});

test('une contrainte technique dure exclut le produit des recommandations', function () {
  var result = advisor.recommend({ priorities: ['automatic'], shape: 'rect', length: 14, width: 7 }, rules);
  assert.equal(result.compatible.some(function (r) { return r.id === 'ore_compact'; }), false);
  assert.equal(result.excluded.some(function (r) { return r.id === 'ore_compact'; }), true);
});

test('une forme libre privilégie les solutions étudiées sur mesure', function () {
  var result = advisor.recommend({ priorities: ['aesthetics', 'space'], shape: 'libre', length: 8, width: 4 }, rules);
  assert.ok(['eden', 'masterdeck'].indexOf(result.recommendations[0].id) !== -1);
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
  });
});
