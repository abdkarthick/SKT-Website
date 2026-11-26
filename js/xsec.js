/* Sri Kamatchi Toolings - mould cross-section blueprint (scroll-driven SVG).
   The mould is drawn line by line, closed, filled with plastic, cooled, opened, and the part is ejected. */
(function () {
  var sec = document.getElementById('xsec');
  var host = sec && sec.querySelector('.xs-host');
  if (!host) return;

  var n = 0;
  function ln(d, extra) { return '<path class="ln" pathLength="1" data-o="' + (n++) + '" d="' + d + '"' + (extra || '') + '/>'; }
  function pl(d) { return '<path class="pl" d="' + d + '"/>' + ln(d); }
  function ch(cx, cy) { return '<circle class="ln ch" pathLength="1" data-o="' + (n++) + '" cx="' + cx + '" cy="' + cy + '" r="7"/>'; }
  function lab(px, py, ex, ey, tx, ty, anchor, txt) {
    return '<g class="lb"><circle cx="' + px + '" cy="' + py + '" r="3.2"/><path d="M' + px + ' ' + py + ' L' + ex + ' ' + ey + '"/><text x="' + tx + '" y="' + ty + '" text-anchor="' + anchor + '">' + txt + '</text></g>';
  }
  var PART = 'M170 170 V390 H210 V365 H185 V195 H210 V170 Z';
  var SPRUE = 'M60 270 L170 276 V284 L60 290 Z';

  var svg =
    '<svg class="xsvg" viewBox="0 -100 800 720" role="img" aria-label="Cross-section of an injection mould: the plastic is injected, cools, the mould opens and the part is ejected" preserveAspectRatio="xMidYMid meet">' +
    '<defs><clipPath id="xcs"><rect id="xcsr" x="60" y="260" width="0" height="40"/></clipPath>' +
    '<clipPath id="xcc"><rect id="xccr" x="160" y="280" width="60" height="0"/></clipPath></defs>' +
    '<g transform="translate(100,20)">' +
    '<path id="xcl" class="cl" d="M20 280 H640"/>' +
    /* fixed half */
    '<g id="gFix">' + pl('M60 60 H100 V500 H60 Z') + pl('M100 60 H210 V170 H170 V390 H210 V500 H100 Z') + ln(SPRUE) + ch(140, 115) + ch(140, 445) + '</g>' +
    /* moving half */
    '<g id="gMov">' + pl('M210 60 H290 V500 H210 V365 H185 V195 H210 Z') + pl('M290 60 H365 V100 H290 Z') + pl('M290 460 H365 V500 H290 Z') + pl('M365 60 H405 V500 H365 Z') + ch(250, 115) + ch(250, 445) +
      '<g id="gEj">' + pl('M320 120 H345 V440 H320 Z') + pl('M345 120 H365 V440 H345 Z') + pl('M210 178 H320 V186 H210 Z') + pl('M210 374 H320 V382 H210 Z') + '</g></g>' +
    /* tray */
    '<g id="gTray"><path d="M215 552 H405" class="tray"/><path d="M225 552 V566 M395 552 V566" class="tray"/></g>' +
    /* plastic */
    '<g id="gPart"><path id="pSp" class="pp" clip-path="url(#xcs)" d="' + SPRUE + '"/><path id="pCv" class="pp" clip-path="url(#xcc)" d="' + PART + '"/></g>' +
    /* labels */
    '<g id="gLab">' +
      lab(80, 280, -5, 280, -12, 284, 'end', 'SPRUE') +
      lab(190, 182, 190, 44, 190, 30, 'middle', 'CAVITY') +
      lab(250, 115, 350, 44, 350, 30, 'middle', 'COOLING CHANNEL') +
      lab(332, 130, 440, 130, 448, 134, 'start', 'EJECTOR PLATE') +
      lab(265, 378, 300, 536, 300, 554, 'middle', 'EJECTOR PIN') +
      lab(197, 340, 140, 536, 140, 554, 'middle', 'CORE') +
    '</g>' +
    '<g id="gWall" class="lb"><circle cx="180" cy="182" r="3.2"/><path d="M180 182 L-5 182"/><text x="-12" y="186" text-anchor="end">WALL THICKNESS CHECKED &#10003;</text></g>' +
    '<text id="xtemp" class="tt" x="470" y="30"></text>' +
    '<text id="xfin" class="tt fin" x="310" y="598" text-anchor="middle">PART READY &#10003;</text>' +
    '</g></svg>';
  host.insertAdjacentHTML('afterbegin', svg);

  var S = host.querySelector('svg');
  function $(id) { return S.querySelector('#' + id); }
  var lines = [].slice.call(S.querySelectorAll('.ln')), fills = [].slice.call(S.querySelectorAll('.pl'));
  var gMov = $('gMov'), gEj = $('gEj'), gPart = $('gPart'), gLab = $('gLab'), gWall = $('gWall'), gTray = $('gTray');
  var xcsr = $('xcsr'), xccr = $('xccr'), xtemp = $('xtemp'), xfin = $('xfin'), xcl = $('xcl'), pp = [].slice.call(S.querySelectorAll('.pp'));
  var chs = [].slice.call(S.querySelectorAll('.ch'));
  var steps = [].slice.call(sec.querySelectorAll('.stp')), bar = sec.querySelector('.pbar'), capEl = sec.querySelector('.xs-cap');

  function cl(x, a, b) { return x < a ? a : x > b ? b : x; }
  function ss(x) { x = cl(x, 0, 1); return x * x * (3 - 2 * x); }
  function mix(a, b, t) { return Math.round(a + (b - a) * t); }

  var lastKey = '';
  function caption(p) {
    var i = p < 0.25 ? 0 : p < 0.5 ? 1 : p < 0.75 ? 2 : 3, t;
    if (i === 0) t = 'The mould is drawn as a section: cavity, core, sprue, cooling channels and ejector pins.';
    else if (i === 1) t = p < 0.38 ? 'Steel plates are machined and the cooling channels are drilled.' : 'Mould closed for the trial: hot plastic is injected through the sprue.';
    else if (i === 2) t = 'Plastic cools and sets in the cavity. Wall thickness is checked.';
    else t = p < 0.85 ? 'The mould opens and the part stays on the core.' : p < 0.93 ? 'Ejector pins push the part off the core.' : 'The part drops out onto the tray, ready for the next shot.';
    var key = i + t; if (key === lastKey) return; lastKey = key;
    if (capEl) capEl.textContent = t;
    steps.forEach(function (s, k) { s.classList.toggle('on', k === i); });
  }

  function draw(p, tm) {
    var k;
    for (k = 0; k < lines.length; k++) {
      var o = +lines[k].getAttribute('data-o');
      lines[k].style.strokeDashoffset = (1 - cl((p / 0.2 - o * 0.045) / 0.55, 0, 1)).toFixed(3);
    }
    var fo = ss((p - 0.2) / 0.12) * 0.34; for (k = 0; k < fills.length; k++) fills[k].style.fillOpacity = fo.toFixed(3);
    xcl.style.opacity = (1 - ss((p - 0.2) / 0.1)) * 0.8;
    gLab.style.opacity = (ss((p - 0.1) / 0.1) * (1 - ss((p - 0.44) / 0.06))).toFixed(3);
    gWall.style.opacity = (ss((p - 0.55) / 0.05) * (1 - ss((p - 0.76) / 0.04))).toFixed(3);
    /* injection */
    var f1 = ss((p - 0.38) / 0.06), g = ss((p - 0.43) / 0.07);
    xcsr.setAttribute('width', (110 * f1).toFixed(1));
    xccr.setAttribute('y', (280 - 112 * g).toFixed(1)); xccr.setAttribute('height', (224 * g).toFixed(1));
    /* cooling: hot amber -> orchid -> cool lilac */
    var c = ss((p - 0.5) / 0.22), q = c < 0.5 ? c * 2 : (c - 0.5) * 2;
    var A = c < 0.5 ? [255, 170, 60] : [214, 130, 232], B = c < 0.5 ? [214, 130, 232] : [160, 140, 255];
    var col = 'rgb(' + mix(A[0], B[0], q) + ',' + mix(A[1], B[1], q) + ',' + mix(A[2], B[2], q) + ')';
    for (k = 0; k < pp.length; k++) pp[k].style.fill = col;
    var T = Math.round(230 - 190 * c);
    xtemp.textContent = 'PLASTIC ' + T + '°C'; xtemp.style.opacity = (ss((p - 0.4) / 0.05) * (1 - ss((p - 0.78) / 0.05))).toFixed(3);
    var pulse = 0.5 + 0.5 * Math.sin(tm * 4);
    for (k = 0; k < chs.length; k++) {
      chs[k].style.stroke = c > 0.02 ? 'rgb(130,200,255)' : '';
      chs[k].style.strokeWidth = c > 0.02 && c < 1 ? (1.6 + 1.6 * pulse).toFixed(2) : '';
    }
    /* opening, ejecting, dropping */
    var D = 200 * ss((p - 0.75) / 0.1), E = 30 * ss((p - 0.86) / 0.05), F = 155 * ss((p - 0.92) / 0.08);
    gMov.setAttribute('transform', 'translate(' + D.toFixed(1) + ',0)');
    gEj.setAttribute('transform', 'translate(' + (-E).toFixed(1) + ',0)');
    gPart.setAttribute('transform', 'translate(' + (D - E).toFixed(1) + ',' + F.toFixed(1) + ')');
    gTray.style.opacity = ss((p - 0.85) / 0.06).toFixed(3);
    xfin.style.opacity = ss((p - 0.97) / 0.03).toFixed(3);
    if (bar) bar.style.setProperty('--p', p.toFixed(3));
    caption(p);
  }

  var target = 0, cur = 0, raf = 0, t0 = performance.now();
  function prog() { var r = sec.getBoundingClientRect(), tot = r.height - window.innerHeight; return tot > 0 ? cl(-r.top / tot, 0, 1) : 0; }
  function loop(now) {
    raf = 0; target = prog(); cur += (target - cur) * 0.16; if (Math.abs(target - cur) < 0.0004) cur = target;
    draw(cur, (now - t0) / 1000);
    var r = sec.getBoundingClientRect();
    if (r.bottom > 0 && r.top < window.innerHeight && !document.hidden) raf = requestAnimationFrame(loop);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(loop); }
  window.addEventListener('scroll', kick, { passive: true }); window.addEventListener('resize', kick);
  cur = prog(); draw(cur, 0); kick();
})();
