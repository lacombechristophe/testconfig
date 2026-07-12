(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.DISKOOV_ADVISOR = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var PRIORITIES = Object.freeze({
    clean: 'Gagner du temps au quotidien',
    safety: 'Sécuriser le bassin',
    season: 'Prolonger la saison de baignade',
    aesthetics: 'Préserver l’esthétique du jardin',
    automatic: 'Tout automatiser',
    space: 'Étudier une fermeture par plancher mobile',
    economy: 'Maîtriser le budget',
    unsure: 'Être conseillé sans préférence arrêtée'
  });

  var PROSPECT_FAMILIES = Object.freeze({
    covers: Object.freeze({ id: 'covers', label: 'Couvertures motorisées' }),
    'bar-cover': Object.freeze({ id: 'bar-cover', label: 'Couverture à barres' }),
    shutters: Object.freeze({ id: 'shutters', label: 'Volets de piscine' }),
    shelters: Object.freeze({ id: 'shelters', label: 'Abris télescopiques' }),
    deck: Object.freeze({ id: 'deck', label: 'Terrasse mobile' })
  });

  var PROSPECT_FAMILY_BY_TECHNICAL_FAMILY = Object.freeze({
    cover: 'covers',
    coverseal: 'covers',
    'custom-cover': 'covers',
    'bar-cover': 'bar-cover',
    shutter: 'shutters',
    shelter: 'shelters',
    'mobile-deck': 'deck'
  });

  var FAMILY_PRIORITY_BONUS = Object.freeze({
    clean: Object.freeze({ covers: 8, shutters: 7, shelters: 6, 'bar-cover': 3, deck: 2 }),
    safety: Object.freeze({ 'bar-cover': 7, covers: 0, shutters: 6, shelters: 0, deck: 0 }),
    season: Object.freeze({ shelters: 18, covers: 7, shutters: 2, 'bar-cover': 0, deck: 0 }),
    aesthetics: Object.freeze({ covers: 10, shutters: 9, deck: 9, shelters: 4, 'bar-cover': 0 }),
    automatic: Object.freeze({ shutters: 12, covers: 10, deck: 0, shelters: 0, 'bar-cover': -12 }),
    space: Object.freeze({ deck: 24, covers: 4, shutters: 2, shelters: 0, 'bar-cover': 0 }),
    economy: Object.freeze({ 'bar-cover': 22, shutters: 8, covers: 3, shelters: -3, deck: -8 })
  });

  var CANDIDATES = Object.freeze([
    candidate('ore_compact', 'Oré Compact', 'Couverture 4 saisons', 'cover', 'cov', 'cm',
      'Une protection discrète pensée pour les bassins compacts.',
      'assets/produits/conseiller/ore-fermee.webp', ['clean', 'safety', 'automatic', 'aesthetics'], '5_10'),
    candidate('ore_essential', 'Oré Essential', 'Couverture 4 saisons', 'cover', 'cov', 'cm',
      'Une solution quatre saisons qui protège le bassin toute l’année.',
      'assets/produits/conseiller/ore-ouverte.webp', ['clean', 'safety', 'automatic', 'season', 'aesthetics'], '10_15'),
    candidate('auto', 'Coverseal automatique', 'Couverture motorisée', 'coverseal', 'cov', 'cm',
      'Dimensions, alimentation, options, pose et tarif sont confirmés après étude du bassin.',
      'assets/produits/conseiller/coverseal.webp', ['clean', 'automatic', 'aesthetics'], '10_15'),
    candidate('semi', 'Coverseal semi-automatique', 'Couverture à étudier', 'coverseal', 'cov', 'cm',
      'Manipulation, dimensions, options, pose et tarif sont confirmés après étude du bassin.',
      'assets/produits/conseiller/coverseal.webp', ['clean', 'aesthetics'], '10_15'),
    candidate('eden', 'Eden', 'Couverture sur mesure', 'custom-cover', 'cov', 'cm',
      'Une solution étudiée au cas par cas avant toute proposition.',
      'assets/produits/conseiller/eden.webp', ['clean', 'aesthetics', 'space'], 'over25'),
    candidate('ul', 'Master Ultra Bas 1.2', 'Abri télescopique', 'shelter', 'shl', 'sm',
      'Une protection très basse qui préserve les lignes du jardin.',
      'assets/produits/conseiller/abri-ultra-bas.webp', ['clean', 'season', 'aesthetics'], '15_25'),
    candidate('m18', 'Abri Master 18', 'Abri télescopique', 'shelter', 'shl', 'sm',
      'Un abri bas télescopique à dimensionner selon le bassin.',
      'assets/produits/conseiller/abri-bas.webp', ['clean', 'season'], '15_25'),
    candidate('m30', 'Abri Master 30', 'Abri télescopique', 'shelter', 'shl', 'sm',
      'Davantage de volume tout en conservant une ligne basse.',
      'assets/produits/conseiller/abri-bas.webp', ['clean', 'season'], '15_25'),
    candidate('m50', 'Abri Master Bas 5.0', 'Abri télescopique', 'shelter', 'shl', 'sm',
      'La version la plus haute de la gamme basse, étudiée sur devis.',
      'assets/produits/conseiller/abri-bas.webp', ['clean', 'season'], 'over25'),
    candidate('mid', 'Abri mi-haut', 'Abri télescopique', 'shelter', 'shl', 'sm',
      'Un compromis entre discrétion et hauteur de circulation.',
      'assets/produits/conseiller/abri-mi-haut.webp', ['clean', 'season'], 'over25'),
    candidate('bab', 'Bâche à barres Secu Classic', 'Protection essentielle', 'bar-cover', 'oth', 'otherProduct',
      'Une solution simple, robuste et sécurisante au budget contenu.',
      'assets/produits/conseiller/bab.webp', ['safety', 'economy'], 'under5'),
    candidate('volet_hs', 'Volet hors-sol', 'Volet de piscine', 'shutter', 'oth', 'otherProduct',
      'Une couverture automatique fiable, sans travaux importants dans le bassin.',
      'assets/produits/conseiller/volet-hors-sol.webp', ['clean', 'safety', 'automatic', 'economy'], '5_10'),
    candidate('volet_immerge', 'Volet immergé', 'Volet de piscine', 'shutter', 'oth', 'otherProduct',
      'Une protection automatique intégrée et très discrète.',
      'assets/produits/conseiller/volet-immerge.webp', ['clean', 'automatic', 'aesthetics'], '10_15'),
    candidate('masterdeck', 'Terrasse mobile MasterDeck', 'Terrasse mobile', 'mobile-deck', 'oth', 'otherProduct',
      'Une structure, des guides et un plancher dimensionnés sur mesure pour fermer le bassin.',
      'assets/produits/conseiller/masterdeck.webp', ['aesthetics', 'space'], 'over25')
  ]);

  function candidate(id, title, category, family, eq, selectionType, description, image, strengths, budget) {
    return Object.freeze({
      id: id, title: title, category: category, family: family, eq: eq,
      prospectFamily: prospectFamilyFor(family),
      selectionType: selectionType, selectionValue: id, description: description,
      image: image, strengths: Object.freeze(strengths), budget: budget
    });
  }

  function prospectFamilyFor(itemOrFamily) {
    var family = typeof itemOrFamily === 'string' ? itemOrFamily : itemOrFamily && itemOrFamily.family;
    return PROSPECT_FAMILY_BY_TECHNICAL_FAMILY[family] || family || 'other';
  }

  function normalise(input) {
    input = input || {};
    var priorities = Array.isArray(input.priorities) ? input.priorities.filter(function (p) { return PRIORITIES[p]; }).slice(0, 2) : [];
    return {
      priorities: priorities,
      shape: ['rect', 'oval', 'libre'].indexOf(input.shape) !== -1 ? input.shape : 'rect',
      length: clampNumber(input.length, 3, 20, 8),
      width: clampNumber(input.width, 2, 12, 4),
      dimensionsKnown: input.dimensionsKnown === true || (typeof input.dimensionsKnown === 'undefined' && input.length !== null && input.length !== '' && input.width !== null && input.width !== '' && Number.isFinite(Number(input.length)) && Number.isFinite(Number(input.width))),
      budget: ['under5', '5_10', '10_15', '15_25', 'over25', 'unknown'].indexOf(input.budget) !== -1 ? input.budget : 'unknown',
      delay: ['urg', '6m', '1a', 'ref', 'unknown'].indexOf(input.delay) !== -1 ? input.delay : 'unknown'
    };
  }

  function clampNumber(value, min, max, fallback) {
    var n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  function recommendationScore(item, input) {
    var score = 40;
    input.priorities.forEach(function (priority, index) {
      var hit = item.strengths.indexOf(priority) !== -1;
      score += hit ? (index === 0 ? 22 : 16) : -3;
      score += familyPriorityBonus(item, priority, index);
    });
    if (!input.priorities.length || input.priorities.indexOf('unsure') !== -1) score += balancedBonus(item);
    score += modelPriorityBonus(item, input.priorities);
    if (input.budget !== 'unknown') score += budgetScore(item.budget, input.budget);
    if (input.shape === 'libre') score += item.id === 'eden' ? 26 : -18;
    if (input.delay === 'urg' && (item.id === 'bab' || item.id === 'volet_hs')) score += 7;
    if (input.delay === 'ref' && (item.family === 'shelter' || item.id === 'masterdeck')) score += 3;
    return score;
  }

  function familyPriorityBonus(item, priority, index) {
    var bonusByFamily = FAMILY_PRIORITY_BONUS[priority];
    if (!bonusByFamily) return 0;
    if (priority === 'safety' && item.strengths.indexOf('safety') === -1) return 0;
    var bonus = bonusByFamily[item.prospectFamily] || 0;
    return index === 0 ? bonus : Math.round(bonus * .7);
  }

  function modelPriorityBonus(item, priorities) {
    var score = 0;
    if (priorities.indexOf('automatic') !== -1) {
      if (item.id === 'auto') score += 6;
      if (item.id === 'volet_immerge') score += 4;
      if (item.id === 'volet_hs') score += 3;
    }
    if (priorities.indexOf('season') !== -1) {
      if (item.id === 'ore_essential') score += 5;
      if (item.id === 'm18') score += 3;
    }
    if (priorities.indexOf('aesthetics') !== -1) {
      if (item.id === 'eden') score += 5;
      if (item.id === 'volet_immerge') score += 5;
      if (item.id === 'ul') score += 4;
    }
    if (priorities.indexOf('economy') !== -1) {
      if (item.id === 'bab') score += 7;
      if (item.id === 'semi') score += 4;
      if (item.id === 'volet_hs') score += 3;
    }
    if (priorities.indexOf('space') !== -1 && item.id === 'masterdeck') score += 8;
    return score;
  }

  function balancedBonus(item) {
    if (item.id === 'ore_essential' || item.id === 'm18' || item.id === 'volet_hs') return 8;
    return Math.min(5, item.strengths.length);
  }

  function budgetScore(productBand, requestedBand) {
    var order = ['under5', '5_10', '10_15', '15_25', 'over25'];
    var distance = Math.abs(order.indexOf(productBand) - order.indexOf(requestedBand));
    return [14, 5, -7, -16, -24][distance] || -24;
  }

  function evaluateCompatibility(item, input, rules) {
    if (input.shape !== 'rect' && !customStudyProduct(item)) {
      return { compatible: false, certainty: 'not_available', rule: null };
    }
    if (!input.dimensionsKnown) {
      return { compatible: true, certainty: customStudyProduct(item) ? 'custom' : 'to_confirm', rule: null };
    }
    if (item.id === 'auto' || item.id === 'semi') {
      return { compatible: true, certainty: 'to_confirm', rule: null };
    }
    if (item.id === 'eden') {
      return { compatible: true, certainty: 'custom', rule: null };
    }
    if (!rules || typeof rules.calculate !== 'function') {
      return { compatible: true, certainty: 'to_confirm', rule: null };
    }
    var result = rules.calculate(item.id, {
      length: input.length,
      width: input.width,
      shape: input.shape,
      installation: 'fourniture_pose',
      support: 'beton',
      margelles: 'niveau',
      clearance: '80_plus',
      electricity: 'oui',
      department: '69 - Rhône',
      immergedIntegration: 'paroi',
      options: {}
    });
    return {
      compatible: result.eligible !== false,
      certainty: certaintyFor(item, result),
      rule: result
    };
  }

  function customStudyProduct(item) {
    return ['eden', 'volet_hs', 'volet_immerge'].indexOf(item && item.id) !== -1;
  }

  function guidedRecommendationProduct(item) {
    return ['auto', 'semi', 'eden'].indexOf(item && item.id) === -1;
  }

  function certaintyFor(item, result) {
    if (item.id === 'masterdeck' || item.id === 'm50' || item.id === 'mid') return 'custom';
    // The advisor only knows the prospect's needs, shape and dimensions.
    // A positive calculation here confirms the known dimensional range, not the full installation.
    if (result.eligible === true) return 'dimension_fit';
    return 'to_confirm';
  }

  function reasonsFor(item, input, compatibility) {
    var reasons = input.priorities.filter(function (p) { return item.strengths.indexOf(p) !== -1 && p !== 'unsure'; })
      .map(function (p) { return PRIORITIES[p]; });
    if (!reasons.length) reasons.push(item.description);
    if (!input.dimensionsKnown) reasons.push('Dimensions du bassin à préciser');
    if (compatibility.certainty === 'dimension_fit') reasons.push('Dimensions dans la plage connue');
    if (compatibility.certainty === 'custom') reasons.push('Étudié sur mesure pour votre bassin');
    if (compatibility.certainty === 'to_confirm') reasons.push('Conditions de pose à vérifier avec vous');
    return reasons.slice(0, 3);
  }

  function estimateFor(item, compatibility) {
    if (item.id === 'auto' || item.id === 'semi') return 'Étude personnalisée';
    if (compatibility.certainty === 'custom') return 'Étude personnalisée';
    if (item.id === 'm50' || item.id === 'mid' || item.id === 'masterdeck' || item.id === 'eden') return 'Étude personnalisée';
    return 'Estimation après vérification';
  }

  function diversify(scored, limit) {
    var result = [];
    var families = {};
    scored.forEach(function (item) {
      if (result.length >= limit || families[item.prospectFamily]) return;
      families[item.prospectFamily] = true;
      result.push(item);
    });
    return result;
  }

  function recommend(input, rules) {
    var cleanInput = normalise(input);
    var excluded = [];
    var scored = CANDIDATES.map(function (item) {
      var compatibility = evaluateCompatibility(item, cleanInput, rules);
      var output = Object.assign({}, item, {
        compatible: compatibility.compatible,
        certainty: compatibility.certainty,
        score: recommendationScore(item, cleanInput),
        reasons: reasonsFor(item, cleanInput, compatibility),
        estimate: estimateFor(item, compatibility)
      });
      if (!compatibility.compatible) excluded.push(output);
      return output;
    }).filter(function (item) { return item.compatible; })
      .sort(function (a, b) { return b.score - a.score || a.title.localeCompare(b.title, 'fr'); });

    return {
      input: cleanInput,
      recommendations: diversify(scored.filter(guidedRecommendationProduct), 3),
      compatible: scored,
      excluded: excluded
    };
  }

  function findCandidate(id) {
    for (var i = 0; i < CANDIDATES.length; i += 1) if (CANDIDATES[i].id === id) return CANDIDATES[i];
    return null;
  }

  return Object.freeze({
    PRIORITIES: PRIORITIES,
    PROSPECT_FAMILIES: PROSPECT_FAMILIES,
    CANDIDATES: CANDIDATES,
    recommend: recommend,
    findCandidate: findCandidate,
    prospectFamilyFor: prospectFamilyFor,
    normalise: normalise
  });
}));
