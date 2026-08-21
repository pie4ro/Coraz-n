const canvas = document.getElementById('universe');
const ctx = canvas.getContext('2d');
let W, H;
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const cx = () => W / 2;
const cy = () => H / 2;

let phase = 'idle';
let bangParticles = [];
let galaxies = [];
let backgroundStars = [];

function createBackgroundStars(count) {
  const arr = [];
  const purpleColors = ['#d8b4fe', '#c084fc', '#e879f9', '#f472b6', '#ffffff'];
  for (let i = 0; i < count; i++) {
    arr.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      color: purpleColors[Math.floor(Math.random() * purpleColors.length)],
      alpha: Math.random() * 0.7 + 0.1,
      twinkleSpeed: Math.random() * 0.04 + 0.01,
      twinklePhase: Math.random() * Math.PI * 2
    });
  }
  return arr;
}
backgroundStars = createBackgroundStars(300);

function drawBackgroundStars(time) {
  for (const s of backgroundStars) {
    const a = s.alpha * (0.5 + 0.5 * Math.sin(time * s.twinkleSpeed + s.twinklePhase));
    ctx.beginPath();
    ctx.fillStyle = s.color;
    ctx.globalAlpha = Math.max(0, a);
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function triggerBigBang() {
  phase = 'bang';
  bangParticles = [];
  const colors = ['#ffffff', '#f3e8ff', '#e879f9', '#c084fc', '#9333ea', '#db2777', '#f472b6'];
  const count = 1000;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 15 + 3;
    bangParticles.push({
      x: cx(),
      y: cy(),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: Math.random() * 2.8 + 0.8,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1
    });
  }

  const flash = document.getElementById('flash');
  flash.style.transition = 'opacity 0.08s ease';
  flash.style.opacity = '1';
  setTimeout(() => {
    flash.style.transition = 'opacity 1.2s ease';
    flash.style.opacity = '0';
  }, 90);

  setTimeout(createGalaxies, 1400);
}

function createGalaxies() {
  phase = 'galaxies';
  galaxies = [];
  const galaxyCount = 6;
  const galaxyColors = [
    ['#ff9ad5', '#c084fc', '#7c3aed'],
    ['#e879f9', '#a78bfa', '#d946ef'],
    ['#f472b6', '#c084fc', '#9333ea'],
    ['#d8b4fe', '#f472b6', '#7c3aed'],
    ['#fbcfe8', '#a855f7', '#db2777']
  ];

  for (let g = 0; g < galaxyCount; g++) {
    const maxRPreview = Math.random() * 90 + 70;
    const minGap = maxRPreview * 2 + 90;

    let gx, gy, tries = 0, ok = false;
    do {
      gx = W * (0.15 + Math.random() * 0.7);
      gy = H * (0.15 + Math.random() * 0.7);
      ok = true;
      for (const other of galaxies) {
        const d = Math.hypot(gx - other.x, gy - other.y);
        if (d < minGap) { ok = false; break; }
      }
      tries++;
    } while (!ok && tries < 60);
    const arms = 3 + Math.floor(Math.random() * 2);
    const starsPerArm = 140;
    const rotation = Math.random() * Math.PI * 2;
    const rotSpeed = (Math.random() * 0.0006 + 0.0002) * (Math.random() < 0.5 ? 1 : -1);
    const maxR = maxRPreview;
    const colorSet = galaxyColors[g % galaxyColors.length];

    const stars = [];
    for (let a = 0; a < arms; a++) {
      const armOffset = (Math.PI * 2 / arms) * a;
      for (let i = 0; i < starsPerArm; i++) {
        const t = i / starsPerArm;
        const dist = t * maxR;
        const spiralAngle = armOffset + t * 6.5;
        const spread = (Math.random() - 0.5) * (0.35 + t * 0.5);
        stars.push({
          angle: spiralAngle + spread,
          dist: dist + (Math.random() - 0.5) * 10,
          size: Math.random() * 1.6 + 0.4,
          color: colorSet[Math.floor(Math.random() * colorSet.length)],
          alpha: Math.random() * 0.5 + 0.5
        });
      }
    }

    galaxies.push({
      x: gx, y: gy, rotation, rotSpeed, stars,
      coreGlowColor: colorSet[1],
      scale: 0,
      targetScale: 1,
      pulsePhase: Math.random() * Math.PI * 2,
      clickRadius: maxR + 40,
      opened: false
    });
  }
}

function drawGalaxies(time) {
  for (const gal of galaxies) {
    if (gal.scale < gal.targetScale) gal.scale += 0.02;
    gal.rotation += gal.rotSpeed * 16;

    ctx.save();
    ctx.translate(gal.x, gal.y);
    ctx.rotate(gal.rotation);
    ctx.scale(gal.scale, gal.scale);

    const pulse = 1 + 0.15 * Math.sin(time * 0.002 + gal.pulsePhase);
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 26 * pulse);
    coreGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
    coreGrad.addColorStop(0.3, gal.coreGlowColor + 'cc');
    coreGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.fillStyle = coreGrad;
    ctx.arc(0, 0, 26 * pulse, 0, Math.PI * 2);
    ctx.fill();

    for (const s of gal.stars) {
      const x = Math.cos(s.angle) * s.dist;
      const y = Math.sin(s.angle) * s.dist * 0.55;
      ctx.beginPath();
      ctx.fillStyle = s.color;
      ctx.globalAlpha = s.alpha;
      ctx.arc(x, y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

function animate(time) {
  ctx.fillStyle = 'rgba(15, 5, 29, 0.35)';
  ctx.fillRect(0, 0, W, H);

  drawBackgroundStars(time);

  if (phase === 'bang') {
    let alive = false;
    for (const p of bangParticles) {
      if (p.life <= 0) continue;
      alive = true;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.life -= 0.006;

      ctx.beginPath();
      ctx.globalAlpha = Math.max(p.life, 0);
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      grad.addColorStop(0, p.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  if (phase === 'galaxies') {
    drawGalaxies(time);
  }

  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

function spawnHearts() {
  const heartsEmojis = ['💖', '💕', '💗', '💓', '💞', '❤️', '💜', '💙'];
  const total = 40;
  for (let i = 0; i < total; i++) {
    setTimeout(() => {
      const h = document.createElement('div');
      h.className = 'heart';
      h.textContent = heartsEmojis[Math.floor(Math.random() * heartsEmojis.length)];
      const startX = Math.random() * window.innerWidth;
      h.style.left = startX + 'px';
      h.style.top = window.innerHeight + 20 + 'px';
      h.style.fontSize = (Math.random() * 20 + 16) + 'px';
      h.style.opacity = '1';
      document.body.appendChild(h);

      const drift = (Math.random() - 0.5) * 200;
      const duration = Math.random() * 3000 + 3500;
      const rise = window.innerHeight + 100;

      h.animate([
        { transform: `translate(0px, 0px) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${drift}px, -${rise}px) rotate(${(Math.random() - 0.5) * 360}deg)`, opacity: 0 }
      ], {
        duration: duration,
        easing: 'ease-out',
        fill: 'forwards'
      });

      setTimeout(() => h.remove(), duration + 100);
    }, i * 80);
  }
}

const btn = document.getElementById('btn');
const title = document.getElementById('title');
const hint = document.getElementById('hint');
const btnVerMas = document.getElementById('btn-ver-mas');
const btnCamera = document.getElementById('btn-camera');
const purpleScreen = document.getElementById('purple-screen');
const btnVolver = document.getElementById('btn-volver');
const cameraModal = document.getElementById('camera-modal');
const videoStream = document.getElementById('camera-stream');
const snapshotCanvas = document.getElementById('snapshot-canvas');
const btnCapture = document.getElementById('btn-capture');
const btnDownload = document.getElementById('btn-download');
const btnRetake = document.getElementById('btn-retake');
const btnCloseCamera = document.getElementById('btn-close-camera');
const bgMusic = document.getElementById('bg-music');
let used = false;
let mediaStream = null;

btn.addEventListener('click', () => {
  if (used) return;
  used = true;

  bgMusic.currentTime = 0;
  bgMusic.volume = 0.1;
  bgMusic.play().catch(error => {
    console.log('No se pudo reproducir la música:', error);
  });

  title.textContent = '¡EL UNIVERSO HA NACIDO!';
  title.classList.add('fade-out');
  btn.classList.add('fade-out');
  setTimeout(() => {
    document.getElementById('ui').style.display = 'none';
  }, 2000);

  triggerBigBang();
  spawnHearts();

  setTimeout(() => {
    btnVerMas.style.opacity = '1';
    btnVerMas.style.pointerEvents = 'all';
    btnCamera.style.opacity = '1';
    btnCamera.style.pointerEvents = 'all';
  }, 3000);

  const hintEl = document.getElementById('hint');

  setTimeout(() => { 
      hintEl.textContent = "Te amo❤️";
      hintEl.style.opacity = '1'; 
  }, 1700);
  setTimeout(() => { hintEl.style.opacity = '0'; }, 4500);
});

btnVerMas.addEventListener('click', () => {
  purpleScreen.classList.add('show');
});

btnVolver.addEventListener('click', () => {
  purpleScreen.classList.remove('show');
});

btnCamera.addEventListener('click', async () => {
  cameraModal.classList.add('show');
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    videoStream.srcObject = mediaStream;
    videoStream.style.display = 'block';
    snapshotCanvas.style.display = 'none';
    btnCapture.style.display = 'inline-block';
    btnDownload.style.display = 'none';
    btnRetake.style.display = 'none';
  } catch (err) {
    alert("No se pudo acceder a la cámara. Revisa los permisos.");
    cameraModal.classList.remove('show');
  }
});

btnCapture.addEventListener('click', () => {
  const ctxCollage = snapshotCanvas.getContext('2d');
  
  snapshotCanvas.width = 1000;
  snapshotCanvas.height = 1000;

  const grad = ctxCollage.createRadialGradient(500, 500, 50, 500, 500, 700);
  grad.addColorStop(0, '#2e1065');
  grad.addColorStop(1, '#090214');
  ctxCollage.fillStyle = grad;
  ctxCollage.fillRect(0, 0, 1000, 1000);

  ctxCollage.fillStyle = '#f3e8ff';
  ctxCollage.font = 'bold 28px "Segoe UI", Arial';
  ctxCollage.textAlign = 'center';
  ctxCollage.fillText('✨ Melanie Martinez & Nuestro Universo ✨', 500, 50);

  const collageImageSources = [
    'fotos/melanie1.jpg', 
    'fotos/melanie2.jpg', 
    'fotos/melanie3.jpg', 
    'fotos/melanie4.jpg'
  ];
  
  let loadedImages = 0;
  const imgObjects = [];

  const positions = [
    { x: 40,  y: 80,  w: 300, h: 300, rot: -0.06 }, 
    { x: 660, y: 80,  w: 300, h: 300, rot: 0.06 },  
    { x: 40,  y: 620, w: 300, h: 300, rot: 0.06 },  
    { x: 660, y: 620, w: 300, h: 300, rot: -0.06 }  
  ];

  collageImageSources.forEach((src, index) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      loadedImages++;
      imgObjects[index] = img;
      if (loadedImages === collageImageSources.length) {
        drawCollageFinal(ctxCollage, imgObjects, positions);
      }
    };
    img.onerror = () => {
      loadedImages++;
      if (loadedImages === collageImageSources.length) {
        drawCollageFinal(ctxCollage, imgObjects, positions);
      }
    };
  });
});

function drawCollageFinal(ctxC, imgObjs, positions) {
  imgObjs.forEach((img, idx) => {
    if (!img) return;
    const pos = positions[idx];
    ctxC.save();
    ctxC.translate(pos.x + pos.w / 2, pos.y + pos.h / 2);
    ctxC.rotate(pos.rot);
    
    ctxC.fillStyle = '#ffffff';
    ctxC.fillRect(-pos.w/2 - 10, -pos.h/2 - 10, pos.w + 20, pos.h + 35);
    ctxC.shadowColor = 'rgba(0,0,0,0.6)';
    ctxC.shadowBlur = 20;

    ctxC.drawImage(img, -pos.w/2, -pos.h/2, pos.w, pos.h);
    ctxC.restore();
  });

  ctxC.save();
  ctxC.translate(500, 500);
  
  ctxC.fillStyle = '#ffffff';
  ctxC.fillRect(-170, -150, 340, 300);
  ctxC.shadowColor = 'rgba(219,39,119,0.9)';
  ctxC.shadowBlur = 30;

  ctxC.drawImage(videoStream, -155, -135, 310, 220);

  ctxC.fillStyle = '#444444';
  ctxC.font = '16px "Segoe UI", Arial';
  ctxC.textAlign = 'center';
  ctxC.fillText('❤️ Lizeth Alessandra & Universo ❤️', 0, 130);
  ctxC.restore();

  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
  }

  videoStream.style.display = 'none';
  snapshotCanvas.style.display = 'block';

  const dataURL = snapshotCanvas.toDataURL('image/jpeg');
  btnDownload.href = dataURL;

  btnCapture.style.display = 'none';
  btnDownload.style.display = 'inline-block';
  btnRetake.style.display = 'inline-block';
}

btnRetake.addEventListener('click', async () => {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    videoStream.srcObject = mediaStream;
    videoStream.style.display = 'block';
    snapshotCanvas.style.display = 'none';
    btnCapture.style.display = 'inline-block';
    btnDownload.style.display = 'none';
    btnRetake.style.display = 'none';
  } catch (err) {
    alert("No se pudo reiniciar la cámara.");
  }
});

btnCloseCamera.addEventListener('click', () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
  }
  cameraModal.classList.remove('show');
});

const memoryPhotos = [
  { src: 'fotos/foto1.jpeg', caption: 'Ramen con mi amoshito🍜❤️' },
  { src: 'fotos/foto2.jpeg', caption: 'Vista hermosa del universo desde la tierra🌌🐈‍⬛' },
  { src: 'fotos/foto3.jpeg', caption: 'Estrellas fugaces en el cielo🌠🦴🐶' },
  { src: 'fotos/foto4.jpeg', caption: 'Atardecer en el horizonte🌅' },
  { src: 'fotos/foto5.jpeg', caption: 'Perfecta combinación🐈‍⬛🐼'},
  { src: 'fotos/foto6.jpeg', caption: 'Comida con amor🍽️❤️' }, 
  { src: 'fotos/foto7.jpeg', caption: 'Llegada de una nueva alegría🐕❤️' },
  { src: 'fotos/foto8.jpeg', caption: 'Un solo corazón🐈‍⬛❤️' }
];
let photoIndex = 0;
let openCard = null;

function openPhotoCard(x, y) {
  if (openCard) {
    openCard.remove();
    openCard = null;
  }
  const photo = memoryPhotos[photoIndex % memoryPhotos.length];
  photoIndex++;

  const card = document.createElement('div');
  card.className = 'photo-card';
  const rot = (Math.random() - 0.5) * 12;

  const cardW = Math.min(220, window.innerWidth * 0.6);
  const cardH = Math.min(260, window.innerHeight * 0.42) + 60; 
  const margin = 30; 

  const clampedX = Math.min(
    Math.max(x, cardW / 2 + margin),
    window.innerWidth - cardW / 2 - margin
  );
  const clampedY = Math.min(
    Math.max(y, cardH / 2 + margin),
    window.innerHeight - cardH / 2 - margin
  );

  card.style.left = clampedX + 'px';
  card.style.top = clampedY + 'px';
  card.style.setProperty('--rot', rot + 'deg');

  card.innerHTML = `
    <button class="photo-close">✕</button>
    <img src="${photo.src}" alt="recuerdo">
    <div class="caption">${photo.caption}</div>
  `;
  document.body.appendChild(card);
  openCard = card;

  requestAnimationFrame(() => {
    card.classList.add('show');
    card.style.transform = `translate(-50%, -50%) scale(1) rotate(${rot}deg)`;
  });

  card.querySelector('.photo-close').addEventListener('click', (e) => {
    e.stopPropagation();
    card.style.transform = `translate(-50%, -50%) scale(0) rotate(${rot}deg)`;
    card.classList.remove('show');
    setTimeout(() => card.remove(), 500);
    if (openCard === card) openCard = null;
  });
}

canvas.addEventListener('click', (e) => {
  if (phase !== 'galaxies') return;
  const mx = e.clientX;
  const my = e.clientY;
  for (const gal of galaxies) {
    const d = Math.hypot(mx - gal.x, my - gal.y);
    if (d < gal.clickRadius) {
      openPhotoCard(gal.x, gal.y);
      break;
    }
  }
});