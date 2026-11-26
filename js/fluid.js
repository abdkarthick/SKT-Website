/* footer: cursor-driven fluid / smoke simulation (WebGL), SKT purple. Rainbow Moulds idea, recoloured. */
(function () {
  var ft = document.querySelector('footer'); if (!ft) return;
  var cv = document.createElement('canvas'); cv.className = 'fluid'; cv.setAttribute('aria-hidden', 'true');
  ft.insertBefore(cv, ft.firstChild);
  var opt = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false };
  var gl = cv.getContext('webgl2', opt), gl2 = !!gl;
  if (!gl) gl = cv.getContext('webgl', opt) || cv.getContext('experimental-webgl', opt);
  if (!gl) { cv.remove(); return; }
  var halfType, ifmt = gl.RGBA;
  if (gl2) { gl.getExtension('EXT_color_buffer_float'); gl.getExtension('EXT_color_buffer_half_float'); halfType = gl.HALF_FLOAT; ifmt = gl.RGBA16F; }
  else {
    var hf = gl.getExtension('OES_texture_half_float');
    if (!hf || !gl.getExtension('OES_texture_half_float_linear')) { cv.remove(); return; }
    gl.getExtension('EXT_color_buffer_half_float'); halfType = hf.HALF_FLOAT_OES;
  }
  var P = { SIM: 128, DYE: 512, DENS: 1.8, VEL: 0.9, PRES: 0.8, ITER: 20, CURL: 30, RAD: 0.26, FORCE: 4500, COL: [0.44, 0.22, 0.86], INT: 0.2 };

  var VS = 'precision highp float;attribute vec2 aPosition;varying vec2 vUv,vL,vR,vT,vB;uniform vec2 texelSize;' +
    'void main(){vUv=aPosition*0.5+0.5;vL=vUv-vec2(texelSize.x,0.);vR=vUv+vec2(texelSize.x,0.);vT=vUv+vec2(0.,texelSize.y);vB=vUv-vec2(0.,texelSize.y);gl_Position=vec4(aPosition,0.,1.);}';
  var H = 'precision highp float;precision highp sampler2D;varying vec2 vUv,vL,vR,vT,vB;';
  var FS = {
    splat: H + 'uniform sampler2D uTarget;uniform float aspectRatio;uniform vec3 color;uniform vec2 point;uniform float radius;' +
      'void main(){vec2 p=vUv-point;p.x*=aspectRatio;vec3 s=exp(-dot(p,p)/radius)*color;gl_FragColor=vec4(texture2D(uTarget,vUv).xyz+s,1.);}',
    adv: H + 'uniform sampler2D uVelocity,uSource;uniform vec2 texelSize;uniform float dt,dissipation;' +
      'void main(){vec2 c=vUv-dt*texture2D(uVelocity,vUv).xy*texelSize;gl_FragColor=texture2D(uSource,c)/(1.+dissipation*dt);}',
    div: H + 'uniform sampler2D uVelocity;' +
      'void main(){float L=texture2D(uVelocity,vL).x,R=texture2D(uVelocity,vR).x,T=texture2D(uVelocity,vT).y,B=texture2D(uVelocity,vB).y;vec2 C=texture2D(uVelocity,vUv).xy;' +
      'if(vL.x<0.)L=-C.x;if(vR.x>1.)R=-C.x;if(vT.y>1.)T=-C.y;if(vB.y<0.)B=-C.y;gl_FragColor=vec4(.5*(R-L+T-B),0.,0.,1.);}',
    curl: H + 'uniform sampler2D uVelocity;' +
      'void main(){float L=texture2D(uVelocity,vL).y,R=texture2D(uVelocity,vR).y,T=texture2D(uVelocity,vT).x,B=texture2D(uVelocity,vB).x;gl_FragColor=vec4(.5*(R-L-T+B),0.,0.,1.);}',
    vort: H + 'uniform sampler2D uVelocity,uCurl;uniform float curl,dt;' +
      'void main(){float L=texture2D(uCurl,vL).x,R=texture2D(uCurl,vR).x,T=texture2D(uCurl,vT).x,B=texture2D(uCurl,vB).x,C=texture2D(uCurl,vUv).x;' +
      'vec2 f=.5*vec2(abs(T)-abs(B),abs(R)-abs(L));f/=length(f)+.0001;f*=curl*C;f.y*=-1.;vec2 v=texture2D(uVelocity,vUv).xy+f*dt;gl_FragColor=vec4(clamp(v,-1000.,1000.),0.,1.);}',
    pres: H + 'uniform sampler2D uPressure,uDivergence;' +
      'void main(){float L=texture2D(uPressure,vL).x,R=texture2D(uPressure,vR).x,T=texture2D(uPressure,vT).x,B=texture2D(uPressure,vB).x;float d=texture2D(uDivergence,vUv).x;gl_FragColor=vec4((L+R+B+T-d)*.25,0.,0.,1.);}',
    grad: H + 'uniform sampler2D uPressure,uVelocity;' +
      'void main(){float L=texture2D(uPressure,vL).x,R=texture2D(uPressure,vR).x,T=texture2D(uPressure,vT).x,B=texture2D(uPressure,vB).x;vec2 v=texture2D(uVelocity,vUv).xy-vec2(R-L,T-B);gl_FragColor=vec4(v,0.,1.);}',
    clear: H + 'uniform sampler2D uTexture;uniform float value;void main(){gl_FragColor=value*texture2D(uTexture,vUv);}',
    show: H + 'uniform sampler2D uTexture;void main(){vec3 c=max(texture2D(uTexture,vUv).rgb,0.);float a=clamp(max(c.r,max(c.g,c.b)),0.,1.);gl_FragColor=vec4(min(c,vec3(a)),a);}'
  };
  function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; }
  var vs = sh(gl.VERTEX_SHADER, VS), bad = !vs, pr = {};
  Object.keys(FS).forEach(function (k) {
    var f = sh(gl.FRAGMENT_SHADER, FS[k]); if (!f || !vs) { bad = true; return; }
    var p = gl.createProgram(); gl.attachShader(p, vs); gl.attachShader(p, f); gl.bindAttribLocation(p, 0, 'aPosition'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { bad = true; return; }
    var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) { var nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
    pr[k] = { p: p, u: u };
  });
  if (bad) { cv.remove(); return; }
  var vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
  var ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(0);
  var cur = null;
  function use(k) { cur = pr[k]; gl.useProgram(cur.p); return cur.u; }
  function blit(t) {
    if (t) { gl.viewport(0, 0, t.w, t.h); gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo); }
    else { gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }
  function fbo(w, h) {
    var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, gl.RGBA, halfType, null);
    var f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex: t, fbo: f, w: w, h: h, tx: [1 / w, 1 / h], at: function (i) { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t); return i; } };
  }
  function dbl(w, h) { var a = fbo(w, h), b = fbo(w, h); return { w: w, h: h, tx: a.tx, get read() { return a; }, get write() { return b; }, swap: function () { var x = a; a = b; b = x; } }; }
  var vel, dye, prs, dv, cu, ok = false;
  function dim(r) {
    var W = gl.drawingBufferWidth, Hh = gl.drawingBufferHeight, ar = W / Hh; if (ar < 1) ar = 1 / ar;
    var mn = Math.round(r), mx = Math.round(r * ar); return W > Hh ? { w: mx, h: mn } : { w: mn, h: mx };
  }
  function init() {
    var w = Math.max(2, ft.clientWidth), h = Math.max(2, ft.clientHeight);
    if (cv.width === w && cv.height === h && ok) return;
    cv.width = w; cv.height = h;
    var s = dim(P.SIM), d = dim(P.DYE);
    vel = dbl(s.w, s.h); dye = dbl(d.w, d.h); prs = dbl(s.w, s.h); dv = fbo(s.w, s.h); cu = fbo(s.w, s.h);
    ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    if (!ok) { cv.remove(); stop = true; }
  }
  function splat(x, y, dx, dy, col) {
    var u = use('splat'); gl.uniform1f(u.aspectRatio, cv.width / cv.height); gl.uniform2f(u.point, x, y);
    var r = P.RAD / 100; if (cv.width / cv.height > 1) r *= cv.width / cv.height; gl.uniform1f(u.radius, r);
    gl.uniform1i(u.uTarget, vel.read.at(0)); gl.uniform3f(u.color, dx, dy, 0); blit(vel.write); vel.swap();
    gl.uniform1i(u.uTarget, dye.read.at(0)); gl.uniform3f(u.color, col[0], col[1], col[2]); blit(dye.write); dye.swap();
  }
  function step(dt) {
    gl.disable(gl.BLEND); var u;
    u = use('curl'); gl.uniform2f(u.texelSize, vel.tx[0], vel.tx[1]); gl.uniform1i(u.uVelocity, vel.read.at(0)); blit(cu);
    u = use('vort'); gl.uniform2f(u.texelSize, vel.tx[0], vel.tx[1]); gl.uniform1i(u.uVelocity, vel.read.at(0)); gl.uniform1i(u.uCurl, cu.at(1)); gl.uniform1f(u.curl, P.CURL); gl.uniform1f(u.dt, dt); blit(vel.write); vel.swap();
    u = use('div'); gl.uniform2f(u.texelSize, vel.tx[0], vel.tx[1]); gl.uniform1i(u.uVelocity, vel.read.at(0)); blit(dv);
    u = use('clear'); gl.uniform1i(u.uTexture, prs.read.at(0)); gl.uniform1f(u.value, P.PRES); blit(prs.write); prs.swap();
    u = use('pres'); gl.uniform2f(u.texelSize, vel.tx[0], vel.tx[1]); gl.uniform1i(u.uDivergence, dv.at(0));
    for (var i = 0; i < P.ITER; i++) { gl.uniform1i(u.uPressure, prs.read.at(1)); blit(prs.write); prs.swap(); }
    u = use('grad'); gl.uniform2f(u.texelSize, vel.tx[0], vel.tx[1]); gl.uniform1i(u.uPressure, prs.read.at(0)); gl.uniform1i(u.uVelocity, vel.read.at(1)); blit(vel.write); vel.swap();
    u = use('adv'); gl.uniform2f(u.texelSize, vel.tx[0], vel.tx[1]); gl.uniform1i(u.uVelocity, vel.read.at(0)); gl.uniform1i(u.uSource, vel.read.at(0)); gl.uniform1f(u.dt, dt); gl.uniform1f(u.dissipation, P.VEL); blit(vel.write); vel.swap();
    gl.uniform1i(u.uVelocity, vel.read.at(0)); gl.uniform1i(u.uSource, dye.read.at(1)); gl.uniform1f(u.dissipation, P.DENS); blit(dye.write); dye.swap();
    u = use('show'); gl.uniform2f(u.texelSize, dye.tx[0], dye.tx[1]); gl.uniform1i(u.uTexture, dye.read.at(0)); blit(null);
  }
  var run = false, last = 0, lastMove = 0, stop = false;
  function loop(now) {
    if (stop) { run = false; return; }
    var dt = Math.min((now - last) / 1000, 0.0167) || 0.0167; last = now;
    step(dt);
    if (now - lastMove > 6000) { run = false; return; }
    requestAnimationFrame(loop);
  }
  function wake() { lastMove = performance.now(); if (!run && !stop) { run = true; last = performance.now(); requestAnimationFrame(loop); } }
  var px = null, py = null;
  function move(e) {
    init(); if (stop) return;
    var r = ft.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = 1 - (e.clientY - r.top) / r.height;
    if (px === null) { px = x; py = y; }
    var ar = r.width / r.height, dx = x - px, dy = y - py; if (ar < 1) dx *= ar; if (ar > 1) dy /= ar;
    if (Math.abs(dx) + Math.abs(dy) > 0) {
      var c = [P.COL[0] * P.INT, P.COL[1] * P.INT, P.COL[2] * P.INT];
      splat(x, y, dx * P.FORCE, dy * P.FORCE, c); wake();
    }
    px = x; py = y;
  }
  ft.addEventListener('pointermove', move);
  ft.addEventListener('pointerdown', function (e) { px = null; move(e); });
  ft.addEventListener('pointerleave', function () { px = null; });
  if (window.ResizeObserver) new ResizeObserver(function () { ok = false; }).observe(ft);
})();
