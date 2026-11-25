/* Sri Kamatchi Toolings - scroll-driven injection mould (inline SVG).
   Closed -> shot fills the cavity -> mould opens -> ejector pins push the part -> part drops out. */
(function () {
  var sec = document.getElementById('flow');
  var host = document.getElementById('mv');
  if (!sec || !host) return;

  function lab(px, py, tx, ty, anchor, txt) {
    return '<g class="L1"><circle cx="' + px + '" cy="' + py + '" r="4" fill="#9b72ff"/><path class="ls" d="M' + px + ' ' + py + ' L' + tx + ' ' + (ty + 4) + '"/>' +
      '<text class="lab" x="' + tx + '" y="' + ty + '" text-anchor="' + anchor + '">' + txt + '</text></g>';
  }

  /* oblique 3D box: top and right faces give the plates real thickness */
  function box(x, y, w, h, ox, oy, front, top, side) {
    return '<polygon points="' + x + ',' + y + ' ' + (x + w) + ',' + y + ' ' + (x + w + ox) + ',' + (y - oy) + ' ' + (x + ox) + ',' + (y - oy) + '" fill="' + top + '" stroke="#ffffff44" stroke-width="1.5"/>' +
      '<polygon points="' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + h) + ' ' + (x + w + ox) + ',' + (y + h - oy) + ' ' + (x + w + ox) + ',' + (y - oy) + '" fill="' + side + '" stroke="#ffffff22" stroke-width="1.5"/>' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="3" fill="' + front + '" stroke="#ffffff44" stroke-width="2"/>' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="3" fill="url(#gHi)"/>';
  }

  var svg =
    '<svg viewBox="20 -30 900 680" role="img" aria-label="Injection mould opening and ejecting a plastic part">' +
    '<defs>' +
    '<linearGradient id="gA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#46526a"/><stop offset="1" stop-color="#1a2030"/></linearGradient>' +
    '<linearGradient id="gB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5f6b84"/><stop offset="1" stop-color="#232b3b"/></linearGradient>' +
    '<linearGradient id="gP" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9b72ff"/><stop offset=".6" stop-color="#7d4fe6"/><stop offset="1" stop-color="#cdb8ff"/></linearGradient>' +
    '<linearGradient id="gS" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff7ab8"/><stop offset="1" stop-color="#9b72ff"/></linearGradient>' +
    '<linearGradient id="gHi" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient><radialGradient id="gSh"><stop offset="0" stop-color="#000" stop-opacity=".65"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
    '</defs>' +
    '<ellipse cx="390" cy="430" rx="380" ry="34" fill="url(#gSh)"/>' +

    /* fixed half (cavity side) */
    '<g id="mfix">' +
    box(60, 60, 250, 330, 50, 38, 'url(#gA)', '#7d8aa6', '#1d2434') +
    '<path d="M250 130 H310 V320 H250 Z" fill="#05070b" opacity=".75"/>' +
    '<path d="M60 218 L250 224 V236 L60 242 Z" fill="#05070b" opacity=".75"/>' +
    '<path id="sprue" d="M60 218 L250 224 V236 L60 242 Z" fill="url(#gS)" style="opacity:var(--fill,0)"/>' +
    '<circle cx="110" cy="105" r="8" fill="none" stroke="#ffc247" stroke-width="3"/><circle cx="110" cy="345" r="8" fill="none" stroke="#ffc247" stroke-width="3"/>' +
    '<circle cx="190" cy="105" r="8" fill="none" stroke="#ffc247" stroke-width="3"/><circle cx="190" cy="345" r="8" fill="none" stroke="#ffc247" stroke-width="3"/>' +
    '<rect x="36" y="212" width="28" height="36" rx="6" fill="#9b72ff"/>' +
    '</g>' +

    /* moving half (core side) */
    '<g id="mmov" class="half">' +
    box(310, 60, 310, 330, 50, 38, 'url(#gB)', '#9aa7c2', '#2a3347') +
    '<rect x="470" y="105" width="130" height="240" rx="8" fill="#05070b" opacity=".7"/>' +
    '<rect x="264" y="144" width="48" height="162" rx="4" fill="#7c879e" stroke="#ffffff44" stroke-width="2"/>' +
    '<circle cx="372" cy="105" r="8" fill="none" stroke="#ffc247" stroke-width="3"/><circle cx="372" cy="345" r="8" fill="none" stroke="#ffc247" stroke-width="3"/>' +
    '<circle cx="440" cy="105" r="8" fill="none" stroke="#ffc247" stroke-width="3"/><circle cx="440" cy="345" r="8" fill="none" stroke="#ffc247" stroke-width="3"/>' +
    '<g id="mej">' +
    '<rect x="548" y="125" width="30" height="200" rx="5" fill="#9b72ff"/>' +
    '<rect x="266" y="173" width="284" height="7" rx="3" fill="#ff7ab8"/><rect x="266" y="270" width="284" height="7" rx="3" fill="#ff7ab8"/>' +
    '</g>' +
    '</g>' +

    /* the part */
    '<g id="mpart"><g id="mpin">' +
    '<path transform="translate(26 -19)" d="M250 130 H310 V144 H264 V306 H310 V320 H250 Z" fill="#5f9a14" style="opacity:var(--fill,0)"/>' +
    '<path transform="translate(13 -9.5)" d="M250 130 H310 V144 H264 V306 H310 V320 H250 Z" fill="#86c71f" style="opacity:var(--fill,0)"/>' +
    '<path d="M250 130 H310 V144 H264 V306 H310 V320 H250 Z" fill="url(#gP)" style="opacity:var(--fill,0)"/>' +
    '</g></g>' +

    /* final product callout */
    '<g id="mfin" style="opacity:var(--fin,0)"><text class="lab" x="280" y="628" text-anchor="middle" style="opacity:1;fill:#fff;font-size:13px">FINISHED PART &middot; FIRST TIME RIGHT</text></g>' +

    lab(100, 230, 90, 28, 'start', 'SPRUE &amp; GATE') +
    lab(280, 135, 250, -4, 'middle', 'CAVITY') +
    lab(300, 300, 380, 430, 'middle', 'CORE') +
    lab(190, 105, 150, 435, 'middle', 'COOLING CHANNEL') +
    lab(563, 130, 560, 28, 'middle', 'EJECTOR PLATE') +
    '</svg>';

  host.insertAdjacentHTML('afterbegin', svg);

  var root = host.querySelector('svg');
  var mov = root.querySelector('#mmov'), ej = root.querySelector('#mej'), part = root.querySelector('#mpart'), pin = root.querySelector('#mpin');
  var state = host.querySelector('.state b');
  var steps = [].slice.call(sec.querySelectorAll('.stp')), bar = sec.querySelector('.pbar');
  var NAMES = ['Closed &middot; filling', 'Opening', 'Ejecting', 'Delivered'];

  var sRY = -24, sRX = 12, mX = 0, mY = 0;
  function applyTilt() { root.style.transform = 'rotateX(' + (sRX + mY).toFixed(2) + 'deg) rotateY(' + (sRY + mX).toFixed(2) + 'deg)'; }
  if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    sec.addEventListener('pointermove', function (e) { mX = (e.clientX / window.innerWidth - .5) * 10; mY = -(e.clientY / window.innerHeight - .5) * 8; applyTilt(); });
  }
  function ss(x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); }

  function upd() {
    var r = sec.getBoundingClientRect(), tot = r.height - window.innerHeight;
    var p = tot > 0 ? Math.max(0, Math.min(1, -r.top / tot)) : 0;
    var fill = ss(p / .14), open = ss((p - .22) / .24), eject = ss((p - .5) / .14), drop = ss((p - .66) / .24), fin = ss((p - .86) / .12);
    var dx = open * 210;
    root.style.setProperty('--fill', fill);
    root.style.setProperty('--fin', fin);
    root.style.setProperty('--lo', 1 - ss((p - .16) / .08));
    [].forEach.call(root.querySelectorAll('.L1'), function (g) { g.style.opacity = 1 - ss((p - .16) / .08); });
    mov.setAttribute('transform', 'translate(' + dx + ' 0)');
    ej.setAttribute('transform', 'translate(' + (-eject * 62) + ' 0)');
    var px = dx - eject * 62 * 0.93 + drop * 6, py = drop * 285;
    var sc = 1 + drop * 0.7;
    part.setAttribute('transform', 'translate(' + px + ' ' + py + ') translate(280 225) scale(' + sc + ') rotate(' + (drop * -4) + ') translate(-280 -225)');
    pin.setAttribute('transform', 'translate(' + (-eject * 0) + ' 0)');
    var k = Math.min(3, Math.floor(p * 4 * 0.999));
    steps.forEach(function (e, i) { e.classList.toggle('on', i === k); });
    if (state) state.innerHTML = NAMES[k];
    if (bar) bar.style.setProperty('--p', p);
    sRY = -24 + p * 18 - open * 0; sRX = 12 - p * 5; applyTilt();
  }
  var ticking = false;
  function req() { if (ticking) return; ticking = true; requestAnimationFrame(function () { ticking = false; upd(); }); }
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', req);
  upd();
})();
