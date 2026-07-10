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
    projectStage: 'unknown',
    budget: 'unknown',
    delay: 'unknown',
    results: null,
    showAll: false,
    compare: false,
    directFamily: '',
    activeProduct: ''
  };
  var savedState = loadSavedState();
  var lastFocus = null;
  var modalLastFocus = null;
  var detailLastFocus = null;
  var focusScreenTitleOnRender = false;

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
  var detailModal = shell.querySelector('[data-advisor-detail-modal]');
  var detailContent = shell.querySelector('[data-advisor-detail-content]');

  prepareLegacyConfigurator();
  bindEvents();
  addAdvisorEntryPoint();

  if (shouldOpenAdvisor()) {
    openAdvisor('welcome', false);
  }

  function shellTemplate() {
    return ''
      + '<aside class="advisor-visual" aria-hidden="true">'
      + '  <figure class="advisor-visual-media"><img data-visual-image src="assets/produits/conseiller/ore-fermee.webp" alt="" width="1200" height="800" fetchpriority="high"></figure>'
      + '  <div class="advisor-visual-copy">'
      + '    <div class="advisor-kicker">Conseil personnalisé</div>'
      + '    <div class="advisor-visual-title" data-visual-title>Une solution pensée pour votre bassin.</div>'
      + '    <p class="advisor-visual-text" data-visual-text>Quelques réponses suffisent pour comparer les protections réellement adaptées à votre projet.</p>'
      + '    <p class="advisor-visual-meta" data-visual-meta>Besoin, bassin, puis sélection expliquée.</p>'
      + '  </div>'
      + '</aside>'
      + '<div class="advisor-panel">'
      + '  <header class="advisor-header">'
      + '    <div class="advisor-header-row">'
      + '      <a class="advisor-brand" href="https://diskoov.fr" aria-label="Diskoov, retour au site"><span class="advisor-brand-mark" aria-hidden="true">D</span><span>Diskoov</span></a>'
      + '      <button type="button" class="advisor-help" data-action="direct" aria-label="Accès direct aux produits">Accès direct</button>'
      + '    </div>'
      + '    <div class="advisor-progress" data-advisor-progress></div>'
      + '  </header>'
      + '  <div class="advisor-body" data-advisor-body tabindex="-1"></div>'
      + '  <footer class="advisor-footer" data-advisor-footer></footer>'
      + '</div>'
      + '<div class="advisor-modal" data-advisor-modal role="dialog" aria-modal="true" aria-hidden="true" aria-label="Photo du produit agrandie">'
      + '  <button type="button" class="advisor-modal-close" data-action="close-preview" aria-label="Fermer">×</button>'
      + '  <img data-advisor-modal-image alt="" width="1200" height="800">'
      + '</div>'
      + '<div class="advisor-detail-modal" data-advisor-detail-modal role="dialog" aria-modal="true" aria-hidden="true" aria-label="Détails de la solution recommandée">'
      + '  <div class="advisor-detail-card" data-advisor-detail-content></div>'
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
      else if (action === 'direct') { state.directFamily = ''; navigate('direct'); }
      else if (action === 'direct-family') {
        state.directFamily = target.getAttribute('data-value') || '';
        trackAdvisor('advisor_family_open', { family: state.directFamily });
        render({ resetScroll: true });
      }
      else if (action === 'direct-families') { state.directFamily = ''; render({ resetScroll: true }); }
      else if (action === 'priority') togglePriority(target.getAttribute('data-value'));
      else if (action === 'shape') setStateValue('shape', target.getAttribute('data-value'));
      else if (action === 'budget') setSimpleChoice('budget', target.getAttribute('data-value'));
      else if (action === 'delay') setSimpleChoice('delay', target.getAttribute('data-value'));
      else if (action === 'project-stage') setSimpleChoice('projectStage', target.getAttribute('data-value'));
      else if (action === 'back') goBack();
      else if (action === 'next') goNext();
      else if (action === 'show-all') { state.showAll = !state.showAll; render({ preserveScroll: true, focusTitle: false }); }
      else if (action === 'compare') { state.compare = !state.compare; trackAdvisor('advisor_compare_open', { open: state.compare }); render({ preserveScroll: true, focusTitle: false }); }
      else if (action === 'choose') openConfigurator(target.getAttribute('data-product'), 'guided');
      else if (action === 'direct-product') openConfigurator(target.getAttribute('data-product'), 'direct');
      else if (action === 'details') openProductDetails(target.getAttribute('data-product'), target);
      else if (action === 'preview') openPreview(target.getAttribute('data-image'), target.getAttribute('data-alt'), target);
      else if (action === 'close-preview') closePreview();
      else if (action === 'close-details') closeProductDetails();
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
    detailModal.addEventListener('click', function (event) {
      if (event.target === detailModal) closeProductDetails();
    });

    document.addEventListener('pointerdown', function () {
      focusScreenTitleOnRender = false;
    }, true);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Tab' || event.key === 'Enter' || event.key === ' ') focusScreenTitleOnRender = true;
      if (event.key === 'Escape' && modal.classList.contains('is-open')) closePreview();
      if (event.key === 'Escape' && detailModal.classList.contains('is-open')) closeProductDetails();
      if (event.key === 'Tab' && detailModal.classList.contains('is-open')) trapFocus(event, detailContent);
      else if (event.key === 'Tab' && modal.classList.contains('is-open')) trapFocus(event, modal);
    });
  }

  function openAdvisor(screen, keepHistory) {
    lastFocus = document.activeElement;
    if (screen) state.screen = screen;
    if (!keepHistory) state.history = [];
    root.classList.add('advisor-active');
    setLegacyInert(true);
    render({ resetScroll: true });
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
    render({ resetScroll: true });
  }

  function resumeGuided() {
    if (!savedState) return startGuided();
    Object.assign(state, savedState, { history: ['welcome'] });
    if (state.screen === 'welcome' || state.screen === 'direct') state.screen = 'priorities';
    trackAdvisor('advisor_resume', { screen: state.screen });
    render({ resetScroll: true });
  }

  function restartAdvisor() {
    sessionStorage.removeItem(STORAGE_KEY);
    savedState = null;
    state = {
      screen: 'welcome', history: [], priorities: [], shape: 'rect', length: 8, width: 4,
      projectStage: 'unknown', budget: 'unknown', delay: 'unknown', results: null, showAll: false, compare: false, directFamily: '', activeProduct: ''
    };
    document.body.classList.remove('diskoov-guided-config');
    render({ resetScroll: true });
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
    render({ resetScroll: true });
  }

  function goBack() {
    var previous = state.history.pop();
    state.screen = previous || 'welcome';
    render({ resetScroll: true });
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
    if (state.screen === 'priorities') {
      updatePriorityDom();
      updateFooterOnly();
      saveState();
      return;
    }
    render({ preserveScroll: true, focusTitle: false });
  }

  function setStateValue(key, value) {
    state[key] = value;
    render({ preserveScroll: true, focusTitle: false });
  }

  function setSimpleChoice(key, value) {
    state[key] = value;
    updateChoiceDom(key, value);
    updateFooterOnly();
    saveState();
  }

  function updatePriorityDom() {
    body.querySelectorAll('[data-action="priority"]').forEach(function (button) {
      var selected = state.priorities.indexOf(button.getAttribute('data-value')) !== -1;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    var hint = body.querySelector('.advisor-hint');
    if (hint) {
      hint.textContent = state.priorities.length
        ? state.priorities.length + ' priorité' + (state.priorities.length > 1 ? 's' : '') + ' sélectionnée' + (state.priorities.length > 1 ? 's' : '')
        : 'Sélectionnez au moins une réponse pour continuer.';
    }
  }

  function updateChoiceDom(action, value) {
    body.querySelectorAll('[data-action="' + action + '"]').forEach(function (button) {
      var selected = button.getAttribute('data-value') === value;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  function updateFooterOnly() {
    footer.innerHTML = footerTemplate();
  }

  function render(options) {
    options = options || {};
    var shouldFocusTitle = options.focusTitle !== false && focusScreenTitleOnRender;
    focusScreenTitleOnRender = false;
    var previousTop = body.scrollTop || 0;
    shell.setAttribute('data-screen', state.screen);
    updateHeaderAction();
    updateProgress();
    updateVisualCopy();
    body.innerHTML = screenTemplate();
    footer.innerHTML = footerTemplate();
    if (options.preserveScroll) {
      body.scrollTop = Math.min(previousTop, body.scrollHeight);
      requestAnimationFrame(function () {
        body.scrollTop = Math.min(previousTop, body.scrollHeight);
      });
    } else {
      body.scrollTop = 0;
    }
    if (state.screen !== 'welcome' && state.screen !== 'direct') saveState();
    if (!shouldFocusTitle) return;
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
      + '<p class="advisor-subtitle">Vous n’avez pas besoin de connaître les produits. Décrivez votre bassin et vos attentes : nous vous présentons les pistes les plus cohérentes avant de vérifier les détails techniques.</p>'
      + '<div class="advisor-welcome-actions">'
      + '  <button type="button" class="advisor-button" data-action="start">Trouver ma solution <span aria-hidden="true">→</span></button>'
      + '  <button type="button" class="advisor-button advisor-button--secondary" data-action="direct">Explorer les types de protection</button>'
      + '</div>'
      + resume
      + '<div class="advisor-welcome-path" aria-label="Déroulé du conseil">'
      + '<div><strong>01</strong><span><b>Votre usage</b><small>Ce qui compte pour vous</small></span></div>'
      + '<div><strong>02</strong><span><b>Votre bassin</b><small>Forme et dimensions intérieures</small></span></div>'
      + '<div><strong>03</strong><span><b>Vos pistes</b><small>Une sélection expliquée</small></span></div>'
      + '</div>'
      + '<p class="advisor-welcome-note">Aucune réponse ne vous engage. Les conditions de pose sont vérifiées avant toute proposition détaillée.</p>'
      + '</div>';
  }

  function prioritiesTemplate() {
    var labels = engine.PRIORITIES;
    var descriptions = {
      clean: 'Limiter feuilles, saletés et entretien.',
      safety: 'Sécuriser l’accès au bassin au quotidien.',
      season: 'Profiter plus longtemps de la piscine.',
      aesthetics: 'Garder des abords élégants et discrets.',
      automatic: 'Réduire les manipulations manuelles.',
      space: 'Récupérer une vraie surface utilisable.',
      economy: 'Comparer sans partir sur du surdimensionné.',
      unsure: 'Laisser Diskoov vous orienter simplement.'
    };
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
          + '<span class="advisor-choice-copy"><span class="advisor-choice-title">' + labels[value] + '</span><span class="advisor-choice-desc">' + descriptions[value] + '</span></span>'
          + '<span class="advisor-choice-check" aria-hidden="true"></span>'
          + '</button>';
      }).join('')
      + '</div>'
      + '<p class="advisor-hint" aria-live="polite">' + (state.priorities.length ? state.priorities.length + ' priorité' + (state.priorities.length > 1 ? 's' : '') + ' sélectionnée' + (state.priorities.length > 1 ? 's' : '') : 'Sélectionnez au moins une réponse pour continuer.') + '</p>'
      + '</div>';
  }

  function poolTemplate() {
    return '<div class="advisor-screen">'
      + '<div class="advisor-step-label">Votre piscine</div>'
      + '<h1 class="advisor-title">Parlez-nous de votre bassin.</h1>'
      + '<p class="advisor-subtitle">Indiquez la forme et les dimensions intérieures du bassin. Elles nous permettent d’écarter les modèles hors de leur plage connue, avant de vérifier l’installation.</p>'
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
      + '<input id="advisor-' + field + '" name="pool_' + field + '" data-field="' + field + '" type="number" inputmode="decimal" autocomplete="off" min="' + min + '" max="' + max + '" step="0.5" value="' + value + '">'
      + '<span class="advisor-input-unit">m</span></div></div>';
  }

  function projectTemplate() {
    var budgets = [
      ['under5', 'Moins de 5 000 €'], ['5_10', '5 000 à 10 000 €'], ['10_15', '10 000 à 15 000 €'],
      ['15_25', '15 000 à 25 000 €'], ['over25', 'Plus de 25 000 €'], ['unknown', 'Je ne sais pas encore']
    ];
    var delays = [['urg', 'Dès que possible'], ['6m', 'Dans les 6 mois'], ['1a', 'Dans l’année'], ['ref', 'Je réfléchis'], ['unknown', 'Pas de date précise']];
    var stages = [['existing', 'Déjà construite'], ['construction', 'En construction'], ['renovation', 'À rénover'], ['planning', 'En réflexion']];
    return '<div class="advisor-screen">'
      + '<div class="advisor-step-label">Votre projet</div>'
      + '<h1 class="advisor-title">Deux dernières indications pour mieux vous guider.</h1>'
      + '<p class="advisor-subtitle">Ces réponses nous aident à classer les solutions. Vous pouvez rester approximatif : les détails seront confirmés ensuite.</p>'
      + '<fieldset class="advisor-project-context"><legend>Où en est votre piscine ? <span>Facultatif</span></legend>'
      + '<p>Cette information aide Diskoov à préparer les bons points techniques pour votre étude.</p>'
      + '<div class="advisor-project-context-options">' + stages.map(projectStageButton).join('') + '</div></fieldset>'
      + '<div class="advisor-options-grid">'
      + optionGroup('Budget envisagé', 'budget', budgets, state.budget)
      + optionGroup('Horizon du projet', 'delay', delays, state.delay)
      + '</div>'
      + '</div>';
  }

  function projectStageButton(option) {
    var selected = option[0] === state.projectStage;
    return '<button type="button" class="advisor-project-stage-option' + (selected ? ' is-selected' : '') + '" data-action="project-stage" data-value="' + option[0] + '" aria-pressed="' + selected + '">' + option[1] + '</button>';
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
    var primary = products[0];
    var alternatives = products.slice(1);
    var excludedCopy = state.results.excluded.length
      ? '<p class="advisor-hint">Certaines solutions ne sont pas affichées car vos dimensions dépassent leurs limites connues. Une forme ou une installation particulière peut aussi nécessiter une étude sur mesure.</p>'
      : '';
    return '<div class="advisor-screen">'
      + '<div class="advisor-results-head"><div>'
      + '  <div class="advisor-step-label">Nos recommandations</div>'
      + '  <h1 class="advisor-title">Les pistes les plus pertinentes pour votre projet.</h1>'
      + '  <p class="advisor-subtitle">Pour votre bassin de ' + numberLabel(state.length) + ' × ' + numberLabel(state.width) + ' m, classées selon vos attentes. Les conditions de pose sont vérifiées avant tout devis.</p>'
      + '</div><div class="advisor-result-actions"><button type="button" class="advisor-button advisor-button--secondary" data-action="compare">' + (state.compare ? 'Masquer le comparatif' : 'Comparer les pistes') + '</button><button type="button" class="advisor-button advisor-button--text" data-action="restart">Recommencer</button></div></div>'
      + resultsSummaryTemplate()
      + (primary ? primaryResultTemplate(primary) : '')
      + (alternatives.length ? '<section class="advisor-alternatives"><div class="advisor-alternatives-head"><div><span class="advisor-section-kicker">Autres pistes</span><h2>À considérer selon vos préférences</h2></div><p>Des compromis différents, à comparer sans perdre de vue votre bassin.</p></div><div class="advisor-alternative-list">' + alternatives.map(alternativeResultTemplate).join('') + '</div></section>' : '')
      + (state.compare ? compareTemplate(top) : '')
      + (state.results.compatible.length > 3 ? '<button type="button" class="advisor-more" data-action="show-all">' + (state.showAll ? 'Afficher seulement les 3 pistes principales' : 'Voir les ' + state.results.compatible.length + ' solutions dans leur plage connue') + '</button>' : '')
      + excludedCopy
      + '</div>';
  }

  function resultsSummaryTemplate() {
    var area = Math.round((state.length * state.width) * 10) / 10;
    return '<div class="advisor-results-summary" aria-label="Résumé de votre projet">'
      + '<div><strong>' + numberLabel(state.length) + ' × ' + numberLabel(state.width) + ' m</strong><span>Bassin déclaré · ' + numberLabel(area) + ' m²</span></div>'
      + '<div><strong>' + state.results.recommendations.length + ' pistes à explorer</strong><span>Classées selon vos attentes</span></div>'
      + '<div><strong>Étude avant devis</strong><span>Pose, accès et options vérifiés avec vous</span></div>'
      + '</div>';
  }

  function productMedia(item, className, rank) {
    var fallback = '<div class="advisor-fallback-visual advisor-fallback-visual--' + safeClass(item.family) + '">'
      + '<span class="advisor-fallback-icon">' + icon(item.family === 'shelter' ? 'season' : item.family === 'mobile-deck' ? 'space' : 'shield') + '</span>'
      + '<span class="advisor-fallback-label">' + escapeHtml(item.category) + '</span>'
      + '</div>';
    if (item.image) {
      return '<button type="button" class="' + className + ' advisor-product-media--' + safeClass(item.id) + '" data-action="preview" data-image="' + item.image + '" data-alt="' + escapeHtml(item.title) + '"><img src="' + item.image + '" alt="' + escapeHtml(item.title) + '" width="1200" height="800" loading="lazy" decoding="async">' + (rank ? '<span class="advisor-result-rank">À étudier en premier</span>' : '') + '</button>';
    }
    return '<div class="' + className + ' advisor-result-media--fallback" aria-hidden="true">' + fallback + (rank ? '<span class="advisor-result-rank">À étudier en premier</span>' : '') + '</div>';
  }

  function primaryResultTemplate(item) {
    var benefits = commercialBenefits(item);
    var tradeoff = productTradeoff(item);
    var match = priorityFit(item);
    var status = resultStatusLabel(item, 0);
    return '<article class="advisor-primary-result">'
      + productMedia(item, 'advisor-primary-media', true)
      + '<div class="advisor-primary-body"><div class="advisor-result-category"><span>' + escapeHtml(item.category) + '</span><span class="advisor-result-match advisor-result-match--' + safeClass(status.key) + '">' + escapeHtml(status.label) + '</span></div>'
      + '<h2>' + escapeHtml(item.title) + '</h2><p class="advisor-primary-lead">' + escapeHtml(productBestFor(item)) + '</p>'
      + '<div class="advisor-benefits">' + benefits.map(function (benefit) { return '<span>' + escapeHtml(benefit) + '</span>'; }).join('') + '</div>'
      + '<dl class="advisor-primary-facts"><div><dt>Pourquoi cette piste</dt><dd>' + escapeHtml(match) + '</dd></div><div><dt>À vérifier</dt><dd>' + escapeHtml(tradeoff) + '</dd></div></dl>'
      + '<div class="advisor-primary-actions"><div><strong>' + escapeHtml(item.estimate) + '</strong><span>Étude de pose avant devis</span></div><div class="advisor-result-buttons"><button type="button" class="advisor-info-button" data-action="details" data-product="' + item.id + '">Voir les détails</button><button type="button" class="advisor-button" data-action="choose" data-product="' + item.id + '">Obtenir une étude <span aria-hidden="true">→</span></button></div></div>'
      + '<p class="advisor-primary-next"><strong>Après votre choix :</strong> précisez l’installation et, si vous en avez une, joignez une photo du bassin. Elle aide à vérifier les abords et l’accès.</p></div>'
      + '</article>';
  }

  function alternativeResultTemplate(item) {
    var status = resultStatusLabel(item, 1);
    return '<article class="advisor-alternative">'
      + productMedia(item, 'advisor-alternative-media', false)
      + '<div class="advisor-alternative-copy"><div class="advisor-result-category"><span>' + escapeHtml(item.category) + '</span><span class="advisor-result-match advisor-result-match--' + safeClass(status.key) + '">' + escapeHtml(status.label) + '</span></div><h3>' + escapeHtml(item.title) + '</h3><p>' + escapeHtml(productTradeoff(item)) + '</p></div>'
      + '<div class="advisor-alternative-actions"><span>' + escapeHtml(item.estimate) + '</span><div><button type="button" class="advisor-info-button" data-action="details" data-product="' + item.id + '">Détails</button><button type="button" class="advisor-button" data-action="choose" data-product="' + item.id + '">Étudier <span aria-hidden="true">→</span></button></div></div>'
      + '</article>';
  }

  function resultStatusLabel(item, index) {
    if (item.certainty === 'custom') return { key: 'custom', label: 'Sur mesure' };
    if (item.certainty === 'to_confirm') return { key: 'to-confirm', label: 'À vérifier' };
    if (item.certainty === 'dimension_fit') return { key: 'dimension-fit', label: 'Dimensions cohérentes' };
    if (index === 0 && !state.showAll) return { key: 'recommended', label: 'Meilleure piste' };
    return { key: 'to-confirm', label: 'À vérifier' };
  }

  function commercialBenefits(item) {
    var map = {
      ore_compact: ['Pose selon prestation', 'Jusqu’à 7 × 3,5 m'],
      ore_essential: ['4 saisons', 'Jusqu’à 12 × 5 m'],
      auto: ['Rails extra-plats', 'Étude personnalisée'],
      semi: ['Norme sécurité', 'Prix maîtrisé'],
      eden: ['Sur mesure', 'Norme sécurité'],
      bab: ['Garantie 3 ans', 'Budget maîtrisé'],
      volet_hs: ['Jusqu’à 12 × 6 m', 'Automatique'],
      volet_immerge: ['Jusqu’à 14 × 6 m', 'Très discret'],
      masterdeck: ['3 en 1', 'Projet sur mesure']
    };
    if (item.family === 'shelter') return ['Saison prolongée', 'Abri télescopique'];
    return map[item.id] || [];
  }

  function priorityFit(item) {
    var selected = state.priorities.filter(function (priority) { return priority !== 'unsure'; });
    if (!selected.length) return 'Solution équilibrée si vous souhaitez être conseillé sans préférence arrêtée.';
    var hits = selected.filter(function (priority) { return item.strengths.indexOf(priority) !== -1; });
    if (hits.length === selected.length) return 'Couvre vos ' + selected.length + ' priorité' + (selected.length > 1 ? 's' : '') + ' principale' + (selected.length > 1 ? 's' : '') + '.';
    if (hits.length) return 'Répond à ' + hits.length + ' priorité' + (hits.length > 1 ? 's' : '') + ' sur ' + selected.length + '.';
    return 'Reste une piste possible, mais répond moins directement à vos priorités.';
  }

  function productTradeoff(item) {
    var map = {
      ore_compact: 'Très pertinente sur petit bassin ; les plages et le support doivent rester cohérents avec la pose.',
      ore_essential: 'Demande un espace suffisant pour le mécanisme et une validation des plages autour du bassin.',
      auto: 'Positionnement premium : excellent confort, budget plus élevé qu’une solution simple.',
      semi: 'Très bon compromis Coverseal, avec une manipulation moins automatique que la version motorisée.',
      eden: 'Projet sur mesure : la finition est intéressante, mais l’étude est nécessaire avant estimation fiable.',
      bab: 'Budget contenu et sécurité, avec une manipulation plus manuelle au quotidien.',
      volet_hs: 'Mécanisme visible en bout de bassin, mais installation plus simple qu’un volet immergé.',
      volet_immerge: 'Très discret, mais demande plus d’intégration technique au bassin.',
      masterdeck: 'Très fort en usage et esthétique, mais projet plus spécifique à étudier avant chiffrage.'
    };
    if (item.family === 'shelter') return 'Plus de confort et de saison de baignade, avec un encombrement visuel supérieur à une couverture.';
    return map[item.id] || 'Les points de pose et d’accès seront vérifiés avant proposition.';
  }

  function productBestFor(item) {
    var map = {
      ore_compact: 'Vous avez un bassin compact et vous cherchez une couverture motorisée simple à vivre.',
      ore_essential: 'Vous voulez une protection 4 saisons plus polyvalente, avec un bon équilibre confort / discrétion.',
      auto: 'Vous voulez le meilleur confort quotidien et une couverture haut de gamme très intégrée.',
      semi: 'Vous aimez l’approche Coverseal mais souhaitez maîtriser davantage le budget.',
      eden: 'Votre projet demande une finition très soignée ou une réponse plus personnalisée.',
      bab: 'Vous cherchez surtout une solution fiable, sécurisante et économique.',
      volet_hs: 'Vous voulez automatiser sans lancer une intégration lourde dans le bassin.',
      volet_immerge: 'Vous voulez garder les abords du bassin très propres visuellement.',
      masterdeck: 'Vous voulez récupérer l’espace au-dessus du bassin lorsqu’il n’est pas utilisé.'
    };
    if (item.family === 'shelter') return 'Vous voulez prolonger la saison et protéger le bassin avec une solution visible mais confortable.';
    return map[item.id] || 'Votre bassin correspond aux limites connues et mérite une vérification plus précise.';
  }

  function openProductDetails(productId, trigger) {
    var item = findResultProduct(productId);
    if (!item || !detailModal || !detailContent) return;
    detailLastFocus = trigger || document.activeElement;
    detailContent.innerHTML = productDetailTemplate(item);
    detailModal.classList.add('is-open');
    detailModal.setAttribute('aria-hidden', 'false');
    var close = detailContent.querySelector('[data-action="close-details"]');
    if (close) close.focus({ preventScroll: true });
    trackAdvisor('advisor_product_detail_open', { product: item.id });
  }

  function closeProductDetails() {
    if (!detailModal || !detailContent) return;
    detailModal.classList.remove('is-open');
    detailModal.setAttribute('aria-hidden', 'true');
    detailContent.innerHTML = '';
    restoreFocus(detailLastFocus);
    detailLastFocus = null;
  }

  function findResultProduct(productId) {
    var lists = [];
    if (state.results) lists = lists.concat(state.results.recommendations || [], state.results.compatible || []);
    for (var i = 0; i < lists.length; i += 1) {
      if (lists[i] && lists[i].id === productId) return lists[i];
    }
    return engine.findCandidate(productId);
  }

  function productDetailTemplate(item) {
    var benefits = commercialBenefits(item);
    var bullets = productSalesBullets(item);
    var reasons = Array.isArray(item.reasons) ? item.reasons : [];
    var media = item.image
      ? '<div class="advisor-detail-media advisor-product-media--' + safeClass(item.id) + '"><img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.title) + '" width="1200" height="800" decoding="async"></div>'
      : '<div class="advisor-detail-media advisor-detail-media--fallback" aria-hidden="true">' + icon(item.family === 'shelter' ? 'season' : item.family === 'mobile-deck' ? 'space' : 'shield') + '</div>';
    return '<button type="button" class="advisor-detail-close" data-action="close-details" aria-label="Fermer">×</button>'
      + media
      + '<div class="advisor-detail-body">'
      + '<div class="advisor-step-label">Pourquoi cette solution</div>'
      + '<h2 class="advisor-detail-title">' + escapeHtml(item.title) + '</h2>'
      + '<p class="advisor-detail-lead">' + escapeHtml(productSalesIntro(item)) + '</p>'
      + '<div class="advisor-benefits advisor-detail-benefits">' + benefits.map(function (benefit) { return '<span>' + escapeHtml(benefit) + '</span>'; }).join('') + '</div>'
      + '<div class="advisor-detail-section"><strong>Idéal si</strong><p>' + escapeHtml(productBestFor(item)) + '</p></div>'
      + '<ul class="advisor-detail-list">' + bullets.map(function (bullet) { return '<li>' + escapeHtml(bullet) + '</li>'; }).join('') + '</ul>'
      + '<div class="advisor-detail-section advisor-detail-section--notice"><strong>À vérifier ensemble</strong><p>' + escapeHtml(productTradeoff(item)) + '</p></div>'
      + (reasons.length ? '<div class="advisor-detail-fit"><strong>Adapté à votre projet</strong><span>' + reasons.map(escapeHtml).join('</span><span>') + '</span></div>' : '')
      + '<div class="advisor-detail-footer"><span>' + escapeHtml(item.estimate || 'Étude personnalisée') + '</span><button type="button" class="advisor-button" data-action="choose" data-product="' + item.id + '">Obtenir une étude <span aria-hidden="true">→</span></button></div>'
      + '</div>';
  }

  function productSalesIntro(item) {
    var map = {
      ore_compact: 'Une couverture motorisée Oré pensée pour les bassins compacts, avec la pose incluse lorsque la prestation est demandée.',
      ore_essential: 'Une couverture Oré plus large, conçue pour protéger le bassin toute l’année avec un guidage motorisé discret.',
      auto: 'La Coverseal automatique privilégie le confort : une couverture tendue, motorisée, très discrète et posée par les techniciens fabricant.',
      semi: 'La Coverseal semi-automatique garde l’esprit Coverseal avec une solution plus accessible et une commande simplifiée.',
      eden: 'Eden est une couverture motorisée sur mesure, intéressante quand le projet demande une finition premium et une intégration soignée.',
      bab: 'La bâche à barres Secu Classic est une solution robuste pour sécuriser le bassin avec un budget plus cadré.',
      volet_hs: 'Le volet hors-sol apporte le confort d’une couverture automatique avec une installation plus simple qu’un système immergé.',
      volet_immerge: 'Le volet immergé protège le bassin avec un mécanisme intégré, plus discret visuellement autour de la piscine.',
      masterdeck: 'MasterDeck transforme la couverture en vraie surface utile : terrasse, plage et protection du bassin.'
    };
    if (item.family === 'shelter') return 'Un abri télescopique pour prolonger les baignades et protéger le bassin plus longtemps dans l’année.';
    return map[item.id] || item.description || 'Une solution à étudier selon les dimensions et les contraintes de votre bassin.';
  }

  function productSalesBullets(item) {
    var map = {
      ore_compact: ['Adaptée aux bassins jusqu’à 7 × 3,5 m.', 'Deux blocs de guidage avec axe inox et motorisation.', 'Sangles de sécurité, anti-vent et hivernage prévues.'],
      ore_essential: ['Adaptée aux bassins jusqu’à 12 × 5 m.', 'Pose par deux techniciens selon la prestation retenue.', 'Options utiles possibles : solaire, découpe bloc, sangles et recul.'],
      auto: ['Système breveté avec rails extra-plats de 10 mm.', 'Membrane PVC armé et norme sécurité NF P90-308.', 'Ouverture/fermeture rapide avec motorisation solaire selon modèle.'],
      semi: ['Même logique de couverture tendue Coverseal.', 'Norme sécurité NF P90-308 selon la page Diskoov.', 'Compromis pertinent pour une solution premium au meilleur prix.'],
      eden: ['Norme sécurité NF P90-308.', 'Ouverture et fermeture motorisées sans effort.', 'Limite l’évaporation, les pertes de chaleur et l’entretien.'],
      bab: ['Adaptée aux bassins jusqu’à 12 × 5 m.', 'Surface prévue avec débord autour du bassin.', 'Garantie 3 ans.'],
      volet_hs: ['Adapté aux bassins jusqu’à 12 × 6 m.', 'Lames dimensionnées pour respecter la sécurité.', 'Livraison et pose qualifiées selon le département.'],
      volet_immerge: ['Adapté aux bassins jusqu’à 14 × 6 m.', 'Très pertinent pour une intégration simple avec flasques sur paroi.', 'Fond de bassin, caillebotis ou mur étudiés sur mesure.'],
      masterdeck: ['Solution 3 en 1 : terrasse, plage et protection.', 'Disponible en 1 ou 2 plateaux selon dimensions.', 'Options possibles : motorisation solaire et finitions bois.']
    };
    if (item.family === 'shelter') return ['Prolonge la saison de baignade.', 'Protège le bassin des feuilles et salissures.', 'Plusieurs hauteurs selon le niveau de confort voulu.'];
    return map[item.id] || ['Dimensions et forme prises en compte.', 'Estimation affinée avec les détails de pose.', 'Accompagnement humain avant proposition finale.'];
  }

  function compareTemplate(products) {
    var criteria = [
      ['Atout principal', function (p) { return p.description; }],
      ['Automatisation', function (p) { return p.strengths.indexOf('automatic') !== -1 ? 'Très adaptée' : 'Selon le modèle'; }],
      ['Discrétion', function (p) { return p.strengths.indexOf('aesthetics') !== -1 ? 'Forte' : 'Standard'; }],
      ['Saison prolongée', function (p) { return p.strengths.indexOf('season') !== -1 ? 'Oui' : 'Protection principalement'; }],
      ['Estimation', function (p) { return p.estimate; }]
    ];
    var mobileCards = '<div class="advisor-compare-mobile">'
      + products.map(function (p) {
        return '<article class="advisor-compare-card"><h3>' + escapeHtml(p.title) + '</h3>'
          + criteria.map(function (row) { return '<p><strong>' + escapeHtml(row[0]) + '</strong><span>' + escapeHtml(row[1](p)) + '</span></p>'; }).join('')
          + '</article>';
      }).join('')
      + '</div>';
    return '<section class="advisor-compare" aria-label="Comparatif des solutions"><h2 class="advisor-compare-title">Comparatif rapide</h2><table><thead><tr><th>Critère</th>'
      + products.map(function (p) { return '<th>' + escapeHtml(p.title) + '</th>'; }).join('') + '</tr></thead><tbody>'
      + criteria.map(function (row) { return '<tr><td>' + row[0] + '</td>' + products.map(function (p) { return '<td>' + escapeHtml(row[1](p)) + '</td>'; }).join('') + '</tr>'; }).join('')
      + '</tbody></table>' + mobileCards + '</section>';
  }

  function directTemplate() {
    var families = directFamilyDefinitions();
    var selected = families.filter(function (family) { return family.id === state.directFamily; })[0];
    if (!selected) return directFamiliesTemplate(families);
    return directProductsTemplate(selected);
  }

  function directFamilyDefinitions() {
    return [
      { id: 'covers', title: 'Couvertures motorisées', eyebrow: 'Protection discrète', products: ['ore_compact', 'ore_essential', 'auto', 'semi', 'eden'], image: 'ore_essential', text: 'Pour protéger le bassin au quotidien avec un encombrement limité autour de l’eau.', check: 'Plages, support et alimentation à étudier.' },
      { id: 'bar-cover', title: 'Couverture à barres', eyebrow: 'Protection essentielle', products: ['bab'], image: 'bab', text: 'Une solution simple et robuste pour sécuriser le bassin avec un budget plus cadré.', check: 'Ancrages, escalier et bloc de filtration à vérifier.' },
      { id: 'shutters', title: 'Volets de piscine', eyebrow: 'Confort automatisé', products: ['volet_hs', 'volet_immerge'], image: 'volet_hs', text: 'Pour ouvrir et fermer plus facilement, avec un choix entre installation hors-sol et intégrée.', check: 'Électricité, escalier et implantation à vérifier.' },
      { id: 'shelters', title: 'Abris télescopiques', eyebrow: 'Baignade prolongée', products: ['ul', 'm18', 'm30', 'm50', 'mid'], image: 'm18', text: 'Pour mieux profiter de la piscine et garder l’eau protégée plus longtemps dans l’année.', check: 'Espace de refoulement, accès et terrasse à étudier.' },
      { id: 'deck', title: 'Terrasse mobile', eyebrow: 'Espace récupéré', products: ['masterdeck'], image: 'masterdeck', text: 'Pour transformer le bassin fermé en surface utile et redessiner les abords de la piscine.', check: 'Projet sur mesure à étudier avec Diskoov.' }
    ];
  }

  function directFamiliesTemplate(families) {
    return '<div class="advisor-screen">'
      + '<div class="advisor-step-label">Explorer les solutions</div>'
      + '<h1 class="advisor-title">Choisissez un type de protection.</h1>'
      + '<p class="advisor-subtitle">Commencez par l’usage qui vous attire. Nous vous présenterons ensuite les modèles et les conditions à vérifier pour votre bassin.</p>'
      + '<div class="advisor-family-list">'
      + families.map(function (family) {
        var item = engine.findCandidate(family.image);
        var media = item && item.image
          ? '<div class="advisor-family-media advisor-product-media--' + safeClass(item.id) + '"><img src="' + escapeHtml(item.image) + '" alt="" width="1200" height="800" loading="lazy" decoding="async"></div>'
          : '<div class="advisor-family-media advisor-direct-media--fallback" aria-hidden="true">' + icon('shield') + '</div>';
        return '<article class="advisor-family-item">' + media
          + '<div class="advisor-family-copy"><span class="advisor-direct-category">' + escapeHtml(family.eyebrow) + '</span><h2>' + escapeHtml(family.title) + '</h2><p>' + escapeHtml(family.text) + '</p><span class="advisor-family-check">' + escapeHtml(family.check) + '</span></div>'
          + '<button type="button" class="advisor-direct-main" data-action="direct-family" data-value="' + family.id + '">Voir les solutions <span aria-hidden="true">→</span></button></article>';
      }).join('')
      + '</div></div>';
  }

  function directProductsTemplate(family) {
    return '<div class="advisor-screen">'
      + '<div class="advisor-step-label">' + escapeHtml(family.eyebrow) + '</div>'
      + '<div class="advisor-direct-header"><div><h1 class="advisor-title">' + escapeHtml(family.title) + '</h1><p class="advisor-subtitle">' + escapeHtml(family.text) + '</p></div><button type="button" class="advisor-button advisor-button--text" data-action="direct-families">← Tous les types</button></div>'
      + '<p class="advisor-direct-notice"><strong>À vérifier pour votre bassin :</strong> ' + escapeHtml(family.check) + '</p>'
      + '<div class="advisor-direct-groups"><section><div class="advisor-direct-list">'
      + family.products.map(directProductItem).join('')
      + '</div></section></div></div>';
  }

  function directProductItem(id) {
    var item = engine.findCandidate(id);
    if (!item) return '';
    var directBenefits = commercialBenefits(item).slice(0, 2);
    var media = item.image
      ? '<span class="advisor-direct-media advisor-product-media--' + safeClass(item.id) + '"><img src="' + escapeHtml(item.image) + '" alt="" width="1200" height="800" loading="lazy" decoding="async"></span>'
      : '<span class="advisor-direct-media advisor-direct-media--fallback" aria-hidden="true">' + icon(item.family === 'shelter' ? 'season' : item.family === 'mobile-deck' ? 'space' : 'shield') + '</span>';
    return '<article class="advisor-direct-item">' + media + '<span class="advisor-direct-copy"><span class="advisor-direct-category">' + escapeHtml(item.category) + '</span><span class="advisor-direct-name">' + escapeHtml(item.title) + '</span><span class="advisor-direct-desc">' + escapeHtml(item.description) + '</span><span class="advisor-direct-benefits">' + directBenefits.map(function (benefit) { return '<span>' + escapeHtml(benefit) + '</span>'; }).join('') + '</span></span><span class="advisor-direct-buttons"><button type="button" class="advisor-info-button advisor-info-button--inline" data-action="details" data-product="' + id + '">Voir les détails</button><button type="button" class="advisor-direct-main" data-action="direct-product" data-product="' + id + '">Étudier ce modèle <span aria-hidden="true">→</span></button></span></article>';
  }

  function footerTemplate() {
    if (state.screen === 'welcome') return '<div class="advisor-footer-note">Conseil sans engagement · Vos réponses restent sur cet appareil jusqu’à l’envoi du formulaire.</div>';
    if (state.screen === 'direct') return '<div class="advisor-footer-actions advisor-footer-actions--direct"><button type="button" class="advisor-button advisor-button--text" data-action="back">← Retour</button></div>';
    var nextDisabled = state.screen === 'priorities' && !state.priorities.length;
    var nextLabel = state.screen === 'project' ? 'Voir mes pistes' : 'Continuer';
    var showNext = ['priorities', 'pool', 'project'].indexOf(state.screen) !== -1;
    var backLabel = state.screen === 'results' ? 'Modifier' : 'Retour';
    var recommended = state.screen === 'results' && state.results && state.results.recommendations && state.results.recommendations[0];
    return '<div class="advisor-footer-note">L’estimation sera affinée avec les détails de pose et d’accès.</div><div class="advisor-footer-actions">'
      + '<button type="button" class="advisor-button advisor-button--text" data-action="back">← ' + backLabel + '</button>'
      + (recommended ? '<button type="button" class="advisor-button" data-action="choose" data-product="' + recommended.id + '">Étudier ' + escapeHtml(shortProductTitle(recommended)) + ' <span aria-hidden="true">→</span></button>' : '')
      + (showNext ? '<button type="button" class="advisor-button" data-action="next"' + (nextDisabled ? ' disabled' : '') + '>' + nextLabel + ' <span aria-hidden="true">→</span></button>' : '')
      + '</div>';
  }

  function shortProductTitle(item) {
    return String(item && item.title || 'cette solution')
      .replace('Coverseal automatique', 'Coverseal auto')
      .replace('Coverseal semi-automatique', 'Coverseal semi-auto')
      .replace('Terrasse mobile ', '')
      .replace('Bâche à barres ', '');
  }

  function updateProgress() {
    var current = stageForScreen(state.screen);
    var percent = state.screen === 'welcome' ? 0 : ((current + 1) / STAGES.length) * 100;
    var progress = shell.querySelector('[data-advisor-progress]');
    if (state.screen === 'direct') {
      progress.innerHTML = '<div class="advisor-progress-meta"><span>Explorer les protections</span><span>Choisir une famille</span></div>'
        + '<div class="advisor-progress-stages advisor-progress-stages--direct"><span class="advisor-progress-stage is-current">Comparer</span><span class="advisor-progress-stage">Choisir</span><span class="advisor-progress-stage">Étudier</span></div>'
        + '<div class="advisor-progress-track" role="progressbar" aria-label="Progression" aria-valuemin="0" aria-valuemax="100" aria-valuenow="25"><div class="advisor-progress-fill" style="width:25%"></div></div>';
      return;
    }
    progress.innerHTML = '<div class="advisor-progress-meta"><span>' + (state.screen === 'welcome' ? 'Votre projet piscine' : STAGES[current]) + '</span><span>' + (state.screen === 'welcome' ? 'Conseil personnalisé' : (current + 1) + ' sur ' + STAGES.length) + '</span></div>'
      + '<div class="advisor-progress-stages">' + STAGES.map(function (label, index) { return '<span class="advisor-progress-stage' + (index === current ? ' is-current' : index < current ? ' is-done' : '') + '">' + label + '</span>'; }).join('') + '</div>'
      + '<div class="advisor-progress-track" role="progressbar" aria-label="Progression" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(percent) + '"><div class="advisor-progress-fill" style="width:' + percent + '%"></div></div>';
  }

  function updateHeaderAction() {
    var help = shell.querySelector('.advisor-help');
    if (!help) return;
    if (state.screen === 'direct') {
      help.textContent = 'Mode guidé';
      help.setAttribute('data-action', 'start');
      help.setAttribute('aria-label', 'Revenir au conseiller guidé');
      return;
    }
    help.textContent = 'Accès direct';
    help.setAttribute('data-action', 'direct');
    help.setAttribute('aria-label', 'Explorer les protections');
  }

  function stageForScreen(screen) {
    if (screen === 'pool') return 1;
    if (screen === 'results') return 3;
    if (screen === 'project') return 2;
    return 0;
  }

  function updateVisualCopy() {
    var primary = state.results && state.results.recommendations && state.results.recommendations[0];
    var copies = {
      welcome: { title: 'Une solution pensée pour votre bassin.', text: 'Quelques réponses suffisent pour repérer les pistes les plus cohérentes avec votre projet.', meta: 'Besoin, bassin, puis sélection expliquée.', image: 'assets/produits/conseiller/ore-fermee.webp' },
      priorities: { title: 'Vos besoins guident le conseil.', text: 'Les réponses servent à classer les protections selon votre usage réel.', meta: 'Deux priorités suffisent pour commencer.', image: 'assets/produits/conseiller/volet-hors-sol.webp' },
      pool: { title: 'Chaque bassin a ses contraintes.', text: 'La forme et les dimensions permettent d’écarter les modèles hors plage avant de parler de prix.', meta: 'Les détails de pose viennent ensuite.', image: 'assets/produits/conseiller/ore-ouverte.webp' },
      project: { title: 'Un conseil adapté à votre rythme.', text: 'Budget et délai orientent le classement sans fermer prématurément les possibilités.', meta: 'Vous restez libre d’être approximatif.', image: 'assets/produits/conseiller/abri-bas.webp' },
      results: { title: 'Une recommandation à comprendre avant de choisir.', text: 'Comparez les solutions, puis demandez une étude de celle qui vous convient le mieux.', meta: 'Pose, accès et options sont vérifiés avant devis.', image: primary && primary.image ? primary.image : 'assets/produits/conseiller/ore-fermee.webp' },
      direct: { title: 'Comparez les grandes familles de protection.', text: 'Choisissez d’abord l’usage qui vous attire, puis approfondissez le modèle adapté à votre bassin.', meta: 'Chaque modèle garde ses vérifications techniques.', image: 'assets/produits/conseiller/masterdeck.webp' }
    };
    var copy = copies[state.screen] || copies.welcome;
    shell.querySelector('[data-visual-title]').textContent = copy.title;
    shell.querySelector('[data-visual-text]').textContent = copy.text;
    shell.querySelector('[data-visual-meta]').textContent = copy.meta;
    var visualImage = shell.querySelector('[data-visual-image]');
    if (visualImage && visualImage.getAttribute('src') !== copy.image) visualImage.setAttribute('src', copy.image);
  }

  function openConfigurator(productId, source) {
    var item = engine.findCandidate(productId);
    if (!item) return;
    state.activeProduct = productId;
    saveState();

    if (source === 'guided') {
      syncPoolState();
      if (typeof window.setAdvisorProjectStage === 'function') window.setAdvisorProjectStage(projectStageLabel(state.projectStage));
      document.body.classList.add('diskoov-guided-config');
      updateConfiguratorSummary(item, 'guided');
    } else {
      if (typeof window.setAdvisorProjectStage === 'function') window.setAdvisorProjectStage('');
      document.body.classList.remove('diskoov-guided-config');
      updateConfiguratorSummary(item, 'direct');
    }

    var canSelectExact = source !== 'direct' || directSelectionAllowed(item);
    if (typeof window.selEq === 'function') window.selEq(item.eq);
    if (canSelectExact && item.selectionType === 'cm' && typeof window.selCM === 'function') window.selCM(item.selectionValue);
    if (canSelectExact && item.selectionType === 'sm' && typeof window.selSM === 'function') window.selSM(item.selectionValue);
    if (canSelectExact && item.selectionType === 'otherProduct' && typeof window.selOtherProduct === 'function') window.selOtherProduct(item.selectionValue);

    if (source === 'guided' && state.delay !== 'unknown') syncDelay();
    closeAdvisor();
    var panelBody = document.getElementById('pbdy');
    if (panelBody) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          panelBody.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });
    }
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

  function directSelectionAllowed(item) {
    if (item.id === 'auto' || item.id === 'semi' || item.id === 'eden') return true;
    if (!rules || typeof rules.calculate !== 'function') return true;
    var result = rules.calculate(item.id, {
      length: state.length,
      width: state.width,
      shape: state.shape,
      installation: 'fourniture_pose',
      support: 'beton',
      margelles: 'niveau',
      clearance: '80_plus',
      electricity: 'oui',
      department: '69 - Rhône',
      immergedIntegration: 'paroi',
      options: {}
    });
    return !result || result.eligible !== false;
  }

  function prepareLegacyConfigurator() {
    var photo = document.getElementById('s-pool-photo');
    var form = document.getElementById('s-frm');
    if (photo && form && form.parentNode) form.parentNode.insertBefore(photo, form);
  }

  function updateConfiguratorSummary(item, mode) {
    var summary = document.getElementById('guided-summary');
    if (!summary) {
      summary = document.createElement('div');
      summary.id = 'guided-summary';
      summary.className = 'guided-summary';
      var pbdy = document.getElementById('pbdy');
      if (pbdy) pbdy.insertBefore(summary, pbdy.firstChild);
    }
    var guided = mode === 'guided';
    var projectStage = guided ? projectStageLabel(state.projectStage) : '';
    var meta = guided
      ? 'Pré-sélectionnée pour votre bassin ' + numberLabel(state.length) + ' × ' + numberLabel(state.width) + ' m' + (projectStage ? ' · ' + projectStage : '') + '. Il reste les détails de pose et d’accès à vérifier avant toute proposition détaillée.'
      : 'Renseignez vos dimensions et les contraintes de pose pour vérifier que ce produit convient à votre bassin.';
    var proof = guided ? '<div class="guided-summary-proof">' + escapeHtml(priorityFit(item)) + '</div>' : '';
    var next = guided
      ? '<div class="guided-summary-next"><strong>Prochaine étape</strong><span>Précisez la pose et les accès. Une photo, si vous en avez une, aide à vérifier les abords du bassin.</span></div>'
      : '<div class="guided-summary-next"><strong>Prochaine étape</strong><span>Indiquez les dimensions et les détails de pose pour préparer votre demande.</span></div>';
    summary.innerHTML = '<div class="guided-summary-kicker">' + (guided ? 'Votre sélection Diskoov' : 'Produit à vérifier') + '</div><div class="guided-summary-row"><div><div class="guided-summary-title">' + escapeHtml(item.title) + '</div><div class="guided-summary-meta">' + escapeHtml(meta) + '</div>' + proof + '</div><button type="button" data-open-advisor>' + (guided ? 'Revoir les pistes' : 'Voir les familles') + '</button></div>' + next;
    summary.querySelector('[data-open-advisor]').addEventListener('click', function () { openAdvisor(guided ? 'results' : 'direct', true); });
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

  function openPreview(src, alt, trigger) {
    if (!src) return;
    modalLastFocus = trigger || document.activeElement;
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
    restoreFocus(modalLastFocus);
    modalLastFocus = null;
  }

  function restoreFocus(node) {
    if (node && document.contains(node) && typeof node.focus === 'function') {
      node.focus({ preventScroll: true });
    }
  }

  function trapFocus(event, container) {
    if (!container) return;
    var focusable = Array.prototype.slice.call(container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter(function (node) { return node.offsetParent !== null || node === document.activeElement; });
    if (!focusable.length) {
      event.preventDefault();
      return;
    }
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
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

  function projectStageLabel(value) {
    var labels = {
      existing: 'Bassin déjà construit',
      construction: 'Piscine en construction',
      renovation: 'Piscine à rénover',
      planning: 'Projet en réflexion'
    };
    return labels[value] || '';
  }

  function saveState() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        screen: state.screen,
        priorities: state.priorities,
        shape: state.shape,
        length: state.length,
        width: state.width,
        projectStage: state.projectStage,
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
