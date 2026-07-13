'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var fs = require('node:fs');
var Module = require('node:module');
var path = require('node:path');
var vm = require('node:vm');
var ts = require('typescript');

var root = path.resolve(__dirname, '..');
var apiPath = path.join(root, 'api', 'send-email.ts');
var apiSource = fs.readFileSync(apiPath, 'utf8');
var payloadSequence = 0;

function loadEndpoint(options) {
  options = options || {};
  var calls = [];
  var sendResults = [];
  var output = ts.transpileModule(apiSource, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020
    },
    fileName: apiPath
  }).outputText;

  function MockResend() {
    this.emails = {
      send: async function (message) {
        calls.push(message);
        var result = sendResults.length ? sendResults.shift() : null;
        if (result instanceof Error) throw result;
        if (typeof result === 'function') return result(message);
        return result || { data: { id: 'email-' + calls.length }, error: null };
      }
    };
  }

  var loadedModule = { exports: {} };
  var wrapper = vm.runInThisContext(Module.wrap(output), { filename: apiPath });
  function localRequire(id) {
    if (id === 'resend') return { Resend: MockResend };
    if (id === '@vercel/kv') return { kv: options.kv };
    return require(id);
  }
  wrapper(loadedModule.exports, localRequire, loadedModule, apiPath, path.dirname(apiPath));

  return {
    calls: calls,
    handler: loadedModule.exports.default,
    sendResults: sendResults
  };
}

function makePayload(overrides) {
  payloadSequence += 1;
  var suffix = payloadSequence.toString(36).padStart(16, '0');
  return Object.assign({
    dossier_id: 'DKCLIENT-' + suffix,
    prenom: 'Alice',
    nom: 'Martin',
    email: 'alice' + payloadSequence + '@example.test',
    tel: '0612345678',
    code_postal: '34000',
    ville: 'Montpellier',
    forme: 'rect',
    forme_label: 'LIBELLE CLIENT',
    categorie: 'cov',
    produit: 'auto',
    produit_label: 'LIBELLE PRODUIT CLIENT',
    longueur: 8,
    largeur: 4,
    surface: 999,
    emplacement: 'Extérieur',
    departement: '34 - Hérault',
    delai: 'Dans les 6 mois',
    priorite: 'NORMAL',
    consentement: true,
    timestamp: new Date(Date.UTC(2026, 6, 13, 10, 0, 0) + payloadSequence * 1000).toISOString()
  }, overrides || {});
}

function makeResponse() {
  return {
    body: undefined,
    headers: {},
    statusCode: 200,
    setHeader: function (name, value) {
      this.headers[String(name).toLowerCase()] = value;
    },
    status: function (statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json: function (body) {
      this.body = body;
      return this;
    },
    end: function () {
      return this;
    }
  };
}

async function invoke(app, payload, options) {
  options = options || {};
  var headers = {};
  var ip = options.ip || '198.51.100.' + ((payloadSequence % 200) + 1);
  if (options.origin !== undefined) headers.origin = options.origin;
  headers['x-forwarded-for'] = ip;
  var response = makeResponse();
  await app.handler({
    body: payload,
    headers: headers,
    method: options.method || 'POST',
    socket: { remoteAddress: ip }
  }, response);
  return response;
}

function dataUrl(mime, content) {
  return 'data:' + mime + ';base64,' + content.toString('base64');
}

test('durcissement comportemental de send-email', async function (t) {
  var previousApiKey = process.env.RESEND_API_KEY;
  var previousKeySecret = process.env.KEY_DERIVATION_SECRET;
  var previousKvUrl = process.env.KV_REST_API_URL;
  var previousKvToken = process.env.KV_REST_API_TOKEN;
  process.env.RESEND_API_KEY = 're_test_only';
  process.env.KEY_DERIVATION_SECRET = 'test-key-derivation-secret';
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;

  try {
    await t.test('exige le consentement et garde le honeypot vide', async function () {
      var app = loadEndpoint();
      var missingConsent = makePayload();
      delete missingConsent.consentement;
      var missingResponse = await invoke(app, missingConsent);
      assert.equal(missingResponse.statusCode, 400);
      assert.match(missingResponse.body.error, /Consentement/);

      var falseResponse = await invoke(app, makePayload({ consentement: false }));
      assert.equal(falseResponse.statusCode, 400);
      assert.match(falseResponse.body.error, /Consentement/);

      var honeypotResponse = await invoke(app, makePayload({ website: 'https://spam.test' }));
      assert.equal(honeypotResponse.statusCode, 400);
      assert.equal(app.calls.length, 0);
    });

    await t.test('valide dossier_id et accepte les appels server-side sans Origin', async function () {
      var app = loadEndpoint();
      var invalid = await invoke(app, makePayload({ dossier_id: 'DKCLIENT-court' }));
      assert.equal(invalid.statusCode, 400);
      assert.match(invalid.body.error, /dossier/i);

      var uuidPayload = makePayload({ dossier_id: '123e4567-e89b-12d3-a456-426614174000' });
      var accepted = await invoke(app, uuidPayload);
      assert.equal(accepted.statusCode, 200);
      assert.equal(accepted.body.ok, true);
      assert.match(accepted.body.ref, /^DK-[A-F0-9]{6}-[A-F0-9]{6}$/);
      assert.equal(accepted.headers['access-control-allow-origin'], undefined);
      assert.equal(app.calls.length, 2);
    });

    await t.test('refuse les formes implicites et réserve les dimensions inconnues à la forme libre', async function () {
      var app = loadEndpoint();
      var unknownShape = await invoke(app, makePayload({ forme: 'triangle' }));
      assert.equal(unknownShape.statusCode, 400);
      assert.match(unknownShape.body.error, /Forme/);

      var missingRectangleDimensions = await invoke(app, makePayload({ longueur: 0, largeur: 0 }));
      assert.equal(missingRectangleDimensions.statusCode, 400);
      assert.match(missingRectangleDimensions.body.error, /Dimensions obligatoires/);

      var incompleteFreeDimensions = await invoke(app, makePayload({ forme: 'libre', longueur: 8, largeur: 0 }));
      assert.equal(incompleteFreeDimensions.statusCode, 400);
      assert.match(incompleteFreeDimensions.body.error, /renseignées ensemble/);

      var freePayload = makePayload({
        forme: 'libre',
        forme_label: 'FAUX RECTANGLE',
        longueur: 0,
        largeur: 0,
        surface: 32,
        description_forme: 'Bassin libre à étudier'
      });
      var freeResponse = await invoke(app, freePayload);
      assert.equal(freeResponse.statusCode, 200);
      var freeEmails = app.calls.slice(-2).map(function (call) { return call.html; }).join('\n');
      assert.match(freeEmails, /Forme libre/);
      assert.doesNotMatch(freeEmails, /FAUX RECTANGLE|0[,.]0\s*(?:×|&times;)/);
    });

    await t.test('applique la allowlist produit et ses libellés canoniques', async function () {
      var app = loadEndpoint();
      var unknownProduct = await invoke(app, makePayload({ produit: 'produit_invente' }));
      assert.equal(unknownProduct.statusCode, 400);
      assert.match(unknownProduct.body.error, /Produit invalide/);

      var categoryMismatch = await invoke(app, makePayload({ categorie: 'shl', produit: 'auto' }));
      assert.equal(categoryMismatch.statusCode, 400);
      assert.match(categoryMismatch.body.error, /catégorie/);

      var catalog = [
        ['cov', 'auto', 'Coverseal Automatique'],
        ['cov', 'semi', 'Coverseal Semi-Automatique'],
        ['cov', 'ore_compact', 'Oré Compact'],
        ['cov', 'ore_essential', 'Oré Essential'],
        ['cov', 'eden', 'Couverture Eden'],
        ['shl', 'ul', 'Abri Master Ultra Bas 1.2'],
        ['shl', 'm18', 'Abri Master 18'],
        ['shl', 'm30', 'Abri Master 30'],
        ['shl', 'm50', 'Abri Master Bas 5.0'],
        ['shl', 'mid', 'Abri Mi-haut'],
        ['oth', 'bab', 'Bâche à barres Secu Classic'],
        ['oth', 'volet_hs', 'Volet hors-sol'],
        ['oth', 'volet_immerge', 'Volet immergé'],
        ['oth', 'masterdeck', 'Terrasse mobile MasterDeck']
      ];
      for (var entry of catalog) {
        var accepted = await invoke(app, makePayload({
          categorie: entry[0],
          forme_label: 'FORME FORGEE',
          produit: entry[1],
          produit_label: 'PRODUIT FORGE'
        }));
        assert.equal(accepted.statusCode, 200, entry[1]);
        var messages = JSON.stringify(app.calls.slice(-2));
        assert.match(messages, new RegExp(entry[2].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), entry[1]);
        assert.match(messages, /Rectangulaire/);
        assert.doesNotMatch(messages, /FORME FORGEE|PRODUIT FORGE/);
      }
    });

    await t.test('neutralise les résultats tarifaires et techniques fournis par le client', async function () {
      var app = loadEndpoint();
      var response = await invoke(app, makePayload({
        prix_estime: 987654,
        statut_prix: 'TRAP_STATUT_PRIX',
        eligibilite: 'TRAP_ELIGIBILITE',
        reference_tarifaire: 'TRAP_REFERENCE',
        avertissements_tarifaires: 'TRAP_AVERTISSEMENT',
        donnees_techniques: 'TRAP_TECHNIQUE',
        qualification_complete: 'TRAP_QUALIFICATION',
        informations_manquantes: 'TRAP_MANQUANTES'
      }));
      assert.equal(response.statusCode, 200);
      var messages = JSON.stringify(app.calls);
      assert.doesNotMatch(messages, /987654|TRAP_/);
      assert.match(messages, /Sur devis/);
    });

    await t.test('accepte uniquement les signatures de pièces jointes autorisées', async function () {
      var fixtures = [
        { ext: 'jpg', kind: 'photo', mime: 'image/jpeg', bytes: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]) },
        { ext: 'png', kind: 'photo', mime: 'image/png', bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]) },
        { ext: 'webp', kind: 'photo', mime: 'image/webp', bytes: Buffer.from('RIFF0000WEBP', 'ascii') },
        { ext: 'pdf', kind: 'plan', mime: 'application/pdf', bytes: Buffer.from('%PDF-1.4\n%%EOF', 'ascii') }
      ];

      for (var fixture of fixtures) {
        var app = loadEndpoint();
        var filename = 'plan piscine.' + fixture.ext;
        var response = await invoke(app, makePayload({
          piece_jointe_type: fixture.kind,
          plan_base64: dataUrl(fixture.mime, fixture.bytes),
          plan_filename: filename
        }));
        assert.equal(response.statusCode, 200, fixture.ext);
        assert.equal(app.calls[0].attachments.length, 1, fixture.ext);
        assert.equal(app.calls[0].attachments[0].filename, 'plan_piscine.' + fixture.ext, fixture.ext);
        assert.deepEqual(app.calls[0].attachments[0].content, fixture.bytes, fixture.ext);
      }
    });

    await t.test('rejette clairement toute incohérence de pièce jointe avant envoi', async function () {
      var app = loadEndpoint();
      var png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      var oversized = Buffer.alloc(3 * 1024 * 1024 + 1);
      png.copy(oversized, 0);
      var invalidPayloads = [
        { plan_filename: 'image.png', plan_base64: png.toString('base64'), piece_jointe_type: 'photo' },
        { plan_filename: 'image.jpg', plan_base64: dataUrl('image/png', png), piece_jointe_type: 'photo' },
        { plan_filename: 'image.png', plan_base64: dataUrl('image/png', Buffer.from('not-a-png')), piece_jointe_type: 'photo' },
        { plan_filename: 'image.png', plan_base64: 'data:image/png;base64,AB==', piece_jointe_type: 'photo' },
        { plan_filename: 'image.png', plan_base64: dataUrl('image/png', png), piece_jointe_type: 'plan' },
        { plan_filename: 'image.png', photo_filename: 'autre.png', plan_base64: dataUrl('image/png', png), piece_jointe_type: 'photo' },
        { plan_filename: 'image.png', piece_jointe_type: 'photo' },
        { plan_filename: 'image.png', plan_base64: dataUrl('image/png', oversized), piece_jointe_type: 'photo' }
      ];

      for (var invalidAttachment of invalidPayloads) {
        var response = await invoke(app, makePayload(invalidAttachment));
        assert.equal(response.statusCode, 400);
        assert.match(response.body.error, /Pièce jointe/);
      }
      assert.equal(app.calls.length, 0);
    });

    await t.test('déduplique par dossier_id et conserve toujours la même référence', async function () {
      var app = loadEndpoint();
      var payload = makePayload();
      var first = await invoke(app, payload, { ip: '203.0.113.10' });
      assert.equal(first.statusCode, 200);
      assert.equal(first.body.status, 'fulfilled');
      assert.match(first.body.ref, /^DK-[A-F0-9]{6}-[A-F0-9]{6}$/);
      assert.equal(app.calls.length, 2);

      var retry = makePayload({
        dossier_id: payload.dossier_id,
        email: 'changed@example.test'
      });
      var deduplicated = await invoke(app, retry, { ip: '203.0.113.11' });
      assert.equal(deduplicated.statusCode, 200);
      assert.equal(deduplicated.body.status, 'deduplicated');
      assert.equal(deduplicated.body.prospect, 'deduplicated');
      assert.equal(deduplicated.body.ref, first.body.ref);
      assert.equal(app.calls.length, 2);
    });

    await t.test('conserve la référence après erreur interne puis retry', async function () {
      var app = loadEndpoint();
      var payload = makePayload();
      app.sendResults.push(new Error('internal unavailable'));
      var failed = await invoke(app, payload, { ip: '203.0.113.20' });
      assert.equal(failed.statusCode, 502);
      assert.match(failed.body.ref, /^DK-/);

      var retried = await invoke(app, payload, { ip: '203.0.113.21' });
      assert.equal(retried.statusCode, 200);
      assert.equal(retried.body.ref, failed.body.ref);
      assert.equal(app.calls.length, 3);
    });

    await t.test('expose un rejet prospect comme succès partiel, y compris dédupliqué', async function () {
      var app = loadEndpoint();
      var payload = makePayload();
      app.sendResults.push(
        { data: { id: 'internal-ok' }, error: null },
        { data: null, error: { message: 'prospect rejected' } }
      );
      var partial = await invoke(app, payload, { ip: '203.0.113.30' });
      assert.equal(partial.statusCode, 200);
      assert.equal(partial.body.ok, false);
      assert.equal(partial.body.status, 'partial');
      assert.equal(partial.body.prospect, 'rejected');
      assert.equal(partial.body.internal, 'fulfilled');

      var duplicate = await invoke(app, payload, { ip: '203.0.113.31' });
      assert.equal(duplicate.body.ok, false);
      assert.equal(duplicate.body.status, 'partial');
      assert.equal(duplicate.body.prospect, 'rejected');
      assert.equal(duplicate.body.ref, partial.body.ref);
      assert.equal(app.calls.length, 2);
    });

    await t.test('HMAC les clés KV sans identifiant brut', async function () {
      var store = new Map();
      var keys = [];
      var fakeKv = {
        get: async function (key) {
          keys.push(key);
          return store.get(key);
        },
        set: async function (key, value) {
          keys.push(key);
          store.set(key, value);
          return 'OK';
        }
      };
      process.env.KV_REST_API_URL = 'https://kv.test';
      process.env.KV_REST_API_TOKEN = 'kv_test_token';
      try {
        var app = loadEndpoint({ kv: fakeKv });
        var payload = makePayload({
          dossier_id: 'DKCLIENT-SensitiveDossier1',
          email: 'private.person@example.test'
        });
        var response = await invoke(app, payload, { ip: '192.0.2.44' });
        assert.equal(response.statusCode, 200);
        assert.ok(keys.length > 0);
        keys.forEach(function (key) {
          assert.match(key, /^dk_[a-z_]+:[a-f0-9]{64}$/);
          assert.doesNotMatch(key, /private\.person|SensitiveDossier1|192\.0\.2\.44/);
        });
      } finally {
        delete process.env.KV_REST_API_URL;
        delete process.env.KV_REST_API_TOKEN;
      }
    });

    await t.test('le fallback mémoire local limite la onzième requête sans se prétendre atomique', async function () {
      var app = loadEndpoint();
      var sharedIp = '192.0.2.200';
      for (var index = 0; index < 10; index += 1) {
        var accepted = await invoke(app, makePayload(), { ip: sharedIp });
        assert.equal(accepted.statusCode, 200, 'requête ' + (index + 1));
      }
      var limited = await invoke(app, makePayload(), { ip: sharedIp });
      assert.equal(limited.statusCode, 429);
      assert.match(limited.body.ref, /^DK-/);
      assert.equal(app.calls.length, 20);
      assert.match(apiSource, /fallback[^\n]*local[^\n]*non atomique/i);
      assert.match(apiSource, /get\/set KV ne sont pas atomiques/i);
    });
  } finally {
    if (previousApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousApiKey;
    if (previousKeySecret === undefined) delete process.env.KEY_DERIVATION_SECRET;
    else process.env.KEY_DERIVATION_SECRET = previousKeySecret;
    if (previousKvUrl === undefined) delete process.env.KV_REST_API_URL;
    else process.env.KV_REST_API_URL = previousKvUrl;
    if (previousKvToken === undefined) delete process.env.KV_REST_API_TOKEN;
    else process.env.KV_REST_API_TOKEN = previousKvToken;
  }
});
