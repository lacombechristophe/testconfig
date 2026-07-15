(function () {
  'use strict';

  var root = document.getElementById('app');
  var body = document.getElementById('pbdy');
  var back = document.getElementById('config-back');
  var next = document.getElementById('config-next');
  var feedback = document.getElementById('config-step-feedback');
  if (!root || !body || !back || !next) return;

  var stages = ['basin', 'installation', 'options', 'contact'];
  var stageSections = {
    basin: ['s-shape', 's-dim', 's-libre', 's-stair', 'config-basin-note'],
    installation: ['s-pool-photo', 's-periph', 's-equipment', 's-cm', 's-sm', 's-oth', 's-product-detail'],
    options: ['s-mem', 's-hab', 's-co', 's-so', 's-tl', 's-product-detail'],
    contact: ['s-frm']
  };
  var stageTitles = {
    basin: 'Votre bassin',
    installation: 'Installation',
    options: 'Options',
    contact: 'Vos coordonnées'
  };
  var stageCopy = {
    basin: 'Estimation après vérification du projet.',
    installation: 'Les contraintes de pose sont vérifiées avant devis.',
    options: 'Choisissez seulement les options utiles à votre projet.',
    contact: 'Vos coordonnées servent uniquement à reprendre votre projet avec vous.'
  };
  var currentStage = 'basin';
  var maxReached = 0;

  function selectedProduct() {
    if (typeof window.getDiskoovConfiguratorSelection === 'function') {
      var selection = window.getDiskoovConfiguratorSelection();
      if (selection && selection.product) return selection.product;
    }
    if (typeof S !== 'undefined') return S.cm || S.sm || S.otherProduct || '';
    return '';
  }

  function assignSectionStages() {
    Object.keys(stageSections).forEach(function (stage) {
      stageSections[stage].forEach(function (id) {
        var section = document.getElementById(id);
        if (!section) return;
        var existing = section.getAttribute('data-config-stages');
        var values = existing ? existing.split(' ') : [];
        if (values.indexOf(stage) === -1) values.push(stage);
        section.setAttribute('data-config-stages', values.join(' '));
      });
    });
  }

  function sectionBelongsToStage(section, stage) {
    return (section.getAttribute('data-config-stages') || '').split(' ').indexOf(stage) !== -1;
  }

  function updateSections(stage) {
    body.querySelectorAll('[data-config-stages]').forEach(function (section) {
      section.classList.toggle('config-stage-hidden', !sectionBelongsToStage(section, stage));
    });
  }

  function updateStepper(stage) {
    var activeIndex = stages.indexOf(stage);
    document.querySelectorAll('[data-config-target]').forEach(function (button) {
      var index = stages.indexOf(button.getAttribute('data-config-target'));
      var active = index === activeIndex;
      button.classList.toggle('is-active', active);
      button.classList.toggle('is-complete', index < activeIndex);
      button.disabled = index > maxReached;
      if (active) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
  }

  function updateStageActions(stage) {
    var index = stages.indexOf(stage);
    var summaryButton = document.querySelector('#guided-summary [data-open-advisor]');
    var stageTitle = document.getElementById('config-stage-title');
    back.hidden = index === 0 && !summaryButton;
    back.textContent = index === 0 ? '← Retour aux solutions' : '← Retour';
    var nextMarkup = index === 2 ? 'Renseigner mes coordonnées <span aria-hidden="true">→</span>' : 'Continuer <span aria-hidden="true">→</span>';
    if (next.innerHTML !== nextMarkup) next.innerHTML = nextMarkup;
    if (feedback) feedback.textContent = stageCopy[stage];
    if (stageTitle && stageTitle.textContent !== stageTitles[stage]) stageTitle.textContent = stageTitles[stage];
  }

  function setStage(stage, options) {
    options = options || {};
    var index = stages.indexOf(stage);
    if (index === -1) return;
    if (options.reset) maxReached = index;
    if (!options.force && index > maxReached) return;
    currentStage = stage;
    maxReached = Math.max(maxReached, index);
    root.setAttribute('data-config-step', stage);
    assignSectionStages();
    updateSections(stage);
    updateStepper(stage);
    updateStageActions(stage);
    updateProductPresentation();
    if (!options.preserveScroll) body.scrollTo({ top: 0, behavior: 'auto' });
    if (stage === 'contact' && typeof window.chk === 'function') window.chk();
    if (options.focus !== false) {
      window.requestAnimationFrame(function () {
        var target = document.getElementById('config-stage-title');
        if (target) {
          target.focus({ preventScroll: true });
        }
      });
    }
  }

  function showStageFeedback(message, target) {
    if (feedback) {
      feedback.textContent = message;
      feedback.setAttribute('role', 'alert');
    }
    if (target) {
      target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
      window.setTimeout(function () { target.focus(); }, prefersReducedMotion() ? 0 : 180);
    }
  }

  function canLeaveStage(stage) {
    if (typeof S === 'undefined') return true;
    if (stage === 'basin') {
      if (!S.shapeConfirmed) {
        showStageFeedback('Choisissez la forme de votre bassin pour continuer.', document.getElementById('sh-rect'));
        return false;
      }
      if (S.shape !== 'libre' && !(S.len >= 3 && S.len <= 20 && S.wid >= 2 && S.wid <= 12)) {
        showStageFeedback('Indiquez une longueur et une largeur valides, même approximatives.', document.getElementById('d-l'));
        return false;
      }
    }
    if (stage === 'installation') {
      if (!S.eq) {
        showStageFeedback('Choisissez d’abord une famille de protection.', document.getElementById('eq-cov'));
        return false;
      }
      if (!selectedProduct()) {
        var target = S.eq === 'shl' ? document.getElementById('h-ul') : S.eq === 'oth' ? document.getElementById('op-bab') : document.getElementById('b-ore-compact') || document.getElementById('b-auto');
        showStageFeedback('Choisissez le modèle à vérifier pour votre bassin.', target);
        return false;
      }
    }
    if (feedback) feedback.removeAttribute('role');
    return true;
  }

  function goNext() {
    var index = stages.indexOf(currentStage);
    if (index >= stages.length - 1 || !canLeaveStage(currentStage)) return;
    setStage(stages[index + 1], { force: true });
  }

  function goBack() {
    var index = stages.indexOf(currentStage);
    if (index > 0) {
      setStage(stages[index - 1], { force: true });
      return;
    }
    var summaryButton = document.querySelector('#guided-summary [data-open-advisor]');
    if (summaryButton) summaryButton.click();
  }

  function stageForElement(element) {
    if (!element) return '';
    var section = element.closest('[data-config-stages]');
    if (!section) return '';
    var values = (section.getAttribute('data-config-stages') || '').split(' ');
    if (values.indexOf('contact') !== -1) return 'contact';
    if (values.indexOf('options') !== -1 && section.id !== 's-product-detail') return 'options';
    if (values.indexOf('installation') !== -1) return 'installation';
    return values[0] || '';
  }

  function productPresentation(product) {
    var map = {
      ore_compact: ['Couvertures de piscine', 'Oré Compact', 'Couverture tendue motorisée pour bassin compact.'],
      ore_essential: ['Couvertures de piscine', 'Oré Essential', 'Couverture tendue motorisée pour protéger le bassin toute l’année.'],
      auto: ['Couvertures de piscine', 'Coverseal Automatique', 'Couverture motorisée étudiée selon votre bassin.'],
      semi: ['Couvertures de piscine', 'Coverseal Semi-Automatique', 'Couverture assistée étudiée selon votre bassin.'],
      eden: ['Couvertures de piscine', 'Couverture Eden', 'Projet défini au cas par cas avant toute proposition.'],
      bab: ['Couvertures de piscine', 'Bâche à barres Secu Classic', 'Couverture de sécurité à manipulation manuelle.'],
      volet_hs: ['Volets de piscine', 'Volet hors-sol', 'Ouverture motorisée avec axe et supports visibles.'],
      volet_immerge: ['Volets de piscine', 'Volet immergé', 'Mécanisme intégré au bassin pour une présence plus discrète.'],
      ul: ['Abris télescopiques', 'Master Ultra Bas 1.2', 'Abri télescopique très bas.'],
      m18: ['Abris télescopiques', 'Master 18', 'Abri bas qui équilibre discrétion et protection.'],
      m30: ['Abris télescopiques', 'Master 30', 'Abri bas offrant davantage de volume.'],
      m50: ['Abris télescopiques', 'Master Bas 5.0', 'La version la plus haute de la gamme basse.'],
      mid: ['Abris télescopiques', 'Abri Mi-haut', 'Davantage de volume sous la structure.'],
      masterdeck: ['Terrasses mobiles', 'MasterDeck', 'Plancher mobile dimensionné sur mesure.']
    };
    return map[product] || ['Votre protection', 'Votre projet piscine', 'Décrivez votre bassin pour vérifier la solution choisie.'];
  }

  function updateCompactControls(product) {
    var compact = product === 'ore_compact';
    var oval = document.getElementById('sh-oval');
    var free = document.getElementById('sh-libre');
    [oval, free].forEach(function (button) {
      if (!button) return;
      button.disabled = compact;
      if (compact) button.setAttribute('title', 'Cette forme demande une autre solution ou une étude sur mesure.');
      else button.removeAttribute('title');
    });

    var values = compact ? [[5, 2.5], [6, 3], [7, 3.5]] : [[8, 4], [10, 5], [12, 6]];
    document.querySelectorAll('.dim-pre').forEach(function (button, index) {
      var value = values[index];
      if (!value) return;
      var label = String(value[0]).replace('.', ',') + ' × ' + String(value[1]).replace('.', ',') + ' m';
      var ariaLabel = value[0] + ' mètres par ' + value[1] + ' mètres';
      if (button.textContent !== label) button.textContent = label;
      if (button.getAttribute('aria-label') !== ariaLabel) button.setAttribute('aria-label', ariaLabel);
      button.onclick = function () {
        if (typeof window.setPreset === 'function') window.setPreset(value[0], value[1], button);
      };
    });
  }

  function updateProductPresentation() {
    var product = selectedProduct();
    var copy = productPresentation(product);
    var kicker = document.getElementById('config-visual-kicker');
    var title = document.getElementById('config-visual-title');
    var subtitle = document.getElementById('config-visual-subtitle');
    if (kicker && kicker.textContent !== copy[0]) kicker.textContent = copy[0];
    if (title && title.textContent !== copy[1]) title.textContent = copy[1];
    if (subtitle && subtitle.textContent !== copy[2]) subtitle.textContent = copy[2];
    updateCompactControls(product);
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  back.addEventListener('click', goBack);
  next.addEventListener('click', goNext);
  document.querySelectorAll('[data-config-target]').forEach(function (button) {
    button.addEventListener('click', function () {
      var target = button.getAttribute('data-config-target');
      var targetIndex = stages.indexOf(target);
      var currentIndex = stages.indexOf(currentStage);
      if (targetIndex > currentIndex && !canLeaveStage(currentStage)) return;
      setStage(target, { force: targetIndex <= maxReached });
    });
  });

  body.addEventListener('click', function () {
    window.requestAnimationFrame(updateProductPresentation);
  });
  body.addEventListener('change', updateProductPresentation);

  var observer = new MutationObserver(function () {
    assignSectionStages();
    updateSections(currentStage);
    updateStageActions(currentStage);
    updateProductPresentation();
  });
  observer.observe(body, { childList: true, subtree: true });

  window.setConfiguratorStage = function (stage, options) {
    setStage(stage, Object.assign({ force: true }, options || {}));
  };
  window.configuratorStageForElement = stageForElement;
  window.refreshConfiguratorPresentation = updateProductPresentation;

  assignSectionStages();
  setStage('basin', { force: true, focus: false, preserveScroll: true, reset: true });
}());
