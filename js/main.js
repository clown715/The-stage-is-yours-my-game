/* ============================================================
   main.js — hammasini ulash, asosiy sikl, avtomatik grafika sifati
   ============================================================ */
(function () {
  'use strict';

  const canvas = document.getElementById('oyin');
  const yuklanmoqda = document.getElementById('yuklanmoqda');
  const boshlashOyna = document.getElementById('boshlash');
  const boshlashTugma = document.getElementById('boshlashTugma');
  const sifatTugma = document.getElementById('sifatTugma');
  const yordam = document.getElementById('yordam');
  const boshqaruvMatni = document.getElementById('boshqaruvMatni');

  if (typeof THREE === 'undefined') {
    yuklanmoqda.textContent = 'three.js yuklanmadi. Internetni tekshirib, sahifani qayta oching.';
    return;
  }

  try {
    Sahna.boshlash(canvas);
  } catch (xato) {
    yuklanmoqda.textContent = 'Brauzeringiz 3D grafikani (WebGL) qo‘llab-quvvatlamayapti.';
    return;
  }

  Dunyo.boshlash();
  Personaj.boshlash();
  Kamera.boshlash();
  Boshqaruv.boshlash(canvas);

  const mobil = Boshqaruv.sensorli;
  const MATN_KOMPYUTER = 'W A S D — yurish, Shift — yugurish. Sichqonchani bosib surish — kamera, g‘ildirak — yaqinlashtirish. Q / E — kamerani burish.';
  const MATN_TELEFON = 'Ekranning chap tomonini surib yuring, o‘ng tomonini surib kamerani aylantiring. Ikki barmoq bilan yaqinlashtiring.';
  boshqaruvMatni.textContent = mobil ? MATN_TELEFON : MATN_KOMPYUTER;

  /* ---------- grafika sifati ---------- */
  const TARTIB = ['past', 'orta', 'yuqori'];
  const NOMLAR = { avto: 'Avto', past: 'Past', orta: 'O‘rta', yuqori: 'Yuqori' };
  let rejim = 'avto';
  let joriy = mobil ? 'orta' : 'yuqori';
  let isish = 3;           // sifat o‘zgargach, dastlabki soniyalar o‘lchanmaydi
  let kadrlar = 0, oraliq = 0;

  function yozuvniYangila() {
    sifatTugma.textContent = 'Grafika: ' + NOMLAR[rejim] + (rejim === 'avto' ? ' (' + NOMLAR[joriy] + ')' : '');
  }
  function sifatniQollash(s) {
    joriy = s;
    Sahna.sifatOrnat(s);
    Dunyo.sifatOrnat(s, Personaj.root.position);
    isish = 3; kadrlar = 0; oraliq = 0;
    yozuvniYangila();
  }
  sifatTugma.addEventListener('click', function () {
    const royxat = ['avto', 'past', 'orta', 'yuqori'];
    rejim = royxat[(royxat.indexOf(rejim) + 1) % royxat.length];
    if (rejim !== 'avto') sifatniQollash(rejim);
    else yozuvniYangila();
  });

  function fpsTekshir(xomDt) {
    if (isish > 0) { isish -= xomDt; return; }
    kadrlar++;
    oraliq += xomDt;
    if (oraliq >= 2) {
      const fps = kadrlar / oraliq;
      kadrlar = 0; oraliq = 0;
      if (rejim === 'avto' && fps < 38) {
        const i = TARTIB.indexOf(joriy);
        if (i > 0) sifatniQollash(TARTIB[i - 1]);   // kadr tezligi tushsa, o‘zi pastga tushadi
      }
    }
  }

  sifatniQollash(joriy);

  /* ---------- boshlash tugmasi ---------- */
  let boshlandi = false;
  boshlashTugma.addEventListener('click', function () {
    boshlandi = true;
    Boshqaruv.faol = true;
    boshlashOyna.classList.add('yashirin');
    sifatTugma.style.display = 'block';
    yordam.textContent = mobil ? MATN_TELEFON : MATN_KOMPYUTER;
    yordam.classList.add('korinadi');
    setTimeout(function () { yordam.classList.remove('korinadi'); }, 7000);
  });

  /* ---------- oynani o‘zgartirish ---------- */
  function olchamniYangila() { Sahna.olchamniYangila(); }
  window.addEventListener('resize', olchamniYangila);
  window.addEventListener('orientationchange', function () { setTimeout(olchamniYangila, 250); });
  document.addEventListener('visibilitychange', function () { isish = 2; kadrlar = 0; oraliq = 0; });

  /* ---------- asosiy sikl ---------- */
  let oxirgi = performance.now();
  let t = 0;
  function kadr(hozir) {
    requestAnimationFrame(kadr);
    const xomDt = Math.min(0.5, (hozir - oxirgi) / 1000);
    oxirgi = hozir;
    const dt = Math.min(0.05, xomDt);
    t += dt;

    const kirish = boshlandi ? Boshqaruv.olish() : { x: 0, y: 0, tez: 0 };
    Personaj.yangila(dt, t, kirish, Kamera.yaw);
    Kamera.yangila(dt, boshlandi, Personaj.root.position, Math.max(0, (Personaj.tezlik - 3.8) / 2.4));
    Sahna.yangila(dt, Personaj.root.position);
    Dunyo.yangila(dt, t, Personaj.root.position);

    Sahna.renderer.render(Sahna.scene, Sahna.camera);
    fpsTekshir(xomDt);
  }

  yuklanmoqda.classList.add('yashirin');
  requestAnimationFrame(kadr);
})();
