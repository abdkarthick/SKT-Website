/* Showcase layer: stacking machine rows, orbit/strip parts viewer, inspection-bay gallery */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var ARW_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';
  var ARW_R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function sm(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function lockScroll(on) { document.documentElement.style.overflow = on ? 'hidden' : ''; }

  /* ---------- 1. machines: stacking rows ---------- */
  (function () {
    var rows = [].slice.call(document.querySelectorAll('.mk'));
    if (!rows.length) return;
    function go(r) {
      if (r.classList.contains('on')) return;
      r.classList.add('on');
      [].forEach.call(r.querySelectorAll('[data-v]'), function (el) {
        if (typeof countUp === 'function') countUp(el, +el.getAttribute('data-v'), ' mm', 1100);
        else el.textContent = el.getAttribute('data-v') + ' mm';
      });
    }
    if (!('IntersectionObserver' in window)) { rows.forEach(go); }
    else {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { go(e.target); io.unobserve(e.target); } });
      }, { threshold: 0.4 });
      rows.forEach(function (r) { io.observe(r); });
    }
    var im = document.querySelector('.mclose img');
    if (im && !reduce) {
      var tick = false;
      var upd = function () {
        tick = false;
        var r = im.parentNode.getBoundingClientRect(), vh = window.innerHeight;
        var p = (r.top + r.height / 2 - vh / 2) / vh;
        im.style.transform = 'translateY(' + (p * -40).toFixed(1) + 'px) scale(1.12)';
      };
      window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
      upd();
    }
  })();

  /* ---------- 2. parts: orbit > strip > full-screen detail ---------- */
  (function () {
    var root = document.getElementById('pz');
    if (!root) return;
    var track = root.querySelector('.pz-track');
    var cards = [].slice.call(root.querySelectorAll('.pz-c'));
    var lines = [].slice.call(root.querySelectorAll('.pz-ln em'));
    var center = root.querySelector('.pz-words');
    var hint = root.querySelector('.pz-hint');
    var bar = root.querySelector('.pz-bar i');
    var n = cards.length;
    var rots = [-16, 11, -9, 19, -22, 8, -13, 16];
    var P1 = 0.14, P2 = 0.5;
    var D = {}, queued = false, lastLine = -1;


    /* detail overlay */
    var ov = document.createElement('div');
    ov.id = 'pzov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Part detail');
    ov.innerHTML = '<button type="button" class="pzo-x" aria-label="Close">' + ARW_L + '</button>' +
      '<div class="pzo-no"></div><h3 class="pzo-t"></h3><img class="pzo-img" alt="">' +
      '<div class="pzo-m"><small></small><p>Moulded on our tools at Sri Kamatchi Toolings, Thirumudivakkam, Chennai.</p>' +
      '<a class="lnk" href="contact.html">Need a part like this? Enquire &rarr;</a>' +
      '<div class="pzo-nav"><button type="button" data-d="-1" aria-label="Previous part">' + ARW_L + '</button><button type="button" data-d="1" aria-label="Next part">' + ARW_R + '</button></div></div>';
    document.body.appendChild(ov);
    var oT = ov.querySelector('.pzo-t'), oI = ov.querySelector('.pzo-img'), oN = ov.querySelector('.pzo-no'), oC = ov.querySelector('.pzo-m small');
    var cur = 0;

    function fill(i) {
      var c = cards[i], nm = c.getAttribute('data-name');
      oT.textContent = nm;
      oT.className = 'pzo-t' + (nm.length > 26 ? ' s3' : nm.length > 13 ? ' s2' : '');
      oI.src = c.getAttribute('data-src'); oI.alt = nm;
      oN.textContent = ('0' + (i + 1)).slice(-2) + '/' + ('0' + n).slice(-2);
      oC.textContent = c.getAttribute('data-cat');
    }
    function open(i, ev) {
      cur = i; fill(i);
      var r = cards[i].getBoundingClientRect();
      ov.style.setProperty('--ox', ((r.left + r.width / 2) / window.innerWidth * 100).toFixed(1) + '%');
      ov.style.setProperty('--oy', ((r.top + r.height / 2) / window.innerHeight * 100).toFixed(1) + '%');
      ov.classList.add('on'); lockScroll(true);
      ov.querySelector('.pzo-x').focus({ preventScroll: true });
    }
    function close() { ov.classList.remove('on'); lockScroll(false); if (cards[cur]) cards[cur].focus({ preventScroll: true }); }
    function step(d) {
      cur = (cur + d + n) % n;
      ov.classList.add('sw');
      setTimeout(function () { fill(cur); ov.classList.remove('sw'); }, 170);
    }
    cards.forEach(function (c, i) { c.addEventListener('click', function (e) { open(i, e); }); });
    ov.querySelector('.pzo-x').addEventListener('click', close);
    [].forEach.call(ov.querySelectorAll('.pzo-nav button'), function (b) {
      b.addEventListener('click', function () { step(+b.getAttribute('data-d')); });
    });
    document.addEventListener('keydown', function (e) {
      if (!ov.classList.contains('on')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    });

    function setStatic(on) {
      root.classList.toggle('static', on);
      if (on) {
        cards.forEach(function (c) { c.style.transform = ''; c.style.zIndex = ''; c.style.removeProperty('--co'); });
        center.style.opacity = ''; center.style.transform = ''; center.style.visibility = '';
      }
    }

    function measure() {
      var vw = window.innerWidth, vh = window.innerHeight;
      setStatic(reduce || vw < 700 || vh < 520);
      if (root.classList.contains('static')) return;
      var cols = vw >= 1000 ? 4 : 3, rows = Math.ceil(n / cols);
      var gap = clamp(vw * 0.014, 12, 22);
      var top = 150, bottom = 72;
      var availH = vh - top - bottom, availW = vw * 0.86;
      var cap = 36;
      var cwH = ((availH - (rows - 1) * gap) / rows - cap) / 1.18;
      var cwW = (availW - (cols - 1) * gap) / cols;
      var cw = clamp(Math.min(cwH, cwW), 120, 300);
      D = { vw: vw, vh: vh, cols: cols, rows: rows, gap: gap, cw: cw, ph: cw * 1.18, cap: cap, top: top, availH: availH, os: 0.4 };
      root.style.setProperty('--cw', cw.toFixed(1) + 'px');
      root.style.setProperty('--ph', D.ph.toFixed(1) + 'px');
      render();
    }

    function render() {
      queued = false;
      if (root.classList.contains('static') || !D.vw) return;
      var rect = track.getBoundingClientRect();
      var span = track.offsetHeight - D.vh;
      var p = clamp(-rect.top / span, 0, 1);
      var raw = (p - P1) / (P2 - P1);
      var cw = D.cw, vw = D.vw, vh = D.vh;
      var cellH = D.ph + D.cap;
      var gridH = D.rows * cellH + (D.rows - 1) * D.gap;
      var y0 = D.top + (D.availH - gridH) / 2;

      for (var i = 0; i < n; i++) {
        var ti = sm(raw * 1.4 - i * 0.05);
        var ang = i / n * Math.PI * 2 + p * 2.4 - Math.PI / 2;
        var ox = Math.cos(ang) * vw * 0.34, oy = Math.sin(ang) * vh * 0.3;
        var col = i % D.cols, row = Math.floor(i / D.cols);
        var inRow = (row === D.rows - 1) ? (n - row * D.cols) : D.cols;
        var rowW = inRow * cw + (inRow - 1) * D.gap;
        var sx = -rowW / 2 + cw / 2 + col * (cw + D.gap);
        var sy = y0 + row * (cellH + D.gap) + cellH / 2 - vh / 2;
        var x = lerp(ox, sx, ti), y = lerp(oy, sy, ti), sc = lerp(D.os, 1, ti), r = lerp(rots[i % rots.length], 0, ti);
        var c = cards[i];
        c.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + r.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
        c.style.setProperty('--co', ti > 0.92 ? '1' : '0');
        c.style.zIndex = ti > 0.5 ? 5 : 2;
      }
      var li = p < 0.05 ? 0 : p < 0.1 ? 1 : 2;
      if (li !== lastLine) { lines.forEach(function (e, k) { e.classList.toggle('on', k === li); }); lastLine = li; }
      var fade = 1 - clamp((p - 0.12) / 0.12, 0, 1);
      center.style.opacity = fade.toFixed(3);
      center.style.transform = 'scale(' + lerp(1, 0.92, 1 - fade).toFixed(3) + ')';
      center.style.visibility = fade <= 0 ? 'hidden' : 'visible';
      hint.style.opacity = sm((raw - 0.85) / 0.15).toFixed(3);
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    }

    window.addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(render); } }, { passive: true });
    window.addEventListener('resize', measure);
    measure();
  })();

  /* ---------- 3. products: curved gallery > detail view ---------- */
  (function () {
    var bay = document.querySelector('.bay');
    if (!bay) return;
    var sec = bay.closest('section');
    var src = [].slice.call(bay.querySelectorAll('.bt')).map(function (f) {
      return { src: f.getAttribute('data-src'), name: f.getAttribute('data-name'), cat: f.getAttribute('data-cat'),
        grp: f.getAttribute('data-c'), no: f.getAttribute('data-no'), raw: f.classList.contains('raw') };
    });
    var fs = [].slice.call(document.querySelectorAll('.filt button'));
    var mobile = function () { return window.innerWidth < 700; };
    function pad(v) { return ('0' + v).slice(-2); }

    /* ---- build gallery shell ---- */
    var arc = document.createElement('div');
    arc.className = 'ga';
    arc.innerHTML =
      '<div class="ga-ruler" aria-hidden="true"><div class="ga-dots"></div><i class="ga-mk"></i></div>' +
      '<div class="ga-stage" tabindex="0" role="listbox" aria-label="Parts gallery"><div class="ga-ring"></div></div>' +
      '<div class="ga-bar"><div class="ga-nav"><button type="button" class="ga-b" data-d="-1" aria-label="Previous part">' + ARW_L + '</button>' +
      '<button type="button" class="ga-b" data-d="1" aria-label="Next part">' + ARW_R + '</button></div>' +
      '<div class="ga-info"><span class="ga-ct"></span><b class="ga-nm"></b></div>' +
      '<button type="button" class="ga-flat">Front view</button></div>';
    bay.parentNode.insertBefore(arc, bay);
    sec.classList.add('ga-on');
    var ring = arc.querySelector('.ga-ring'), stage = arc.querySelector('.ga-stage');
    var dotsEl = arc.querySelector('.ga-dots'), mk = arc.querySelector('.ga-mk'), ruler = arc.querySelector('.ga-ruler');
    var ctEl = arc.querySelector('.ga-ct'), nmEl = arc.querySelector('.ga-nm'), flatBtn = arc.querySelector('.ga-flat');

    var list = [], frames = [], dots = [];
    var pos = 0, target = 0, curv = 1, curvT = 1, raf = 0;
    var G = { fw: 200, R: 900, step: 0.24 };

    function jitter(i) { return Math.sin(i * 12.9898) * 2.6; }

    function build(group) {
      list = src.filter(function (s) { return group === 'all' || s.grp === group; });
      ring.innerHTML = ''; dotsEl.innerHTML = '';
      frames = list.map(function (it, i) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'ga-f' + (it.raw ? ' raw' : ''); b.setAttribute('role', 'option');
        b.setAttribute('aria-label', it.name);
        b.innerHTML = '<span class="ga-n">' + pad(i + 1) + '</span><span class="ga-im"><img src="' + it.src + '" alt="' + it.name.replace(/"/g, '&quot;') + '" draggable="false"' + (i < 9 ? '' : ' loading="lazy"') + '></span>';
        ring.appendChild(b); return b;
      });
      dots = list.map(function (it, i) {
        var d = document.createElement('i'); dotsEl.appendChild(d); return d;
      });
      pos = target = 0;
      layoutDots(); measure(); tick(true);
    }

    function archY(t, h) { return (1 - 4 * t * (1 - t)) * h; }
    function layoutDots() {
      var n = list.length, H = 26;
      dots.forEach(function (d, i) {
        var t = n > 1 ? i / (n - 1) : 0.5;
        d.style.left = (t * 100).toFixed(2) + '%'; d.style.top = archY(t, H).toFixed(1) + 'px';
      });
    }

    function measure() {
      var w = stage.clientWidth, m = mobile();
      var fw = m ? clamp(w * 0.46, 150, 220) : clamp(w * 0.19, 170, 250);
      var spacing = fw * (m ? 1.08 : 1.16);
      var stepDeg = m ? 20 : 14;
      var step = stepDeg * Math.PI / 180;
      G = { fw: fw, fh: fw * 1.34, step: step, R: spacing / step, w: w, m: m, spacing: spacing };
      stage.style.setProperty('--fw', fw.toFixed(1) + 'px');
      stage.style.setProperty('--fh', (fw * 1.34).toFixed(1) + 'px');
      stage.style.height = (fw * 1.34 + 120) + 'px';
    }

    function render() {
      var n = list.length;
      if (!n) return;
      var vis = G.m ? 2.4 : 3.6;
      for (var i = 0; i < n; i++) {
        var d = i - pos, ad = Math.abs(d), f = frames[i];
        if (ad > vis + 1.6) { if (f._h !== 1) { f.style.visibility = 'hidden'; f._h = 1; } continue; }
        if (f._h !== 0) { f.style.visibility = 'visible'; f._h = 0; }
        var th = d * G.step * curv;
        var x = d * G.spacing * (1 - curv) + Math.sin(th) * G.R * curv;
        var z = (Math.cos(th) - 1) * G.R * curv;
        var y = d * d * 7 * curv;
        var ry = th * 180 / Math.PI * 1.0;
        var rz = jitter(i) * (0.35 + 0.65 * curv);
        var o = 1 - clamp((ad - vis) / 1.4, 0, 1);
        f.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateY(' + ry.toFixed(2) + 'deg) rotateZ(' + rz.toFixed(2) + 'deg)';
        f.style.opacity = o.toFixed(3);
        f.style.zIndex = 100 - Math.round(ad * 10);
        f.classList.toggle('on', ad < 0.5);
        f.tabIndex = ad < 0.5 ? 0 : -1;
      }
      var cur = clamp(Math.round(pos), 0, n - 1);
      var t = n > 1 ? clamp(pos, 0, n - 1) / (n - 1) : 0.5;
      mk.style.left = (t * 100).toFixed(2) + '%'; mk.style.top = (archY(t, 26) - 6).toFixed(1) + 'px';
      ctEl.textContent = pad(cur + 1) + ' / ' + pad(n);
      nmEl.textContent = list[cur].name;
    }

    function tick(force) {
      cancelAnimationFrame(raf);
      (function loop() {
        var n = list.length;
        target = clamp(target, 0, Math.max(0, n - 1));
        var dp = target - pos, dc = curvT - curv;
        pos += dp * 0.14; curv += dc * 0.12;
        if (Math.abs(dp) < 0.0005) pos = target;
        if (Math.abs(dc) < 0.002) curv = curvT;
        render();
        if (pos !== target || curv !== curvT || dragging) raf = requestAnimationFrame(loop);
      })();
    }
    function go(t) { target = clamp(Math.round(t), 0, list.length - 1); tick(); }

    /* ---- drag / click ---- */
    var dragging = false, sx = 0, sp = 0, moved = 0, lastX = 0, lastT = 0, vel = 0, downIdx = -1;
    stage.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      dragging = true; sx = lastX = e.clientX; sp = pos; moved = 0; vel = 0; lastT = performance.now();
      var f = e.target.closest && e.target.closest('.ga-f'); downIdx = f ? frames.indexOf(f) : -1;
      try { stage.setPointerCapture(e.pointerId); } catch (x) {}
      stage.classList.add('drag'); tick();
    });
    stage.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      var now = performance.now(), dt = Math.max(1, now - lastT);
      vel = vel * 0.6 + ((e.clientX - lastX) / dt) * 0.4; lastX = e.clientX; lastT = now;
      target = pos = clamp(sp - dx / (G.spacing * 0.9), 0, list.length - 1);
    });
    function endDrag(e) {
      if (!dragging) return; dragging = false; stage.classList.remove('drag');
      if (moved < 6) {
        if (downIdx > -1) { if (downIdx === clamp(Math.round(pos), 0, list.length - 1)) openDetail(downIdx); else go(downIdx); }
        else go(pos);
      } else { go(pos - vel * 5); }
    }
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
    stage.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 2) {
        e.preventDefault(); target = clamp(target + e.deltaX / 160, 0, list.length - 1); tick();
        clearTimeout(stage._wt); stage._wt = setTimeout(function () { go(target); }, 140);
      }
    }, { passive: false });
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(Math.round(target) + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(Math.round(target) - 1); }
      else if (e.key === 'Enter') { var f = e.target.closest && e.target.closest('.ga-f'); if (f) { e.preventDefault(); openDetail(frames.indexOf(f)); } }
    });
    [].forEach.call(arc.querySelectorAll('.ga-b'), function (b) {
      b.addEventListener('click', function () { go(Math.round(target) + +b.getAttribute('data-d')); });
    });
    flatBtn.addEventListener('click', function () {
      var flat = curvT === 1; curvT = flat ? 0 : 1;
      flatBtn.textContent = flat ? 'Curve view' : 'Front view'; tick();
    });
    /* ruler scrubbing */
    var scrub = false;
    function scrubTo(e) {
      var r = ruler.getBoundingClientRect(), t = clamp((e.clientX - r.left) / r.width, 0, 1);
      target = t * (list.length - 1); tick();
    }
    ruler.style.pointerEvents = 'auto';
    ruler.addEventListener('pointerdown', function (e) { scrub = true; try { ruler.setPointerCapture(e.pointerId); } catch (x) {} scrubTo(e); });
    ruler.addEventListener('pointermove', function (e) { if (scrub) scrubTo(e); });
    ruler.addEventListener('pointerup', function () { scrub = false; go(target); });
    ruler.addEventListener('pointercancel', function () { scrub = false; go(target); });

    /* ---- filters ---- */
    fs.forEach(function (f) {
      f.addEventListener('click', function () {
        fs.forEach(function (x) { x.classList.remove('on'); }); f.classList.add('on');
        build(f.getAttribute('data-f'));
      });
    });
    window.addEventListener('resize', function () { measure(); tick(); });

    /* ---- detail view ---- */
    var dv = document.createElement('div');
    dv.id = 'gd'; dv.setAttribute('role', 'dialog'); dv.setAttribute('aria-modal', 'true'); dv.setAttribute('aria-label', 'Part detail');
    dv.innerHTML =
      '<button type="button" class="gd-x" aria-label="Back to gallery">' + ARW_L + '</button>' +
      '<a class="gd-q" href="contact.html">Enquire</a>' +
      '<div class="gd-body"><div class="gd-l"><div class="gd-img"><img alt=""></div><div class="gd-th"></div></div>' +
      '<div class="gd-r"><div class="gd-no"></div><div class="gd-nm"></div>' +
      '<dl class="gd-dl"><dt>Group</dt><dd class="d-grp"></dd><dt>Part no.</dt><dd class="d-no"></dd><dt>Process</dt><dd>Plastic injection moulding</dd><dt>Made at</dt><dd>Thirumudivakkam, Chennai</dd></dl>' +
      '<p>Moulded and tried at Sri Kamatchi Toolings, Thirumudivakkam, Chennai.</p></div></div>' +
      '<div class="gd-ft"><button type="button" class="gd-ret">Return to parts</button>' +
      '<div class="gd-nav"><button type="button" data-d="-1" aria-label="Previous part">' + ARW_L + '</button><button type="button" data-d="1" aria-label="Next part">' + ARW_R + '</button></div>' +
      '<span class="gd-ct"></span></div>';
    document.body.appendChild(dv);
    var dI = dv.querySelector('.gd-img img'), dImg = dv.querySelector('.gd-img'), dTh = dv.querySelector('.gd-th');
    var dNo = dv.querySelector('.gd-no'), dNm = dv.querySelector('.gd-nm'), dGrp = dv.querySelector('.d-grp'), dPn = dv.querySelector('.d-no'), dCt = dv.querySelector('.gd-ct');
    var di = 0, lastFocus = null;

    function fillDetail() {
      var it = list[di], n = list.length;
      dI.src = it.src; dI.alt = it.name; dImg.classList.toggle('raw', it.raw);
      dNo.textContent = 'No ' + pad(di + 1) + ' / ' + pad(n);
      dNm.textContent = it.name;
      dGrp.textContent = it.cat; dPn.textContent = 'SKT-' + it.no;
      dCt.textContent = pad(di + 1) + ' / ' + pad(n) + '  ' + it.name;
      var s = clamp(di - 1, 0, Math.max(0, n - 4)), html = '';
      for (var k = s; k < Math.min(n, s + 4); k++) {
        html += '<button type="button" class="' + (k === di ? 'on' : '') + (list[k].raw ? ' raw' : '') + '" data-k="' + k + '" aria-label="' + list[k].name.replace(/"/g, '&quot;') + '"><img src="' + list[k].src + '" alt="" draggable="false"></button>';
      }
      dTh.innerHTML = html;
    }
    function openDetail(i) {
      di = i; lastFocus = document.activeElement; fillDetail();
      dv.classList.add('on'); lockScroll(true); dv.querySelector('.gd-x').focus({ preventScroll: true });
    }
    function closeDetail() {
      dv.classList.remove('on'); lockScroll(false);
      go(di);
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
    function stepDetail(d) {
      di = (di + d + list.length) % list.length;
      dv.classList.add('sw');
      setTimeout(function () { fillDetail(); dv.classList.remove('sw'); }, 150);
    }
    dv.querySelector('.gd-x').addEventListener('click', closeDetail);
    dv.querySelector('.gd-ret').addEventListener('click', closeDetail);
    [].forEach.call(dv.querySelectorAll('.gd-nav button'), function (b) { b.addEventListener('click', function () { stepDetail(+b.getAttribute('data-d')); }); });
    dTh.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      di = +b.getAttribute('data-k'); dv.classList.add('sw');
      setTimeout(function () { fillDetail(); dv.classList.remove('sw'); }, 150);
    });
    document.addEventListener('keydown', function (e) {
      if (!dv.classList.contains('on')) return;
      if (e.key === 'Escape') closeDetail();
      else if (e.key === 'ArrowRight') stepDetail(1);
      else if (e.key === 'ArrowLeft') stepDetail(-1);
    });

    build('all');
  })();
})();
