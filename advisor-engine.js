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
    space: 'Récupérer l’espace au-dessus du bassin',
    economy: 'Maîtriser le budget',
    unsure: 'Être conseillé sans préférence arrêtée'
  });

  var CANDIDATES = Object.freeze([
    candidate('ore_compact', 'Oré Compact', 'Couverture 4 saisons', 'cover', 'cov', 'cm',
      'Une protection discrète pensée pour les bassins compacts.',
      'assets/produits/ore/ore-fermee.jpg', ['clean', 'safety', 'automatic', 'aesthetics'], '5_10'),
    candidate('ore_essential', 'Oré Essential', 'Couverture 4 saisons', 'cover', 'cov', 'cm',
      'Une solution quatre saisons qui protège le bassin toute l’année.',
      'assets/produits/ore/ore-ouverte.jpg', ['clean', 'safety', 'automatic', 'season', 'aesthetics'], '10_15'),
    candidate('auto', 'Coverseal automatique', 'Couverture haut de gamme', 'coverseal', 'cov', 'cm',
      'Sécurité, confort d’usage et ouverture entièrement motorisée.',
      '', ['clean', 'safety', 'automatic', 'aesthetics'], '10_15'),
    candidate('semi', 'Coverseal semi-automatique', 'Couverture haut de gamme', 'coverseal', 'cov', 'cm',
      'Le niveau de protection Coverseal avec une commande simplifiée.',
      '', ['clean', 'safety', 'aesthetics'], '10_15'),
    candidate('eden', 'Eden', 'Couverture sur mesure', 'custom-cover', 'cov', 'cm',
      'Une réponse premium pour les bassins et projets atypiques.',
      '', ['clean', 'safety', 'automatic', 'aesthetics', 'space'], 'over25'),
    candidate('ul', 'Abri Neo / Ultra Bas', 'Abri télescopique', 'shelter', 'shl', 'sm',
      'Une protection très basse qui préserve les lignes du jardin.',
      'assets/produits/abris/master-ultra-bas-1-2.jpg', ['clean', 'safety', 'season', 'aesthetics'], '15_25'),
    candidate('m18', 'Abri Master 18', 'Abri télescopique', 'shelter', 'shl', 'sm',
      'Un abri bas équilibré pour protéger et profiter plus longtemps.',
      'assets/produits/abris/master-bas-1-8.jpg', ['clean', 'safety', 'season'], '15_25'),
    candidate('m30', 'Abri Master 30', 'Abri télescopique', 'shelter', 'shl', 'sm',
      'Davantage de volume pour nager sous l’abri fermé.',
      'assets/produits/abris/master-bas-1-8.jpg', ['clean', 'safety', 'season'], '15_25'),
    candidate('m50', 'Abri Master 50', 'Abri télescopique', 'shelter', 'shl', 'sm',
      'Un confort annuel généreux, étudié sur devis.',
      'assets/produits/abris/master-mi-haut.jpg', ['clean', 'safety', 'season'], 'over25'),
    candidate('mid', 'Abri mi-haut', 'Abri télescopique', 'shelter', 'shl', 'sm',
      'Un compromis entre discrétion et hauteur de circulation.',
      'assets/produits/abris/master-mi-haut.jpg', ['clean', 'safety', 'season'], 'over25'),
    candidate('bab', 'Bâche à barres Secu Classic', 'Protection essentielle', 'bar-cover', 'oth', 'otherProduct',
      'Une solution simple, robuste et sécurisante au budget contenu.',
      'assets/produits/bab/couverture-a-barres.jpg', ['safety', 'economy'], 'under5'),
    candidate('volet_hs', 'Volet hors-sol', 'Volet de piscine', 'shutter', 'oth', 'otherProduct',
      'Une couverture automatique fiable, sans travaux importants dans le bassin.',
      'assets/produits/volets-hors-sol/volet-hors-sol-escalier-solaire.jpg', ['clean', 'safety', 'automatic', 'economy'], '5_10'),
    candidate('volet_immerge', 'Volet immergé', 'Volet de piscine', 'shutter', 'oth', 'otherProduct',
      'Une protection automatique intégrée et très discrète.',
      'assets/produits/volets-immerges/volet-immerge-blanc.jpg', ['clean', 'safety', 'automatic', 'aesthetics'], '10_15'),
    candidate('masterdeck', 'Terrasse mobile MasterDeck', 'Terrasse mobile', 'mobile-deck', 'oth', 'otherProduct',
      'Le bassin disparaît sous une terrasse utilisable une fois fermée.',
      '', ['safety', 'aesthetics', 'space'], 'over25')
  ]);

  function candidate(id, title, category, family, eq, selectionType, description, image, strengths, budget) {
    return Object.freeze({
      id: id, title: title, category: category, family: family, eq: eq,
      selectionType: selectionType, selectionValue: id, description: description,
      image: image, strengths: Object.freeze(strengths), budget: budget
    });
  }

  function normalise(input) {
    input = input || {};
    var priorities = Array.isArray(input.priorities) ? input.priorities.filter(function (p) { return PRIORITIES[p]; }).slice(0, 2) : [];
    return {
      priorities: priorities,
      shape: ['rect', 'oval', 'libre'].indexOf(input.shape) !== -1 ? input.shape : 'rect',
      length: clampNumber(input.length, 3, 20, 8),
      width: clampNumber(input.width, 2, 12, 4),
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
    });
    if (!input.priorities.length || input.priorities.indexOf('unsure') !== -1) score += balancedBonus(item);
    if (input.budget !== 'unknown') score += budgetScore(item.budget, input.budget);
    if (input.shape === 'libre') score += (item.id === 'eden' || item.id === 'masterdeck') ? 26 : -18;
    if (input.delay === 'urg' && (item.id === 'bab' || item.id === 'volet_hs')) score += 7;
    if (input.delay === 'ref' && (item.family === 'shelter' || item.id === 'masterdeck')) score += 3;
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
      certainty: result.eligible === true ? 'compatible' : 'to_confirm',
      rule: result
    };
  }

  function reasonsFor(item, input, compatibility) {
    var reasons = input.priorities.filter(function (p) { return item.strengths.indexOf(p) !== -1 && p !== 'unsure'; })
      .map(function (p) { return PRIORITIES[p]; });
    if (!reasons.length) reasons.push(item.description);
    if (compatibility.certainty === 'compatible') reasons.push('Dimensions compatibles à ce stade');
    if (compatibility.certainty === 'custom') reasons.push('Étudié sur mesure pour votre bassin');
    return reasons.slice(0, 3);
  }

  function estimateFor(item, compatibility) {
    if (item.id === 'auto') return 'À partir de 13 890 €';
    if (item.id === 'semi') return 'À partir de 11 490 €';
    if (item.id === 'm50' || item.id === 'mid' || item.id === 'masterdeck' || item.id === 'eden') return 'Étude personnalisée';
    return 'Estimation à affiner';
  }

  function diversify(scored, limit) {
    var result = [];
    var families = {};
    scored.forEach(function (item) {
      if (result.length >= limit || families[item.family]) return;
      families[item.family] = true;
      result.push(item);
    });
    if (result.length < limit) {
      scored.forEach(function (item) {
        if (result.length < limit && result.indexOf(item) === -1) result.push(item);
      });
    }
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
      recommendations: diversify(scored, 3),
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
    CANDIDATES: CANDIDATES,
    recommend: recommend,
    findCandidate: findCandidate,
    normalise: normalise
  });
}));
