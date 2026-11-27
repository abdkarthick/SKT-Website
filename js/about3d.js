/* SKT About hero 3D: a VMC end mill cuts a pocket in a steel block row by row,
   then a core insert drops in and fits first time. Pointer tilts the scene. */
(function () {
  'use strict';
  var host = document.getElementById('ab3');
  if (!host) return;
  var tagB = document.getElementById('ab-b'), tagS = document.getElementById('ab-s');
  if (!window.THREE) { host.classList.add('nogl'); return; }
  var T = THREE, renderer;
  try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { host.classList.add('nogl'); return; }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  host.insertBefore(renderer.domElement, host.firstChild);
  var scene = new T.Scene(), camera = new T.PerspectiveCamera(32, 1, 0.1, 60);
  camera.position.set(0.3, 3.6, 12.4); camera.lookAt(0, 0.9, 0);
  scene.add(new T.HemisphereLight(0xdff3f6, 0x16414c, 1.1));
  var key = new T.DirectionalLight(0xffffff, 1.2); key.position.set(4, 7, 6); scene.add(key);
  var rim = new T.PointLight(0x7fc3cf, 1.1, 30); rim.position.set(-6, 3, -3); scene.add(rim);
  var root = new T.Group(); scene.add(root);
  function mat(c, m, r) { return new T.MeshStandardMaterial({ color: c, metalness: m, roughness: r }); }
  function edge(mesh, c, op) { mesh.add(new T.LineSegments(new T.EdgesGeometry(mesh.geometry), new T.LineBasicMaterial({ color: c, transparent: true, opacity: op }))); return mesh; }

  /* steel block on a base plate */
  var base = new T.Mesh(new T.BoxGeometry(4.2, 0.22, 3.2), mat(0x1c3a44, 0.6, 0.45)); base.position.y = -1.0; root.add(base);
  var block = edge(new T.Mesh(new T.BoxGeometry(3.4, 0.9, 2.5), mat(0x9db9c0, 0.75, 0.32)), 0xe3f4f7, 0.5); block.position.y = -0.45; root.add(block);
  /* pocket strips (dark recess), revealed row by row as the tool passes */
  var ROWS = 7, RW = 0.2, PX = 1.0, strips = [], i;
  for (i = 0; i < ROWS; i++) {
    var g = new T.BoxGeometry(PX * 2, 0.02, RW + 0.005); g.translate(i % 2 ? -PX : PX, 0, 0);
    var s = new T.Mesh(g, new T.MeshBasicMaterial({ color: 0x02161b })); s.position.set(i % 2 ? PX : -PX, 0.006, -0.6 + i * RW); s.scale.x = 0.0001; root.add(s); strips.push(s);
  }
  /* milling tool + spindle */
  var tool = new T.Group(); root.add(tool);
  var shank = new T.Mesh(new T.CylinderGeometry(0.17, 0.17, 1.2, 20), mat(0xe9f1f3, 0.9, 0.2)); shank.position.y = 0.95; tool.add(shank);
  var flute = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.45, 8), mat(0xff8a50, 0.7, 0.3)); flute.position.y = 0.12; tool.add(flute);
  var spindle = new T.Mesh(new T.CylinderGeometry(0.42, 0.34, 0.8, 24), mat(0x2a4a54, 0.8, 0.35)); spindle.position.y = 1.95; tool.add(spindle);
  var head = new T.Mesh(new T.BoxGeometry(0.9, 1.6, 0.7), mat(0x14303a, 0.7, 0.45)); head.position.y = 3.0; tool.add(head);
  /* core insert that must fit first time */
  var insMat = new T.MeshStandardMaterial({ color: 0xff6a33, emissive: 0xff4a10, emissiveIntensity: 0.25, metalness: 0.3, roughness: 0.4, transparent: true, opacity: 0 });
  var ins = new T.Mesh(new T.BoxGeometry(PX * 2 - 0.05, 0.4, RW * ROWS - 0.08), insMat); root.add(ins);
  var ring = new T.Mesh(new T.RingGeometry(1.0, 1.06, 64), new T.MeshBasicMaterial({ color: 0xff8a50, transparent: true, opacity: 0, side: T.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03; root.add(ring);
  /* chips */
  var SN = 40, sp = new Float32Array(SN * 3), sv = [];
  for (i = 0; i < SN; i++) sv.push([Math.random(), Math.random() * 6.28, 0.3 + Math.random() * 0.7]);
  var sGeo = new T.BufferGeometry(); sGeo.setAttribute('position', new T.BufferAttribute(sp, 3));
  var chips = new T.Points(sGeo, new T.PointsMaterial({ color: 0xffb184, size: 0.055, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending })); root.add(chips);

  function ss(a, b, x) { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); }
  var RT = 0.85, CUT = ROWS * RT, CYC = 12.5, mx = 0, my = 0, tx = 0, ty = 0, label = '';
  function setLabel(b, s) { if (label === b + s) return; label = b + s; if (tagB) tagB.textContent = b; if (tagS) tagS.textContent = s; }

  function frame(t) {
    var c = t % CYC, cutting = c < CUT, tipX = 0, tipZ = -0.6, k, p;
    for (k = 0; k < ROWS; k++) {
      p = ss(0, 1, Math.min(1, Math.max(0, (c - k * RT) / (RT * 0.86))));
      var resetK = 1 - ss(11.0, 12.2, c);
      strips[k].scale.x = Math.max(0.0001, p * resetK);
      if (c >= k * RT && c < (k + 1) * RT) {
        var dir = k % 2 ? -1 : 1; tipX = (p * 2 - 1) * PX * dir; tipZ = -0.6 + k * RW;
      }
    }
    if (!cutting) { tipX = (ROWS % 2 ? 1 : -1) * PX; tipZ = -0.6 + (ROWS - 1) * RW; }
    var lift = ss(CUT, CUT + 0.9, c) * (1 - ss(11.0, 12.0, c));
    tool.position.set(tipX, 0.03 + lift * 2.4, tipZ);
    tool.rotation.y = t * 14;
    /* insert drops in */
    var drop = ss(CUT + 0.8, CUT + 2.2, c), insOp = ss(CUT + 0.6, CUT + 1.1, c) * (1 - ss(11.0, 12.0, c));
    ins.position.set(0, 2.4 - drop * 2.54, 0);
    insMat.opacity = insOp; insMat.emissiveIntensity = 0.25 + (1 - drop) * 0.0 + ss(CUT + 2.1, CUT + 2.5, c) * (1 - ss(CUT + 2.5, CUT + 3.8, c)) * 1.2;
    var pr = ss(CUT + 2.1, CUT + 3.4, c);
    ring.scale.setScalar(0.6 + pr * 2.0); ring.material.opacity = (c > CUT + 2.1 && c < CUT + 3.5) ? (1 - pr) * 0.9 : 0;
    /* chips while cutting */
    var pa = sGeo.attributes.position.array;
    for (k = 0; k < SN; k++) {
      var q = sv[k], ph = (t * 1.4 * q[2] + q[0]) % 1;
      pa[k * 3] = tipX + Math.cos(q[1]) * ph * 0.7; pa[k * 3 + 1] = 0.08 + Math.sin(ph * Math.PI) * 0.5; pa[k * 3 + 2] = tipZ + Math.sin(q[1]) * ph * 0.7;
    }
    sGeo.attributes.position.needsUpdate = true; chips.material.opacity = cutting ? 0.9 : 0;
    if (c < CUT) setLabel('VMC machining', 'Cutting the cavity pocket');
    else if (c < CUT + 0.9) setLabel('Tool retracts', 'Pocket is cut to size');
    else if (c < CUT + 2.2) setLabel('Fitting', 'Core insert drops in');
    else if (c < 11.0) setLabel('Fit target', '90% fit in T-0');
    else setLabel('Next job', 'Block is reset');
    tx += (mx - tx) * 0.06; ty += (my - ty) * 0.06;
    root.rotation.y = -0.5 + tx * 0.4 + Math.sin(t * 0.25) * 0.07;
    root.rotation.x = 0.05 - ty * 0.15;
    root.position.y = -0.2;
  }

  function size() { var w = host.clientWidth || 400, h = host.clientHeight || 420; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  size(); window.addEventListener('resize', size);
  if (window.ResizeObserver) new ResizeObserver(size).observe(host);
  window.addEventListener('pointermove', function (e) { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
  var vis = true, t0 = performance.now();
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(host);
  if (reduce) { frame(9.2); renderer.render(scene, camera); return; }
  (function loop(now) { requestAnimationFrame(loop); if (!vis || document.hidden) return; frame((now - t0) / 1000); renderer.render(scene, camera); })(t0);
})();
