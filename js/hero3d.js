/* SKT hero 3D: one injection-moulding cycle on a gear.
   X-ray steel mould closes, molten ember plastic fills the cavity, it cools, the mould opens,
   ejector pins push the gear out and it hovers, then the cycle restarts. Pointer tilts the scene. */
(function () {
  'use strict';
  var host = document.getElementById('hx3');
  if (!host) return;
  var tagB = document.getElementById('hx-b'), tagS = document.getElementById('hx-s');
  if (!window.THREE) { host.classList.add('nogl'); return; }
  var T = THREE, renderer;
  try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { host.classList.add('nogl'); return; }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.localClippingEnabled = true;
  host.insertBefore(renderer.domElement, host.firstChild);
  var scene = new T.Scene(), camera = new T.PerspectiveCamera(32, 1, 0.1, 60);
  camera.position.set(0, 1.2, 11.2); camera.lookAt(0, 0, 0);
  scene.add(new T.HemisphereLight(0xdff3f6, 0x16414c, 1.15));
  var key = new T.DirectionalLight(0xffffff, 1.1); key.position.set(4, 6, 7); scene.add(key);
  var rim = new T.PointLight(0x7fc3cf, 1.2, 30); rim.position.set(-6, 2, -3); scene.add(rim);
  var glow = new T.PointLight(0xff6a33, 0, 9); glow.position.set(0, 0, 0.4); scene.add(glow);
  var root = new T.Group(); scene.add(root);
  function mat(c, m, r, o) { return new T.MeshStandardMaterial({ color: c, metalness: m, roughness: r, transparent: o != null, opacity: o == null ? 1 : o }); }
  function edge(mesh, c, op) { var l = new T.LineSegments(new T.EdgesGeometry(mesh.geometry), new T.LineBasicMaterial({ color: c, transparent: true, opacity: op })); mesh.add(l); return mesh; }

  /* gear outline with teeth, centre bore and six lightening holes */
  function gearShape(ro, rr, n, bore, holes) {
    var s = new T.Shape(), i, a, step = Math.PI * 2 / n;
    for (i = 0; i < n; i++) {
      a = i * step;
      var p = [[a, rr], [a + step * 0.16, rr], [a + step * 0.3, ro], [a + step * 0.56, ro], [a + step * 0.7, rr]];
      p.forEach(function (q, k) { var x = Math.cos(q[0]) * q[1], y = Math.sin(q[0]) * q[1]; if (i === 0 && k === 0) s.moveTo(x, y); else s.lineTo(x, y); });
    }
    s.closePath();
    var h = new T.Path(); h.absarc(0, 0, bore, 0, Math.PI * 2, true); s.holes.push(h);
    for (i = 0; i < holes; i++) { var b = new T.Path(), aa = i / holes * Math.PI * 2 + 0.3; b.absarc(Math.cos(aa) * rr * 0.62, Math.sin(aa) * rr * 0.62, 0.11, 0, Math.PI * 2, true); s.holes.push(b); }
    return s;
  }
  var RO = 1.0, RR = 0.82, N = 14;
  function gearGeo(depth, bevel) { var g = new T.ExtrudeGeometry(gearShape(RO, RR, N, 0.26, 6), { depth: depth, bevelEnabled: !!bevel, bevelSize: bevel || 0, bevelThickness: bevel || 0, bevelSegments: 2, curveSegments: 6 }); g.translate(0, 0, -depth / 2); return g; }

  /* mould halves (x-ray steel) */
  var PW = 0.9, PH = 3.2;
  var fixedH = new T.Group(), moveH = new T.Group(); root.add(fixedH, moveH);
  var plateMat = mat(0x7fa3ac, 0.5, 0.35, 0.5);
  var pl = edge(new T.Mesh(new T.BoxGeometry(PW, PH, PH), plateMat), 0xbfe3ea, 0.55); pl.position.x = -PW / 2; fixedH.add(pl);
  var pr = edge(new T.Mesh(new T.BoxGeometry(PW, PH, PH), mat(0x93b4bc, 0.5, 0.35, 0.5)), 0xbfe3ea, 0.55); pr.position.x = PW / 2; moveH.add(pr);
  /* cavity impression (fixed) and core boss (moving) on the parting faces */
  var cav = new T.Mesh(gearGeo(0.04), new T.MeshBasicMaterial({ color: 0x03161b })); cav.rotation.y = Math.PI / 2; cav.position.x = -0.02; fixedH.add(cav);
  var core = new T.Mesh(gearGeo(0.16, 0.01), mat(0xdfe9eb, 0.9, 0.25)); core.rotation.y = Math.PI / 2; core.scale.set(0.9, 0.9, 1); core.position.x = 0.08; moveH.add(core);
  /* guide pillars */
  [[1.3, 1.3], [-1.3, 1.3], [1.3, -1.3], [-1.3, -1.3]].forEach(function (p) {
    var c = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 3.7, 18), mat(0xeef6f7, 0.9, 0.2)); c.rotation.z = Math.PI / 2; c.position.set(0.3, p[0], p[1]); root.add(c);
  });
  /* sprue bushing + nozzle on the fixed side */
  var sprue = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.5, 20), mat(0xb7c4c8, 0.9, 0.25)); sprue.rotation.z = Math.PI / 2; sprue.position.x = -PW - 0.25; fixedH.add(sprue);
  var nozzle = new T.Mesh(new T.CylinderGeometry(0.1, 0.24, 0.9, 20), mat(0x2b3a40, 0.8, 0.35)); nozzle.rotation.z = -Math.PI / 2; nozzle.position.x = -PW - 0.95; fixedH.add(nozzle);
  var tip = new T.Mesh(new T.SphereGeometry(0.1, 12, 12), new T.MeshBasicMaterial({ color: 0xff6a33 })); tip.position.x = -PW - 0.5; fixedH.add(tip);
  /* ejector pins (on the moving half) */
  var pins = [];
  [[0.5, 0.5], [-0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]].forEach(function (p) {
    var e = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, 0.5, 10), mat(0xffb08a, 0.8, 0.3)); e.rotation.z = Math.PI / 2; e.position.set(0.25, p[0], p[1]); moveH.add(e); pins.push(e);
  });

  /* the moulded gear (clipped while filling) */
  var fillPlane = new T.Plane(new T.Vector3(0, -1, 0), 0);
  var gMat = new T.MeshStandardMaterial({ color: 0xff6a33, emissive: 0xff5a1f, emissiveIntensity: 0, metalness: 0.15, roughness: 0.4, clippingPlanes: [fillPlane], transparent: true, opacity: 1 });
  var gearW = new T.Group(); root.add(gearW);
  var gear = new T.Mesh(gearGeo(0.34, 0.025), gMat); gear.rotation.y = Math.PI / 2; gearW.add(gear);

  /* sparks */
  var SN = 46, sp = new Float32Array(SN * 3), sv = [];
  for (var i = 0; i < SN; i++) { sv.push([Math.random(), 0.3 + Math.random() * 0.8, Math.random() * 6.28]); }
  var sGeo = new T.BufferGeometry(); sGeo.setAttribute('position', new T.BufferAttribute(sp, 3));
  var sparks = new T.Points(sGeo, new T.PointsMaterial({ color: 0xffa070, size: 0.05, transparent: true, opacity: 0.9, depthWrite: false, blending: T.AdditiveBlending })); root.add(sparks);

  function ss(a, b, x) { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); }
  var hot = new T.Color(0xff8a4a), cool = new T.Color(0xff6a33), done = new T.Color(0xf0601f);
  var CYC = 11, mx = 0, my = 0, tx = 0, ty = 0, label = '';
  function setLabel(b, s) { if (label === b) return; label = b; if (tagB) tagB.textContent = b; if (tagS) tagS.textContent = s; }

  function frame(t) {
    var c = t % CYC;
    var fill = ss(0.6, 3.0, c), cl = ss(3.0, 4.6, c);
    var open = ss(4.6, 6.0, c) * (1 - ss(9.4, 10.8, c));
    var eject = ss(6.0, 7.0, c), lift = ss(7.0, 8.2, c), fade = ss(8.9, 9.8, c);
    moveH.position.x = open * 1.9;
    /* fill: plane sweeps up from the bottom of the cavity */
    fillPlane.constant = -RO + fill * RO * 2.1;
    var fillVis = c < 9.0 ? 1 : 1 - fade;
    gMat.opacity = fillVis;
    gMat.emissiveIntensity = (1 - cl) * (0.15 + fill * 0.55) * (c < 9 ? 1 : 0);
    gMat.color.copy(hot).lerp(done, cl);
    glow.intensity = (1 - cl) * fill * 0.9;
    /* gear travels with the moving half, pins push it off, then it lifts and faces the viewer */
    var gx = open * 1.9 - eject * 0.55 * (1 - lift * 0.0);
    gearW.position.set(gx + lift * 0.0, lift * 0.35, lift * 1.5);
    gearW.rotation.set(0, lift * (-0.35 + t * 0.9 % 6.28 * 0.0), 0);
    gear.rotation.y = Math.PI / 2 - lift * (Math.PI / 2 - 0.15);
    gear.rotation.z = lift * (t * 0.8);
    gearW.scale.setScalar(1 - (c >= 8.9 ? fade * 0.6 : 0));
    pins.forEach(function (p) { p.position.x = 0.25 + eject * 0.55 * (1 - lift); });
    var s = fillVis * 0 + 1; void s;
    /* sparks around the sprue during the shot */
    var pa = sGeo.attributes.position.array, act = c < 3.6 ? 1 : 0;
    for (var k = 0; k < SN; k++) {
      var q = sv[k], ph = (t * 0.5 * q[1] + q[0]) % 1;
      pa[k * 3] = -PW - 0.5 - ph * 0.5 + Math.sin(q[2] + t) * 0.1;
      pa[k * 3 + 1] = Math.sin(q[2]) * ph * 0.9 + ph * 0.3;
      pa[k * 3 + 2] = Math.cos(q[2]) * ph * 0.9;
    }
    sGeo.attributes.position.needsUpdate = true; sparks.material.opacity = 0.85 * act * (c > 0.3 ? 1 : 0);
    tip.material.color.setHex(act ? 0xffa070 : 0x7a4a36);
    if (c < 3.0) setLabel('Mould closed', 'Molten plastic filling the cavity');
    else if (c < 4.6) setLabel('Mould closed', 'Holding and cooling');
    else if (c < 6.0) setLabel('Mould opening', 'Core half moves away');
    else if (c < 8.4) setLabel('Ejecting', 'Pins push the gear off the core');
    else setLabel('Mould closing', 'Ready for the next shot');
    tx += (mx - tx) * 0.06; ty += (my - ty) * 0.06;
    root.rotation.y = -0.62 + tx * 0.35 + Math.sin(t * 0.25) * 0.06;
    root.rotation.x = 0.16 - ty * 0.2;
    root.position.x = 0.45 + open * -0.9;
  }

  function size() { var w = host.clientWidth || 400, h = host.clientHeight || 420; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  size(); window.addEventListener('resize', size);
  if (window.ResizeObserver) new ResizeObserver(size).observe(host);
  window.addEventListener('pointermove', function (e) { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });

  var vis = true, t0 = performance.now();
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(host);
  if (reduce) { frame(6.6); renderer.render(scene, camera); return; }
  (function loop(now) { requestAnimationFrame(loop); if (!vis || document.hidden) return; frame((now - t0) / 1000); renderer.render(scene, camera); })(t0);
})();
