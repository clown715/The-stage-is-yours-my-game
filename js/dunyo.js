/* ============================================================
   dunyo.js — relyef, daraxt, o‘t, gul, tosh, ko‘l, zarrachalar
   ============================================================ */
const Dunyo = {};

(function () {
  'use strict';

  const KOL = { x: 46, z: -34, r: 24 };   // ko‘l markazi va radiusi
  const SUV_Y = -1.0;
  const KOL_BANK = SUV_Y + 0.5;      // ko‘l qirg‘og‘i: suv sathidan 0.5 baland
  const KOL_TUB = SUV_Y - 1.2;       // ko‘l tubi: suv sathidan 1.2 past
  const BOYI = 440, TER_SEG = 170;   // relyef o‘lchami va to‘r katakchalari soni
  const MAX_DARAXT = 240, MAX_GUL = 400, MAX_TOSH = 46, MAX_OT = 40000, MAX_ZARRA = 150;
  const OT_R = 48;   // o‘t kamera atrofida shu radiusda quriladi, 40 m dan uzoqdagisi ko‘rinmaydi

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
  // ko‘lning notekis (tabiiy) shakli uchun masofa
  function kolMasofa(x, z) {
    const dx = x - KOL.x, dz = z - KOL.z;
    const th = Math.atan2(dz, dx);
    return Math.hypot(dx, dz) * (1 + 0.12 * Math.sin(3 * th + 0.7) + 0.07 * Math.sin(5 * th + 2.0));
  }
  function kolBalandlik(x, z) {
    let h = (fbm(x * 0.012, z * 0.012) - 0.5) * 30;
    const d0 = Math.hypot(x, z);
    h = h * (0.15 + 0.85 * ss(6, 40, d0)) + 1.6 * (1 - ss(0, 50, d0));
    const dl = kolMasofa(x, z);
    h = h + (KOL_BANK - h) * ss(KOL.r * 1.9, KOL.r * 1.0, dl);
    h = h + (KOL_TUB - h) * ss(KOL.r * 0.8, KOL.r * 0.45, dl);
    // ko‘l atrofidagi yer qirg‘oq balandligidan pastga tushmasin (qirg‘oqda o‘ra yoki zinapoya bo‘lmasin)
    const pastki = KOL_BANK - 60 * (1 - ss(KOL.r * 0.9, KOL.r * 1.0, dl)) - 60 * ss(KOL.r * 2.2, KOL.r * 3.0, dl);
    if (h < pastki) h = pastki;
    return h;
  }

  /* ---------- daryo: ko‘lga quyiladigan oqar daryo ---------- */
  const RIV_HW = 3.6;                    // suv kengligining yarmi (m)
  const RIV_IN = 2.5;                    // qirg‘oq ko‘tariladigan kenglik (m)
  const RIV_BL = 14;                     // qirg‘oqdan atrofga aralashish kengligi (m)
  const RIV_MARG = RIV_HW + RIV_IN + RIV_BL;
  const RIV_L0 = 2.0, RIV_L1 = SUV_Y;    // suv sathi: boshida 2.0, ko‘lga quyilganda ko‘l sathi
  const RIV = { px: [], pz: [], cum: [], len: [], S: 0, grid: null };
  (function daryoQur() {
    // daryo o‘qining nazorat nuqtalari (shimoli-g‘arbdan ko‘lning g‘arbiy qirg‘og‘iga)
    const C = [[-150, -150], [-115, -118], [-92, -80], [-62, -66], [-40, -92], [-14, -86], [6, -62], [22, -40], [33, -33]];
    const pts = [];
    for (let i = 0; i < C.length - 1; i++) {
      const p0 = C[Math.max(i - 1, 0)], p1 = C[i], p2 = C[i + 1], p3 = C[Math.min(i + 2, C.length - 1)];
      for (let k = 0; k < 16; k++) {
        const t = k / 16, t2 = t * t, t3 = t2 * t;
        const f = function (a, b, c, d) { return 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3); };
        pts.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    pts.push(C[C.length - 1]);
    let cum = 0;
    for (let i = 0; i < pts.length; i++) {
      RIV.px.push(pts[i][0]); RIV.pz.push(pts[i][1]);
      if (i > 0) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); RIV.len.push(l); cum += l; }
      RIV.cum.push(cum);
    }
    RIV.S = cum;
    // tezkor qidirish uchun to‘r (har katakda yaqin segmentlar ro‘yxati)
    const CELL = 8, m = RIV_MARG + CELL;
    let minX = 1e9, minZ = 1e9, maxX = -1e9, maxZ = -1e9;
    for (let i = 0; i < pts.length; i++) {
      minX = Math.min(minX, pts[i][0]); maxX = Math.max(maxX, pts[i][0]);
      minZ = Math.min(minZ, pts[i][1]); maxZ = Math.max(maxZ, pts[i][1]);
    }
    minX -= m; minZ -= m; maxX += m; maxZ += m;
    const nx = Math.ceil((maxX - minX) / CELL) + 1, nz = Math.ceil((maxZ - minZ) / CELL) + 1;
    const cells = new Array(nx * nz);
    for (let i = 0; i < pts.length - 1; i++) {
      const x0 = Math.min(pts[i][0], pts[i + 1][0]) - RIV_MARG, x1 = Math.max(pts[i][0], pts[i + 1][0]) + RIV_MARG;
      const z0 = Math.min(pts[i][1], pts[i + 1][1]) - RIV_MARG, z1 = Math.max(pts[i][1], pts[i + 1][1]) + RIV_MARG;
      for (let cz = Math.floor((z0 - minZ) / CELL); cz <= Math.floor((z1 - minZ) / CELL); cz++) {
        for (let cx = Math.floor((x0 - minX) / CELL); cx <= Math.floor((x1 - minX) / CELL); cx++) {
          const k = cz * nx + cx;
          (cells[k] || (cells[k] = [])).push(i);
        }
      }
    }
    RIV.grid = { minX: minX, minZ: minZ, cell: CELL, nx: nx, nz: nz, cells: cells };
  })();

  let rd = 1e9, rL = SUV_Y, rS = 0;      // eng yaqin daryo nuqtasigacha masofa, shu yerdagi suv sathi va o‘q bo‘yicha joy
  function daryoYaqin(x, z) {
    rd = 1e9;
    const G = RIV.grid;
    const cx = Math.floor((x - G.minX) / G.cell), cz = Math.floor((z - G.minZ) / G.cell);
    if (cx < 0 || cz < 0 || cx >= G.nx || cz >= G.nz) return;
    const list = G.cells[cz * G.nx + cx];
    if (!list) return;
    let best = 1e18, bs = 0;
    for (let k = 0; k < list.length; k++) {
      const i = list[k];
      const ax = RIV.px[i], az = RIV.pz[i], bx = RIV.px[i + 1] - ax, bz = RIV.pz[i + 1] - az;
      let t = ((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz);
      t = t < 0 ? 0 : (t > 1 ? 1 : t);
      const dx = x - (ax + bx * t), dz = z - (az + bz * t);
      const d2 = dx * dx + dz * dz;
      if (d2 < best) { best = d2; bs = RIV.cum[i] + t * RIV.len[i]; }
    }
    rd = Math.sqrt(best);
    rS = bs;
    rL = RIV_L0 + (RIV_L1 - RIV_L0) * (bs / RIV.S);
  }
  function daryoD(x, z) { daryoYaqin(x, z); return rd; }

  // daryo o‘zani va qirg‘oqlarini relyefga qo‘shish (hl — ko‘l hisobidan keyingi balandlik)
  function daryoBalandlik(hl, x, z) {
    daryoYaqin(x, z);
    if (rd > RIV_MARG) return hl;
    const L = rL, d = rd;
    let hp;
    if (d < RIV_HW) { const u = d / RIV_HW; hp = L - 0.05 - 1.1 * (1 - u * u); }          // o‘zan: o‘rtasi 1.15 chuqur
    else if (d < RIV_HW + RIV_IN) hp = L - 0.05 + 0.6 * ss(0, 1, (d - RIV_HW) / RIV_IN);   // qirg‘oq ko‘tariladi
    else hp = L + 0.55;                                                                      // qirg‘oq usti: suvdan 0.55 baland
    const w = 1 - ss(RIV_HW + RIV_IN, RIV_MARG, d);
    let hm = hl + (hp - hl) * w;
    const wl = 1 - ss(KOL.r * 1.1, KOL.r * 1.4, kolMasofa(x, z));                           // ko‘l yaqinida ko‘l tubi pasaymasin
    if (wl > 0 && hl < hm) hm += (hl - hm) * wl;
    return hm;
  }
  function balandlik(x, z) { return daryoBalandlik(kolBalandlik(x, z), x, z); }
  Dunyo.balandlik = balandlik;
  Dunyo.daryo = RIV;
  Dunyo.kol = KOL;
  Dunyo.suvY = SUV_Y;
  // Ko‘l ichida suv chuqurligi (ko‘ldan tashqarida 0)
  // Ko‘rinadigan yer balandligi: relyef to‘ridagi (uchburchaklar bo‘yicha) balandlik.
  // Personaj va kamera shunga tayanadi, shuning uchun qirg‘oqda yerga to‘g‘ri tegadi.
  function yerBalandligi(x, z) {
    const S = BOYI / TER_SEG, Y2 = BOYI / 2;
    const q = (x + Y2) / S, r = (z + Y2) / S;
    const ix = Math.floor(q), iy = Math.floor(r);
    if (ix < 0 || iy < 0 || ix >= TER_SEG || iy >= TER_SEG) return balandlik(x, z);
    const u = q - ix, v = r - iy;
    const x0 = ix * S - Y2, z0 = iy * S - Y2;
    const ha = balandlik(x0, z0), hb = balandlik(x0, z0 + S), hc = balandlik(x0 + S, z0 + S), hd = balandlik(x0 + S, z0);
    return u + v <= 1 ? ha + u * (hd - ha) + v * (hb - ha) : hc + (1 - u) * (hb - hc) + (1 - v) * (hd - hc);
  }
  Dunyo.yer = yerBalandligi;
  // Ko‘l ichida suv chuqurligi (suv sathi − yer balandligi; ko‘ldan tashqarida 0)
  Dunyo.suvChuqurligi = function (x, z) {
    if (kolMasofa(x, z) <= KOL.r * 0.8) return Math.max(0, SUV_Y - yerBalandligi(x, z));   // ko‘l
    daryoYaqin(x, z);
    if (rd < RIV_HW + 1.0) return Math.max(0, rL - yerBalandligi(x, z));                    // daryo
    return 0;
  };
  // Shu nuqtadagi suv sathi (ko‘lda ko‘l sathi, daryoda daryo sathi)
  Dunyo.suvDarajasi = function (x, z) {
    if (kolMasofa(x, z) > KOL.r * 0.8) {
      daryoYaqin(x, z);
      if (rd < RIV_HW + 1.0) return rL;
    }
    return SUV_Y;
  };

  /* ---------- yer rangi (balandlikka qarab) ---------- */
  const RAMPA = [
    [-4, 0x4d4332], [-0.8, 0x6a5d43], [-0.3, 0x8b7c58], [0.5, 0x6d7a42], [1.5, 0x4f6a34],
    [4, 0x486332], [7, 0x5f6b3f], [10, 0x7d7f68], [14, 0xa4a59c]
  ].map(function (s) { return [s[0], new THREE.Color(s[1])]; });
  const _r = new THREE.Color();
  const DARYO_QUM = new THREE.Color(0x7d7058);   // daryo tubi va sohili: qum-shag‘al
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
  let otMesh, otMat, otMerkez = { x: 1e9, z: 1e9 }, otButce = 15000, otPq = 0, otG = 1.0;
  let zarraGeo, zarraMat, zarraPos, zarraFaza, zarraBal, zarraSoni = 90;
  let daraxtSoni = 160;
  const toqnashuvDaraxt = [], toqnashuvTosh = [];

  /* ---------- relyef ---------- */
  function relyefYasa() {
    const geo = new THREE.PlaneGeometry(BOYI, BOYI, TER_SEG, TER_SEG);
    geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position;
    const ranglar = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      const h = balandlik(x, z);
      p.setY(i, h);
      const c = yerRangi(h, x, z);
      const dr = daryoD(x, z);
      if (dr < RIV_HW + 4) c.lerp(DARYO_QUM, 0.85 * (1 - ss(RIV_HW - 0.5, RIV_HW + 4, dr)));
      ranglar[i * 3] = c.r; ranglar[i * 3 + 1] = c.g; ranglar[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(ranglar, 3));
    geo.computeVertexNormals();
    terra = new THREE.Mesh(geo, Sahna.mat(0xffffff, { vertexColors: true, roughness: 1.0 }));
    terra.receiveShadow = true;
    grup.add(terra);
  }

  /* ---------- ko‘l: ravshan ko‘k suv (tuman va yorug‘lik ta’sir qilmaydi, o‘z rangini o‘zi hisoblaydi) ----------
     Chuqurlik = suv sathi − relyef balandligi. Relyef balandligi relyef to‘rining o‘zidagidek
     (to‘rtburchak katakchalarda uchburchak interpolyatsiya) hisoblanadi, shuning uchun qirg‘oq va ko‘pik
     aynan suv chegarasiga to‘g‘ri tushadi. */
  function suvYasa() {
    suvMat = new THREE.ShaderMaterial({
      uniforms: {
        uT: { value: 0 },
        uC: { value: new THREE.Vector2(KOL.x, KOL.z) },
        uR: { value: KOL.r }
      },
      vertexShader: [
        'varying vec3 vP;',
        'void main(){',
        '  vec4 wp = modelMatrix * vec4(position, 1.0);',
        '  vP = wp.xyz;',
        '  gl_Position = projectionMatrix * viewMatrix * wp;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float uT; uniform vec2 uC; uniform float uR; varying vec3 vP;',
        'float ss(float a, float b, float x){ float t = clamp((x-a)/(b-a), 0.0, 1.0); return t*t*(3.0-2.0*t); }',
        // ko‘l havzasining balandligi (dunyo.js dagi balandlik() bilan bir xil formula)
        'float kolH(vec2 p){',
        '  vec2 d = p - uC;',
        '  float th = atan(d.y, d.x);',
        '  float de = length(d) * (1.0 + 0.12*sin(3.0*th+0.7) + 0.07*sin(5.0*th+2.0));',
        '  return ' + KOL_BANK.toFixed(3) + ' - ' + (KOL_BANK - KOL_TUB).toFixed(3) + ' * ss(uR*0.8, uR*0.45, de);',   // relyef bilan bir xil formula
        '}',
        // relyef to‘ri bo‘yicha interpolyatsiya
        'float yerH(vec2 p){',
        '  float S = ' + (BOYI / TER_SEG).toFixed(6) + ';',
        '  vec2 q = (p + ' + (BOYI / 2).toFixed(1) + ') / S;',
        '  vec2 i = floor(q);',
        '  vec2 f = q - i;',
        '  vec2 p0 = i * S - ' + (BOYI / 2).toFixed(1) + ';',
        '  float ha = kolH(p0), hb = kolH(p0 + vec2(0.0, S)), hc = kolH(p0 + vec2(S, S)), hd = kolH(p0 + vec2(S, 0.0));',
        '  if (f.x + f.y <= 1.0) return ha + f.x*(hd-ha) + f.y*(hb-ha);',
        '  return hc + (1.0-f.x)*(hb-hc) + (1.0-f.y)*(hd-hc);',
        '}',
        'void main(){',
        '  float depth = max(' + SUV_Y.toFixed(3) + ' - yerH(vP.xz), 0.0);',
        '  float dk = smoothstep(0.0, ' + (SUV_Y - KOL_TUB).toFixed(2) + ', depth);',   // ko‘lning eng chuqur joyigacha: sayoz #6fe0ea -> chuqur #1f86c9
        '  vec3 c = mix(vec3(0.435, 0.878, 0.918), vec3(0.122, 0.525, 0.788), dk);',   // #6fe0ea -> #1f86c9
        // yumshoq harakatlanuvchi to‘lqin
        '  float w = sin(vP.x*0.5+uT*0.8) + sin(vP.z*0.7-uT*0.6) + sin((vP.x+vP.z)*0.35+uT*0.45);',
        '  c *= 1.0 + (w/3.0) * 0.06;',
        // yaltirash
        '  float sp = pow(max(sin(vP.x*1.7+uT*1.1)*sin(vP.z*1.9-uT*0.9), 0.0), 14.0);',
        '  c += vec3(sp * 0.35);',
        // qirg‘oq bo‘ylab oq ko‘pik chizig‘i (chuqurlik 0.3 dan kam)
        '  vec2 dd = vP.xz - uC;',
        '  float th = atan(dd.y, dd.x);',
        '  float wob = 0.04*sin(th*18.0+uT*1.6) + 0.03*sin(th*7.0-uT*1.1);',
        '  float foam = 1.0 - smoothstep(0.12 + wob, 0.30, depth);',
        '  foam *= 0.7 + 0.3*sin(th*45.0 + uT*0.9 + depth*25.0);',
        '  foam = clamp(foam, 0.0, 1.0);',
        '  c = mix(c, vec3(1.0), foam);',
        '  gl_FragColor = vec4(c, max(0.85, foam));',
        '}'
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      fog: false,
      toneMapped: false
    });
    const g = new THREE.CircleGeometry(KOL.r * 0.95, 64);
    g.rotateX(-Math.PI / 2);
    suvMesh = new THREE.Mesh(g, suvMat);
    suvMesh.position.set(KOL.x, SUV_Y, KOL.z);
    suvMesh.renderOrder = 2;          // relyefdan keyin chiziladi
    grup.add(suvMesh);
  }

  /* ---------- daryo suvi: oqayotgan suv (shader, o‘z rangini o‘zi hisoblaydi) ---------- */
  let daryoMat = null;
  function daryoYasa() {
    const U = [-1.25, -0.85, -0.4, 0, 0.4, 0.85, 1.25];       // ko‘ndalang joylar (suv chetidan kengroq — qirg‘oq ostida yashirinadi)
    const n = RIV.px.length, nu = U.length;
    const pos = new Float32Array(n * nu * 3), au = new Float32Array(n * nu), as = new Float32Array(n * nu), idx = [];
    for (let i = 0; i < n; i++) {
      const a = Math.max(i - 1, 0), b = Math.min(i + 1, n - 1);
      let tx = RIV.px[b] - RIV.px[a], tz = RIV.pz[b] - RIV.pz[a];
      const tl = Math.hypot(tx, tz) || 1;
      tx /= tl; tz /= tl;
      const nx = -tz, nz = tx;
      const L = RIV_L0 + (RIV_L1 - RIV_L0) * (RIV.cum[i] / RIV.S);
      for (let j = 0; j < nu; j++) {
        const k = i * nu + j;
        pos[k * 3] = RIV.px[i] + nx * U[j] * RIV_HW;
        pos[k * 3 + 1] = L;
        pos[k * 3 + 2] = RIV.pz[i] + nz * U[j] * RIV_HW;
        au[k] = U[j];
        as[k] = RIV.cum[i];
      }
    }
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < nu - 1; j++) {
        const a = i * nu + j, b = a + 1, c = a + nu, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aU', new THREE.BufferAttribute(au, 1));
    g.setAttribute('aS', new THREE.BufferAttribute(as, 1));
    g.setIndex(idx);
    daryoMat = new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 } },
      vertexShader: [
        'attribute float aU; attribute float aS;',
        'varying float vU; varying float vS; varying vec3 vP;',
        'void main(){',
        '  vec4 wp = modelMatrix * vec4(position, 1.0);',
        '  vP = wp.xyz; vU = aU; vS = aS;',
        '  gl_Position = projectionMatrix * viewMatrix * wp;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float uT; varying float vU; varying float vS; varying vec3 vP;',
        'void main(){',
        '  float au = abs(vU);',
        '  float depth = 1.1 * max(0.0, 1.0 - au*au);',                                   // o‘zan o‘rtasi chuqur, chetlari sayoz
        '  float dk = smoothstep(0.0, 1.1, depth);',
        '  vec3 c = mix(vec3(0.435, 0.878, 0.918), vec3(0.122, 0.525, 0.788), dk);',    // #6fe0ea -> #1f86c9
        // oqim: yuza chiziqlari oqim bo‘ylab harakatlanadi
        '  float f1 = sin(vS*0.8 - uT*2.4 + sin(vU*3.0 + vS*0.15)*1.6);',
        '  float f2 = sin(vS*1.9 - uT*3.6 + vU*4.0);',
        '  float streak = pow(max(f1*f2, 0.0), 3.0);',
        '  c += vec3(streak * 0.22);',
        '  c *= 1.0 + 0.05*sin(vS*0.5 - uT*1.5 + vU*2.0);',
        '  float sp = pow(max(sin(vP.x*1.7+uT*1.1)*sin(vP.z*1.9-uT*0.9), 0.0), 14.0);',   // yaltirash
        '  c += vec3(sp * 0.3);',
        // qirg‘oq bo‘ylab ingichka oq ko‘pik
        '  float foam = 1.0 - smoothstep(0.10, 0.28, depth);',
        '  foam *= 0.65 + 0.35*sin(vS*3.0 - uT*2.0 + vU*6.0);',
        '  foam = clamp(foam, 0.0, 1.0);',
        '  c = mix(c, vec3(1.0), foam * 0.9);',
        '  gl_FragColor = vec4(c, max(0.85, foam));',
        '}'
      ].join('\n'),
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      fog: false,
      toneMapped: false
    });
    const m = new THREE.Mesh(g, daryoMat);
    m.frustumCulled = false;
    m.renderOrder = 2;
    grup.add(m);
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
      if (daryoD(x, z) < RIV_HW + 4) continue;
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

    tanaMesh = new THREE.InstancedMesh(tanaG, Sahna.mat(0x4e3b2c, { roughness: 1.0 }), n);
    bargMesh = new THREE.InstancedMesh(bargG, Sahna.toon(0xffffff), n);
    const palitra = [0x2d4a26, 0x36542b, 0x3f5d2d, 0x2a4530, 0x4a6532].map(function (c) { return Sahna.lin(c); });
    for (let i = 0; i < n; i++) {
      const t = royxat[i];
      const ry = rnd() * 6.283;
      matritsa(tanaMesh, i, t.x, t.h - 0.2, t.z, ry, t.s, t.s * (0.9 + rnd() * 0.3), t.s);
      matritsa(bargMesh, i, t.x, t.h - 0.2, t.z, ry, t.s, t.s * (0.9 + rnd() * 0.3), t.s);
      rnd();
      bargMesh.setColorAt(i, palitra[Math.floor(rnd() * palitra.length)]);
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

  /* ---------- o‘t: har bir pichoq alohida (InstancedMesh), tutamlarda o‘sadi ----------
     H — personajning balandligi (~1.45 m). Pichoq balandligi 0.08H–0.30H (o‘rtacha ~0.15H),
     asosining kengligi 0.01H–0.02H, uchi o‘tkir. Tutamda 5–12 ta pichoq, tutamlar orasida bo‘sh joy bor. */
  function otYasa() {
    // bitta pichoq: pastki qism (2 uch), o‘rtasi (2 uch), uchi (1 uch). Uchlar rangi: tagi to‘q, uchi och yashil
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([
      -0.5, 0, 0,   0.5, 0, 0,   -0.25, 0.5, 0,   0.25, 0.5, 0,   0, 1, 0
    ], 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute([
      0.10, 0.17, 0.06,   0.10, 0.17, 0.06,   0.22, 0.34, 0.11,   0.22, 0.34, 0.11,   0.45, 0.55, 0.22
    ], 3));
    g.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]);

    otMat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uT: { value: 0 }, uP: { value: new THREE.Vector3() } }]),
      vertexShader: [
        'uniform float uT; uniform vec3 uP;',
        'varying vec3 vC; varying float vH;',
        '#include <fog_pars_vertex>',
        'void main(){',
        '  vec3 p = position;',
        '  vH = p.y;',
        '  vec3 base = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);',
        '  float h1 = fract(sin(dot(base.xz, vec2(12.9898, 78.233))) * 43758.5453);',
        '  float h2 = fract(sin(dot(base.xz, vec2(39.346, 11.135))) * 24634.6345);',
        '  float bh = instanceMatrix[1][1];',
        '  float d = length(base.xz - uP.xz);',
        '  p.y *= 1.0 - smoothstep(32.0, 40.0, d);',        // uzoqdagilar yo‘qoladi
        '  p.z += (h1 * 0.7 - 0.1) * p.y * p.y;',           // har pichoqning egilishi
        '  vec4 ip = instanceMatrix * vec4(p, 1.0);',
        '  float w = sin(uT*1.8 + base.x*0.35 + base.z*0.27) + 0.4*sin(uT*2.7 + base.x*0.9 + base.z*0.5);',
        '  float k = p.y * p.y * bh;',
        '  ip.x += w * 0.28 * k;',                          // shamolda biroz tebranish
        '  ip.z += w * 0.16 * k;',
        '  vC = color * (0.85 + 0.3 * h2);',
        '  float sariq = step(0.9, fract(h1 * 7.31));',
        '  vC = mix(vC, vC * vec3(1.3, 1.1, 0.55), sariq * 0.6 * vH);',
        '  vec4 mvPosition = modelViewMatrix * ip;',
        '  gl_Position = projectionMatrix * mvPosition;',
        '  #include <fog_vertex>',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vC; varying float vH;',
        '#include <fog_pars_fragment>',
        'void main(){',
        '  gl_FragColor = vec4(vC, 1.0);',
        '  #include <fog_fragment>',
        '}'
      ].join('\n'),
      side: THREE.DoubleSide,
      vertexColors: true,
      fog: true
    });
    otMesh = new THREE.InstancedMesh(g, otMat, MAX_OT);
    otMesh.frustumCulled = false;
    otMesh.count = 0;
    grup.add(otMesh);
  }

  const PERSONAJ_H = 1.45;                 // personaj balandligi (metr)
  const otTmp = new Float32Array(MAX_OT * 16);
  const OT_TUTAM_R = 0.09;                 // tutam radiusi (metr)
  const nomzodX = new Float32Array(22000), nomzodZ = new Float32Array(22000), nomzodW = new Float32Array(22000);
  const nomzodY = new Float32Array(22000), nomzodH = new Float32Array(22000), nomzodCI = new Int32Array(22000), nomzodCJ = new Int32Array(22000);
  const nomzodN = new Uint8Array(22000);

  // O‘tni kamera atrofida qayta joylashtirish. Tutamlar dunyo katakchalariga bog‘langan,
  // shuning uchun kamera yurganda o‘t sakramaydi.
  function* otGen(cx, cz) {
    const ci0 = Math.round(cx / otG), cj0 = Math.round(cz / otG);
    const N = Math.ceil(OT_R / otG) + 1;
    let nc = 0, sumW = 0, sana = 0;
    for (let i = -N; i <= N; i++) {
      for (let j = -N; j <= N; j++) {
        if (++sana % 1500 === 0) yield;     // ishni kadrlarga bo‘lish (telefonda sekinlashmasligi uchun)
        const ci = ci0 + i, cj = cj0 + j;
        const gx = ci * otG - cx, gz = cj * otG - cz;
        if (gx * gx + gz * gz > (OT_R + otG) * (OT_R + otG)) continue;
        const x = (ci + hash(ci * 1.31, cj * 2.17)) * otG;
        const z = (cj + hash(ci * 3.77 + 1.2, cj * 0.57)) * otG;
        const dx = x - cx, dz = z - cz;
        if (dx * dx + dz * dz > OT_R * OT_R) continue;
        if (Math.hypot(x - KOL.x, z - KOL.z) < KOL.r * 0.98) continue;
        if (daryoD(x, z) < RIV_HW + 1.5) continue;
        const yer = balandlik(x, z);
        if (yer < 0.2) continue;                      // past (qumli) joyda o‘t o‘smaydi
        const katta = ss(0.3, 0.62, vn(x * 0.045 + 20, z * 0.045 - 9));
        const mayda = ss(0.25, 0.7, vn(x * 0.22 + 4, z * 0.22 + 13));
        const w = (0.5 + 0.5 * katta) * (0.7 + 0.3 * mayda);
        nomzodX[nc] = x; nomzodZ[nc] = z; nomzodW[nc] = w; nomzodY[nc] = yer;
        nomzodH[nc] = hash(ci * 0.71 + 3.1, cj * 0.93 + 7.7);
        nomzodCI[nc] = ci; nomzodCJ[nc] = cj;
        nomzodN[nc] = 5 + Math.floor(hash(ci * 1.7 + 11.3, cj * 0.9 + 2.1) * 8);   // 5..12 pichoq
        sumW += w;
        nc++;
      }
    }
    const byudjet = Math.min(otButce, MAX_OT);
    if (otPq === 0) otPq = 1.1 * (byudjet / 8.5) / Math.max(sumW, 1);   // sifat darajasiga qarab zichlik
    let pq = otPq, jami = 0;
    for (let it = 0; it < 3; it++) {
      jami = 0;
      for (let c = 0; c < nc; c++) if (nomzodH[c] < Math.min(1, pq * nomzodW[c])) jami += nomzodN[c];
      if (jami <= byudjet) break;
      pq *= byudjet / jami * 0.97;
    }

    const A = otTmp;
    let b = 0, oy = 0;
    for (let c = 0; c < nc && b < byudjet; c++) {
      if (nomzodH[c] >= Math.min(1, pq * nomzodW[c])) continue;
      const x = nomzodX[c], z = nomzodZ[c];
      const h = nomzodY[c];
      const nb = nomzodN[c];
      if (b + nb > byudjet) break;
      if (b - oy >= 1500) { oy = b; yield; }
      let st = ((nomzodCI[c] * 73856093) ^ (nomzodCJ[c] * 19349663)) >>> 0;
      if (st === 0) st = 1;
      for (let q = 0; q < nb; q++) {
        st ^= st << 13; st >>>= 0; st ^= st >>> 17; st ^= st << 5; st >>>= 0; const r1 = st / 4294967296;
        st ^= st << 13; st >>>= 0; st ^= st >>> 17; st ^= st << 5; st >>>= 0; const r2 = st / 4294967296;
        st ^= st << 13; st >>>= 0; st ^= st >>> 17; st ^= st << 5; st >>>= 0; const r3 = st / 4294967296;
        st ^= st << 13; st >>>= 0; st ^= st >>> 17; st ^= st << 5; st >>>= 0; const r4 = st / 4294967296;
        const ang = r1 * 6.2832, rad = (0.2 + 0.8 * Math.sqrt(r2)) * OT_TUTAM_R;
        const dx = Math.cos(ang) * rad, dz = Math.sin(ang) * rad;
        const th = Math.atan2(dx, dz) + (r3 - 0.5);                      // pichoqlar tutamdan tashqariga qaraydi
        const bal = PERSONAJ_H * (0.08 + 0.22 * r4 * r4);                // 0.08H..0.30H, o‘rtacha ~0.15H
        const eni = PERSONAJ_H * (0.01 + 0.01 * ((r1 * 7.3 + r3 * 3.1) % 1));   // 0.01H..0.02H
        const cs = Math.cos(th), sn = Math.sin(th), o = b * 16;
        A[o] = eni * cs; A[o + 1] = 0; A[o + 2] = -eni * sn; A[o + 3] = 0;
        A[o + 4] = 0; A[o + 5] = bal; A[o + 6] = 0; A[o + 7] = 0;
        A[o + 8] = bal * sn; A[o + 9] = 0; A[o + 10] = bal * cs; A[o + 11] = 0;
        A[o + 12] = x + dx; A[o + 13] = h - 0.01; A[o + 14] = z + dz; A[o + 15] = 1;
        b++;
      }
    }
    otMesh.instanceMatrix.array.set(otTmp.subarray(0, b * 16));    // tayyor bo‘lgach birdan almashtiriladi
    otMesh.count = b;
    otMesh.instanceMatrix.needsUpdate = true;
    otMerkez = { x: cx, z: cz };
  }
  let otIsh = null;
  function otYangila(cx, cz) {            // bir zumda (grafika sifati o‘zgarganda)
    otIsh = null;
    const g = otGen(cx, cz);
    while (!g.next().done) { /* tugaguncha */ }
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
        if (daryoD(x, z) < RIV_HW + 6) continue;
        if (balandlik(x, z) < 0.5) continue;
        markazlar.push({ x: x, z: z });
        break;
      }
    }
    const nM = markazlar.length;
    gulSaqich = new THREE.InstancedMesh(stemG, Sahna.mat(0x4f7a3a), MAX_GUL);
    gulBosh = new THREE.InstancedMesh(boshG, Sahna.toon(0xffffff), MAX_GUL);
    const ranglar = [0xe8d34a, 0xf0f0e8, 0x8d6fb5, 0xc4523f, 0xf0f0e8].map(function (c) { return Sahna.lin(c); });
    let n = 0;
    for (let j = 0; n < MAX_GUL && nM > 0; j++) {
      for (let c = 0; c < nM && n < MAX_GUL; c++) {
        const a = rnd() * 6.283, d = 4.5 * Math.sqrt(rnd());
        const x = markazlar[c].x + Math.cos(a) * d, z = markazlar[c].z + Math.sin(a) * d;
        const h = balandlik(x, z);
        if (h < 0.4 || Math.hypot(x - KOL.x, z - KOL.z) < KOL.r * 1.0 || daryoD(x, z) < RIV_HW + 2) { continue; }
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
    const ranglar = [0x8a8982, 0x77736b, 0x9b968b].map(function (c) { return Sahna.lin(c); });
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
      if (daryoD(x, z) < RIV_HW + 3) continue;
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
    daryoYasa();
    daraxtYasa();
    otYasa();
    gulYasa();
    toshYasa();
    zarraYasa();
  };

  Dunyo.yangila = function (dt, t, p) {
    otMat.uniforms.uT.value = t;
    const kam = Sahna.camera.position;
    otMat.uniforms.uP.value.set(kam.x, 0, kam.z);
    suvMat.uniforms.uT.value = t;
    if (daryoMat) daryoMat.uniforms.uT.value = t;
    if (otIsh) {
      if (otIsh.next().done) otIsh = null;
    } else {
      const dx = kam.x - otMerkez.x, dz = kam.z - otMerkez.z;
      if (dx * dx + dz * dz > 6 * 6) otIsh = otGen(kam.x, kam.z);   // kamera 6 m siljisa, o‘t yangidan quriladi
    }
    zarralarniYangila(dt, t, p);
  };

  // Grafika sifatiga qarab ob’ektlar sonini o‘zgartirish
  const SIFAT = {
    past:   { d: 90,  gg: 1.4, o: 6000, g: 120, z: 0 },
    orta:   { d: 160, gg: 1.0, o: 15000, g: 250, z: 0 },
    yuqori: { d: 240, gg: 0.6, o: 40000, g: 400, z: 0 }
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
    otButce = q.o;
    otG = q.gg;
    otPq = 0;
    otYangila(Sahna.camera.position.x, Sahna.camera.position.z);
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
