/* Sri Kamatchi Toolings - products hero: part photo ring (CSS 3D carousel)
   Drag to rotate, click a photo to enlarge. No WebGL needed, works on every browser. */
(function () {
  'use strict';
  var root = document.getElementById('rg3');
  if (!root) return;

  var sc = root.querySelector('.rg3-sc');
  var ring = root.querySelector('.rg3-ring');
  var cards = [].slice.call(ring.querySelectorAll('.rc'));
  var capName = root.querySelector('.rg3-cap b');
  var capSub = root.querySelector('.rg3-cap span');
  var lb = document.getElementById('lb');
  var lbImg = lb ? lb.querySelector('img') : null;
  var n = cards.length;
  if (!n) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var AUTO = 12;            /* degrees per second while idle */
  var step = 360 / n;
  var rot = 0, vel = 0, target = null;
  var down = false, moved = 0, lastX = 0, lastT = 0, downCard = null;
  var hover = false, idleUntil = 0, vis = true, raf = 0, last = 0, front = -1;

  function norm(a) { return ((a % 360) + 540) % 360 - 180; }

  /* place the cards on a circle and scale the whole ring to fit its box */
  function layout() {
    var cw = cards[0].offsetWidth, ch = cards[0].offsetHeight;
    var R = Math.round((cw / 2) / Math.tan(Math.PI / n) + 24);
    cards.forEach(function (c, i) {
      c.style.transform = 'rotateY(' + (i * step) + 'deg) translateZ(' + R + 'px)';
    });
    var w = root.clientWidth, h = root.clientHeight;
    var k = Math.min(1.2, w / (2 * R) * 0.84, h / (ch * 2.5));
    sc.style.transform = 'scale(' + k.toFixed(3) + ')';
    root.style.setProperty('--tr', (2 * R) + 'px');
    root.style.setProperty('--ty', Math.round(ch * 0.62) + 'px');
  }

  function render() {
    ring.style.transform = 'rotateY(' + rot.toFixed(2) + 'deg)';
    var best = 0, bf = -2;
    for (var i = 0; i < n; i++) {
      var f = Math.cos(norm(i * step + rot) * Math.PI / 180);
      cards[i].style.setProperty('--d', (f > 0 ? (1 - f) * 0.5 : 0.78).toFixed(3));
      cards[i].classList.toggle('fr', f > 0.94);
      if (f > bf) { bf = f; best = i; }
    }
    if (best !== front) {
      front = best;
      capName.textContent = cards[best].getAttribute('data-name');
      capSub.textContent = cards[best].getAttribute('data-cat');
    }
  }

  function frame(now) {
    raf = 0;
    if (!vis || document.hidden) return;
    var dt = Math.min(50, now - (last || now)) / 1000; last = now;
    if (!down) {
      if (target !== null) {
        rot += (target - rot) * Math.min(1, dt * 7);
        if (Math.abs(target - rot) < 0.08) { rot = target; target = null; }
        vel = 0;
      } else if (Math.abs(vel) > 6) {
        rot += vel * dt;
        vel *= Math.pow(0.9, dt * 60);
      } else {
        vel = 0;
        if (now > idleUntil) rot += AUTO * dt;
      }
    }
    render();
    raf = requestAnimationFrame(frame);
  }
  function start() { last = 0; if (!raf && vis && !document.hidden) raf = requestAnimationFrame(frame); }

  function open(c) {
    if (!lb || !lbImg) return;
    lbImg.src = c.getAttribute('data-src');
    lbImg.alt = c.getAttribute('data-name');
    lb.classList.add('on');
  }
  function bring(i) {
    /* rotate so card i faces the viewer, by the shortest way */
    var want = -i * step, d = norm(want - rot);
    target = rot + d;
  }
  function facing(c) {
    return Math.cos(norm(cards.indexOf(c) * step + rot) * Math.PI / 180);
  }

  /* drag */
  root.addEventListener('pointerdown', function (e) {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest && e.target.closest('.rg3-b')) return;
    down = true; moved = 0; vel = 0; target = null;
    lastX = e.clientX; lastT = performance.now();
    downCard = e.target.closest ? e.target.closest('.rc') : null;
    root.classList.add('drag');
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  });
  function mv(e) {
    if (!down) return;
    var now = performance.now(), dx = e.clientX - lastX, dtm = Math.max(1, now - lastT);
    moved += Math.abs(dx);
    var d = dx * 0.32;
    rot += d;
    vel = vel * 0.6 + (d / dtm * 1000) * 0.4;
    lastX = e.clientX; lastT = now;
    start();
  }
  function up() {
    if (!down) return;
    down = false;
    root.classList.remove('drag');
    window.removeEventListener('pointermove', mv);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    idleUntil = performance.now() + 2600;
    if (performance.now() - lastT > 90) vel = 0;
    if (moved < 6 && downCard) {
      if (facing(downCard) > 0.55) open(downCard);
      else bring(cards.indexOf(downCard));
      vel = 0;
    }
    downCard = null;
    start();
  }

  /* buttons + keyboard */
  [].forEach.call(root.querySelectorAll('.rg3-b'), function (b) {
    b.addEventListener('click', function () {
      var d = +b.getAttribute('data-d');
      var base = target !== null ? target : rot;
      target = Math.round(base / step) * step - d * step;
      idleUntil = performance.now() + 2600; start();
    });
  });
  cards.forEach(function (c) {
    c.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(c); }
    });
  });
  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      var base = target !== null ? target : rot;
      target = Math.round(base / step) * step + (e.key === 'ArrowLeft' ? step : -step);
      idleUntil = performance.now() + 2600; start();
    }
  });

  /* pause the auto spin while the mouse is over the ring, so clicks are easy */
  root.addEventListener('mouseenter', function () { hover = true; });
  root.addEventListener('mouseleave', function () { hover = false; idleUntil = performance.now() + 600; });

  layout(); render();
  if ('ResizeObserver' in window) new ResizeObserver(function () { layout(); render(); }).observe(root);
  else window.addEventListener('resize', function () { layout(); render(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) start(); }, { rootMargin: '60px' }).observe(root);
  }
  document.addEventListener('visibilitychange', start);
  start();
  root.classList.add('ready');
})();
