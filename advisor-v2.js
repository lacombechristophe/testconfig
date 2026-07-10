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
      + '    <div class="advisor-kicker" data-visual-kicker>Conseil personnalisé</div>'
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
      else if (action === 'budget') setSimpleChoice('budget', target.getAttribute('data-value'));
      else if (action === 'delay') setSimpleChoice('delay', target.getAttribute('data-value'));
      else if (action === 'project-stage') {
        var projectStage = target.getAttribute('data-value');
        setSimpleChoice('projectStage', state.projectStage === projectStage ? 'unknown' : projectStage);
      }
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
      if (event.target.matches('[data-field]')) {
        state[event.target.getAttribute('data-field')] = parseDimensionValue(event.target.value);
        updateSurfaceLabel();
        updateDimensionFeedback();
        if (dimensionsValid()) saveState();
      }
    });

    shell.addEventListener('keydown', function (event) {
      var shapeButtonTarget = event.target.closest('[data-action="shape"]');
      if (!shapeButtonTarget || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(event.key) === -1) return;
      event.preventDefault();
      var shapes = ['rect', 'oval', 'libre'];
      var current = shapes.indexOf(shapeButtonTarget.getAttribute('data-value'));
      var direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
      setStateValue('shape', shapes[(current + direction + shapes.length) % shapes.length]);
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
    render({ resetScroll: true, focusTitle: false });
    requestAnimationFrame(focusScreenHeading);
    trackAdvisor('advisor_view', { screen: state.screen });
  }

  function closeAdvisor(restorePreviousFocus) {
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
    if (state.screen === 'direct' && state.directFamily) {
      state.directFamily = '';
      render({ resetScroll: true });
      return;
    }
    var previous = state.history.pop();
    state.screen = previous || 'welcome';
    render({ resetScroll: true });
  }

  function goNext() {
    if (state.screen === 'priorities' && state.priorities.length) navigate('pool');
    else if (state.screen === 'pool') {
      if (!dimensionsValid()) {
        showDimensionError();
        return;
      }
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
    if (key === 'shape') {
      requestAnimationFrame(function () {
        var selected = body.querySelector('[data-action="shape"][data-value="' + value + '"]');
        if (selected) selected.focus({ preventScroll: true });
      });
    }
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
    if (hint) hint.textContent = prioritySelectionHint();
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
      + '<h1 class="advisor-title">Trouvez la protection qui convient à votre piscine et à votre quotidien.</h1>'
      + '<p class="advisor-subtitle">En quelques réponses, Diskoov repère les solutions à étudier, explique leurs différences et prépare un premier échange utile autour de votre bassin.</p>'
      + '<div class="advisor-welcome-actions">'
      + '  <button type="button" class="advisor-button" data-action="start">Recevoir mes recommandations <span aria-hidden="true">→</span></button>'
      + '  <button type="button" class="advisor-button advisor-button--secondary" data-action="direct">Je connais déjà le type de protection</button>'
      + '</div>'
      + resume
      + '<div class="advisor-welcome-path" aria-label="Ce que vous obtenez">'
      + '<div><strong>01</strong><span><b>Vos priorités</b><small>Ce que vous voulez améliorer au quotidien</small></span></div>'
      + '<div><strong>02</strong><span><b>Votre bassin</b><small>Les fausses bonnes idées sont écartées</small></span></div>'
      + '<div><strong>03</strong><span><b>Vos solutions</b><small>Une sélection expliquée à comparer</small></span></div>'
      + '</div>'
      + '<p class="advisor-welcome-note">Vous ne choisissez rien définitivement ici. Les conditions de pose sont vérifiées avant toute proposition détaillée.</p>'
      + '</div>';
  }

  function prioritiesTemplate() {
    var labels = Object.assign({}, engine.PRIORITIES, { unsure: 'Être guidé par Diskoov' });
    var descriptions = {
      clean: 'Limiter feuilles, saletés et entretien.',
      safety: 'Sécuriser l’accès au bassin au quotidien.',
      season: 'Profiter plus longtemps de la piscine.',
      aesthetics: 'Garder des abords élégants et discrets.',
      automatic: 'Réduire les manipulations manuelles.',
      space: 'Récupérer une vraie surface utilisable.',
      economy: 'Comparer sans partir sur du surdimensionné.',
      unsure: 'Partir d’une sélection équilibrée, sans connaître les produits.'
    };
    var values = ['clean', 'safety', 'season', 'aesthetics', 'automatic', 'space', 'economy', 'unsure'];
    return '<div class="advisor-screen">'
      + '<div class="advisor-step-label">Votre besoin</div>'
      + '<h1 class="advisor-title">Que voulez-vous améliorer en priorité autour de votre piscine ?</h1>'
      + '<p class="advisor-subtitle">Choisissez une ou deux attentes. Elles servent à vous proposer des protections qui changent vraiment l’usage, sans masquer les contraintes du bassin.</p>'
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
    return '<div class="advisor-screen">'
      + '<div class="advisor-step-label">Votre piscine</div>'
      + '<h1 class="advisor-title">Parlez-nous de votre bassin.</h1>'
      + '<p class="advisor-subtitle">Indiquez la forme et les dimensions intérieures du bassin. Elles nous permettent d’écarter les modèles hors de leur plage connue, avant de vérifier l’installation.</p>'
      + '<div class="advisor-pool-layout">'
      + '  <div class="advisor-pool-controls">'
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
      + '  <p class="advisor-dimension-feedback" id="advisor-dimension-feedback" data-dimension-feedback aria-live="polite">' + dimensionFeedbackText() + '</p>'
      + '  </div>'
      + poolPreviewTemplate()
      + '</div>'
      + (state.shape === 'libre' ? '<div class="advisor-resume"><span>Une forme libre sera orientée vers une étude sur mesure. Vous pourrez joindre une photo ou un plan avant d’envoyer votre demande.</span></div>' : '')
      + '</div>';
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

  function projectTemplate() {
    var budgets = [
      ['under5', 'Moins de 5 000 €'], ['5_10', '5 000 à 10 000 €'], ['10_15', '10 000 à 15 000 €'],
      ['15_25', '15 000 à 25 000 €'], ['over25', 'Plus de 25 000 €'], ['unknown', 'Je ne sais pas encore']
    ];
    var delays = [['urg', 'Dès que possible'], ['6m', 'Dans les 6 mois'], ['1a', 'Dans l’année'], ['ref', 'Je réfléchis'], ['unknown', 'Pas de date précise']];
    var stages = [['existing', 'Déjà construite'], ['construction', 'En construction'], ['renovation', 'À rénover'], ['planning', 'En réflexion']];
    return '<div class="advisor-screen">'
      + '<div class="advisor-step-label">Votre projet</div>'
      + '<h1 class="advisor-title">Affinons la sélection, sans vous enfermer.</h1>'
      + '<p class="advisor-subtitle">Votre budget et votre calendrier servent à prioriser les solutions, jamais à en fermer une. Vous pouvez rester approximatif.</p>'
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
      + '  <h1 class="advisor-title">Vos meilleures options, expliquées.</h1>'
      + '  <p class="advisor-subtitle">Pour votre bassin de ' + numberLabel(state.length) + ' × ' + numberLabel(state.width) + ' m, nous avons d’abord retenu les protections dans leur plage de dimensions connue. La pose est ensuite confirmée avec vous avant devis.</p>'
      + '</div><div class="advisor-result-actions"><button type="button" class="advisor-button advisor-button--secondary" data-action="compare">' + (state.compare ? 'Masquer le comparatif' : 'Comparer les différences') + '</button><button type="button" class="advisor-button advisor-button--text" data-action="restart">Recommencer</button></div></div>'
      + resultsSummaryTemplate()
      + (primary ? primaryResultTemplate(primary) : '')
      + (alternatives.length ? '<section class="advisor-alternatives"><div class="advisor-alternatives-head"><div><span class="advisor-section-kicker">Autres pistes</span><h2>Une autre manière de répondre à votre projet</h2></div><p>Elles conviennent aussi à votre bassin, avec un équilibre différent entre confort, discrétion et budget.</p></div><div class="advisor-alternative-list">' + alternatives.map(alternativeResultTemplate).join('') + '</div></section>' : '')
      + (state.compare ? compareTemplate(top) : '')
      + (state.results.compatible.length > 3 ? '<button type="button" class="advisor-more" data-action="show-all">' + (state.showAll ? 'Afficher seulement les 3 pistes principales' : 'Voir les ' + state.results.compatible.length + ' solutions dans leur plage connue') + '</button>' : '')
      + excludedCopy
      + '</div>';
  }

  function resultsSummaryTemplate() {
    var area = Math.round((state.length * state.width) * 10) / 10;
    var count = state.results.recommendations.length;
    var optionLabel = count === 1 ? '1 option à étudier' : count + ' options à comparer';
    var selectionLabel = count === 1 ? 'Sélectionnée pour votre projet' : 'Sélectionnées pour votre projet';
    return '<div class="advisor-results-summary" aria-label="Résumé de votre projet">'
      + '<div><strong>' + numberLabel(state.length) + ' × ' + numberLabel(state.width) + ' m</strong><span>Bassin déclaré · ' + numberLabel(area) + ' m²</span></div>'
      + '<div><strong>' + optionLabel + '</strong><span>' + selectionLabel + '</span></div>'
      + '<div><strong>Étude Diskoov avant devis</strong><span>Pose, accès et options confirmés avec vous</span></div>'
      + '</div>';
  }

  function productMedia(item, className, rank) {
    var fallback = '<div class="advisor-fallback-visual advisor-fallback-visual--' + safeClass(item.family) + '">'
      + '<span class="advisor-fallback-icon">' + icon(item.family === 'shelter' ? 'season' : item.family === 'mobile-deck' ? 'space' : 'shield') + '</span>'
      + '<span class="advisor-fallback-label">' + escapeHtml(displayProductCategory(item)) + '</span>'
      + '</div>';
    if (item.image) {
      return '<button type="button" class="' + className + ' advisor-product-media--' + safeClass(item.id) + '" data-action="preview" data-image="' + item.image + '" data-alt="' + escapeHtml(item.title) + '" aria-label="Agrandir la photo : ' + escapeHtml(item.title) + '"><img src="' + item.image + '" alt="" width="1200" height="800" loading="lazy" decoding="async">' + (rank ? '<span class="advisor-result-rank">Recommandée par Diskoov</span>' : '') + '</button>';
    }
    return '<div class="' + className + ' advisor-result-media--fallback" aria-hidden="true">' + fallback + (rank ? '<span class="advisor-result-rank">Recommandée par Diskoov</span>' : '') + '</div>';
  }

  function primaryResultTemplate(item) {
    var benefits = commercialBenefits(item);
    if (item.certainty === 'dimension_fit') benefits = benefits.concat(['Dimensions dans la plage connue']);
    var tradeoff = productTradeoff(item);
    var match = priorityFit(item);
    var status = resultStatusLabel(item, 0);
    return '<article class="advisor-primary-result advisor-family--' + safeClass(item.family) + '">'
      + productMedia(item, 'advisor-primary-media', !state.showAll)
      + '<div class="advisor-primary-body"><div class="advisor-result-category">' + productCategoryTemplate(item) + '<span class="advisor-result-match advisor-result-match--' + safeClass(status.key) + '">' + escapeHtml(status.label) + '</span></div>'
      + '<h2>' + escapeHtml(item.title) + '</h2><p class="advisor-primary-lead">' + escapeHtml(productBestFor(item)) + '</p>'
      + benefitsTemplate(item, benefits, '')
      + '<dl class="advisor-primary-facts"><div><dt>Pourquoi elle vous convient</dt><dd>' + escapeHtml(match) + '</dd></div><div><dt>À valider avant devis</dt><dd>' + escapeHtml(tradeoff) + '</dd></div></dl>'
      + '<div class="advisor-primary-actions"><div><strong>' + escapeHtml(item.estimate) + '</strong><span>Étude de pose avant devis</span></div><div class="advisor-result-buttons"><button type="button" class="advisor-info-button" data-action="details" data-product="' + item.id + '">Voir les détails</button><button type="button" class="advisor-button" data-action="choose" data-product="' + item.id + '">Préparer mon étude <span aria-hidden="true">→</span></button></div></div>'
      + '<p class="advisor-primary-next"><strong>Vous n’avez rien à choisir définitivement :</strong> précisez la pose, les accès et, si vous en avez une, joignez une photo du bassin. Elle aide Diskoov à vérifier les abords.</p></div>'
      + '</article>';
  }

  function alternativeResultTemplate(item) {
    var status = resultStatusLabel(item, 1);
    return '<article class="advisor-alternative advisor-family--' + safeClass(item.family) + '">'
      + productMedia(item, 'advisor-alternative-media', false)
      + '<div class="advisor-alternative-copy"><div class="advisor-result-category">' + productCategoryTemplate(item) + '<span class="advisor-result-match advisor-result-match--' + safeClass(status.key) + '">' + escapeHtml(status.label) + '</span></div><h3>' + escapeHtml(item.title) + '</h3><p class="advisor-alternative-fit">' + escapeHtml(productBestFor(item)) + '</p><p class="advisor-alternative-check"><strong>À savoir</strong>' + escapeHtml(productTradeoff(item)) + '</p></div>'
      + '<div class="advisor-alternative-actions"><span>' + escapeHtml(item.estimate) + '</span><div><button type="button" class="advisor-info-button" data-action="details" data-product="' + item.id + '">Détails</button><button type="button" class="advisor-button" data-action="choose" data-product="' + item.id + '">Vérifier ce modèle <span aria-hidden="true">→</span></button></div></div>'
      + '</article>';
  }

  function productCategoryTemplate(item) {
    return '<span class="advisor-category-label">' + icon(familyIconName(item)) + '<span>' + escapeHtml(displayProductCategory(item)) + '</span></span>';
  }

  function displayProductCategory(item) {
    if (item && item.family === 'coverseal') return 'Couverture tendue';
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
      auto: ['automatic', 'aesthetics', 'measure'], semi: ['shield', 'economy', 'measure'],
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
    if (index === 0 && !state.showAll && item.certainty !== 'custom') return { key: 'recommended', label: 'Recommandée pour vous' };
    if (item.certainty === 'custom') return { key: 'custom', label: 'Étude sur mesure' };
    if (item.certainty === 'to_confirm') return { key: 'to-confirm', label: 'À confirmer avec vous' };
    if (item.certainty === 'dimension_fit') return { key: 'dimension-fit', label: 'Dimensions cohérentes' };
    return { key: 'to-confirm', label: 'À vérifier' };
  }

  function commercialBenefits(item) {
    var map = {
      ore_compact: ['Couverture motorisée', 'Pensée pour les bassins compacts'],
      ore_essential: ['Protection 4 saisons', 'Confort motorisé'],
      auto: ['Ouverture automatique', 'Rails extra-plats'],
      semi: ['Couverture tendue', 'Budget plus maîtrisé'],
      eden: ['Sur mesure', 'Ouverture motorisée'],
      bab: ['Sécurité essentielle', 'Garantie 3 ans'],
      volet_hs: ['Automatique', 'Sans intégration dans le bassin'],
      volet_immerge: ['Très discret', 'Mécanisme intégré'],
      masterdeck: ['Terrasse + plage + protection', 'Projet sur mesure']
    };
    if (item.family === 'shelter') return ['Saison prolongée', 'Abri télescopique'];
    return map[item.id] || [];
  }

  function priorityFit(item) {
    var selected = state.priorities.filter(function (priority) { return priority !== 'unsure'; });
    if (!selected.length) return 'Une sélection équilibrée pour découvrir les solutions Diskoov sans préférence arrêtée.';
    var hits = selected.filter(function (priority) { return item.strengths.indexOf(priority) !== -1; });
    var labels = {
      clean: 'gagner du temps au quotidien', safety: 'sécuriser le bassin', season: 'prolonger la saison de baignade',
      aesthetics: 'préserver l’esthétique du jardin', automatic: 'tout automatiser', space: 'récupérer l’espace au-dessus du bassin', economy: 'maîtriser le budget'
    };
    var hitLabels = hits.map(function (priority) { return labels[priority]; });
    if (hits.length === selected.length) return 'Elle répond directement à ce qui compte pour vous : ' + frenchList(hitLabels) + '.';
    if (hits.length) return 'Elle répond surtout à votre attente : ' + frenchList(hitLabels) + '. L’autre priorité mérite comparaison.';
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
      auto: 'Elle privilégie le confort et la finition ; son budget est supérieur à une protection plus simple.',
      semi: 'Une partie de la manipulation reste à votre charge : vérifions si ce compromis vous convient.',
      eden: 'C’est un projet sur mesure : une étude est nécessaire avant toute estimation fiable.',
      bab: 'La manipulation est plus manuelle au quotidien, même si la protection reste simple et robuste.',
      volet_hs: 'Le coffre reste visible côté bassin, mais l’installation est plus simple qu’un volet immergé.',
      volet_immerge: 'Il demande davantage d’intégration au bassin, à anticiper selon votre projet.',
      masterdeck: 'C’est un projet plus spécifique : les dimensions, abords et finitions sont étudiés avant chiffrage.'
    };
    if (item.family === 'shelter') return 'L’abri apporte davantage de confort et de saison de baignade, avec une présence visuelle supérieure à une couverture.';
    return map[item.id] || 'Les points de pose et d’accès seront vérifiés avant proposition.';
  }

  function productBestFor(item) {
    var map = {
      ore_compact: 'Vous avez un bassin compact et vous cherchez une couverture motorisée simple à vivre.',
      ore_essential: 'Vous voulez une protection 4 saisons plus polyvalente, avec un bon équilibre confort / discrétion.',
      auto: 'Vous recherchez un haut niveau de confort au quotidien et une couverture très intégrée.',
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
    detailContent.className = 'advisor-detail-card advisor-family--' + safeClass(item.family);
    detailContent.innerHTML = productDetailTemplate(item);
    detailModal.classList.add('is-open');
    detailModal.setAttribute('aria-hidden', 'false');
    detailModal.setAttribute('aria-label', 'Détails : ' + item.title);
    var close = detailContent.querySelector('[data-action="close-details"]');
    if (close) close.focus({ preventScroll: true });
    trackAdvisor('advisor_product_detail_open', { product: item.id });
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
    var reasons = Array.isArray(item.reasons) ? item.reasons.map(function (reason) { return publicReasonText(reason, item); }) : [];
    var media = item.image
      ? '<div class="advisor-detail-media advisor-product-media--' + safeClass(item.id) + '"><img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.title) + '" width="1200" height="800" decoding="async"></div>'
      : '<div class="advisor-detail-media advisor-detail-media--fallback" aria-hidden="true">' + icon(item.family === 'shelter' ? 'season' : item.family === 'mobile-deck' ? 'space' : 'shield') + '</div>';
    return '<button type="button" class="advisor-detail-close" data-action="close-details" aria-label="Fermer">×</button>'
      + media
      + '<div class="advisor-detail-body">'
      + '<div class="advisor-step-label">La solution en pratique</div>'
      + '<h2 class="advisor-detail-title">' + escapeHtml(item.title) + '</h2>'
      + '<p class="advisor-detail-lead">' + escapeHtml(productSalesIntro(item)) + '</p>'
      + benefitsTemplate(item, benefits, 'advisor-detail-benefits')
      + '<div class="advisor-detail-section"><strong>À choisir si</strong><p>' + escapeHtml(productBestFor(item)) + '</p></div>'
      + '<ul class="advisor-detail-list">' + bullets.map(function (bullet) { return '<li>' + escapeHtml(bullet) + '</li>'; }).join('') + '</ul>'
      + '<div class="advisor-detail-section advisor-detail-section--notice"><strong>À vérifier ensemble</strong><p>' + escapeHtml(productTradeoff(item)) + '</p></div>'
      + (reasons.length ? '<div class="advisor-detail-fit"><strong>Adapté à votre projet</strong><span>' + reasons.map(escapeHtml).join('</span><span>') + '</span></div>' : '')
      + '<div class="advisor-detail-footer"><span>' + escapeHtml(item.estimate || 'Étude personnalisée') + '</span><button type="button" class="advisor-button" data-action="choose" data-product="' + item.id + '">Préparer mon étude <span aria-hidden="true">→</span></button></div>'
      + '</div>';
  }

  function productSalesIntro(item) {
    var map = {
      ore_compact: 'Une couverture motorisée Oré pensée pour les bassins compacts. Si vous choisissez la fourniture avec pose, l’installation Diskoov est incluse dans l’estimation.',
      ore_essential: 'Une couverture Oré plus large, conçue pour protéger le bassin toute l’année avec un guidage motorisé discret.',
      auto: 'La Coverseal automatique privilégie le confort : une couverture tendue, motorisée, discrète et posée par les techniciens du fabricant.',
      semi: 'La Coverseal semi-automatique garde l’esprit Coverseal avec une solution plus accessible et une commande simplifiée.',
      eden: 'Eden est une couverture motorisée sur mesure, intéressante quand le projet demande une finition et une intégration particulièrement soignées.',
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
      semi: ['Même logique de couverture tendue Coverseal.', 'Norme sécurité NF P90-308 selon la page Diskoov.', 'Alternative à la version automatique pour mieux maîtriser le budget.'],
      eden: ['Norme sécurité NF P90-308.', 'Ouverture et fermeture motorisées sans effort.', 'Limite l’évaporation, les pertes de chaleur et l’entretien.'],
      bab: ['Adaptée aux bassins jusqu’à 12 × 5 m.', 'Surface prévue avec débord autour du bassin.', 'Garantie 3 ans.'],
      volet_hs: ['Adapté aux bassins jusqu’à 12 × 6 m.', 'Lames dimensionnées pour respecter la sécurité.', 'Les conditions de livraison et de pose dépendent du département.'],
      volet_immerge: ['Adapté aux bassins jusqu’à 14 × 6 m.', 'Une intégration avec flasques sur paroi est possible selon le bassin.', 'Fond de bassin, caillebotis ou mur étudiés sur mesure.'],
      masterdeck: ['Solution 3 en 1 : terrasse, plage et protection.', 'Disponible en 1 ou 2 plateaux selon dimensions.', 'Options possibles : motorisation solaire et finitions bois.']
    };
    if (item.family === 'shelter') return ['Prolonge la saison de baignade.', 'Protège le bassin des feuilles et salissures.', 'Plusieurs hauteurs selon le niveau de confort voulu.'];
    return map[item.id] || ['Dimensions et forme prises en compte.', 'Estimation affinée avec les détails de pose.', 'Accompagnement humain avant proposition finale.'];
  }

  function publicReasonText(reason, item) {
    if (item && item.id === 'eden' && reason === item.description) return 'Projet sur mesure pour un bassin ou une implantation atypique.';
    return reason;
  }

  function compareTemplate(products) {
    var criteria = [
      ['user', 'Usage principal', comparisonUse],
      ['automatic', 'Manipulation', comparisonOperation],
      ['aesthetics', 'Présence visuelle', comparisonPresence],
      ['season', 'Effet sur la saison', comparisonSeason],
      ['install', 'À confirmer', comparisonCheck],
      ['check', 'Étude Diskoov', function (p) { return p.estimate; }]
    ];
    var mobileCards = '<div class="advisor-compare-mobile">'
      + products.map(function (p) {
        return '<article class="advisor-compare-card"><h3>' + escapeHtml(p.title) + '</h3>'
          + criteria.map(function (row) { return '<p><strong>' + icon(row[0]) + '<span>' + escapeHtml(row[1]) + '</span></strong><span>' + escapeHtml(row[2](p)) + '</span></p>'; }).join('')
          + '</article>';
      }).join('')
      + '</div>';
    return '<section class="advisor-compare" aria-label="Comparatif des solutions"><h2 class="advisor-compare-title">Comparer ce qui change vraiment</h2><table aria-label="Comparaison des solutions recommandées"><thead><tr><th>Critère</th>'
      + products.map(function (p) { return '<th>' + escapeHtml(p.title) + '</th>'; }).join('') + '</tr></thead><tbody>'
      + criteria.map(function (row) { return '<tr><td><span class="advisor-compare-criterion">' + icon(row[0]) + '<span>' + escapeHtml(row[1]) + '</span></span></td>' + products.map(function (p) { return '<td>' + escapeHtml(row[2](p)) + '</td>'; }).join('') + '</tr>'; }).join('')
      + '</tbody></table>' + mobileCards + '</section>';
  }

  function comparisonUse(item) {
    var map = {
      ore_compact: 'Motoriser un bassin compact', ore_essential: 'Protéger le bassin toute l’année',
      auto: 'Maximiser le confort quotidien', semi: 'Conserver le principe Coverseal avec une commande simplifiée',
      eden: 'Répondre à un projet atypique', bab: 'Sécuriser avec une solution simple',
      volet_hs: 'Automatiser sans intégrer le mécanisme au bassin', volet_immerge: 'Automatiser avec un mécanisme intégré',
      masterdeck: 'Récupérer la surface au-dessus du bassin'
    };
    if (item.family === 'shelter') return 'Prolonger les baignades et protéger le bassin';
    return map[item.id] || publicReasonText(item.description || 'Protection du bassin', item);
  }

  function comparisonOperation(item) {
    var map = {
      ore_compact: 'Motorisée', ore_essential: 'Motorisée', auto: 'Automatique', semi: 'Semi-automatique',
      eden: 'Motorisée', bab: 'Manuelle', volet_hs: 'Automatique', volet_immerge: 'Automatique',
      masterdeck: 'Définie pendant l’étude'
    };
    if (item.family === 'shelter') return 'Modules télescopiques';
    return map[item.id] || 'À confirmer';
  }

  function comparisonPresence(item) {
    var map = {
      ore_compact: 'Protection basse', ore_essential: 'Protection basse', auto: 'Protection basse',
      semi: 'Protection basse', eden: 'Finition adaptée au projet', bab: 'Visible une fois fermée',
      volet_hs: 'Coffre visible', volet_immerge: 'Mécanisme intégré', masterdeck: 'Terrasse au-dessus du bassin',
      ul: 'Ultra-bas', m18: 'Bas', m30: 'Bas, avec plus de volume', m50: 'Mi-haut', mid: 'Mi-haut'
    };
    return map[item.id] || 'À confirmer';
  }

  function comparisonSeason(item) {
    if (item.family === 'shelter') return 'Baignade prolongée';
    if (item.id === 'ore_essential') return 'Protection 4 saisons';
    return 'Protection du bassin';
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
        id: 'covers', icon: 'cover', title: 'Couvertures motorisées', eyebrow: 'Protection discrète', products: ['ore_compact', 'ore_essential', 'auto', 'semi', 'eden'], image: 'ore_essential',
        text: 'Une protection basse qui simplifie l’ouverture du bassin au quotidien.', bestFor: 'Vous voulez protéger la piscine sans transformer visuellement ses abords.', check: 'La place, le support et l’alimentation sont vérifiés avant de vous la proposer.',
        proofs: [['Au quotidien', 'Ouverture simplifiée selon le modèle'], ['Autour du bassin', 'Une protection basse et discrète'], ['À prévoir', 'Support, dégagement et alimentation']]
      },
      {
        id: 'bar-cover', icon: 'bars', title: 'Couverture à barres', eyebrow: 'Protection essentielle', products: ['bab'], image: 'bab',
        text: 'Une solution simple et robuste pour sécuriser le bassin avec un budget plus cadré.', bestFor: 'Vous privilégiez l’essentiel : une protection fiable, sans suréquipement.', check: 'Les ancrages, l’escalier et le bloc de filtration sont confirmés avec vous.',
        proofs: [['Au quotidien', 'Une manipulation plus manuelle'], ['Autour du bassin', 'Une protection visible une fois fermée'], ['À prévoir', 'Ancrages, escalier et bloc de filtration']]
      },
      {
        id: 'shutters', icon: 'shutter', title: 'Volets de piscine', eyebrow: 'Confort automatisé', products: ['volet_hs', 'volet_immerge'], image: 'volet_hs',
        text: 'Le confort d’une ouverture automatique, hors-sol ou intégrée au bassin.', bestFor: 'Vous voulez ouvrir et fermer le bassin simplement, avec une finition adaptée au projet.', check: 'L’électricité, l’escalier et l’implantation sont vérifiés avant étude.',
        proofs: [['Au quotidien', 'Ouverture automatisée selon la configuration'], ['Deux approches', 'Coffre visible ou mécanisme intégré'], ['À prévoir', 'Électricité, escalier et implantation']]
      },
      {
        id: 'shelters', icon: 'shelter', title: 'Abris télescopiques', eyebrow: 'Baignade prolongée', products: ['ul', 'm18', 'm30', 'm50', 'mid'], image: 'm18',
        text: 'Une protection qui prolonge les baignades et garde l’eau plus propre.', bestFor: 'Vous voulez mieux profiter de la piscine au fil de la saison.', check: 'L’espace de refoulement, les accès et la terrasse sont étudiés avec vous.',
        proofs: [['Au quotidien', 'Le bassin reste protégé sous une structure télescopique'], ['Choix déterminant', 'La hauteur change le confort et la présence visuelle'], ['À prévoir', 'Refoulement, accès et terrasse']]
      },
      {
        id: 'deck', icon: 'deck', title: 'Terrasse mobile', eyebrow: 'Espace récupéré', products: ['masterdeck'], image: 'masterdeck',
        text: 'Le bassin fermé devient une vraie surface utile pour vos abords.', bestFor: 'Vous voulez une terrasse lorsque la piscine n’est pas utilisée.', check: 'Les dimensions, abords et finitions sont étudiés sur mesure avec Diskoov.',
        proofs: [['Au quotidien', 'Le bassin fermé devient une surface utilisable'], ['Dans le jardin', 'La finition s’intègre aux abords'], ['À prévoir', 'Un projet étudié entièrement sur mesure']]
      }
    ];
  }

  function directFamiliesTemplate(families) {
    return '<div class="advisor-screen">'
      + '<div class="advisor-step-label">Explorer les solutions</div>'
      + '<h1 class="advisor-title">Quel usage voulez-vous privilégier ?</h1>'
      + '<p class="advisor-subtitle">Choisissez votre priorité. Vous verrez ensuite les modèles, leurs avantages et les points à vérifier pour votre bassin.</p>'
      + '<div class="advisor-family-list">'
      + families.map(function (family) {
        var item = engine.findCandidate(family.image);
        var actionLabel = family.products.length > 1 ? 'Comparer les modèles' : 'Découvrir la solution';
        var media = item && item.image
          ? '<div class="advisor-family-media advisor-product-media--' + safeClass(item.id) + '"><img src="' + escapeHtml(item.image) + '" alt="" width="1200" height="800" loading="lazy" decoding="async"></div>'
          : '<div class="advisor-family-media advisor-direct-media--fallback" aria-hidden="true">' + icon('shield') + '</div>';
        return '<article class="advisor-family-item advisor-family-item--' + safeClass(family.id) + '">' + media
          + '<div class="advisor-family-copy"><span class="advisor-direct-category">' + icon(family.icon) + '<span>' + escapeHtml(family.eyebrow) + '</span></span><h2>' + escapeHtml(family.title) + '</h2><p>' + escapeHtml(family.text) + '</p><span class="advisor-family-fit"><strong>À privilégier si</strong>' + escapeHtml(family.bestFor) + '</span><span class="advisor-family-check"><strong>À confirmer</strong>' + escapeHtml(family.check) + '</span></div>'
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
    var heightScale = family.id === 'shelters'
      ? '<div class="advisor-height-scale" aria-label="Hauteurs d’abri à comparer"><span class="is-low">Ultra-bas</span><span class="is-medium">Bas</span><span class="is-high">Mi-haut</span></div>'
      : '';
    return '<section class="advisor-family-story advisor-family-story--' + safeClass(family.id) + '" aria-label="Ce qui caractérise cette famille">'
      + '<div class="advisor-family-story-lead"><span>' + icon(family.icon) + '</span><div><strong>Ce qui change avec cette solution</strong><p>' + escapeHtml(family.bestFor) + '</p></div></div>'
      + '<div class="advisor-family-story-facts">' + family.proofs.map(function (proof) {
        return '<div><strong>' + escapeHtml(proof[0]) + '</strong><span>' + escapeHtml(proof[1]) + '</span></div>';
      }).join('') + '</div>'
      + heightScale
      + '</section>';
  }

  function directProductItem(id) {
    var item = engine.findCandidate(id);
    if (!item) return '';
    var directBenefits = commercialBenefits(item).slice(0, 2);
    var media = item.image
      ? '<span class="advisor-direct-media advisor-product-media--' + safeClass(item.id) + '"><img src="' + escapeHtml(item.image) + '" alt="" width="1200" height="800" loading="lazy" decoding="async"></span>'
      : '<span class="advisor-direct-media advisor-direct-media--fallback" aria-hidden="true">' + icon(item.family === 'shelter' ? 'season' : item.family === 'mobile-deck' ? 'space' : 'shield') + '</span>';
    return '<article class="advisor-direct-item advisor-family--' + safeClass(item.family) + '">' + media
      + '<div class="advisor-direct-copy">' + productCategoryTemplate(item) + '<span class="advisor-direct-name">' + escapeHtml(item.title) + '</span><span class="advisor-direct-desc">' + escapeHtml(productBestFor(item)) + '</span>' + benefitsTemplate(item, directBenefits, 'advisor-direct-benefits') + '</div>'
      + '<div class="advisor-direct-buttons"><button type="button" class="advisor-info-button advisor-info-button--inline" data-action="details" data-product="' + id + '">Voir les détails</button><button type="button" class="advisor-direct-main" data-action="direct-product" data-product="' + id + '">Vérifier ce modèle <span aria-hidden="true">→</span></button></div></article>';
  }

  function footerTemplate() {
    if (state.screen === 'welcome') return '<div class="advisor-footer-note">Conseil sans engagement · Vos réponses restent sur cet appareil jusqu’à l’envoi du formulaire.</div>';
    if (state.screen === 'direct') return '<div class="advisor-footer-actions advisor-footer-actions--direct"><button type="button" class="advisor-button advisor-button--text" data-action="back">← Retour</button></div>';
    var nextDisabled = state.screen === 'priorities' && !state.priorities.length;
    var nextLabel = state.screen === 'project' ? 'Voir mes pistes' : 'Continuer';
    var showNext = ['priorities', 'pool', 'project'].indexOf(state.screen) !== -1;
    var backLabel = state.screen === 'results' ? 'Modifier' : 'Retour';
    var recommended = state.screen === 'results' && state.results && state.results.recommendations && state.results.recommendations[0];
    var footerNote = state.screen === 'results'
      ? 'Votre sélection n’est pas définitive : Diskoov valide la pose et les accès avec vous.'
      : 'Vos réponses orientent la sélection ; elles ne vous engagent à rien.';
    return '<div class="advisor-footer-note">' + footerNote + '</div><div class="advisor-footer-actions">'
      + '<button type="button" class="advisor-button advisor-button--text" data-action="back">← ' + backLabel + '</button>'
      + (recommended ? '<button type="button" class="advisor-button" data-action="choose" data-product="' + recommended.id + '">Préparer mon étude <span aria-hidden="true">→</span></button>' : '')
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
    if (screen === 'results') return 3;
    if (screen === 'project') return 2;
    return 0;
  }

  function updateVisualCopy() {
    var primary = state.results && state.results.recommendations && state.results.recommendations[0];
    var copies = {
      welcome: { kicker: 'Conseil personnalisé', title: 'Une solution pensée pour votre bassin.', text: 'Quelques réponses suffisent pour repérer les pistes les plus cohérentes avec votre projet.', meta: 'Besoin, bassin, puis sélection expliquée.', image: 'assets/produits/conseiller/ore-fermee.webp' },
      priorities: { kicker: 'Vos usages', title: 'Vos besoins guident le conseil.', text: 'Les réponses servent à classer les protections selon votre usage réel.', meta: 'Deux priorités suffisent pour commencer.', image: 'assets/produits/conseiller/volet-hors-sol.webp' },
      pool: { kicker: 'Votre bassin', title: 'Chaque piscine a ses contraintes.', text: 'La forme et les dimensions permettent d’écarter les modèles hors plage avant de parler de prix.', meta: 'Les détails de pose viennent ensuite.', image: 'assets/produits/conseiller/ore-ouverte.webp' },
      project: { kicker: 'Votre projet', title: 'Un conseil adapté à votre rythme.', text: 'Budget et délai orientent le classement sans fermer prématurément les possibilités.', meta: 'Vous restez libre d’être approximatif.', image: 'assets/produits/conseiller/abri-bas.webp' },
      results: { kicker: 'Votre sélection', title: primary ? primary.title : 'Une recommandation à comprendre avant de choisir.', text: primary ? productBestFor(primary) : 'Comparez les solutions, puis demandez une étude de celle qui vous convient le mieux.', meta: 'Pose, accès et options sont vérifiés avant devis.', image: primary && primary.image ? primary.image : 'assets/produits/conseiller/ore-fermee.webp' },
      direct: { kicker: 'Les solutions Diskoov', title: 'Comparez les grandes familles de protection.', text: 'Choisissez d’abord l’usage qui vous attire, puis approfondissez le modèle adapté à votre bassin.', meta: 'Chaque modèle garde ses vérifications techniques.', image: 'assets/produits/conseiller/masterdeck.webp' }
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
      summary.setAttribute('tabindex', '-1');
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
    var lengthLabel = shell.querySelector('[data-pool-length]');
    var widthLabel = shell.querySelector('[data-pool-width]');
    var shape = shell.querySelector('[data-pool-shape]');
    if (lengthLabel) lengthLabel.textContent = numberLabel(state.length) + ' m';
    if (widthLabel) widthLabel.textContent = numberLabel(state.width) + ' m';
    if (shape) shape.style.aspectRatio = poolPreviewRatio() + ' / 1';
  }

  function surfaceText() {
    if (!dimensionsValid()) return 'Surface indicative : dimensions à compléter';
    return 'Surface indicative : ' + numberLabel(state.length * state.width) + ' m²';
  }

  function dimensionsValid() {
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
    if (dimensionsValid()) return 'Longueur de 3 à 20 m · largeur de 2 à 12 m.';
    if (state.length === null || state.width === null) return 'Renseignez les deux dimensions pour continuer.';
    return 'Vérifiez les mesures : longueur de 3 à 20 m et largeur de 2 à 12 m.';
  }

  function updateDimensionFeedback() {
    var feedback = body.querySelector('[data-dimension-feedback]');
    var lengthInput = body.querySelector('[data-field="length"]');
    var widthInput = body.querySelector('[data-field="width"]');
    var lengthValid = isDimensionValueValid(state.length, 3, 20);
    var widthValid = isDimensionValueValid(state.width, 2, 12);
    if (lengthInput) lengthInput.setAttribute('aria-invalid', String(!lengthValid));
    if (widthInput) widthInput.setAttribute('aria-invalid', String(!widthValid));
    if (!feedback) return;
    feedback.textContent = dimensionFeedbackText();
    feedback.classList.toggle('is-error', !lengthValid || !widthValid);
  }

  function showDimensionError() {
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
      check: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.3 2.3 4.8-5"/>',
      measure: '<path d="m5 17 12-12 2 2L7 19l-2-2Z"/><path d="m10 12 2 2M13 9l2 2M7 15l2 2"/>',
      pool: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M6 10c1.3-1 2.7-1 4 0s2.7 1 4 0 2.7-1 4 0M6 14c1.3-1 2.7-1 4 0s2.7 1 4 0 2.7-1 4 0"/>',
      install: '<path d="M14.5 6.5a4 4 0 0 0-5 5L4 17l3 3 5.5-5.5a4 4 0 0 0 5-5l-2.5 2.5-3-3 2.5-2.5Z"/>',
      mechanism: '<circle cx="8" cy="12" r="4"/><circle cx="8" cy="12" r="1"/><path d="M12 12h8M17 9v6"/>',
      cover: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M4 10h16M8 6v12M16 6v12"/>',
      bars: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M4 8h16M4 12h16M4 16h16"/>',
      shutter: '<rect x="3" y="6" width="18" height="13" rx="2"/><circle cx="17" cy="10" r="2.5"/><path d="M4 14h16M7 14v4M11 14v4M15 14v4"/>',
      shelter: '<path d="M3 18h18M5 18v-5a7 7 0 0 1 14 0v5M9 18v-6a3 3 0 0 1 6 0v6"/>',
      deck: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M8 5v14M13 5v14M18 5v14M3 10h18M3 15h18"/>',
      unsure: '<circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 0 1 4.6 1c0 1.7-2.4 2-2.4 3.5M12 17h.01"/>'
    };
    return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || paths.unsure) + '</svg>';
  }
}());
