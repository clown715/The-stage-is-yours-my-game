/* ============================================================
   boshqaruv.js — klaviatura (WASD, Shift), sichqoncha va sensorli boshqaruv
   Telefonda: ekranning chap tomoni — joystik, o‘ng tomoni — kamera,
   ikki barmoq bilan — yaqinlashtirish / uzoqlashtirish.
   ============================================================ */
const Boshqaruv = {
  faol: false,
  sensorli: false,
  tugmalar: {},
  kam: new Map(),                       // kamera barmoqlari / sichqoncha
  joy: { id: null, x0: 0, y0: 0, x: 0, y: 0 },
  dx: 0,
  dy: 0,
  zoom: 0,
  JOY_RADIUS: 55,

  boshlash(canvas) {
    const self = this;
    this.sensorli = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || ('ontouchstart' in window);
    this.joyEl = document.getElementById('joy');
    this.knobEl = document.getElementById('joyKnob');

    /* ----- klaviatura ----- */
    window.addEventListener('keydown', function (e) {
      self.tugmalar[e.code] = true;
      if (self.faol && /^(Arrow|Space)/.test(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', function (e) { self.tugmalar[e.code] = false; });
    window.addEventListener('blur', function () { self.tugmalar = {}; });

    /* ----- sichqoncha / sensor (pointer events) ----- */
    canvas.addEventListener('pointerdown', function (e) {
      if (!self.faol) return;
      try { canvas.setPointerCapture(e.pointerId); } catch (er) { /* e’tiborsiz */ }
      if (e.pointerType === 'mouse') {
        self.kam.set(e.pointerId, { x: e.clientX, y: e.clientY });
      } else if (e.clientX < window.innerWidth * 0.45 && self.joy.id === null) {
        const j = self.joy;
        j.id = e.pointerId; j.x0 = e.clientX; j.y0 = e.clientY; j.x = 0; j.y = 0;
        self.joyEl.style.left = (e.clientX - 65) + 'px';
        self.joyEl.style.top = (e.clientY - 65) + 'px';
        self.joyEl.style.display = 'block';
        self.knobEl.style.transform = 'translate(0px, 0px)';
      } else {
        self.kam.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }
    });

    canvas.addEventListener('pointermove', function (e) {
      if (self.joy.id === e.pointerId) {
        const j = self.joy, R = self.JOY_RADIUS;
        const ddx = e.clientX - j.x0, ddy = e.clientY - j.y0;
        const l = Math.hypot(ddx, ddy);
        const k = l > R ? R / l : 1;
        self.knobEl.style.transform = 'translate(' + (ddx * k) + 'px, ' + (ddy * k) + 'px)';
        j.x = ddx * k / R;
        j.y = -ddy * k / R;
        return;
      }
      const c = self.kam.get(e.pointerId);
      if (!c) return;
      if (self.kam.size >= 2) {            // ikki barmoq: yaqinlashtirish
        const arr = Array.from(self.kam.values());
        const d0 = Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y);
        c.x = e.clientX; c.y = e.clientY;
        const d1 = Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y);
        self.zoom += (d0 - d1) * 0.02;
      } else {                              // bitta barmoq / sichqoncha: aylantirish
        self.dx += e.clientX - c.x;
        self.dy += e.clientY - c.y;
        c.x = e.clientX; c.y = e.clientY;
      }
    });

    const tugat = function (e) {
      if (self.joy.id === e.pointerId) {
        self.joy.id = null; self.joy.x = 0; self.joy.y = 0;
        self.joyEl.style.display = 'none';
      }
      self.kam.delete(e.pointerId);
    };
    canvas.addEventListener('pointerup', tugat);
    canvas.addEventListener('pointercancel', tugat);
    canvas.addEventListener('lostpointercapture', tugat);

    canvas.addEventListener('wheel', function (e) {
      if (!self.faol) return;
      e.preventDefault();
      self.zoom += Math.max(-3, Math.min(3, e.deltaY * 0.01));
    }, { passive: false });

    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
    document.addEventListener('touchmove', function (e) { if (self.faol) e.preventDefault(); }, { passive: false });
  },

  // Personaj uchun harakat: {x, y} (birlik vektor), tez (0..1, 1 = yugurish)
  olish() {
    const K = this.tugmalar;
    let x = 0, y = 0, tez = 0;
    if (K.KeyW || K.ArrowUp) y += 1;
    if (K.KeyS || K.ArrowDown) y -= 1;
    if (K.KeyD || K.ArrowRight) x += 1;
    if (K.KeyA || K.ArrowLeft) x -= 1;
    if (x !== 0 || y !== 0) {
      const l = Math.hypot(x, y);
      x /= l; y /= l;
      tez = (K.ShiftLeft || K.ShiftRight) ? 1 : 0.55;
    }
    if (this.joy.id !== null) {
      const m = Math.hypot(this.joy.x, this.joy.y);
      if (m > 0.12) {
        x = this.joy.x / m;
        y = this.joy.y / m;
        tez = Math.max(0.2, Math.min(1, (m - 0.12) / 0.8));
      }
    }
    return { x: x, y: y, tez: tez };
  },

  // Kamera uchun yig‘ilgan siljish (har kadrda o‘qiladi va nolga tushadi)
  kameraOl() {
    const r = { dx: this.dx, dy: this.dy, zoom: this.zoom };
    this.dx = 0; this.dy = 0; this.zoom = 0;
    return r;
  }
};
