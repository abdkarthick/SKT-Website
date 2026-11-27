/* SKT hex cursor: a hexagon ring that trails the pointer, with an exact ember dot. */
(function () {
  'use strict';
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (!fine) return;
  var root = document.documentElement;
  var ring = document.createElement('div'); ring.id = 'hxc'; ring.setAttribute('aria-hidden', 'true');
  ring.innerHTML = '<svg viewBox="0 0 40 40"><polygon points="20,2 35.6,11 35.6,29 20,38 4.4,29 4.4,11"/></svg>';
  var dot = document.createElement('div'); dot.id = 'hxd'; dot.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ring); document.body.appendChild(dot);
  root.classList.add('hxc');
  var x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, shown = false;
  var HOT = 'a,button,[role="button"],input,select,textarea,summary,label,.bk-c,.cert,.pt2,.th,.ac,[data-zoom]';
  window.addEventListener('pointermove', function (e) {
    x = e.clientX; y = e.clientY;
    dot.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    if (!shown) { shown = true; rx = x; ry = y; ring.classList.add('on'); dot.classList.add('on'); }
    var t = e.target && e.target.closest ? e.target.closest(HOT) : null;
    ring.classList.toggle('act', !!t);
  }, { passive: true });
  window.addEventListener('pointerdown', function () { ring.classList.add('dn'); });
  window.addEventListener('pointerup', function () { ring.classList.remove('dn'); });
  document.addEventListener('mouseleave', function () { ring.classList.remove('on'); dot.classList.remove('on'); shown = false; });
  (function loop() {
    rx += (x - rx) * 0.2; ry += (y - ry) * 0.2;
    ring.style.transform = 'translate(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px)';
    requestAnimationFrame(loop);
  })();
})();
