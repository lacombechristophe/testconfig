const test = require('node:test');
const assert = require('node:assert/strict');
const rules = require('../product-rules');

test('catalogue abri et grille commerciale Excel restent separes', function () {
  assert.equal(typeof rules._data.abriCatalog.m18.minChordCm, 'number');
  assert.equal(rules._data.abriCatalog.m18.tiers, undefined);
  assert.equal(typeof rules._data.abriCommercial.m18.discount, 'number');
  assert.ok(rules._data.abriCommercial.m18.tiers);
});
