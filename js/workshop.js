/* Sri Kamatchi Toolings - about hero: mini workshop (isometric, Three.js r149 classic build)
   The 2 ton gantry crane carries a mould block from machine to machine.
   The machine that has the block starts working, and its name lights up below the scene. */
(function () {
  'use strict';
  var T = window.THREE;
  var cv = document.getElementById('wk-canvas');
  if (!cv) return;
  var wrap = cv.parentNode;
  if (!T) { wrap.classList.add('nogl'); return; }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { wrap.classList.add('nogl'); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);

  var RB = [0xe5484d, 0xf55423, 0x6cc644, 0x519db6, 0x6ca6af, 0x6ea8b1];

  /* ---------- helpers ---------- */
  function ss(x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function M(c, o) {
    var m = new T.MeshStandardMaterial({ color: c, metalness: 0.35, roughness: 0.5 });
    if (o) for (var k in o) m[k] = o[k];
    return m;
  }
  function B(par, w, h, d, mat, x, y, z) {
    var me = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
    me.position.set(x || 0, y || 0, z || 0); par.add(me); return me;
  }
  function C(par, rt, rb, h, mat, x, y, z, seg) {
    var me = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg || 24), mat);
    me.position.set(x || 0, y || 0, z || 0); par.add(me); return me;
  }
  function edge(mesh, col, op) {
    mesh.add(new T.LineSegments(new T.EdgesGeometry(mesh.geometry, 28), new T.LineBasicMaterial({ color: col, transparent: true, opacity: op || 0.5 })));
  }
  function glow(c, i) { return new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i === undefined ? 0.9 : i, metalness: 0.1, roughness: 0.4 }); }
  function link(mesh, a, b) {
    /* thin cylinder from point a to point b (for the crane slings) */
    var d = new T.Vector3().subVectors(b, a), len = d.length();
    mesh.position.copy(a).addScaledVector(d, 0.5);
    mesh.scale.set(1, len, 1);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
  }
  function shadowTex() {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 3, 32, 32, 32);
    gr.addColorStop(0, 'rgba(0,0,0,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return new T.CanvasTexture(c);
  }
  var SH = shadowTex();

  /* ---------- scene, camera, lights ---------- */
  var scene = new T.Scene();
  var cam = new T.OrthographicCamera(-9, 9, 7, -7, 0.1, 120);
  var TARGET = new T.Vector3(0, 2.3, 0);
  scene.add(new T.HemisphereLight(0xecf5f6, 0x30494d, 0.95));
  var dl = new T.DirectionalLight(0xffffff, 1.15); dl.position.set(6, 12, 7); scene.add(dl);
  var pl1 = new T.PointLight(0xa9cdd2, 1.3, 40); pl1.position.set(-9, 5, 6); scene.add(pl1);
  var pl2 = new T.PointLight(0xffb6a0, 0.7, 40); pl2.position.set(9, 4, -4); scene.add(pl2);
  var root = new T.Group(); scene.add(root);

  /* ---------- shared materials ---------- */
  var steel = M(0xd9e6e8, { metalness: 0.8, roughness: 0.3 });
  var dark = M(0x19373c, { metalness: 0.5, roughness: 0.5 });
  var floorMat = M(0x283e42, { metalness: 0.2, roughness: 0.7 });

  /* ---------- floor ---------- */
  var FX = 6.6, FZ = 4.3;
  var floor = B(root, FX * 2 + 0.6, 0.3, FZ * 2 + 0.6, floorMat, 0, -0.15, 0);
  edge(floor, 0xa9cdd2, 0.6);
  var yel = M(0xff5f2e, { metalness: 0.1, roughness: 0.6 });
  B(root, FX * 2 - 0.6, 0.02, 0.07, yel, 0, 0.01, FZ - 0.5);
  B(root, FX * 2 - 0.6, 0.02, 0.07, yel, 0, 0.01, -FZ + 0.5);
  B(root, 0.07, 0.02, FZ * 2 - 1.0, yel, FX - 0.3, 0.01, 0);
  B(root, 0.07, 0.02, FZ * 2 - 1.0, yel, -FX + 0.3, 0.01, 0);

  /* ---------- machines ---------- */
  var BH = 0.4;                      /* mould block height */
  var ST = [];                       /* stations, in the order the crane visits them */

  function footprint(g, w, d) {
    var s = new T.Mesh(new T.PlaneGeometry(w * 1.3, d * 1.3), new T.MeshBasicMaterial({ map: SH, transparent: true, depthWrite: false }));
    s.rotation.x = -Math.PI / 2; s.position.y = 0.012; g.add(s);
  }

  /* vertical machining centre */
  function vmc(color, w, d, headY, colH) {
    var g = new T.Group(), body = M(color, { metalness: 0.3, roughness: 0.45 });
    footprint(g, w, d);
    B(g, w, 0.55, d, body, 0, 0.275, 0);
    var hz = -d / 2 + 1.0, sp = hz + 0.2;
    var tbl = new T.Group(); tbl.position.set(0, 0.55, sp); g.add(tbl);
    B(tbl, w * 0.8, 0.18, d * 0.62, dark, 0, 0.09, 0);
    B(tbl, w * 0.68, 0.12, d * 0.5, steel, 0, 0.24, 0);
    for (var i = -1; i <= 1; i++) B(tbl, w * 0.68, 0.02, 0.05, dark, 0, 0.305, i * 0.17);
    B(g, w * 0.6, colH, 0.7, body, 0, colH / 2, -d / 2 + 0.45);
    var hd = new T.Group(); hd.position.set(0, headY, hz); g.add(hd);
    B(hd, w * 0.4, 0.8, 0.9, body, 0, 0, 0);
    C(hd, 0.14, 0.14, 0.45, steel, 0, -0.6, 0.2);
    var tool = C(hd, 0.05, 0.03, 0.3, glow(0xff764c, 0.2), 0, -0.95, 0.2, 12);
    B(g, 0.7, 0.5, 0.12, dark, w / 2 - 0.15, 1.5, d / 2 - 0.1).rotation.y = -0.35;
    var scr = B(g, 0.55, 0.34, 0.02, glow(0xd0e8eb, 0.8), w / 2 - 0.17, 1.5, d / 2 - 0.03); scr.rotation.y = -0.35;
    var tw = C(g, 0.07, 0.07, 0.25, glow(0xff5f2e, 0.9), -w / 4, colH + 0.15, -d / 2 + 0.45, 12);
    var restY = 0.85 + BH / 2;
    return {
      g: g, tbl: tbl, restY: restY, body: body, w: w, d: d,
      upd: function (t, a) {
        hd.position.y = headY - a * (0.06 + 0.05 * Math.sin(t * 7));
        tbl.position.x = Math.sin(t * 1.4) * 0.38 * a;
        tbl.position.z = sp + Math.cos(t * 0.9) * 0.1 * a;
        tool.material.emissiveIntensity = 0.2 + a * (0.7 + 0.3 * Math.sin(t * 40));
        tw.material.emissive.setHex(a > 0.5 ? 0x6cc644 : 0xff5f2e); tw.material.color.setHex(a > 0.5 ? 0x6cc644 : 0xff5f2e);
      }
    };
  }

  /* die-sinking EDM (Ratna ZNC) */
  function edm(color) {
    var g = new T.Group(), body = M(color, { metalness: 0.3, roughness: 0.45 });
    footprint(g, 3.0, 2.0);
    B(g, 2.4, 0.95, 1.8, body, 0, 0.475, 0);
    var wm = M(0xdeedef, { metalness: 0.5, roughness: 0.35 });
    B(g, 1.7, 0.5, 0.08, wm, 0.15, 1.2, 0.76);
    B(g, 1.7, 0.5, 0.08, wm, 0.15, 1.2, -0.76);
    B(g, 0.08, 0.5, 1.6, wm, -0.7, 1.2, 0);
    B(g, 0.08, 0.5, 1.6, wm, 1.0, 1.2, 0);
    var oil = new T.Mesh(new T.PlaneGeometry(1.6, 1.46), new T.MeshStandardMaterial({ color: 0xd9532a, emissive: 0xff4f1a, emissiveIntensity: 0.05, transparent: true, opacity: 0.55, side: T.DoubleSide }));
    oil.rotation.x = -Math.PI / 2; oil.position.set(0.15, 1.36, 0); g.add(oil);
    var tbl = new T.Group(); tbl.position.set(0.15, 0.95, 0); g.add(tbl);
    B(tbl, 1.1, 0.3, 0.85, dark, 0, 0.15, 0);
    B(g, 0.6, 3.5, 0.7, body, -1.05, 1.75, -0.6);
    B(g, 1.9, 0.5, 0.8, body, -0.1, 3.25, -0.4);
    var ramY = 2.7, rm = new T.Group(); rm.position.set(0.15, ramY, 0); g.add(rm);
    B(rm, 0.5, 0.6, 0.5, steel, 0, 0, 0);
    C(rm, 0.07, 0.07, 0.6, steel, 0, 0.5, 0, 12);
    var el = B(rm, 0.28, 0.5, 0.28, M(0xc0593a, { metalness: 0.9, roughness: 0.3 }), 0, -0.55, 0);
    var spark = new T.Mesh(new T.SphereGeometry(0.1, 12, 10), new T.MeshBasicMaterial({ color: 0xffa58a, transparent: true, opacity: 0 }));
    spark.position.set(0, -0.82, 0); rm.add(spark);
    B(g, 0.75, 2.1, 0.95, dark, 1.75, 1.05, 0.3);
    B(g, 0.52, 0.4, 0.04, glow(0xd0e8eb, 0.8), 1.75, 1.6, 0.79);
    var restY = 1.25 + BH / 2 + 0.0;
    return {
      g: g, tbl: tbl, restY: restY, body: body, w: 3.0, d: 2.0,
      upd: function (t, a) {
        rm.position.y = ramY - a * (0.14 + 0.05 * Math.sin(t * 9));
        oil.material.emissiveIntensity = 0.05 + a * (0.5 + 0.25 * Math.sin(t * 17));
        spark.material.opacity = a * (Math.sin(t * 55) > 0.1 ? 0.95 : 0.15);
        spark.scale.setScalar(0.8 + 0.5 * Math.abs(Math.sin(t * 31)));
      }
    };
  }

  /* surface grinder */
  function grinder(color) {
    var g = new T.Group(), body = M(color, { metalness: 0.3, roughness: 0.45 });
    footprint(g, 2.8, 1.9);
    B(g, 2.6, 0.7, 1.7, body, 0, 0.35, 0);
    var tbl = new T.Group(); tbl.position.set(0, 0.7, 0.1); g.add(tbl);
    B(tbl, 1.7, 0.2, 0.9, dark, 0, 0.1, 0);
    B(tbl, 1.4, 0.1, 0.7, steel, 0, 0.25, 0);
    B(g, 0.7, 2.4, 0.8, body, 0, 1.2, -0.65);
    B(g, 0.9, 0.7, 0.95, body, 0, 2.0, -0.15);
    var wheel = new T.Mesh(new T.CylinderGeometry(0.5, 0.5, 0.14, 40), M(0xe8b1a0, { metalness: 0.1, roughness: 0.9 }));
    wheel.geometry.rotateX(Math.PI / 2); wheel.position.set(0, 2.0, 0.42); g.add(wheel);
    var hub = C(g, 0.12, 0.12, 0.3, steel, 0, 2.0, 0.42, 16); hub.rotation.x = Math.PI / 2;
    for (var i = 0; i < 6; i++) {
      var sp = B(wheel, 0.05, 0.9, 0.16, M(0xb9735e, { roughness: 0.9 }), 0, 0, 0); sp.rotation.z = i * Math.PI / 6;
    }
    var gl = new T.Mesh(new T.SphereGeometry(0.12, 12, 10), new T.MeshBasicMaterial({ color: 0xffa58a, transparent: true, opacity: 0 }));
    gl.position.set(0, 1.48, 0.42); g.add(gl);
    B(g, 0.6, 0.45, 0.1, dark, 1.0, 1.5, 0.78);
    B(g, 0.46, 0.3, 0.02, glow(0xd0e8eb, 0.8), 1.0, 1.5, 0.84);
    var restY = 1.0 + BH / 2;
    return {
      g: g, tbl: tbl, restY: restY, body: body, w: 2.8, d: 1.9,
      upd: function (t, a, dt) {
        wheel.rotation.z -= dt * 9 * a;
        tbl.position.x = Math.sin(t * 1.9) * 0.5 * a;
        gl.material.opacity = a * (0.4 + 0.5 * Math.abs(Math.sin(t * 33)));
        gl.position.x = tbl.position.x * 0.2;
      }
    };
  }

  /* mould work table (fitting / checking) */
  function bench(color) {
    var g = new T.Group(), body = M(color, { metalness: 0.3, roughness: 0.45 });
    footprint(g, 3.0, 1.7);
    B(g, 2.8, 0.2, 1.5, body, 0, 1.0, 0);
    [[-1.25, -0.6], [1.25, -0.6], [-1.25, 0.6], [1.25, 0.6]].forEach(function (p) { B(g, 0.2, 0.9, 0.2, dark, p[0], 0.45, p[1]); });
    B(g, 2.4, 0.08, 1.1, dark, 0, 0.35, 0);
    B(g, 0.55, 0.3, 0.4, M(0xff5f2e, { metalness: 0.2, roughness: 0.6 }), -1.0, 1.25, 0.4);
    for (var i = 0; i < 3; i++) C(g, 0.06, 0.06, 0.4, steel, 0.95 + i * 0.16 - 0.16, 1.3, -0.45, 14);
    /* dial gauge stand */
    C(g, 0.14, 0.14, 0.06, dark, 0.95, 1.13, 0.4, 16);
    C(g, 0.03, 0.03, 0.6, steel, 0.95, 1.45, 0.4, 10);
    B(g, 0.4, 0.04, 0.04, steel, 0.78, 1.72, 0.4);
    var tbl = new T.Group(); tbl.position.set(0, 1.1, 0); g.add(tbl);
    var scan = new T.Mesh(new T.PlaneGeometry(0.75, 0.6), new T.MeshBasicMaterial({ color: 0xd0e8eb, transparent: true, opacity: 0.35, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending }));
    scan.rotation.y = Math.PI / 2; scan.position.y = 0.2; scan.visible = false; tbl.add(scan);
    var restY = 1.1 + BH / 2;
    return {
      g: g, tbl: tbl, restY: restY, body: body, w: 2.8, d: 1.5,
      upd: function (t, a) {
        scan.visible = a > 0.05;
        scan.position.x = Math.sin(t * 2.2) * 0.5;
        scan.material.opacity = 0.1 + 0.3 * a;
      }
    };
  }


  /* 250 T injection moulding press: injection unit on the left, clamp unit on the right, mould sits between the platens */
  function press(color) {
    var g = new T.Group(), body = M(color, { metalness: 0.3, roughness: 0.45 });
    footprint(g, 5.4, 1.7);
    B(g, 5.0, 0.55, 1.2, dark, -0.55, 0.275, 0);
    B(g, 0.32, 1.5, 1.15, body, -0.72, 1.05, 0);                       /* fixed platen */
    B(g, 1.1, 0.12, 0.8, steel, 0, 0.95, 0);                          /* mould tray */
    var mv = new T.Group(); g.add(mv);
    B(mv, 0.32, 1.5, 1.15, body, 0.72, 1.05, 0);                      /* moving platen */
    var ram = C(mv, 0.28, 0.28, 1.1, steel, 1.4, 0.95, 0, 20); ram.rotation.z = Math.PI / 2;
    [[0.65, 0.45], [0.65, -0.45], [1.45, 0.45], [1.45, -0.45]].forEach(function (p) {
      var tb = C(g, 0.06, 0.06, 2.0, steel, 0.12, p[0], p[1], 10); tb.rotation.z = Math.PI / 2;
    });
    B(g, 0.7, 1.4, 0.95, body, 2.2, 0.95, 0);                          /* clamp cylinder housing */
    var barrel = C(g, 0.22, 0.22, 2.4, steel, -2.15, 1.05, 0, 20); barrel.rotation.z = Math.PI / 2;
    var band = new T.Group(); g.add(band);
    var bandM = new T.MeshStandardMaterial({ color: 0xff5f2e, emissive: 0xff4f1a, emissiveIntensity: 0.1, metalness: 0.2, roughness: 0.5 });
    [-2.9, -2.5, -2.1, -1.7].forEach(function (x) { var r = C(band, 0.265, 0.265, 0.14, bandM, x, 1.05, 0, 20); r.rotation.z = Math.PI / 2; });
    var hop = new T.Mesh(new T.CylinderGeometry(0.62, 0.2, 0.7, 4), M(0xecf5f6, { metalness: 0.2, roughness: 0.5 }));
    hop.rotation.y = Math.PI / 4; hop.position.set(-1.9, 1.7, 0); g.add(hop);
    B(g, 1.0, 1.1, 1.0, body, -3.4, 0.85, 0);                          /* injection drive */
    B(g, 0.5, 0.4, 0.06, dark, -0.1, 1.8, 0.62);
    B(g, 0.4, 0.28, 0.02, glow(0xd0e8eb, 0.8), -0.1, 1.8, 0.66);
    var restY = 1.01 + BH / 2;
    return {
      g: g, tbl: new T.Group(), restY: restY, body: body, w: 5.4, d: 1.7,
      upd: function (t, a) {
        mv.position.x = -0.1 - Math.abs(Math.sin(t * 1.7)) * 0.14 * a;
        bandM.emissiveIntensity = 0.1 + a * (0.7 + 0.25 * Math.sin(t * 6));
      }
    };
  }

  /* station layout: [name, color, x, z, model] in crane visiting order */
  var DEF = [
    ['VMC 540V', 0x92c1c9, -4.5, -2.5, vmc(0x92c1c9, 3.0, 2.4, 2.6, 3.1)],
    ['AMS 1060V', 0x6a9fa8, -1.0, -2.5, vmc(0x6a9fa8, 2.3, 2.0, 2.45, 2.95)],
    ['ZNC EDM', 0xa5cdd4, 2.5, -2.5, edm(0xa5cdd4)],
    ['Surface grinder', 0x9fcad1, 4.2, 2.4, grinder(0x9fcad1)],
    ['250 T press', 0xff5f2e, -1.4, 2.7, press(0xbedfe4)]
  ];
  DEF.forEach(function (s, i) {
    var m = s[4];
    m.g.position.set(s[2], 0, s[3]); root.add(m.g);
    /* floor highlight under the active machine */
    var hl = new T.Mesh(new T.PlaneGeometry(m.w + 0.7, m.d + 0.7), new T.MeshBasicMaterial({ color: s[1], transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
    hl.rotation.x = -Math.PI / 2; hl.position.set(s[2], 0.02, s[3]); root.add(hl);
    var hle = new T.LineSegments(new T.EdgesGeometry(hl.geometry), new T.LineBasicMaterial({ color: s[1], transparent: true, opacity: 0 }));
    hle.rotation.x = -Math.PI / 2; hle.position.set(s[2], 0.03, s[3]); root.add(hle);
    m.name = s[0]; m.color = s[1]; m.x = s[2]; m.z = s[3]; m.hl = hl; m.hle = hle;
    m.act = 0; m.hlv = 0; m.baseMat = m.body;
    ST.push(m);
  });

  /* spare blocks on a pallet (just for the look) */
  var pal = new T.Group(); pal.position.set(-6.0, 0, 2.6); root.add(pal);
  B(pal, 1.3, 0.14, 1.0, M(0x7a493a, { roughness: 0.9, metalness: 0.05 }), 0, 0.07, 0);
  var bm = M(0x8f9bb8, { metalness: 0.6, roughness: 0.4 });
  var b1 = B(pal, 0.8, 0.4, 0.6, bm, -0.15, 0.34, 0); edge(b1, 0xa9cdd2, 0.7);
  var b2 = B(pal, 0.7, 0.35, 0.55, bm, -0.1, 0.72, 0.02); edge(b2, 0xff5f2e, 0.7);

  /* ---------- 5 ton EOT crane ---------- */
  var CX = FX + 0.1, CZ = FZ + 0.1, RAIL_Y = 6.0;
  var red = M(0x337781, { metalness: 0.3, roughness: 0.5 });
  var yellow = M(0xff5f2e, { metalness: 0.3, roughness: 0.5 });
  [[-CX, -CZ], [CX, -CZ], [-CX, CZ], [CX, CZ]].forEach(function (p) {
    B(root, 0.3, RAIL_Y, 0.3, dark, p[0], RAIL_Y / 2, p[1]);
  });
  B(root, CX * 2 + 0.5, 0.26, 0.26, steel, 0, RAIL_Y + 0.13, -CZ);
  B(root, CX * 2 + 0.5, 0.26, 0.26, steel, 0, RAIL_Y + 0.13, CZ);
  var bridge = new T.Group(); root.add(bridge);
  B(bridge, 0.42, 0.46, CZ * 2 + 0.3, red, 0, RAIL_Y + 0.5, 0);
  B(bridge, 0.5, 0.32, 0.7, yellow, 0, RAIL_Y + 0.4, -CZ);
  B(bridge, 0.5, 0.32, 0.7, yellow, 0, RAIL_Y + 0.4, CZ);
  var trolley = new T.Group(); bridge.add(trolley);
  B(trolley, 1.6, 0.4, 1.1, yellow, 0.25, RAIL_Y + 0.93, 0);
  C(trolley, 0.2, 0.2, 0.7, dark, 0.55, RAIL_Y + 0.93, 0, 16).rotation.x = Math.PI / 2;
  var TB = RAIL_Y + 0.72;           /* underside of trolley */
  var HOFF = 0.55;                  /* hoist sits beside the bridge beam */
  var rope = C(trolley, 0.025, 0.025, 1, dark, HOFF, 0, 0, 6);
  var hookG = new T.Group(); root.add(hookG);
  B(hookG, 0.42, 0.28, 0.32, yellow, 0, 0, 0);
  var hk = new T.Mesh(new T.TorusGeometry(0.11, 0.032, 8, 20, Math.PI * 1.5), steel); hk.position.y = -0.22; hk.rotation.z = Math.PI * 0.75; hookG.add(hk);
  var sl1 = C(root, 0.018, 0.018, 1, steel, 0, 0, 0, 5), sl2 = C(root, 0.018, 0.018, 1, steel, 0, 0, 0, 5);

  /* the mould block */
  var blk = new T.Group(); root.add(blk);
  var bb = B(blk, 0.8, BH, 0.6, bm, 0, 0, 0); edge(bb, 0xffffff, 0.45);
  var stripes = [0x68a2ab, 0xa9cdd2, 0xff5f2e, 0xa9cdd2, 0x68a2ab, 0xd0e8eb];
  stripes.forEach(function (c, i) { B(blk, 0.8 / 6 * 0.9, 0.012, 0.6, glow(c, 0.8), -0.33 + i * 0.132, BH / 2 + 0.003, 0); });
  C(blk, 0.04, 0.04, 0.12, steel, -0.3, BH / 2 + 0.06, 0, 10);
  C(blk, 0.04, 0.04, 0.12, steel, 0.3, BH / 2 + 0.06, 0, 10);
  var HOOK_DROP = 0.85;              /* hook centre above the block centre */
  var CARRY = 5.15;                  /* hook height while carrying */

  /* ---------- timeline ---------- */
  var L = 7.0, N = ST.length;
  function bpos(s) { return { x: s.x + s.tbl.position.x, y: s.restY, z: s.z + s.tbl.position.z }; }

  var chips = [].slice.call(document.querySelectorAll('#wk-list [data-i]'));
  var cap = document.getElementById('wk-cap');
  var lastHl = -1, lastCap = '';

  function setCap(txt) { if (cap && txt !== lastCap) { cap.textContent = txt; lastCap = txt; } }
  function setHl(i) {
    if (i === lastHl) return; lastHl = i;
    chips.forEach(function (c) { c.classList.toggle('on', +c.getAttribute('data-i') === i); });
  }

  var m = { x: 0, y: 0 }, mouse = { x: 0, y: 0 };
  window.addEventListener('pointermove', function (e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  function place(t, dt) {
    var tt = t % (L * N), k = Math.floor(tt / L), u = (tt - k * L) / L;
    var a = ST[k], b = ST[(k + 1) % N];
    var pa = bpos(a), pb = bpos(b);
    var hx, hz, hy, attached = false, bx, by, bz;
    var pickY = pa.y + HOOK_DROP, placeY = pb.y + HOOK_DROP;

    if (u < 0.10) { hx = pa.x; hz = pa.z; hy = lerp(CARRY, pickY, ss(u / 0.10)); }
    else if (u < 0.20) { hx = pa.x; hz = pa.z; hy = lerp(pickY, CARRY, ss((u - 0.10) / 0.10)); attached = true; }
    else if (u < 0.48) {
      var s = ss((u - 0.20) / 0.28);
      hx = lerp(pa.x, pb.x, s); hz = lerp(pa.z, pb.z, s); hy = CARRY; attached = true;
    }
    else if (u < 0.58) { hx = pb.x; hz = pb.z; hy = lerp(CARRY, placeY, ss((u - 0.48) / 0.10)); attached = true; }
    else if (u < 0.68) { hx = pb.x; hz = pb.z; hy = lerp(placeY, CARRY, ss((u - 0.58) / 0.10)); }
    else { hx = pb.x; hz = pb.z; hy = CARRY; }

    bridge.position.x = hx - HOFF; trolley.position.z = hz;
    hookG.position.set(hx, hy, hz);
    rope.position.set(HOFF, (TB + hy + 0.14) / 2, 0);
    rope.scale.set(1, TB - hy - 0.14, 1);

    if (attached) { bx = hx; by = hy - HOOK_DROP; bz = hz; }
    else if (u < 0.10) { bx = pa.x; by = pa.y; bz = pa.z; }
    else { bx = pb.x; by = pb.y; bz = pb.z; }
    blk.position.set(bx, by, bz);
    /* slings hang rigidly from the hook, so they always look attached */
    link(sl1, new T.Vector3(hx, hy - 0.2, hz), new T.Vector3(hx - 0.3, hy - 0.53, hz));
    link(sl2, new T.Vector3(hx, hy - 0.2, hz), new T.Vector3(hx + 0.3, hy - 0.53, hz));

    /* which machine has the block / is being served */
    var hi = u < 0.20 ? k : (k + 1) % N;
    for (var i = 0; i < N; i++) {
      var s2 = ST[i];
      var working = (i === k && u < 0.10) || (i === (k + 1) % N && u >= 0.58);
      s2.act += ((working ? 1 : 0) - s2.act) * Math.min(1, dt * 3);
      s2.hlv += ((i === hi ? 1 : 0) - s2.hlv) * Math.min(1, dt * 4);
      s2.upd(t, s2.act, dt);
      var pulse = s2.hlv * (0.75 + 0.25 * Math.sin(t * 4));
      s2.hl.material.opacity = 0.2 * pulse; s2.hle.material.opacity = 0.9 * s2.hlv;
      s2.baseMat.emissive.setHex(s2.color); s2.baseMat.emissiveIntensity = 0.28 * s2.hlv;
    }
    setHl(hi);
    var nm = ST[hi].name;
    setCap(u < 0.10 ? 'Gantry crane hooks the block at ' + ST[k].name :
      u < 0.20 ? 'Lifting the mould block' :
      u < 0.48 ? 'Carrying the block to ' + b.name :
      u < 0.58 ? 'Lowering onto ' + b.name : nm + ' is working');
  }

  /* ---------- size, camera, loop ---------- */
  var AZ = 0.70, EL = 0.58;
  function setCam() {
    var az = AZ + m.x * 0.1, el = EL - m.y * 0.04, d = 60;
    cam.position.set(TARGET.x + d * Math.sin(az) * Math.cos(el), TARGET.y + d * Math.sin(el), TARGET.z + d * Math.cos(az) * Math.cos(el));
    cam.lookAt(TARGET);
  }
  function size() {
    var w = wrap.clientWidth || 600, h = wrap.clientHeight || 480;
    renderer.setSize(w, h, false);
    var hw = 8.6, hh = hw / (w / h);
    if (hh < 6.9) { hh = 6.9; hw = hh * (w / h); }
    cam.left = -hw; cam.right = hw; cam.top = hh; cam.bottom = -hh; cam.updateProjectionMatrix();
  }

  var vis = true, raf = 0, t0 = performance.now(), last = 0;
  function draw(t, dt) {
    m.x += (mouse.x - m.x) * 0.05; m.y += (mouse.y - m.y) * 0.05;
    place(t, dt); setCam();
    renderer.render(scene, cam);
  }
  function frame(now) {
    raf = 0;
    if (!vis || document.hidden) return;
    var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    draw((now - t0) / 1000 + 4, dt);
    raf = requestAnimationFrame(frame);
  }
  function start() { last = 0; if (!raf && vis && !document.hidden) raf = requestAnimationFrame(frame); }

  size();
  if ('ResizeObserver' in window) new ResizeObserver(function () { size(); if (reduce) draw(22, 0.016); }).observe(wrap);
  else window.addEventListener('resize', size);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) start(); }, { rootMargin: '80px' }).observe(wrap);
  }
  document.addEventListener('visibilitychange', start);

  if (reduce) { draw(22, 0.016); } else { start(); }
  wrap.classList.add('gl');
})();
