/* ============================================================
   dunyo.js — relyef, daraxt, o‘t, gul, tosh, ko‘l, zarrachalar
   ============================================================ */
const Dunyo = {};

(function () {
  'use strict';

  const KOL = { x: 46, z: -34, r: 24 };   // ko‘l markazi va radiusi
  const SUV_Y = -1.0;
  const BOYI = 440;
  const MAX_DARAXT = 240, MAX_GUL = 400, MAX_TOSH = 46, MAX_OT = 13500, MAX_ZARRA = 150;
  const OT_R = 100, OT_G = 1.6;

  function mulberry(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ---------- shovqin (noise) va balandlik ---------- */
  function hash(x, y) {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
    return s - Math.floor(s);
  }
  function vn(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return (a + (b - a) * u) + ((c + (d - c) * u) - (a + (b - a) * u)) * v;
  }
  function fbm(x, y) {
    return vn(x, y) * 0.55 + vn(x * 2.1 + 5.2, y * 2.1 + 1.3) * 0.3 + vn(x * 4.3 + 9.1, y * 4.3 + 3.7) * 0.15;
  }
  function ss(a, b, x) {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }
  function balandlik(x, z) {
    let h = (fbm(x * 0.012, z * 0.012) - 0.5) * 30;
    const d0 = Math.hypot(x, z);
    h = h * (0.15 + 0.85 * ss(6, 40, d0)) + 1.6 * (1 - ss(0, 50, d0));
    const dl = Math.hypot(x - KOL.x, z - KOL.z);
    h = h + (1.5 - h) * ss(KOL.r * 1.9, KOL.r * 1.0, dl);
    h = h + (-3.4 - h) * ss(KOL.r * 0.95, KOL.r * 0.45, dl);
    return h;
  }
  Dunyo.balandlik = balandlik;
  Dunyo.kol = KOL;

  /* ---------- yer rangi (balandlikka qarab) ---------- */
  const RAMPA = [
    [-4, 0x3a8fa3], [-0.8, 0x4fb0b8], [-0.3, 0xeadfa8], [0.5, 0xbfe08e], [1.5, 0x7bd47f],
    [4, 0x55b96f], [7, 0x8fd27f], [10, 0xcdeaa5], [14, 0xf0f6d6]
  ].map(function (s) { return [s[0], new THREE.Color(s[1])]; });
  const _r = new THREE.Color();
  function yerRangi(h, x, z) {
    let i = 0;
    while (i < RAMPA.length - 2 && h > RAMPA[i + 1][0]) i++;
    const a = RAMPA[i], b = RAMPA[i + 1];
    const t = Math.max(0, Math.min(1, (h - a[0]) / (b[0] - a[0])));
    _r.copy(a[1]).lerp(b[1], t);
    const k = 1 + (vn(x * 0.07, z * 0.07) - 0.5) * 0.22;
    _r.multiplyScalar(k);
    return _r;
  }

  /* ---------- yordamchilar ---------- */
  const dum = new THREE.Object3D();
  function matritsa(m, i, x, y, z, ry, sx, sy, sz) {
    dum.position.set(x, y, z);
    dum.rotation.set(0, ry, 0);
    dum.scale.set(sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz);
    dum.updateMatrix();
    m.setMatrixAt(i, dum.matrix);
  }
  function M4(x, y, z, sx, sy, sz) {
    return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(sx, sy, sz));
  }
  function sanash(mesh, n) {
    mesh.count = n;
    mesh.children.forEach(function (c) { c.count = n; });
  }

  let grup, rnd;
  let terra, suvMesh, suvMat;
  let tanaMesh, bargMesh, gulSaqich, gulBosh, toshMesh;
  let otMesh, otMat, otMerkez = { x: 1e9, z: 1e9 }, otZichlik = 1;
  let zarraGeo, zarraMat, zarraPos, zarraFaza, zarraBal, zarraSoni = 90;
  let daraxtSoni = 160;
  const toqnashuvDaraxt = [], toqnashuvTosh = [];

  /* ---------- relyef ---------- */
  function relyefYasa() {
    const geo = new THREE.PlaneGeometry(BOYI, BOYI, 170, 170);
    geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position;
    const ranglar = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      const h = balandlik(x, z);
      p.setY(i, h);
      const c = yerRangi(h, x, z);
      ranglar[i * 3] = c.r; ranglar[i * 3 + 1] = c.g; ranglar[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(ranglar, 3));
    geo.computeVertexNormals();
    terra = new THREE.Mesh(geo, Sahna.toon(0xffffff, { vertexColors: true }));
    terra.receiveShadow = true;
    grup.add(terra);
  }

  /* ---------- ko‘l (animatsiyalangan suv) ---------- */
  function suvYasa() {
    suvMat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uT: { value: 0 } }]),
      vertexShader: [
        'varying vec3 vP;',
        '#include <fog_pars_vertex>',
        'void main(){',
        '  vec4 wp = modelMatrix * vec4(position, 1.0);',
        '  vP = wp.xyz;',
        '  vec4 mvPosition = viewMatrix * wp;',
        '  gl_Position = projectionMatrix * mvPosition;',
        '  #include <fog_vertex>',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float uT; varying vec3 vP;',
        '#include <fog_pars_fragment>',
        'void main(){',
        '  float w = sin(vP.x*0.6+uT*0.9) + sin(vP.z*0.8-uT*0.7) + sin((vP.x+vP.z)*0.4+uT*0.5);',
        '  w = w/3.0*0.5 + 0.5;',
        '  float b = floor(w*3.0)/3.0;',
        '  vec3 c = mix(vec3(0.25,0.72,0.85), vec3(0.55,0.90,0.95), b);',
        '  float sp = step(0.93, sin(vP.x*2.1+uT*1.3)*sin(vP.z*2.3-uT*1.1)*0.5+0.5);',
        '  c += sp*0.35;',
        '  gl_FragColor = vec4(c, 0.88);',
        '  #include <fog_fragment>',
        '}'
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      fog: true
    });
    const g = new THREE.CircleGeometry(KOL.r * 0.9, 48);
    g.rotateX(-Math.PI / 2);
    suvMesh = new THREE.Mesh(g, suvMat);
    suvMesh.position.set(KOL.x, SUV_Y, KOL.z);
    suvMesh.renderOrder = 2;
    grup.add(suvMesh);
  }

  /* ---------- daraxtlar ---------- */
  function daraxtYasa() {
    const royxat = [];
    let urinish = 0;
    while (royxat.length < MAX_DARAXT && urinish < 9000) {
      urinish++;
      const x = (rnd() - 0.5) * 400, z = (rnd() - 0.5) * 400;
      if (Math.hypot(x, z) < 9) continue;
      if (Math.hypot(x - KOL.x, z - KOL.z) < KOL.r * 1.1) continue;
      if (vn(x * 0.025 + 11, z * 0.025 - 7) < 0.35 + rnd() * 0.2) continue;
      const h = balandlik(x, z);
      if (h < 0.3) continue;
      let yaqin = false;
      for (let j = 0; j < royxat.length; j++) {
        const dx = royxat[j].x - x, dz = royxat[j].z - z;
        if (dx * dx + dz * dz < 9) { yaqin = true; break; }
      }
      if (yaqin) continue;
      royxat.push({ x: x, z: z, h: h, s: 0.8 + rnd() * 0.9 });
    }
    const n = royxat.length;

    const tanaG = new THREE.CylinderGeometry(0.2, 0.36, 3.2, 7);
    tanaG.translate(0, 1.6, 0);
    const ico = new THREE.IcosahedronGeometry(1, 1);
    const bargG = Sahna.birlashtir([
      { g: ico, m: M4(0, 4.2, 0, 1.55, 1.3, 1.55) },
      { g: ico, m: M4(1.0, 3.5, 0.4, 1.1, 0.95, 1.1) },
      { g: ico, m: M4(-0.9, 3.4, -0.5, 1.2, 1.0, 1.2) },
      { g: ico, m: M4(0.1, 5.3, 0.1, 1.0, 0.9, 1.0) }
    ]);

    tanaMesh = new THREE.InstancedMesh(tanaG, Sahna.toon(0x8d6249), n);
    bargMesh = new THREE.InstancedMesh(bargG, Sahna.toon(0xffffff), n);
    const palitra = [0x5fcf7a, 0x49b872, 0x7fd88a, 0x3fae8a, 0x9be08c].map(function (c) { return new THREE.Color(c); });
    const gul = new THREE.Color(0xf6a8c8);
    for (let i = 0; i < n; i++) {
      const t = royxat[i];
      const ry = rnd() * 6.283;
      matritsa(tanaMesh, i, t.x, t.h - 0.2, t.z, ry, t.s, t.s * (0.9 + rnd() * 0.3), t.s);
      matritsa(bargMesh, i, t.x, t.h - 0.2, t.z, ry, t.s, t.s * (0.9 + rnd() * 0.3), t.s);
      bargMesh.setColorAt(i, rnd() < 0.1 ? gul : palitra[Math.floor(rnd() * palitra.length)]);
      toqnashuvDaraxt.push({ x: t.x, z: t.z, r: 0.42 * t.s });
    }
    [tanaMesh, bargMesh].forEach(function (m) {
      m.castShadow = true;
      m.receiveShadow = true;
      m.frustumCulled = false;
      m.instanceMatrix.needsUpdate = true;
    });
    bargMesh.instanceColor.needsUpdate = true;
    Sahna.kontur(tanaMesh, 0.03, 0x3c2a22);
    Sahna.kontur(bargMesh, 0.05, 0x1f5a48);
    grup.add(tanaMesh, bargMesh);
  }

  /* ---------- o‘t (InstancedMesh + shamolda tebranadi) ---------- */
  function otYasa() {
    const pos = [];
    const rr = mulberry(777);
    for (let b = 0; b < 5; b++) {
      const a = rr() * 6.283, ox = (rr() - 0.5) * 0.5, oz = (rr() - 0.5) * 0.5;
      const w = 0.05 + rr() * 0.03, ht = 0.65 + rr() * 0.45, lean = (rr() - 0.5) * 0.35;
      const ca = Math.cos(a), sa = Math.sin(a);
      const P = function (lx, ly) { return [ox + lx * ca, ly, oz - lx * sa]; };
      const A = P(-w, 0), B = P(w, 0), C = P(lean, ht);
      pos.push(A[0], A[1], A[2], B[0], B[1], B[2], C[0], C[1], C[2]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));

    otMat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uT: { value: 0 }, uP: { value: new THREE.Vector3() } }]),
      vertexShader: [
        'uniform float uT; uniform vec3 uP;',
        'varying float vH; varying float vM;',
        '#include <fog_pars_vertex>',
        'void main(){',
        '  vec3 p = position;',
        '  vH = clamp(p.y / 1.1, 0.0, 1.0);',
        '  vec3 base = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;',
        '  float d = length(base.xz - uP.xz);',
        '  p.y *= 1.0 - smoothstep(60.0, 95.0, d);',
        '  vec4 ip = instanceMatrix * vec4(p, 1.0);',
        '  float w = sin(uT*1.8 + base.x*0.35 + base.z*0.27) + sin(uT*2.7 + base.x*0.9)*0.4;',
        '  ip.x += w * 0.18 * vH * vH;',
        '  ip.z += w * 0.10 * vH * vH;',
        '  vM = fract(sin(base.x*12.9898 + base.z*78.233) * 43758.5453);',
        '  vec4 mvPosition = modelViewMatrix * ip;',
        '  gl_Position = projectionMatrix * mvPosition;',
        '  #include <fog_vertex>',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying float vH; varying float vM;',
        '#include <fog_pars_fragment>',
        'void main(){',
        '  vec3 c = mix(vec3(0.20,0.58,0.30), vec3(0.62,0.90,0.42), vH);',
        '  c = mix(c, c*vec3(1.1,1.05,0.85), vM*0.5);',
        '  gl_FragColor = vec4(c, 1.0);',
        '  #include <fog_fragment>',
        '}'
      ].join('\n'),
      side: THREE.DoubleSide,
      fog: true
    });
    otMesh = new THREE.InstancedMesh(g, otMat, MAX_OT);
    otMesh.frustumCulled = false;
    otMesh.count = 0;
    grup.add(otMesh);
  }

  // O‘tni o‘yinchi atrofida qayta joylashtirish (dunyo katakchalariga bog‘langan, shuning uchun sakramaydi)
  function otYangila(cx, cz) {
    otMerkez = { x: cx, z: cz };
    const ci0 = Math.round(cx / OT_G), cj0 = Math.round(cz / OT_G);
    const N = Math.ceil(OT_R / OT_G) + 1;
    let k = 0;
    for (let i = -N; i <= N && k < MAX_OT; i++) {
      for (let j = -N; j <= N; j++) {
        const ci = ci0 + i, cj = cj0 + j;
        if (hash(ci * 0.71 + 3.1, cj * 0.93 + 7.7) > otZichlik) continue;
        const x = (ci + hash(ci * 1.31, cj * 2.17)) * OT_G;
        const z = (cj + hash(ci * 3.77 + 1.2, cj * 0.57)) * OT_G;
        const dx = x - cx, dz = z - cz;
        if (dx * dx + dz * dz > OT_R * OT_R) continue;
        if (Math.hypot(x - KOL.x, z - KOL.z) < KOL.r * 0.98) continue;
        const h = balandlik(x, z);
        if (h < 0.0) continue;
        const s = 0.8 + hash(ci * 5.3, cj * 1.9) * 0.8;
        matritsa(otMesh, k++, x, h, z, hash(ci * 2.9, cj * 4.1) * 6.283, s, s * (0.8 + hash(ci * 9.1, cj * 0.3) * 0.7), s);
        if (k >= MAX_OT) break;
      }
    }
    otMesh.count = k;
    otMesh.instanceMatrix.needsUpdate = true;
  }

  /* ---------- gullar ---------- */
  function gulYasa() {
    const stemG = new THREE.CylinderGeometry(0.012, 0.016, 1, 4);
    stemG.translate(0, 0.5, 0);
    const sfera = new THREE.SphereGeometry(0.06, 6, 4);
    const qismlar = [{ g: new THREE.SphereGeometry(0.05, 6, 4), m: M4(0, 0.02, 0, 1, 1, 1) }];
    for (let k = 0; k < 6; k++) {
      const a = k * Math.PI / 3;
      qismlar.push({ g: sfera, m: M4(Math.cos(a) * 0.085, 0, Math.sin(a) * 0.085, 1, 0.45, 1) });
    }
    const boshG = Sahna.birlashtir(qismlar);

    // gul to‘dalari
    const markazlar = [];
    for (let i = 0; i < 14; i++) {
      for (let t = 0; t < 30; t++) {
        const x = (rnd() - 0.5) * 300, z = (rnd() - 0.5) * 300;
        if (Math.hypot(x, z) < 6) continue;
        if (Math.hypot(x - KOL.x, z - KOL.z) < KOL.r * 1.05) continue;
        if (balandlik(x, z) < 0.5) continue;
        markazlar.push({ x: x, z: z });
        break;
      }
    }
    const nM = markazlar.length;
    gulSaqich = new THREE.InstancedMesh(stemG, Sahna.toon(0x4fae5f), MAX_GUL);
    gulBosh = new THREE.InstancedMesh(boshG, Sahna.toon(0xffffff), MAX_GUL);
    const ranglar = [0xff8fb8, 0xffd86b, 0xffffff, 0xb79cff, 0xff9a6b].map(function (c) { return new THREE.Color(c); });
    let n = 0;
    for (let j = 0; n < MAX_GUL && nM > 0; j++) {
      for (let c = 0; c < nM && n < MAX_GUL; c++) {
        const a = rnd() * 6.283, d = 4.5 * Math.sqrt(rnd());
        const x = markazlar[c].x + Math.cos(a) * d, z = markazlar[c].z + Math.sin(a) * d;
        const h = balandlik(x, z);
        if (h < 0.4 || Math.hypot(x - KOL.x, z - KOL.z) < KOL.r * 1.0) { continue; }
        const sh = 0.25 + rnd() * 0.25, s = 0.9 + rnd() * 0.7;
        matritsa(gulSaqich, n, x, h, z, 0, 1, sh, 1);
        matritsa(gulBosh, n, x, h + sh, z, rnd() * 6.283, s);
        gulBosh.setColorAt(n, ranglar[(c + j) % ranglar.length]);
        n++;
      }
      if (j > 200) break;
    }
    gulSaqich.count = gulBosh.count = n;
    gulSaqich.userData.max = gulBosh.userData.max = n;
    gulSaqich.frustumCulled = gulBosh.frustumCulled = false;
    gulSaqich.instanceMatrix.needsUpdate = gulBosh.instanceMatrix.needsUpdate = true;
    if (gulBosh.instanceColor) gulBosh.instanceColor.needsUpdate = true;
    grup.add(gulSaqich, gulBosh);
  }

  /* ---------- toshlar ---------- */
  function toshYasa() {
    const g = new THREE.DodecahedronGeometry(1, 0);
    toshMesh = new THREE.InstancedMesh(g, Sahna.toon(0xffffff), MAX_TOSH);
    const ranglar = [0xa9b8c9, 0xb8aea0, 0x9aa9b6].map(function (c) { return new THREE.Color(c); });
    let n = 0, urinish = 0;
    while (n < MAX_TOSH && urinish < 600) {
      urinish++;
      let x, z;
      if (n < 12) { // bir qismi ko‘l bo‘yida
        const a = rnd() * 6.283, d = KOL.r * (0.95 + rnd() * 0.35);
        x = KOL.x + Math.cos(a) * d; z = KOL.z + Math.sin(a) * d;
      } else {
        x = (rnd() - 0.5) * 380; z = (rnd() - 0.5) * 380;
      }
      if (Math.hypot(x, z) < 7) continue;
      const h = balandlik(x, z);
      if (h < 0.0) continue;
      const sx = 0.6 + rnd() * 1.0, sy = 0.4 + rnd() * 0.6, sz = 0.6 + rnd() * 1.0;
      dum.position.set(x, h + sy * 0.15, z);
      dum.rotation.set((rnd() - 0.5) * 0.4, rnd() * 6.283, (rnd() - 0.5) * 0.4);
      dum.scale.set(sx, sy, sz);
      dum.updateMatrix();
      toshMesh.setMatrixAt(n, dum.matrix);
      toshMesh.setColorAt(n, ranglar[Math.floor(rnd() * ranglar.length)]);
      toqnashuvTosh.push({ x: x, z: z, r: Math.max(sx, sz) * 0.8 });
      n++;
    }
    toshMesh.count = n;
    toshMesh.castShadow = true;
    toshMesh.receiveShadow = true;
    toshMesh.frustumCulled = false;
    toshMesh.instanceMatrix.needsUpdate = true;
    toshMesh.instanceColor.needsUpdate = true;
    Sahna.kontur(toshMesh, 0.06, 0x2e3b4e);
    grup.add(toshMesh);
  }

  /* ---------- suzuvchi yorug‘lik zarrachalari (yorug‘lik qurtlari) ---------- */
  function zarraYasa() {
    zarraPos = new Float32Array(MAX_ZARRA * 3);
    zarraFaza = new Float32Array(MAX_ZARRA);
    zarraBal = new Float32Array(MAX_ZARRA);
    for (let i = 0; i < MAX_ZARRA; i++) {
      zarraPos[i * 3] = (rnd() - 0.5) * 60;
      zarraPos[i * 3 + 1] = 2;
      zarraPos[i * 3 + 2] = (rnd() - 0.5) * 60;
      zarraFaza[i] = rnd();
      zarraBal[i] = 0.6 + rnd() * 6;
    }
    zarraGeo = new THREE.BufferGeometry();
    zarraGeo.setAttribute('position', new THREE.BufferAttribute(zarraPos, 3));
    zarraGeo.setAttribute('aF', new THREE.BufferAttribute(zarraFaza, 1));
    zarraMat = new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uS: { value: 300 } },
      vertexShader: [
        'attribute float aF; uniform float uT; uniform float uS; varying float vA;',
        'void main(){',
        '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
        '  gl_Position = projectionMatrix * mv;',
        '  vA = 0.5 + 0.5 * sin(uT*2.0 + aF*6.28);',
        '  gl_PointSize = uS * (0.6 + 0.6*vA) / max(-mv.z, 0.5);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying float vA;',
        'void main(){',
        '  float r = length(gl_PointCoord - 0.5);',
        '  float a = smoothstep(0.5, 0.0, r) * (0.35 + 0.65*vA);',
        '  gl_FragColor = vec4(1.0, 0.92, 0.55, a);',
        '}'
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false
    });
    const pts = new THREE.Points(zarraGeo, zarraMat);
    pts.frustumCulled = false;
    pts.renderOrder = 3;
    zarraGeo.setDrawRange(0, zarraSoni);
    grup.add(pts);
  }

  function zarralarniYangila(dt, t, p) {
    const n = zarraSoni;
    for (let i = 0; i < n; i++) {
      const f = zarraFaza[i] * 6.283;
      let x = zarraPos[i * 3] + Math.sin(t * 0.4 + f) * 0.6 * dt;
      let z = zarraPos[i * 3 + 2] + Math.cos(t * 0.33 + f) * 0.6 * dt;
      if (x - p.x > 30) x -= 60; else if (x - p.x < -30) x += 60;
      if (z - p.z > 30) z -= 60; else if (z - p.z < -30) z += 60;
      zarraPos[i * 3] = x;
      zarraPos[i * 3 + 2] = z;
      zarraPos[i * 3 + 1] = balandlik(x, z) + zarraBal[i] + Math.sin(t * 0.9 + f) * 0.35;
    }
    zarraGeo.attributes.position.needsUpdate = true;
    const hpx = Sahna.renderer.domElement.height;
    zarraMat.uniforms.uS.value = 0.45 * hpx / (2 * Math.tan(Sahna.camera.fov * Math.PI / 360));
    zarraMat.uniforms.uT.value = t;
  }

  /* ---------- umumiy funksiyalar ---------- */
  Dunyo.boshlash = function () {
    rnd = mulberry(12345);
    grup = new THREE.Group();
    Sahna.scene.add(grup);
    relyefYasa();
    suvYasa();
    daraxtYasa();
    otYasa();
    gulYasa();
    toshYasa();
    zarraYasa();
  };

  Dunyo.yangila = function (dt, t, p) {
    otMat.uniforms.uT.value = t;
    otMat.uniforms.uP.value.copy(p);
    suvMat.uniforms.uT.value = t;
    const dx = p.x - otMerkez.x, dz = p.z - otMerkez.z;
    if (dx * dx + dz * dz > 24 * 24) otYangila(p.x, p.z);
    zarralarniYangila(dt, t, p);
  };

  // Grafika sifatiga qarab ob’ektlar sonini o‘zgartirish
  const SIFAT = {
    past:   { d: 90,  o: 0.2, g: 120, z: 40 },
    orta:   { d: 160, o: 0.5, g: 250, z: 90 },
    yuqori: { d: 240, o: 1.0, g: 400, z: 150 }
  };
  Dunyo.sifatOrnat = function (nom, p) {
    const q = SIFAT[nom];
    daraxtSoni = Math.min(q.d, toqnashuvDaraxt.length);
    sanash(tanaMesh, daraxtSoni);
    sanash(bargMesh, daraxtSoni);
    const g = Math.min(q.g, gulSaqich.userData.max);
    gulSaqich.count = gulBosh.count = g;
    zarraSoni = q.z;
    zarraGeo.setDrawRange(0, zarraSoni);
    otZichlik = q.o;
    otYangila(p.x, p.z);
  };

  // Daraxt va toshlardan itarib chiqarish (to‘qnashuv)
  function itar(pos, r, royxat, n) {
    for (let i = 0; i < n; i++) {
      const c = royxat[i];
      const dx = pos.x - c.x, dz = pos.z - c.z, rr = c.r + r;
      const d2 = dx * dx + dz * dz;
      if (d2 < rr * rr && d2 > 1e-6) {
        const k = (rr - Math.sqrt(d2)) / Math.sqrt(d2);
        pos.x += dx * k;
        pos.z += dz * k;
      }
    }
  }
  Dunyo.itar = function (pos, r) {
    itar(pos, r, toqnashuvDaraxt, daraxtSoni);
    itar(pos, r, toqnashuvTosh, toqnashuvTosh.length);
  };
})();
