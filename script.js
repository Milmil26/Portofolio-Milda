/* =====================================================================
     [1]  Tema (gelap / terang)
     [2]  Menu HP
     [3]  Bahasa (ID / EN)   → semua teks Inggris ada di sini
     [4]  Beranda            → spotlight foto
     [5]  Tentang            → animasi foto About
     [6]  Proyek             → data proyek + carousel 3D
     [7]  Pengalaman         → data pengalaman + tumpukan foto
     [8]  Konten             → data video (SEDANG DIMATIKAN)
     [9]  Animasi scroll
     [10] Mulai

   Ganti isi web:
     - Teks statis → index.html (ID) + [3] (EN)
     - Proyek      → [6] "projects"
     - Pengalaman  → [7] "experiences"
     - Video       → [8] "contents"
   ===================================================================== */

const root = document.documentElement;
const IO = 'IntersectionObserver' in window;
const REDUCED = matchMedia('(prefers-reduced-motion:reduce)').matches;


/* =====================================================================
   [1] TEMA (gelap / terang) — pilihan disimpan di localStorage
   ===================================================================== */
try {
  const saved = localStorage.getItem('theme');
  if (saved) root.dataset.theme = saved;
} catch (e) {}

document.getElementById('theme').addEventListener('click', () => {
  // Belum pernah memilih → ikuti pengaturan perangkat
  const isDark = root.dataset.theme
    ? root.dataset.theme === 'dark'
    : !matchMedia('(prefers-color-scheme:light)').matches;
  const next = isDark ? 'light' : 'dark';

  root.classList.add('tx');   // transisi warna halus
  clearTimeout(root._tx);
  root._tx = setTimeout(() => root.classList.remove('tx'), 600);

  root.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch (e) {}
});


/* =====================================================================
   [2] MENU HP
   ===================================================================== */
const menu = document.getElementById('menu');
const drop = document.getElementById('drop');

menu.addEventListener('click', () => {
  const open = drop.classList.toggle('open');
  menu.setAttribute('aria-expanded', open);
});

// Klik salah satu link → menu menutup
drop.addEventListener('click', e => {
  if (e.target.tagName === 'A') {
    drop.classList.remove('open');
    menu.setAttribute('aria-expanded', false);
  }
});


/* =====================================================================
   [3] BAHASA (ID / EN)
   Elemen HTML ber-atribut data-i="kode" diganti dengan T_EN[kode]
   saat bahasa Inggris dipilih. Teks Indonesia = isi asli index.html.
   Teks proyek / pengalaman / konten punya terjemahan sendiri di [6], [7], [8].
   ===================================================================== */
const T_EN = {
  /* Navbar */
  nb: "Home",
  nt: "About",
  np: "Projects",
  ne: "Experience",
  nd: "Content",
  nk: "Contact",

  /* Beranda */
  hi: "HELLO, I'M",
  rl: "An",
  bio: "I combine experience in education, instructional design, and technology to create interactive and meaningful digital learning experiences.",
  b1: "View Projects",
  b2: "Contact Me",

  /* Tentang */
  al: "ABOUT ME",
  at: "Get to Know Me",
  ab: "As a Primary School Education graduate, I have moved beyond just teaching. I am also deeply interested in how learning experiences are designed and brought to life through technology. Drawing on my teaching experience and self-taught skills in web development, I have created several educational websites as personal projects. Currently, I am focusing on developing my expertise in instructional design and EdTech, with a particular interest in digital learning and technologies that enhance interactivity in the learning process.",
  ak: "Download CV",

  /* Proyek */
  wl: "PERSONAL PROJECTS",
  wt: "What I Make",
  ws: "What started as curiosity grew into something I built. Each project is a space for me to explore ideas, hone my skills, and turn what I've learned into something tangible and meaningful.",
  vp: "View Project",

  /* Pengalaman */
  el: "GROWTH & EXPERIENCE",
  et: "Experience & Training",
  es: "Every experience leaves behind a story: a collection of processes, challenges, and moments that shape the way I learn, create, and continue to grow.",

  /* Konten */
  kl: "CONTENT & VIDEOS",
  kt: "Learning Videos & Content",
  ks: "Besides designing and building, I also enjoy making learning videos and educational content. Here are a few glimpses of my teaching activities and content work.",

  /* Kontak */
  cl: "GET IN TOUCH",
  ch: "LET'S WORK TOGETHER",
  csub: "Looking for the next opportunity worth pursuing.",
  cbio: "Open to internships, scholarships, and freelance projects in EdTech.",
  cbtn: "Send a Message \u2192",
  cemail: "EMAIL"
};

// Simpan teks Indonesia asli dari HTML supaya bisa dikembalikan
const T_ID = {};
document.querySelectorAll('[data-i]').forEach(el => {
  T_ID[el.dataset.i] = T_ID[el.dataset.i] || el.textContent;
});

// Bahasa aktif ('id' / 'en'), diingat dari kunjungan sebelumnya
let lg = 'id';
try { lg = localStorage.getItem('lang') || 'id'; } catch (e) {}

// Ganti semua teks + render ulang bagian yang dibuat dari data
function setLang(l) {
  lg = l;
  root.lang = l;
  document.getElementById('langlbl').textContent = l.toUpperCase();

  document.querySelectorAll('[data-i]').forEach(el => {
    const k = el.dataset.i;
    el.textContent = l === 'en' ? (T_EN[k] || T_ID[k]) : T_ID[k];
  });

  renderCarousel();   // [6]
  renderExp();        // [7]
// renderContent();   // [8]
}

// Klik tombol bahasa: isi halaman memudar → teks diganti → muncul lagi
const mainEl = document.querySelector('main');
let langBusy = false;

document.getElementById('lang').addEventListener('click', () => {
  if (langBusy) return;
  langBusy = true;
  mainEl.classList.add('swap');

  setTimeout(() => {
    setLang(lg === 'id' ? 'en' : 'id');
    try { localStorage.setItem('lang', lg); } catch (e) {}
    mainEl.classList.remove('swap');
    langBusy = false;
  }, REDUCED ? 0 : 200);
});


/* =====================================================================
   [4] BERANDA — spotlight di foto (hanya laptop / mouse)
   Angka .16 = kehalusan gerak (makin kecil makin "ngantuk").
   Tampilan: style.css [5] (.card::before / ::after)
   ===================================================================== */
(function () {
  const card = document.querySelector('.hero .card');
  if (!card || !matchMedia('(hover:hover)').matches) return;

  let tx = 0, ty = 0;   // posisi kursor (target)
  let cx = 0, cy = 0;   // posisi glow (mengejar target)
  let raf = null;

  const posisi = e => {
    const r = card.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  const gambar = () => {
    card.style.setProperty('--mx', cx + 'px');
    card.style.setProperty('--my', cy + 'px');
  };

  function tick() {
    cx += (tx - cx) * .16;
    cy += (ty - cy) * .16;
    gambar();
    const masihGerak = Math.abs(tx - cx) > .3 || Math.abs(ty - cy) > .3;
    raf = masihGerak ? requestAnimationFrame(tick) : null;
  }

  card.addEventListener('pointerenter', e => {
    const p = posisi(e);
    tx = cx = p[0];
    ty = cy = p[1];
    gambar();
    card.classList.add('lit');
  });

  card.addEventListener('pointermove', e => {
    const p = posisi(e);
    tx = p[0];
    ty = p[1];
    if (!raf) raf = requestAnimationFrame(tick);
  });

  card.addEventListener('pointerleave', () => card.classList.remove('lit'));
})();


/* =====================================================================
   [5] TENTANG — animasi foto About
   Gambar di-decode dulu, animasi baru jalan setelah gambar siap
   dan foto terlihat (supaya tidak ngelag). Gaya: style.css [6]
   ===================================================================== */
const aboutImg = document.querySelector('.polaroid img');
const aboutDecoded = (aboutImg && aboutImg.decode)
  ? aboutImg.decode().catch(() => {})
  : Promise.resolve();

function initAbout() {
  const foto = document.querySelector('.polaroid');
  if (!foto) return;
  if (!IO || REDUCED) { foto.classList.add('in'); return; }

  // Mulai animasi saat foto terlihat (25%) dan gambar sudah siap
  const io = new IntersectionObserver((entries, obs) => {
    if (!entries.some(en => en.isIntersecting)) return;
    obs.disconnect();
    aboutDecoded.then(() => requestAnimationFrame(() => foto.classList.add('in')));
  }, { threshold: .25 });
  io.observe(foto);

  // Jeda gerakan melayang saat foto di luar layar (hemat baterai)
  new IntersectionObserver(entries => {
    foto.classList.toggle('off', !entries[0].isIntersecting);
  }).observe(foto);
}


/* =====================================================================
   [6] PROYEK — carousel 3D
   ===================================================================== */

/* ---------- DATA PROYEK ----------
   Tambah proyek: salin satu blok { ... }, ubah isinya, tambah koma.
     title / desc : teks Indonesia (id) dan Inggris (en)
     c1, c2       : warna cadangan kartu (kalau gambar gagal dimuat)
     link         : alamat proyek ("#" kalau belum ada)
     img          : gambar kartu (folder img/) */
const projects = [
  {
    id: 1,
    title: { id: "Proyek KoDi Game", en: "Project KoDi Game" },
    desc: {
      id: "Aplikasi web yang dibuat untuk melatih berpikir komputasional siswa Sekolah Dasar dengan bermain game. Siswa menyusun blok perintah dengan cara drag-and-drop untuk menyelesaikan tantangan di setiap level. Tampilannya ramah anak dan berbahasa Indonesia, sehingga belajar logika dan algoritma terasa seperti bermain.",
      en: "A web application built to train computational thinking in elementary school students through games. Students drag and drop command blocks to solve challenges level by level, much like the learning experience on Code.org. The interface is child-friendly and fully in Indonesian, so learning logic and algorithms feels like play rather than a chore."
    },
    c1: "#1f6fb3", c2: "#12406b",
    link: "https://milmil26.github.io/Kodi-Game/",
    img: "img/project1.png"
  },
  {
    id: 2,
    title: { id: "Proyek Kuis", en: "Project Quiz & Feedback" },
    desc: {
      id: "Modul e-learning interaktif yang menggabungkan materi singkat dengan kuis dan umpan balik. Setelah menjawab, siswa langsung mendapat respons atas jawabannya, sehingga mereka bisa belajar dari kesalahan dan mengulang materi yang belum dipahami.",
      en: "An interactive e-learning module that combines short lessons with quizzes and feedback. After answering, students get an immediate response, so they can learn from their mistakes and revisit the material they have not yet understood."
    },
    c1: "#1b9e6f", c2: "#0c5a3e",
    link: "https://milmil26.github.io/Kuriosa-Quiz/",
    img: "img/project2.png"
  },
  {
    id: 3,
    title: { id: "Proyek Pomodoro", en: "Project My Pomodoro" },
    desc: {
      id: "Aplikasi sederhana yang membantu pengguna mengatur lama waktu saat belajar dan istirahat dengan teknik Pomodoro. Waktu belajar dibagi menjadi sesi-sesi fokus yang diselingi jeda singkat, sehingga konsentrasi lebih terjaga dan belajar tidak terasa melelahkan.",
      en: "A simple application that helps users manage their study and break times using the Pomodoro technique. Study time is split into focused sessions with short breaks in between, which keeps concentration up and makes studying feel less tiring."
    },
    c1: "#a3462a", c2: "#5c2415",
    link: "#",
    img: "img/project3.png"
  },
  {
    id: 4,
    title: { id: "Proyek KarsaGuru", en: "Project KarsaGuru" },
    desc: {
      id: "Guru sering menghabiskan berjam-jam menyiapkan rencana mengajar, lembar kerja, dan bahan belajar. KarsaGuru mengumpulkan semuanya di satu tempat, jadi persiapan terasa lebih ringan dan rapi. Guru bisa menyusun rencana pembelajaran, membuat lembar kerja siswa, menyimpan bahan ajar, dan berbagi dengan rekan guru di berbagai daerah. Semua dalam satu aplikasi yang bisa dibuka dari gadget maupun laptop.",
      en: "Teachers often spend hours preparing lesson plans, worksheets, and study materials. KarsaGuru brings everything together in one place, making preparation feel more manageable and organized. Teachers can develop lesson plans, create student worksheets, store teaching materials, and share them with fellow educators across different regions—all within a single application accessible from both mobile phones and laptops."
    },
    c1: "#a3462a", c2: "#5c2415",
    link: "https://milmil26.github.io/KarsaGuru/",
    img: "img/project4.png"
  }
];

/* ---------- Pengaturan gerak ---------- */
const CAR_DURASI = 1400;   // lama putaran (ms), makin besar makin pelan
const CAR_JARI   = 300;    // lebar lingkaran kartu (px), makin besar makin renggang
const CAR_TURUN  = 36;     // seberapa turun kartu di belakang (px)
const CAR_MIRING = 20;     // kemiringan kartu di sisi (derajat)

/* ---------- Kode carousel ---------- */
const track = document.getElementById('track');
const carousel = document.getElementById('carousel');
const N = projects.length;
const STEP = 360 / N;     // sudut antar kartu
let pos = 0;              // berapa kali sudah digeser
let cur = 0;              // index proyek di depan
let ang = 0, target = 0;  // sudut sekarang & tujuan
let raf = null;

// Buat kartu
const cards = projects.map(p => {
  const c = document.createElement('div');
  c.className = 'car-card';
  c.style.setProperty('--cc1', p.c1);
  c.style.setProperty('--cc2', p.c2);
  c.innerHTML = `
    <div class="sw">
      <img src="${p.img}" alt="${p.title.en}" draggable="false" decoding="async">
    </div>`;
  track.appendChild(c);
  return c;
});

// Posisikan kartu di lingkaran 3D
function layout() {
  const RX = Math.min(CAR_JARI, track.clientWidth * 0.34);

  cards.forEach((c, i) => {
    const t = (i * STEP - ang) * Math.PI / 180;
    const k = (Math.cos(t) + 1) / 2;   // 1 = paling depan, 0 = paling belakang
    const x = Math.sin(t) * RX;
    const y = -(1 - k) * CAR_TURUN;
    const s = 0.72 + 0.28 * k;         // ukuran: belakang 72%, depan 100%
    const ry = Math.sin(t) * CAR_MIRING;

    c.style.transform =
      `translate(-50%,-50%) translate(${x}px,${y}px) scale(${s}) ` +
      `perspective(900px) rotateY(${ry}deg)`;
    c.style.opacity = 0.5 + 0.5 * k;
    c.style.zIndex = Math.round(k * 100);
  });
}

// Judul + deskripsi + link di bawah carousel
function updateInfo() {
  const p = projects[cur];
  document.getElementById('carTitle').textContent = p.title[lg];
  document.getElementById('carDesc').textContent = p.desc[lg];
  document.getElementById('carLink').href = p.link;
}

function renderCarousel() {
  updateInfo();
  layout();
}

// Ganti proyek: info memudar dulu, lalu berganti
const carInfo = document.querySelector('.car-info');
let infoTimer = null;

function swapInfo() {
  clearTimeout(infoTimer);
  carInfo.classList.add('out');
  infoTimer = setTimeout(() => {
    updateInfo();
    carInfo.classList.remove('out');
  }, REDUCED ? 0 : 220);
}

// Animasi putar (easeInOutCubic)
function animate() {
  cancelAnimationFrame(raf);
  const start = ang;
  const delta = target - start;
  const t0 = performance.now();

  function frame(t) {
    const k = Math.min((t - t0) / CAR_DURASI, 1);
    const e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    ang = start + delta * e;
    layout();
    if (k < 1) raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
}

// Pindah ke proyek berikutnya (+1) atau sebelumnya (-1)
function go(d) {
  pos += d;
  cur = ((pos % N) + N) % N;
  target = pos * STEP;
  swapInfo();
  animate();
}

window.addEventListener('resize', layout);

// Geser: klik sisi kiri/kanan, atau drag / swipe
let dragging = false, startX = 0, moved = false;

function pointerDown(x) {
  dragging = true;
  moved = false;
  startX = x;
}

function pointerMove(x) {
  if (dragging && Math.abs(x - startX) > 6) moved = true;
}

function pointerUp(x) {
  if (!dragging) return;
  dragging = false;
  const dx = x - startX;

  // Drag / swipe
  if (Math.abs(dx) > 40) {
    go(dx < 0 ? 1 : -1);
    return;
  }

  // Klik biasa
  if (!moved) {
    const rect = carousel.getBoundingClientRect();
    const rel = x - rect.left;
    if (rel < rect.width * 0.5 - 40) go(-1);
    else if (rel > rect.width * 0.5 + 40) go(1);
  }
}

carousel.addEventListener('mousedown', e => pointerDown(e.clientX));
window.addEventListener('mousemove', e => pointerMove(e.clientX));
window.addEventListener('mouseup', e => pointerUp(e.clientX));
carousel.addEventListener('touchstart', e => pointerDown(e.touches[0].clientX), { passive: true });
carousel.addEventListener('touchmove', e => pointerMove(e.touches[0].clientX), { passive: true });
carousel.addEventListener('touchend', e => pointerUp(e.changedTouches[0].clientX));


/* =====================================================================
   [7] PENGALAMAN — daftar pengalaman + tumpukan 3 foto
   ===================================================================== */

/* ---------- DATA PENGALAMAN ----------
   Tambah pengalaman: salin satu blok { ... }, ubah isinya, tambah koma.
     date / title / org / desc / cert : teks Indonesia (id) dan Inggris (en)
     f1, f2, f3        : 3 foto (folder img/), f1 tampil pertama
     i1, i2, i1b, i2b  : warna gradasi sementara sebelum foto selesai dimuat
   Urutan blok = urutan di web (zig-zag kiri-kanan otomatis). */
const experiences = [
  {
    date: { id: "Juli 2024 - Sekarang", en: "July 2024 - Present" },
    title: {
      id: "Madrasah Diniyah Al-Ikhlas",
      en: "Madrasah Diniyah Al-Ikhlas (Islamic After-School Educator)"
    },
    org: { id: "Guru Madrasah Diniyah", en: "Madrasah Diniyah Teacher" },
    desc: {
      id: "Mengampu mata pelajaran Hadits untuk 4 rombel di Madrasah sejak Juli 2024. Merancang kegiatan belajar yang menyesuaikan karakter siswa, menyusun asesmen untuk memantau pemahaman, serta membuat materi dan media visual sendiri. Selain mengajar, saya juga mengelola administrasi digital sekolah.",
      en: "I have taught Hadith to 4 classes at a madrasah since July 2024. I design learning activities tailored to the students' characteristics, develop assessments to monitor their understanding, and create my own teaching materials and visual aids. Alongside teaching, I also manage the school's digital administration."
    },
    cert: { id: "LIHAT LEBIH LANJUT", en: "SEE MORE" },
    i1: "#d46b8a", i2: "#5c2a3d", i1b: "#2c3e63", i2b: "#131a2e",
    f1: "img/madrasah1.jpeg", f2: "img/madrasah2.jpeg", f3: "img/madrasah1.jpeg"
  },
  {
    date: { id: "Juni - Juli 2026", en: "June - July 2026" },
    title: { id: "Penelitian Skripsi", en: "Thesis Research" },
    org: {
      id: "Penelitian Tindakan Kelas",
      en: "Undergraduate Researcher, Classroom Action Research"
    },
    desc: {
      id: "Melaksanakan Penelitian Tindakan Kelas (PTK) menggunakan Code.org untuk meningkatkan kemampuan berpikir komputasional siswa kelas V. Merancang pembelajaran, memfasilitasi aktifitas pemprograman berbasis blok, dan menganalisis hasil belajar siswa antar siklus",
      en: "Conducted Classroom Action Research (CAR) using Code.org to improve the computational thinking skills of fifth-grade students. Designed lessons, facilitated block-based programming activities, and analyzed student learning outcomes across cycles."
    },
    cert: { id: "LIHAT LEBIH LANJUT", en: "SEE MORE" },
    i1: "#d46b8a", i2: "#5c2a3d", i1b: "#2c3e63", i2b: "#131a2e",
    f1: "img/skripsi1.png", f2: "img/skripsi2.jpeg", f3: "img/skripsi3.jpeg"
  },
  {
    date: { id: "Maret 2024 & September 2024", en: "March 2024 & September 2024" },
    title: { id: "HARLAH & OSMA", en: "HARLAH & OSMA" },
    org: {
      id: "Koordinator Publikasi, Dekorasi dan Dokumentasi",
      en: "Publication, Decoration, and Documentation Coordinator"
    },
    desc: {
      id: "Bertugas sebagai Koordinator PDD dengan mengatur konsep dan desain panggung serta mengoordinasikan pembagian tugas tim PDD. Bertanggung jawab dalam pembuatan banner untuk acara Harlah yang dihadiri ±200 peserta dan Bupati setempat, name tag untuk ±100 peserta, serta sertifikat kegiatan Orientasi Mahasiswa Baru Prodi PGMI untuk ±120 peserta.",
      en: "Served as the PDD Coordinator, responsible for developing the stage design concept and coordinating the PDD team’s tasks. Created event banners for the Study Program Anniversary attended by approximately 200 participants and the local Regent, produced name tags for approximately 100 participants, and designed certificates for the PGMI New Student Orientation program attended by approximately 120 participants."
    },
    cert: { id: "LIHAT LEBIH LANJUT", en: "SEE MORE" },
    i1: "#3a6e9e", i2: "#152538", i1b: "#caa23a", i2b: "#5c4711",
    f1: "img/experient-3.jpeg", f2: "img/experient-1.jpeg", f3: "img/experient-7.png"
  },
  {
    date: { id: "Ramadhan 2024-2025", en: "Ramadan 2024-2025" },
    title: { id: "Pesantren Camp & Pesantren Lansia", en: "Ramadan Programs" },
    org: { id: "Sekretaris & Asisten guru", en: "Secretary & Teaching Assistant" },
    desc: {
      id: "Sebagai Sekretaris Umum pada kegiatan Pesantren Camp 2024–2025 dan Memegang Wali Kelas/Asisten guru di pesantren Camp. Saya juga bertanggung jawab mengelola pendataan peserta Pesantren Camp tingkat SMP sebanyak ±300 peserta melalui sistem online dan offline, termasuk berkoordinasi dengan pihak sekolah dalam pelaksanaan kerja sama/MoU. Pada 2025, saya juga mengelola pendataan Pesantren Lansia serta membuat sertifikat untuk Pesantren Ramadhan dan Pesantren Lansia dengan total ±550 peserta.",
      en: "Served as General Secretary of the 2024–2025 Pesantren Camp and as a class mentor/teaching assistant for the Junior High School Ramadan Program. I managed participant data for approximately 300 junior high school participants through both online and offline systems, and coordinated with schools on partnerships and MoUs. In 2025, I also managed participant data for the Senior Citizens’ Ramadan Program and prepared certificates for both programs, covering approximately 550 participants in total."
    },
    cert: { id: "LIHAT LEBIH LANJUT", en: "SEE MORE", href:"https://www.detik.com/jabar/berita/d-7244660/menengok-pesantren-remaja-ramadan-di-masjid-agung-ciamis"},
    i1: "#4a7d4f", i2: "#1c3320", i1b: "#8a3ed1", i2b: "#2c1550",
    f1: "img/irma-1.jpeg", f2: "img/irma-2.jpeg", f3: "img/irma-3.jpeg"
  }
];

/* ---------- Kode render ---------- */
const expList = document.getElementById('expList');

// Foto dimuat saat bagian itu mendekati layar (anti-lag saat refresh)
const expImgDone = new Set();   // index yang fotonya sudah dimuat
const expSeen = new Set();      // index yang animasi masuknya sudah jalan
let revealReady = false;        // diaktifkan oleh initReveal() di [9]

function fillExpImgs(item, x, idx) {
  const src = [x.f1, x.f2, x.f3];
  item.querySelectorAll('.img').forEach((im, i) => {
    im.style.background = `url('${src[i]}') center/cover`;
  });
  expImgDone.add(idx);
}

const expImgObs = IO
  ? new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        obs.unobserve(el);
        fillExpImgs(el, experiences[+el.dataset.idx], +el.dataset.idx);
      });
    }, { rootMargin: '1200px 0px' })
  : null;

// Animasi masuk tiap item saat di-scroll
const expObs = IO
  ? new IntersectionObserver(entries => {
      entries.filter(en => en.isIntersecting).forEach(en => {
        const el = en.target;
        expObs.unobserve(el);
        expSeen.add(+el.dataset.idx);
        el.classList.add('in');
        setTimeout(() => el.classList.remove('rv-exp', 'in'), 1800);
      });
    }, { threshold: .15, rootMargin: '0px 0px -6% 0px' })
  : null;

function renderExp() {
  expList.innerHTML = '';

  experiences.forEach((x, idx) => {
    const item = document.createElement('div');
    item.className = 'exp-item';
    item.dataset.idx = idx;   // bukan data-i (itu untuk terjemahan)
    item.innerHTML = `
      <div class="exp-text">
        <div class="exp-date">${x.date[lg]}</div>
        <h3>${x.title[lg]}</h3>
        <div class="exp-org">${x.org[lg]}</div>
        <p>${x.desc[lg]}</p>
        <a class="exp-cert" href="${x.cert.href || '#'}" ${x.cert.href ? 'target="_blank" rel="noopener"' : ''}>${x.cert[lg]} &#8599;</a>
      </div>
      <div class="exp-photo">
        <div class="img" data-p="0" style="--i1:${x.i1};--i2:${x.i2}">${x.title[lg]}</div>
        <div class="img" data-p="1" style="--i1:${x.i1b};--i2:${x.i2b}"></div>
        <div class="img" data-p="2" style="--i1:${x.i1};--i2:${x.i2}"></div>
      </div>`;

    // Klik foto → foto berikutnya maju ke depan (posisi: style.css [8])
    const photo = item.querySelector('.exp-photo');
    let aktif = 0;
    photo.addEventListener('click', () => {
      aktif = (aktif + 1) % 3;
      photo.querySelectorAll('.img').forEach((im, i) => {
        im.dataset.p = (i - aktif + 3) % 3;
      });
    });

    expList.appendChild(item);

    // Muat foto: langsung kalau sudah pernah / browser lama, kalau tidak tunggu dekat layar
    if (!expImgObs || expImgDone.has(idx)) fillExpImgs(item, x, idx);
    else expImgObs.observe(item);

    // Animasi masuk hanya untuk item yang belum pernah tampil (ganti bahasa tidak mengulang)
    if (expObs && !REDUCED && !expSeen.has(idx)) {
      item.classList.add('rv-exp');
      if (revealReady) expObs.observe(item);
    }
  });
}


// /* =====================================================================
//    [8] KONTEN — video pembelajaran  (SEDANG DIMATIKAN)
//    Aktifkan: blok Ctrl+/ semua baris di bagian [8] ini, lalu
//    buka juga komentar renderContent() di [3] dan section Konten di index.html.
//    ===================================================================== */

// /* ---------- DATA KONTEN ----------
//    Tambah video: salin satu blok { ... }, ubah isinya, tambah koma.
//      t, k  : judul & kategori kecil (id / en)
//      r     : bentuk kartu → "l" landscape, "p" portrait
//      c1,c2 : warna cadangan kartu
//      img   : gambar sampul (folder konten/)
//      pv    : (opsional) video pendek autoplay tanpa suara, 5-10 detik, < 2 MB
//      link  : alamat video asli (YouTube / TikTok / Instagram / mp4), "#" kalau belum ada
//    Tanpa "pv": link YouTube diputar saat kursor di atas kartu. */
// const contents = [
//   {
//     t: { id: "Belajar Coding Seru dengan Code.org", en: "Fun Coding with Code.org" },
//     k: { id: "Video Pembelajaran", en: "Teaching Video" },
//     r: "l",
//     c1: "#1f6fb3", c2: "#12406b",
//     img: "konten/gbrvideo1.png",
//     pv: "konten/video1.mp4",
//     link: "https://youtu.be/Dk1xhfFdF5s?si=keSfFaOPO42e1i7r"
//   },
//   {
//     t: { id: "Media Ajar Interaktif", en: "Interactive Learning Media" },
//     k: { id: "Media Pembelajaran", en: "Learning Media" },
//     r: "l",
//     c1: "#1b9e6f", c2: "#0c5a3e",
//     img: "konten/gbrvideo2.jpeg",
//     pv: "konten/video2.mp4",
//     link: "https://youtu.be/Dk1xhfFdF5s?si=keSfFaOPO42e1i7r"
//   },
//   {
//     t: { id: "Tips Mengajar Singkat", en: "Quick Teaching Tips" },
//     k: { id: "Konten Edukasi", en: "Educational Content" },
//     r: "p",
//     c1: "#a3462a", c2: "#5c2415",
//     img: "konten/gambarpotret.jpeg",
//     link: "konten/video5.mp4"
//   },
//   {
//     t: { id: "Suasana Kelas Hari Ini", en: "Classroom Moments" },
//     k: { id: "Dokumentasi", en: "Documentation" },
//     r: "l",
//     c1: "#7a4fb3", c2: "#3a2160",
//     img: "konten/gbrvideo3.jpg",
//     pv: "konten/video3.mp4",
//     link: "#"
//   },
//   {
//     t: { id: "Belajar Sambil Bermain", en: "Learning Through Play" },
//     k: { id: "Video Pembelajaran", en: "Teaching Video" },
//     r: "l",
//     c1: "#d46b8a", c2: "#5c2a3d",
//     img: "konten/gbrvideo4.png",
//     pv: "konten/video4.mp4",
//     link: "#"
//   }
// ];

// /* ---------- Deteksi jenis link ---------- */
// function platformOf(u) {
//   if (!u || u === '#') return null;
//   let m;
//   if ((m = u.match(/youtube\.com\/shorts\/([\w-]{6,})/))) {
//     return { p: 'YouTube', yt: m[1], short: true };
//   }
//   if ((m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|live\/))([\w-]{6,})/))) {
//     return { p: 'YouTube', yt: m[1] };
//   }
//   if (/tiktok\.com/i.test(u)) return { p: 'TikTok' };
//   if (/instagram\.com/i.test(u)) return { p: 'Instagram' };
//   if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(u)) return { p: 'Video', file: u };
//   return null;
// }

// /* ---------- Preview video mp4 (autoplay, tanpa suara) ----------
//    Dimatikan kalau pengguna pilih "kurangi gerakan" atau mode hemat data. */
// const noAuto = REDUCED || !!(navigator.connection && navigator.connection.saveData);

// function playQuiet(el) {
//   const p = el.play();
//   if (p && p.catch) p.catch(() => {});
// }

// function mountVideo(a) {
//   if (a._vid) { playQuiet(a._vid); return; }

//   const el = document.createElement('video');
//   el.className = 'con-pv';
//   el.muted = true;
//   el.loop = true;
//   el.playsInline = true;
//   el.preload = 'metadata';
//   el.setAttribute('muted', '');
//   el.setAttribute('playsinline', '');
//   el.addEventListener('playing', () => {
//     el.classList.add('on');
//     a.classList.add('pv-on');
//   }, { once: true });

//   el.src = a._src;
//   a.insertBefore(el, a.querySelector('.con-play'));
//   a._vid = el;
//   playQuiet(el);
// }

// // Putar saat kartu terlihat, jeda saat keluar layar
// const vidObs = IO
//   ? new IntersectionObserver(entries => {
//       entries.forEach(en => {
//         const a = en.target;
//         if (en.isIntersecting) mountVideo(a);
//         else if (a._vid) a._vid.pause();
//       });
//     }, { threshold: .25 })
//   : null;

// /* ---------- Preview YouTube saat kursor di atas kartu ---------- */
// function startPreview(a, v) {
//   if (a.querySelector('.con-pv')) return;

//   // Ukuran "cover" supaya tidak ada pita hitam
//   const w = a.clientWidth, h = a.clientHeight;
//   const Wb = v.short ? Math.max(w * 256 / 81, h * 16 / 9) : Math.max(w, h * 16 / 9);

//   const el = document.createElement('iframe');
//   el.className = 'con-pv';
//   el.tabIndex = -1;
//   el.style.cssText =
//     'inset:auto;top:50%;left:50%;width:' + Wb + 'px;height:' + (Wb * 9 / 16) + 'px;' +
//     'transform:translate(-50%,-50%)';
//   el.allow = 'autoplay; encrypted-media';
//   el.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
//   el.addEventListener('load', () => setTimeout(() => {
//     el.classList.add('on');
//     a.classList.add('pv-on');
//   }, 900));
//   el.src =
//     'https://www.youtube.com/embed/' + v.yt +
//     '?autoplay=1&mute=1&controls=0&loop=1&playlist=' + v.yt +
//     '&playsinline=1&rel=0&modestbranding=1&disablekb=1&iv_load_policy=3&fs=0';

//   a.insertBefore(el, a.querySelector('.con-play'));
// }

// function stopPreview(a) {
//   const el = a.querySelector('iframe.con-pv');
//   if (el) el.remove();
//   a.classList.remove('pv-on');
// }

// const canHover = matchMedia('(hover:hover)').matches;

// /* ---------- Buat kartu konten ---------- */
// const conGrid = document.getElementById('conGrid');

// // Kartu muncul satu per satu saat di-scroll
// const conObs = IO
//   ? new IntersectionObserver(entries => {
//       entries.forEach(en => {
//         if (en.isIntersecting) {
//           en.target.classList.add('in');
//           conObs.unobserve(en.target);
//         }
//       });
//     }, { threshold: .18, rootMargin: '0px 0px -6% 0px' })
//   : null;

// contents.forEach((x, i) => {
//   const a = document.createElement('a');
//   a.className = 'con-item ' + (x.r === 'p' ? 'port' : 'land');
//   a.href = x.link;
//   a.target = '_blank';
//   a.rel = 'noopener';

//   // --d = jeda muncul, --rot = arah miring saat muncul
//   a.style.cssText =
//     '--c1:' + x.c1 + ';--c2:' + x.c2 +
//     ';--d:' + (i % 3 * 110) + 'ms;--rot:' + (i % 2 ? '3deg' : '-3deg');

//   a.innerHTML =
//     '<img src="' + x.img + '" alt="" loading="lazy" draggable="false" onerror="this.remove()">' +
//     '<span class="con-play">&#9654;</span>' +
//     '<span class="con-cap"><em></em><b></b></span>';

//   const v = platformOf(x.link);
//   a._src = x.pv || (v && v.file) || '';

//   // Link "#" = belum ada video → klik tidak melakukan apa-apa
//   a.addEventListener('click', e => { if (x.link === '#') e.preventDefault(); });

//   if (a._src) {
//     // Ada file video pendek → autoplay saat terlihat
//     if (!noAuto) {
//       if (vidObs) vidObs.observe(a);
//       else mountVideo(a);
//     }
//   } else if (v && v.yt && canHover) {
//     // Link YouTube tanpa file → putar saat kursor di atas kartu
//     a.addEventListener('pointerenter', e => {
//       if (e.pointerType !== 'mouse') return;
//       clearTimeout(a._t);
//       a._t = setTimeout(() => startPreview(a, v), 180);
//     });
//     a.addEventListener('pointerleave', () => {
//       clearTimeout(a._t);
//       stopPreview(a);
//     });
//   }

//   conGrid.appendChild(a);
//   if (conObs) conObs.observe(a);
//   else a.classList.add('in');
// });

// // Isi / ganti teks kategori & judul sesuai bahasa
// function renderContent() {
//   conGrid.querySelectorAll('.con-item').forEach((a, i) => {
//     a.querySelector('em').textContent = contents[i].k[lg];
//     a.querySelector('b').textContent = contents[i].t[lg];
//     a.setAttribute('aria-label', contents[i].t[lg]);
//   });
// }


/* =====================================================================
   [9] ANIMASI SCROLL
   Elemen muncul pelan (fade + geser + blur tipis) saat di-scroll.
   Gaya: style.css [12]. Foto Beranda & bagian Konten punya animasi sendiri.
   ===================================================================== */

/* Daftar elemen: [selector, jenis, jeda awal (ms)]
     'teks'   = fade + geser + blur (teks pendek)
     'lembut' = fade + geser tanpa blur (paragraf, tombol, kartu)
   About diberi jeda supaya foto tampil duluan, baru teksnya menyusul. */
const REVEAL_LIST = [
  ['.about-text > small, .about-text > h2', 'teks', 250],
  ['.about-text > .bio, .about-text > .btn', 'lembut', 250],
  ['#proyek > small, #proyek > h2', 'teks', 0],
  ['#proyek > .bio', 'lembut', 0],
  ['.carousel', 'lembut', 0],
  ['.car-info', 'lembut', 0],
  ['#pengalaman > small, #pengalaman > h2', 'teks', 0],
  ['#pengalaman > .bio', 'lembut', 0],
  ['.contact-intro > small, .contact-intro > h2', 'teks', 0],
  ['.contact-intro > .c-sub, .contact-intro > .bio, .contact-intro > .btn', 'lembut', 0],
  ['.c-card', 'lembut', 0]
];
const REVEAL_JEDA = 90;   // jeda antar elemen yang muncul bersamaan (ms)

function initReveal() {
  // Judul section dapat garis gradasi kecil (style.css [12] D)
  const judul = document.querySelectorAll(
    '.about-text h2, #proyek h2, #pengalaman h2, .contact-intro h2'
  );
  judul.forEach(h => h.classList.add('ul'));

  // Pengalaman: aktifkan pengamat untuk item yang sudah digambar
  revealReady = true;
  if (expObs) {
    document.querySelectorAll('.exp-item.rv-exp').forEach(el => expObs.observe(el));
  }

  if (!IO || REDUCED) {
    judul.forEach(h => h.classList.add('seen'));
    return;
  }

  const els = [];
  REVEAL_LIST.forEach(([sel, jenis, jeda]) => {
    document.querySelectorAll(sel).forEach(el => {
      el.classList.add('rv');
      if (jenis === 'lembut') el.classList.add('rv-soft');
      el._jeda = jeda;
      els.push(el);
    });
  });

  const io = new IntersectionObserver(entries => {
    entries.filter(en => en.isIntersecting).forEach((en, k) => {
      const el = en.target;
      io.unobserve(el);

      const jeda = (el._jeda || 0) + k * REVEAL_JEDA;
      el.style.setProperty('--rd', jeda + 'ms');
      el.classList.add('in');
      if (el.classList.contains('ul')) el.classList.add('seen');

      // Lepas kelas setelah selesai supaya hover tombol/kartu normal lagi
      setTimeout(() => {
        el.classList.remove('rv', 'rv-soft', 'in');
        el.style.removeProperty('--rd');
      }, jeda + 1300);
    });
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });

  els.forEach(el => io.observe(el));
}

// Menu navbar menyala sesuai section yang sedang dilihat (kelas .active)
function initNavSpy() {
  if (!IO) return;
  const links = [...document.querySelectorAll('.links a, .drop a')];

  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const id = '#' + en.target.id;
      links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });   // garis pengamat di tengah layar

  ['beranda', 'tentang', 'proyek', 'pengalaman', 'konten', 'kontak'].forEach(id => {
    const s = document.getElementById(id);
    if (s) io.observe(s);
  });
}


/* =====================================================================
   [10] MULAI — dijalankan paling akhir
   Tunggu font siap (maks 0,8 detik) → pasang kelas .ready → semua
   animasi mulai dua frame setelah layout stabil.
   ===================================================================== */
setLang(lg);

function mulai() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    root.classList.add('ready');
    initAbout();
    initReveal();
    initNavSpy();
  }));
}

const fontSiap = (document.fonts && document.fonts.ready)
  ? document.fonts.ready
  : Promise.resolve();

Promise.race([fontSiap, new Promise(r => setTimeout(r, 800))]).then(mulai);