/* "What we do": cards slide sideways as the page scrolls down (pinned section). Falls back to native swipe on small screens. */
(function () {
  'use strict';
  var sec = document.getElementById('wd'), tr = document.getElementById('wd-tr'), bar = document.getElementById('wd-bar');
  if (!sec || !tr) return;
  var row = tr.firstElementChild, mq = window.matchMedia('(max-width:860px),(prefers-reduced-motion:reduce)');
  var max = 0, ticking = false;
  function measure() {
    if (mq.matches) { sec.style.height = ''; tr.style.transform = ''; return; }
    max = Math.max(0, row.scrollWidth - tr.clientWidth + 60);
    sec.style.height = (window.innerHeight + max) + 'px';
    update();
  }
  function update() {
    ticking = false;
    if (mq.matches) return;
    var r = sec.getBoundingClientRect(), p = Math.min(1, Math.max(0, -r.top / Math.max(1, sec.offsetHeight - window.innerHeight)));
    tr.style.transform = 'translate3d(' + (-p * max).toFixed(1) + 'px,0,0)';
    if (bar) bar.style.transform = 'scaleX(' + p.toFixed(3) + ')';
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  if (mq.addEventListener) mq.addEventListener('change', measure);
  measure();
})();

/* Vision / mission / values cards: tap the header to fold or unfold */
(function () {
  [].forEach.call(document.querySelectorAll('.vm'), function (c) {
    var b = c.querySelector('.vm-h');
    b.addEventListener('click', function () { var o = c.getAttribute('data-open') === '1'; c.setAttribute('data-open', o ? '0' : '1'); b.setAttribute('aria-expanded', o ? 'false' : 'true'); });
  });
})();
