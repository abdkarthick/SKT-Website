/* SKT hero 3D (Home + About, right side): "Mould opens, mould closes".
   Four chamfered steel plates (the chamfer echoes the SKT logo) slide apart on four guide pillars,
   an ember-orange fan part is revealed and inspected by a scan beam, then the plates slam shut
   with a clamp pulse. Starts by opening, ends by closing, then repeats. No text anywhere in the scene.
   Pointer tilts the scene. Works on the host #hx3 (home) or #ab3 (about). */
(function () {
  'use strict';
  var host = document.getElementById('hx3') || document.getElementById('ab3');
  if (!host) return;
  if (!window.THREE) { host.classList.add('nogl'); return; }
  var T = THREE, renderer;
  try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { host.classList.add('nogl'); return; }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  host.insertBefore(renderer.domElement, host.firstChild);

  var scene = new T.Scene(), camera = new T.PerspectiveCamera(32, 1, 0.1, 80);
  camera.position.set(0, 1.5, 15.5); camera.lookAt(0, 0, 0);
  scene.add(new T.HemisphereLight(0xdff3f6, 0x16414c, 1.2));
  var key = new T.DirectionalLight(0xffffff, 1.15); key.position.set(4, 7, 8); scene.add(key);
  var rim = new T.PointLight(0x7fc3cf, 1.4, 34); rim.position.set(-7, 2, -4); scene.add(rim);
  var core = new T.PointLight(0xff6a33, 0.4, 10); core.position.set(0, 0, 0.6); scene.add(core);
  var root = new T.Group(); scene.add(root);

  function mat(c, m, r, o) {
    return new T.MeshStandardMaterial({ color: c, metalness: m, roughness: r, transparent: o != null, opacity: o == null ? 1 : o, depthWrite: o == null });
  }

  /* ---------- plates: chamfered square, thickness along X ---------- */
  var PS = 3.0, CH = 0.42, PT = 0.5;
  function plateGeo() {
    var h = PS / 2, s = new T.Shape();
    s.moveTo(-h + CH, -h); s.lineTo(h - CH, -h); s.lineTo(h, -h + CH); s.lineTo(h, h - CH);
    s.lineTo(h - CH, h); s.lineTo(-h + CH, h); s.lineTo(-h, h - CH); s.lineTo(-h, -h + CH); s.closePath();
    var g = new T.ExtrudeGeometry(s, { depth: PT, bevelEnabled: false });
    g.translate(0, 0, -PT / 2);
    g.rotateY(Math.PI / 2); /* thickness now along X */
    return g;
  }
  var pg = plateGeo();
  var spec = [
    { c: 0x1f4650, m: 0.55, r: 0.4, o: 0.92 },
    { c: 0x4f8794, m: 0.55, r: 0.35, o: 0.55 },
    { c: 0x8fb9c3, m: 0.55, r: 0.35, o: 0.55 },
    { c: 0x1f4650, m: 0.55, r: 0.4, o: 0.92 }
  ];
  var plates = [], edgeMats = [];
  spec.forEach(function (p, i) {
    var mesh = new T.Mesh(pg, mat(p.c, p.m, p.r, p.o));
    var em = new T.LineBasicMaterial({ color: 0xbfe3ea, transparent: true, opacity: 0.7 });
    mesh.add(new T.LineSegments(new T.EdgesGeometry(pg, 30), em));
    edgeMats.push(em);
    /* small ember dots in two corners of each plate: bolt heads */
    [[1.1, 1.1], [-1.1, -1.1]].forEach(function (q) {
      var b = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.06, 14), new T.MeshBasicMaterial({ color: 0xff6a33 }));
      b.rotation.z = Math.PI / 2; b.position.set(PT / 2 + 0.03, q[0], q[1]); mesh.add(b);
    });
    root.add(mesh); plates.push(mesh);
  });

  /* guide pillars (fixed) */
  var pil = mat(0xe3f1f4, 0.35, 0.3);
  [[1.12, 1.12], [-1.12, 1.12], [1.12, -1.12], [-1.12, -1.12]].forEach(function (p) {
    var c = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 7.0, 16), pil);
    c.rotation.z = Math.PI / 2; c.position.set(0, p[0], p[1]); root.add(c);
  });

  /* ---------- the part: ducted fan (hub, 7 blades, rim) ---------- */
  var partOrient = new T.Group(); partOrient.rotation.y = Math.PI / 2; root.add(partOrient);
  var part = new T.Group(); partOrient.add(part);
  var orange = new T.MeshStandardMaterial({ color: 0xff6a33, emissive: 0xff5a1f, emissiveIntensity: 0.3, metalness: 0.15, roughness: 0.4 });
  var orangeDk = new T.MeshStandardMaterial({ color: 0xe0561f, emissive: 0xff5a1f, emissiveIntensity: 0.2, metalness: 0.2, roughness: 0.45 });
  var bs = new T.Shape();
  bs.moveTo(0.26, -0.1); bs.bezierCurveTo(0.55, -0.14, 0.86, 0.0, 1.02, 0.34);
  bs.lineTo(0.94, 0.44); bs.bezierCurveTo(0.76, 0.22, 0.5, 0.15, 0.26, 0.13); bs.closePath();
  var bg = new T.ExtrudeGeometry(bs, { depth: 0.12, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 1, curveSegments: 10 });
  bg.translate(0, 0, -0.06);
  var BN = 7, i;
  for (i = 0; i < BN; i++) {
    var bl = new T.Mesh(bg, orange); bl.rotation.z = i / BN * Math.PI * 2; bl.rotation.x = 0.22; part.add(bl);
  }
  var hub = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 0.3, 28), orangeDk); hub.rotation.x = Math.PI / 2; part.add(hub);
  var hubCap = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.34, 18), new T.MeshStandardMaterial({ color: 0x0a2128, metalness: 0.5, roughness: 0.4 })); hubCap.rotation.x = Math.PI / 2; part.add(hubCap);
  var rimR = new T.Mesh(new T.TorusGeometry(1.06, 0.055, 10, 72), orangeDk); part.add(rimR);

  /* scan beam: a horizontal glass sheet that sweeps through the part */
  var beamMat = new T.MeshBasicMaterial({ color: 0xffa070, transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending });
  var beam = new T.Mesh(new T.PlaneGeometry(2.7, 2.7), beamMat); beam.rotation.x = -Math.PI / 2; root.add(beam);
  var beamEdge = new T.Mesh(new T.PlaneGeometry(2.7, 0.03), new T.MeshBasicMaterial({ color: 0xffd2bb, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }));
  beamEdge.rotation.y = Math.PI / 2; root.add(beamEdge);

  /* floor ring */
  var floor = new T.Mesh(new T.RingGeometry(2.72, 2.76, 96), new T.MeshBasicMaterial({ color: 0x7fc3cf, transparent: true, opacity: 0.35, side: T.DoubleSide }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -1.95; root.add(floor);
  var floor2 = new T.Mesh(new T.RingGeometry(3.3, 3.32, 96), new T.MeshBasicMaterial({ color: 0xff6a33, transparent: true, opacity: 0.22, side: T.DoubleSide }));
  floor2.rotation.x = -Math.PI / 2; floor2.position.y = -1.95; root.add(floor2);

  /* clamp shockwave rings (in the parting plane) */
  var waves = [];
  [0xff8a4a, 0x7fc3cf].forEach(function (c) {
    var w = new T.Mesh(new T.RingGeometry(0.96, 1.0, 72), new T.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending }));
    w.rotation.y = Math.PI / 2; root.add(w); waves.push(w);
  });

  /* clamp sparks */
  var SN = 70, sp = new Float32Array(SN * 3), sd = [];
  for (i = 0; i < SN; i++) { sd.push([Math.random() * Math.PI * 2, 0.8 + Math.random() * 1.6, (Math.random() - 0.5) * 0.7]); }
  var sGeo = new T.BufferGeometry(); sGeo.setAttribute('position', new T.BufferAttribute(sp, 3));
  var sparks = new T.Points(sGeo, new T.PointsMaterial({ color: 0xffa070, size: 0.07, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
  root.add(sparks);

  /* ambient dust */
  var DN = 46, dp = new Float32Array(DN * 3), dv = [];
  for (i = 0; i < DN; i++) { dv.push([(Math.random() - 0.5) * 9, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, Math.random() * 6.28]); }
  var dGeo = new T.BufferGeometry(); dGeo.setAttribute('position', new T.BufferAttribute(dp, 3));
  var dust = new T.Points(dGeo, new T.PointsMaterial({ color: 0x9fd6e0, size: 0.045, transparent: true, opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending }));
  scene.add(dust);

  function ss(a, b, x) { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); }
  var CYC = 9.6, T_OPEN0 = 0.8, T_OPEN1 = 3.1, T_CLOSE0 = 6.2, T_CLOSE1 = 8.2;
  var S_CLOSED = PT + 0.04, S_OPEN = S_CLOSED + 1.4;
  var mx = 0, my = 0, tx = 0, ty = 0, spin = 0, last = 0;
  var cEdge = new T.Color(0xbfe3ea), hEdge = new T.Color(0xff6a33), tmp = new T.Color();

  function frame(t) {
    var dt = Math.min(0.1, Math.max(0, t - last)); last = t;
    var c = t % CYC;
    var op = ss(T_OPEN0, T_OPEN1, c);
    var cl = ss(T_CLOSE0, T_CLOSE1, c); cl = Math.pow(cl, 1.7);
    var open = op * (1 - cl);                       /* 0 closed, 1 fully open */
    var sp_ = S_CLOSED + (S_OPEN - S_CLOSED) * open;
    for (var k = 0; k < 4; k++) plates[k].position.x = (k - 1.5) * sp_;

    /* clamp moment */
    var ct = c - T_CLOSE1, hit = ct >= 0 && ct < 1.4 ? ct / 1.4 : (c < 0.6 ? 0 : -1);
    var flash = hit >= 0 ? Math.pow(1 - hit, 2) : 0;
    var shake = hit >= 0 && hit < 0.35 ? (1 - hit / 0.35) * 0.05 : 0;

    /* part */
    spin += dt * (0.35 + 1.9 * open);
    part.rotation.z = spin;
    var ps = (0.68 + 0.4 * ss(0, 1, open)) * 1.1;
    partOrient.scale.setScalar(ps);
    partOrient.position.y = Math.sin(t * 1.4) * 0.07 * open;
    orange.emissiveIntensity = 0.28 + 0.4 * open + flash * 0.9;
    core.intensity = 0.35 + 1.1 * open + flash * 2.2;

    /* scan beam sweeps once while fully open */
    var sc = ss(3.4, 5.9, c);
    var sweep = sc > 0 && sc < 1 ? Math.sin(sc * Math.PI) : 0;
    beam.position.y = -1.15 + sc * 2.3; beamEdge.position.y = beam.position.y;
    beamMat.opacity = 0.18 * sweep * open; beamEdge.material.opacity = 0.9 * sweep * open;

    /* edge glow on clamp */
    for (k = 0; k < 4; k++) { tmp.copy(cEdge).lerp(hEdge, flash); edgeMats[k].color.copy(tmp); edgeMats[k].opacity = 0.7 + flash * 0.3; }

    /* shockwaves + sparks */
    waves.forEach(function (w, idx) {
      var u = hit >= 0 ? Math.min(1, Math.max(0, (hit - idx * 0.08) / (0.9 - idx * 0.1))) : 1;
      var on = hit >= 0 && hit < 0.9 - idx * 0.1;
      w.scale.setScalar(1 + u * (idx ? 2.2 : 3.2)); w.material.opacity = on ? (1 - u) * 0.85 : 0;
    });
    var pa = sGeo.attributes.position.array, su = hit >= 0 ? hit : 1;
    for (k = 0; k < SN; k++) {
      var q = sd[k], r = su * q[1] * 1.6;
      pa[k * 3] = q[2] * su; pa[k * 3 + 1] = Math.sin(q[0]) * r - su * su * 0.5; pa[k * 3 + 2] = Math.cos(q[0]) * r;
    }
    sGeo.attributes.position.needsUpdate = true;
    sparks.material.opacity = hit >= 0 && hit < 0.75 ? (1 - hit / 0.75) * 0.95 : 0;

    /* dust */
    var da = dGeo.attributes.position.array;
    for (k = 0; k < DN; k++) {
      var d = dv[k];
      da[k * 3] = d[0] + Math.sin(t * 0.2 + d[3]) * 0.3;
      da[k * 3 + 1] = d[1] + Math.sin(t * 0.35 + d[3] * 2) * 0.35;
      da[k * 3 + 2] = d[2];
    }
    dGeo.attributes.position.needsUpdate = true;

    /* camera: pointer tilt, slow drift, clamp shake, slight push-in while closing */
    tx += (mx - tx) * 0.06; ty += (my - ty) * 0.06;
    root.rotation.y = -0.6 + tx * 0.35 + Math.sin(t * 0.25) * 0.07;
    root.rotation.x = 0.14 - ty * 0.2;
    root.position.x = Math.sin(t * 90) * shake;
    root.position.y = Math.cos(t * 83) * shake;
    var zoom = 1 + (1 - open) * 0.06;
    root.scale.setScalar(zoom);
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
