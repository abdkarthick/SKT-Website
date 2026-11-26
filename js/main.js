/* Sri Kamatchi Toolings - site scripts ("Cavity & Core" design) */
(function () {
  'use strict';
  var root = document.documentElement, body = document.body;
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---------- run-after-loader queue ---------- */
  var readyQ = [], isReady = false;
  function onReady(fn) { if (isReady) fn(); else readyQ.push(fn); }
  function fireReady() { if (isReady) return; isReady = true; body.classList.add('ready'); readyQ.splice(0).forEach(function (f) { try { f(); } catch (e) {} }); }

  /* ---------- loader: a ball draws a ring, the ring becomes a bowl, the ball drops in, cavities bloom, the SKT logo appears ---------- */
  (function () {
    var L = document.getElementById('ld');
    if (!L) { fireReady(); return; }
    var quick = root.classList.contains('quick');
    try { sessionStorage.setItem('skt-seen', '1'); } catch (e) {}
    root.classList.add('ld-lock');
    var loaded = document.readyState === 'complete', finished = false;
    window.addEventListener('load', function () { loaded = true; });

    function open() {
      if (finished) return; finished = true;
      L.classList.add('open'); fireReady();
      setTimeout(function () { L.classList.add('gone'); root.classList.remove('ld-lock'); }, 1150);
    }
    /* logo is on screen: wait for the page to finish loading, hold a moment, then open the mould halves */
    function showLogo(hold) {
      L.classList.add('tx');
      setTimeout(function () {
        if (loaded) { open(); return; }
        var w = setInterval(function () { if (loaded) { clearInterval(w); open(); } }, 100);
        setTimeout(function () { clearInterval(w); open(); }, 5000);
      }, hold);
    }

    if (quick || reduce) {
      var go = function () { L.classList.add('tx'); setTimeout(open, quick ? 380 : 900); };
      if (document.fonts && document.fonts.ready) Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 900); })]).then(go); else go();
      setTimeout(open, 2500);
      return;
    }

    var cv = L.querySelector('canvas'), ctx = cv && cv.getContext && cv.getContext('2d');
    if (!ctx) { showLogo(900); return; }
    var W = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    function size() { W = cv.clientWidth || 320; cv.width = cv.height = Math.round(W * dpr); }
    size(); window.addEventListener('resize', size);

    /* SKT purple range: indigo, brand violet, lilac, orchid */
    var STOPS = [[0, [74, 47, 196]], [.25, [111, 56, 219]], [.5, [169, 139, 240]], [.75, [196, 120, 236]], [1, [74, 47, 196]]];
    function pal(u) {
      u = ((u % 1) + 1) % 1;
      for (var i = 1; i < STOPS.length; i++) if (u <= STOPS[i][0]) {
        var a = STOPS[i - 1], b = STOPS[i], k = (u - a[0]) / (b[0] - a[0]);
        return 'rgb(' + Math.round(a[1][0] + (b[1][0] - a[1][0]) * k) + ',' + Math.round(a[1][1] + (b[1][1] - a[1][1]) * k) + ',' + Math.round(a[1][2] + (b[1][2] - a[1][2]) * k) + ')';
      }
      return '#6f38db';
    }
    var D = Math.PI / 180;
    function cl(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
    function seg(t, a, b) { return cl((t - a) / (b - a)); }
    function eio(x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
    function eo(x) { return 1 - Math.pow(1 - x, 3); }
    function ei(x) { return x * x; }
    function lerp(a, b, k) { return a + (b - a) * k; }

    function ring(cx, cy, rx, ry, a0, a1, rot, lw) {
      var n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / (2.5 * D)));
      ctx.lineWidth = lw; ctx.lineCap = 'round';
      for (var i = 0; i < n; i++) {
        var s = lerp(a0, a1, i / n), e = lerp(a0, a1, (i + 1) / n + 0.004);
        ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, s, e);
        ctx.strokeStyle = pal((s - 90 * D) / (2 * Math.PI) + rot); ctx.stroke();
      }
    }
    function ball(x, y, r, a) {
      if (r <= 0.0005) return;
      ctx.save(); ctx.globalAlpha = a == null ? 1 : a;
      ctx.shadowColor = 'rgba(111,56,219,.45)'; ctx.shadowBlur = r * 1.6;
      var g = ctx.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r);
      g.addColorStop(0, '#9b78ff'); g.addColorStop(1, '#3b1fa8');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.restore();
    }
    function dot(x, y, r, ci) {
      if (r <= 0.0005) return;
      var g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
      g.addColorStop(0, pal(ci)); g.addColorStop(1, pal(ci + .16));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }

    var BR = .037, LW = .012, T_END = 3.35;
    var COLX = [.31, .39, .61, .69], COLR = [.009, .026, .026, .009], ROWY = [.29, .38, .47, .56];
    var trail = [];

    function frame(t) {
      ctx.setTransform(dpr * W, 0, 0, dpr * W, 0, 0);
      ctx.clearRect(0, 0, 1, 1);
      var lw = LW, bx = .5, by = .29, br = BR, rot = t * .06;
      if (t < 1.5) {
        /* A: ball runs round clockwise drawing the ring */
        var p = eio(seg(t, .2, .95)), phi = -90 * D + p * 360 * D;
        var R = .195, ry = lerp(R, .21, seg(t, .95, 1.25)), rx = lerp(R, .17, seg(t, .95, 1.25));
        var g = lerp(0, 14 * D, eo(seg(t, 1.1, 1.45)));
        if (t >= .2 && t < .95) {
          bx = .5 + R * Math.cos(phi); by = .5 + R * Math.sin(phi);
          ring(.5, .5, R, R, -90 * D, phi, rot, lw);
        } else if (t >= .95) {
          ring(.5, .5, rx, ry, -90 * D + g, 270 * D - g, rot, lw);
          bx = .5; by = .5 - ry - .045 + Math.sin(t * 9) * .006;
        }
      } else if (t < 2.45) {
        /* B: ring opens, ball falls in, ring becomes a bowl and wobbles */
        var m = eio(seg(t, 1.5, 1.85));
        var a0 = lerp(-90 * D + 14 * D, -15 * D, m), a1 = lerp(270 * D - 14 * D, 195 * D, m);
        var rx2 = lerp(.17, .30, m), ry2 = lerp(.21, .26, m), cy = lerp(.5, .45, m);
        var wob = t > 1.85 ? Math.sin((t - 1.85) * 7) * .07 * Math.exp(-(t - 1.85) * 1.6) : 0;
        var bot = cy + ry2 - br - lw * .7, d = seg(t, 1.55, 1.85);
        by = t < 1.85 ? lerp(.5 - .21 - .045, bot, ei(d)) : bot - Math.abs(Math.sin((t - 1.85) * 9)) * .045 * Math.exp(-(t - 1.85) * 5);
        ctx.save(); ctx.translate(.5, .45); ctx.rotate(wob); ctx.translate(-.5, -.45);
        ring(.5, cy, rx2, ry2, a0, a1, rot + (t - 1.85) * .05, lw);
        ctx.restore();
        bx = .5 + wob * .5;
      } else {
        /* C: bowl slips away, a 4 x 4 block of cavities fills and fades, ball floats up and shrinks */
        var s = eio(seg(t, 2.45, 2.9));
        ctx.save(); ctx.globalAlpha = 1 - seg(t, 2.8, 2.95);
        ring(.5, .45, .30, .26, lerp(-15 * D, 195 * D - 8 * D, s), 195 * D, rot + .12, lw);
        ctx.restore();
        for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) {
          var st = 2.55 + (c === 1 || c === 2 ? 0 : .05) + (3 - r) * .03 + c * .015;
          var grow = eo(seg(t, st, st + .25));
          var ss = 2.85 + (3 - r) * .07 + (c === 0 || c === 3 ? 0 : .03);
          var die = 1 - ei(seg(t, ss, ss + .3));
          dot(COLX[c], ROWY[r], COLR[c] * grow * die * (1 + .15 * Math.sin(t * 14 + r + c)), (c * 4 + r) * .071 + t * .08);
        }
        bx = .5; by = lerp(.66, .31, eo(seg(t, 2.5, 2.95)));
        br = BR * (1 - ei(seg(t, 3.0, T_END)));
      }
      trail.push([bx, by]); if (trail.length > 4) trail.shift();
      for (var i = 0; i < trail.length - 1; i++) ball(trail[i][0], trail[i][1], br * .9, .1 + i * .06);
      ball(bx, by, br, 1);
    }

    var t0 = performance.now(), done = false;
    (function loop(now) {
      var t = (now - t0) / 1000;
      if (t >= T_END) {
        if (!done) { done = true; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); showLogo(1100); }
        return;
      }
      frame(t); requestAnimationFrame(loop);
    })(t0);
    setTimeout(open, 9000);
  })();

  /* ---------- header: sliding pill, hide on scroll, mobile menu ---------- */
  (function () {
    var h = document.querySelector('header'); if (!h) return;
    var y = window.scrollY, bg = h.querySelector('.bg'), mm = document.getElementById('mm');
    function f() {
      var c = window.scrollY;
      h.classList.toggle('solid', c > 30);
      if (c > y && c > 160 && !h.classList.contains('open')) h.classList.add('hide'); else if (c < y) h.classList.remove('hide');
      y = c;
    }
    window.addEventListener('scroll', f, { passive: true }); f();

    var nav = h.querySelector('nav'), pill = nav && nav.querySelector('.pill');
    if (nav && pill) {
      var links = [].slice.call(nav.querySelectorAll('a')), act = nav.querySelector('a.on');
      var place = function (a) {
        if (!a) { pill.style.opacity = 0; links.forEach(function (l) { l.classList.remove('hot'); }); return; }
        pill.style.opacity = 1; pill.style.width = a.offsetWidth + 'px'; pill.style.transform = 'translateX(' + a.offsetLeft + 'px)';
        links.forEach(function (l) { l.classList.toggle('hot', l === a); });
      };
      var first = function () { pill.style.transition = 'none'; place(act); void pill.offsetWidth; pill.style.transition = ''; };
      first();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(first);
      window.addEventListener('resize', function () { place(act); });
      links.forEach(function (a) { a.addEventListener('mouseenter', function () { place(a); }); a.addEventListener('focus', function () { place(a); }); });
      nav.addEventListener('mouseleave', function () { place(act); });
    }

    /* ---------- slime wave menu transition ---------- */
    var slime = (function () {
      var cv = document.createElement('canvas'); cv.id = 'sl'; cv.setAttribute('aria-hidden', 'true'); document.body.appendChild(cv);
      var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var COLS = ['#a98bf0', '#6f38db', '#2a2063'], COVER = 0.75, TOTAL = 1.9, busy = false;
      function size() { W = innerWidth; H = innerHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
      function cl(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
      function eio(x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
      function edge(x, base, amp, ph, k) {
        var a = Math.sin(x * 0.011 * k + ph), b = Math.sin(x * 0.027 * k - ph * 1.4);
        var drip = Math.pow(0.5 + 0.5 * a, 2.2);
        return base + amp * (drip * 1.0 + 0.35 * b);
      }
      function draw(t) {
        ctx.clearRect(0, 0, W, H);
        var amp = Math.max(70, H * 0.16), STEP = 8;
        for (var i = 0; i < 3; i++) {
          var cs = i * 0.1, ls = 0.9 + (2 - i) * 0.1;
          var c = eio(cl((t - cs) / COVER)), l = eio(cl((t - ls) / COVER));
          if (c <= 0 || l >= 1) continue;
          var span = H + amp * 2.2, ph = t * 3 + i * 1.7, k = 1 + i * 0.35;
          var yb = c * span - amp * 1.2, yt = l * span - amp * 1.2;
          ctx.beginPath();
          var x;
          if (l <= 0) ctx.moveTo(-10, -10); else { ctx.moveTo(-10, edge(-10, yt, amp * 0.7, ph + 2, k)); for (x = -10; x <= W + 10; x += STEP) ctx.lineTo(x, edge(x, yt, amp * 0.7, ph + 2, k)); }
          if (l <= 0) ctx.lineTo(W + 10, -10);
          ctx.lineTo(W + 10, edge(W + 10, yb, amp, ph, k));
          for (x = W + 10; x >= -10; x -= STEP) ctx.lineTo(x, edge(x, yb, amp, ph, k));
          ctx.closePath(); ctx.fillStyle = COLS[i]; ctx.fill();
        }
      }
      function run(mid, done) {
        if (busy) return false; busy = true; size(); cv.classList.add('go');
        var t0 = null, fired = false;
        (function f(ts) {
          if (t0 === null) t0 = ts; var t = (ts - t0) / 1000;
          if (!fired && t >= 0.9) { fired = true; mid(); }
          if (t >= TOTAL) { ctx.clearRect(0, 0, W, H); cv.classList.remove('go'); busy = false; if (done) done(); return; }
          draw(t); requestAnimationFrame(f);
        })(performance.now());
        return true;
      }
      return { run: run, busy: function () { return busy; } };
    })();

    function apply(o) {
      h.classList.toggle('open', o); if (mm) mm.classList.toggle('on', o);
      if (bg) bg.setAttribute('aria-expanded', o ? 'true' : 'false');
      root.classList.toggle('ld-lock', o);
    }
    function setMenu(o, instant) {
      if (slime.busy() || o === h.classList.contains('open')) return;
      var calm = instant || (window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches);
      if (calm) { apply(o); return; }
      slime.run(function () { apply(o); });
    }
    if (bg) bg.addEventListener('click', function () { setMenu(!h.classList.contains('open')); });
    if (mm) [].forEach.call(mm.querySelectorAll('a'), function (a) { a.addEventListener('click', function () { setMenu(false, true); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  })();

  /* ---------- scroll progress + cursor ring ---------- */
  (function () {
    var bar = document.createElement('div'); bar.id = 'sp'; body.appendChild(bar);
    function sp() { var h = document.documentElement.scrollHeight - window.innerHeight; bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ')'; }
    window.addEventListener('scroll', sp, { passive: true }); sp();
    if (!fine) return;
    var r = document.createElement('div'); r.id = 'cur2'; body.appendChild(r);
    var x = 0, y = 0, tx = 0, ty = 0;
    window.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY; body.classList.add('cur-on');
      r.classList.toggle('big', !!(e.target.closest && e.target.closest('a,button,[data-zoom],.pt2,.th,.ac')));
    }, { passive: true });
    document.addEventListener('mouseleave', function () { body.classList.remove('cur-on'); });
    (function loop() { x += (tx - x) * .2; y += (ty - y) * .2; r.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)'; requestAnimationFrame(loop); })();
  })();

  /* ---------- reveal on scroll ---------- */
  onReady(function () {
    var sel = '.sh,.sh2,.pw .pt2,.pc,.role,.as,.cert,.cd,.ct,form,.mini figure,.mlist button,.sheet>div,.two>*,.pg>*,.qk a,.tier,.lgm,.map,.sheet .ph2';
    var els = [].slice.call(document.querySelectorAll(sel + ',.rv'));
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target; io.unobserve(el); el.classList.add('in');
        var d = parseFloat(el.style.transitionDelay) || 0;
        setTimeout(function () { el.classList.remove('rv', 'in'); el.style.transitionDelay = ''; }, 1400 + d * 1000 * 0 + (parseInt(el.getAttribute('data-d'), 10) || 0));
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    els.forEach(function (el) {
      if (!el.classList.contains('rv')) el.classList.add('rv');
      var sibs = el.parentNode ? [].slice.call(el.parentNode.children).filter(function (c) { return c.classList.contains('rv'); }) : [];
      var i = Math.max(0, sibs.indexOf(el)); el.style.transitionDelay = Math.min(i, 5) * 70 + 'ms';
      el.setAttribute('data-d', Math.min(i, 5) * 70);
      io.observe(el);
    });
  });

  /* ---------- split headings into masked words ---------- */
  (function () {
    var n = 0;
    function wrap(node) {
      [].slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'), s = document.createElement('span'); w.className = 'w'; s.style.setProperty('--i', n++); s.textContent = t; w.appendChild(s); frag.appendChild(w);
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1 && c.tagName !== 'svg') wrap(c);
      });
    }
    var hs = [].slice.call(document.querySelectorAll('.s h2,.cta h2,.ph h1'));
    hs.forEach(function (h) { n = 0; wrap(h); });
    onReady(function () {
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('wi'); io.unobserve(e.target); } }); }, { threshold: .3 });
        hs.forEach(function (h) { io.observe(h); });
      } else hs.forEach(function (h) { h.classList.add('wi'); });
    });
  })();

  /* ---------- count-up ---------- */
  function countUp(el, to, suf, dur) {
    var t0 = null, dec = +el.getAttribute('data-d') || 0, comma = el.hasAttribute('data-c');
    (function st(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / (dur || 1500), 1), v = to * (1 - Math.pow(1 - p, 3));
      var s = (dec ? v.toFixed(dec) : Math.round(v)).toString();
      if (comma) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      el.textContent = s + (suf || '');
      if (p < 1) requestAnimationFrame(st);
    })(performance.now());
  }
  window.countUp = countUp;
  onReady(function () {
    var ns = document.querySelectorAll('[data-n]'); if (!ns.length) return;
    if (!('IntersectionObserver' in window)) { [].forEach.call(ns, function (n) { n.textContent = n.getAttribute('data-n') + (n.getAttribute('data-s') || ''); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (!e.isIntersecting) return; io.unobserve(e.target); countUp(e.target, +e.target.getAttribute('data-n'), e.target.getAttribute('data-s') || ''); });
    }, { threshold: 0.6 });
    [].forEach.call(ns, function (n) { io.observe(n); });
  });

  /* ---------- hero part stage: parts eject out of the cavity, pointer tilt ---------- */
  (function () {
    var c = document.querySelector('.cav'); if (!c) return;
    var imgs = [].slice.call(c.querySelectorAll('.pt img')), ths = [].slice.call(c.querySelectorAll('.th')), nm = c.querySelector('.cap b'), kd = c.querySelector('.cap em'), ix = c.querySelector('.ix b'), stage = c.querySelector('.stage'), pt = c.querySelector('.pt'), i = -1, tm;
    function show(n) {
      var prev = i; i = (n + imgs.length) % imgs.length;
      imgs.forEach(function (m, k) { m.classList.toggle('on', k === i); m.classList.toggle('out', k === prev && prev !== i); });
      ths.forEach(function (d, k) { d.classList.toggle('on', k === i); });
      if (nm) nm.textContent = imgs[i].getAttribute('alt'); if (kd) kd.textContent = imgs[i].getAttribute('data-k'); if (ix) ix.textContent = '0' + (i + 1);
    }
    function loop() { clearInterval(tm); tm = setInterval(function () { show(i + 1); }, 3800); }
    ths.forEach(function (d, k) { d.addEventListener('click', function () { show(k); loop(); }); });
    if (fine && stage) {
      stage.addEventListener('pointermove', function (e) {
        var r = stage.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        pt.style.transform = 'rotateY(' + (x * 22).toFixed(1) + 'deg) rotateX(' + (-y * 18).toFixed(1) + 'deg) translate3d(' + (x * 14).toFixed(1) + 'px,' + (y * 10).toFixed(1) + 'px,0)';
      });
      stage.addEventListener('pointerleave', function () { pt.style.transform = ''; });
    }
    show(0); loop();
  })();

  /* ---------- kinetic marquee: speeds up and leans with scroll ---------- */
  (function () {
    var mqs = [].slice.call(document.querySelectorAll('.mq')); if (!mqs.length) return;
    function init() {
      mqs.forEach(function (mq) {
        var tr = mq.querySelector('.tr'); if (!tr) return;
        var base = tr.innerHTML, w1 = tr.scrollWidth + 0, n = Math.ceil((window.innerWidth + w1) / w1) + 1;
        for (var k = 0; k < n; k++) tr.innerHTML += base;
        var x = 0, v = 1, dir = 1, lastY = window.scrollY, vis = true;
        if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(mq);
        (function frame() {
          requestAnimationFrame(frame);
          if (!vis) return;
          var sy = window.scrollY, dy = sy - lastY; lastY = sy;
          if (Math.abs(dy) > 0.5) dir = dy > 0 ? 1 : -1;
          var target = (reduce ? .3 : 1.1) + Math.min(Math.abs(dy) * .45, 16);
          v += (target - v) * .08;
          x -= v * dir;
          if (x <= -w1) x += w1; if (x > 0) x -= w1;
          var sk = reduce ? 0 : Math.max(-6, Math.min(6, -dy * dir * .22 * dir));
          tr.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0) skewX(' + sk.toFixed(2) + 'deg)';
        })();
      });
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(init); else init();
  })();

  /* ---------- promise accordion ---------- */
  (function () {
    var acs = [].slice.call(document.querySelectorAll('.ac')); if (!acs.length) return;
    var tm;
    function on(a) { acs.forEach(function (x) { x.classList.toggle('on', x === a); }); }
    acs.forEach(function (a) {
      a.addEventListener('click', function () { on(a); });
      a.addEventListener('focus', function () { on(a); });
      a.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); on(a); } });
      if (fine) {
        a.addEventListener('mouseenter', function () { clearTimeout(tm); tm = setTimeout(function () { on(a); }, 140); });
        a.addEventListener('mouseleave', function () { clearTimeout(tm); });
      }
    });
  })();

  /* ---------- services: cursor glow ---------- */
  [].forEach.call(document.querySelectorAll('.row'), function (r) {
    r.addEventListener('pointermove', function (e) {
      var b = r.getBoundingClientRect(); r.style.setProperty('--mx', (e.clientX - b.left) + 'px'); r.style.setProperty('--my', (e.clientY - b.top) + 'px');
    });
  });

  /* ---------- machines HMI ---------- */
  (function () {
    var bs = [].slice.call(document.querySelectorAll('.mlist button')), ps = [].slice.call(document.querySelectorAll('.mp')); if (!bs.length) return;
    function sel(k) {
      bs.forEach(function (b, j) { b.classList.toggle('on', j === k); });
      ps.forEach(function (p, j) { p.classList.toggle('on', j === k); });
      [].forEach.call(ps[k].querySelectorAll('[data-v]'), function (el) { countUp(el, +el.getAttribute('data-v'), ' mm', 1100); });
    }
    bs.forEach(function (b, k) { b.addEventListener('click', function () { sel(k); }); });
    sel(0);
  })();

  /* ---------- facility sheets: animate numbers + bars when visible ---------- */
  (function () {
    var xs = document.querySelectorAll('.sheet .ax'); if (!xs.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (!e.isIntersecting) return; io.unobserve(e.target); e.target.classList.add('go'); [].forEach.call(e.target.querySelectorAll('[data-v]'), function (el) { countUp(el, +el.getAttribute('data-v'), ' mm', 1200); }); });
    }, { threshold: .4 });
    [].forEach.call(xs, function (x) { io.observe(x); });
  })();

  /* ---------- founder timeline progress ---------- */
  (function () {
    var tm = document.querySelector('.tm'); if (!tm) return;
    var evs = [].slice.call(tm.querySelectorAll('.ev'));
    function u() {
      var r = tm.getBoundingClientRect(), p = Math.max(0, Math.min(1, (window.innerHeight * .65 - r.top) / r.height));
      tm.style.setProperty('--tp', p);
      evs.forEach(function (e) { var er = e.getBoundingClientRect(); e.classList.toggle('hit', er.top < window.innerHeight * .65); });
    }
    window.addEventListener('scroll', u, { passive: true }); window.addEventListener('resize', u); u();
  })();

  /* ---------- customer marquee rows: make sure two copies exist ---------- */

  /* ---------- lightbox ---------- */
  (function () {
    var b = document.getElementById('lb'); if (!b) return;
    var im = b.querySelector('img');
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-zoom]'); if (!t) return;
      im.src = t.getAttribute('data-zoom'); b.classList.add('on');
    });
    b.addEventListener('click', function () { b.classList.remove('on'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') b.classList.remove('on'); });
  })();

  /* ---------- gallery filter ---------- */
  (function () {
    var fs = [].slice.call(document.querySelectorAll('.filt button')), its = [].slice.call(document.querySelectorAll('.pw .pt2'));
    if (!fs.length) return;
    fs.forEach(function (f) {
      f.addEventListener('click', function () {
        fs.forEach(function (x) { x.classList.remove('on'); }); f.classList.add('on');
        var k = f.getAttribute('data-f');
        its.forEach(function (i) { i.classList.toggle('hid', k !== 'all' && i.getAttribute('data-c') !== k); });
      });
    });
  })();

  /* ---------- enquiry form -> WhatsApp ---------- */
  (function () {
    var f = document.getElementById('eq'); if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var g = function (id) { return (document.getElementById(id) || {}).value || ''; };
      var m = 'Hello Sri Kamatchi Toolings, I am ' + g('n') + ' (' + g('p') + '). Enquiry: ' + g('t') + '. ' + g('m');
      window.open('https://wa.me/917200903861?text=' + encodeURIComponent(m), '_blank');
    });
  })();

  /* ---------- magnetic buttons (pointer devices only) ---------- */
  if (fine) {
    [].forEach.call(document.querySelectorAll('.btn,.hcall'), function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .16).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * .24).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- page curtain: the mould halves close before the next page loads ---------- */
  (function () {
    var L = document.getElementById('ld');
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]'); if (!a || !L) return;
      var h = a.getAttribute('href');
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank' || !/^[\w-]+\.html(#.*)?$/.test(h)) return;
      if (h.split('#')[0] === location.pathname.split('/').pop() && h.indexOf('#') > -1) return;
      e.preventDefault();
      L.classList.remove('gone'); L.classList.add('open', 'quickclose'); void L.offsetWidth; L.classList.remove('open');
      setTimeout(function () { location.href = h; }, 720);
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted && L) { L.classList.add('open'); setTimeout(function () { L.classList.add('gone'); root.classList.remove('ld-lock'); }, 700); } });
  })();
})();
