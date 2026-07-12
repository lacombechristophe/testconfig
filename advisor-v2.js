(function () {
  'use strict';

  if (!window.DISKOOV_ADVISOR) return;

  var engine = window.DISKOOV_ADVISOR;
  var rules = window.DISKOOV_RULES;
  var root = document.getElementById('app');
  if (!root) return;

  var STORAGE_KEY = 'diskoov_advisor_v2';
  var STAGES = ['Votre besoin', 'Votre piscine', 'Vos solutions'];
  var state = {
    screen: 'welcome',
    history: [],
    priorities: [],
    shape: 'rect',
    length: null,
    width: null,
    dimensionsKnown: null,
    poolCompleted: false,
    results: null,
    compare: false,
    directFamily: '',
    activeProduct: ''
  };
  var savedState = loadSavedState();
  var lastFocus = null;
  var modalLastFocus = null;
  var detailLastFocus = null;
  var detailSource = 'guided';
  var focusScreenTitleOnRender = false;
  var screenEnteredAt = Date.now();

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
  window.notifyAdvisorConfiguratorSelection = handleConfiguratorSelection;
  window.notifyAdvisorProductInvalidated = handleConfiguratorInvalidation;

  if (shouldOpenAdvisor()) {
    openAdvisor('welcome', false);
  }

  function shellTemplate() {
    return ''
      + '<aside class="advisor-visual" aria-hidden="true">'
      + '  <figure class="advisor-visual-media"><img data-visual-image src="assets/produits/conseiller/ore-fermee.webp" alt="" width="1200" height="800" fetchpriority="high"></figure>'
      + '  <div class="advisor-visual-copy">'
      + '    <div class="advisor-kicker" data-visual-kicker>Conseil personnalisé</div>'
      + '    <div class="advisor-visual-title" data-visual-title>Une solution pensée pour votre bassin.</div>'
      + '    <p class="advisor-visual-text" data-visual-text>Quelques réponses suffisent pour comparer les protections qui correspondent le mieux à votre projet.</p>'
      + '    <p class="advisor-visual-meta" data-visual-meta>Besoin, bassin, puis sélection expliquée.</p>'
      + '  </div>'
      + '</aside>'
      + '<div class="advisor-panel">'
      + '  <header class="advisor-header">'
      + '    <div class="advisor-header-row">'
      + '      <a class="advisor-brand" href="https://diskoov.fr" aria-label="Diskoov, retour au site"><img class="advisor-brand-logo" src="assets/marque/logo-diskoov-bleu-orange.png" alt="" width="273" height="75"></a>'
      + '      <button type="button" class="advisor-help" data-action="direct" aria-label="Accès direct aux produits">Accès direct</button>'
      + '    </div>'
      + '    <div class="advisor-progress" data-advisor-progress></div>'
      + '  </header>'
      + '  <div class="advisor-body" data-advisor-body tabindex="-1"></div>'
      + '  <footer class="advisor-footer" data-advisor-footer></footer>'
      + '</div>'
      + '<div class="advisor-modal" data-advisor-modal role="dialog" aria-modal="true" aria-hidden="true" aria-label="Photo du produit agrandie">'
      + '  <button type="button" class="advisor-modal-close" data-action="close-preview" aria-label="Fermer">×</button>'
      + '  <img data-advisor-modal-image src="assets/produits/conseiller/ore-fermee.webp" alt="" width="1200" height="800">'
      + '</div>'
      + '<div class="advisor-detail-modal" data-advisor-detail-modal role="dialog" aria-modal="true" aria-hidden="true" aria-label="Détails du produit">'
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
      else if (action === 'dimensions-known') setDimensionsKnown(target.getAttribute('data-value') === 'true');
      else if (action === 'back') goBack();
      else if (action === 'next') goNext();
      else if (action === 'compare') {
        state.compare = !state.compare;
        trackAdvisor('advisor_compare_open', { open: state.compare });
        render({ preserveScroll: true, focusTitle: false });
        requestAnimationFrame(function () {
          var compareButton = body.querySelector('[data-action="compare"]');
          if (compareButton) compareButton.focus({ preventScroll: true });
        });
      }
      else if (action === 'choose') openConfigurator(target.getAttribute('data-product'), target.getAttribute('data-source') || 'guided');
      else if (action === 'direct-product') openConfigurator(target.getAttribute('data-product'), 'direct');
      else if (action === 'details') openProductDetails(target.getAttribute('data-product'), target, state.screen === 'direct' ? 'direct' : 'guided');
      else if (action === 'preview') openPreview(target.getAttribute('data-image'), target.getAttribute('data-alt'), target);
      else if (action === 'close-preview') closePreview();
      else if (action === 'close-details') closeProductDetails();
      else if (action === 'restart') restartAdvisor();
    });

    shell.addEventListener('input', function (event) {
      if (event.target.matches('[data-field]')) {
        state[event.target.getAttribute('data-field')] = parseDimensionValue(event.target.value);
        updateSurfaceLabel();
        updateDimensionFeedback();
        updateFooterOnly();
        if (dimensionsValid()) saveState();
      }
    });

    shell.addEventListener('keydown', function (event) {
      var shapeButtonTarget = event.target.closest('[data-action="shape"]');
      var dimensionButtonTarget = event.target.closest('[data-action="dimensions-known"]');
      if ((!shapeButtonTarget && !dimensionButtonTarget) || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(event.key) === -1) return;
      event.preventDefault();
      var direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
      if (shapeButtonTarget) {
        var shapes = ['rect', 'oval', 'libre'];
        var current = shapes.indexOf(shapeButtonTarget.getAttribute('data-value'));
        setStateValue('shape', shapes[(current + direction + shapes.length) % shapes.length]);
        return;
      }
      var values = ['true', 'false'];
      var dimensionCurrent = values.indexOf(dimensionButtonTarget.getAttribute('data-value'));
      setDimensionsKnown(values[(dimensionCurrent + direction + values.length) % values.length] === 'true');
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
    document.addEventListener('click', function (event) {
      var entry = event.target.closest('[data-open-advisor]');
      if (!entry) return;
      openAdvisor(entry.getAttribute('data-advisor-destination') || 'welcome', true);
    });
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
    if (screen === 'project') screen = 'results';
    if (screen) state.screen = screen;
    if (!keepHistory) state.history = [];
    root.classList.add('advisor-active');
    setLegacyInert(true);
    render({ resetScroll: true, focusTitle: false });
    requestAnimationFrame(focusScreenHeading);
    trackAdvisor('advisor_view', { screen: state.screen });
    screenEnteredAt = Date.now();
  }

  function closeAdvisor(restorePreviousFocus) {
    trackScreenExit('configurator');
    root.classList.remove('advisor-active');
    setLegacyInert(false);
    if (restorePreviousFocus !== false && lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
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
    screenEnteredAt = Date.now();
    render({ resetScroll: true });
  }

  function resumeGuided() {
    if (!savedState) return startGuided();
    Object.assign(state, savedState, { history: ['welcome'] });
    if (state.screen === 'welcome' || state.screen === 'direct') state.screen = 'priorities';
    if (state.screen === 'project') state.screen = 'results';
    trackAdvisor('advisor_resume', { screen: state.screen });
    render({ resetScroll: true });
  }

  function restartAdvisor() {
    trackAdvisor('advisor_restart', { from_screen: state.screen });
    sessionStorage.removeItem(STORAGE_KEY);
    savedState = null;
    state = {
      screen: 'welcome', history: [], priorities: [], shape: 'rect', length: null, width: null,
      dimensionsKnown: null, poolCompleted: false,
      results: null, compare: false, directFamily: '', activeProduct: ''
    };
    document.body.classList.remove('diskoov-guided-config');
    render({ resetScroll: true });
  }

  function navigate(screen) {
    trackScreenExit('next');
    if (state.screen !== screen) state.history.push(state.screen);
    state.screen = screen;
    if (screen === 'results') {
      state.results = engine.recommend(state, rules);
      trackAdvisor('advisor_results_view', {
        first_product: state.results.recommendations[0] ? state.results.recommendations[0].id : '',
        families: state.results.recommendations.map(function (item) { return item.prospectFamily; }).join(','),
        compatible_count: state.results.compatible.length,
        excluded_count: state.results.excluded.length
      });
    }
    render({ resetScroll: true });
    screenEnteredAt = Date.now();
    trackAdvisor('advisor_step_view', { screen: state.screen });
  }

  function goBack() {
    if (state.screen === 'direct' && state.directFamily) {
      state.directFamily = '';
      render({ resetScroll: true });
      return;
    }
    trackScreenExit('back');
    var previous = state.history.pop();
    if (previous === 'project') previous = 'pool';
    state.screen = previous || 'welcome';
    render({ resetScroll: true });
    screenEnteredAt = Date.now();
    trackAdvisor('advisor_back', { screen: state.screen });
  }

  function goNext() {
    if (state.screen === 'priorities' && state.priorities.length) navigate('pool');
    else if (state.screen === 'pool') {
      if (!dimensionsValid()) {
        showDimensionError();
        return;
      }
      state.poolCompleted = true;
      trackAdvisor('advisor_pool_complete', {
        shape: state.shape,
        dimensions_known: state.dimensionsKnown,
        length: state.dimensionsKnown ? state.length : 0,
        width: state.dimensionsKnown ? state.width : 0
      });
      navigate('results');
    }
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
    if (key === 'shape') {
      requestAnimationFrame(function () {
        var selected = body.querySelector('[data-action="shape"][data-value="' + value + '"]');
        if (selected) selected.focus({ preventScroll: true });
      });
    }
  }

  function setDimensionsKnown(value) {
    state.dimensionsKnown = value;
    render({ preserveScroll: true, focusTitle: false });
    requestAnimationFrame(function () {
      var selected = body.querySelector('[data-action="dimensions-known"][data-value="' + value + '"]');
      if (selected) selected.focus({ preventScroll: true });
    });
    trackAdvisor('advisor_dimensions_mode', { known: value });
  }

  function updatePriorityDom() {
    body.querySelectorAll('[data-action="priority"]').forEach(function (button) {
      var selected = state.priorities.indexOf(button.getAttribute('data-value')) !== -1;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    var hint = body.querySelector('.advisor-hint');
    if (hint) hint.textContent = prioritySelectionHint();
  }

  function updateFooterOnly() {
    footer.innerHTML = footerTemplate();
  }

  function render(options) {
    options = options || {};
    if (state.screen === 'results' && !state.results) {
      state.results = engine.recommend(state, rules);
    }
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
    requestAnimationFrame(focusScreenHeading);
  }

  function focusScreenHeading() {
    var title = body.querySelector('h1, h2');
    if (!title) return;
    title.setAttribute('tabindex', '-1');
    title.focus({ preventScroll: true });
  }

  function screenTemplate() {
    if (state.screen === 'welcome') return welcomeTemplate();
    if (state.screen === 'priorities') return prioritiesTemplate();
    if (state.screen === 'pool') return poolTemplate();
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
      + '<h1 class="advisor-title">Quelle protection simplifiera vraiment votre quotidien ?</h1>'
      + '<p class="advisor-subtitle">Partez de vos usages, pas des noms de produits. Diskoov compare les solutions selon votre bassin et explique clairement ce qui les distingue.</p>'
      + '<div class="advisor-welcome-actions">'
      + '  <button type="button" class="advisor-button" data-action="start">Trouver ma protection <span aria-hidden="true">→</span></button>'
      + '  <button type="button" class="advisor-button advisor-button--secondary" data-action="direct">Explorer les protections</button>'
      + '</div>'
      + resume
      + '<div class="advisor-welcome-path" aria-label="Ce que vous obtenez">'
      + '<div><strong>01</strong><span><b>Ce qui compte pour vous</b><small>Confort, sécurité, saison ou budget</small></span></div>'
      + '<div><strong>02</strong><span><b>Ce que permet votre bassin</b><small>Forme et dimensions, même approximatives</small></span></div>'
      + '<div><strong>03</strong><span><b>Ce qui change vraiment</b><small>Des familles différentes, comparées simplement</small></span></div>'
      + '</div>'
      + '<p class="advisor-welcome-note">Votre choix n’est pas définitif. Les conditions de pose sont vérifiées avec vous avant toute proposition détaillée.</p>'
      + '</div>';
  }

  function prioritiesTemplate() {
    var labels = {
      clean: 'Réduire l’entretien', safety: 'Sécuriser le bassin', season: 'Se baigner plus longtemps',
      aesthetics: 'Préserver le jardin', automatic: 'Ouvrir sans effort', space: 'Plancher mobile',
      economy: 'Maîtriser le budget', unsure: 'Je ne sais pas encore'
    };
    var descriptions = {
      clean: 'Limiter feuilles, saletés et entretien.',
      safety: 'Sécuriser l’accès au bassin au quotidien.',
      season: 'Profiter plus longtemps de la piscine.',
      aesthetics: 'Garder des abords élégants et discrets.',
      automatic: 'Ouvrir et fermer avec le moins de manipulation possible.',
      space: 'Étudier une fermeture du bassin par plancher mobile.',
      economy: 'Comparer en donnant plus de poids au budget.',
      unsure: 'Découvrir une sélection équilibrée sans connaître les produits.'
    };
    var values = ['clean', 'safety', 'season', 'aesthetics', 'automatic', 'space', 'economy', 'unsure'];
    return '<div class="advisor-screen">'
      + '<div class="advisor-step-label">Votre besoin</div>'
      + '<h1 class="advisor-title">Qu’aimeriez-vous changer au quotidien ?</h1>'
      + '<p class="advisor-subtitle">Choisissez une priorité, et éventuellement une seconde. Elles servent à comparer les compromis qui comptent vraiment pour vous.</p>'
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
      + '<p class="advisor-hint" aria-live="polite">' + prioritySelectionHint() + '</p>'
      + '</div>';
  }

  function prioritySelectionHint() {
    if (!state.priorities.length) return 'Sélectionnez au moins une réponse pour recevoir des pistes utiles.';
    if (state.priorities.length === 1) return 'Une priorité suffit. Vous pouvez en ajouter une seconde pour mieux départager les solutions.';
    return 'Vos deux attentes serviront à départager les solutions.';
  }

  function poolTemplate() {
    var dimensionsControls = state.dimensionsKnown === true
      ? '<fieldset class="advisor-fieldset"><legend class="advisor-legend">Dimensions intérieures</legend>'
        + '<div class="advisor-dimensions">'
        + inputDimension('length', 'Longueur', state.length, 3, 20)
        + '<span class="advisor-dim-x" aria-hidden="true">×</span>'
        + inputDimension('width', 'Largeur', state.width, 2, 12)
        + '</div><div class="advisor-surface" data-advisor-surface>' + surfaceText() + '</div></fieldset>'
      : state.dimensionsKnown === false
        ? '<div class="advisor-dimensions-later" role="note">' + icon('measure') + '<span><strong>Vous pourrez les ajouter ensuite.</strong><small>Les familles seront comparées sans annoncer de compatibilité dimensionnelle.</small></span></div>'
        : '<div class="advisor-dimensions-later advisor-dimensions-later--prompt" role="note">' + icon('measure') + '<span><strong>Choisissez l’option qui vous correspond.</strong><small>Des mesures approximatives suffisent. Vous pouvez aussi continuer sans les connaître.</small></span></div>';
    return '<div class="advisor-screen">'
      + '<div class="advisor-step-label">Votre piscine</div>'
      + '<h1 class="advisor-title">Quelles sont les grandes lignes de votre bassin ?</h1>'
      + '<p class="advisor-subtitle">La forme et les dimensions intérieures permettent d’écarter les modèles hors plage. Des mesures approximatives suffisent pour cette première comparaison.</p>'
      + '<div class="advisor-pool-layout">'
      + '  <div class="advisor-pool-controls">'
      + '  <fieldset class="advisor-fieldset"><legend class="advisor-legend">Forme du bassin</legend>'
      + '    <div class="advisor-segmented" role="radiogroup" aria-label="Forme du bassin">'
      + shapeButton('rect', 'Rectangle') + shapeButton('oval', 'Arrondie') + shapeButton('libre', 'Forme libre')
      + '    </div>'
      + '  </fieldset>'
      + '  <fieldset class="advisor-fieldset advisor-dimension-mode"><legend class="advisor-legend">Avez-vous les dimensions ?</legend><div class="advisor-segmented" role="radiogroup" aria-label="Disponibilité des dimensions">'
      + dimensionModeButton(true, 'Oui, même approximatives') + dimensionModeButton(false, 'Pas encore')
      + '  </div></fieldset>'
      + dimensionsControls
      + (state.dimensionsKnown === true ? '  <p class="advisor-dimension-feedback" id="advisor-dimension-feedback" data-dimension-feedback aria-live="polite">' + dimensionFeedbackText() + '</p>' : '')
      + '  </div>'
      + (state.dimensionsKnown === true ? poolPreviewTemplate() : poolUnknownTemplate())
      + '</div>'
      + (state.shape === 'libre' ? '<div class="advisor-resume"><span>Une forme libre demande une étude sur mesure. Une photo ou un plan aidera ensuite Diskoov à comprendre les contours du bassin.</span></div>' : '')
      + '</div>';
  }

  function dimensionModeButton(value, label) {
    var selected = state.dimensionsKnown === value;
    var firstTabStop = typeof state.dimensionsKnown !== 'boolean' && value === true;
    return '<button type="button" class="' + (selected ? 'is-selected' : '') + '" data-action="dimensions-known" data-value="' + value + '" role="radio" aria-checked="' + selected + '" tabindex="' + (selected || firstTabStop ? '0' : '-1') + '">' + label + '</button>';
  }

  function poolUnknownTemplate() {
    return '<aside class="advisor-pool-unknown" aria-label="Conseil pour préparer vos mesures">'
      + '<span class="advisor-pool-unknown-icon">' + icon('pool') + '</span>'
      + '<div><strong>Pour la suite, mesurez l’intérieur du bassin.</strong><p>Une photo prise depuis un angle large aide aussi à repérer les plages, les obstacles et l’accès au chantier.</p></div>'
      + '</aside>';
  }

  function poolPreviewTemplate() {
    var shapeLabels = { rect: 'Rectangle', oval: 'Arrondie', libre: 'Forme libre' };
    var ratio = poolPreviewRatio();
    return '<figure class="advisor-pool-preview" aria-label="Aperçu du bassin déclaré">'
      + '<figcaption><span>' + icon('measure') + '</span><div><strong>Votre bassin</strong><small>Mesures intérieures déclarées</small></div></figcaption>'
      + '<div class="advisor-pool-stage">'
      + '<div class="advisor-pool-shape advisor-pool-shape--' + safeClass(state.shape) + '" data-pool-shape style="aspect-ratio:' + ratio + ' / 1">'
      + '<span class="advisor-pool-length"><b data-pool-length>' + numberLabel(state.length) + ' m</b><small>longueur</small></span>'
      + '<span class="advisor-pool-width"><b data-pool-width>' + numberLabel(state.width) + ' m</b><small>largeur</small></span>'
      + '</div></div>'
      + '<p><strong>' + escapeHtml(shapeLabels[state.shape] || 'Bassin') + '</strong><span>Cette vue aide à confirmer vos mesures ; la pose et les abords seront vérifiés ensuite.</span></p>'
      + '</figure>';
  }

  function poolPreviewRatio() {
    if (!isDimensionValueValid(state.length, 3, 20) || !isDimensionValueValid(state.width, 2, 12)) return 2;
    return Math.max(1.2, Math.min(3, Math.round((state.length / state.width) * 100) / 100));
  }

  function shapeButton(value, label) {
    var selected = state.shape === value;
    return '<button type="button" class="' + (selected ? 'is-selected' : '') + '" data-action="shape" data-value="' + value + '" role="radio" aria-checked="' + selected + '" tabindex="' + (selected ? '0' : '-1') + '">' + label + '</button>';
  }

  function inputDimension(field, label, value, min, max) {
    var inputValue = value === null || value === '' || !Number.isFinite(Number(value)) ? '' : value;
    var invalid = !isDimensionValueValid(value, min, max);
    return '<div class="advisor-field"><label for="advisor-' + field + '">' + label + '</label><div class="advisor-input-wrap">'
      + '<input id="advisor-' + field + '" name="pool_' + field + '" data-field="' + field + '" type="number" inputmode="decimal" autocomplete="off" min="' + min + '" max="' + max + '" step="0.5" value="' + inputValue + '" aria-describedby="advisor-dimension-feedback" aria-invalid="' + invalid + '">'
      + '<span class="advisor-input-unit">m</span></div></div>';
  }

  function resultsTemplate() {
    state.results = state.results || engine.recommend(state, rules);
    var top = state.results.recommendations;
    var primary = top[0];
    var alternatives = top.slice(1);
    var resultTitle = top.length >= 3
      ? 'Trois façons vraiment différentes de protéger votre piscine.'
      : top.length === 2
        ? 'Deux approches cohérentes à comparer pour votre piscine.'
        : 'Une première approche à vérifier pour votre piscine.';
    var excludedReason = state.shape !== 'rect'
      ? 'Certaines solutions ne sont pas affichées car la forme déclarée demande une étude sur mesure. Les contours, les dimensions et les abords seront confirmés avec vous.'
      : 'Certaines solutions ne sont pas affichées car vos dimensions dépassent leurs limites connues. Une installation particulière peut aussi nécessiter une étude sur mesure.';
    var excludedCopy = state.results.excluded.length
      ? '<p class="advisor-hint">' + escapeHtml(excludedReason) + '</p>'
      : '';
    var resultContext = state.dimensionsKnown
      ? 'Pour votre bassin de ' + numberLabel(state.length) + ' × ' + numberLabel(state.width) + ' m, les modèles hors de leur plage connue ont été écartés. La pose et les abords restent à confirmer avant devis.'
      : 'Comme vous n’avez pas encore indiqué les dimensions, nous comparons les familles selon vos usages. Les modèles à étudier seront confirmés après vos mesures.';
    return '<div class="advisor-screen">'
      + '<div class="advisor-results-head"><div>'
      + '  <div class="advisor-step-label">Les solutions les plus cohérentes</div>'
      + '  <h1 class="advisor-title">' + escapeHtml(resultTitle) + '</h1>'
      + '  <p class="advisor-subtitle">' + escapeHtml(resultContext) + '</p>'
      + '</div><div class="advisor-result-actions">' + (top.length > 1 ? '<button type="button" class="advisor-button advisor-button--secondary" data-action="compare" aria-expanded="' + state.compare + '" aria-controls="advisor-results-comparison">' + (state.compare ? 'Masquer le comparatif' : 'Comparer point par point') + '</button>' : '') + '<button type="button" class="advisor-button advisor-button--text" data-action="restart">Recommencer</button></div></div>'
      + resultsSummaryTemplate()
      + (state.compare && top.length > 1 ? compareTemplate(top) : '')
      + (primary ? primaryResultTemplate(primary) : '')
      + (!state.compare ? familyOverviewTemplate(top) : '')
      + (alternatives.length ? '<section class="advisor-alternatives"><div class="advisor-alternatives-head"><div><span class="advisor-section-kicker">' + (alternatives.length === 1 ? 'Une autre approche' : 'Deux autres approches') + '</span><h2>À comparer avant de décider</h2></div><p>Chaque famille répond au projet avec un équilibre différent entre confort, discrétion, saison et budget.</p></div><div class="advisor-alternative-list">' + alternatives.map(alternativeResultTemplate).join('') + '</div></section>' : '')
      + excludedCopy
      + '<section class="advisor-results-explore"><div><strong>Vous voulez voir tous les modèles ?</strong><span>Explorez les cinq familles Diskoov sans perdre vos réponses.</span></div><button type="button" class="advisor-button advisor-button--secondary" data-action="direct">Explorer les protections</button></section>'
      + '</div>';
  }

  function resultsSummaryTemplate() {
    var poolTitle = state.dimensionsKnown ? numberLabel(state.length) + ' × ' + numberLabel(state.width) + ' m' : 'Dimensions à préciser';
    var poolText = state.dimensionsKnown ? 'Dimensions intérieures déclarées' : 'Comparaison basée sur vos usages';
    return '<div class="advisor-results-summary" aria-label="Résumé de votre projet">'
      + resultsSummaryItemTemplate(prioritySummaryIconName(), prioritySummaryLabel(), 'Ce qui compte dans votre projet')
      + resultsSummaryItemTemplate('pool', poolTitle, poolText)
      + resultsSummaryItemTemplate('user', 'Vérification humaine avant devis', 'Pose, accès et options confirmés avec vous')
      + '</div>';
  }

  function resultsSummaryItemTemplate(iconName, title, text) {
    return '<div><span class="advisor-results-summary-icon" aria-hidden="true">' + icon(iconName) + '</span><span class="advisor-results-summary-copy"><strong>' + escapeHtml(title) + '</strong><span>' + escapeHtml(text) + '</span></span></div>';
  }

  function prioritySummaryIconName() {
    var priority = state.priorities.filter(function (value) { return value !== 'unsure'; })[0];
    return priority || 'unsure';
  }

  function prioritySummaryLabel() {
    var labels = {
      clean: 'moins d’entretien', safety: 'sécurité du bassin', season: 'saison prolongée',
      aesthetics: 'jardin préservé', automatic: 'ouverture sans effort', space: 'plancher mobile',
      economy: 'budget maîtrisé'
    };
    var selected = state.priorities.filter(function (priority) { return labels[priority]; }).map(function (priority) { return labels[priority]; });
    var summary = selected.length ? frenchList(selected) : 'sélection équilibrée';
    return summary.charAt(0).toUpperCase() + summary.slice(1);
  }

  function familyOverviewTemplate(products) {
    var title = products.length >= 3 ? 'Ce qui distingue ces trois approches' : products.length === 2 ? 'Ce qui distingue ces deux approches' : 'Ce qui caractérise cette approche';
    return '<section class="advisor-family-overview" aria-label="Vue d’ensemble des approches proposées"><div class="advisor-family-overview-head"><span class="advisor-section-kicker">En un coup d’œil</span><h2>' + title + '</h2></div><div class="advisor-family-overview-grid" style="--advisor-family-count:' + Math.max(1, products.length) + '">'
      + products.map(function (item, index) {
        return '<article class="advisor-family-overview-item advisor-prospect--' + safeClass(item.prospectFamily) + (index === 0 ? ' is-primary' : '') + '"><span class="advisor-family-overview-icon">' + icon(familyIconName(item)) + '</span><div class="advisor-family-overview-copy"><strong>' + escapeHtml(prospectFamilyLabel(item)) + '</strong><span>' + escapeHtml(comparisonOperation(item)) + ' · ' + escapeHtml(comparisonPresence(item)) + '</span>' + (index === 0 ? '<small>Piste prioritaire</small>' : '') + '</div></article>';
      }).join('') + '</div></section>';
  }

  function productMedia(item, className) {
    var fallback = '<div class="advisor-fallback-visual advisor-fallback-visual--' + safeClass(item.family) + '">'
      + '<span class="advisor-fallback-icon">' + icon(item.family === 'shelter' ? 'season' : item.family === 'mobile-deck' ? 'space' : 'shield') + '</span>'
      + '<span class="advisor-fallback-label">' + escapeHtml(prospectFamilyLabel(item)) + '</span>'
      + '</div>';
    if (item.image) {
      return '<button type="button" class="' + className + ' advisor-product-media--' + safeClass(item.id) + '" data-action="preview" data-image="' + item.image + '" data-alt="' + escapeHtml(item.title) + '" aria-label="Agrandir la photo : ' + escapeHtml(item.title) + '"><img src="' + item.image + '" alt="" width="1200" height="800" loading="lazy" decoding="async">' + productImageNote(item) + '<span class="advisor-media-zoom" aria-hidden="true">' + icon('zoom') + '</span></button>';
    }
    return '<div class="' + className + ' advisor-result-media--fallback" aria-hidden="true">' + fallback + '</div>';
  }

  function productImageNote(item) {
    if (!item) return '';
    if (['auto', 'semi', 'eden', 'masterdeck'].indexOf(item.id) !== -1) return '<span class="advisor-media-note">Visuel de gamme · à confirmer</span>';
    if (item.id === 'm30' || item.id === 'm50') return '<span class="advisor-media-note">Visuel de gamme</span>';
    return '';
  }

  function primaryResultTemplate(item) {
    var benefits = commercialBenefits(item);
    if (item.certainty === 'dimension_fit') benefits = benefits.concat(['Dimensions dans la plage connue']);
    var tradeoff = productTradeoff(item);
    var match = priorityFit(item);
    var status = resultStatusLabel(item, 0);
    var proof = productSalesProof(item);
    return '<article class="advisor-primary-result advisor-family--' + safeClass(item.family) + '">'
      + productMedia(item, 'advisor-primary-media')
      + '<div class="advisor-primary-body"><div class="advisor-result-category">' + productCategoryTemplate(item, true) + '<span class="advisor-result-match advisor-result-match--' + safeClass(status.key) + '">' + escapeHtml(status.label) + '</span></div>'
      + '<h2>' + escapeHtml(item.title) + '</h2><p class="advisor-primary-lead">' + escapeHtml(productBestFor(item)) + '</p>'
      + benefitsTemplate(item, benefits, '')
      + (proof ? '<p class="advisor-primary-proof">' + icon('check') + '<span>' + escapeHtml(proof) + '</span></p>' : '')
      + '<dl class="advisor-primary-facts"><div><span class="advisor-primary-fact-icon" aria-hidden="true">' + icon(prioritySummaryIconName()) + '</span><dt>Pourquoi elle vous convient</dt><dd>' + escapeHtml(match) + '</dd></div><div><span class="advisor-primary-fact-icon" aria-hidden="true">' + icon('install') + '</span><dt>À valider avant devis</dt><dd>' + escapeHtml(tradeoff) + '</dd></div></dl>'
      + '<div class="advisor-primary-actions"><div><strong>' + escapeHtml(item.estimate) + '</strong><span>Étude de pose avant devis</span></div><div class="advisor-result-buttons"><button type="button" class="advisor-info-button" data-action="details" data-product="' + item.id + '">Découvrir</button><button type="button" class="advisor-button" data-action="choose" data-product="' + item.id + '" aria-label="Préparer mon devis pour ' + escapeHtml(item.title) + '">Préparer mon devis <span aria-hidden="true">→</span></button></div></div>'
      + '<p class="advisor-primary-next"><strong>Pourquoi joindre une photo ?</strong> ' + escapeHtml(photoHelpText(item)) + ' Elle reste facultative.</p></div>'
      + '</article>';
  }

  function alternativeResultTemplate(item) {
    var status = resultStatusLabel(item, 1);
    return '<article class="advisor-alternative advisor-family--' + safeClass(item.family) + '">'
      + productMedia(item, 'advisor-alternative-media')
      + '<div class="advisor-alternative-copy"><div class="advisor-result-category">' + productCategoryTemplate(item, true) + '<span class="advisor-result-match advisor-result-match--' + safeClass(status.key) + '">' + escapeHtml(status.label) + '</span></div><h3>' + escapeHtml(item.title) + '</h3><p class="advisor-alternative-fit">' + escapeHtml(productBestFor(item)) + '</p><p class="advisor-alternative-check"><strong>À savoir</strong>' + escapeHtml(productTradeoff(item)) + '</p></div>'
      + '<div class="advisor-alternative-actions"><span>' + escapeHtml(item.estimate) + '</span><div><button type="button" class="advisor-info-button" data-action="details" data-product="' + item.id + '">Découvrir</button><button type="button" class="advisor-button" data-action="choose" data-product="' + item.id + '" aria-label="Choisir ' + escapeHtml(item.title) + '">Choisir cette solution <span aria-hidden="true">→</span></button></div></div>'
      + '</article>';
  }

  function productCategoryTemplate(item, familyLevel) {
    return '<span class="advisor-category-label">' + icon(familyIconName(item)) + '<span>' + escapeHtml(familyLevel ? prospectFamilyLabel(item) : displayProductCategory(item)) + '</span></span>';
  }

  function prospectFamilyLabel(item) {
    var family = engine.PROSPECT_FAMILIES && engine.PROSPECT_FAMILIES[item && item.prospectFamily];
    return family ? family.label : displayProductCategory(item);
  }

  function displayProductCategory(item) {
    return item && item.category ? item.category : 'Protection de piscine';
  }

  function familyIconName(item) {
    var map = {
      cover: 'cover', coverseal: 'cover', 'custom-cover': 'cover', 'bar-cover': 'bars',
      shutter: 'shutter', shelter: 'shelter', 'mobile-deck': 'deck'
    };
    return map[item && item.family] || 'shield';
  }

  function benefitIconNames(item) {
    var map = {
      ore_compact: ['automatic', 'pool', 'measure'], ore_essential: ['season', 'automatic', 'measure'],
      auto: ['automatic', 'aesthetics', 'measure'], semi: ['cover', 'economy', 'measure'],
      eden: ['measure', 'automatic', 'aesthetics'], bab: ['shield', 'economy', 'measure'],
      volet_hs: ['automatic', 'install', 'measure'], volet_immerge: ['aesthetics', 'mechanism', 'measure'],
      masterdeck: ['space', 'measure', 'install']
    };
    if (item && item.family === 'shelter') return ['season', 'shelter', 'measure'];
    return map[item && item.id] || ['check', 'check', 'check'];
  }

  function benefitsTemplate(item, benefits, className) {
    var icons = benefitIconNames(item);
    return '<div class="advisor-benefits' + (className ? ' ' + className : '') + '">'
      + benefits.map(function (benefit, index) {
        return '<span>' + icon(icons[index] || 'check') + '<b>' + escapeHtml(benefit) + '</b></span>';
      }).join('') + '</div>';
  }

  function resultStatusLabel(item, index) {
    if (index === 0 && item.certainty !== 'custom') return { key: 'recommended', label: 'À étudier en priorité' };
    if (item.certainty === 'custom') return { key: 'custom', label: 'Étude sur mesure' };
    if (item.certainty === 'to_confirm') return { key: 'to-confirm', label: 'À confirmer avec vous' };
    if (item.certainty === 'dimension_fit') return { key: 'dimension-fit', label: 'Dimensions cohérentes' };
    return { key: 'to-confirm', label: 'À vérifier' };
  }

  function commercialBenefits(item) {
    var map = {
      ore_compact: ['Couverture motorisée', 'Pensée pour les bassins compacts'],
      ore_essential: ['Protection 4 saisons', 'Confort motorisé'],
      auto: ['Fonctionnement à confirmer', 'Étude du bassin'],
      semi: ['Manipulation à confirmer', 'Étude du bassin'],
      eden: ['Étude au cas par cas', 'Projet à définir'],
      bab: ['Sécurité essentielle', 'Garantie 3 ans'],
      volet_hs: ['Automatique', 'Sans intégration dans le bassin'],
      volet_immerge: ['Très discret', 'Mécanisme intégré'],
      masterdeck: ['Fermeture par plancher', 'Projet dimensionné sur mesure']
    };
    if (item.family === 'shelter') return ['Abri télescopique', 'Hauteur selon le modèle'];
    return map[item.id] || [];
  }

  function productSalesProof(item) {
    var map = {
      ore_compact: 'Pose incluse lorsque Diskoov fournit et installe la couverture',
      ore_essential: 'Conçue selon la norme NF P90-308',
      bab: 'NF P90-308 · garantie 3 ans',
      volet_hs: 'Norme de sécurité NF P90-308',
      ul: 'La pose est étudiée et chiffrée selon le chantier',
      m18: 'La pose est étudiée et chiffrée selon le chantier',
      m30: 'La pose est étudiée et chiffrée selon le chantier'
    };
    return map[item && item.id] || '';
  }

  function priorityFit(item) {
    var selected = state.priorities.filter(function (priority) { return priority !== 'unsure'; });
    if (!selected.length) return 'Une sélection équilibrée pour découvrir les solutions Diskoov sans préférence arrêtée.';
    var hits = selected.filter(function (priority) { return item.strengths.indexOf(priority) !== -1; });
    var labels = {
      clean: 'gagner du temps au quotidien', safety: 'sécuriser le bassin', season: 'prolonger la saison de baignade',
      aesthetics: 'préserver l’esthétique du jardin', automatic: 'tout automatiser', space: 'étudier une fermeture par plancher mobile', economy: 'maîtriser le budget'
    };
    var hitLabels = hits.map(function (priority) { return labels[priority]; });
    if (hits.length === selected.length) return 'Elle est à comparer en priorité pour vos objectifs : ' + frenchList(hitLabels) + '.';
    if (hits.length) return 'Elle mérite d’être comparée pour votre attente : ' + frenchList(hitLabels) + '. L’autre priorité demande une vérification.';
    return 'Son compromis peut vous convenir, mais elle répond moins directement à vos attentes principales.';
  }

  function frenchList(values) {
    if (!values.length) return '';
    if (values.length === 1) return values[0];
    if (values.length === 2) return values[0] + ' et ' + values[1];
    return values.slice(0, -1).join(', ') + ' et ' + values[values.length - 1];
  }

  function productTradeoff(item) {
    var map = {
      ore_compact: 'L’espace autour du bassin et la stabilité du support sont à confirmer avant de vous la proposer.',
      ore_essential: 'L’emplacement du mécanisme et les abords du bassin doivent être validés avec vous.',
      auto: 'Dimensions, alimentation, options, pose et tarif doivent être confirmés avant proposition.',
      semi: 'Le niveau de manipulation, les dimensions, la pose et le tarif doivent être confirmés avant proposition.',
      eden: 'Les usages, limites, options et conditions de pose sont définis pendant l’étude.',
      bab: 'La manipulation est manuelle et les ancrages doivent être validés autour du bassin.',
      volet_hs: 'L’axe et ses supports restent visibles sur la margelle ; leur implantation doit être validée.',
      volet_immerge: 'Il demande davantage d’intégration au bassin, à anticiper selon votre projet.',
      masterdeck: 'Les usages du plancher, les charges admissibles, les dimensions et les accès sont confirmés avant chiffrage.'
    };
    if (item.family === 'shelter') return 'La hauteur, le refoulement, les accès et la pose doivent être confirmés selon le bassin.';
    return map[item.id] || 'Les points de pose et d’accès seront vérifiés avant proposition.';
  }

  function productBestFor(item) {
    var map = {
      ore_compact: 'Vous avez un bassin compact et vous cherchez une couverture motorisée simple à vivre.',
      ore_essential: 'Vous voulez une protection 4 saisons plus polyvalente, avec un bon équilibre confort / discrétion.',
      auto: 'Vous souhaitez faire étudier la version automatique Coverseal pour votre bassin.',
      semi: 'Vous souhaitez comparer la version semi-automatique Coverseal après étude du bassin.',
      eden: 'Vous souhaitez faire définir Eden au cas par cas avant toute proposition.',
      bab: 'Vous cherchez une couverture de sécurité manuelle, sans alimentation électrique.',
      volet_hs: 'Vous voulez automatiser sans lancer une intégration lourde dans le bassin.',
      volet_immerge: 'Vous voulez garder les abords du bassin très propres visuellement.',
      ul: 'Vous recherchez l’abri le plus discret possible, au plus près du bassin.',
      m18: 'Vous cherchez un abri bas qui équilibre discrétion et confort d’usage.',
      m30: 'Vous voulez davantage de volume sous un abri bas, sans passer au mi-haut.',
      m50: 'Vous voulez la version la plus haute de la gamme basse, sans passer à un abri mi-haut.',
      mid: 'Vous voulez davantage de volume sous l’abri et assumez une présence visuelle plus marquée.',
      masterdeck: 'Vous souhaitez étudier une fermeture du bassin par une structure et un plancher sur mesure.'
    };
    if (map[item.id]) return map[item.id];
    if (item.family === 'shelter') return 'Vous souhaitez comparer plusieurs hauteurs d’abri télescopique selon votre bassin.';
    return 'Votre bassin correspond aux limites connues et mérite une vérification plus précise.';
  }

  function photoHelpText(item) {
    if (!item) return 'Une vue large aide Diskoov à repérer le support, les obstacles et l’accès au chantier.';
    if (item.family === 'shelter') return 'Une vue large montre la zone de refoulement, la terrasse et l’accès au bassin.';
    if (item.id === 'ore_compact' || item.id === 'ore_essential') return 'Une vue large montre le niveau des margelles et la place disponible côté mécanisme.';
    if (item.id === 'bab') return 'Une vue large montre les ancrages possibles, l’escalier et le bloc de filtration.';
    if (item.id === 'volet_hs' || item.id === 'volet_immerge') return 'Une vue large montre la zone de l’axe ou d’intégration, l’escalier et l’alimentation proche.';
    if (item.id === 'masterdeck') return 'Une vue large montre les abords, les accès et l’espace disponible autour du bassin.';
    return 'Une vue large aide Diskoov à repérer le support, les obstacles et l’accès au chantier.';
  }

  function openProductDetails(productId, trigger, source) {
    var item = findResultProduct(productId);
    if (!item || !detailModal || !detailContent) return;
    detailSource = source === 'direct' ? 'direct' : 'guided';
    detailLastFocus = trigger || document.activeElement;
    detailContent.className = 'advisor-detail-card advisor-family--' + safeClass(item.family);
    detailContent.innerHTML = productDetailTemplate(item);
    detailModal.classList.add('is-open');
    detailModal.setAttribute('aria-hidden', 'false');
    detailModal.setAttribute('aria-label', 'Détails : ' + item.title);
    var close = detailContent.querySelector('[data-action="close-details"]');
    if (close) close.focus({ preventScroll: true });
    trackAdvisor('advisor_product_detail_open', { product: item.id, source: detailSource });
  }

  function closeProductDetails() {
    if (!detailModal || !detailContent) return;
    detailModal.classList.remove('is-open');
    detailModal.setAttribute('aria-hidden', 'true');
    detailModal.setAttribute('aria-label', 'Détails du produit');
    detailContent.innerHTML = '';
    detailContent.className = 'advisor-detail-card';
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
    var proof = productSalesProof(item);
    var reasons = Array.isArray(item.reasons) ? item.reasons.map(function (reason) { return publicReasonText(reason, item); }) : [];
    var media = item.image
      ? '<div class="advisor-detail-media advisor-product-media--' + safeClass(item.id) + '"><img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.title) + '" width="1200" height="800" decoding="async">' + productImageNote(item) + '</div>'
      : '<div class="advisor-detail-media advisor-detail-media--fallback" aria-hidden="true">' + icon(item.family === 'shelter' ? 'season' : item.family === 'mobile-deck' ? 'space' : 'shield') + '</div>';
    var directBlocked = detailSource === 'direct' && !directSelectionAllowed(item);
    var blockedCopy = directBlocked ? directUnavailableCopy(item) : null;
    var action = detailSource === 'direct' ? 'direct-product' : 'choose';
    var actionLabel = directBlocked ? blockedCopy.label : 'Préparer mon devis';
    var actionAttributes = directBlocked ? ' disabled' : ' data-action="' + action + '" data-product="' + item.id + '" data-source="' + detailSource + '"';
    var directNotice = directBlocked
      ? '<div class="advisor-detail-section advisor-detail-section--blocked"><strong>' + escapeHtml(blockedCopy.title) + '</strong><p>' + escapeHtml(blockedCopy.text) + '</p></div>'
      : '';
    return '<button type="button" class="advisor-detail-close" data-action="close-details" aria-label="Fermer">×</button>'
      + media
      + '<div class="advisor-detail-body">'
      + '<div class="advisor-detail-topline">' + productCategoryTemplate(item) + (proof ? '<span class="advisor-detail-proof">' + icon('check') + '<span>' + escapeHtml(proof) + '</span></span>' : '') + '</div>'
      + '<h2 class="advisor-detail-title">' + escapeHtml(item.title) + '</h2>'
      + '<p class="advisor-detail-lead">' + escapeHtml(productSalesIntro(item)) + '</p>'
      + benefitsTemplate(item, benefits, 'advisor-detail-benefits')
      + decisionFactsTemplate(item, 'advisor-detail-decision')
      + '<div class="advisor-detail-section"><strong>À choisir si</strong><p>' + escapeHtml(productBestFor(item)) + '</p></div>'
      + '<ul class="advisor-detail-list">' + bullets.map(function (bullet) { return '<li>' + escapeHtml(bullet) + '</li>'; }).join('') + '</ul>'
      + '<div class="advisor-detail-section advisor-detail-section--notice"><strong>À vérifier ensemble</strong><p>' + escapeHtml(productTradeoff(item)) + '</p></div>'
      + directNotice
      + (reasons.length ? '<div class="advisor-detail-fit"><strong>Adapté à votre projet</strong><span>' + reasons.map(escapeHtml).join('</span><span>') + '</span></div>' : '')
      + '<div class="advisor-detail-footer"><div class="advisor-detail-offer"><strong>' + escapeHtml(item.estimate || 'Étude personnalisée') + '</strong><small>Proposition affinée après vérification du bassin</small></div><div class="advisor-detail-cta"><button type="button" class="advisor-button"' + actionAttributes + '>' + actionLabel + (directBlocked ? '' : ' <span aria-hidden="true">→</span>') + '</button><small>Photo facultative · proposition après vérification</small></div></div>'
      + '</div>';
  }

  function decisionFactsTemplate(item, className) {
    var icons = decisionFactIconNames(item);
    var facts = [
      ['Manipulation', comparisonOperation(item)],
      ['Présence', comparisonPresence(item)],
      ['À prévoir', comparisonCheck(item)]
    ];
    return '<dl class="advisor-decision-facts' + (className ? ' ' + className : '') + '">' + facts.map(function (fact, index) {
      return '<div><span class="advisor-decision-icon" aria-hidden="true">' + icon(icons[index]) + '</span><dt>' + escapeHtml(fact[0]) + '</dt><dd>' + escapeHtml(fact[1]) + '</dd></div>';
    }).join('') + '</dl>';
  }

  function decisionFactIconNames(item) {
    var operation = {
      semi: 'mechanism', eden: 'measure', bab: 'manual', masterdeck: 'measure'
    }[item && item.id];
    if (!operation) operation = item && item.family === 'shelter' ? 'move' : 'automatic';
    return [operation, familyIconName(item), 'install'];
  }

  function productSalesIntro(item) {
    var map = {
      ore_compact: 'Une couverture motorisée Oré pensée pour les bassins compacts et pour simplifier l’ouverture au quotidien.',
      ore_essential: 'Une couverture Oré plus polyvalente, conçue pour protéger le bassin toute l’année avec un guidage motorisé discret et une pose intégrée à l’estimation lorsqu’elle est demandée.',
      auto: 'La version automatique Coverseal est dimensionnée après étude du bassin ; l’alimentation, les options, la pose et le tarif sont confirmés avant proposition.',
      semi: 'La version semi-automatique Coverseal est étudiée avec le bassin ; son niveau de manipulation, ses options, sa pose et son tarif sont confirmés avant proposition.',
      eden: 'Eden est étudiée au cas par cas. Ses usages, limites, son fonctionnement, ses options et sa pose sont confirmés avant toute proposition.',
      bab: 'La bâche à barres Secu Classic est une couverture de sécurité manuelle, tarifée selon les dimensions et les options retenues.',
      volet_hs: 'Le volet hors-sol apporte une ouverture automatique avec un axe et des supports visibles sur la margelle.',
      volet_immerge: 'Le volet immergé protège le bassin avec un mécanisme intégré, plus discret visuellement et plus exigeant à anticiper dans le projet.',
      ul: 'Le Master Ultra Bas 1.2 privilégie la discrétion tout en prolongeant l’usage saisonnier du bassin.',
      m18: 'Le Master 18 est un abri bas pensé comme un équilibre entre discrétion, protection et confort d’usage.',
      m30: 'Le Master 30 conserve une ligne basse avec davantage de volume sous l’abri.',
      m50: 'Le Master Bas 5.0 est la version la plus haute de la gamme basse ; sa hauteur dépend du nombre de modules et de la largeur.',
      mid: 'L’abri mi-haut privilégie le volume sous la structure pour profiter plus longtemps du bassin.',
      masterdeck: 'MasterDeck ferme le bassin au moyen d’une structure, de guides et d’un plancher dimensionnés sur mesure. Les usages du plancher et les charges admissibles sont confirmés dans l’étude.'
    };
    if (map[item.id]) return map[item.id];
    if (item.family === 'shelter') return 'Un abri télescopique pour prolonger les baignades et protéger le bassin plus longtemps dans l’année.';
    return item.description || 'Une solution à étudier selon les dimensions et les contraintes de votre bassin.';
  }

  function productSalesBullets(item) {
    var map = {
      ore_compact: ['Adaptée aux bassins jusqu’à 7 × 3,5 m.', 'Un seul rail de guidage, positionné du côté choisi avec vous.', 'Télécommande sans fil ; recharge filaire ou solaire en option.', 'La plage côté mécanisme doit être mesurée avant estimation.'],
      ore_essential: ['Adaptée aux bassins jusqu’à 12 × 5 m.', 'Un seul rail de guidage, positionné du côté choisi avec vous.', 'Pose par deux techniciens lorsqu’elle est retenue.', 'Options possibles : solaire, découpe bloc, sangles et recul.'],
      auto: ['Dimensions et limites confirmées après étude du bassin.', 'Alimentation et options précisées avant proposition.', 'Conditions de pose et tarif vérifiés avec le projet.'],
      semi: ['Niveau de manipulation confirmé pendant l’étude.', 'Dimensions et options précisées avant proposition.', 'Conditions de pose et tarif vérifiés avec le projet.'],
      eden: ['Usages et limites définis au cas par cas.', 'Fonctionnement et options précisés pendant l’étude.', 'Conditions de pose confirmées avant proposition.'],
      bab: ['Adaptée aux bassins jusqu’à 12 × 5 m.', 'Enroulement par manivelle et déroulement par sangle de rappel.', 'Les ancrages, l’escalier et le bloc de filtration sont vérifiés avec vous.'],
      volet_hs: ['Adapté aux bassins jusqu’à 12 × 6 m.', 'L’axe et ses supports restent visibles sur la margelle.', 'Les conditions de livraison et de pose dépendent du département.'],
      volet_immerge: ['Adapté aux bassins jusqu’à 14 × 6 m.', 'Le mécanisme s’intègre au bassin pour préserver les abords.', 'Fond de bassin, caillebotis ou mur étudiés sur mesure.'],
      masterdeck: ['Structure, guides et plancher définis selon les dimensions.', 'Usages du plancher et charges admissibles confirmés pendant l’étude.', 'Nombre de plateaux, motorisation et finition précisés avant proposition.']
    };
    if (item.family === 'shelter') return ['Structure télescopique déclinée en plusieurs hauteurs.', 'Refoulement et accès étudiés selon le bassin.', 'Pose et nombre de modules confirmés avant proposition.'];
    return map[item.id] || ['Dimensions et forme prises en compte.', 'Estimation affinée avec les détails de pose.', 'Accompagnement humain avant proposition finale.'];
  }

  function publicReasonText(reason, item) {
    if (item && item.id === 'eden' && reason === item.description) return 'Projet défini au cas par cas avant toute proposition.';
    return reason;
  }

  function compareTemplate(products) {
    var criteria = [
      ['user', 'Usage principal', comparisonUse],
      ['automatic', 'Manipulation', comparisonOperation],
      ['aesthetics', 'Présence visuelle', comparisonPresence],
      ['season', 'Effet thermique / période', comparisonSeason],
      ['install', 'À confirmer', comparisonCheck],
      ['check', 'Étude Diskoov', function (p) { return p.estimate; }]
    ];
    criteria = criteria.filter(function (row) {
      var values = products.map(function (product) { return row[2](product); });
      return values.some(function (value) { return value !== values[0]; });
    });
    var mobileCriteria = [
      ['user', 'Idéal pour', comparisonUse],
      ['automatic', 'Manipulation', comparisonOperation],
      ['install', 'À prévoir', comparisonCheck]
    ];
    var mobileCards = '<div class="advisor-compare-mobile">'
      + products.map(function (p) {
        return '<article class="advisor-compare-card"><h3>' + escapeHtml(p.title) + '</h3>'
          + mobileCriteria.map(function (row) { return '<p><strong>' + icon(row[0]) + '<span>' + escapeHtml(row[1]) + '</span></strong><span>' + escapeHtml(row[2](p)) + '</span></p>'; }).join('')
          + '</article>';
      }).join('')
      + '</div>';
    return '<section class="advisor-compare" id="advisor-results-comparison" aria-label="Comparatif des solutions"><h2 class="advisor-compare-title">Comparer ce qui change vraiment</h2><table aria-label="Comparaison des solutions recommandées"><thead><tr><th>Critère</th>'
      + products.map(function (p) { return '<th>' + escapeHtml(p.title) + '</th>'; }).join('') + '</tr></thead><tbody>'
      + criteria.map(function (row) { return '<tr><td><span class="advisor-compare-criterion">' + icon(row[0]) + '<span>' + escapeHtml(row[1]) + '</span></span></td>' + products.map(function (p) { return '<td>' + escapeHtml(row[2](p)) + '</td>'; }).join('') + '</tr>'; }).join('')
      + '</tbody></table>' + mobileCards + '</section>';
  }

  function comparisonUse(item) {
    var map = {
      ore_compact: 'Motoriser un bassin compact', ore_essential: 'Protéger le bassin toute l’année',
      auto: 'Faire étudier la version automatique', semi: 'Faire étudier la version semi-automatique',
      eden: 'Définir le projet au cas par cas', bab: 'Sécuriser avec une solution simple',
      volet_hs: 'Automatiser sans intégrer le mécanisme au bassin', volet_immerge: 'Automatiser avec un mécanisme intégré',
      masterdeck: 'Fermer le bassin par un plancher sur mesure'
    };
    if (item.family === 'shelter') return 'Comparer plusieurs hauteurs d’abri télescopique';
    return map[item.id] || publicReasonText(item.description || 'Protection du bassin', item);
  }

  function comparisonOperation(item) {
    var map = {
      ore_compact: 'Motorisée', ore_essential: 'Motorisée', auto: 'Automatique', semi: 'Semi-automatique',
      eden: 'Définie pendant l’étude', bab: 'Manuelle', volet_hs: 'Automatique', volet_immerge: 'Automatique',
      masterdeck: 'Définie pendant l’étude'
    };
    if (item.family === 'shelter') return 'Modules télescopiques';
    return map[item.id] || 'À confirmer';
  }

  function comparisonPresence(item) {
    var map = {
      ore_compact: 'Protection basse', ore_essential: 'Protection basse', auto: 'À confirmer pendant l’étude',
      semi: 'À confirmer pendant l’étude', eden: 'À définir pendant l’étude', bab: 'Visible une fois fermée',
      volet_hs: 'Axe et supports visibles', volet_immerge: 'Mécanisme intégré', masterdeck: 'Plancher au-dessus du bassin',
      ul: 'Ultra-bas', m18: 'Bas', m30: 'Bas, avec plus de volume', m50: 'Gamme basse, plus haute', mid: 'Mi-haut'
    };
    return map[item.id] || 'À confirmer';
  }

  function comparisonSeason(item) {
    if (item.id === 'bab') return 'Limite les déperditions de chaleur';
    if (item.id === 'volet_hs') return 'Limite l’évaporation et contribue à prolonger la période';
    if (item.id === 'ore_compact' || item.id === 'ore_essential') return 'Protection 4 saisons';
    return 'À confirmer selon le modèle';
  }

  function comparisonCheck(item) {
    var map = {
      ore_compact: 'Support et dégagement', ore_essential: 'Mécanisme et abords',
      auto: 'Support, alimentation et pose', semi: 'Support et manipulation', eden: 'Étude complète sur mesure',
      bab: 'Ancrages et escalier', volet_hs: 'Électricité et implantation', volet_immerge: 'Intégration au bassin',
      masterdeck: 'Dimensions, abords et finitions'
    };
    if (item.family === 'shelter') return 'Refoulement, accès et terrasse';
    return map[item.id] || 'Conditions de pose';
  }

  function directTemplate() {
    var families = directFamilyDefinitions();
    var selected = families.filter(function (family) { return family.id === state.directFamily; })[0];
    if (!selected) return directFamiliesTemplate(families);
    return directProductsTemplate(selected);
  }

  function directFamilyDefinitions() {
    return [
      {
        id: 'covers', icon: 'cover', title: 'Couvertures motorisées', eyebrow: 'Plusieurs technologies', products: ['ore_compact', 'ore_essential', 'auto', 'semi', 'eden'], image: 'ore_essential',
        text: 'Oré, Coverseal et Eden répondent à des configurations différentes.', bestFor: 'Vous voulez comparer le fonctionnement, l’implantation et les contraintes de chaque modèle.', check: 'La place, le support, l’alimentation et la pose sont vérifiés avant proposition.',
        proofs: [['Fonctionnement', 'Défini selon le modèle retenu'], ['Implantation', 'Vérifiée avec les abords du bassin'], ['À prévoir', 'Support, dégagement et alimentation']]
      },
      {
        id: 'bar-cover', icon: 'bars', title: 'Couverture à barres', eyebrow: 'Protection essentielle', products: ['bab'], image: 'bab',
        text: 'Une couverture de sécurité manuelle, sans alimentation électrique.', bestFor: 'Vous privilégiez une solution tarifée selon les dimensions et les options utiles.', check: 'Les ancrages, l’escalier et le bloc de filtration sont confirmés avec vous.',
        proofs: [['Au quotidien', 'Une manipulation plus manuelle'], ['Autour du bassin', 'Une protection visible une fois fermée'], ['À prévoir', 'Ancrages, escalier et bloc de filtration']]
      },
      {
        id: 'shutters', icon: 'shutter', title: 'Volets de piscine', eyebrow: 'Confort automatisé', products: ['volet_hs', 'volet_immerge'], image: 'volet_hs',
        text: 'Le confort d’une ouverture automatique, hors-sol ou intégrée au bassin.', bestFor: 'Vous voulez ouvrir et fermer le bassin simplement, avec une finition adaptée au projet.', check: 'L’électricité, l’escalier et l’implantation sont vérifiés avant étude.',
        proofs: [['Au quotidien', 'Ouverture automatisée selon la configuration'], ['Deux approches', 'Axe et supports visibles ou mécanisme intégré'], ['À prévoir', 'Électricité, escalier et implantation']]
      },
      {
        id: 'shelters', icon: 'shelter', title: 'Abris télescopiques', eyebrow: 'Plusieurs hauteurs', products: ['ul', 'm18', 'm30', 'm50', 'mid'], image: 'm18',
        text: 'Une structure télescopique déclinée en plusieurs hauteurs.', bestFor: 'Vous voulez comparer le volume, la présence visuelle et l’usage sous abri.', check: 'L’espace de refoulement, les accès et la terrasse sont étudiés avec vous.',
        proofs: [['Au quotidien', 'Le bassin reste protégé sous une structure télescopique'], ['Choix déterminant', 'La hauteur change le confort et la présence visuelle'], ['À prévoir', 'Refoulement, accès et terrasse']]
      },
      {
        id: 'deck', icon: 'deck', title: 'Terrasse mobile', eyebrow: 'Fermeture par plancher', products: ['masterdeck'], image: 'masterdeck',
        text: 'Une structure, des guides et un plancher dimensionnés pour fermer le bassin.', bestFor: 'Vous souhaitez étudier un plancher mobile adapté aux dimensions et aux abords.', check: 'Les usages, charges admissibles, accès et finitions sont confirmés pendant l’étude.',
        proofs: [['Configuration', 'Structure, guides et plancher sur mesure'], ['Usage', 'Charges admissibles confirmées pendant l’étude'], ['À prévoir', 'Dimensions, accès et finitions']]
      }
    ];
  }

  function directFamiliesTemplate(families) {
    return '<div class="advisor-screen">'
      + '<div class="advisor-step-label">Explorer les solutions</div>'
      + '<h1 class="advisor-title">Qu’aimeriez-vous gagner autour de votre piscine ?</h1>'
      + '<p class="advisor-subtitle">Chaque famille répond à une priorité différente. Comparez ce qu’elle change au quotidien, puis découvrez les modèles.</p>'
      + '<div class="advisor-family-list">'
      + families.map(function (family) {
        var item = engine.findCandidate(family.image);
        var actionLabel = family.products.length > 1 ? 'Voir les modèles' : 'Découvrir ce produit';
        var media = item && item.image
          ? '<div class="advisor-family-media advisor-product-media--' + safeClass(item.id) + '"><img src="' + escapeHtml(item.image) + '" alt="" width="1200" height="800" loading="lazy" decoding="async"></div>'
          : '<div class="advisor-family-media advisor-direct-media--fallback" aria-hidden="true">' + icon('shield') + '</div>';
        return '<article class="advisor-family-item advisor-family-item--' + safeClass(family.id) + '">' + media
          + '<div class="advisor-family-copy"><span class="advisor-direct-category">' + icon(family.icon) + '<span>' + escapeHtml(family.eyebrow) + '</span></span><h2>' + escapeHtml(family.title) + '</h2><p>' + escapeHtml(family.bestFor) + '</p><dl class="advisor-family-signals">' + familySignalTemplate(family, 0) + familySignalTemplate(family, 2) + '</dl></div>'
          + '<button type="button" class="advisor-direct-main" data-action="direct-family" data-value="' + family.id + '">' + actionLabel + ' <span aria-hidden="true">→</span></button></article>';
      }).join('')
      + '</div></div>';
  }

  function directProductsTemplate(family) {
    return '<div class="advisor-screen">'
      + '<div class="advisor-step-label">' + escapeHtml(family.eyebrow) + '</div>'
      + '<div class="advisor-direct-header"><div><h1 class="advisor-title">' + escapeHtml(family.title) + '</h1><p class="advisor-subtitle">' + escapeHtml(family.text) + '</p></div><button type="button" class="advisor-button advisor-button--text" data-action="direct-families">← Tous les types</button></div>'
      + familyStoryTemplate(family)
      + '<div class="advisor-direct-groups"><section><div class="advisor-direct-list">'
      + family.products.map(directProductItem).join('')
      + '</div></section></div></div>';
  }

  function familyStoryTemplate(family) {
    var signalIcons = familySignalIconNames(family);
    var heightScale = family.id === 'shelters'
      ? '<div class="advisor-height-scale" aria-label="Hauteurs d’abri à comparer"><span class="is-low">Ultra-bas</span><span class="is-medium">Bas</span><span class="is-high">Mi-haut</span></div>'
      : '';
    return '<section class="advisor-family-story advisor-family-story--' + safeClass(family.id) + '" aria-label="Ce qui caractérise cette famille">'
      + '<div class="advisor-family-story-lead"><span>' + icon(family.icon) + '</span><div><strong>Ce qui change avec cette solution</strong><p>' + escapeHtml(family.bestFor) + '</p></div></div>'
      + '<div class="advisor-family-story-facts">' + family.proofs.map(function (proof, index) {
        return '<div><span class="advisor-family-story-fact-icon" aria-hidden="true">' + icon(signalIcons[index]) + '</span><strong>' + escapeHtml(proof[0]) + '</strong><span class="advisor-family-story-fact-copy">' + escapeHtml(proof[1]) + '</span></div>';
      }).join('') + '</div>'
      + heightScale
      + '</section>';
  }

  function familySignalTemplate(family, index) {
    var proof = family.proofs[index];
    var signalIcons = familySignalIconNames(family);
    return '<div><dt><span class="advisor-family-signal-icon" aria-hidden="true">' + icon(signalIcons[index]) + '</span><span>' + escapeHtml(proof[0]) + '</span></dt><dd>' + escapeHtml(proof[1]) + '</dd></div>';
  }

  function familySignalIconNames(family) {
    var map = {
      covers: ['automatic', 'cover', 'install'],
      'bar-cover': ['manual', 'cover', 'install'],
      shutters: ['automatic', 'shutter', 'install'],
      shelters: ['shelter', 'measure', 'install'],
      deck: ['space', 'deck', 'install']
    };
    return map[family && family.id] || ['check', 'aesthetics', 'install'];
  }

  function directProductItem(id) {
    var item = engine.findCandidate(id);
    if (!item) return '';
    var selectable = directSelectionAllowed(item);
    var unavailable = selectable ? null : directUnavailableCopy(item);
    var proof = productSalesProof(item);
    var media = item.image
      ? '<button type="button" class="advisor-direct-media advisor-product-media--' + safeClass(item.id) + '" data-action="preview" data-image="' + escapeHtml(item.image) + '" data-alt="' + escapeHtml(item.title) + '" aria-label="Agrandir la photo : ' + escapeHtml(item.title) + '"><img src="' + escapeHtml(item.image) + '" alt="" width="1200" height="800" loading="lazy" decoding="async">' + productImageNote(item) + '<span class="advisor-media-zoom" aria-hidden="true">' + icon('zoom') + '</span></button>'
      : '<span class="advisor-direct-media advisor-direct-media--fallback" aria-hidden="true">' + icon(item.family === 'shelter' ? 'season' : item.family === 'mobile-deck' ? 'space' : 'shield') + '</span>';
    return '<article class="advisor-direct-item advisor-family--' + safeClass(item.family) + (selectable ? '' : ' is-unavailable') + '">' + media
      + '<div class="advisor-direct-copy">' + productCategoryTemplate(item) + '<span class="advisor-direct-name">' + escapeHtml(item.title) + '</span><span class="advisor-direct-desc">' + escapeHtml(productBestFor(item)) + '</span>' + (proof ? '<span class="advisor-product-proof">' + icon('check') + '<span>' + escapeHtml(proof) + '</span></span>' : '') + decisionFactsTemplate(item, 'advisor-model-facts') + '</div>'
      + '<div class="advisor-direct-buttons"><button type="button" class="advisor-info-button advisor-info-button--inline" data-action="details" data-product="' + id + '">Découvrir</button><button type="button" class="advisor-direct-main"' + (selectable ? ' data-action="direct-product" data-product="' + id + '" aria-label="Choisir ' + escapeHtml(item.title) + '">Choisir ce modèle <span aria-hidden="true">→</span>' : ' disabled>' + escapeHtml(unavailable.label)) + '</button></div></article>';
  }

  function footerTemplate() {
    if (state.screen === 'welcome') return '<div class="advisor-footer-note">Conseil personnalisé · Vos réponses restent sur cet appareil jusqu’à l’envoi du formulaire.</div>';
    if (state.screen === 'direct') return '<div class="advisor-footer-actions advisor-footer-actions--direct"><button type="button" class="advisor-button advisor-button--text" data-action="back">← Retour</button></div>';
    var nextDisabled = (state.screen === 'priorities' && !state.priorities.length)
      || (state.screen === 'pool' && (typeof state.dimensionsKnown !== 'boolean' || (state.dimensionsKnown === true && !dimensionsValid())));
    var nextLabel = state.screen === 'pool' ? 'Voir mes solutions' : 'Continuer';
    var showNext = ['priorities', 'pool'].indexOf(state.screen) !== -1;
    var backLabel = state.screen === 'results' ? 'Modifier' : 'Retour';
    var recommended = state.screen === 'results' && state.results && state.results.recommendations && state.results.recommendations[0];
    var footerNote = state.screen === 'results'
      ? 'Votre sélection n’est pas définitive : Diskoov valide la pose et les accès avec vous.'
      : 'Vos réponses orientent la sélection ; la proposition est affinée après vérification.';
    return '<div class="advisor-footer-note">' + footerNote + '</div><div class="advisor-footer-actions">'
      + '<button type="button" class="advisor-button advisor-button--text" data-action="back">← ' + backLabel + '</button>'
      + (recommended ? '<button type="button" class="advisor-button" data-action="choose" data-product="' + recommended.id + '" aria-label="Préparer mon devis pour ' + escapeHtml(recommended.title) + '">Préparer mon devis <span aria-hidden="true">→</span></button>' : '')
      + (showNext ? '<button type="button" class="advisor-button" data-action="next"' + (nextDisabled ? ' disabled' : '') + '>' + nextLabel + ' <span aria-hidden="true">→</span></button>' : '')
      + '</div>';
  }

  function updateProgress() {
    var current = stageForScreen(state.screen);
    var percent = state.screen === 'welcome' ? 0 : ((current + 1) / STAGES.length) * 100;
    var progress = shell.querySelector('[data-advisor-progress]');
    if (state.screen === 'direct') {
      var familyChosen = Boolean(state.directFamily);
      var directPercent = familyChosen ? 67 : 33;
      progress.innerHTML = '<div class="advisor-progress-meta"><span>Explorer les protections</span><span>' + (familyChosen ? 'Comparer les modèles' : 'Choisir une famille') + '</span></div>'
        + '<div class="advisor-progress-stages advisor-progress-stages--direct"><span class="advisor-progress-stage' + (familyChosen ? ' is-done' : ' is-current') + '">Type de protection</span><span class="advisor-progress-stage' + (familyChosen ? ' is-current' : '') + '">Modèle</span><span class="advisor-progress-stage">Étude</span></div>'
        + '<div class="advisor-progress-track" role="progressbar" aria-label="Progression" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + directPercent + '"><div class="advisor-progress-fill" style="width:' + directPercent + '%"></div></div>';
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
    if (screen === 'results') return 2;
    return 0;
  }

  function updateVisualCopy() {
    var primary = state.results && state.results.recommendations && state.results.recommendations[0];
    var copies = {
      welcome: { kicker: 'Conseil personnalisé', title: 'Choisissez par l’usage, pas par le jargon.', text: 'Diskoov compare les solutions qui changent réellement votre quotidien autour du bassin.', meta: 'Deux questions, puis des familles clairement expliquées.', image: 'assets/produits/conseiller/ore-fermee.webp' },
      priorities: { kicker: 'Vos usages', title: 'Votre quotidien donne la direction.', text: 'Confort, sécurité, saison, esthétique ou budget : deux priorités suffisent pour comparer.', meta: 'Vous pourrez encore explorer toutes les familles.', image: 'assets/produits/conseiller/volet-hors-sol.webp' },
      pool: { kicker: 'Votre bassin', title: 'Les dimensions évitent les fausses pistes.', text: 'Elles servent uniquement à écarter les modèles hors plage, jamais à promettre une pose compatible.', meta: 'Des mesures approximatives suffisent pour commencer.', image: 'assets/produits/conseiller/ore-ouverte.webp' },
      results: { kicker: 'Vos solutions', title: primary ? prospectFamilyLabel(primary) : 'Des approches différentes à comparer.', text: primary ? productBestFor(primary) : 'Comparez les familles, puis faites vérifier le projet qui vous convient le mieux.', meta: 'Pose, accès et options sont confirmés avant devis.', image: primary && primary.image ? primary.image : 'assets/produits/conseiller/ore-fermee.webp' },
      direct: { kicker: 'Les solutions Diskoov', title: 'Choisissez l’approche qui vous correspond.', text: 'Type de protection, manipulation, intégration et hauteur : comparez les différences concrètes entre les familles.', meta: 'Les contraintes de chaque modèle restent vérifiées avant devis.', image: 'assets/produits/conseiller/masterdeck.webp' }
    };
    var copy = copies[state.screen] || copies.welcome;
    if (state.screen === 'direct' && state.directFamily) {
      var family = directFamilyDefinitions().filter(function (entry) { return entry.id === state.directFamily; })[0];
      var familyItem = family && engine.findCandidate(family.image);
      if (family) {
        copy = {
          kicker: family.eyebrow,
          title: family.title,
          text: family.bestFor,
          meta: family.check,
          image: familyItem && familyItem.image ? familyItem.image : copies.direct.image
        };
      }
    }
    shell.querySelector('[data-visual-kicker]').textContent = copy.kicker;
    shell.querySelector('[data-visual-title]').textContent = copy.title;
    shell.querySelector('[data-visual-text]').textContent = copy.text;
    shell.querySelector('[data-visual-meta]').textContent = copy.meta;
    var visualImage = shell.querySelector('[data-visual-image]');
    if (visualImage && visualImage.getAttribute('src') !== copy.image) visualImage.setAttribute('src', copy.image);
  }

  function openConfigurator(productId, source) {
    var item = engine.findCandidate(productId);
    if (!item) return;
    source = source === 'direct' ? 'direct' : 'guided';
    if (source === 'direct' && !directSelectionAllowed(item)) {
      trackAdvisor('advisor_handoff_blocked', { product: productId, reason: 'known_pool_range' });
      return;
    }
    state.activeProduct = productId;
    saveState();

    var hasKnownPoolContext = (source === 'guided' || state.poolCompleted) && state.dimensionsKnown;
    if (hasKnownPoolContext) {
      syncPoolState();
    } else if (typeof window.clearAdvisorPoolDimensions === 'function') {
      window.clearAdvisorPoolDimensions(source === 'guided' || state.poolCompleted ? state.shape : 'rect');
    }
    if (typeof window.setAdvisorProjectStage === 'function') window.setAdvisorProjectStage('');
    syncLeadAdvisorContext(item, source);
    document.body.classList.toggle('diskoov-guided-config', source === 'guided');

    if (typeof window.selEq === 'function') window.selEq(item.eq);
    if (item.selectionType === 'cm' && typeof window.selCM === 'function') window.selCM(item.selectionValue);
    if (item.selectionType === 'sm' && typeof window.selSM === 'function') window.selSM(item.selectionValue);
    if (item.selectionType === 'otherProduct' && typeof window.selOtherProduct === 'function') window.selOtherProduct(item.selectionValue);

    var selected = typeof window.getDiskoovConfiguratorSelection === 'function' ? window.getDiskoovConfiguratorSelection() : null;
    if (selected && selected.product !== item.id) {
      trackAdvisor('advisor_handoff_error', { requested_product: item.id, selected_product: selected.product || '' });
      if (typeof window.showToast === 'function') window.showToast('Ce modèle n’a pas pu être sélectionné avec ces informations. Revenez aux autres pistes.', true);
      return;
    }

    if (detailModal && detailModal.classList.contains('is-open')) closeProductDetails();
    updateConfiguratorSummary(item, source === 'guided' ? 'guided' : (hasKnownPoolContext ? 'direct-known' : 'direct'));
    closeAdvisor(false);
    var panelBody = document.getElementById('pbdy');
    var guidedSummary = document.getElementById('guided-summary');
    if (panelBody) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          panelBody.scrollTo({ top: 0, behavior: 'smooth' });
          if (guidedSummary) guidedSummary.focus({ preventScroll: true });
        });
      });
    }
    trackAdvisor(source === 'guided' ? 'advisor_recommendation_select' : 'advisor_direct_select', { product: productId });
    trackAdvisor('advisor_configurator_open', { product: productId, source: source, dimensions_known: hasKnownPoolContext });
  }

  function syncPoolState() {
    if (typeof window.selShape === 'function') window.selShape(state.shape);
    var length = document.getElementById('d-l');
    var width = document.getElementById('d-w');
    if (length) length.value = state.length;
    if (width) width.value = state.width;
    if (typeof window.updD === 'function') window.updD();
  }

  function syncLeadAdvisorContext(item, source) {
    if (!item || typeof window.setAdvisorContext !== 'function') return;
    var labels = engine.PRIORITIES || {};
    var recommendations = state.results && Array.isArray(state.results.recommendations)
      ? state.results.recommendations.map(function (recommendation) { return recommendation.title; })
      : [];
    var choiceReason = source === 'guided'
      ? priorityFit(item)
      : 'Ce produit a été exploré directement par le prospect.';
    window.setAdvisorContext({
      mode: source,
      version: 'v3',
      priorities: state.priorities.map(function (priority) { return labels[priority] || priority; }),
      recommendations: recommendations,
      choiceReason: choiceReason,
      dimensionsKnown: !!((source === 'guided' || state.poolCompleted) && state.dimensionsKnown)
    });
  }

  function directSelectionAllowed(item) {
    if (state.poolCompleted && state.shape !== 'rect' && ['eden', 'volet_hs', 'volet_immerge'].indexOf(item.id) === -1) return false;
    if (!state.poolCompleted || !state.dimensionsKnown) return true;
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

  function directUnavailableCopy(item) {
    var acceptsCustomShape = item && ['eden', 'volet_hs', 'volet_immerge'].indexOf(item.id) !== -1;
    if (state.poolCompleted && state.shape !== 'rect' && !acceptsCustomShape) {
      return {
        label: 'Forme à étudier',
        title: 'Cette forme demande une étude sur mesure',
        text: 'Découvrez les modèles prévus pour les bassins atypiques ou modifiez la forme déclarée.'
      };
    }
    if (state.poolCompleted && state.dimensionsKnown) {
      return {
        label: 'Hors plage actuelle',
        title: 'Dimensions hors de la plage connue',
        text: 'Découvrez les autres modèles, modifiez les dimensions ou transmettez votre projet pour une étude spécifique.'
      };
    }
    return {
      label: 'Étude nécessaire',
      title: 'Ce modèle demande une étude complémentaire',
      text: 'Découvrez les autres modèles ou précisez les informations de votre bassin.'
    };
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
      summary.setAttribute('tabindex', '-1');
      var pbdy = document.getElementById('pbdy');
      if (pbdy) pbdy.insertBefore(summary, pbdy.firstChild);
    }
    summary.classList.remove('guided-summary--warning');
    var guided = mode === 'guided';
    var knownPool = mode === 'guided' && state.dimensionsKnown || mode === 'direct-known';
    var resultItem = findResultProduct(item.id);
    var knownDimensionalRange = !!(resultItem && resultItem.certainty === 'dimension_fit');
    var meta = knownPool
      ? (knownDimensionalRange
        ? 'Retenue pour votre bassin ' + numberLabel(state.length) + ' × ' + numberLabel(state.width) + ' m. Les dimensions sont cohérentes avec la plage connue ; la pose et les accès restent à vérifier.'
        : 'Retenue pour votre bassin ' + numberLabel(state.length) + ' × ' + numberLabel(state.width) + ' m. Ces dimensions sont enregistrées ; le modèle, la pose et les accès restent à confirmer avec vous.')
      : guided
        ? 'Retenue selon vos priorités. Ajoutez les dimensions et les détails de pose pour confirmer le modèle adapté.'
        : 'Renseignez les dimensions et les contraintes de pose pour vérifier que ce produit convient à votre bassin.';
    var proof = guided ? '<div class="guided-summary-proof">' + escapeHtml(priorityFit(item)) + '</div>' : '';
    var next = '<div class="guided-summary-next"><strong>À préciser maintenant</strong><span>L’état du projet, la prestation et les abords du bassin. Si vous choisissez la pose, nous préciserons aussi l’accès au chantier. Une photo facultative aide à repérer les obstacles et les équipements.</span></div>';
    summary.innerHTML = '<div class="guided-summary-kicker">' + (guided ? 'Solution retenue' : 'Modèle choisi') + '</div><div class="guided-summary-row"><div><div class="guided-summary-title">' + escapeHtml(item.title) + '</div><div class="guided-summary-meta">' + escapeHtml(meta) + '</div>' + proof + '</div><button type="button" data-open-advisor data-advisor-destination="' + (guided ? 'results' : 'direct') + '">' + (guided ? 'Revoir les solutions' : 'Voir les familles') + '</button></div>' + next;
  }

  function handleConfiguratorSelection(productId, pool) {
    syncAdvisorPoolFromConfigurator(pool);
    var summary = document.getElementById('guided-summary');
    if (!summary) return;
    var destinationButton = summary.querySelector('[data-open-advisor]');
    var destination = destinationButton ? destinationButton.getAttribute('data-advisor-destination') : 'direct';
    var item = engine.findCandidate(productId);
    if (!item) {
      state.activeProduct = '';
      saveState();
      summary.classList.add('guided-summary--warning');
      summary.innerHTML = '<div class="guided-summary-kicker">Choix à compléter</div><div class="guided-summary-row"><div><div class="guided-summary-title">Choisissez un modèle</div><div class="guided-summary-meta">La famille a changé dans le configurateur. Sélectionnez maintenant le modèle à vérifier pour votre bassin.</div></div><button type="button" data-open-advisor data-advisor-destination="' + escapeHtml(destination) + '">Revoir les solutions</button></div>';
      return;
    }
    syncLeadAdvisorContext(item, document.body.classList.contains('diskoov-guided-config') ? 'guided' : 'direct');
    state.activeProduct = item.id;
    saveState();
    updateConfiguratorSummary(item, destination === 'results' ? 'guided' : (state.poolCompleted && state.dimensionsKnown ? 'direct-known' : 'direct'));
  }

  function handleConfiguratorInvalidation(productId, detail, pool) {
    syncAdvisorPoolFromConfigurator(pool);
    state.activeProduct = '';
    saveState();
    var summary = document.getElementById('guided-summary');
    if (!summary) return;
    var destinationButton = summary.querySelector('[data-open-advisor]');
    var destination = destinationButton ? destinationButton.getAttribute('data-advisor-destination') : 'direct';
    var item = engine.findCandidate(productId);
    var label = item ? item.title : 'Le modèle sélectionné';
    summary.classList.add('guided-summary--warning');
    summary.innerHTML = '<div class="guided-summary-kicker">Modèle à revoir</div><div class="guided-summary-row"><div><div class="guided-summary-title">Choisissez une autre option</div><div class="guided-summary-meta">' + escapeHtml(label + ' a été retiré de la sélection. ' + (detail || 'Les informations du bassin sortent de sa plage connue.')) + '</div></div><button type="button" data-open-advisor data-advisor-destination="' + escapeHtml(destination) + '">Revoir les solutions</button></div><div class="guided-summary-next"><strong>Pourquoi</strong><span>Le configurateur évite de conserver un modèle hors de sa plage de dimensions connue. Une étude sur mesure reste possible selon le projet.</span></div>';
  }

  function syncAdvisorPoolFromConfigurator(pool) {
    pool = pool || {};
    var length = Number(pool.length);
    var width = Number(pool.width);
    var hasShape = ['rect', 'oval', 'libre'].indexOf(pool.shape) !== -1;
    var hasValidDimensions = length >= 3 && length <= 20 && width >= 2 && width <= 12;
    if (!hasShape && !hasValidDimensions) return;
    if (hasShape) state.shape = pool.shape;
    state.dimensionsKnown = hasValidDimensions;
    state.poolCompleted = true;
    state.results = null;
    if (hasValidDimensions) {
      state.length = length;
      state.width = width;
    }
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
    var lengthLabel = shell.querySelector('[data-pool-length]');
    var widthLabel = shell.querySelector('[data-pool-width]');
    var shape = shell.querySelector('[data-pool-shape]');
    if (lengthLabel) lengthLabel.textContent = numberLabel(state.length) + ' m';
    if (widthLabel) widthLabel.textContent = numberLabel(state.width) + ' m';
    if (shape) shape.style.aspectRatio = poolPreviewRatio() + ' / 1';
  }

  function surfaceText() {
    if (state.dimensionsKnown !== true) return 'Dimensions à préciser';
    if (!dimensionsValid()) return 'Surface indicative : dimensions à compléter';
    return 'Surface indicative : ' + numberLabel(state.length * state.width) + ' m²';
  }

  function dimensionsValid() {
    if (state.dimensionsKnown === false) return true;
    if (state.dimensionsKnown !== true) return false;
    return isDimensionValueValid(state.length, 3, 20) && isDimensionValueValid(state.width, 2, 12);
  }

  function isDimensionValueValid(value, min, max) {
    return Number.isFinite(value) && value >= min && value <= max;
  }

  function parseDimensionValue(value) {
    if (value === null || String(value).trim() === '') return null;
    var number = Number(String(value).replace(',', '.'));
    if (!Number.isFinite(number)) return null;
    return Math.round(number * 10) / 10;
  }

  function dimensionFeedbackText() {
    if (!state.dimensionsKnown) return 'Vous pourrez renseigner les mesures avant de demander votre devis.';
    if (dimensionsValid()) return 'Longueur de 3 à 20 m · largeur de 2 à 12 m.';
    if (state.length === null || state.width === null) return 'Renseignez les deux dimensions pour continuer.';
    return 'Vérifiez les mesures : longueur de 3 à 20 m et largeur de 2 à 12 m.';
  }

  function updateDimensionFeedback() {
    var feedback = body.querySelector('[data-dimension-feedback]');
    var lengthInput = body.querySelector('[data-field="length"]');
    var widthInput = body.querySelector('[data-field="width"]');
    var lengthValid = !state.dimensionsKnown || isDimensionValueValid(state.length, 3, 20);
    var widthValid = !state.dimensionsKnown || isDimensionValueValid(state.width, 2, 12);
    if (lengthInput) lengthInput.setAttribute('aria-invalid', String(!lengthValid));
    if (widthInput) widthInput.setAttribute('aria-invalid', String(!widthValid));
    if (!feedback) return;
    feedback.textContent = dimensionFeedbackText();
    feedback.classList.toggle('is-error', !lengthValid || !widthValid);
  }

  function showDimensionError() {
    if (state.dimensionsKnown === null) {
      var mode = body.querySelector('[data-action="dimensions-known"]');
      if (mode) mode.focus({ preventScroll: true });
      return;
    }
    if (state.dimensionsKnown === false) return;
    updateDimensionFeedback();
    var invalidInput = !isDimensionValueValid(state.length, 3, 20)
      ? body.querySelector('[data-field="length"]')
      : body.querySelector('[data-field="width"]');
    if (invalidInput) invalidInput.focus({ preventScroll: true });
  }

  function numberLabel(value) {
    if (value === null || value === '' || !Number.isFinite(Number(value))) return '—';
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
        dimensionsKnown: state.dimensionsKnown,
        poolCompleted: state.poolCompleted,
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
      if (typeof parsed.dimensionsKnown !== 'boolean') parsed.dimensionsKnown = null;
      if (typeof parsed.poolCompleted !== 'boolean') parsed.poolCompleted = parsed.screen === 'results' || parsed.screen === 'project';
      if (parsed.screen === 'project') parsed.screen = 'results';
      delete parsed.projectStage;
      delete parsed.budget;
      delete parsed.delay;
      delete parsed.showAll;
      return parsed;
    } catch (error) { return null; }
  }

  function trackAdvisor(event, params) {
    params = Object.assign({ advisor_version: 'v3' }, params || {});
    if (typeof window.track === 'function') window.track(event, params);
    else {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign({ event: event }, params));
    }
  }

  function trackScreenExit(reason) {
    var duration = Math.max(0, Math.round((Date.now() - screenEnteredAt) / 1000));
    trackAdvisor('advisor_step_exit', { screen: state.screen, reason: reason, duration_seconds: duration });
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
      clean: '<path d="M7 3v7M3.5 6.5h7M17 4v4M15 6h4"/><path d="M4 15c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 2.5 1 2.5 1M4 19c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 2.5 1 2.5 1"/>',
      safety: '<path d="M12 3 5 6v5c0 4.5 2.7 7.8 7 10 4.3-2.2 7-5.5 7-10V6l-7-3Z"/>',
      season: '<path d="M4 15c3-7 13-9 16 0M6 18h12M12 3v4M4.2 7l3 2M19.8 7l-3 2"/>',
      aesthetics: '<path d="M5 19c6 0 11-5 14-14-9 3-14 8-14 14Z"/><path d="M5 19c3-4 6-7 10-10"/>',
      automatic: '<path d="M7 7h10v10H7z"/><path d="m10 14 4-4M10 10h4v4"/>',
      space: '<path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"/>',
      economy: '<circle cx="12" cy="12" r="9"/><path d="M15 8.5c-.7-.5-1.5-.8-2.5-.8-1.7 0-3 1-3 2.3s1.1 2 3 2.3c1.7.3 2.7 1 2.7 2.2 0 1.4-1.3 2.4-3 2.4-1.1 0-2.2-.4-3-1M12 6v12"/>',
      check: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.3 2.3 4.8-5"/>',
      measure: '<path d="m5 17 12-12 2 2L7 19l-2-2Z"/><path d="m10 12 2 2M13 9l2 2M7 15l2 2"/>',
      pool: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M6 10c1.3-1 2.7-1 4 0s2.7 1 4 0 2.7-1 4 0M6 14c1.3-1 2.7-1 4 0s2.7 1 4 0 2.7-1 4 0"/>',
      install: '<path d="M14.5 6.5a4 4 0 0 0-5 5L4 17l3 3 5.5-5.5a4 4 0 0 0 5-5l-2.5 2.5-3-3 2.5-2.5Z"/>',
      mechanism: '<circle cx="8" cy="12" r="4"/><circle cx="8" cy="12" r="1"/><path d="M12 12h8M17 9v6"/>',
      manual: '<path d="M18 11V6a2 2 0 0 0-4 0v4M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8M6 14v-2a2 2 0 0 0-4 0v4a6 6 0 0 0 6 6h4a8 8 0 0 0 8-8v-3a2 2 0 0 0-4 0v1"/>',
      move: '<path d="m18 8 4 4-4 4M6 8l-4 4 4 4M2 12h20"/>',
      cover: '<rect x="3.5" y="6" width="17" height="12" rx="1.75"/><path d="M4 10h16M9 6.5v11M15 6.5v11"/>',
      bars: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M4 8h16M4 12h16M4 16h16"/>',
      shutter: '<circle cx="7" cy="12" r="3.5"/><path d="M10.5 8.5H20v7h-9.5M5.5 12h3M13 10.75h4.5M13 13.75h4.5"/>',
      shelter: '<path d="M3 18h18M5 18v-5a7 7 0 0 1 14 0v5"/><path d="M9 18v-5a3 3 0 0 1 6 0v5"/>',
      deck: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M8 5v14M13 5v14M18 5v14M3 10h18M3 15h18"/>',
      zoom: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4 4M10.5 7.5v6M7.5 10.5h6"/>',
      unsure: '<circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 0 1 4.6 1c0 1.7-2.4 2-2.4 3.5M12 17h.01"/>'
    };
    return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || paths.unsure) + '</svg>';
  }
}());
