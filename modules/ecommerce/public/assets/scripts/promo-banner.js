/**
 * Promotional banner strip.
 * - Rendered server-side by promo_banner.liquid above the main header.
 * - When more than one banner is eligible, rotates through the slides; each slide
 *   stays visible for its own data-interval (promo_interval_ms) before the next.
 * - The close control dismisses the strip for the session: a session cookie keyed
 *   by the configured banner set (data-banner-key) is set, so the strip does not
 *   re-appear this session, but a changed/new banner set will show again.
 * - An inline script in the partial already hid the strip pre-paint if dismissed.
 */
(function () {
  'use strict';

  var banner = document.getElementById('promo-banner');
  if (!banner) return;

  var COOKIE = 'ecom_promo_banner';
  var key = banner.getAttribute('data-banner-key') || '';
  var slides = banner.querySelectorAll('.promo-banner__slide');
  var rotateTimer = null;
  var current = 0;

  function getCookie(name) {
    var match = document.cookie.match('(?:^|; )' + name + '=([^;]*)');
    return match ? decodeURIComponent(match[1]) : null;
  }

  function setSessionCookie(name, value) {
    // No expires/max-age => session cookie (cleared when the browser closes)
    document.cookie = name + '=' + encodeURIComponent(value) + '; path=/; SameSite=Lax';
  }

  // Already dismissed this banner set this session — keep it hidden and do nothing.
  if (getCookie(COOKIE) === key) {
    banner.style.display = 'none';
    return;
  }

  function showSlide(index) {
    for (var i = 0; i < slides.length; i++) {
      var active = i === index;
      slides[i].classList.toggle('is-active', active);
      if (active) {
        slides[i].removeAttribute('aria-hidden');
      } else {
        slides[i].setAttribute('aria-hidden', 'true');
      }
    }
  }

  function scheduleNext() {
    if (slides.length < 2) return;
    var interval = parseInt(slides[current].getAttribute('data-interval'), 10);
    if (!interval || interval < 1000) interval = 5000;
    rotateTimer = window.setTimeout(function () {
      current = (current + 1) % slides.length;
      showSlide(current);
      scheduleNext();
    }, interval);
  }

  function dismiss() {
    if (rotateTimer) window.clearTimeout(rotateTimer);
    banner.style.display = 'none';
    setSessionCookie(COOKIE, key);
  }

  var closeBtn = banner.querySelector('.promo-banner__close');
  if (closeBtn) closeBtn.addEventListener('click', dismiss);

  // Pause rotation on hover so a reader is not interrupted mid-message.
  banner.addEventListener('mouseenter', function () {
    if (rotateTimer) window.clearTimeout(rotateTimer);
  });
  banner.addEventListener('mouseleave', function () {
    if (slides.length > 1) scheduleNext();
  });

  showSlide(0);
  scheduleNext();
})();
