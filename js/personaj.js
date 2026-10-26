/* ============================================================
   personaj.js — personaj modeli (alohida modul), animatsiya, harakat

   PersonajModeli — faqat tashqi ko‘rinish va animatsiya. Keyinchalik tayyor
   modelga almashtirish uchun PersonajModeli.yarat() ni o‘zgartirish kifoya:
   u { root, yangila(dt, t, tez01, yugur01) } qaytarishi kerak.
   Personaj — harakat, burilish, yerga yopishish, to‘qnashuv.
   ============================================================ */
const PersonajModeli = {
  yarat() {
    const INK = 0x2b2347, TERI = 0xffdcc2, OQ = 0xf6f3ec, FIROZA = 0x2fb8a6, OLTIN = 0xf3c451;
    const SOCH = 0x4b55c4, SOCH2 = 0x808bf0, ETIK = 0x2c3f86;

    const root = new THREE.Group();
    const tan = new THREE.Group();
    root.add(tan);

    function qism(g, renk, ota, x, y, z, q, mat) {
      const m = new THREE.Mesh(g, mat || Sahna.toon(renk));
      m.position.set(x || 0, y || 0, z || 0);
      m.castShadow = true;
      if (q !== 0) Sahna.kontur(m, q || 0.014, INK);
      ota.add(m);
      return m;
    }
    function sfera(r, sx, sy, sz) {
      const g = new THREE.SphereGeometry(r, 14, 10);
      g.scale(sx, sy, sz);
      return g;
    }
    function konus(r, h, seg) {   // uchi pastga qaragan konus
      const g = new THREE.ConeGeometry(r, h, seg || 6);
      g.rotateX(Math.PI);
      g.translate(0, -h / 2, 0);
      return g;
    }
    function silindr(rt, rb, h, seg) { return new THREE.CylinderGeometry(rt, rb, h, seg || 12); }

    /* ----- tana ----- */
    qism(silindr(0.19, 0.16, 0.5, 14), OQ, tan, 0, 1.17, 0);              // ko‘krak
    qism(silindr(0.17, 0.27, 0.3, 16), FIROZA, tan, 0, 0.86, 0);          // pastki ko‘ylak
    qism(silindr(0.2, 0.2, 0.07, 16), OLTIN, tan, 0, 0.97, 0);            // belbog‘
    qism(silindr(0.05, 0.06, 0.12, 8), TERI, tan, 0, 1.48, 0, 0.008);     // bo‘yin
    qism(silindr(0.2, 0.32, 0.15, 16), FIROZA, tan, 0, 1.38, 0);          // yelkadagi mato (mantiya)
    const halqa = new THREE.TorusGeometry(0.255, 0.014, 6, 24);
    halqa.rotateX(Math.PI / 2);
    qism(halqa, OLTIN, tan, 0, 1.31, 0, 0);                               // tilla hoshiya

    /* ----- bosh ----- */
    const bosh = new THREE.Group();
    bosh.position.set(0, 1.68, 0);
    tan.add(bosh);
    qism(sfera(0.235, 1, 0.97, 0.97), TERI, bosh, 0, 0, 0);

    [-1, 1].forEach(function (yon) {
      qism(sfera(0.05, 0.85, 1.25, 0.35), 0x2aa6d0, bosh, yon * 0.085, -0.02, 0.212, 0);   // ko‘z
      qism(sfera(0.03, 0.8, 1.2, 0.3), 0x16324f, bosh, yon * 0.085, -0.02, 0.222, 0);      // qorachiq
      qism(sfera(0.014, 1, 1, 0.5), 0xffffff, bosh, yon * 0.085 + 0.015, 0.012, 0.228, 0); // yaltiroq
      qism(sfera(0.056, 1, 0.18, 0.3), INK, bosh, yon * 0.085, 0.045, 0.212, 0);           // qosh-qovoq
      qism(sfera(0.03, 1, 0.55, 0.25), 0xffa6a6, bosh, yon * 0.14, -0.07, 0.18, 0);        // yonoq
    });
    qism(sfera(0.018, 1.6, 0.4, 0.3), 0xc0615f, bosh, 0, -0.1, 0.205, 0);                  // og‘iz

    // soch: qalpoq + orqa qism + popuk + yon tolalar
    const qalpoq = qism(new THREE.SphereGeometry(0.265, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), SOCH, bosh, 0, 0.015, -0.02);
    qalpoq.rotation.x = -0.35;
    qism(sfera(0.25, 1, 1.05, 0.9), SOCH, bosh, 0, -0.07, -0.07);
    for (let i = 0; i < 5; i++) {
      const a = (i - 2) * 0.42;
      const uz = i === 2 ? 0.15 : (i === 1 || i === 3 ? 0.13 : 0.1);
      const b = qism(konus(0.06, uz, 6), SOCH, bosh, Math.sin(a) * 0.2, 0.17, Math.cos(a) * 0.205, 0.01);
      b.rotation.y = a;
    }
    const yonL = qism(konus(0.055, 0.3, 6), SOCH, bosh, -0.225, 0.05, 0.06);
    const yonR = qism(konus(0.055, 0.3, 6), SOCH, bosh, 0.225, 0.05, 0.06);
    yonL.rotation.z = -0.1; yonR.rotation.z = 0.1;
    const ahoge = qism(new THREE.ConeGeometry(0.025, 0.18, 5), SOCH2, bosh, 0.02, 0.28, 0.05, 0.008);
    ahoge.rotation.z = -0.4;
    qism(new THREE.OctahedronGeometry(0.03), OLTIN, bosh, 0.16, 0.17, 0.13, 0.006);        // soch to‘g‘nog‘ichi

    // dumcha (3 bo‘g‘in, tebranadi)
    const poni1 = new THREE.Group();
    poni1.position.set(0, 0.12, -0.21);
    bosh.add(poni1);
    qism(sfera(0.05, 1, 1, 1), OLTIN, poni1, 0, 0, 0, 0.006);
    qism(sfera(0.09, 1, 1.6, 1), SOCH, poni1, 0, -0.13, 0);
    const poni2 = new THREE.Group();
    poni2.position.set(0, -0.24, 0);
    poni1.add(poni2);
    qism(sfera(0.08, 1, 1.7, 1), SOCH, poni2, 0, -0.14, 0);
    const poni3 = new THREE.Group();
    poni3.position.set(0, -0.28, 0);
    poni2.add(poni3);
    qism(konus(0.075, 0.26, 6), SOCH2, poni3, 0, 0, 0);

    /* ----- qo‘llar ----- */
    function qolYasa(yon) {
      const yelka = new THREE.Group();
      yelka.position.set(yon * 0.27, 1.4, 0);
      tan.add(yelka);
      qism(silindr(0.058, 0.05, 0.28, 10), OQ, yelka, 0, -0.14, 0);
      const tirsak = new THREE.Group();
      tirsak.position.set(0, -0.28, 0);
      yelka.add(tirsak);
      qism(silindr(0.04, 0.034, 0.26, 10), TERI, tirsak, 0, -0.13, 0);
      qism(sfera(0.048, 1, 1, 1), TERI, tirsak, 0, -0.29, 0);
      const halqa2 = new THREE.TorusGeometry(0.052, 0.012, 6, 14);
      halqa2.rotateX(Math.PI / 2);
      qism(halqa2, OLTIN, tirsak, 0, 0.0, 0, 0);
      return { yelka: yelka, tirsak: tirsak };
    }
    const qolL = qolYasa(-1), qolR = qolYasa(1);

    /* ----- oyoqlar ----- */
    function oyoqYasa(yon) {
      const son = new THREE.Group();
      son.position.set(yon * 0.095, 0.84, 0);
      tan.add(son);
      qism(silindr(0.075, 0.065, 0.4, 10), TERI, son, 0, -0.2, 0);
      const tizza = new THREE.Group();
      tizza.position.set(0, -0.4, 0);
      son.add(tizza);
      qism(silindr(0.062, 0.05, 0.34, 10), OQ, tizza, 0, -0.17, 0);
      qism(silindr(0.06, 0.07, 0.16, 10), ETIK, tizza, 0, -0.26, 0);
      qism(sfera(0.08, 1, 0.6, 1.5), ETIK, tizza, 0, -0.37, 0.045);
      return { son: son, tizza: tizza };
    }
    const oyL = oyoqYasa(-1), oyR = oyoqYasa(1);

    /* ----- orqadagi mato (plash) ----- */
    const plashG = new THREE.PlaneGeometry(0.52, 0.85, 5, 8);
    plashG.translate(0, -0.425, 0);
    const plashPos = plashG.attributes.position;
    const asl = plashPos.array.slice();
    const plash = new THREE.Mesh(plashG, Sahna.toon(FIROZA, { side: THREE.DoubleSide }));
    plash.position.set(0, 1.36, -0.29);
    plash.castShadow = true;
    tan.add(plash);

    /* ----- animatsiya ----- */
    let faza = 0;
    return {
      root: root,
      yangila(dt, t, tez, yug) {
        const k = Math.min(1, tez * 2.5);                 // harakat darajasi
        faza += dt * (4 + 7 * tez);
        const s = Math.sin(faza), c = Math.cos(faza);
        const A = (0.5 + 0.5 * yug) * k;
        const bukish = (0.5 + 0.7 * yug) * k;

        oyL.son.rotation.x = -s * A;
        oyR.son.rotation.x = s * A;
        oyL.tizza.rotation.x = Math.max(0, c) * bukish;
        oyR.tizza.rotation.x = Math.max(0, -c) * bukish;

        qolL.yelka.rotation.x = s * A * 0.9;
        qolR.yelka.rotation.x = -s * A * 0.9;
        qolL.yelka.rotation.z = 0.1;
        qolR.yelka.rotation.z = -0.1;
        const tb = k * (0.3 + 0.6 * yug);
        qolL.tirsak.rotation.x = -(0.2 + tb * Math.max(0, -s));
        qolR.tirsak.rotation.x = -(0.2 + tb * Math.max(0, s));

        tan.position.y = Math.abs(c) * 0.06 * k;
        tan.rotation.x = 0.04 * k + 0.16 * yug * k;
        tan.scale.y = 1 + Math.sin(t * 2.2) * 0.006 * (1 - k);

        bosh.rotation.x = -0.04 * k + Math.sin(t * 1.3) * 0.01;
        bosh.rotation.z = Math.sin(t * 0.9) * 0.03 * (1 - k);

        // soch tebranishi
        const tr = 0.25 + k;
        poni1.rotation.x = 0.15 + 0.5 * tez + Math.sin(t * 7) * 0.09 * tr;
        poni2.rotation.x = 0.1 + 0.2 * tez + Math.sin(t * 7 - 1.0) * 0.14 * tr;
        poni3.rotation.x = 0.1 + 0.15 * tez + Math.sin(t * 7 - 2.0) * 0.18 * tr;
        poni1.rotation.z = Math.sin(t * 3.1) * 0.05 * tr;
        yonL.rotation.x = 0.1 * tez + Math.sin(t * 6 + 1) * 0.05 * tr;
        yonR.rotation.x = 0.1 * tez + Math.sin(t * 6 + 2) * 0.05 * tr;
        ahoge.rotation.x = Math.sin(t * 2.4) * 0.12 + 0.2 * tez;

        // plash tebranishi
        const p = plashPos.array;
        for (let i = 0; i < plashPos.count; i++) {
          const x0 = asl[i * 3], y0 = asl[i * 3 + 1];
          const d = -y0 / 0.85;
          p[i * 3] = x0 * (1 + 0.18 * d) + Math.sin(t * 4.5 - d * 4 + x0 * 6) * 0.02 * d * (0.3 + k);
          p[i * 3 + 1] = y0;
          p[i * 3 + 2] = -(0.05 + d * (0.05 + 0.3 * tez)) + Math.sin(t * 6.5 - d * 5.5 + x0 * 3) * 0.035 * d * (0.25 + k);
        }
        plashPos.needsUpdate = true;
        plashG.computeVertexNormals();
      }
    };
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

  boshlash() {
    this.model = PersonajModeli.yarat();
    this.root = this.model.root;
    this.root.position.set(0, Dunyo.balandlik(0, 0), 0);
    this.root.rotation.y = Math.PI;   // kameradan teskari qarab turadi
    Sahna.scene.add(this.root);
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
      const maqsad = this.MAX_TEZLIK * kirish.tez;
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
      if (Dunyo.balandlik(nx, nz) < SUV) {
        if (Dunyo.balandlik(nx, pos.z) >= SUV) nz = pos.z;
        else if (Dunyo.balandlik(pos.x, nz) >= SUV) nx = pos.x;
        else { nx = pos.x; nz = pos.z; }
      }
      pos.x = nx;
      pos.z = nz;
    }
    Dunyo.itar(pos, 0.35);
    pos.x = Math.max(-this.chegara, Math.min(this.chegara, pos.x));
    pos.z = Math.max(-this.chegara, Math.min(this.chegara, pos.z));

    const h = Dunyo.balandlik(pos.x, pos.z);
    pos.y += (h - pos.y) * Math.min(1, 20 * dt);

    this.tezlik01 = this.tezlik / this.MAX_TEZLIK;
    const yugur01 = Math.max(0, Math.min(1, (this.tezlik - 3.8) / 2.4));
    this.model.yangila(dt, t, this.tezlik01, yugur01);
  }
};
