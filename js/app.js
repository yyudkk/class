// ===== KELAS X RPL 1 - APLIKASI SATU HALAMAN =====

const LS_USERS = "xrpl1_users";
const LS_SESSION = "xrpl1_session";
const LS_MSG_PREFIX = "xrpl1_msgs_";
const LS_MEDIA_PREFIX = "xrpl1_media_";
const LS_SONG_PREFIX = "xrpl1_songs_";

let currentMemberId = null;
let anggotaFilter = "";

// Warna avatar konsisten per nama
function avatarColor(name) {
  const colors = [
    "#16a34a", "#15803d", "#4d7c0f", "#65a30d", "#ca8a04",
    "#eab308", "#0f766e", "#047857", "#84cc16", "#b45309",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function createAvatar(name, size = 90) {
  const div = document.createElement("div");
  div.className = "avatar";
  div.style.width = size + "px";
  div.style.height = size + "px";
  div.style.background = avatarColor(name);
  div.style.fontSize = (size / 2.6) + "px";
  div.textContent = getInitials(name);
  return div;
}

function esc(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

// ===== AUTENTIKASI =====
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(LS_USERS)) || {};
  } catch {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem(LS_USERS, JSON.stringify(users));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(LS_SESSION));
  } catch {
    return null;
  }
}

function setSession(user) {
  localStorage.setItem(LS_SESSION, JSON.stringify(user));
}

function logout() {
  localStorage.removeItem(LS_SESSION);
  showView("login");
}

function requireAuth() {
  const user = getSession();
  if (!user) {
    showView("login");
    return null;
  }
  return user;
}

// ===== PESAN =====
function getMessages(memberId) {
  try {
    return JSON.parse(localStorage.getItem(LS_MSG_PREFIX + memberId)) || [];
  } catch {
    return [];
  }
}

function saveMessages(memberId, messages) {
  localStorage.setItem(LS_MSG_PREFIX + memberId, JSON.stringify(messages));
}

// ===== MEDIA =====
function getMedia(memberId) {
  try {
    return JSON.parse(localStorage.getItem(LS_MEDIA_PREFIX + memberId)) || [];
  } catch {
    return [];
  }
}

function saveMedia(memberId, media) {
  localStorage.setItem(LS_MEDIA_PREFIX + memberId, JSON.stringify(media));
}

// ===== LAGU TAMBAHAN =====
function getExtraSongs(memberId) {
  try {
    return JSON.parse(localStorage.getItem(LS_SONG_PREFIX + memberId)) || [];
  } catch {
    return [];
  }
}

function saveExtraSongs(memberId, list) {
  localStorage.setItem(LS_SONG_PREFIX + memberId, JSON.stringify(list));
}

function getAllSongs(member) {
  return member.songs.concat(getExtraSongs(member.id));
}

function getMemberById(id) {
  return ANGGOTA.find((m) => m.id === id);
}

// ===== TOAST =====
function toast(message, type = "success") {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.className = "toast show " + type;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove("show"), 2600);
}

// ===== NAVBAR =====
function renderNavbar(active = "") {
  const nav = document.getElementById("navbar");
  if (!nav) return;
  const user = getSession();
  const links = [
    { href: "#dashboard", label: "Beranda", key: "dashboard" },
    { href: "#struktur", label: "Struktur Kelas", key: "struktur" },
    { href: "#anggota", label: "Anggota", key: "anggota" },
  ];
  const activeKey = active === "member" ? "anggota" : active;
  nav.innerHTML = `
    <div class="nav-inner">
      <a class="nav-brand" href="#" onclick="showView('dashboard');return false">
        <img src="assets/logo.jpg" alt="Logo">
        <span>X RPL 1</span>
      </a>
      <div class="nav-links">
        ${links
          .map(
            (l) =>
              `<a href="${l.href}" onclick="showView('${l.key}');return false" class="${activeKey === l.key ? "active" : ""}">${l.label}</a>`
          )
          .join("")}
      </div>
      <div class="nav-user">
        <div class="avatar">${esc(getInitials(user ? user.name : "?"))}</div>
        <span>${esc(user ? user.name : "")}</span>
        <button class="btn-logout" onclick="logout()">Keluar</button>
      </div>
    </div>`;
}

// ===== PERPINDAHAN VIEW =====
function showView(view, memberId) {
  if (view === "member") currentMemberId = memberId;

  const isAuthView = view === "login" || view === "register";
  document.getElementById("navbar").classList.toggle("hidden", isAuthView);
  document.getElementById("app").classList.toggle("hidden", isAuthView);
  document.getElementById("footer").classList.toggle("hidden", isAuthView);

  document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
  const target = document.getElementById("view-" + view);
  if (target) target.classList.remove("hidden");

  if (view === "struktur") renderStruktur();
  if (view === "anggota") renderAnggota();
  if (view === "member") renderMember(currentMemberId);

  if (!isAuthView) renderNavbar(view);
  window.scrollTo({ top: 0, behavior: "smooth" });
  initReveal();
}

// ===== STRUKTUR =====
function renderStruktur() {
  const grid = document.getElementById("strukturGrid");
  if (!grid) return;
  const roles = [
    "Ketua Kelas",
    "Wakil Ketua Kelas",
    "Bendahara 1",
    "Bendahara 2",
    "Sekretaris 1",
    "Sekretaris 2",
    "Kebersihan 1",
    "Kebersihan 2",
  ];
  grid.innerHTML = "";
  roles.forEach((r) => {
    const member = ANGGOTA.find((m) => m.role === r);
    if (!member) return;
    const card = document.createElement("div");
    card.className = "pengurus-card reveal";
    const inner = document.createElement("div");
    inner.appendChild(createAvatar(member.name, 80));
    inner.innerHTML += `
      <div class="jabatan">${esc(r)}</div>
      <h4>${esc(member.name)}</h4>
      <div class="sub">${esc(member.fullname)}</div>
      <a href="#" class="pengurus-link" onclick="showView('member','${member.id}');return false">Lihat Profil</a>`;
    card.appendChild(inner);
    grid.appendChild(card);
  });
}

// ===== ANGGOTA =====
function renderAnggota() {
  const grid = document.getElementById("memberGrid");
  if (!grid) return;
  const q = anggotaFilter.toLowerCase();
  const list = ANGGOTA.filter((m) => {
    return (
      m.name.toLowerCase().includes(q) ||
      m.fullname.toLowerCase().includes(q) ||
      (m.role || "").toLowerCase().includes(q)
    );
  });

  if (list.length === 0) {
    grid.innerHTML = '<div class="empty">Tidak ada anggota yang cocok.</div>';
    return;
  }

  grid.innerHTML = "";
  list.forEach((m) => {
    const card = document.createElement("div");
    card.className = "member-card reveal";
    card.onclick = () => showView("member", m.id);
    const inner = document.createElement("div");
    inner.appendChild(createAvatar(m.name, 90));
    const roleBadge =
      m.role && m.role !== "Anggota" ? `<span class="badge">${esc(m.role)}</span>` : "";
    inner.innerHTML += `
      <h4>${esc(m.name)}</h4>
      <div class="sub">${esc(m.fullname)}</div>
      <div style="margin-top:0.4rem">${roleBadge}</div>`;
    card.appendChild(inner);
    grid.appendChild(card);
  });
}

function onSearchAnggota() {
  anggotaFilter = document.getElementById("searchInput").value;
  renderAnggota();
  initReveal();
}

// ===== PROFIL MEMBER =====
function renderMember(memberId) {
  const content = document.getElementById("memberContent");
  const member = getMemberById(memberId);
  if (!content) return;

  if (!member) {
    content.innerHTML = `<div class="card">
      <h2 class="text-center">Anggota tidak ditemukan</h2>
      <p class="text-center"><a href="#" class="pengurus-link" onclick="showView('anggota');return false">Kembali ke daftar anggota</a></p>
    </div>`;
    return;
  }

  const avatar = createAvatar(member.name, 130);
  const roleBadge =
    member.role && member.role !== "Anggota"
      ? `<span class="badge">${esc(member.role)}</span>`
      : `<span class="badge">Anggota</span>`;

  const sosmedLinks = [
    { key: "instagram", label: "Instagram" },
    { key: "tiktok", label: "TikTok" },
    { key: "youtube", label: "YouTube" },
    { key: "facebook", label: "Facebook" },
  ]
    .filter((s) => member.sosmed[s.key])
    .map(
      (s) =>
        `<a class="sosmed-btn ${s.key}" href="${esc(member.sosmed[s.key])}" target="_blank" rel="noopener">${s.label}</a>`
    )
    .join("") || '<p class="empty">Belum ada media sosial.</p>';

  const songsHtml = getAllSongs(member)
    .map(
      (song) => `
        <div class="song-item">
          <div>
            <div class="song-title">${esc(song.title)}</div>
            <div class="song-artist">${esc(song.artist)}</div>
          </div>
          <audio controls preload="none" src="${esc(song.url)}"></audio>
        </div>`
    )
    .join("") || '<p class="empty">Belum ada lagu.</p>';

  content.innerHTML = `
    <a href="#" class="pengurus-link" onclick="showView('anggota');return false">Kembali ke anggota</a>

    <div class="card reveal" style="margin-top:.8rem">
      <div class="profile-head">
        <div id="profileAvatar"></div>
        <div class="profile-info">
          <h2>${esc(member.name)}</h2>
          ${roleBadge}
          <p class="motto">"${esc(member.motto)}"</p>
          <div class="detail-grid">
            <div class="detail-item"><div class="label">Nama Lengkap</div><div class="value">${esc(member.fullname)}</div></div>
            <div class="detail-item"><div class="label">Kelas</div><div class="value">${esc(KELAS.nama)}</div></div>
            <div class="detail-item"><div class="label">Tanggal Lahir</div><div class="value">${esc(member.birth)}</div></div>
            <div class="detail-item"><div class="label">Hobi</div><div class="value">${esc(member.hobby)}</div></div>
          </div>
        </div>
      </div>
    </div>

    <div class="card reveal">
      <h2 class="section-title"><span class="dot"></span> Media Sosial</h2>
      <div class="sosmed-row">${sosmedLinks}</div>
    </div>

    <div class="card reveal">
      <h2 class="section-title"><span class="dot"></span> Lagu Favorit</h2>
      <div id="songsList">${songsHtml}</div>
      <div class="song-form">
        <input type="text" id="songTitle" placeholder="Judul lagu (mis. Sisa Rasa)">
        <input type="text" id="songArtist" placeholder="Penyanyi (mis. Mahalini)">
        <input type="url" id="songUrl" placeholder="Link audio .mp3">
        <button class="btn btn-yellow" onclick="addSong()">+ Tambah Lagu</button>
      </div>
    </div>

    <div class="card reveal">
      <h2 class="section-title"><span class="dot"></span> Pesan dari Teman</h2>
      <form class="msg-form" onsubmit="submitMessage(event)">
        <textarea id="msgText" placeholder="Tulis pesan untuk ${esc(member.name)}..." required></textarea>
        <button type="submit" class="btn btn-primary">Kirim Pesan</button>
      </form>
      <div id="msgList" class="msg-list"></div>
    </div>

    <div class="card reveal">
      <h2 class="section-title"><span class="dot"></span> Upload Media / File</h2>
      <form class="upload-form" onsubmit="uploadMedia(event)">
        <input type="file" id="fileInput" multiple accept="image/*,video/*,audio/*,.pdf,.txt,.doc,.docx,.ppt,.pptx,.zip">
        <button type="submit" class="btn btn-primary">Upload</button>
      </form>
      <p style="font-size:.78rem;color:var(--muted);margin-top:.5rem">Bisa upload foto, video, audio, atau dokumen.</p>
      <div id="mediaGrid" class="media-grid"></div>
    </div>`;

  document.getElementById("profileAvatar").appendChild(avatar);
  renderMessages();
  renderMedia();
}

function renderMessages() {
  const list = document.getElementById("msgList");
  const member = getMemberById(currentMemberId);
  if (!member || !list) return;
  const messages = getMessages(member.id);
  if (messages.length === 0) {
    list.innerHTML = '<div class="empty">Belum ada pesan. Jadilah yang pertama memberi semangat!</div>';
    return;
  }
  list.innerHTML = messages
    .slice()
    .reverse()
    .map(
      (msg) => `
        <div class="msg-item">
          <div class="msg-head">
            <div class="msg-from">${esc(msg.from)}</div>
            <div class="msg-time">${esc(msg.time)}</div>
          </div>
          <div class="msg-text">${esc(msg.text)}</div>
        </div>`
    )
    .join("");
}

function submitMessage(e) {
  e.preventDefault();
  const member = getMemberById(currentMemberId);
  if (!member) return;
  const text = document.getElementById("msgText").value.trim();
  if (!text) return;
  const me = getSession();
  const messages = getMessages(member.id);
  messages.push({
    from: me ? me.name : "Tamu",
    text: text,
    time: new Date().toLocaleString("id-ID"),
  });
  saveMessages(member.id, messages);
  document.getElementById("msgText").value = "";
  renderMessages();
  toast("Pesan berhasil dikirim!");
}

function renderMedia() {
  const grid = document.getElementById("mediaGrid");
  const member = getMemberById(currentMemberId);
  if (!member || !grid) return;
  const media = getMedia(member.id);
  if (media.length === 0) {
    grid.innerHTML = '<div class="empty">Belum ada media. Silakan upload di atas.</div>';
    return;
  }
  grid.innerHTML = media
    .map(
      (m, i) => `
        <div class="media-item">
          ${mediaPreview(m)}
          <button class="del-media" onclick="deleteMedia(${i})" title="Hapus">X</button>
        </div>`
    )
    .join("");
}

function mediaPreview(m) {
  if (m.type.startsWith("image/")) return `<img src="${m.data}" alt="media">`;
  if (m.type.startsWith("video/")) return `<video controls src="${m.data}"></video>`;
  if (m.type.startsWith("audio/")) return `<audio controls src="${m.data}"></audio>`;
  return `
    <div class="file-icon">
      <div class="big">FILE</div>
      <div>${esc(m.name)}</div>
    </div>`;
}

function uploadMedia(e) {
  e.preventDefault();
  const member = getMemberById(currentMemberId);
  if (!member) return;
  const files = document.getElementById("fileInput").files;
  if (files.length === 0) {
    toast("Pilih file terlebih dahulu.", "error");
    return;
  }
  let media = getMedia(member.id);
  let pending = files.length;
  let failed = 0;

  Array.from(files).forEach((file) => {
    if (file.size > 3 * 1024 * 1024) {
      failed++;
      pending--;
      if (pending === 0) finishUpload(failed);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      media.push({
        name: file.name,
        type: file.type,
        data: reader.result,
        time: new Date().toISOString(),
      });
      pending--;
      if (pending === 0) {
        saveMedia(member.id, media);
        finishUpload(failed);
      }
    };
    reader.onerror = () => {
      failed++;
      pending--;
      if (pending === 0) finishUpload(failed);
    };
    reader.readAsDataURL(file);
  });
}

function finishUpload(failed) {
  document.getElementById("fileInput").value = "";
  renderMedia();
  if (failed > 0) toast(`${failed} file dilewati (maks. 3MB per file).`, "error");
  else toast("Upload berhasil!");
}

function deleteMedia(index) {
  const member = getMemberById(currentMemberId);
  if (!member) return;
  const media = getMedia(member.id);
  media.splice(index, 1);
  saveMedia(member.id, media);
  renderMedia();
  toast("Media dihapus.");
}

// ===== LAGU =====
function addSong() {
  const member = getMemberById(currentMemberId);
  if (!member) return;
  const title = document.getElementById("songTitle").value.trim();
  const artist = document.getElementById("songArtist").value.trim();
  const url = document.getElementById("songUrl").value.trim();
  if (!title || !url) {
    toast("Judul dan link lagu wajib diisi.", "error");
    return;
  }
  const extra = getExtraSongs(member.id);
  extra.push({ title, artist: artist || "Unknown", url });
  saveExtraSongs(member.id, extra);
  document.getElementById("songTitle").value = "";
  document.getElementById("songArtist").value = "";
  document.getElementById("songUrl").value = "";
  const songsList = document.getElementById("songsList");
  const div = document.createElement("div");
  div.className = "song-item";
  div.innerHTML = `
    <div>
      <div class="song-title">${esc(title)}</div>
      <div class="song-artist">${esc(artist || "Unknown")}</div>
    </div>
    <audio controls preload="none" src="${esc(url)}"></audio>`;
  songsList.appendChild(div);
  toast("Lagu berhasil ditambahkan!");
}

// ===== LOGIN & REGISTER =====
function handleLogin(e) {
  e.preventDefault();
  const users = getUsers();
  const name = document.getElementById("loginName").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  const alertBox = document.getElementById("loginAlert");

  const u = users[name];
  if (!u || u.password !== password) {
    alertBox.className = "alert error";
    alertBox.textContent = "Nama atau password salah. Silakan coba lagi.";
    return;
  }
  setSession({ name: u.name });
  showView("dashboard");
}

function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById("regName").value.trim();
  const password = document.getElementById("regPassword").value;
  const confirm = document.getElementById("regConfirm").value;
  const alertBox = document.getElementById("regAlert");

  if (!name) {
    alertBox.className = "alert error";
    alertBox.textContent = "Nama tidak boleh kosong.";
    return;
  }
  if (password.length < 6) {
    alertBox.className = "alert error";
    alertBox.textContent = "Password minimal 6 karakter.";
    return;
  }
  if (password !== confirm) {
    alertBox.className = "alert error";
    alertBox.textContent = "Konfirmasi password tidak cocok.";
    return;
  }

  const users = getUsers();
  const key = name.toLowerCase();
  if (users[key]) {
    alertBox.className = "alert error";
    alertBox.textContent = "Nama sudah terdaftar. Silakan masuk.";
    return;
  }

  users[key] = { name, password, created: new Date().toISOString() };
  saveUsers(users);

  document.getElementById("loginAlert").className = "alert success";
  document.getElementById("loginAlert").textContent = "Pendaftaran berhasil! Silakan masuk.";
  showView("login");
}

function showRegister() {
  document.getElementById("regAlert").className = "alert";
  document.getElementById("regAlert").textContent = "";
  showView("register");
}

function showLogin() {
  document.getElementById("loginAlert").className = "alert";
  document.getElementById("loginAlert").textContent = "";
  showView("login");
}

// ===== ANIMASI REVEAL =====
function initReveal() {
  const items = document.querySelectorAll(".view:not(.hidden) .reveal:not(.visible)");
  if (!items.length) return;
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
  );
  items.forEach((el, i) => {
    el.style.transitionDelay = (i % 6) * 0.05 + "s";
    observer.observe(el);
  });
}

// ===== INISIALISASI =====
document.addEventListener("DOMContentLoaded", () => {
  const users = getUsers();
  if (!users["albyan x rpl 1"]) {
    users["albyan x rpl 1"] = {
      name: "Albyan X RPL 1",
      password: "123456",
      created: new Date().toISOString(),
    };
    saveUsers(users);
  }
  showView(getSession() ? "dashboard" : "login");
});
