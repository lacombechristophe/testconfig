(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.DISKOOV_RULES = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var STATUS = Object.freeze({ EXACT: 'exact', INDICATIVE: 'indicative', QUOTE: 'quote' });
  var VAT = 1.20;

  var PRODUCTS = Object.freeze({
    bab: { label: 'Bâche à barres Secu Classic', family: 'bab', image: 'assets/produits/conseiller/bab.webp' },
    ore_compact: { label: 'Oré Compact', family: 'ore', image: 'assets/produits/conseiller/ore-fermee.webp' },
    ore_essential: { label: 'Oré Essential', family: 'ore', image: 'assets/produits/conseiller/ore-ouverte.webp' },
    auto: { label: 'Coverseal automatique', family: 'coverseal', image: 'assets/produits/conseiller/coverseal.webp' },
    semi: { label: 'Coverseal semi-automatique', family: 'coverseal', image: 'assets/produits/conseiller/coverseal.webp' },
    eden: { label: 'Eden', family: 'eden', image: 'assets/produits/conseiller/eden.webp' },
    volet_hs: { label: 'Volet hors-sol', family: 'volet', image: 'assets/produits/conseiller/volet-hors-sol.webp' },
    volet_immerge: { label: 'Volet immergé', family: 'volet', image: 'assets/produits/conseiller/volet-immerge.webp' },
    masterdeck: { label: 'Terrasse mobile MasterDeck', family: 'masterdeck', image: 'assets/produits/conseiller/masterdeck.webp' },
    ul: { label: 'Abri Master Ultra Bas 1.2', family: 'abri', image: 'assets/produits/conseiller/abri-ultra-bas.webp' },
    m18: { label: 'Abri Master 18', family: 'abri', image: 'assets/produits/conseiller/abri-bas.webp' },
    m30: { label: 'Abri Master 30', family: 'abri', image: 'assets/produits/conseiller/abri-bas.webp' },
    m50: { label: 'Abri Master Bas 5.0', family: 'abri', image: 'assets/produits/conseiller/abri-bas.webp' },
    mid: { label: 'Abri mi-haut', family: 'abri', image: 'assets/produits/conseiller/abri-mi-haut.webp' }
  });

  var ORE_COMPACT = {
    lengths: [3, 4, 5, 6, 7], widths: [2.5, 3, 3.5],
    prices: {
      3: [4451, 4555, 4716], 4: [4499, 4640, 4773], 5: [4678, 4773, 4962],
      6: [4839, 4962, 5151], 7: [5047, 5113, 5283]
    }
  };
  var ORE_ESSENTIAL = {
    lengths: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12], widths: [2.5, 3, 3.5, 4, 4.5, 5],
    prices: {
      3: [4946, 5061, 5240, 5387, 5518, 5954], 4: [4998, 5156, 5303, 5460, 5544, 6195],
      5: [5198, 5303, 5513, 5618, 5817, 6384], 6: [5376, 5513, 5723, 5849, 6132, 6563],
      7: [5607, 5681, 5870, 5922, 6426, 6878], 8: [5796, 5870, 6017, 6174, 6720, 6993],
      9: [5964, 6027, 6185, 6353, 7046, 7182], 10: [6090, 6248, 6300, 6521, 7140, 7298],
      11: [6279, 6510, 6731, 6941, 7245, 7371], 12: [6668, 6836, 6972, 7119, 7340, 7508]
    }
  };
  var ORE_LINE_ITEMS_HT = {
    transport: 428,
    poseCompact: 0,
    poseEssential: 310,
    solar: 416,
    blockCut: 193.6,
    antiWind7: 40,
    antiWind10: 60,
    winterStrap: 288
  };
  var ORE_EXTRA_RETREAT_HT = { 2.5: 180, 3: 210, 3.5: 240, 4: 270, 4.5: 300, 5: 300 };

  var LAME_TIERS = [
    [3, 219.41, 449.99], [3.5, 248.53, 513.34], [4, 277.65, 576.70],
    [4.5, 306.75, 640.06], [5, 335.87, 703.41], [5.5, 364.99, 766.77],
    [6, 394.10, 830.12], [6.5, 435.99, 919.32], [7, 464.70, 981.22],
    [7.5, 495.52, 1043.12], [8, 531.08, 1105.02]
  ];

  var SHIPPING_GROUPS = [
    [['26'], 562.38, 776.62],
    [['04', '05', '07', '30', '38', '42', '69', '84'], 776.62, 996.22],
    [['01', '06', '13', '34', '43', '48', '71', '73', '74', '83'], 889.10, 1103.34],
    [['03', '11', '12', '15', '31', '39', '63', '66', '81'], 996.22, 1215.81],
    [['09', '19', '21', '23', '25', '32', '46', '58', '65', '70', '82'], 1103.34, 1322.93],
    [['10', '16', '18', '24', '33', '36', '40', '41', '44', '45', '47', '52', '64', '68', '86', '87', '88', '89'], 1215.81, 1430.05],
    [['17', '28', '37', '51', '54', '55', '57', '67', '75', '77', '78', '79', '90', '91', '92', '93', '94', '95'], 1322.93, 1537.17],
    [['02', '08', '14', '22', '27', '29', '35', '49', '50', '53', '56', '59', '60', '61', '62', '72', '76', '80', '85'], 1430.05, 1649.65]
  ];

  // Prix commerciaux issus des classeurs Excel Diskoov. Les limites techniques
  // restent séparées et proviennent du catalogue AquaMaster TTC 02/2026.
  var ABRI_COMMERCIAL = {
    ul: {
      discount: 0.33,
      tiers: {
        2: [[390, 5384.166666666667], [480, 6048.333333333334]],
        3: [[390, 7335.833333333334], [480, 8000.833333333334], [530, 8970]],
        4: [[390, 9290.833333333334], [480, 9956.666666666668]],
        5: [[390, 11155.833333333334], [480, 11905.833333333334], [580, 13076.666666666668]],
        6: [[390, 13035.833333333334], [480, 13807.5], [580, 15237.5]]
      }
    },
    m18: {
      discount: 0.33,
      tiers: {
        2: [[390, 5384.166666666667], [480, 6048.333333333334]],
        3: [[390, 7335.833333333334], [480, 8000.833333333334], [530, 8970]],
        4: [[390, 9290.833333333334], [480, 9956.666666666668], [580, 10977.5]],
        5: [[390, 11155.833333333334], [480, 11905.833333333334], [530, 13076.666666666668]],
        6: [[390, 12885.833333333334], [480, 13805.833333333334], [580, 15238.333333333334]]
      }
    },
    m30: {
      discount: 0.33,
      tiers: {
        2: [[390, 5497.5], [480, 6175.833333333334]],
        3: [[390, 7490], [480, 8169.166666666667], [530, 9159.166666666668]],
        4: [[390, 9486.666666666668], [480, 10166.666666666668], [580, 11208.333333333334]],
        5: [[390, 11391.666666666668], [480, 12155.833333333334], [580, 13351.666666666668]],
        6: [[390, 13157.5], [480, 14098.333333333334], [580, 15558.333333333334]]
      }
    }
  };

  var ABRI_TECHNICAL = {
    ul: { minChordCm: 330, maxChordCm: 530, moduleWidthM: 2.10, modules: [2, 3, 4, 5, 6] },
    m18: { minChordCm: 330, maxChordCm: 580, moduleWidthM: 2.10, modules: [2, 3, 4, 5, 6, 7] },
    m30: { minChordCm: 330, maxChordCm: 580, moduleWidthM: 2.10, modules: [2, 3, 4, 5, 6, 7] },
    m50: { minChordCm: 330, maxChordCm: 580, moduleWidthM: 2.10, modules: [2, 3, 4, 5, 6, 7] },
    mid: { minChordCm: 400, maxChordCm: 1000, moduleWidthM: 2.15, modules: [2, 3, 4, 5, 6, 7, 8] }
  };

  function n(value) {
    var result = typeof value === 'number' ? value : parseFloat(String(value || '').replace(',', '.'));
    return Number.isFinite(result) ? result : 0;
  }

  function money(value) { return Math.round((n(value) + Number.EPSILON) * 100) / 100; }

  function normalizedDimensions(input) {
    var a = n(input && input.length);
    var b = n(input && input.width);
    return { length: Math.max(a, b), width: Math.min(a, b), area: a * b };
  }

  function nextTier(value, tiers) {
    for (var i = 0; i < tiers.length; i += 1) if (value <= tiers[i] + 0.0001) return tiers[i];
    return null;
  }

  function abriTechnicalSelection(product, dims) {
    var technical = ABRI_TECHNICAL[product];
    if (!technical) return null;
    var shelterLength = money(dims.length + 0.2);
    var chordCm = Math.ceil((dims.width + 0.3) * 100);
    var modules = Math.abs(dims.length - 8) < 0.0001 && Math.abs(dims.width - 4) < 0.0001 ? 4 : null;
    return {
      data: technical,
      shelterLength: shelterLength,
      chordCm: chordCm,
      modules: modules,
      moduleSupported: modules !== null && technical.modules.indexOf(modules) !== -1,
      chordSupported: chordCm >= technical.minChordCm && chordCm <= technical.maxChordCm
    };
  }

  function departmentCode(value) {
    var match = String(value || '').trim().match(/^(\d{2}|2A|2B)/i);
    return match ? match[1].toUpperCase() : '';
  }

  function shippingPrice(department, kind) {
    var code = departmentCode(department);
    for (var i = 0; i < SHIPPING_GROUPS.length; i += 1) {
      if (SHIPPING_GROUPS[i][0].indexOf(code) !== -1) return kind === 'immerge' ? SHIPPING_GROUPS[i][2] : SHIPPING_GROUPS[i][1];
    }
    return null;
  }

  function commonMissing(input, includeInstallation) {
    var missing = [];
    if (includeInstallation && !input.installation) missing.push('prestation souhaitée');
    if (!input.support) missing.push('support autour du bassin');
    if (!input.margelles) missing.push('margelles / niveau des plages');
    return missing;
  }

  function incomplete(product, missing, reference) {
    return result(product, {
      eligible: null,
      warnings: ['Configuration technique incomplète : ' + missing.join(', ') + '.'],
      reference: reference || 'Qualification technique',
      technical: { missingInputs: missing.slice() }
    });
  }

  function manualReview(product, warning, reference, technical) {
    return result(product, {
      eligible: null,
      warnings: [warning],
      reference: reference || 'Étude technique',
      technical: technical || {}
    });
  }

  function result(product, overrides) {
    var meta = PRODUCTS[product] || { label: product, image: '' };
    var base = {
      product: product, label: meta.label, family: meta.family || '', image: meta.image || '',
      status: STATUS.QUOTE, eligible: null, total: null, breakdown: [], warnings: [],
      reference: '', technical: {}
    };
    Object.keys(overrides || {}).forEach(function (key) { base[key] = overrides[key]; });
    return base;
  }

  function invalidDimensions(product) {
    return result(product, {
      eligible: false,
      warnings: ['Renseignez une longueur et une largeur valides pour vérifier ce produit.'],
      reference: 'Saisie bassin'
    });
  }

  function nonRectangular(product, input) {
    var shape = input && input.shape;
    if (['rect', 'oval', 'libre'].indexOf(shape) === -1) {
      return incomplete(product, ['forme du bassin'], 'Saisie bassin');
    }
    if (shape === 'rect') return null;
    return result(product, {
      eligible: null,
      warnings: ['Forme non rectangulaire : plan coté et validation fabricant nécessaires.'],
      reference: 'Étude sur mesure — forme du bassin'
    });
  }

  function calculateOre(product, input) {
    var shapeResult = nonRectangular(product, input);
    if (shapeResult) return shapeResult;
    var dims = normalizedDimensions(input);
    if (!dims.length || !dims.width) return invalidDimensions(product);
    var oreOptions = input.options || {};
    var missing = commonMissing(input, true);
    if (!input.clearance) missing.push('plage côté mécanisme');
    if (!input.electricity) missing.push('prise électrique disponible');
    if (missing.length) return incomplete(product, missing, 'REGLES-ORE — conditions d’implantation');
    if (input.electricity !== 'oui') {
      return manualReview(product, 'Sans prise électrique confirmée, la recharge et l’implantation Oré doivent être étudiées avant chiffrage.', 'REGLES-ORE — prise filaire requise', { electricity: input.electricity });
    }
    if ((input.filtration === true || oreOptions.blockCut === true) && !oreOptions.oreBlockCut) {
      return manualReview(product, 'Filtration hors-bord déclarée sans décision explicite de découpe : étude technique requise avant chiffrage.', 'REGLES-ORE — découpe bloc filtration', { outboardFiltration: true, blockCutConfirmed: false });
    }
    if (input.support === 'bois' || input.support === 'autre') {
      return manualReview(product, 'Support à valider avant chiffrage Oré : planéité, fixation et portance doivent être confirmées.', 'REGLES-ORE — support final terminé', { support: input.support });
    }
    if (input.margelles === 'debord') {
      return manualReview(product, 'Margelles/terrasses avec décalage de niveau : recouvrement 20 cm, guidage et jupe PVC à valider sur site.', 'REGLES-ORE — margelles et terrasses au même niveau', { margelles: input.margelles });
    }
    var table = product === 'ore_compact' ? ORE_COMPACT : ORE_ESSENTIAL;
    if (dims.length < table.lengths[0] || dims.width < table.widths[0]) {
      return result(product, {
        eligible: null,
        warnings: ['Dimensions inférieures au premier palier tarifaire documenté (' + table.lengths[0] + ' × ' + String(table.widths[0]).replace('.', ',') + ' m) : étude personnalisée requise.'],
        reference: 'REGLES-ORE — matrice dimensions/prix'
      });
    }
    var lTier = nextTier(dims.length, table.lengths);
    var wTier = nextTier(dims.width, table.widths);
    if (!lTier || !wTier) {
      return result(product, {
        eligible: false,
        warnings: ['Dimensions hors matrice ' + (product === 'ore_compact' ? 'Compact (7 × 3,5 m)' : 'Essential (12 × 5 m)') + ' : étude fabricant requise.'],
        reference: 'REGLES-ORE — matrice dimensions/prix',
        technical: { rollingClearanceCm: 60, totalClearanceCm: 80, mechanismHeightCm: 45 }
      });
    }
    if (input.clearance === 'moins_60' || input.clearance === '60_79') {
      return result(product, {
        eligible: input.clearance === 'moins_60' ? false : null,
        warnings: [input.clearance === 'moins_60' ? 'Moins de 60 cm côté mécanisme : roulement standard impossible.' : '60 à 79 cm disponibles : l’encombrement total documenté de 80 cm n’est pas garanti.'],
        reference: 'REGLES-ORE — encombrements 60 / 80 / 45 cm',
        technical: { rollingClearanceCm: 60, totalClearanceCm: 80, mechanismHeightCm: 45 }
      });
    }
    var base = table.prices[lTier][table.widths.indexOf(wTier)];
    var selectedOptions = [];
    var lines = [{ label: 'Base Oré ' + lTier + ' × ' + String(wTier).replace('.', ',') + ' m', amount: money(base) }];
    lines.push({ label: 'Transport', amount: ORE_LINE_ITEMS_HT.transport });
    if (input.installation === 'fourniture_pose') {
      var pose = product === 'ore_compact' ? ORE_LINE_ITEMS_HT.poseCompact : ORE_LINE_ITEMS_HT.poseEssential;
      if (pose > 0) lines.push({ label: 'Pose Diskoov', amount: pose });
    }
    if (oreOptions.oreSolar) {
      lines.push({ label: 'Panneau solaire d’appoint', amount: ORE_LINE_ITEMS_HT.solar });
      selectedOptions.push('Panneau solaire d’appoint.');
    }
    if (oreOptions.oreBlockCut) {
      lines.push({ label: 'Découpe bloc filtration', amount: ORE_LINE_ITEMS_HT.blockCut });
      selectedOptions.push('Découpe bloc filtration.');
    }
    if (oreOptions.oreAntiWind) {
      lines.push({ label: 'Sangle anti-vent', amount: lTier <= 7 ? ORE_LINE_ITEMS_HT.antiWind7 : ORE_LINE_ITEMS_HT.antiWind10 });
      selectedOptions.push('Sangle anti-vent.');
    }
    if (oreOptions.oreWinterStrap) {
      lines.push({ label: 'Sangle hivernage longitudinale', amount: ORE_LINE_ITEMS_HT.winterStrap });
      selectedOptions.push('Sangle hivernage longitudinale.');
    }
    if (oreOptions.oreExtraRetreat) {
      lines.push({ label: 'Recul supplémentaire d’un mètre', amount: ORE_EXTRA_RETREAT_HT[wTier] || 210 });
      selectedOptions.push('Recul supplémentaire d’un mètre.');
    }
    if (oreOptions.oreSpecialColor) {
      lines.push({ label: 'Coloris membrane hors standard', amount: money(base * 0.05) });
      selectedOptions.push('Coloris membrane hors standard.');
    }
    var warnings = [
      'Estimation TTC indicative selon le tarif Oré 2026.',
      'Prévoir 60 cm de roulement et 80 cm d’encombrement total côté mécanisme.',
      input.installation === 'fourniture' ? 'Fourniture seule : les contraintes de pose seront vérifiées avec vous.' : 'Pose demandée : les accès et conditions de pose seront vérifiés avec vous.'
    ];
    if (product === 'ore_compact' && input.installation === 'fourniture_pose') warnings.push('Pose Diskoov incluse pour Oré Compact.');
    var totalHT = lines.reduce(function (sum, line) { return sum + line.amount; }, 0);
    return result(product, {
      status: STATUS.INDICATIVE,
      eligible: true,
      total: money(totalHT * VAT),
      breakdown: lines.map(function (line) { return { label: line.label, amount: money(line.amount * VAT) }; }),
      warnings: warnings.concat(selectedOptions),
      reference: 'REGLES-ORE — matrice tarifaire source',
      technical: { selectedLength: lTier, selectedWidth: wTier, sourceCurrency: 'HT', rollingClearanceCm: 60, totalClearanceCm: 80, mechanismHeightCm: 45, selectedOptions: selectedOptions, installationIncluded: input.installation === 'fourniture_pose' }
    });
  }

  function calculateBab(input) {
    var shapeResult = nonRectangular('bab', input);
    if (shapeResult) return shapeResult;
    var dims = normalizedDimensions(input);
    if (!dims.length || !dims.width) return invalidDimensions('bab');
    var missing = commonMissing(input, true);
    if (missing.length) return incomplete('bab', missing, 'REGLES-BAB — conditions basiques');
    if (input.support === 'autre') {
      return manualReview('bab', 'Support non standard : ancrage et fixation des pitons à valider avant estimation.', 'REGLES-BAB — ancrage support béton/lambourdes', { support: input.support });
    }
    if (dims.length > 12 || dims.width > 5.4) {
      return result('bab', {
        eligible: false,
        warnings: ['Dimensions supérieures à la limite technique documentée (12 × 5,40 m).'],
        reference: 'REGLES-BAB — limites dimensionnelles'
      });
    }
    var opts = input.options || {};
    if (opts.rollingUp && dims.width > 5.3) {
      return result('bab', {
        eligible: false,
        warnings: ['Rolling-Up hors limite documentée : bassin maximal 12 × 5,30 m avec enrouleur motorisé.'],
        reference: 'REGLES-BAB — limite Rolling-Up',
        technical: { maxRollingUpLength: 12, maxRollingUpWidth: 5.3 }
      });
    }
    if (dims.width > 5) {
      return manualReview('bab', 'Largeur supérieure à la plage standard 12 × 5 m : la faisabilité jusqu’à la limite technique de 5,40 m doit être confirmée.', 'REGLES-BAB — largeur standard et limite transport', { width: dims.width });
    }
    if (opts.stair) {
      return manualReview('bab', 'La formule escalier disponible ne permet pas un forfait fiable : type, dimensions et barre de charge doivent être étudiés avant chiffrage.', 'REGLES-BAB — escalier sur étude', {
        stairType: opts.stairType || '',
        stairWidth: n(opts.stairWidth),
        stairPosition: opts.stairPosition || ''
      });
    }
    var surface = (dims.length + 0.5) * (dims.width + 0.5);
    var baseAmount = surface * 36.04 * 0.65;
    var lines = [{ label: 'Secu Classic — ' + String(money(surface)).replace('.', ',') + ' m²', amount: baseAmount }];
    if (opts.antiAbrasion) lines.push({ label: 'Bandes anti-abrasion', amount: surface * 3.64 * 0.70 });
    if (opts.blockCut) lines.push({ label: 'Découpe bloc filtration', amount: 137.07 * 0.70 });
    if (opts.rollingUp) lines.push({ label: 'Rolling-Up', amount: 947.50 * 0.70 });
    if (surface < 15) lines.push({ label: 'Majoration petite surface (< 15 m²)', amount: baseAmount * 0.15 });
    if (opts.cutCorners) lines.push({ label: 'Majoration angles coupés', amount: baseAmount * 0.15 });
    lines.push({ label: 'Emballage', amount: 96 }, { label: 'Transport', amount: 132 });
    var total = lines.reduce(function (sum, line) { return sum + line.amount; }, 0);
    return result('bab', {
      status: STATUS.INDICATIVE,
      eligible: true,
      total: money(total * VAT),
      breakdown: lines.map(function (line) { return { label: line.label, amount: money(line.amount * VAT) }; }),
      warnings: ['Estimation TTC indicative selon le tarif BAB 2026, emballage et transport inclus.', input.support === 'bois' ? 'Support bois déclaré : ancrage sur lambourdes/plots béton à valider.' : 'Ancrage sous réserve d’un support compatible.', input.margelles === 'debord' ? 'Margelles avec débord : bandes anti-abrasion et frottements à contrôler.' : 'Validation de la forme, des renforts et des découpes par Diskoov.', input.installation === 'fourniture_pose' ? 'Pose demandée : non incluse dans cette estimation BAB.' : 'Installation client suivant notice fabricant.'],
      reference: 'REGLES-BAB — grille 2026, remise de vente et frais',
      technical: { billingSurface: surface, maxLength: 12, maxWidth: 5.4, maxRollingUpWidth: 5.3 }
    });
  }

  function lameTier(width) {
    for (var i = 0; i < LAME_TIERS.length; i += 1) if (width <= LAME_TIERS[i][0] + 0.0001) return LAME_TIERS[i];
    return null;
  }

  function calculateVolet(kind, input) {
    var product = kind === 'immerge' ? 'volet_immerge' : 'volet_hs';
    var shapeResult = nonRectangular(product, input);
    if (shapeResult) return shapeResult;
    var dims = normalizedDimensions(input);
    if (!dims.length || !dims.width) return invalidDimensions(product);
    var missing = commonMissing(input, true);
    if (!input.electricity) missing.push('alimentation électrique proche');
    if (kind === 'immerge' && !input.immergedIntegration) missing.push('type d’intégration du volet immergé');
    if (missing.length) return incomplete(product, missing, 'REGLES-VOLETS — qualification avant chiffrage');
    var maxLength = kind === 'immerge' ? 14 : 12;
    var maxArea = kind === 'immerge' ? 84 : 72;
    if (dims.width < 2.45) {
      return result(product, {
        eligible: false,
        warnings: ['Largeur inférieure au minimum documenté de 2,45 m pour la conformité sécurité des lames.'],
        reference: 'REGLES-VOLETS — largeur minimale de lames'
      });
    }
    if (dims.width > 6 || dims.length > maxLength || dims.area > maxArea) {
      return result(product, {
        eligible: false,
        warnings: ['Dimensions hors limite documentée (' + maxLength + ' × 6 m, ' + maxArea + ' m² maximum).'],
        reference: 'REGLES-VOLETS — limites fabricant'
      });
    }
    var tier = lameTier(dims.width);
    if (!tier) return result(product, { eligible: false, warnings: ['Largeur hors grille de lames.'], reference: 'REGLES-VOLETS — tarif lames' });
    if (input.installation !== 'fourniture_pose') {
      return manualReview(product, 'La grille transport fournie couvre une livraison/installation ; une fourniture seule doit être chiffrée manuellement.', 'REGLES-VOLETS — livraison + installation 2026', { installation: input.installation });
    }
    if (input.support === 'bois' || input.support === 'autre') {
      return manualReview(product, 'Support non standard pour volet : fixation, platines, alimentation et accès chantier à valider sur devis.', 'REGLES-VOLETS — conditions de pose', { support: input.support });
    }
    if (kind === 'hors_sol' && input.margelles === 'sans') {
      return manualReview(product, 'Volet hors-sol sans margelles : implantation des pieds/platines à valider avant prix.', 'REGLES-VOLETS — structure fixée sur margelle', { margelles: input.margelles });
    }
    if (kind === 'immerge' && input.immergedIntegration !== 'paroi') {
      return manualReview(product, 'Volet immergé avec fond de bassin, caillebotis ou intégration spéciale : mur, poutre, équerres et caillebotis doivent être chiffrés séparément.', 'REGLES-VOLETS — options immergées', { immergedIntegration: input.immergedIntegration });
    }
    var options = input.options || {};
    if (options.voletSolar) {
      return manualReview(product, 'Alimentation solaire / pré-équipement demandé : plus-value et compatibilité moteur à chiffrer sur devis.', 'REGLES-VOLETS — options alimentation', { voletSolar: true });
    }
    if (options.stair) {
      return manualReview(product, 'La découpe d’escalier dépend de sa forme, de ses dimensions et de la finition équerre ou lisse ; ces éléments seront validés avant chiffrage.', 'REGLES-VOLETS — escaliers 2026', {
        stairType: options.stairType || '',
        stairWidth: n(options.stairWidth),
        stairPosition: options.stairPosition || ''
      });
    }
    var wantsPolycarbonate = !!options.polycarbonate || /^poly_/.test(String(input.productColor || ''));
    var structureRef = '';

    if (kind === 'immerge') {
      if (input.electricity !== 'oui') {
        return manualReview(product, 'Un volet immergé motorisé nécessite une alimentation validée ; pré-équipement électrique à confirmer.', 'REGLES-VOLETS — moteur 24V', { electricity: input.electricity });
      }
      if (dims.width <= 4 && dims.area <= 50) structureRef = 'VRSUB4';
      else if (dims.width <= 5 && dims.area <= 50) structureRef = 'VRSUB5';
      else structureRef = 'VRSUB6';
    } else if (input.electricity === 'non' && dims.width <= 3 && dims.length <= 6) {
      structureRef = 'VRMANU';
    } else if (input.electricity !== 'oui') {
      return manualReview(product, 'Sans alimentation proche, le volet hors-sol motorisé doit être étudié avec option solaire ou pré-équipement électrique.', 'REGLES-VOLETS — alimentation solaire / Easy Plug', { electricity: input.electricity });
    } else if (dims.width < 3) {
      return manualReview(product, 'Pour un volet hors-sol motorisé de moins de 3 m de largeur, la référence de structure doit être confirmée sur devis.', 'REGLES-VOLETS — structures hors-sol', { width: dims.width });
    } else if (dims.width <= 4 && dims.length <= 8) {
      structureRef = 'VRSIL80S';
    } else if (dims.width >= 4 && dims.width <= 5 && dims.length <= 10) {
      structureRef = 'VRSILC120';
    } else if (dims.width > 4 && dims.width <= 6 && dims.length <= 12) {
      structureRef = 'VRSIL200S';
    } else {
      return result(product, {
        eligible: null,
        warnings: ['Combinaison longueur/largeur non couverte sans ambiguïté par les références de structure : chiffrage manuel requis.'],
        reference: 'REGLES-VOLETS — structures hors-sol'
      });
    }

    if (kind === 'immerge' && structureRef === 'VRSUB6' && dims.width > 5) {
      return manualReview(product, 'Au-delà de 5 m de largeur, le renfort anti-flexion VRSUB6 doit être validé pour préserver la garantie.', 'REGLES-VOLETS — renfort VRSUB6', {
        structureRef: structureRef,
        width: dims.width,
        reinforcementPublicHT: 540
      });
    }

    var shipping = shippingPrice(input.department, kind);
    var pricingValidationPending = ['livraison/pose', 'régime HT/TTC', 'emballage', 'bornes SUB/C120'];
    var technical = {
      structureRef: structureRef,
      bladeWidthTier: tier[0],
      material: wantsPolycarbonate ? 'polycarbonate' : 'PVC',
      installationRequested: input.installation === 'fourniture_pose',
      pricingValidationPending: pricingValidationPending
    };
    if (shipping === null) {
      technical.transportZoneCovered = false;
      return result(product, {
        eligible: true,
        warnings: ['Projet techniquement qualifié, mais la zone de transport doit être étudiée sur devis. Aucun total automatique n’est produit.'],
        reference: 'REGLES-VOLETS — qualification technique, prix sur devis',
        technical: technical
      });
    }
    technical.transportZoneCovered = true;
    return result(product, {
      eligible: true,
      warnings: ['Projet techniquement qualifié. Prix sur devis jusqu’à validation écrite de la livraison/pose, du régime HT/TTC, de l’emballage et des bornes SUB/C120.'],
      reference: 'REGLES-VOLETS — qualification technique, prix sur devis',
      technical: technical
    });
  }

  function calculateAbri(product, input) {
    var shapeResult = nonRectangular(product, input);
    if (shapeResult) return shapeResult;
    var dims = normalizedDimensions(input);
    if (!dims.length || !dims.width) return invalidDimensions(product);
    var missing = commonMissing(input, true);
    if (missing.length) return incomplete(product, missing, 'REGLES-ABRIS-AQUAMASTER — conditions chantier');
    if (input.installation !== 'fourniture_pose') {
      return manualReview(product, 'Le calcul abri documenté inclut transport et pose de référence ; une fourniture seule doit être chiffrée manuellement.', 'REGLES-ABRIS-AQUAMASTER — pose/livraison', { installation: input.installation });
    }
    if (input.support === 'bois' || input.support === 'autre') {
      return manualReview(product, 'Support chantier non standard pour abri : rails, fixation et niveau doivent être validés avant prix.', 'REGLES-ABRIS-AQUAMASTER — accès/support chantier', { support: input.support });
    }
    var selection = abriTechnicalSelection(product, dims);
    if (!selection) return result(product, { eligible: null, warnings: ['Modèle non relié à une grille technique qualifiée.'] });
    if (!selection.chordSupported) {
      return result(product, {
        eligible: false,
        warnings: ['Largeur avec marge technique hors plage du modèle (' + selection.data.minChordCm + ' à ' + selection.data.maxChordCm + ' cm).'],
        reference: 'REGLES-ABRIS-AQUAMASTER — limites de corde catalogue 2026',
        technical: { shelterLength: selection.shelterLength, chordCm: selection.chordCm, modules: selection.modules }
      });
    }
    if (!selection.moduleSupported) {
      return result(product, {
        eligible: null,
        warnings: ['Le nombre d’éléments ne peut pas être confirmé à partir des seules dimensions : étude personnalisée requise.'],
        reference: 'REGLES-ABRIS-AQUAMASTER — nombre de modules à valider',
        technical: { shelterLength: selection.shelterLength, chordCm: selection.chordCm, modules: selection.modules }
      });
    }
    if (product === 'm50' || product === 'mid') {
      return result(product, {
        eligible: true,
        warnings: ['Projet techniquement qualifié. Prix sur devis jusqu’à validation écrite de la remise, des couleurs et du transport par zone.'],
        reference: 'REGLES-ABRIS-AQUAMASTER — qualification technique, prix sur devis',
        technical: { shelterLength: selection.shelterLength, chordCm: selection.chordCm, modules: selection.modules, pricingValidationPending: ['remise', 'couleurs', 'transport par zone'] }
      });
    }
    var data = ABRI_COMMERCIAL[product];
    if (!data) return result(product, { eligible: null, warnings: ['Modèle non relié à une grille tarifaire commerciale qualifiée.'] });
    var opts = input.options || {};
    if (opts.motorisation || opts.groundRail) {
      return manualReview(product, 'Motorisation ou rail au sol sélectionné : les dépendances catalogue sont trop spécifiques pour conserver un prix automatique fiable.', 'REGLES-ABRIS-AQUAMASTER — options à dépendances', { motorisation: !!opts.motorisation, groundRail: !!opts.groundRail });
    }
    var shelterLength = selection.shelterLength;
    var chordCm = selection.chordCm;
    var modules = selection.modules;
    var tiers = data.tiers[modules];
    if (!tiers) {
      return result(product, {
        eligible: true,
        warnings: ['Dimensions techniquement compatibles, mais combinaison absente de la grille Excel commerciale : étude personnalisée requise.'],
        reference: 'REGLES-ABRIS-AQUAMASTER — grille Excel commerciale 2026',
        technical: { shelterLength: shelterLength, chordCm: chordCm, modules: modules }
      });
    }
    var selected = null;
    for (var i = 0; i < tiers.length; i += 1) if (chordCm <= tiers[i][0]) { selected = tiers[i]; break; }
    if (!selected) {
      return result(product, {
        eligible: true,
        warnings: ['Dimensions techniquement compatibles, mais palier de corde absent de la grille Excel commerciale.'],
        reference: 'REGLES-ABRIS-AQUAMASTER — grille Excel commerciale 2026',
        technical: { shelterLength: shelterLength, chordCm: chordCm, modules: modules }
      });
    }
    return result(product, {
      eligible: true,
      warnings: ['Projet techniquement qualifié. Prix sur devis jusqu’à validation écrite de la remise, des couleurs et du transport par zone.'],
      reference: 'REGLES-ABRIS-AQUAMASTER — qualification technique, prix sur devis',
        technical: { shelterLength: shelterLength, chordCm: chordCm, selectedChordCm: selected[0], modules: modules, installationRequested: input.installation === 'fourniture_pose', pricingValidationPending: ['remise', 'couleurs', 'transport par zone'] }
    });
  }

  function calculate(product, input) {
    input = input || {};
    var shapeResult = nonRectangular(product, input);
    if (shapeResult) return shapeResult;
    if (product === 'bab') return calculateBab(input);
    if (product === 'ore_compact' || product === 'ore_essential') return calculateOre(product, input);
    if (product === 'volet_hs') return calculateVolet('hors_sol', input);
    if (product === 'volet_immerge') return calculateVolet('immerge', input);
    if (product === 'ul' || product === 'm18' || product === 'm30' || product === 'm50' || product === 'mid') return calculateAbri(product, input);
    if (product === 'masterdeck') {
      return result(product, {
        eligible: null,
        warnings: ['La matrice source MasterDeck comporte des ambiguïtés commerciales : étude sur mesure obligatoire.'],
        reference: 'ANNEXE-DONNEES-SOURCES — matrice MasterDeck'
      });
    }
    return result(product || '', { eligible: null, warnings: ['Produit inconnu du moteur de règles.'] });
  }

  function productOptions(product) {
    if (product === 'bab') return ['antiAbrasion', 'blockCut', 'rollingUp', 'cutCorners'];
    if (product === 'volet_hs' || product === 'volet_immerge') return ['polycarbonate'];
    return [];
  }

  return Object.freeze({
    STATUS: STATUS,
    PRODUCTS: PRODUCTS,
    calculate: calculate,
    productOptions: productOptions,
    normalizedDimensions: normalizedDimensions,
    departmentCode: departmentCode,
    shippingPrice: shippingPrice,
    money: money,
    _data: Object.freeze({
      oreCompact: ORE_COMPACT,
      oreEssential: ORE_ESSENTIAL,
      lameTiers: LAME_TIERS,
      abriCatalog: ABRI_TECHNICAL,
      abriCommercial: ABRI_COMMERCIAL,
      abriTechnical: ABRI_TECHNICAL
    })
  });
}));
