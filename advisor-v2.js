(function () {
  'use strict';

  if (!window.DISKOOV_ADVISOR) return;

  var engine = window.DISKOOV_ADVISOR;
  var rules = window.DISKOOV_RULES;
  var root = document.getElementById('app');
  if (!root) return;

  var STORAGE_KEY = 'diskoov_advisor_v2';
  var STAGES = ['Votre besoin', 'Votre piscine', 'Votre projet', 'Nos recommandations'];
  var state = {
    screen: 'welcome',
    history: [],
    priorities: [],
    shape: 'rect',
    length: 8,
    width: 4,
    budget: 'unknown',
    delay: 'unknown',
    results: null,
    showAll: false,
    compare: false,
    activeProduct: ''
  };
  var savedState = loadSavedState();
  var lastFocus = null;

  var shell = document.createElement('section');
  shell.className = 'advisor-shell';
  shell.id = 'advisor-v2';
  shell.setAttribute('data-screen', 'welcome');
  shell.setAttribute('aria-label', 'Conseiller piscine Diskoov');
  shell.innerHTML = shellTemplate();
  root.insertBefore(shell, root.firstChild);

  var body = shell.querySelector('[data-advisor-body]');
  var footer = shell.querySelector('[data-advisor-footer]');
  var modal = shell.querySelector('[data-advisor-modal]');
  var modalImage = shell.querySelector('[data-advisor-modal-image]');

  prepareLegacyConfigurator();
  bindEvents();
  addAdvisorEntryPoint();

  if (shouldOpenAdvisor()) {
    openAdvisor('welcome', false);
  }

  function shellTemplate() {
    return ''
      + '<aside class="advisor-visual" aria-hidden="true">'
      + '  <div class="advisor-mosaic">'
      + '    <figure><img src="assets/produits/conseiller/ore-fermee.webp" alt=""></figure>'
      + '    <figure><img src="assets/produits/conseiller/abri-bas.webp" alt=""></figure>'
      + '    <figure><img src="assets/produits/conseiller/volet-immerge.webp" alt=""></figure>'
      + '  </div>'
      + '  <div class="advisor-visual-copy">'
      + '    <div class="advisor-kicker">Conseil personnalisé</div>'
      + '    <div class="advisor-visual-title" data-visual-title>Une solution pensée pour votre bassin.</div>'
      + '    <p class="advisor-visual-text" data-visual-text>Quelques réponses suffisent pour comparer les protections réellement adaptées à votre projet.</p>'
      + '  </div>'
      + '</aside>'
      + '<div class="advisor-panel">'
      + '  <header class="advisor-header">'
      + '    <div class="advisor-header-row">'
      + '      <a class="advisor-brand" href="https://diskoov.fr" aria-label="Diskoov, retour au site"><span class="advisor-brand-mark" aria-hidden="true">D</span><span>Diskoov</span></a>'
      + '      <button type="button" class="advisor-help" data-action="direct" aria-label="Voir directement les produits">Produits</button>'
      + '    </div>'
      + '    <div class="advisor-progress" data-advisor-progress></div>'
      + '  </header>'
      + '  <div class="advisor-body" data-advisor-body tabindex="-1"></div>'
      + '  <footer class="advisor-footer" data-advisor-footer></footer>'
      + '</div>'
      + '<div class="advisor-modal" data-advisor-modal role="dialog" aria-modal="true" aria-hidden="true" aria-label="Photo du produit agrandie">'
      + '  <button type="button" class="advisor-modal-close" data-action="close-preview" aria-label="Fermer">×</button>'
      + '  <img data-advisor-modal-image alt="">'
      + '</div>';
  }

  function shouldOpenAdvisor() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('advisor') === '1') return true;
    return !params.has('eq') && !params.has('cm') && !params.has('sm') && !params.has('op');
  }

  function bindEvents() {
    shell.addEventListener('click', function (event) {
      var target = event.target.closest('[data-action]');
      if (!target) return;
      var action = target.getAttribute('data-action');
      if (action === 'start') startGuided();
      else if (action === 'resume') resumeGuided();
      else if (action === 'direct') navigate('direct');
      else if (action === 'priority') togglePriority(target.getAttribute('data-value'));
      else if (action === 'shape') setStateValue('shape', target.getAttribute('data-value'));
      else if (action === 'budget') setStateValue('budget', target.getAttribute('data-value'));
      else if (action === 'delay') setStateValue('delay', target.getAttribute('data-value'));
      else if (action === 'back') goBack();
      else if (action === 'next') goNext();
      else if (action === 'show-all') { state.showAll = !state.showAll; render(); }
      else if (action === 'compare') { state.compare = !state.compare; trackAdvisor('advisor_compare_open', { open: state.compare }); render(); }
      else if (action === 'choose') openConfigurator(target.getAttribute('data-product'), 'guided');
      else if (action === 'direct-product') openConfigurator(target.getAttribute('data-product'), 'direct');
      else if (action === 'preview') openPreview(target.getAttribute('data-image'), target.getAttribute('data-alt'));
      else if (action === 'close-preview') closePreview();
      else if (action === 'restart') restartAdvisor();
    });

    shell.addEventListener('input', function (event) {
      if (event.target.matches('[data-field="length"]')) state.length = clampNumber(event.target.value, 3, 20, 8);
      if (event.target.matches('[data-field="width"]')) state.width = clampNumber(event.target.value, 2, 12, 4);
      if (event.target.matches('[data-field]')) {
        updateSurfaceLabel();
        saveState();
      }
    });

    modal.addEventListener('click', function (event) {
      if (event.target === modal) closePreview();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && modal.classList.contains('is-open')) closePreview();
    });
  }

  function openAdvisor(screen, keepHistory) {
    lastFocus = document.activeElement;
    if (screen) state.screen = screen;
    if (!keepHistory) state.history = [];
    root.classList.add('advisor-active');
    setLegacyInert(true);
    render();
    trackAdvisor('advisor_view', { screen: state.screen });
  }

  function closeAdvisor() {
    root.classList.remove('advisor-active');
    setLegacyInert(false);
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function setLegacyInert(value) {
    ['.vis', '.panel'].forEach(function (selector) {
      var node = root.querySelector(selector);
      if (!node) return;
      node.inert = value;
      node.setAttribute('aria-hidden', value ? 'true' : 'false');
    });
  }

  function startGuided() {
    state.history = ['welcome'];
    state.screen = 'priorities';
    trackAdvisor('advisor_start', { mode: 'guided' });
    render();
  }

  function resumeGuided() {
    if (!savedState) return startGuided();
    Object.assign(state, savedState, { history: ['welcome'] });
    if (state.screen === 'welcome' || state.screen === 'direct') state.screen = 'priorities';
    trackAdvisor('advisor_resume', { screen: state.screen });
    render();
  }

  function restartAdvisor() {
    sessionStorage.removeItem(STORAGE_KEY);
    savedState = null;
    state = {
      screen: 'welcome', history: [], priorities: [], shape: 'rect', length: 8, width: 4,
      budget: 'unknown', delay: 'unknown', results: null, showAll: false, compare: false, activeProduct: ''
    };
    document.body.classList.remove('diskoov-guided-config');
    render();
  }

  function navigate(screen) {
    if (state.screen !== screen) state.history.push(state.screen);
    state.screen = screen;
    if (screen === 'results') {
      state.results = engine.recommend(state, rules);
      trackAdvisor('advisor_results_view', {
        first_product: state.results.recommendations[0] ? state.results.recommendations[0].id : '',
        compatible_count: state.results.compatible.length,
        excluded_count: state.results.excluded.length
      });
    }
    render();
  }

  function goBack() {
    var previous = state.history.pop();
    state.screen = previous || 'welcome';
    render();
  }

  function goNext() {
    if (state.screen === 'priorities' && state.priorities.length) navigate('pool');
    else if (state.screen === 'pool' && dimensionsValid()) {
      trackAdvisor('advisor_pool_complete', { shape: state.shape, length: state.length, width: state.width });
      navigate('project');
    }
    else if (state.screen === 'project') navigate('results');
  }

  function togglePriority(value) {
    var index = state.priorities.indexOf(value);
    if (index !== -1) state.priorities.splice(index, 1);
    else {
      if (value === 'unsure') state.priorities = ['unsure'];
      else {
        state.priorities = state.priorities.filter(function (item) { return item !== 'unsure'; });
        if (state.priorities.length >= 2) state.priorities.shift();
        state.priorities.push(value);
      }
    }
    trackAdvisor('advisor_priority_select', { priority: value, selected: state.priorities.indexOf(value) !== -1 });
    render();
  }

  function setStateValue(key, value) {
    state[key] = value;
    render();
  }

  function render() {
    shell.setAttribute('data-screen', state.screen);
    updateProgress();
    updateVisualCopy();
    body.innerHTML = screenTemplate();
    footer.innerHTML = footerTemplate();
    body.scrollTop = 0;
    if (state.screen !== 'welcome' && state.screen !== 'direct') saveState();
    requestAnimationFrame(function () {
      var title = body.querySelector('h1, h2');
      if (title) {
        title.setAttribute('tabindex', '-1');
        title.focus({ preventScroll: true });
      }
    });
  }

  function screenTemplate() {
    if (state.screen === 'welcome') return welcomeTemplate();
    if (state.screen === 'priorities') return prioritiesTemplate();
    if (state.screen === 'pool') return poolTemplate();
    if (state.screen === 'project') return projectTemplate();
    if (state.screen === 'results') return resultsTemplate();
    if (state.screen === 'direct') return directTemplate();
    return welcomeTemplate();
  }

  function welcomeTemplate() {
    var resume = savedState && savedState.screen && savedState.screen !== 'welcome'
      ? '<div class="advisor-resume"><span>Vous aviez commencé une recherche. Vos réponses sont toujours disponibles.</span><button type="button" data-action="resume">Reprendre</button></div>'
      : '';
    return '<div class="advisor-screen">'
      + '<div class="advisor-step-label">Conseiller Diskoov</div>'
      + '<h1 class="advisor-title">Trouvez la protection adaptée à votre piscine.</h1>'
      + '<p class="advisor-subtitle">Vous n’avez pas besoin de connaître les produits. Décrivez simplement votre bassin et ce qui compte pour vous : nous comparerons les solutions compatibles.</p>'
      + '<div class="advisor-welcome-actions">'
      + '  <button type="button" class="advisor-button" data-action="start">Trouver ma solution <span aria-hidden="true">→</span></button>'
      + '  <button type="button" class="advisor-button advisor-button--secondary" data-action="direct">Voir directement les produits</button>'
      + '</div>'
      + resume
      + '<div class="advisor-trust">'
      + trustItem(icon('clock'), '<strong>3 minutes environ</strong><br>pour être orienté')
      + trustItem(icon('shield'), '<strong>Compatibilité vérifiée</strong><br>avant toute estimation')
      + trustItem(icon('user'), '<strong>Réponse sous 48 h</strong><br>par l’équipe Diskoov')
      + '</div>'
      + '</div>';
  }

  function trustItem(svg, text) {
    return '<div class="advisor-trust-item"><span class="advisor-trust-icon">' + svg + '</span><span>' + text + '</span></div>';
  }

  function prioritiesTemplate() {
    var labels = engine.PRIORITIES;
    var values = ['clean', 'safety', 'season', 'aesthetics', 'automatic', 'space', 'economy', 'unsure'];
    return '<div class="advisor-screen">'
      + '<div class="advisor-step-label">Votre besoin</div>'
      + '<h1 class="advisor-title">Qu’attendez-vous surtout de votre équipement ?</h1>'
      + '<p class="advisor-subtitle">Choisissez jusqu’à deux priorités. Elles servent à classer les solutions, jamais à masquer une incompatibilité technique.</p>'
      + '<div class="advisor-choice-list" role="group" aria-label="Vos priorités">'
      + values.map(function (value) {
        var selected = state.priorities.indexOf(value) !== -1;
        return '<button type="button" class="advisor-choice' + (selected ? ' is-selected' : '') + '" data-action="priority" data-value="' + value + '" aria-pressed="' + selected + '">'
          + '<span class="advisor-choice-icon">' + icon(value) + '</span>'
          + '<span class="advisor-choice-title">' + labels[value] + '</span>'
          + '<span class="advisor-choice-check" aria-hidden="true"></span>'
          + '</button>';
      }).join('')
      + '</div>'
      + '<p class="advisor-hint">' + (state.priorities.length ? state.priorities.length + ' priorité' + (state.priorities.length > 1 ? 's' : '') + ' sélectionnée' + (state.priorities.length > 1 ? 's' : '') : 'Sélectionnez au moins une réponse pour continuer.') + '</p>'
      + '</div>';
  }

  function poolTemplate() {
    return '<div class="advisor-screen">'
      + '<div class="advisor-step-label">Votre piscine</div>'
      + '<h1 class="advisor-title">Parlez-nous de votre bassin.</h1>'
      + '<p class="advisor-subtitle">Indiquez la forme et les dimensions du bassin. Le conseiller garde uniquement les solutions cohérentes avec votre projet.</p>'
      + '<div class="advisor-pool-layout">'
      + '  <fieldset class="advisor-fieldset"><legend class="advisor-legend">Forme du bassin</legend>'
      + '    <div class="advisor-segmented" role="radiogroup" aria-label="Forme du bassin">'
      + shapeButton('rect', 'Rectangle') + shapeButton('oval', 'Arrondie') + shapeButton('libre', 'Forme libre')
      + '    </div>'
      + '  </fieldset>'
      + '  <fieldset class="advisor-fieldset"><legend class="advisor-legend">Dimensions intérieures</legend>'
      + '    <div class="advisor-dimensions">'
      + inputDimension('length', 'Longueur', state.length, 3, 20)
      + '      <span class="advisor-dim-x" aria-hidden="true">×</span>'
      + inputDimension('width', 'Largeur', state.width, 2, 12)
      + '    </div>'
      + '    <div class="advisor-surface" data-advisor-surface>' + surfaceText() + '</div>'
      + '  </fieldset>'
      + '</div>'
      + (state.shape === 'libre' ? '<div class="advisor-resume"><span>Une forme libre sera orientée vers une étude sur mesure. Vous pourrez joindre une photo ou un plan avant d’envoyer votre demande.</span></div>' : '')
      + '</div>';
  }

  function shapeButton(value, label) {
    var selected = state.shape === value;
    return '<button type="button" class="' + (selected ? 'is-selected' : '') + '" data-action="shape" data-value="' + value + '" role="radio" aria-checked="' + selected + '">' + label + '</button>';
  }

  function inputDimension(field, label, value, min, max) {
    return '<div class="advisor-field"><label for="advisor-' + field + '">' + label + '</label><div class="advisor-input-wrap">'
      + '<input id="advisor-' + field + '" data-field="' + field + '" type="number" inputmode="decimal" min="' + min + '" max="' + max + '" step="0.5" value="' + value + '">'
      + '<span class="advisor-input-unit">m</span></div></div>';
  }

  function projectTemplate() {
    var budgets = [
      ['under5', 'Moins de 5 000 €'], ['5_10', '5 000 à 10 000 €'], ['10_15', '10 000 à 15 000 €'],
      ['15_25', '15 000 à 25 000 €'], ['over25', 'Plus de 25 000 €'], ['unknown', 'Je ne sais pas encore']
    ];
    var delays = [['urg', 'Avant l’été'], ['6m', 'Dans les 6 mois'], ['1a', 'Dans l’année'], ['ref', 'Je réfléchis'], ['unknown', 'Pas de date précise']];
    return '<div class="advisor-screen">'
      + '<div class="advisor-step-label">Votre projet</div>'
      + '<h1 class="advisor-title">Deux dernières indications pour mieux vous guider.</h1>'
      + '<p class="advisor-subtitle">Ces réponses nous aident à classer les solutions. Vous pouvez rester approximatif : les détails seront confirmés ensuite.</p>'
      + '<div class="advisor-options-grid">'
      + optionGroup('Budget envisagé', 'budget', budgets, state.budget)
      + optionGroup('Horizon du projet', 'delay', delays, state.delay)
      + '</div>'
      + '</div>';
  }

  function optionGroup(title, action, options, selectedValue) {
    return '<fieldset class="advisor-fieldset"><legend class="advisor-legend">' + title + '</legend><div class="advisor-option-stack">'
      + options.map(function (option) {
        var selected = option[0] === selectedValue;
        return '<button type="button" class="advisor-option' + (selected ? ' is-selected' : '') + '" data-action="' + action + '" data-value="' + option[0] + '" aria-pressed="' + selected + '">' + option[1] + '</button>';
      }).join('') + '</div></fieldset>';
  }

  function resultsTemplate() {
    state.results = state.results || engine.recommend(state, rules);
    var products = state.showAll ? state.results.compatible : state.results.recommendations;
    var top = state.results.recommendations;
    var excludedCopy = state.results.excluded.length
      ? '<p class="advisor-hint">' + state.results.excluded.length + ' solution' + (state.results.excluded.length > 1 ? 's ont' : ' a') + ' été écartée' + (state.results.excluded.length > 1 ? 's' : '') + ' car vos dimensions dépassent leurs limites connues.</p>'
      : '';
    return '<div class="advisor-screen">'
      + '<div class="advisor-results-head"><div>'
      + '  <div class="advisor-step-label">Nos recommandations</div>'
      + '  <h1 class="advisor-title">Les solutions recommandées.</h1>'
      + '  <p class="advisor-subtitle">Pour votre bassin de ' + numberLabel(state.length) + ' × ' + numberLabel(state.width) + ' m, classées selon vos priorités.</p>'
      + '</div><div class="advisor-result-actions"><button type="button" class="advisor-button advisor-button--secondary" data-action="compare">' + (state.compare ? 'Masquer le comparatif' : 'Comparer') + '</button><button type="button" class="advisor-button advisor-button--text" data-action="restart">Recommencer</button></div></div>'
      + (state.compare ? compareTemplate(top) : '')
      + '<div class="advisor-result-list">' + products.map(resultCard).join('') + '</div>'
      + (state.results.compatible.length > 3 ? '<button type="button" class="advisor-more" data-action="show-all">' + (state.showAll ? 'Afficher seulement les 3 recommandations' : 'Voir les ' + state.results.compatible.length + ' solutions compatibles') + '</button>' : '')
      + excludedCopy
      + '</div>';
  }

  function resultCard(item, index) {
    var benefits = commercialBenefits(item);
    var fallback = '<div class="advisor-fallback-visual advisor-fallback-visual--' + safeClass(item.family) + '">'
      + '<span class="advisor-fallback-icon">' + icon(item.family === 'shelter' ? 'season' : item.family === 'mobile-deck' ? 'space' : 'shield') + '</span>'
      + '<span class="advisor-fallback-label">' + escapeHtml(item.category) + '</span>'
      + '</div>';
    var media = item.image
      ? '<button type="button" class="advisor-result-media" data-action="preview" data-image="' + item.image + '" data-alt="' + escapeHtml(item.title) + '"><img src="' + item.image + '" alt="' + escapeHtml(item.title) + '" loading="lazy">' + (index === 0 ? '<span class="advisor-result-rank">Meilleur choix</span>' : '') + '</button>'
      : '<div class="advisor-result-media advisor-result-media--fallback" aria-hidden="true">' + fallback + (index === 0 ? '<span class="advisor-result-rank">Meilleur choix</span>' : '') + '</div>';
    return '<article class="advisor-result">'
      + media
      + '<div class="advisor-result-content"><div class="advisor-result-category">' + escapeHtml(item.category) + '</div><h2 class="advisor-result-title">' + escapeHtml(item.title) + '</h2><p class="advisor-result-description">' + escapeHtml(item.description) + '</p>'
      + '<div class="advisor-benefits">' + benefits.map(function (benefit) { return '<span>' + escapeHtml(benefit) + '</span>'; }).join('') + '</div>'
      + '<div class="advisor-reasons">' + item.reasons.map(function (reason) { return '<span class="advisor-reason">' + escapeHtml(reason) + '</span>'; }).join('') + '</div></div>'
      + '<div class="advisor-result-cta"><div class="advisor-estimate">' + escapeHtml(item.estimate) + '</div><button type="button" class="advisor-button" data-action="choose" data-product="' + item.id + '">Choisir cette solution <span aria-hidden="true">→</span></button></div>'
      + '</article>';
  }

  function commercialBenefits(item) {
    var map = {
      ore_compact: ['Pose incluse', 'Discret'],
      ore_essential: ['4 saisons', 'Automatique'],
      auto: ['Pose fabricant', 'Motorisé'],
      semi: ['Sécurité homologuée', 'Commande simplifiée'],
      eden: ['Sur mesure', 'Finition premium'],
      bab: ['Budget maîtrisé', 'Robuste'],
      volet_hs: ['Pose intégrée', 'Sans travaux lourds'],
      volet_immerge: ['Pose intégrée', 'Très discret'],
      masterdeck: ['Espace récupéré', 'Sur mesure']
    };
    if (item.family === 'shelter') return ['Saison prolongée', 'Abri télescopique'];
    return map[item.id] || [];
  }

  function compareTemplate(products) {
    var criteria = [
      ['Atout principal', function (p) { return p.description; }],
      ['Automatisation', function (p) { return p.strengths.indexOf('automatic') !== -1 ? 'Très adaptée' : 'Selon le modèle'; }],
      ['Discrétion', function (p) { return p.strengths.indexOf('aesthetics') !== -1 ? 'Forte' : 'Standard'; }],
      ['Saison prolongée', function (p) { return p.strengths.indexOf('season') !== -1 ? 'Oui' : 'Protection principalement'; }],
      ['Estimation', function (p) { return p.estimate; }]
    ];
    return '<section class="advisor-compare" aria-label="Comparatif des solutions"><h2 class="advisor-compare-title">Comparatif rapide</h2><table><thead><tr><th>Critère</th>'
      + products.map(function (p) { return '<th>' + escapeHtml(p.title) + '</th>'; }).join('') + '</tr></thead><tbody>'
      + criteria.map(function (row) { return '<tr><td>' + row[0] + '</td>' + products.map(function (p) { return '<td>' + escapeHtml(row[1](p)) + '</td>'; }).join('') + '</tr>'; }).join('')
      + '</tbody></table></section>';
  }

  function directTemplate() {
    var groups = [
      ['Couvertures et protections', ['ore_compact', 'ore_essential', 'auto', 'semi', 'eden', 'bab']],
      ['Volets', ['volet_hs', 'volet_immerge']],
      ['Abris télescopiques', ['ul', 'm18', 'm30', 'm50', 'mid']],
      ['Aménagement', ['masterdeck']]
    ];
    return '<div class="advisor-screen">'
      + '<div class="advisor-step-label">Accès direct</div>'
      + '<h1 class="advisor-title">Choisissez votre produit.</h1>'
      + '<p class="advisor-subtitle">Si vous hésitez, revenez au conseiller à tout moment.</p>'
      + '<div class="advisor-direct-groups">'
      + groups.map(function (group) {
        return '<section><h2 class="advisor-direct-group-title">' + group[0] + '</h2><div class="advisor-direct-list">'
          + group[1].map(function (id) {
            var item = engine.findCandidate(id);
            var media = item.image
              ? '<span class="advisor-direct-media"><img src="' + escapeHtml(item.image) + '" alt="" loading="lazy"></span>'
              : '<span class="advisor-direct-media advisor-direct-media--fallback" aria-hidden="true">' + icon(item.family === 'shelter' ? 'season' : item.family === 'mobile-deck' ? 'space' : 'shield') + '</span>';
            return '<button type="button" class="advisor-direct-item" data-action="direct-product" data-product="' + id + '">' + media + '<span class="advisor-direct-copy"><span class="advisor-direct-name">' + escapeHtml(item.title) + '</span><span class="advisor-direct-desc">' + escapeHtml(item.description) + '</span></span><span class="advisor-direct-arrow" aria-hidden="true">→</span></button>';
          }).join('') + '</div></section>';
      }).join('')
      + '</div></div>';
  }

  function footerTemplate() {
    if (state.screen === 'welcome') return '<div class="advisor-footer-note">Conseil sans engagement · Vos réponses restent sur cet appareil jusqu’à l’envoi du formulaire.</div>';
    var nextDisabled = state.screen === 'priorities' && !state.priorities.length;
    var nextLabel = state.screen === 'project' ? 'Voir mes recommandations' : 'Continuer';
    var showNext = ['priorities', 'pool', 'project'].indexOf(state.screen) !== -1;
    var backLabel = state.screen === 'results' ? 'Modifier mes réponses' : 'Retour';
    var recommended = state.screen === 'results' && state.results && state.results.recommendations && state.results.recommendations[0];
    return '<div class="advisor-footer-note">L’estimation sera affinée avec les détails de pose et d’accès.</div><div class="advisor-footer-actions">'
      + '<button type="button" class="advisor-button advisor-button--text" data-action="back">← ' + backLabel + '</button>'
      + (recommended ? '<button type="button" class="advisor-button" data-action="choose" data-product="' + recommended.id + '">Choisir cette solution <span aria-hidden="true">→</span></button>' : '')
      + (showNext ? '<button type="button" class="advisor-button" data-action="next"' + (nextDisabled ? ' disabled' : '') + '>' + nextLabel + ' <span aria-hidden="true">→</span></button>' : '')
      + '</div>';
  }

  function updateProgress() {
    var current = stageForScreen(state.screen);
    var percent = state.screen === 'welcome' ? 0 : ((current + 1) / STAGES.length) * 100;
    var progress = shell.querySelector('[data-advisor-progress]');
    progress.innerHTML = '<div class="advisor-progress-meta"><span>' + (state.screen === 'welcome' ? 'Votre projet piscine' : STAGES[current]) + '</span><span>' + (state.screen === 'welcome' ? 'Conseil personnalisé' : (current + 1) + ' sur ' + STAGES.length) + '</span></div>'
      + '<div class="advisor-progress-stages">' + STAGES.map(function (label, index) { return '<span class="advisor-progress-stage' + (index === current ? ' is-current' : index < current ? ' is-done' : '') + '">' + label + '</span>'; }).join('') + '</div>'
      + '<div class="advisor-progress-track" role="progressbar" aria-label="Progression" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(percent) + '"><div class="advisor-progress-fill" style="width:' + percent + '%"></div></div>';
  }

  function stageForScreen(screen) {
    if (screen === 'pool') return 1;
    if (screen === 'results') return 3;
    if (screen === 'project') return 2;
    return 0;
  }

  function updateVisualCopy() {
    var copies = {
      welcome: ['Une solution pensée pour votre bassin.', 'Quelques réponses suffisent pour comparer les protections réellement adaptées à votre projet.'],
      priorities: ['Votre usage avant le produit.', 'Nous partons de vos attentes pour éviter de vous imposer une technologie ou une gamme.'],
      pool: ['Chaque bassin a ses contraintes.', 'La forme et les dimensions servent d’abord à vérifier la compatibilité, avant de parler de prix.'],
      project: ['Un conseil adapté à votre rythme.', 'Budget et délai orientent le classement sans fermer prématurément les possibilités.'],
      results: ['Des options claires, pas une liste infinie.', 'Trois recommandations expliquées, puis toutes les solutions compatibles si vous souhaitez aller plus loin.'],
      direct: ['Vous savez déjà ce que vous cherchez.', 'Accédez directement au produit, tout en conservant les contrôles techniques et tarifaires du configurateur.']
    };
    var copy = copies[state.screen] || copies.welcome;
    shell.querySelector('[data-visual-title]').textContent = copy[0];
    shell.querySelector('[data-visual-text]').textContent = copy[1];
  }

  function openConfigurator(productId, source) {
    var item = engine.findCandidate(productId);
    if (!item) return;
    state.activeProduct = productId;
    saveState();

    if (source === 'guided') {
      syncPoolState();
      document.body.classList.add('diskoov-guided-config');
      updateGuidedSummary(item);
    } else {
      document.body.classList.remove('diskoov-guided-config');
      removeGuidedSummary();
    }

    if (typeof window.selEq === 'function') window.selEq(item.eq);
    if (item.selectionType === 'cm' && typeof window.selCM === 'function') window.selCM(item.selectionValue);
    if (item.selectionType === 'sm' && typeof window.selSM === 'function') window.selSM(item.selectionValue);
    if (item.selectionType === 'otherProduct' && typeof window.selOtherProduct === 'function') window.selOtherProduct(item.selectionValue);

    if (source === 'guided' && state.delay !== 'unknown') syncDelay();
    closeAdvisor();
    var panelBody = document.getElementById('pbdy');
    if (panelBody) panelBody.scrollTo({ top: 0, behavior: 'smooth' });
    trackAdvisor(source === 'guided' ? 'advisor_recommendation_select' : 'advisor_direct_select', { product: productId });
  }

  function syncPoolState() {
    if (typeof window.selShape === 'function') window.selShape(state.shape);
    var length = document.getElementById('d-l');
    var width = document.getElementById('d-w');
    if (length) length.value = state.length;
    if (width) width.value = state.width;
    if (typeof window.updD === 'function') window.updD();
  }

  function syncDelay() {
    var buttons = { urg: 'tl-urg', '6m': 'tl-6m', '1a': 'tl-1a', ref: 'tl-ref' };
    var button = document.getElementById(buttons[state.delay]);
    if (button && typeof window.selTL === 'function') window.selTL(state.delay, button);
  }

  function prepareLegacyConfigurator() {
    var photo = document.getElementById('s-pool-photo');
    var form = document.getElementById('s-frm');
    if (photo && form && form.parentNode) form.parentNode.insertBefore(photo, form);
  }

  function updateGuidedSummary(item) {
    var summary = document.getElementById('guided-summary');
    if (!summary) {
      summary = document.createElement('div');
      summary.id = 'guided-summary';
      summary.className = 'guided-summary';
      var pbdy = document.getElementById('pbdy');
      if (pbdy) pbdy.insertBefore(summary, pbdy.firstChild);
    }
    summary.innerHTML = '<div class="guided-summary-kicker">Solution recommandée</div><div class="guided-summary-row"><div><div class="guided-summary-title">' + escapeHtml(item.title) + '</div><div class="guided-summary-meta">Bassin ' + numberLabel(state.length) + ' × ' + numberLabel(state.width) + ' m · finalisez les détails techniques</div></div><button type="button" data-open-advisor>Changer</button></div>';
    summary.querySelector('[data-open-advisor]').addEventListener('click', function () { openAdvisor('results', true); });
  }

  function removeGuidedSummary() {
    var summary = document.getElementById('guided-summary');
    if (summary) summary.remove();
  }

  function addAdvisorEntryPoint() {
    var header = document.querySelector('.p-hd');
    if (!header || header.querySelector('[data-advisor-entry]')) return;
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'advisor-entry-button';
    button.setAttribute('data-advisor-entry', '');
    button.textContent = 'Être conseillé';
    button.addEventListener('click', function () { openAdvisor('welcome', false); });
    header.appendChild(button);
  }

  function openPreview(src, alt) {
    if (!src) return;
    modalImage.src = src;
    modalImage.alt = alt || 'Photo du produit';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    modal.querySelector('[data-action="close-preview"]').focus();
  }

  function closePreview() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    modalImage.removeAttribute('src');
  }

  function updateSurfaceLabel() {
    var label = shell.querySelector('[data-advisor-surface]');
    if (label) label.textContent = surfaceText();
  }

  function surfaceText() {
    return 'Surface indicative : ' + numberLabel(state.length * state.width) + ' m²';
  }

  function dimensionsValid() {
    return state.length >= 3 && state.length <= 20 && state.width >= 2 && state.width <= 12;
  }

  function clampNumber(value, min, max, fallback) {
    var number = Number(String(value).replace(',', '.'));
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, Math.round(number * 10) / 10));
  }

  function numberLabel(value) {
    return Number(value).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
  }

  function saveState() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        screen: state.screen,
        priorities: state.priorities,
        shape: state.shape,
        length: state.length,
        width: state.width,
        budget: state.budget,
        delay: state.delay,
        activeProduct: state.activeProduct
      }));
      savedState = Object.assign({}, state, { results: null, history: [] });
    } catch (error) { }
  }

  function loadSavedState() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.priorities)) return null;
      return parsed;
    } catch (error) { return null; }
  }

  function trackAdvisor(event, params) {
    params = params || {};
    if (typeof window.track === 'function') window.track(event, params);
    else {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign({ event: event, advisor_version: 'v2' }, params));
    }
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character];
    });
  }

  function safeClass(value) {
    return String(value || 'product').replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'product';
  }

  function icon(name) {
    var paths = {
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      shield: '<path d="M12 3 5 6v5c0 4.5 2.7 7.8 7 10 4.3-2.2 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-5"/>',
      user: '<circle cx="12" cy="8" r="3"/><path d="M5.5 20c.7-4 3-6 6.5-6s5.8 2 6.5 6"/>',
      clean: '<path d="M4 18h16M7 15l3-9h4l3 9M9 11h6"/>',
      safety: '<path d="M12 3 5 6v5c0 4.5 2.7 7.8 7 10 4.3-2.2 7-5.5 7-10V6l-7-3Z"/>',
      season: '<path d="M4 15c3-7 13-9 16 0M6 18h12M12 3v4M4.2 7l3 2M19.8 7l-3 2"/>',
      aesthetics: '<path d="M5 19c6 0 11-5 14-14-9 3-14 8-14 14Z"/><path d="M5 19c3-4 6-7 10-10"/>',
      automatic: '<path d="M7 7h10v10H7z"/><path d="m10 14 4-4M10 10h4v4"/>',
      space: '<path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"/>',
      economy: '<circle cx="12" cy="12" r="9"/><path d="M15 8.5c-.7-.5-1.5-.8-2.5-.8-1.7 0-3 1-3 2.3s1.1 2 3 2.3c1.7.3 2.7 1 2.7 2.2 0 1.4-1.3 2.4-3 2.4-1.1 0-2.2-.4-3-1M12 6v12"/>',
      unsure: '<circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 0 1 4.6 1c0 1.7-2.4 2-2.4 3.5M12 17h.01"/>'
    };
    return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || paths.unsure) + '</svg>';
  }
}());
