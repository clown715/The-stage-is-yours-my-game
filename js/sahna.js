/* ============================================================
   sahna.js — sahna, yorug‘lik, osmon, soya, yordamchi funksiyalar
   ============================================================ */
const Sahna = {
  quyoshYoni: new THREE.Vector3(-0.55, 0.8, 0.45).normalize(),
  ufqRangi: 0xcdeef2,
  sifatlar: {
    past:   { pr: 1.0,  soya: false, xarita: 512 },
    orta:   { pr: 1.25, soya: true,  xarita: 512 },
    yuqori: { pr: 1.5,  soya: true,  xarita: 1024 }
  },
  bulutlar: [],
  _konturMat: {},

  boshlash(canvas) {
    const r = this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    r.setSize(window.innerWidth, window.innerHeight, false);
    r.setClearColor(this.ufqRangi);
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(this.ufqRangi, 70, 260);
    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 700);

    this.gradientYasash();
    this.yorugliklar();
    this.osmonYasash();
    this.quyoshVaBulutlar();
  },

  // 4 pog‘onali multfilm (toon) gradient xaritasi
  gradientYasash() {
    const d = new Uint8Array([70, 140, 205, 255]);
    const fmt = this.renderer.capabilities.isWebGL2 ? THREE.RedFormat : THREE.LuminanceFormat;
    const t = new THREE.DataTexture(d, 4, 1, fmt);
    t.minFilter = THREE.NearestFilter;
    t.magFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.needsUpdate = true;
    this.gradient = t;
  },

  toon(renk, qoshimcha) {
    return new THREE.MeshToonMaterial(Object.assign({ color: renk, gradientMap: this.gradient }, qoshimcha || {}));
  },

  yorugliklar() {
    this.yarimShar = new THREE.HemisphereLight(0xd4ecff, 0x86b872, 0.8);
    this.scene.add(this.yarimShar);

    const s = this.quyosh = new THREE.DirectionalLight(0xfff0cf, 1.05);
    s.castShadow = true;
    s.shadow.mapSize.set(1024, 1024);
    const c = s.shadow.camera;
    c.left = -28; c.right = 28; c.top = 28; c.bottom = -28; c.near = 1; c.far = 170;
    s.shadow.bias = -0.0008;
    s.shadow.normalBias = 0.04;
    this.scene.add(s);
    this.scene.add(s.target);
  },

  _radial(stoplar, olcham) {
    const c = document.createElement('canvas');
    c.width = c.height = olcham;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(olcham / 2, olcham / 2, 0, olcham / 2, olcham / 2, olcham / 2);
    stoplar.forEach(function (s) { gr.addColorStop(s[0], s[1]); });
    g.fillStyle = gr;
    g.fillRect(0, 0, olcham, olcham);
    return new THREE.CanvasTexture(c);
  },

  // Gradient osmon gumbazi (shader)
  osmonYasash() {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        yuqori: { value: new THREE.Color(0x3d9be0) },
        orta:   { value: new THREE.Color(0x78c6ee) },
        ufq:    { value: new THREE.Color(this.ufqRangi) },
        quyosh: { value: this.quyoshYoni.clone() }
      },
      vertexShader: [
        'varying vec3 vD;',
        'void main(){',
        '  vD = normalize(position);',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 yuqori; uniform vec3 orta; uniform vec3 ufq; uniform vec3 quyosh;',
        'varying vec3 vD;',
        'void main(){',
        '  float h = vD.y;',
        '  vec3 c = mix(ufq, orta, smoothstep(0.0, 0.35, h));',
        '  c = mix(c, yuqori, smoothstep(0.3, 0.9, h));',
        '  if (h < 0.0) c = ufq;',
        '  float s = max(dot(vD, quyosh), 0.0);',
        '  c += vec3(1.0, 0.86, 0.55) * pow(s, 24.0) * 0.35;',
        '  gl_FragColor = vec4(c, 1.0);',
        '}'
      ].join('\n'),
      side: THREE.BackSide,
      depthWrite: false,
      fog: false
    });
    const m = this.osmon = new THREE.Mesh(new THREE.SphereGeometry(450, 24, 14), mat);
    m.frustumCulled = false;
    m.renderOrder = -100;
    this.scene.add(m);
  },

  _bulutTeksturasi() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const g = c.getContext('2d');
    const dog = [[70, 78, 46], [115, 62, 52], [165, 66, 50], [200, 82, 38], [130, 86, 44]];
    dog.forEach(function (b) {
      const gr = g.createRadialGradient(b[0], b[1], b[2] * 0.1, b[0], b[1], b[2]);
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(0.65, 'rgba(255,255,255,0.85)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.beginPath();
      g.arc(b[0], b[1], b[2], 0, 7);
      g.fill();
    });
    g.globalCompositeOperation = 'source-atop';
    const lg = g.createLinearGradient(0, 40, 0, 120);
    lg.addColorStop(0, 'rgba(255,255,255,0)');
    lg.addColorStop(1, 'rgba(176,205,235,0.75)');
    g.fillStyle = lg;
    g.fillRect(0, 0, 256, 128);
    return new THREE.CanvasTexture(c);
  },

  quyoshVaBulutlar() {
    const disk = this._radial([[0, 'rgba(255,252,225,1)'], [0.42, 'rgba(255,244,190,1)'], [0.5, 'rgba(255,240,170,0)'], [1, 'rgba(255,240,170,0)']], 128);
    const nur = this._radial([[0, 'rgba(255,236,170,0.75)'], [0.3, 'rgba(255,226,150,0.28)'], [1, 'rgba(255,220,140,0)']], 128);

    this.quyoshNuri = new THREE.Sprite(new THREE.SpriteMaterial({ map: nur, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
    this.quyoshNuri.scale.set(190, 190, 1);
    this.quyoshNuri.renderOrder = -99;
    this.quyoshDiski = new THREE.Sprite(new THREE.SpriteMaterial({ map: disk, transparent: true, depthWrite: false, fog: false }));
    this.quyoshDiski.scale.set(44, 44, 1);
    this.quyoshDiski.renderOrder = -98;
    this.scene.add(this.quyoshNuri, this.quyoshDiski);

    const bt = this._bulutTeksturasi();
    const mat = new THREE.SpriteMaterial({ map: bt, transparent: true, depthWrite: false, fog: false, opacity: 0.95 });
    let urug = 7;
    const tasodif = function () { urug = (urug * 16807) % 2147483647; return urug / 2147483647; };
    for (let i = 0; i < 14; i++) {
      const sp = new THREE.Sprite(mat);
      const k = 80 + tasodif() * 70;
      sp.scale.set(k, k * 0.5, 1);
      sp.position.set((tasodif() - 0.5) * 640, 85 + tasodif() * 45, (tasodif() - 0.5) * 640);
      sp.renderOrder = -90;
      this.scene.add(sp);
      this.bulutlar.push(sp);
    }
  },

  // Har kadrda: osmon kamera bilan yuradi, soya personaj atrofida
  yangila(dt, hedef) {
    const c = this.camera.position;
    this.osmon.position.copy(c);
    this.quyoshDiski.position.copy(c).addScaledVector(this.quyoshYoni, 380);
    this.quyoshNuri.position.copy(this.quyoshDiski.position);
    this.quyosh.position.copy(hedef).addScaledVector(this.quyoshYoni, 80);
    this.quyosh.target.position.copy(hedef);
    for (let i = 0; i < this.bulutlar.length; i++) {
      const b = this.bulutlar[i];
      b.position.x += dt * 2.0;
      if (b.position.x > 340) b.position.x = -340;
    }
  },

  olchamniYangila() {
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  },

  // Grafika sifati: past / orta / yuqori
  sifatOrnat(nom) {
    const s = this.sifatlar[nom];
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, s.pr));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.quyosh.castShadow = s.soya;
    if (s.soya && this.quyosh.shadow.mapSize.x !== s.xarita) {
      this.quyosh.shadow.mapSize.set(s.xarita, s.xarita);
      if (this.quyosh.shadow.map) {
        this.quyosh.shadow.map.dispose();
        this.quyosh.shadow.map = null;
      }
    }
  },

  /* ---------- Yordamchi funksiyalar ---------- */

  // Bir nechta geometriyani bittaga birlashtirish: [{g: geometriya, m: Matrix4}, ...]
  birlashtir(royxat) {
    const pos = [], nor = [];
    const nm = new THREE.Matrix3(), v = new THREE.Vector3();
    royxat.forEach(function (it) {
      const q = it.g.index ? it.g.toNonIndexed() : it.g;
      nm.getNormalMatrix(it.m);
      const p = q.attributes.position, n = q.attributes.normal;
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).applyMatrix4(it.m);
        pos.push(v.x, v.y, v.z);
        v.fromBufferAttribute(n, i).applyMatrix3(nm).normalize();
        nor.push(v.x, v.y, v.z);
      }
    });
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    return out;
  },

  // Bir xil joydagi uchlarning normalini o‘rtalashtirish (kontur yoriqsiz chiqishi uchun)
  yumshoqNormal(g) {
    const p = g.attributes.position, n = g.attributes.normal;
    const acc = new Map();
    const kalit = function (i) {
      return Math.round(p.getX(i) * 1000) + '_' + Math.round(p.getY(i) * 1000) + '_' + Math.round(p.getZ(i) * 1000);
    };
    let i, a, k;
    for (i = 0; i < p.count; i++) {
      k = kalit(i);
      a = acc.get(k);
      if (!a) { a = [0, 0, 0]; acc.set(k, a); }
      a[0] += n.getX(i); a[1] += n.getY(i); a[2] += n.getZ(i);
    }
    const arr = new Float32Array(p.count * 3);
    for (i = 0; i < p.count; i++) {
      a = acc.get(kalit(i));
      const l = Math.hypot(a[0], a[1], a[2]) || 1;
      arr[i * 3] = a[0] / l; arr[i * 3 + 1] = a[1] / l; arr[i * 3 + 2] = a[2] / l;
    }
    g.setAttribute('normal', new THREE.BufferAttribute(arr, 3));
  },

  konturMaterial(rang, q) {
    const kalit = rang + '_' + q;
    if (!this._konturMat[kalit]) {
      this._konturMat[kalit] = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { t: { value: q }, c: { value: new THREE.Color(rang) } }]),
        vertexShader: [
          'uniform float t;',
          '#include <fog_pars_vertex>',
          'void main(){',
          '  vec4 p = vec4(position + normal * t, 1.0);',
          '  #ifdef USE_INSTANCING',
          '    p = instanceMatrix * p;',
          '  #endif',
          '  vec4 mvPosition = modelViewMatrix * p;',
          '  gl_Position = projectionMatrix * mvPosition;',
          '  #include <fog_vertex>',
          '}'
        ].join('\n'),
        fragmentShader: [
          'uniform vec3 c;',
          '#include <fog_pars_fragment>',
          'void main(){',
          '  gl_FragColor = vec4(c, 1.0);',
          '  #include <fog_fragment>',
          '}'
        ].join('\n'),
        side: THREE.BackSide,
        fog: true
      });
    }
    return this._konturMat[kalit];
  },

  // Kontur (outline): orqa tomoni ko‘rinadigan, biroz kattalashtirilgan nusxa
  kontur(mesh, q, rang) {
    const g = mesh.geometry.clone();
    this.yumshoqNormal(g);
    const mat = this.konturMaterial(rang, q);
    let o;
    if (mesh.isInstancedMesh) {
      o = new THREE.InstancedMesh(g, mat, mesh.count);
      o.instanceMatrix = mesh.instanceMatrix;
    } else {
      o = new THREE.Mesh(g, mat);
    }
    o.frustumCulled = false;
    o.castShadow = false;
    o.receiveShadow = false;
    mesh.add(o);
    return o;
  }
};
