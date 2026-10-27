/* ============================================================
   kamera.js — uchinchi shaxs kamerasi (personajni orqadan ko‘rsatadi)
   ============================================================ */
const Kamera = {
  yaw: 0,
  pitch: 0.32,
  mesafe: 5.8,
  minMesafe: 2.7,
  maxMesafe: 8.5,
  hedef: new THREE.Vector3(),
  tayyor: false,

  boshlash() {
    this.tayyor = false;
  },

  // p — personaj o‘rni, run01 — yugurish darajasi (0..1)
  yangila(dt, boshlandi, p, run01) {
    const cam = Sahna.camera;
    const b = Boshqaruv.kameraOl();

    if (!boshlandi) {
      this.yaw += dt * 0.15;          // boshlash oynasi orqasida sekin aylanadi
    } else {
      this.yaw -= b.dx * 0.0055;
      this.pitch += b.dy * 0.0045;
      this.mesafe += b.zoom;
      const K = Boshqaruv.tugmalar;
      if (K.KeyQ) this.yaw += 1.8 * dt;
      if (K.KeyE) this.yaw -= 1.8 * dt;
    }
    this.pitch = Math.max(0.08, Math.min(1.3, this.pitch));
    this.mesafe = Math.max(this.minMesafe, Math.min(this.maxMesafe, this.mesafe));

    const tx = p.x, ty = p.y + 1.15, tz = p.z;
    if (!this.tayyor) {
      this.hedef.set(tx, ty, tz);
      this.tayyor = true;
    } else {
      const a = 1 - Math.exp(-12 * dt);   // silliq ergashish
      this.hedef.x += (tx - this.hedef.x) * a;
      this.hedef.y += (ty - this.hedef.y) * a;
      this.hedef.z += (tz - this.hedef.z) * a;
    }

    const cp = Math.cos(this.pitch);
    cam.position.set(
      this.hedef.x + Math.sin(this.yaw) * cp * this.mesafe,
      this.hedef.y + Math.sin(this.pitch) * this.mesafe,
      this.hedef.z + Math.cos(this.yaw) * cp * this.mesafe
    );
    // yerdan pastga tushmaydi
    const yer = Math.max(Dunyo.balandlik(cam.position.x, cam.position.z), Dunyo.suvY) + 0.45;   // yerdan va suv yuzasidan pastga tushmaydi
    if (cam.position.y < yer) cam.position.y = yer;

    // yugurganda ko‘rish burchagi biroz kengayadi
    const fov = 55 + 5 * run01;
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov += (fov - cam.fov) * Math.min(1, 4 * dt);
      cam.updateProjectionMatrix();
    }
    cam.lookAt(this.hedef);
  }
};
