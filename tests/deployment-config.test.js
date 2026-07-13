'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var fs = require('node:fs');
var path = require('node:path');

var ROOT = path.join(__dirname, '..');
var VERCEL_CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
var INDEX_HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
var VERCEL_IGNORE = fs.readFileSync(path.join(ROOT, '.vercelignore'), 'utf8');
var REVALIDATE_CACHE = 'public, max-age=0, must-revalidate';
var MEDIA_CACHE = 'public, max-age=86400, stale-while-revalidate=604800';

function matchesSource(source, pathname) {
  return new RegExp('^' + source + '$').test(pathname);
}

function headerValues(pathname, key) {
  var values = [];

  VERCEL_CONFIG.headers.forEach(function (rule) {
    if (!matchesSource(rule.source, pathname)) return;

    rule.headers.forEach(function (header) {
      if (header.key.toLowerCase() === key.toLowerCase()) values.push(header.value);
    });
  });

  return values;
}

function parseEnvExample() {
  var env = {};
  var content = fs.readFileSync(path.join(ROOT, '.env.example'), 'utf8');

  content.split(/\r?\n/).forEach(function (line) {
    var trimmed = line.trim();
    if (!trimmed || trimmed.charAt(0) === '#') return;

    var separator = trimmed.indexOf('=');
    assert.notEqual(separator, -1, 'invalid .env.example line: ' + line);

    var key = trimmed.slice(0, separator);
    assert.equal(Object.prototype.hasOwnProperty.call(env, key), false, 'duplicate variable: ' + key);
    env[key] = trimmed.slice(separator + 1);
  });

  return env;
}

test('Vercel keeps automatic static and API detection with a constrained SPA rewrite', function () {
  assert.equal(VERCEL_CONFIG.builds, undefined);
  assert.equal(VERCEL_CONFIG.routes, undefined);
  assert.equal(VERCEL_CONFIG.rewrites.length, 1);

  var rewrite = VERCEL_CONFIG.rewrites[0];
  assert.equal(rewrite.destination, '/index.html');

  ['/', '/conseiller', '/conseiller/confirmation'].forEach(function (pathname) {
    assert.equal(matchesSource(rewrite.source, pathname), true, pathname + ' must use the SPA rewrite');
  });

  ['/api', '/api/send-email', '/advisor-v2.js', '/advisor-v2.css', '/assets/marque/logo.png'].forEach(function (pathname) {
    assert.equal(matchesSource(rewrite.source, pathname), false, pathname + ' must bypass the SPA rewrite');
  });
});

test('Vercel preserves security headers without contradicting CSP framing policy', function () {
  var globalRule = VERCEL_CONFIG.headers.find(function (rule) {
    return rule.source === '/(.*)';
  });
  assert.ok(globalRule, 'global header rule is required');

  var keys = globalRule.headers.map(function (header) { return header.key; }).sort();
  assert.deepEqual(keys, [
    'Content-Security-Policy',
    'Cross-Origin-Opener-Policy',
    'Cross-Origin-Resource-Policy',
    'Permissions-Policy',
    'Referrer-Policy',
    'Strict-Transport-Security',
    'X-Content-Type-Options'
  ].sort());

  var csp = globalRule.headers.find(function (header) {
    return header.key === 'Content-Security-Policy';
  }).value;
  assert.match(csp, /frame-ancestors 'self' https:\/\/diskoov\.fr https:\/\/\*\.diskoov\.fr/);
  assert.doesNotMatch(csp, /api\.resend\.com|make\.com|zapier\.com/);

  VERCEL_CONFIG.headers.forEach(function (rule) {
    rule.headers.forEach(function (header) {
      assert.notEqual(header.key.toLowerCase(), 'x-frame-options');
    });
  });
});

test('Vercel caches static assets without making mutable filenames immutable', function () {
  VERCEL_CONFIG.headers.forEach(function (rule) {
    assert.doesNotMatch(rule.source, /\(\?!/, 'header sources must use Vercel-compatible patterns');
  });

  ['/advisor-v2.js', '/advisor-v2.css'].forEach(function (pathname) {
    assert.ok(headerValues(pathname, 'Cache-Control').includes(REVALIDATE_CACHE), pathname + ' must revalidate');
  });

  ['/assets/marque/logo.png', '/fonts/diskoov.woff2'].forEach(function (pathname) {
    assert.ok(headerValues(pathname, 'Cache-Control').includes(MEDIA_CACHE), pathname + ' must use the media cache');
  });

  assert.deepEqual(headerValues('/config.js', 'Cache-Control'), [REVALIDATE_CACHE]);
  assert.deepEqual(headerValues('/index.html', 'Cache-Control'), [REVALIDATE_CACHE]);
  assert.ok(headerValues('/api/send-email', 'Cache-Control').includes('no-store, no-cache, must-revalidate'));
});

test('advisor assets share one release token to prevent mixed cached versions', function () {
  var expectedAssets = [
    'advisor-v2.css',
    'product-rules.js',
    'advisor-engine.js',
    'advisor-v2.js'
  ];
  var tokens = expectedAssets.map(function (asset) {
    var match = INDEX_HTML.match(new RegExp(asset.replace('.', '\\.') + '\\?v=([^"\\s]+)'));
    assert.ok(match, asset + ' must expose a release token');
    return match[1];
  });

  assert.equal(new Set(tokens).size, 1, 'advisor assets must use the same release token');
});

test('.env.example mirrors send-email variables and references the deployed logo', function () {
  var env = parseEnvExample();
  var source = fs.readFileSync(path.join(ROOT, 'api', 'send-email.ts'), 'utf8');
  var referenced = new Set();
  var match;
  var processEnv = /process\.env\.([A-Z0-9_]+)/g;

  while ((match = processEnv.exec(source)) !== null) referenced.add(match[1]);
  referenced.delete('VERCEL_URL');

  assert.deepEqual(Object.keys(env).sort(), Array.from(referenced).sort());
  assert.equal(env.PUBLIC_CONTACT_NAME, "L'\u00e9quipe Diskoov");
  assert.equal(env.PUBLIC_CONTACT_EMAIL, 'contact@diskoov.fr');
  assert.equal(env.LOGO_URL, 'https://configurateur.diskoov.fr/assets/marque/logo-diskoov-bleu-orange.png');

  var logoPath = new URL(env.LOGO_URL).pathname.replace(/^\//, '');
  assert.equal(fs.existsSync(path.join(ROOT, logoPath)), true, 'configured logo must exist');
});

test('internal sources and obsolete collateral are excluded from the public build', function () {
  [
    '.vs/',
    'conception-v2/',
    'docs-regles/',
    'tasks/',
    'tests/',
    'validation-xavier/',
    '*.zip',
    'GUIDE-DISKOOV.html'
  ].forEach(function (entry) {
    assert.match(VERCEL_IGNORE, new RegExp('^' + entry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'm'));
  });
});
