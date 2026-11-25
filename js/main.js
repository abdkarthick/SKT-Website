/* Sri Kamatchi Toolings - site scripts ("Parting Line" design) */

/* ---------- loader: two 3D mould halves spin in, clamp together and the SKT logo forms, then the curtain opens ---------- */
(function () {
  var L = document.getElementById('ld'); if (!L) return;
  var seen = false;
  try { seen = sessionStorage.getItem('skt-seen') === '1'; sessionStorage.setItem('skt-seen', '1'); } catch (e) {}
  var num = document.getElementById('ldn'), stg = document.getElementById('ldst'), root = document.documentElement;
  root.classList.add('ld-lock');
  var dur = 2600, t0 = performance.now(), loaded = document.readyState === 'complete', finished = false;
  window.addEventListener('load', function () { loaded = true; });
  function open() {
    if (finished) return; finished = true;
    L.classList.add('open'); document.body.classList.add('ready');
    setTimeout(function () { L.classList.add('gone'); root.classList.remove('ld-lock'); }, 1150);
  }
  (function tick(t) {
    var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 2.2), v = Math.round(e * 100);
    if (num) num.textContent = ('00' + v).slice(-3);
    if (stg) stg.textContent = v < 25 ? 'Aligning halves' : v < 55 ? 'Clamping' : v < 85 ? 'Injecting' : v < 98 ? 'Cooling' : 'Part ready';
    L.style.setProperty('--p', e);
    if (e > 0.995) L.classList.add('done');
    if (p < 1 || !loaded) { if (p >= 1 && !loaded) { num && (num.textContent = '099'); } requestAnimationFrame(tick); }
    else { if (num) num.textContent = '100'; setTimeout(open, 360); }
  })(t0);
  setTimeout(open, 7000);
})();

/* ---------- header ---------- */
(function () {
  var h = document.querySelector('header'); if (!h) return;
  var y = window.scrollY, bg = h.querySelector('.bg');
  function f() {
    var c = window.scrollY;
    h.classList.toggle('solid', c > 30);
    if (c > y && c > 160 && !h.classList.contains('open')) h.classList.add('hide'); else if (c < y) h.classList.remove('hide');
    y = c;
  }
  window.addEventListener('scroll', f, { passive: true }); f();
  if (bg) bg.onclick = function () { var o = h.classList.toggle('open'); bg.setAttribute('aria-expanded', o ? 'true' : 'false'); };
})();

/* ---------- cursor spotlight (mouse only) ---------- */
(function () {
  var s = document.querySelector('.spot'); if (!s || !window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  var x = 0, y = 0, tx = 0, ty = 0;
  window.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; document.body.classList.add('has-spot'); }, { passive: true });
  (function loop() { x += (tx - x) * .12; y += (ty - y) * .12; s.style.transform = 'translate(' + x + 'px,' + y + 'px)'; requestAnimationFrame(loop); })();
})();

/* ---------- reveal ---------- */
(function () {
  var els = document.querySelectorAll('.sh,.sh2,.row,.pt2,.lg,.pc,.role,.as,.cert,.cd,.ct,form,.cta,.mini figure,.mlist button,.pc3,.sheet>div,.two>*,.pg>*,.pl');
  if (!('IntersectionObserver' in window)) { [].forEach.call(document.querySelectorAll('.pl'), function (p) { p.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  [].forEach.call(els, function (el, i) {
    if (!el.classList.contains('pl')) { el.classList.add('rv'); el.style.transitionDelay = (i % 4) * 70 + 'ms'; }
    io.observe(el);
  });
  document.addEventListener('transitionend', function (e) {
    var t = e.target;
    if (e.propertyName === 'opacity' && t.classList && t.classList.contains('rv')) t.style.transitionDelay = '0ms';
  }, true);
})();

/* ---------- count-up ---------- */
function countUp(el, to, suf, dur) {
  var t0 = null, dec = +el.getAttribute('data-d') || 0;
  (function st(t) {
    if (!t0) t0 = t;
    var p = Math.min((t - t0) / (dur || 1400), 1), v = to * (1 - Math.pow(1 - p, 3));
    el.textContent = (dec ? v.toFixed(dec) : Math.round(v)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, el.hasAttribute('data-c') ? ',' : '') + (suf || '');
    if (p < 1) requestAnimationFrame(st);
  })(performance.now());
}
(function () {
  var ns = document.querySelectorAll('[data-n]'); if (!ns.length || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (!e.isIntersecting) return; io.unobserve(e.target); countUp(e.target, +e.target.getAttribute('data-n'), e.target.getAttribute('data-s') || ''); });
  }, { threshold: 0.6 });
  [].forEach.call(ns, function (n) { io.observe(n); });
})();

/* ---------- hero part lab: orbit selector, 3D flip, mouse tilt ---------- */
(function () {
  var c = document.querySelector('.cav'); if (!c) return;
  var imgs = [].slice.call(c.querySelectorAll('.pt img')), ths = [].slice.call(c.querySelectorAll('.th')), nm = c.querySelector('.cap b'), kd = c.querySelector('.cap em'), ix = c.querySelector('.ix b'), stage = c.querySelector('.stage'), pt = c.querySelector('.pt'), dial = c.querySelector('.dial'), i = -1, tm;
  function show(n) {
    var prev = i; i = (n + imgs.length) % imgs.length;
    imgs.forEach(function (m, k) { m.classList.toggle('on', k === i); m.classList.toggle('out', k === prev && prev !== i); });
    ths.forEach(function (d, k) { d.classList.toggle('on', k === i); });
    if (nm) nm.textContent = imgs[i].getAttribute('alt'); if (kd) kd.textContent = imgs[i].getAttribute('data-k'); if (ix) ix.textContent = '0' + (i + 1);
  }
  function loop() { clearInterval(tm); tm = setInterval(function () { show(i + 1); }, 3800); }
  ths.forEach(function (d, k) { d.onclick = function () { show(k); loop(); }; });
  if (window.matchMedia('(hover:hover) and (pointer:fine)').matches && stage) {
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      pt.style.transform = 'rotateY(' + (x * 24).toFixed(1) + 'deg) rotateX(' + (-y * 20).toFixed(1) + 'deg) translate3d(' + (x * 14).toFixed(1) + 'px,' + (y * 10).toFixed(1) + 'px,0)';
      if (dial) dial.style.transform = 'translate(' + (-x * 12).toFixed(1) + 'px,' + (-y * 12).toFixed(1) + 'px)';
    });
    stage.addEventListener('pointerleave', function () { pt.style.transform = ''; if (dial) dial.style.transform = ''; });
  }
  show(0); loop();
})();

/* ---------- services rows: floating part preview ---------- */
(function () {
  var rows = document.querySelectorAll('.row[data-img]'), pv = document.getElementById('pv'); if (!rows.length || !pv) return;
  var im = pv.querySelector('img');
  rows.forEach(function (r) {
    r.addEventListener('mouseenter', function () { im.src = r.getAttribute('data-img'); im.className = r.getAttribute('data-ph') ? 'ph' : ''; pv.classList.add('on'); });
    r.addEventListener('mouseleave', function () { pv.classList.remove('on'); });
    r.addEventListener('mousemove', function (e) { pv.style.left = (e.clientX + 170) + 'px'; pv.style.top = e.clientY + 'px'; });
  });
})();

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

/* ---------- marquees ---------- */
[].forEach.call(document.querySelectorAll('.tick .tr'), function (row) { var c = row.cloneNode(true); c.setAttribute('aria-hidden', 'true'); row.parentNode.appendChild(c); });

/* ---------- lightbox ---------- */
(function () {
  var b = document.getElementById('lb'); if (!b) return;
  var im = b.querySelector('img');
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-zoom]'); if (!t) return;
    im.src = t.getAttribute('data-zoom'); b.classList.add('on');
  });
  b.onclick = function () { b.classList.remove('on'); };
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

/* ---------- 3D tilt + magnetic buttons (pointer devices only) ---------- */
if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
  [].forEach.call(document.querySelectorAll('.pt2,.cd,.pc,.role,.as,.cert'), function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      el.style.transform = 'perspective(900px) rotateX(' + (-y * 7).toFixed(2) + 'deg) rotateY(' + (x * 9).toFixed(2) + 'deg) translateZ(0)';
    });
    el.addEventListener('pointerleave', function () { el.style.transform = ''; });
  });
  [].forEach.call(document.querySelectorAll('.btn,.hcall,.wa'), function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .22).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * .3).toFixed(1) + 'px)';
    });
    el.addEventListener('pointerleave', function () { el.style.transform = ''; });
  });
}

/* ---------- creative layer: progress bar, cursor ring, split headings, page curtain ---------- */
(function () {
  var bar = document.createElement('div'); bar.id = 'sp'; document.body.appendChild(bar);
  function sp() { var h = document.documentElement.scrollHeight - window.innerHeight; bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ')'; }
  window.addEventListener('scroll', sp, { passive: true }); sp();

  if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    var d = document.createElement('div'), r = document.createElement('div'); d.id = 'cur'; r.id = 'cur2'; document.body.appendChild(d); document.body.appendChild(r);
    var x = 0, y = 0, tx = 0, ty = 0;
    window.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY; document.body.classList.add('cur-on'); d.style.transform = 'translate(' + tx + 'px,' + ty + 'px)';
      r.classList.toggle('big', !!e.target.closest && !!e.target.closest('a,button,[data-zoom],.pt2,.th,.mlist button,.filt button,.bt,.pz-c,.cb1,.cb2'));
    }, { passive: true });
    document.addEventListener('mouseleave', function () { document.body.classList.remove('cur-on'); });
    (function loop() { x += (tx - x) * .18; y += (ty - y) * .18; r.style.transform = 'translate(' + x + 'px,' + y + 'px)'; requestAnimationFrame(loop); })();
  }

  /* split headings into masked words */
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
      } else if (c.nodeType === 1) wrap(c);
    });
  }
  var hs = [].slice.call(document.querySelectorAll('.s h2,.cta h2,.ph h1'));
  hs.forEach(function (h) { n = 0; wrap(h); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('wi'); io.unobserve(e.target); } }); }, { threshold: .3 });
    hs.forEach(function (h) { io.observe(h); });
  } else hs.forEach(function (h) { h.classList.add('wi'); });

  /* page curtain: the mould halves close before the next page loads */
  var L = document.getElementById('ld');
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a || !L) return;
    var h = a.getAttribute('href');
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank' || !/^[\w-]+\.html(#.*)?$/.test(h)) return;
    if (h.split('#')[0] === location.pathname.split('/').pop() && h.indexOf('#') > -1) return;
    e.preventDefault();
    L.classList.remove('gone'); L.classList.add('open'); void L.offsetWidth; L.classList.remove('open');
    setTimeout(function () { location.href = h; }, 780);
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted && L) { L.classList.add('open'); setTimeout(function () { L.classList.add('gone'); }, 700); } });
})();
