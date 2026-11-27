/* SKT About hero 3D: "Iris mould opens, iris mould closes".
   Six steel segments slide radially outward like a collet, an ember-orange gear is revealed and
   lifts toward the viewer, a scan ring sweeps over it, then the segments snap shut with a clamp pulse.
   Starts by opening, ends by closing, then repeats. No text anywhere. Pointer tilts the scene.
   Works on the host #ab3 (about page). */
(function () {
  'use strict';
  var host = document.getElementById('ab3');
  if (!host) return;
  if (!window.THREE) { host.classList.add('nogl'); return; }
  var T = THREE, renderer;
  try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { host.classList.add('nogl'); return; }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  host.insertBefore(renderer.domElement, host.firstChild);

  var scene = new T.Scene(), camera = new T.PerspectiveCamera(32, 1, 0.1, 80);
  camera.position.set(0, 0.6, 16); camera.lookAt(0, 0, 0);
  scene.add(new T.HemisphereLight(0xdff3f6, 0x16414c, 1.25));
  var key = new T.DirectionalLight(0xffffff, 1.2); key.position.set(3, 6, 9); scene.add(key);
  var rim = new T.PointLight(0x7fc3cf, 1.4, 34); rim.position.set(-7, 3, -3); scene.add(rim);
  var core = new T.PointLight(0xff6a33, 0.4, 10); core.position.set(0, 0, 1.4); scene.add(core);
  var root = new T.Group(); scene.add(root);

  function mat(c, m, r, o) {
    return new T.MeshStandardMaterial({ color: c, metalness: m, roughness: r, transparent: o != null, opacity: o == null ? 1 : o, depthWrite: o == null });
  }

  /* ---------- six annular segments ---------- */
  var R0 = 0.95, R1 = 2.35, SPAN = Math.PI / 3 - 0.07, DEPTH = 0.75, N = 6, i;
  function segGeo() {
    var s = new T.Shape(), a = SPAN / 2;
    s.absarc(0, 0, R1, -a, a, false);
    s.absarc(0, 0, R0, a, -a, true);
    s.closePath();
    var g = new T.ExtrudeGeometry(s, { depth: DEPTH, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1, curveSegments: 14 });
    g.translate(0, 0, -DEPTH / 2);
    return g;
  }
  var sg = segGeo(), segs = [], edgeMats = [], ring = new T.Group(); root.add(ring);
  for (i = 0; i < N; i++) {
    var dark = i % 2 === 0;
    var m = new T.Mesh(sg, mat(dark ? 0x1f4650 : 0x6ea3b0, 0.5, 0.38, dark ? 0.94 : 0.8));
    var em = new T.LineBasicMaterial({ color: 0xbfe3ea, transparent: true, opacity: 0.75 });
    m.add(new T.LineSegments(new T.EdgesGeometry(sg, 25), em)); edgeMats.push(em);
    /* ember bolt on each segment, on the front face */
    var b = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 0.05, 14), new T.MeshBasicMaterial({ color: 0xff6a33 }));
    b.rotation.x = Math.PI / 2; b.position.set(1.8, 0, DEPTH / 2 + 0.05); m.add(b);
    var pivot = new T.Group(); pivot.rotation.z = i * Math.PI / 3; pivot.add(m); ring.add(pivot);
    segs.push(m);
  }

  /* backing disc + outer ring */
  var back = new T.Mesh(new T.CylinderGeometry(2.45, 2.45, 0.12, 64), mat(0x0e3541, 0.4, 0.5, 0.9));
  back.rotation.x = Math.PI / 2; back.position.z = -0.62; root.add(back);
  var outer = new T.Mesh(new T.TorusGeometry(2.62, 0.04, 8, 96), new T.MeshBasicMaterial({ color: 0xff6a33, transparent: true, opacity: 0.8 }));
  root.add(outer);
  var outer2 = new T.Mesh(new T.TorusGeometry(3.05, 0.02, 8, 96), new T.MeshBasicMaterial({ color: 0x7fc3cf, transparent: true, opacity: 0.4 }));
  root.add(outer2);

  /* ---------- the part: a spur gear ---------- */
  function gearShape(ro, rr, n, bore) {
    var s = new T.Shape(), k, a, step = Math.PI * 2 / n;
    for (k = 0; k < n; k++) {
      a = k * step;
      [[a, rr], [a + step * 0.16, rr], [a + step * 0.3, ro], [a + step * 0.56, ro], [a + step * 0.7, rr]].forEach(function (q, j) {
        var x = Math.cos(q[0]) * q[1], y = Math.sin(q[0]) * q[1];
        if (k === 0 && j === 0) s.moveTo(x, y); else s.lineTo(x, y);
      });
    }
    s.closePath();
    var h = new T.Path(); h.absarc(0, 0, bore, 0, Math.PI * 2, true); s.holes.push(h);
    for (k = 0; k < 6; k++) { var p = new T.Path(), aa = k / 6 * Math.PI * 2 + 0.26; p.absarc(Math.cos(aa) * rr * 0.58, Math.sin(aa) * rr * 0.58, 0.1, 0, Math.PI * 2, true); s.holes.push(p); }
    return s;
  }
  var orange = new T.MeshStandardMaterial({ color: 0xff6a33, emissive: 0xff5a1f, emissiveIntensity: 0.15, metalness: 0.2, roughness: 0.45 });
  var gGeo = new T.ExtrudeGeometry(gearShape(0.92, 0.74, 14, 0.2), { depth: 0.32, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1, curveSegments: 6 });
  gGeo.translate(0, 0, -0.16);
  var gearPivot = new T.Group(); root.add(gearPivot);
  var gear = new T.Mesh(gGeo, orange); gearPivot.add(gear);
  var gearGlow = new T.Mesh(new T.CircleGeometry(1.5, 48), new T.MeshBasicMaterial({ color: 0xff6a33, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
  gearGlow.position.z = -0.45; root.add(gearGlow);

  /* scan ring: a thin ring that expands over the gear while open */
  var scan = new T.Mesh(new T.RingGeometry(0.98, 1.0, 72), new T.MeshBasicMaterial({ color: 0xffd2bb, transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending }));
  scan.position.z = 0.3; root.add(scan);

  /* clamp shockwaves */
  var waves = [];
  [0xff8a4a, 0x7fc3cf].forEach(function (c) {
    var w = new T.Mesh(new T.RingGeometry(0.96, 1.0, 80), new T.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending }));
    root.add(w); waves.push(w);
  });

  /* clamp sparks */
  var SN = 70, sp = new Float32Array(SN * 3), sd = [];
  for (i = 0; i < SN; i++) sd.push([Math.random() * Math.PI * 2, 0.8 + Math.random() * 1.6, (Math.random() - 0.3) * 0.9]);
  var sGeo = new T.BufferGeometry(); sGeo.setAttribute('position', new T.BufferAttribute(sp, 3));
  var sparks = new T.Points(sGeo, new T.PointsMaterial({ color: 0xffa070, size: 0.07, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
  root.add(sparks);

  /* ambient dust */
  var DN = 46, dp = new Float32Array(DN * 3), dv = [];
  for (i = 0; i < DN; i++) dv.push([(Math.random() - 0.5) * 8, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 4, Math.random() * 6.28]);
  var dGeo = new T.BufferGeometry(); dGeo.setAttribute('position', new T.BufferAttribute(dp, 3));
  var dust = new T.Points(dGeo, new T.PointsMaterial({ color: 0x9fd6e0, size: 0.045, transparent: true, opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending }));
  scene.add(dust);

  function ss(a, b, x) { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); }
  var CYC = 9.6, T_OPEN0 = 0.8, T_OPEN1 = 3.1, T_CLOSE0 = 6.2, T_CLOSE1 = 8.2;
  var mx = 0, my = 0, tx = 0, ty = 0, spin = 0, last = 0;
  var cEdge = new T.Color(0xbfe3ea), hEdge = new T.Color(0xff6a33), tmp = new T.Color();

  function frame(t) {
    var dt = Math.min(0.1, Math.max(0, t - last)); last = t;
    var c = t % CYC;
    var op = ss(T_OPEN0, T_OPEN1, c);
    var cl = Math.pow(ss(T_CLOSE0, T_CLOSE1, c), 1.7);
    var open = op * (1 - cl);

    /* segments slide outward along their own radial axis and the whole ring twists a little */
    for (var k = 0; k < N; k++) segs[k].position.x = open * 1.3;
    ring.rotation.z = open * 0.45 + Math.sin(t * 0.3) * 0.02;

    var ct = c - T_CLOSE1, hit = ct >= 0 && ct < 1.4 ? ct / 1.4 : (c < 0.6 ? 0 : -1);
    var flash = hit >= 0 ? Math.pow(1 - hit, 2) : 0;
    var shake = hit >= 0 && hit < 0.35 ? (1 - hit / 0.35) * 0.05 : 0;

    /* gear spins faster and lifts toward the viewer when open */
    spin += dt * (0.3 + 1.8 * open);
    gear.rotation.z = spin;
    gearPivot.position.z = open * 0.9 + Math.sin(t * 1.4) * 0.05 * open;
    gearPivot.rotation.x = Math.sin(t * 0.8) * 0.12 * open;
    var gs = 0.7 + 0.45 * open;
    gearPivot.scale.setScalar(gs);
    orange.emissiveIntensity = 0.12 + 0.18 * open + flash * 0.5;
    core.intensity = 0.3 + 0.5 * open + flash * 1.6;
    gearGlow.material.opacity = 0.16 * open + flash * 0.4; gearGlow.scale.setScalar(0.8 + open * 0.5);

    /* scan ring */
    var sc = ss(3.4, 5.9, c), sw = sc > 0 && sc < 1 ? Math.sin(sc * Math.PI) : 0;
    scan.scale.setScalar(0.6 + sc * 1.6); scan.material.opacity = 0.9 * sw * open;

    for (k = 0; k < N; k++) { tmp.copy(cEdge).lerp(hEdge, flash); edgeMats[k].color.copy(tmp); edgeMats[k].opacity = 0.75 + flash * 0.25; }

    waves.forEach(function (w, idx) {
      var on = hit >= 0 && hit < 0.9 - idx * 0.1;
      var u = hit >= 0 ? Math.min(1, Math.max(0, (hit - idx * 0.08) / (0.9 - idx * 0.1))) : 1;
      w.scale.setScalar(1.6 + u * (idx ? 2.6 : 3.4)); w.material.opacity = on ? (1 - u) * 0.85 : 0;
    });
    var pa = sGeo.attributes.position.array, su = hit >= 0 ? hit : 1;
    for (k = 0; k < SN; k++) {
      var q = sd[k], r = 1.4 + su * q[1] * 1.8;
      pa[k * 3] = Math.cos(q[0]) * r; pa[k * 3 + 1] = Math.sin(q[0]) * r; pa[k * 3 + 2] = q[2] * su;
    }
    sGeo.attributes.position.needsUpdate = true;
    sparks.material.opacity = hit >= 0 && hit < 0.75 ? (1 - hit / 0.75) * 0.95 : 0;

    var da = dGeo.attributes.position.array;
    for (k = 0; k < DN; k++) {
      var d = dv[k];
      da[k * 3] = d[0] + Math.sin(t * 0.2 + d[3]) * 0.3;
      da[k * 3 + 1] = d[1] + Math.sin(t * 0.35 + d[3] * 2) * 0.35;
      da[k * 3 + 2] = d[2];
    }
    dGeo.attributes.position.needsUpdate = true;

    tx += (mx - tx) * 0.06; ty += (my - ty) * 0.06;
    root.rotation.y = 0.38 + tx * 0.4 + Math.sin(t * 0.25) * 0.08;
    root.rotation.x = -0.22 - ty * 0.25;
    root.position.x = Math.sin(t * 90) * shake;
    root.position.y = Math.cos(t * 83) * shake;
    outer.rotation.z = -t * 0.12; outer2.rotation.z = t * 0.08;
  }

  function size() {
    var w = host.clientWidth || 400, h = host.clientHeight || 420;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  size(); window.addEventListener('resize', size);
  if (window.ResizeObserver) new ResizeObserver(size).observe(host);
  window.addEventListener('pointermove', function (e) { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });

  var vis = true, t0 = performance.now();
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(host);
  if (reduce) { frame(4.2); renderer.render(scene, camera); return; }
  (function loop(now) {
    requestAnimationFrame(loop);
    if (!vis || document.hidden) return;
    frame((now - t0) / 1000); renderer.render(scene, camera);
  })(t0);
})();
