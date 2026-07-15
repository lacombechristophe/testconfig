(function (root) {
  'use strict';

  var definitions = {
    clock: { body: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' },
    shield: { body: '<path d="M12 2.8 5 5.8v5.3c0 4.5 2.7 7.8 7 10.1 4.3-2.3 7-5.6 7-10.1V5.8l-7-3Z"/><path d="m8.7 12 2.1 2.1 4.7-4.7"/>' },
    safety: { body: '<path d="M12 2.8 5 5.8v5.3c0 4.5 2.7 7.8 7 10.1 4.3-2.3 7-5.6 7-10.1V5.8l-7-3Z"/>' },
    user: { body: '<circle cx="12" cy="7.5" r="3.2"/><path d="M5.2 20.5c.8-4.2 3.1-6.4 6.8-6.4s6 2.2 6.8 6.4"/>' },
    clean: { body: '<path d="M7 2.8v7.4M3.3 6.5h7.4M17 3.5v5M14.5 6h5"/><path d="M3.5 15.1c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0M3.5 19.2c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0"/>' },
    season: { body: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2 12h2.2M19.8 12H22M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5"/>' },
    aesthetics: { body: '<path d="M4.5 19.5c6.6-.1 11.7-5.2 15-15-9.8 3.3-14.9 8.4-15 15Z"/><path d="M5 19c3.2-4.4 6.7-8 11-10.8"/>' },
    automatic: { body: '<path d="M8 3.5v17M4.8 6.8 8 3.5l3.2 3.3M16 20.5v-17M12.8 17.2l3.2 3.3 3.2-3.3"/>' },
    space: { body: '<path d="M8.5 3H3v5.5M15.5 3H21v5.5M21 15.5V21h-5.5M8.5 21H3v-5.5"/>' },
    economy: { body: '<path d="M17.8 7.2A6.8 6.8 0 1 0 17.8 16.8M5.2 9.5h8.7M5.2 14.5h8.7"/>' },
    gear: { body: '<circle cx="12" cy="12" r="3.1"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>' },
    comfort: { body: '<path d="M7 13V7a3 3 0 0 1 6 0v6M4 13h13a3 3 0 0 1 3 3v1H8a4 4 0 0 1-4-4Z"/><path d="M7 17v4M18 17v4"/>' },
    compass: { body: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>' },
    motor: { body: '<rect x="5" y="7" width="14" height="10.5" rx="1.8"/><path d="M8.5 7V4.2h7V7M8 10h8M8 13h8M8 16h5M5 9.2H2.2v6.1H5M19 9.2h2.8v6.1H19"/>' },
    'low-protection': { body: '<path d="M12 2.8 5.8 5.5v4.8c0 3.9 2.3 6.9 6.2 9 3.9-2.1 6.2-5.1 6.2-9V5.5L12 2.8Z"/><path d="M3.2 20.5c1.6-1 3.2-1 4.8 0s3.2 1 4.8 0 3.2-1 4.8 0 3.2 1 4.8 0"/>' },
    snowflake: { body: '<path d="M12 2v20M3.8 7.2l16.4 9.6M20.2 7.2 3.8 16.8"/><path d="m8.8 4.5 3.2 3 3.2-3M8.8 19.5l3.2-3 3.2 3M4.5 10.3l4.2 1.1-1.1-4.1M19.5 13.7l-4.2-1.1 1.1 4.1M16.4 7.3l-1.1 4.1 4.2-1.1M7.6 16.7l1.1-4.1-4.2 1.1"/>' },
    hand: { body: '<path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8M6 14v-2a2 2 0 0 0-4 0v4a6 6 0 0 0 6 6h4a8 8 0 0 0 8-8v-3a2 2 0 0 0-4 0v1"/>' },
    eye: { body: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.6"/>' },
    'eye-off': { body: '<path d="M3 3l18 18M10.6 6.2A11 11 0 0 1 12 6c6.5 0 10 6 10 6a16 16 0 0 1-3 3.7M6.3 6.3C3.5 8.1 2 12 2 12s3.5 6 10 6c1 0 2-.2 2.8-.4M9.9 9.9a3 3 0 0 0 4.2 4.2"/>' },
    tape: { body: '<circle cx="8.5" cy="10.5" r="5.8"/><circle cx="8.5" cy="10.5" r="2"/><path d="M8.5 16.3h10.8v4.2H8.5M12.5 16.5v2M16.5 16.5v2"/>' },
    bolt: { body: '<path d="M13.5 2 5 14h6l-1 8 9-13h-5.5V2Z"/>' },
    access: { body: '<path d="M3.5 22c2.2-5 5.2-7 8.5-7s6.3-2.2 8.5-7"/><path d="M6 15V8M3 10c0-2 1-4 3-4s3 2 3 4c0 2-1 3-3 3s-3-1-3-3ZM18 10V4M15 6c0-2 1-4 3-4s3 2 3 4c0 2-1 3-3 3s-3-1-3-3Z"/><path d="m11 19 1.5.8M15 16.8l1.5.8"/>' },
    check: { body: '<circle cx="12" cy="12" r="9"/><path d="m8.3 12.2 2.4 2.4 5-5.2"/>' },
    measure: { body: '<path d="m5 17 12-12 2 2L7 19l-2-2Z"/><path d="m10 12 2 2M13 9l2 2M7 15l2 2"/>' },
    pool: { body: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M6 10c1.3-1 2.7-1 4 0s2.7 1 4 0 2.7-1 4 0M6 14c1.3-1 2.7-1 4 0s2.7 1 4 0 2.7-1 4 0"/>' },
    install: { body: '<path d="M14.5 6.5a4 4 0 0 0-5 5L4 17l3 3 5.5-5.5a4 4 0 0 0 5-5L15 12l-3-3 2.5-2.5Z"/>' },
    mechanism: { body: '<circle cx="8" cy="11" r="5"/><circle cx="8" cy="11" r="2"/><path d="M13 8h5.5l2.5 2.5v3L18.5 16H13M4.5 16v4M11.5 16v4M2.5 20h11"/>' },
    power: { body: '<path d="M9 3v6M15 3v6M7 8h10v2a5 5 0 0 1-5 5v6M9 21h6"/>' },
    move: { body: '<path d="m18 8 4 4-4 4M6 8l-4 4 4 4M2 12h20"/>' },
    cover: { viewBox: '0 0 64 48', body: '<path d="M13 7h38l9 14v8H4v-8L13 7Z"/><path d="M13 7l-9 14h56L51 7"/><path d="M9 29h46M14 21l5-14M27 21V7M40 21l-5-14M50 21 45 7"/><path d="M4 38c4 0 4 3 8 3s4-3 8-3 4 3 8 3 4-3 8-3 4 3 8 3 4-3 8-3 4 3 8 3"/>' },
    bars: { body: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M4 8h16M4 12h16M4 16h16"/>' },
    shutter: { viewBox: '0 0 64 48', body: '<rect x="7" y="5" width="50" height="31" rx="2.5"/><path d="M12 11h40M12 16.5h40M12 22h40M12 27.5h40M12 33h40"/><path d="M7 5h4v31M53 5h4v31"/><path d="M7 38c3.6 0 3.6 3 7.2 3s3.6-3 7.2-3 3.6 3 7.2 3 3.6-3 7.2-3 3.6 3 7.2 3 3.6-3 7.2-3 3.6 3 7.2 3"/>' },
    shelter: { viewBox: '0 0 64 48', body: '<path d="M5 39V24C5 14 13 6 23 6s18 8 18 18v15"/><path d="M23 39V21c0-8 6.7-15 15-15s15 7 15 15v18"/><path d="M14 39V26c0-5 4-9 9-9M32 39V23c0-5 4-9 9-9"/><path d="M5 28h48M5 34h48M3 39h58"/>' },
    deck: { viewBox: '0 0 64 48', body: '<path d="m32 6 29 11-29 11L3 17 32 6Z"/><path d="M13 18.5 32 11l19 7.5M22 24.5V13.5M42 24.5V13.5"/><path d="M3 24.5 32 35l29-10.5M3 32 32 42l29-10"/><path d="M32 28v14"/>' },
    lock: { body: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>' },
    verified: { body: '<path fill="currentColor" stroke="none" d="m12 2.2 2.1 1.2 2.4-.2 1.2 2.1 2.1 1.2-.2 2.4 1.2 2.1-1.2 2.1.2 2.4-2.1 1.2-1.2 2.1-2.4-.2-2.1 1.2-2.1-1.2-2.4.2-1.2-2.1-2.1-1.2.2-2.4L3.2 12l1.2-2.1-.2-2.4 2.1-1.2 1.2-2.1 2.4.2L12 2.2Z"/><path stroke="#fff" stroke-width="1.8" d="m8.6 12 2.1 2.1 4.7-4.7"/>' },
    route: { body: '<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h4a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h8"/><path d="m15 15 2 2-2 2"/>' },
    users: { body: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="3"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8"/>' },
    message: { body: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3v-7a4 4 0 0 1-1-2.6V7a4 4 0 0 1 4-4h11a4 4 0 0 1 4 4v8Z"/>' },
    target: { body: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M22 12h-3M12 22v-3M2 12h3"/>' },
    compare: { body: '<path d="M4 7h11M4 12h16M4 17h8"/><path d="m16 4 3 3-3 3"/>' },
    balance: { body: '<path d="M12 3v18M4 6h16M8 21h8"/><path d="m7 6-4 8h8L7 6Zm10 0-4 8h8l-4-8Z"/><path d="M3 14c.7 2 2 3 4 3s3.3-1 4-3M13 14c.7 2 2 3 4 3s3.3-1 4-3"/>' },
    'arrow-right': { body: '<path d="M5 12h14M13 6l6 6-6 6"/>' },
    star: { body: '<path d="m12 2.8 2.8 5.7 6.3.9-4.6 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2-4.6-4.4 6.3-.9L12 2.8Z"/>' },
    'shape-rect': { viewBox: '0 0 124 68', body: '<rect x="7" y="5" width="110" height="58" rx="3"/>' },
    'shape-oval': { viewBox: '0 0 124 68', body: '<ellipse cx="62" cy="34" rx="49" ry="30"/>' },
    'shape-free': { viewBox: '0 0 124 68', body: '<path d="M21 21C27 7 45 3 62 9c12 4 16 9 29 8 13-1 20 10 16 24-5 16-19 23-42 20-23 3-43-4-47-17-2-8-1-16 3-23Z"/>' },
    'basin-rect': { viewBox: '0 0 64 44', body: '<rect x="13" y="9" width="38" height="26" rx="1.8"/><path d="M18 16h28M18 21h28M18 26h28" stroke-width="1" opacity=".28"/>' },
    'basin-oval': { viewBox: '0 0 64 44', body: '<ellipse cx="32" cy="22" rx="20" ry="13"/><ellipse cx="32" cy="22" rx="16" ry="9" stroke-width="1" opacity=".28"/>' },
    'basin-free': { viewBox: '0 0 64 44', body: '<path d="M13 29C10 20 15 10 24 9c7-1 10 4 16 4 8 0 12 6 9 13-3 8-13 10-22 8-7-1-11-2-14-5Z"/><path d="M18 27c-2-6 2-12 8-13 5-1 8 3 13 3 5 0 8 4 6 8-2 5-9 7-16 5-5-1-8-1-11-3Z" stroke-width="1" opacity=".28"/>' },
    zoom: { body: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4 4M10.5 7.5v6M7.5 10.5h6"/>' },
    document: { body: '<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 11h6M9 15h6M9 19h4"/>' },
    unsure: { body: '<circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 0 1 4.6 1c0 1.7-2.4 2-2.4 3.5M12 17h.01"/>' },
    tools: { body: '<path d="m4 20 8.5-8.5M14 4l6 6M16.5 2.5l5 5-3 3-5-5 3-3Z"/><path d="M5 5.5 8.5 9 5 12.5 1.5 9 5 5.5Z"/>' },
    camera: { body: '<path d="M4 8a2 2 0 0 1 2-2h2l1.4-1.8a2 2 0 0 1 1.6-.7h2a2 2 0 0 1 1.6.7L16 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><circle cx="12" cy="13" r="3.4"/>' },
    info: { body: '<circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/>' },
    share: { body: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>' }
  };

  var aliases = {
    touch: 'hand',
    manual: 'hand',
    certified: 'shield'
  };

  function escapeAttribute(value) {
    return String(value || '').replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function resolve(name) {
    var requested = String(name || 'unsure');
    return definitions[aliases[requested] || requested] || definitions.unsure;
  }

  function render(name, options) {
    options = options || {};
    var requested = String(name || 'unsure');
    var definition = resolve(requested);
    var viewBox = definition.viewBox || '0 0 24 24';
    var className = options.className || 'diskoov-icon diskoov-icon--' + requested.replace(/[^a-z0-9-]/gi, '').toLowerCase();
    var width = options.width == null ? '' : ' width="' + escapeAttribute(options.width) + '"';
    var height = options.height == null ? '' : ' height="' + escapeAttribute(options.height) + '"';
    var strokeWidth = options.strokeWidth == null ? '1.7' : escapeAttribute(options.strokeWidth);
    var label = options.label ? ' role="img" aria-label="' + escapeAttribute(options.label) + '"' : ' aria-hidden="true"';
    return '<svg class="' + escapeAttribute(className) + '" viewBox="' + viewBox + '"' + width + height
      + ' fill="none" stroke="currentColor" stroke-width="' + strokeWidth
      + '" stroke-linecap="round" stroke-linejoin="round"' + label + '>' + definition.body + '</svg>';
  }

  function hydrate(scope) {
    var rootNode = scope && scope.querySelectorAll ? scope : document;
    Array.prototype.slice.call(rootNode.querySelectorAll('[data-diskoov-icon]')).forEach(function (slot) {
      var markup = render(slot.getAttribute('data-diskoov-icon'), {
        className: slot.getAttribute('data-icon-class') || undefined,
        width: slot.getAttribute('data-icon-width'),
        height: slot.getAttribute('data-icon-height'),
        strokeWidth: slot.getAttribute('data-icon-stroke'),
        label: slot.getAttribute('data-icon-label')
      });
      slot.insertAdjacentHTML('beforebegin', markup);
      slot.remove();
    });
  }

  root.DiskoovIcons = Object.freeze({ render: render, hydrate: hydrate });
}(window));
