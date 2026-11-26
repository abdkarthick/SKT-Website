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

  /* ---------- loader: melt enters the gate and fills the SKT cavity, then the mould opens ---------- */
  (function () {
    var L = document.getElementById('ld');
    if (!L) { fireReady(); return; }
    var quick = root.classList.contains('quick');
    try { sessionStorage.setItem('skt-seen', '1'); } catch (e) {}
    var num = document.getElementById('ldn'), stg = document.getElementById('ldst');
    root.classList.add('ld-lock');
    var loaded = document.readyState === 'complete', finished = false;
    window.addEventListener('load', function () { loaded = true; });
    function open() {
      if (finished) return; finished = true;
      L.classList.add('open'); fireReady();
      setTimeout(function () { L.classList.add('gone'); root.classList.remove('ld-lock'); }, 1150);
    }
    if (quick) {
      var go = function () { setTimeout(open, 380); };
      if (document.fonts && document.fonts.ready) Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 900); })]).then(go); else go();
      setTimeout(open, 2500);
      return;
    }
    var dur = reduce ? 600 : 3000, delay = reduce ? 0 : 450, t0 = performance.now();
    function ease(p) { return p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }
    (function tick(t) {
      var p = Math.max(0, Math.min((t - t0 - delay) / dur, 1)), e = ease(p), v = Math.round(e * 100);
      if (num) num.textContent = v;
      if (stg) stg.textContent = v < 4 ? 'Closing the mould' : v < 22 ? 'Melt reaches the gate' : v < 78 ? 'Injecting the cavity' : v < 99 ? 'Packing & cooling' : 'Part ready';
      L.style.setProperty('--a', (-8 + e * 116).toFixed(2));
      if (p < 1 || !loaded) {
        if (p >= 1 && !loaded && num) num.textContent = '99';
        requestAnimationFrame(tick);
      } else { if (num) num.textContent = '100'; setTimeout(open, 420); }
    })(t0);
    setTimeout(open, 8000);
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

    function setMenu(o) {
      h.classList.toggle('open', o); if (mm) mm.classList.toggle('on', o);
      if (bg) bg.setAttribute('aria-expanded', o ? 'true' : 'false');
      root.classList.toggle('ld-lock', o);
    }
    if (bg) bg.addEventListener('click', function () { setMenu(!h.classList.contains('open')); });
    if (mm) [].forEach.call(mm.querySelectorAll('a'), function (a) { a.addEventListener('click', function () { setMenu(false); }); });
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
    var sel = '.sh,.sh2,.pt2,.pc,.role,.as,.cert,.cd,.ct,form,.mini figure,.mlist button,.sheet>div,.two>*,.pg>*,.qk a,.tier,.lgm,.map,.sheet .ph2';
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
