/* ============================================================
   personaj.js — personaj modeli (alohida modul), animatsiya, harakat

   PersonajModeli — faqat tashqi ko‘rinish va animatsiya. Keyinchalik tayyor
   modelga almashtirish uchun PersonajModeli.yarat() ni o‘zgartirish kifoya:
   u { root, yangila(dt, t, tez01, yugur01, suzish) } qaytarishi kerak.
   Personaj — harakat, burilish, yerga yopishish, to‘qnashuv.
   ============================================================ */
const PersonajModeli = {
  yarat() {
    const INK = 0x2b2347, TERI = 0xffdcc2, OQ = 0xf6f3ec, FIROZA = 0x2fb8a6, OLTIN = 0xf3c451;
    const SOCH = 0x4b55c4, SOCH2 = 0x808bf0, ETIK = 0x2c3f86;

    const root = new THREE.Group();
    const tan = new THREE.Group();        // butun tana (suzishda egiladi)
    root.add(tan);
    const kalcha = new THREE.Group();     // yubka va oyoqlar
    const ust = new THREE.Group();        // ko‘krak, bosh, qo‘llar, plash
    tan.add(kalcha);
    tan.add(ust);

    /* ----- yordamchilar ----- */
    function qism(g, renk, ota, x, y, z, q, mat) {
      const m = new THREE.Mesh(g, mat || Sahna.toon(renk));
      m.position.set(x || 0, y || 0, z || 0);
      m.castShadow = true;
      if (q !== 0) Sahna.kontur(m, q || 0.012, INK);
      ota.add(m);
      return m;
    }
    function sfera(r, sx, sy, sz) {
      const g = new THREE.SphereGeometry(r, 20, 14);
      g.scale(sx, sy, sz);
      return g;
    }
    function konus(r, h, seg) {   // uchi pastga qaragan konus
      const g = new THREE.ConeGeometry(r, h, seg || 6);
      g.rotateX(Math.PI);
      g.translate(0, -h / 2, 0);
      return g;
    }
    function silindr(rt, rb, h, seg) { return new THREE.CylinderGeometry(rt, rb, h, seg || 16); }
    function M(x, y, z, sx, sy, sz, rx, ry, rz) {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0));
      return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx, sy, sz));
    }
    // rangli qismlarni bitta geometriyaga birlashtirish
    function birla(royxat) {
      const g = Sahna.birlashtir(royxat);
      const col = [];
      royxat.forEach(function (it) {
        const n = it.g.index ? it.g.index.count : it.g.attributes.position.count;
        const c = new THREE.Color(it.c === undefined ? 0xffffff : it.c);
        for (let i = 0; i < n; i++) col.push(c.r, c.g, c.b);
      });
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      return g;
    }
    const birlik = new THREE.SphereGeometry(1, 12, 9);   // birlik shar (ellipsoidlar uchun)
    const vcMat = function () { return Sahna.toon(0xffffff, { vertexColors: true }); };

    /* ----- tana ----- */
    qism(silindr(0.17, 0.25, 0.3, 24), FIROZA, kalcha, 0, 1.0, 0);                    // pastki ko‘ylak
    const etak = new THREE.TorusGeometry(0.25, 0.012, 6, 32);
    etak.rotateX(Math.PI / 2);
    qism(etak, OLTIN, kalcha, 0, 0.85, 0, 0);                                         // ko‘ylak hoshiyasi
    qism(silindr(0.185, 0.15, 0.46, 24), OQ, ust, 0, 1.27, 0);                        // ko‘krak
    qism(silindr(0.165, 0.165, 0.06, 24), OLTIN, ust, 0, 1.08, 0);                    // belbog‘
    qism(silindr(0.042, 0.05, 0.16, 12), TERI, ust, 0, 1.53, 0, 0.007);               // bo‘yin
    qism(silindr(0.19, 0.3, 0.14, 28), FIROZA, ust, 0, 1.4, 0);                       // yelkadagi mato (mantiya)
    const halqa = new THREE.TorusGeometry(0.3, 0.012, 6, 32);
    halqa.rotateX(Math.PI / 2);
    qism(halqa, OLTIN, ust, 0, 1.33, 0, 0);                                           // mantiya hoshiyasi

    /* ----- bosh va yuz ----- */
    const bosh = new THREE.Group();
    bosh.position.set(0, 1.73, 0);
    ust.add(bosh);
    qism(sfera(0.17, 1, 0.98, 0.96), TERI, bosh, 0, 0, 0);

    const yuz = [];
    const E = function (x, y, z, rx, ry, rz, c) { yuz.push({ g: birlik, m: M(x, y, z, rx, ry, rz), c: c }); };
    [-1, 1].forEach(function (yon) {
      E(yon * 0.06, -0.012, 0.152, 0.031, 0.045, 0.0126, 0x2aa6d0);     // ko‘z
      E(yon * 0.06, -0.012, 0.159, 0.018, 0.028, 0.012, 0x16324f);      // qorachiq
      E(yon * 0.06 + 0.011, 0.016, 0.164, 0.009, 0.009, 0.006, 0xffffff); // yaltiroq
      E(yon * 0.06, 0.036, 0.15, 0.04, 0.007, 0.012, INK);              // qosh-qovoq
      E(yon * 0.1, -0.05, 0.122, 0.022, 0.012, 0.006, 0xffa6a6);        // yonoq
    });
    E(0, -0.075, 0.147, 0.016, 0.005, 0.004, 0xc0615f);                 // og‘iz
    qism(birla(yuz), 0xffffff, bosh, 0, 0, 0, 0, vcMat());

    // soch: qalpoq + orqa qism
    const qalpoq = qism(new THREE.SphereGeometry(0.19, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), SOCH, bosh, 0, 0.012, -0.015, 0.008);
    qalpoq.rotation.x = -0.55;
    qism(sfera(0.175, 1, 1.15, 0.95), SOCH, bosh, 0, -0.06, -0.045, 0.008);

    // popuk tutamlari (aniq alohida tutamlar)
    const tutam = new THREE.ConeGeometry(0.038, 1, 5);
    tutam.rotateX(Math.PI);
    tutam.translate(0, -0.5, 0);
    const popuk = [];
    [[-1.1, 0.2], [-0.8, 0.13], [-0.45, 0.095], [-0.15, 0.075], [0.15, 0.075], [0.45, 0.095], [0.8, 0.13], [1.1, 0.2]].forEach(function (b, i) {
      const a = b[0], L = b[1];
      const y = 0.09 - 0.045 * (Math.abs(a) / 1.1) * (Math.abs(a) / 1.1);
      popuk.push({
        g: tutam,
        m: M(Math.sin(a) * 0.17, y, Math.cos(a) * 0.17, 1, L, 1, 0.1 + 0.15 * Math.abs(a), 0, 0.22 * Math.sin(a)),
        c: i % 2 ? SOCH2 : SOCH
      });
    });
    qism(birla(popuk), 0xffffff, bosh, 0, 0, 0, 0.006, vcMat());

    // orqa va yon tutamlar
    const orqa = [];
    for (let i = 0; i < 8; i++) {
      const a = 2.2 + i * 0.27;
      const L = 0.2 + 0.1 * ((i * 37) % 5) / 4;
      orqa.push({
        g: tutam,
        m: M(Math.sin(a) * 0.16, -0.03 - 0.02 * (i % 3), Math.cos(a) * 0.16, 1.25, L, 1.25, 0.1, 0, 0.2 * Math.sin(a)),
        c: i % 3 === 1 ? SOCH2 : SOCH
      });
    }
    qism(birla(orqa), 0xffffff, bosh, 0, 0, 0, 0.006, vcMat());

    const ahoge = qism(new THREE.ConeGeometry(0.018, 0.14, 5), SOCH2, bosh, 0.015, 0.215, 0.04, 0.006);
    ahoge.rotation.z = -0.4;
    qism(new THREE.OctahedronGeometry(0.025), OLTIN, bosh, 0.125, 0.12, 0.11, 0.005);   // soch to‘g‘nog‘ichi

    // kokil (dumcha): 3 bo‘g‘in, har biri bir necha tutamdan, tebranadi
    function bogin(uz, r, rangi) {
      return Sahna.birlashtir([
        { g: birlik, m: M(0, -uz / 2, 0, r, uz / 2, r) },
        { g: birlik, m: M(-r * 0.7, -uz * 0.45, 0, r * 0.7, uz * 0.45, r * 0.8) },
        { g: birlik, m: M(r * 0.7, -uz * 0.45, 0, r * 0.7, uz * 0.45, r * 0.8) }
      ]);
    }
    const poni1 = new THREE.Group();
    poni1.position.set(0, 0.1, -0.17);
    bosh.add(poni1);
    qism(sfera(0.04, 1, 1, 1), OLTIN, poni1, 0, 0, 0, 0.005);
    qism(bogin(0.24, 0.055), SOCH, poni1, 0, -0.02, 0, 0.008);
    const poni2 = new THREE.Group();
    poni2.position.set(0, -0.24, 0);
    poni1.add(poni2);
    qism(bogin(0.24, 0.05), SOCH, poni2, 0, 0, 0, 0.008);
    const poni3 = new THREE.Group();
    poni3.position.set(0, -0.24, 0);
    poni2.add(poni3);
    qism(Sahna.birlashtir([
      { g: tutam, m: M(-0.035, 0, 0, 1.2, 0.26, 1.2, 0, 0, 0.12) },
      { g: tutam, m: M(0, 0, 0, 1.4, 0.32, 1.4) },
      { g: tutam, m: M(0.035, 0, 0, 1.2, 0.24, 1.2, 0, 0, -0.12) }
    ]), SOCH2, poni3, 0, 0, 0, 0.008);

    /* ----- qo‘llar (barmoqlar bilan) ----- */
    const barmoq = new THREE.CylinderGeometry(0.0085, 0.0072, 0.058, 6);
    barmoq.translate(0, -0.029, 0);
    function elGeo(yon) {
      const L = [{ g: birlik, m: M(0, -0.02, 0, 0.036, 0.045, 0.022) }];
      [-0.024, -0.008, 0.008, 0.024].forEach(function (x, i) {
        L.push({ g: barmoq, m: M(x, -0.052, 0.004, 1, (i === 1 || i === 2) ? 1.1 : 1, 1, -0.25) });
      });
      L.push({ g: barmoq, m: M(-yon * 0.034, -0.03, 0.014, 1.1, 0.75, 1.1, -0.2, 0, -yon * 0.7) });   // bosh barmoq
      return Sahna.birlashtir(L);
    }
    function qolYasa(yon) {
      const yelka = new THREE.Group();
      yelka.position.set(yon * 0.27, 1.4, 0);
      ust.add(yelka);
      qism(silindr(0.052, 0.046, 0.3, 14), OQ, yelka, 0, -0.15, 0);
      const tirsak = new THREE.Group();
      tirsak.position.set(0, -0.3, 0);
      yelka.add(tirsak);
      qism(silindr(0.042, 0.036, 0.27, 14), TERI, tirsak, 0, -0.135, 0);
      const bilak = new THREE.TorusGeometry(0.042, 0.011, 6, 16);
      bilak.rotateX(Math.PI / 2);
      qism(bilak, OLTIN, tirsak, 0, -0.245, 0, 0);
      const el = new THREE.Group();
      el.position.set(0, -0.28, 0);
      tirsak.add(el);
      qism(elGeo(yon), TERI, el, 0, 0, 0, 0.005);
      return { yelka: yelka, tirsak: tirsak, el: el };
    }
    const qolL = qolYasa(-1), qolR = qolYasa(1);

    /* ----- oyoqlar (uzunroq va qalinroq) ----- */
    function oyoqYasa(yon) {
      const son = new THREE.Group();
      son.position.set(yon * 0.1, 0.92, 0);
      kalcha.add(son);
      qism(Sahna.birlashtir([
        { g: silindr(0.085, 0.066, 0.46, 16), m: M(0, -0.23, 0, 1, 1, 1) },
        { g: new THREE.SphereGeometry(0.066, 14, 10), m: M(0, -0.46, 0, 1, 1, 1) }
      ]), TERI, son, 0, 0, 0);
      const tizza = new THREE.Group();
      tizza.position.set(0, -0.46, 0);
      son.add(tizza);
      qism(silindr(0.064, 0.05, 0.34, 16), OQ, tizza, 0, -0.17, 0);
      qism(silindr(0.062, 0.072, 0.14, 16), ETIK, tizza, 0, -0.27, 0);
      const topiq = new THREE.Group();
      topiq.position.set(0, -0.4, 0);
      tizza.add(topiq);
      qism(sfera(0.075, 1, 0.6, 1.7), ETIK, topiq, 0, -0.015, 0.05);
      return { son: son, tizza: tizza, topiq: topiq };
    }
    const oyL = oyoqYasa(-1), oyR = oyoqYasa(1);

    /* ----- yelkadagi hajmli mato (plash): shamolda va yurganda tebranadi ----- */
    const NU = 10, NV = 14, CL = 0.78;
    const plashG = new THREE.BufferGeometry();
    const pPos = new Float32Array((NU + 1) * (NV + 1) * 3);
    const pCol = new Float32Array((NU + 1) * (NV + 1) * 3);
    const idx = [];
    const cF = new THREE.Color(FIROZA), cO = new THREE.Color(OLTIN);
    for (let v = 0; v <= NV; v++) {
      const rang = v === NV ? cO : cF;
      for (let u = 0; u <= NU; u++) {
        const n = (v * (NU + 1) + u) * 3;
        pCol[n] = rang.r; pCol[n + 1] = rang.g; pCol[n + 2] = rang.b;
      }
    }
    for (let v = 0; v < NV; v++) {
      for (let u = 0; u < NU; u++) {
        const a = v * (NU + 1) + u, b = a + 1, c = a + NU + 1, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
    plashG.setIndex(idx);
    plashG.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    plashG.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
    const plash = new THREE.Mesh(plashG, Sahna.toon(0xffffff, { side: THREE.DoubleSide, vertexColors: true }));
    plash.position.set(0, 1.34, 0);
    plash.castShadow = true;
    plash.frustumCulled = false;
    ust.add(plash);

    function plashYangila(t, tez, k) {
      let n = 0;
      for (let v = 0; v <= NV; v++) {
        const d = v / NV;
        const R = 0.31 + 0.12 * d;
        for (let u = 0; u <= NU; u++) {
          const phi = (u / NU * 2 - 1) * 1.3;
          const r = R + Math.sin(phi * 4.5 + t * 2.6 - d * 3.5) * 0.025 * d * (0.5 + k);       // burmalar (hajm)
          const orqaga = (0.04 + 0.36 * tez) * d * d + 0.02 * Math.sin(t * 1.7 + d * 2) * d;    // orqaga cho‘zilish
          const pat = Math.sin(t * 5.5 - d * 5.0 + phi * 2.0) * (0.02 + 0.04 * tez) * d;       // pirpirash
          pPos[n++] = Math.sin(phi) * r + Math.sin(t * 3.3 - d * 4) * 0.03 * d * k;
          pPos[n++] = -d * CL * (1 - 0.12 * tez * d);
          pPos[n++] = -Math.cos(phi) * r - orqaga + pat;
        }
      }
      plashG.attributes.position.needsUpdate = true;
      plashG.computeVertexNormals();
    }

    /* ----- animatsiya ----- */
    let faza = 0, faza2 = 0, sw = 0;
    return {
      root: root,
      // tez: 0..1 (tezlik), yug: 0..1 (yugurish darajasi), suzish: suvdami
      yangila(dt, t, tez, yug, suzish) {
        sw += ((suzish ? 1 : 0) - sw) * Math.min(1, 5 * dt);
        const wk = 1 - sw;
        const k = Math.min(1, tez * 2.5);
        faza += dt * (4 + 7 * tez);
        faza2 += dt * (3 + 3 * tez);
        const s = Math.sin(faza), c = Math.cos(faza);
        const A = (0.55 + 0.45 * yug) * k * wk;
        const bukish = (0.55 + 0.75 * yug) * k * wk;

        // oyoqlar: yurishda qarama-qarshi, suzishda yengil tepish
        const tepish = Math.sin(faza2 * 2.2) * 0.35 * sw;
        const tizzaSw = 0.25 * sw;
        oyL.son.rotation.x = -s * A + tepish;
        oyR.son.rotation.x = s * A - tepish;
        oyL.tizza.rotation.x = Math.max(0, c) * bukish + tizzaSw * (0.5 + 0.5 * Math.sin(faza2 * 2.2 + 1));
        oyR.tizza.rotation.x = Math.max(0, -c) * bukish + tizzaSw * (0.5 - 0.5 * Math.sin(faza2 * 2.2 + 1));
        oyL.topiq.rotation.x = -0.55 * (oyL.son.rotation.x + oyL.tizza.rotation.x) * wk + 0.5 * sw;
        oyR.topiq.rotation.x = -0.55 * (oyR.son.rotation.x + oyR.tizza.rotation.x) * wk + 0.5 * sw;

        // qo‘llar: oyoqqa teskari; suzishda almashib cho‘zadi
        const ang = faza2 % 6.2832;
        qolL.yelka.rotation.x = s * A * 0.95 + Math.sin(t * 1.6) * 0.02 * (1 - k) * wk - ang * sw;
        qolR.yelka.rotation.x = -s * A * 0.95 + Math.sin(t * 1.6 + 1) * 0.02 * (1 - k) * wk - (ang + Math.PI) * sw;
        qolL.yelka.rotation.z = 0.1 + 0.05 * sw;
        qolR.yelka.rotation.z = -0.1 - 0.05 * sw;
        const tb = k * (0.3 + 0.6 * yug) * wk;
        qolL.tirsak.rotation.x = -(0.2 + tb * Math.max(0, -s)) * wk - 0.5 * sw;
        qolR.tirsak.rotation.x = -(0.2 + tb * Math.max(0, s)) * wk - 0.5 * sw;
        qolL.el.rotation.x = -0.1 * wk;
        qolR.el.rotation.x = -0.1 * wk;

        // gavda: biroz tebranish, burilish, egilish
        tan.position.y = Math.abs(c) * 0.05 * k * wk;
        tan.position.x = s * 0.01 * k * wk;
        tan.rotation.x = (0.04 * k + 0.16 * yug * k) * wk + 1.0 * sw;
        tan.rotation.z = Math.sin(t * 0.7) * 0.012 * (1 - k) * wk + Math.sin(faza2) * 0.12 * sw;
        kalcha.rotation.y = s * 0.1 * k * wk;
        ust.rotation.y = -s * 0.14 * k * wk;
        kalcha.rotation.z = s * 0.035 * k * wk;
        ust.rotation.z = -s * 0.02 * k * wk;
        ust.scale.y = 1 + Math.sin(t * 2.2) * 0.006 * (1 - k) * wk;

        bosh.rotation.x = -0.04 * k * wk - 0.75 * sw + Math.sin(t * 1.3) * 0.01;
        bosh.rotation.y = s * 0.07 * k * wk;
        bosh.rotation.z = Math.sin(t * 0.9) * 0.03 * (1 - k);

        // soch tebranishi
        const tr = 0.25 + k;
        poni1.rotation.x = 0.15 + 0.5 * tez + Math.sin(t * 7) * 0.09 * tr;
        poni2.rotation.x = 0.1 + 0.2 * tez + Math.sin(t * 7 - 1.0) * 0.14 * tr;
        poni3.rotation.x = 0.1 + 0.15 * tez + Math.sin(t * 7 - 2.0) * 0.18 * tr;
        poni1.rotation.z = Math.sin(t * 3.1) * 0.05 * tr;
        ahoge.rotation.x = Math.sin(t * 2.4) * 0.12 + 0.2 * tez;

        plashYangila(t, tez, k);
      }
    };
  }
};

/* ============================================================
   Suv effektlari: to‘lqin halqalari va suv sachrashi (suzganda)
   ============================================================ */
const SuvEffekti = {
  halqalar: [],
  N: 48,

  boshlash() {
    const g = new THREE.RingGeometry(0.88, 1, 36);
    g.rotateX(-Math.PI / 2);
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
      m.visible = false;
      m.renderOrder = 4;
      Sahna.scene.add(m);
      this.halqalar.push({ m: m, yosh: 9 });
    }
    const N = this.N;
    this.pos = new Float32Array(N * 3);
    this.vel = new Float32Array(N * 3);
    this.umr = new Float32Array(N);
    for (let i = 0; i < N; i++) this.pos[i * 3 + 1] = -50;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const cx = c.getContext('2d');
    const gr = cx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.6, 'rgba(255,255,255,0.9)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    cx.fillStyle = gr;
    cx.fillRect(0, 0, 32, 32);
    const mat = new THREE.PointsMaterial({ size: 0.2, map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, sizeAttenuation: true, color: 0xe8fbff });
    this.nuqta = new THREE.Points(geo, mat);
    this.nuqta.frustumCulled = false;
    this.nuqta.renderOrder = 4;
    Sahna.scene.add(this.nuqta);
    this.t1 = 0;
    this.t2 = 0;
  },

  halqa(x, z) {
    for (let i = 0; i < this.halqalar.length; i++) {
      const h = this.halqalar[i];
      if (h.yosh >= 1.3) {
        h.yosh = 0;
        h.m.position.set(x, Dunyo.suvY + 0.03, z);
        h.m.visible = true;
        return;
      }
    }
  },

  sachrash(x, z, n, kuch) {
    let berildi = 0;
    for (let i = 0; i < this.N && berildi < n; i++) {
      if (this.umr[i] > 0) continue;
      this.umr[i] = 0.6 + Math.random() * 0.4;
      this.pos[i * 3] = x + (Math.random() - 0.5) * 0.4;
      this.pos[i * 3 + 1] = Dunyo.suvY + 0.05;
      this.pos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.4;
      this.vel[i * 3] = (Math.random() - 0.5) * 2.2 * kuch;
      this.vel[i * 3 + 1] = 2 + Math.random() * 2 * kuch;
      this.vel[i * 3 + 2] = (Math.random() - 0.5) * 2.2 * kuch;
      berildi++;
    }
  },

  yangila(dt, p, suzmoqda, tezlik, dx, dz) {
    if (suzmoqda) {
      this.t1 -= dt;
      if (this.t1 <= 0) { this.halqa(p.x, p.z); this.t1 = tezlik > 1 ? 0.3 : 0.75; }
      if (tezlik > 0.5) {
        this.t2 -= dt;
        if (this.t2 <= 0) { this.sachrash(p.x + dx * 0.4, p.z + dz * 0.4, 2, 0.8); this.t2 = 0.1; }
      }
    }
    for (let i = 0; i < this.halqalar.length; i++) {
      const h = this.halqalar[i];
      if (h.yosh >= 1.3) continue;
      h.yosh += dt;
      if (h.yosh >= 1.3) { h.m.visible = false; continue; }
      const s = 0.35 + h.yosh * 1.5;
      h.m.scale.set(s, 1, s);
      h.m.material.opacity = 0.75 * Math.pow(Math.max(0, 1 - h.yosh / 1.3), 1.5);
    }
    for (let i = 0; i < this.N; i++) {
      if (this.umr[i] <= 0) continue;
      this.vel[i * 3 + 1] -= 10 * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.umr[i] -= dt;
      if (this.umr[i] <= 0 || this.pos[i * 3 + 1] < Dunyo.suvY) { this.umr[i] = 0; this.pos[i * 3 + 1] = -50; }
    }
    this.nuqta.geometry.attributes.position.needsUpdate = true;
  }
};

/* ============================================================
   Personaj — harakat va boshqaruv
   ============================================================ */
const Personaj = {
  MAX_TEZLIK: 6.5,
  tezlik: 0,
  tezlik01: 0,
  dx: 0,
  dz: -1,
  chegara: 150,
  OLCHAM: 0.77,        // personaj o‘lchami (avvalgisidan ~23% kichik)
  suzish: false,

  boshlash() {
    this.model = PersonajModeli.yarat();
    this.root = this.model.root;
    this.root.position.set(0, Dunyo.balandlik(0, 0), 0);
    this.root.rotation.y = Math.PI;   // kameradan teskari qarab turadi
    this.root.scale.setScalar(this.OLCHAM);
    Sahna.scene.add(this.root);
    SuvEffekti.boshlash();
  },

  _burchakFarqi(a, b) {
    let d = a - b;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  },

  // kirish: {x, y, tez}; kamYaw — kameraning burilish burchagi
  yangila(dt, t, kirish, kamYaw) {
    const pos = this.root.position;
    const harakatBor = kirish.tez > 0.01 && (kirish.x !== 0 || kirish.y !== 0);

    if (harakatBor) {
      const sy = Math.sin(kamYaw), cy = Math.cos(kamYaw);
      // kameraga nisbatan: oldinga = (-sin, -cos), o‘ngga = (cos, -sin)
      let mx = -sy * kirish.y + cy * kirish.x;
      let mz = -cy * kirish.y - sy * kirish.x;
      const l = Math.hypot(mx, mz) || 1;
      this.dx = mx / l;
      this.dz = mz / l;
      const maqsad = this.MAX_TEZLIK * kirish.tez * (this.suzish ? 0.5 : 1);   // suvda tezlik yarmi
      this.tezlik += (maqsad - this.tezlik) * Math.min(1, 10 * dt);
      const burch = Math.atan2(this.dx, this.dz);
      const f = this._burchakFarqi(burch, this.root.rotation.y);
      this.root.rotation.y += f * Math.min(1, 12 * dt);
    } else {
      this.tezlik += (0 - this.tezlik) * Math.min(1, 12 * dt);
      if (this.tezlik < 0.02) this.tezlik = 0;
    }

    if (this.tezlik > 0) {
      let nx = pos.x + this.dx * this.tezlik * dt;
      let nz = pos.z + this.dz * this.tezlik * dt;
      const SUV = -1.5;   // chuqur suvga kirmaydi
      if (Dunyo.suvChuqurligi(nx, nz) === 0 && Dunyo.balandlik(nx, nz) < SUV) {
        if (Dunyo.balandlik(nx, pos.z) >= SUV) nz = pos.z;
        else if (Dunyo.balandlik(pos.x, nz) >= SUV) nx = pos.x;
        else { nx = pos.x; nz = pos.z; }
      }
      pos.x = nx;
      pos.z = nz;
    }
    Dunyo.itar(pos, 0.27);
    pos.x = Math.max(-this.chegara, Math.min(this.chegara, pos.x));
    pos.z = Math.max(-this.chegara, Math.min(this.chegara, pos.z));

    // suzish holati (ko‘l ichida chuqur joyda)
    const chuq = Dunyo.suvChuqurligi(pos.x, pos.z);
    const oldingi = this.suzish;
    if (!this.suzish && chuq > 0.8) this.suzish = true;
    else if (this.suzish && chuq < 0.5) this.suzish = false;
    if (this.suzish !== oldingi) {
      SuvEffekti.sachrash(pos.x, pos.z, 18, 1.0);
      SuvEffekti.halqa(pos.x, pos.z);
    }

    // yer ustida yoki suv yuzasida
    let maqY = Dunyo.balandlik(pos.x, pos.z);
    if (this.suzish) maqY = Dunyo.suvY - 0.36 + Math.sin(t * 2.6) * 0.035;
    pos.y += (maqY - pos.y) * Math.min(1, (this.suzish ? 6 : 20) * dt);

    this.tezlik01 = this.tezlik / this.MAX_TEZLIK;
    const modelTez = this.suzish ? Math.min(1, this.tezlik / (this.MAX_TEZLIK * 0.5)) : this.tezlik01;
    const yugur01 = this.suzish ? 0 : Math.max(0, Math.min(1, (this.tezlik - 3.8) / 2.4));
    this.model.yangila(dt, t, modelTez, yugur01, this.suzish);
    SuvEffekti.yangila(dt, pos, this.suzish, this.tezlik, this.dx, this.dz);
  }
};
