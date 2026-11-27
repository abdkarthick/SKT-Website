/* SKT - 3D page-header scenes (three.js): about = opening mould, facilities = meshing gears, products = blower fan, contact = orbit plate */
(function () {
  var host = document.querySelector('.p3d'); if (!host || !window.THREE) return;
  var T = THREE, kind = host.getAttribute('data-scene'), renderer;
  try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { host.style.display = 'none'; return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  host.appendChild(renderer.domElement);
  var scene = new T.Scene(), camera = new T.PerspectiveCamera(34, 1, 0.1, 60);
  camera.position.set(0, 0.5, 8.2);
  scene.add(new T.AmbientLight(0xffffff, 0.62));
  var key = new T.DirectionalLight(0xffffff, 1.15); key.position.set(4, 6, 6); scene.add(key);
  var rimA = new T.PointLight(0x9cced5, 1.3, 30); rimA.position.set(-6, 2, 4); scene.add(rimA);
  var rimB = new T.PointLight(0xa1d0d8, 0.8, 30); rimB.position.set(6, -3, -3); scene.add(rimB);
  var root = new T.Group(); scene.add(root);
  function mat(c, m, r) { return new T.MeshStandardMaterial({ color: c, metalness: m == null ? 0.35 : m, roughness: r == null ? 0.42 : r }); }
  function edges(mesh, op) { var l = new T.LineSegments(new T.EdgesGeometry(mesh.geometry), new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: op || 0.35 })); mesh.add(l); return mesh; }
  var anim = function () {};

  /* ---------- about: mould that opens and closes around a part ---------- */
  if (kind === 'mould') {
    var bot = edges(new T.Mesh(new T.BoxGeometry(3.2, 0.85, 2.3), mat(0x6da6af, 0.4, 0.38))); bot.position.y = -0.7; root.add(bot);
    var top = edges(new T.Mesh(new T.BoxGeometry(3.2, 0.85, 2.3), mat(0x9cced5, 0.4, 0.38))); root.add(top);
    var pts = [[0.001, 0], [0.62, 0], [0.7, 0.05], [0.64, 0.7], [0.5, 0.78], [0.5, 0.7], [0.58, 0.66], [0.62, 0.08]].map(function (p) { return new T.Vector2(p[0], p[1]); });
    var part = new T.Mesh(new T.LatheGeometry(pts, 40), mat(0xff7247, 0.2, 0.35)); part.position.y = -0.28; root.add(part);
    [[-1.35, -0.9], [1.35, -0.9], [-1.35, 0.9], [1.35, 0.9]].forEach(function (p) { var c = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 2.1, 20), mat(0xecf5f6, 0.8, 0.2)); c.position.set(p[0], 0.1, p[1]); root.add(c); });
    root.rotation.x = 0.42;
    anim = function (t, sc) { top.position.y = 0.22 + (0.5 - 0.5 * Math.cos(t * 0.9)) * 1.25; part.position.y = -0.28 + Math.max(0, Math.sin(t * 0.9 - 1.2)) * 0.5; root.rotation.y = t * 0.28 + sc * 1.2; };
  }

  /* ---------- facilities: three meshing gears ---------- */
  if (kind === 'gears') {
    var gear = function (n, R, r, depth, color, hole) {
      var s = new T.Shape(), a, i, step = Math.PI * 2 / n;
      for (i = 0; i < n; i++) {
        a = i * step;
        var p = [[r, -0.28], [R, -0.14], [R, 0.14], [r, 0.28]];
        p.forEach(function (q, k) { var ang = a + step * (0.5 + q[1]), rad = q[0]; var x = Math.cos(ang) * rad, y = Math.sin(ang) * rad; if (i === 0 && k === 0) s.moveTo(x, y); else s.lineTo(x, y); });
      }
      s.closePath(); var h = new T.Path(); h.absarc(0, 0, hole, 0, Math.PI * 2, true); s.holes.push(h);
      var g = new T.Mesh(new T.ExtrudeGeometry(s, { depth: depth, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1, curveSegments: 24 }), mat(color, 0.55, 0.32));
      g.geometry.translate(0, 0, -depth / 2); return g;
    };
    var g1 = gear(16, 1.45, 1.2, 0.5, 0x89c0c8, 0.34), g2 = gear(10, 0.93, 0.72, 0.5, 0xecf5f6, 0.24), g3 = gear(8, 0.76, 0.56, 0.5, 0xff7247, 0.2);
    var d12 = 1.33 + 0.83 + 0.0, d13 = 1.33 + 0.66;
    g1.position.set(-0.4, 0, 0); g2.position.set(-0.4 + d12, 0, 0); g3.position.set(-0.4 + Math.cos(-0.95) * d13 * 0 , -d13 - 0.1, 0);
    g3.position.set(-0.4 + 0.55, -1.95, 0);
    root.add(g1, g2, g3); root.position.set(-0.5, 0.45, 0); root.rotation.x = 0.28;
    anim = function (t, sc) { g1.rotation.z = t * 0.5; g2.rotation.z = -t * 0.5 * 16 / 10 + Math.PI / 10; g3.rotation.z = -t * 0.5 * 16 / 8 * 0.9; root.rotation.y = Math.sin(t * 0.4) * 0.35 + sc; };
  }

  /* ---------- products: blower fan ---------- */
  if (kind === 'fan') {
    var fan = new T.Group(), n = 14, i;
    var disc = new T.Mesh(new T.CylinderGeometry(1.6, 1.6, 0.07, 64), mat(0x55838a, 0.5, 0.4)); fan.add(disc);
    var hub = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.62, 40), mat(0xff7247, 0.4, 0.3)); fan.add(hub);
    for (i = 0; i < n; i++) {
      var a = i / n * Math.PI * 2, b = new T.Mesh(new T.BoxGeometry(1.05, 0.56, 0.045), mat(i % 2 ? 0xecf5f6 : 0x9cced5, 0.45, 0.35));
      var pivot = new T.Group(); b.position.set(1.0, 0.3, 0); b.rotation.y = 0.55; pivot.add(b); pivot.rotation.y = a; fan.add(pivot);
    }
    var ring = new T.Mesh(new T.TorusGeometry(1.52, 0.045, 12, 80), mat(0xa1d0d8, 0.5, 0.3)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.6; fan.add(ring);
    root.add(fan); root.rotation.x = 0.95; root.position.y = 0.15;
    anim = function (t, sc) { fan.rotation.y = -t * 1.6; root.rotation.z = Math.sin(t * 0.5) * 0.18 + sc * 0.6; };
  }

  /* ---------- contact: logo plate in orbit ---------- */
  if (kind === 'orbit') {
    var plate = new T.Mesh(new T.BoxGeometry(2.7, 1.6, 0.14), mat(0xf6fafa, 0.1, 0.45)); root.add(plate);
    new T.TextureLoader().load('img/logo.png', function (tx) { var m = new T.Mesh(new T.PlaneGeometry(2.25, 1.34), new T.MeshBasicMaterial({ map: tx, transparent: true })); m.position.z = 0.075; plate.add(m); }, undefined, function () {});
    var rings = [], cols = [0x9cced5, 0xa1d0d8, 0xff7247];
    cols.forEach(function (c, k) {
      var g = new T.Group(), rr = 2.2 + k * 0.5;
      var ring2 = new T.Mesh(new T.TorusGeometry(rr, 0.012, 8, 120), new T.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.7 })); g.add(ring2);
      var node = new T.Mesh(new T.SphereGeometry(0.13, 20, 20), mat(c, 0.2, 0.3)); node.position.set(rr, 0, 0); g.add(node);
      g.rotation.set(1.1 - k * 0.55, k * 0.7, k * 0.5); root.add(g); rings.push({ g: g, node: node, sp: 0.7 - k * 0.18, rr: rr });
    });
    anim = function (t, sc) { rings.forEach(function (r, k) { r.node.position.set(Math.cos(t * r.sp + k * 2) * r.rr, Math.sin(t * r.sp + k * 2) * r.rr, 0); }); plate.rotation.y = Math.sin(t * 0.6) * 0.5; plate.rotation.x = Math.cos(t * 0.4) * 0.12; root.rotation.y = sc; };
  }

  /* ---------- loop ---------- */
  function size() { var w = host.clientWidth || 600, h = host.clientHeight || 500; renderer.setSize(w, h); camera.aspect = w / h; camera.position.z = w / h < 0.9 ? 10.5 : 8.2; camera.updateProjectionMatrix(); }
  size(); window.addEventListener('resize', size);
  var px = 0, py = 0, tx = 0, ty = 0, vis = true, t0 = performance.now();
  window.addEventListener('pointermove', function (e) { tx = (e.clientX / innerWidth - 0.5); ty = (e.clientY / innerHeight - 0.5); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(host);
  (function frame(now) {
    requestAnimationFrame(frame); if (!vis) return;
    var t = (now - t0) / 1000, sc = Math.min(window.scrollY / 700, 1.2);
    px += (tx - px) * 0.05; py += (ty - py) * 0.05;
    anim(t, sc); camera.position.x = px * 1.4; camera.position.y = 0.5 - py * 1.0; camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  })(t0);
})();
