/**
 * Promotional popup modal.
 * - Opens the eligible popup (rendered server-side by promo_popup.liquid) after
 *   a short delay on first load.
 * - Dismissing it sets a session cookie keyed by the popup id, so it does not
 *   re-trigger in the same session (a different/new popup id can still show).
 * - Adds ESC-to-close and a focus trap on top of <ins-modal>.
 */
(function () {
  'use strict';

  var cfg = window.EcommercePromoPopup;
  if (!cfg || !cfg.id) return;

  var modal = document.getElementById('promo-popup');
  if (!modal) return;

  var COOKIE = 'ecom_promo_popup';
  var popupId = String(cfg.id);
  var delay = cfg.delay || 1500;
  var lastFocused = null;

  function getCookie(name) {
    var match = document.cookie.match('(?:^|; )' + name + '=([^;]*)');
    return match ? decodeURIComponent(match[1]) : null;
  }

  function setSessionCookie(name, value) {
    // No expires/max-age => session cookie (cleared when the browser closes)
    document.cookie = name + '=' + encodeURIComponent(value) + '; path=/; SameSite=Lax';
  }

  // Already dismissed this popup this session — never open.
  if (getCookie(COOKIE) === popupId) return;

  function focusables() {
    return modal.querySelectorAll(
      'a[href], button, ins-button, [tabindex]:not([tabindex="-1"]), .icon-close-1'
    );
  }

  function trapFocus(e) {
    var els = focusables();
    if (!els.length) return;
    var first = els[0];
    var last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function onKeydown(e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
      dismiss();
    } else if (e.key === 'Tab') {
      trapFocus(e);
    }
  }

  function teardown() {
    document.removeEventListener('keydown', onKeydown, true);
    setSessionCookie(COOKIE, popupId);
  }

  function dismiss() {
    if (typeof modal.close === 'function') modal.close();
    teardown();
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  function openPopup() {
    if (getCookie(COOKIE) === popupId) return;
    lastFocused = document.activeElement;
    if (typeof modal.open === 'function') modal.open();
    document.addEventListener('keydown', onKeydown, true);
    // Move focus into the dialog once it has rendered.
    setTimeout(function () {
      var els = focusables();
      if (els.length) els[0].focus();
    }, 50);
  }

  // ins-modal fires insClose on close via the ✕ icon or click-outside.
  modal.addEventListener('insClose', teardown);

  function schedule() {
    setTimeout(openPopup, delay);
  }

  if (document.readyState === 'complete') {
    schedule();
  } else {
    window.addEventListener('load', schedule);
  }
})();
