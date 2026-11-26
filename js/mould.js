/* Sri Kamatchi Toolings - scroll-driven 3D injection mould (three.js).
   Blueprint exploded view -> parts fly in and join -> mould opens and ejects the part -> mould closes and joins again. */
(function () {
  var sec = document.getElementById('flow');
  var host = document.getElementById('mv');
  if (!sec || !host) return;

  function fallback() { var s = document.createElement('script'); s.src = 'js/mould2d.js'; document.body.appendChild(s); }
  if (!window.THREE) { fallback(); return; }
  var T = THREE, renderer;
  try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch (e) { fallback(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  host.insertBefore(renderer.domElement, host.firstChild);

  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(32, 1, 0.1, 100);
  var root = new T.Group(); scene.add(root);

  /* ---------- lights ---------- */
  scene.add(new T.AmbientLight(0xffffff, 0.42));
  scene.add(new T.HemisphereLight(0xd9d0ff, 0x1b1536, 0.7));
  var key = new T.DirectionalLight(0xffffff, 1.25); key.position.set(4, 7, 6); scene.add(key);
  var rimL = new T.PointLight(0x9b72ff, 1.1, 26); rimL.position.set(-6, 2, 4); scene.add(rimL);
  var rimP = new T.PointLight(0xffb62e, 0.55, 26); rimP.position.set(8, -2, -6); scene.add(rimP);

  /* ---------- materials ---------- */
  function std(c, m, r, extra) { var o = { color: c, metalness: m, roughness: r, transparent: true }; for (var k in extra) o[k] = extra[k]; return new T.MeshStandardMaterial(o); }
  var mSteel = std(0x7d8aa3, 0.55, 0.4), mDark = std(0x4a566c, 0.6, 0.45), mPin = std(0xe3e9f4, 0.8, 0.25);
  var mLime = std(0x9b72ff, 0.25, 0.4, { emissive: 0x4a1fb8, emissiveIntensity: 0.45 });
  var mPart = std(0xffb62e, 0.15, 0.4, { emissive: 0x9a5a00, emissiveIntensity: 0.3 });
  var mPocket = std(0x0c0a1c, 0.3, 0.8);
  var mats = [mSteel, mDark, mPin, mLime, mPart, mPocket];
  var edgeMat = new T.LineBasicMaterial({ color: 0x9b72ff, transparent: true, opacity: 0.9 });

  /* ---------- parts ---------- */
  var items = [];
  function mk(geo, mat, b, e, r, grp) {
    var m = new T.Mesh(geo, mat);
    m.add(new T.LineSegments(new T.EdgesGeometry(geo, 25), edgeMat));
    m.userData = { b: new T.Vector3(b[0], b[1], b[2]), e: new T.Vector3(e[0], e[1], e[2]), r: r || [0, 0, 0], g: grp, ph: Math.random() * 6.28 };
    root.add(m); items.push(m); return m;
  }
  function box(w, h, d) { return new T.BoxGeometry(w, h, d); }
  function cylX(r, len) { var g = new T.CylinderGeometry(r, r, len, 28); g.rotateZ(Math.PI / 2); return g; }

  var sprue = mk(cylX(0.17, 0.75), mLime, [-2.3, 0, 0], [-2.2, 0.2, 0], [0, 0, 0.6], 'fix');
  var fixClamp = mk(box(0.4, 3, 3), mDark, [-1.95, 0, 0], [-1.7, 0.2, -0.4], [0, 0.25, 0], 'fix');
  var cavPlate = mk(box(0.9, 3, 3), mSteel, [-1.3, 0, 0], [-1.0, -0.2, 0.5], [0, -0.2, 0], 'fix');
  var pocket = mk(box(0.03, 1.9, 1.9), mPocket, [-0.842, 0, 0], [-1.0, -0.2, 0.5], [0, -0.2, 0], 'fix');
  var corePlate = mk(box(0.9, 3, 3), mSteel, [-0.4, 0, 0], [0.1, 0.5, 0], [0, 0.15, 0], 'mov');
  var coreBlk = mk(box(0.4, 1.7, 1.7), mDark, [-1.05, 0, 0], [-0.4, 1.3, -1.6], [0.3, 0, 0.3], 'mov');
  var spTop = mk(box(0.95, 0.55, 3), mDark, [0.525, 1.225, 0], [0.8, 1.5, 0], [0, 0, 0], 'mov');
  var spBot = mk(box(0.95, 0.55, 3), mDark, [0.525, -1.225, 0], [0.8, -1.5, 0], [0, 0, 0], 'mov');
  var ejPlate = mk(box(0.25, 2.0, 2.0), mLime, [0.45, 0, 0], [1.5, 0, 0.6], [0, -0.3, 0], 'ej');
  var mvClamp = mk(box(0.4, 3, 3), mDark, [1.2, 0, 0], [2.4, -0.3, -0.5], [0, -0.25, 0], 'mov');
  var pillars = [];
  [[1.25, 1.25], [1.25, -1.25], [-1.25, 1.25], [-1.25, -1.25]].forEach(function (p) {
    pillars.push(mk(cylX(0.12, 3.0), mPin, [-0.2, p[0], p[1]], [0.2, p[0] * 1.5, p[1] * 1.5], [0, 0, 0], 'fix'));
  });
  [[0.5, 0.5], [0.5, -0.5], [-0.5, 0.5], [-0.5, -0.5]].forEach(function (p) {
    mk(cylX(0.045, 0.95), mPin, [-0.78, p[0], p[1]], [0.9, p[0] * 3, p[1] * 3], [0, 0, 0], 'ej');
  });

  /* the moulded part: a rounded cover with holes and a slot */
  (function () {
    var w = 0.88, r = 0.24, sh = new T.Shape();
    sh.moveTo(-w + r, -w); sh.lineTo(w - r, -w); sh.quadraticCurveTo(w, -w, w, -w + r); sh.lineTo(w, w - r); sh.quadraticCurveTo(w, w, w - r, w);
    sh.lineTo(-w + r, w); sh.quadraticCurveTo(-w, w, -w, w - r); sh.lineTo(-w, -w + r); sh.quadraticCurveTo(-w, -w, -w + r, -w);
    [[0.5, 0.5], [-0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]].forEach(function (p) { var h = new T.Path(); h.absarc(p[0], p[1], 0.1, 0, Math.PI * 2, true); sh.holes.push(h); });
    var slot = new T.Path(); slot.moveTo(-0.3, -0.09); slot.lineTo(0.3, -0.09); slot.lineTo(0.3, 0.09); slot.lineTo(-0.3, 0.09); slot.lineTo(-0.3, -0.09); sh.holes.push(slot);
    var g = new T.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.035, bevelSegments: 2, curveSegments: 10 });
    g.translate(0, 0, -0.05); g.rotateY(Math.PI / 2);
    window.__skPart = mk(g, mPart, [-1.37, 0, 0], [0, 1.9, 2.0], [0.4, 0.6, 0.2], 'part');
  })();
  var part = window.__skPart;

  /* floor shadow */
  var shadow;
  (function () {
    var c = document.createElement('canvas'); c.width = c.height = 256; var x = c.getContext('2d');
    var g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(0,0,0,.75)'); g.addColorStop(.55, 'rgba(0,0,0,.28)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    shadow = new T.Mesh(new T.PlaneGeometry(9, 5), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.set(0.2, -1.78, 0); root.add(shadow);
    var ring = new T.Mesh(new T.RingGeometry(2.55, 2.58, 96), new T.MeshBasicMaterial({ color: 0x9b72ff, transparent: true, opacity: 0.35, side: T.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(0.2, -1.77, 0); root.add(ring); shadow.userData.ring = ring;
  })();

  /* ---------- call-out labels ---------- */
  var LAB = [[fixClamp, 'Fixed clamp plate'], [cavPlate, 'Cavity plate'], [corePlate, 'Core plate'], [ejPlate, 'Ejector plate'], [pillars[0], 'Guide pillar'], [sprue, 'Sprue bushing'], [part, 'Moulded part']];
  var labels = LAB.map(function (l, i) { var d = document.createElement('div'); d.className = 'm3l'; d.textContent = l[1]; host.appendChild(d); return { m: l[0], el: d, dy: (i % 3) * 0.7 }; });
  var v3 = new T.Vector3();

  /* ---------- state ---------- */
  var state = host.querySelector('.state b');
  var steps = [].slice.call(sec.querySelectorAll('.stp')), bar = sec.querySelector('.pbar');
  var NAMES = ['Blueprint', 'Assembling', 'Opening &middot; ejecting', 'Closed &middot; delivered'];
  var p = 0, mx = 0, my = 0, time = 0, W = 0, H = 0, visible = true;

  function ss(x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function resize() {
    W = host.clientWidth || 600; H = renderer.domElement.clientHeight || 480;
    renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
    labels.forEach(function (l, i) { l.el.style.display = (W < 560 && (i === 0 || i === 2 || i === 5)) ? 'none' : ''; });
  }

  function scrollP() {
    var r = sec.getBoundingClientRect(), tot = r.height - window.innerHeight;
    p = tot > 0 ? Math.max(0, Math.min(1, -r.top / tot)) : 0;
  }

  function frame(t) {
    time = t * 0.001;
    var E = p < 0.04 ? 1.15 : 1.15 * (1 - ss((p - 0.25) / 0.23));
    if (p < 0.25) E = 1.15 + Math.sin(time * 1.1) * 0.04;
    var open = ss((p - 0.5) / 0.09) * (1 - ss((p - 0.78) / 0.14));
    var eject = ss((p - 0.6) / 0.06) * (1 - ss((p - 0.7) / 0.05));
    var dd = ss((p - 0.68) / 0.12);
    var D = 2.5 * open, ejD = -0.28 * eject;
    var solid = ss((p - 0.03) / 0.22);

    mats.forEach(function (m) { m.opacity = lerp(0.2, 1, solid); });
    edgeMat.opacity = lerp(0.95, 0.22, solid) * 1;

    items.forEach(function (m) {
      var u = m.userData, f = Math.sin(time * 1.3 + u.ph) * 0.07 * Math.min(1, E);
      var gx = u.g === 'mov' || u.g === 'ej' ? D : 0;
      if (u.g === 'ej') gx += ejD;
      if (u.g === 'part') return;
      m.position.set(u.b.x + gx + u.e.x * E, u.b.y + u.e.y * E + f, u.b.z + u.e.z * E);
      m.rotation.set(u.r[0] * E, u.r[1] * E, u.r[2] * E);
    });

    /* the part: carried on the core, pushed off by the pins, then presented on the floor */
    var u = part.userData, f = Math.sin(time * 1.3 + u.ph) * 0.07 * Math.min(1, E);
    var cx = u.b.x + D + ejD + u.e.x * E, cy = u.b.y + u.e.y * E + f, cz = u.b.z + u.e.z * E;
    var dispX = 2.5, dispY = -1.0, dispZ = 1.5;
    part.position.set(lerp(cx, dispX, dd), lerp(cy, dispY, dd) + Math.sin(dd * Math.PI) * 0.5, lerp(cz, dispZ, dd));
    part.rotation.set(u.r[0] * E + dd * -0.18, u.r[1] * E + dd * (-1.571 + 0.55 + Math.sin(time * 0.9) * 0.28), u.r[2] * E);
    var sc = 1 + dd * 0.05; part.scale.set(sc, sc, sc);
    mPart.emissiveIntensity = 0.3 + Math.sin(time * 3) * 0.06;

    /* camera and whole-assembly rotation */
    var span = 1 + E * 0.38 + open * 0.2;
    var narrow = W < 520 ? 1.5 : 1;
    camera.position.set(0.2, 1.3 + E * 0.4, 12.4 * span * narrow);
    camera.lookAt(0.3, -0.1 - dd * 0.15, 0);
    var ry = -0.62 + Math.sin(p * 6.28) * 0.12 + mx * 0.35 + ss((p - 0.82) / 0.18) * 0.55 + E * 0.18;
    var rx = 0.2 + my * 0.18 - dd * 0.04;
    root.rotation.set(rx, ry, 0);
    root.position.x = -0.45 - open * 0.7;
    shadow.material.opacity = 0.4 + (1 - E) * 0.6;
    var bump = function (a, b, c) { return ss((p - a) / (b - a)) * (1 - ss((p - b) / (c - b))); };
    var pulse = Math.max(bump(0.44, 0.5, 0.57), bump(0.84, 0.9, 0.97));
    shadow.userData.ring.material.opacity = 0.15 + dd * 0.25 + pulse * 0.7;
    shadow.userData.ring.scale.setScalar(1 + pulse * 0.55);

    /* labels */
    var lv = 1 - ss((p - 0.2) / 0.12);
    root.updateMatrixWorld(true);
    labels.forEach(function (l) {
      l.m.getWorldPosition(v3); v3.y += 1.95 + l.dy; v3.project(camera);
      l.el.style.opacity = lv > 0.02 ? lv : 0;
      l.el.style.transform = 'translate(' + ((v3.x * 0.5 + 0.5) * W).toFixed(1) + 'px,' + ((-v3.y * 0.5 + 0.5) * H).toFixed(1) + 'px) translate(-50%,-100%)';
    });

    renderer.render(scene, camera);
  }

  function ui() {
    var k = Math.min(3, Math.floor(p * 4 * 0.999));
    steps.forEach(function (e, i) { e.classList.toggle('on', i === k); });
    if (state) state.innerHTML = NAMES[k];
    if (bar) bar.style.setProperty('--p', p);
  }

  function loop(t) { requestAnimationFrame(loop); if (!visible) return; scrollP(); ui(); frame(t); }

  window.addEventListener('resize', resize);
  if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    sec.addEventListener('pointermove', function (e) { mx = (e.clientX / window.innerWidth - 0.5) * 2; my = (e.clientY / window.innerHeight - 0.5) * 2; });
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { rootMargin: '200px 0px' }).observe(sec);
  }
  resize(); requestAnimationFrame(loop);
})();
