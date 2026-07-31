// ===== KELAS X RPL 1 - APLIKASI SATU HALAMAN =====

const LS_USERS = "xrpl1_users";
const LS_SESSION = "xrpl1_session";
const LS_MSG_PREFIX = "xrpl1_msgs_";
const LS_MEDIA_PREFIX = "xrpl1_media_";
const LS_SONG_PREFIX = "xrpl1_songs_";
const LS_SONG_REMOVED_PREFIX = "xrpl1_songs_removed_";
const LS_PROFILE_PREFIX = "xrpl1_profile_";
const LS_OWNER_PREFIX = "xrpl1_owner_";
const LS_ADMIN = "xrpl1_admin";
const LS_ADMIN_PASS = "xrpl1_admin_pass";
const LS_DELETED = "xrpl1_deleted";
const LS_CUSTOM = "xrpl1_custom_members";

let currentMemberId = null;
let anggotaFilter = "";
let memberReadonly = false;

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

function escAttr(str) {
  return esc(str).replace(/"/g, "&quot;");
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

// ===== JENIS SESI =====
// guest      = belum login
// admin      = masuk lewat Panel Admin
// owner      = pemilik akun anggota (akun dibuat admin / dbMasukPemilik)
// registered = login mandiri lewat Daftar
function sessionKind() {
  const s = getSession();
  if (!s) return "guest";
  if (isAdmin()) return "admin";
  if (s.memberId) return "owner";
  return "registered";
}

function isRegisteredOnly() {
  return sessionKind() === "registered";
}

// Boleh mengelola profil (edit, hapus, lagu, dsb.)
function canManageProfile(memberId) {
  return isOwner(memberId) || isAdmin();
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

function getRemovedSongUrls(memberId) {
  try {
    return JSON.parse(localStorage.getItem(LS_SONG_REMOVED_PREFIX + memberId)) || [];
  } catch {
    return [];
  }
}

function saveRemovedSongUrls(memberId, list) {
  localStorage.setItem(LS_SONG_REMOVED_PREFIX + memberId, JSON.stringify(list));
}

function getAllSongsWithSource(member) {
  const removed = getRemovedSongUrls(member.id);
  const defaults = member.songs.filter((s) => !removed.includes(s.url));
  return [
    ...defaults.map((s) => ({ song: s, source: "default" })),
    ...getExtraSongs(member.id).map((s) => ({ song: s, source: "extra" })),
  ];
}

function getAllSongs(member) {
  return getAllSongsWithSource(member).map((item) => item.song);
}

function getDeletedIds() {
  try {
    return JSON.parse(localStorage.getItem(LS_DELETED)) || [];
  } catch {
    return [];
  }
}

function saveDeletedIds(list) {
  localStorage.setItem(LS_DELETED, JSON.stringify(list));
}

function getCustomMembers() {
  try {
    return JSON.parse(localStorage.getItem(LS_CUSTOM)) || [];
  } catch {
    return [];
  }
}

function saveCustomMembers(list) {
  localStorage.setItem(LS_CUSTOM, JSON.stringify(list));
}

function getAllAnggota() {
  const deleted = getDeletedIds();
  return [
    ...ANGGOTA.filter((m) => !deleted.includes(m.id)),
    ...getCustomMembers().filter((m) => !deleted.includes(m.id)),
  ];
}

function getMemberById(id) {
  const base = getAllAnggota().find((m) => m.id === id);
  if (!base) return null;
  const ov = getProfileOverride(id);
  if (!Object.keys(ov).length) return base;
  return {
    ...base,
    ...ov,
    sosmed: { ...(base.sosmed || {}), ...(ov.sosmed || {}) },
  };
}

// ===== PERUBAHAN PROFIL (khusus pemilik nama) =====
function getProfileOverride(memberId) {
  try {
    return JSON.parse(localStorage.getItem(LS_PROFILE_PREFIX + memberId)) || {};
  } catch {
    return {};
  }
}

function saveProfileOverride(memberId, data) {
  localStorage.setItem(LS_PROFILE_PREFIX + memberId, JSON.stringify(data));
}

function isOwner(memberId) {
  const s = getSession();
  if (s && s.memberId === memberId) return true;
  return localStorage.getItem(LS_OWNER_PREFIX + memberId) === "1";
}

function ownerLogout(memberId) {
  localStorage.removeItem(LS_OWNER_PREFIX + memberId);
  const s = getSession();
  if (s && s.memberId === memberId) {
    logout();
    return;
  }
  renderMember(memberId);
  toast("Profil dikunci.");
}

function avatarHtml(member, size, extraClass = "") {
  const style = "width:" + size + "px;height:" + size + "px;";
  if (member.photo) {
    return (
      '<img class="avatar photo ' + extraClass + '" src="' + member.photo +
      '" alt="' + escAttr(member.name) + '" style="' + style + '">'
    );
  }
  return (
    '<div class="avatar ' + extraClass + '" style="' + style +
    'background:' + avatarColor(member.name) + ";font-size:" + Math.round(size / 2.6) + 'px;">' +
    getInitials(member.name) + "</div>"
  );
}

// ===== DETEKSI PLATFORM LINK LAGU =====
function parseSongUrl(url) {
  const u = (url || "").trim();
  if (!u) return null;

  let m = u.match(/spotify\.com\/(?:embed\/)?(track|album|playlist|episode|show)\/([a-zA-Z0-9]{10,})/i);
  if (m) return { type: "spotify", embedUrl: "https://open.spotify.com/embed/" + m[1] + "/" + m[2] };

  m = u.match(/(?:youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/i);
  if (m) return { type: "youtube", embedUrl: "https://www.youtube.com/embed/" + m[1] };

  m = u.match(/tiktok\.com\/(?:@[^/]+\/video\/|video\/|embed\/v2\/|embed\/)(\d+)/i);
  if (m) return { type: "tiktok", embedUrl: "https://www.tiktok.com/embed/v2/" + m[1] };

  if (/(?:vm|vt)\.tiktok\.com\//i.test(u)) return { type: "tiktok-short" };

  if (/\.(mp3|m4a|ogg|oga|wav)(\?|#|$)/i.test(u)) return { type: "mp3", audioUrl: u };

  return null;
}

function songEmbedHtml(song) {
  const parsed = parseSongUrl(song.url);
  if (!parsed) {
    return '<div class="empty">Link tidak dikenali.</div>';
  }
  if (parsed.type === "tiktok-short") {
    return '<div class="empty">Link TikTok pendek tidak bisa diputar. Gunakan link video lengkap (tiktok.com/@user/video/...).</div>';
  }
  if (parsed.type === "mp3") {
    return `<audio controls preload="none" src="${esc(song.url)}"></audio>`;
  }
  const style =
    parsed.type === "spotify"
      ? 'width:100%;max-width:340px;height:152px;'
      : parsed.type === "youtube"
      ? 'width:100%;max-width:400px;height:225px;'
      : 'width:340px;height:560px;';
  return `<iframe class="song-embed" style="${style}" src="${esc(parsed.embedUrl)}" loading="lazy"
    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
    allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
}

function songPlatformTag(song) {
  const parsed = parseSongUrl(song.url);
  if (!parsed) return "";
  return `<span class="song-tag ${parsed.type}">${parsed.type}</span>`;
}

// ===== DAFTAR LAGU =====
const ICON_PLAY =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
const ICON_PAUSE =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
const ICON_NOTE =
  '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M9 3v10.55A4 4 0 1 0 11 17V7h4V3H9z"/></svg>';
const ICON_TRASH =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>';

function fmtTime(sec) {
  if (!isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ":" + (s < 10 ? "0" + s : s);
}

function songItemHtml(song, index, canEdit) {
  const parsed = parseSongUrl(song.url);
  const tag = songPlatformTag(song);

  let player = "";
  if (parsed && parsed.type === "mp3") {
    player = `
      <div class="song-player open" data-type="audio">
        <audio src="${esc(song.url)}" preload="none"></audio>
        <div class="mini-player">
          <div class="mini-progress" onclick="seekSong(event, this)">
            <div class="mini-progress-fill"></div>
          </div>
          <div class="mini-time">
            <span class="mini-current">0:00</span>
            <span>•</span>
            <span class="mini-duration">0:00</span>
          </div>
        </div>
      </div>`;
  } else {
    player = `<div class="song-player">${songEmbedHtml(song)}</div>`;
  }

  return `
    <div class="song-card">
      ${canEdit ? `<button class="del-song" onclick="deleteSong(${index})" title="Hapus lagu">${ICON_TRASH}</button>` : ""}
      <div class="song-card-head">
        <div class="song-cover">${ICON_NOTE}</div>
        <div class="song-meta">
          <div class="song-title">${esc(song.title)} ${tag}</div>
          <div class="song-artist">${esc(song.artist)}</div>
        </div>
        <button class="song-play" onclick="toggleSongPlayer(this)" title="Putar">${ICON_PLAY}</button>
      </div>
      ${player}
    </div>`;
}

function renderSongList() {
  const list = document.getElementById("songsList");
  if (!list) return;
  const member = getMemberById(currentMemberId);
  if (!member) return;
  const canEdit = canManageProfile(currentMemberId);
  const items = getAllSongsWithSource(member);
  list.innerHTML = items.length
    ? items.map((it, i) => songItemHtml(it.song, i, canEdit)).join("")
    : '<div class="empty">Belum ada lagu.</div>';
  wireSongAudios();
}

function wireSongAudios() {
  document.querySelectorAll(".song-card audio").forEach((audio) => {
    if (audio.dataset.wired) return;
    audio.dataset.wired = "1";
    const card = audio.closest(".song-card");
    const btn = card.querySelector(".song-play");
    const fill = card.querySelector(".mini-progress-fill");
    const cur = card.querySelector(".mini-current");
    const dur = card.querySelector(".mini-duration");

    audio.addEventListener("play", () => {
      document.querySelectorAll(".song-card audio").forEach((a) => {
        if (a !== audio) a.pause();
      });
      btn.classList.add("playing");
      btn.innerHTML = ICON_PAUSE;
    });
    audio.addEventListener("pause", () => {
      btn.classList.remove("playing");
      btn.innerHTML = ICON_PLAY;
    });
    audio.addEventListener("ended", () => {
      btn.classList.remove("playing");
      btn.innerHTML = ICON_PLAY;
      if (fill) fill.style.width = "0%";
      if (cur) cur.textContent = "0:00";
    });
    audio.addEventListener("loadedmetadata", () => {
      if (dur) dur.textContent = fmtTime(audio.duration);
    });
    audio.addEventListener("timeupdate", () => {
      if (cur && audio.duration) {
        cur.textContent = fmtTime(audio.currentTime);
        if (fill) fill.style.width = (audio.currentTime / audio.duration) * 100 + "%";
      }
    });
  });
}

function toggleSongPlayer(btn) {
  const card = btn.closest(".song-card");
  if (!card) return;
  const audio = card.querySelector("audio");
  if (audio) {
    if (audio.paused) audio.play();
    else audio.pause();
    return;
  }
  const player = card.querySelector(".song-player");
  if (!player) return;
  const isOpen = player.classList.toggle("open");
  btn.classList.toggle("playing", isOpen);
}

function seekSong(e, el) {
  const audio = el.closest(".song-card").querySelector("audio");
  if (!audio || !audio.duration) return;
  const rect = el.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  audio.currentTime = ratio * audio.duration;
}

function deleteSong(index) {
  if (!canManageProfile(currentMemberId)) {
    toast("Kamu tidak punya izin mengubah lagu.", "error");
    return;
  }
  const member = getMemberById(currentMemberId);
  if (!member) return;
  const items = getAllSongsWithSource(member);
  const item = items[index];
  if (!item) return;
  confirmAction({
    title: "Hapus lagu?",
    message: 'Lagu "' + item.song.title + '" akan dihapus dari daftar.',
    onConfirm: () => {
      if (item.source === "extra") {
        const extra = getExtraSongs(member.id);
        saveExtraSongs(member.id, extra.filter((s) => s.url !== item.song.url));
      } else {
        const removed = getRemovedSongUrls(member.id);
        if (!removed.includes(item.song.url)) removed.push(item.song.url);
        saveRemovedSongUrls(member.id, removed);
      }
      renderSongList();
      toast("Lagu dihapus.");
    },
  });
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

// ===== MODAL KONFIRMASI (Hapus/Batal) =====
function confirmAction({ title, message, confirmText = "Hapus", onConfirm }) {
  let overlay = document.getElementById("confirmModal");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "confirmModal";
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true">
        <h3 class="modal-title"></h3>
        <p class="modal-message"></p>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline modal-cancel">Batal</button>
          <button type="button" class="btn btn-danger modal-ok"></button>
        </div>
      </div>`;
    overlay.querySelector(".modal-cancel").addEventListener("click", closeConfirmModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeConfirmModal();
    });
    document.body.appendChild(overlay);
  }
  overlay.querySelector(".modal-title").textContent = title || "Hapus?";
  overlay.querySelector(".modal-message").textContent = message || "Tindakan ini tidak bisa dibatalkan.";
  overlay.querySelector(".modal-ok").textContent = confirmText;
  overlay.querySelector(".modal-ok").onclick = () => {
    closeConfirmModal();
    if (typeof onConfirm === "function") onConfirm();
  };
  overlay.classList.remove("hidden");
  requestAnimationFrame(() => overlay.classList.add("open"));
}

function closeConfirmModal() {
  const overlay = document.getElementById("confirmModal");
  if (!overlay) return;
  overlay.classList.remove("open");
  setTimeout(() => overlay.classList.add("hidden"), 200);
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
  if (isAdmin()) links.push({ href: "#admin", label: "Panel Admin", key: "admin" });
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
  if (view === "admin" && !isAdmin()) {
    showView("adminlogin");
    return;
  }

  const isAuthView = view === "login" || view === "register" || view === "adminlogin";
  document.getElementById("navbar").classList.toggle("hidden", isAuthView);
  document.getElementById("app").classList.toggle("hidden", isAuthView);
  document.getElementById("footer").classList.toggle("hidden", isAuthView);

  document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
  const target = document.getElementById("view-" + view);
  if (target) target.classList.remove("hidden");

  if (view === "struktur") renderStruktur();
  if (view === "anggota") renderAnggota();
  if (view === "member") renderMember(currentMemberId);
  if (view === "admin") renderAdmin();

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
    const member = getMemberById(getAllAnggota().find((m) => m.role === r)?.id);
    if (!member) return;
    const card = document.createElement("div");
    card.className = "pengurus-card reveal";
    const inner = document.createElement("div");
    inner.innerHTML += avatarHtml(member, 80) + `
      <div class="jabatan">${esc(r)}</div>
      <h4>${esc(member.name)}</h4>
      <div class="sub">${esc(member.fullname)}</div>
      <a href="#" class="pengurus-link" onclick="openProfile('${member.id}');return false">${isOwner(member.id) ? "Profil Saya" : "Lihat Profil"}</a>`;
    card.appendChild(inner);
    grid.appendChild(card);
  });
}

// ===== ANGGOTA =====
function renderAnggota() {
  const grid = document.getElementById("memberGrid");
  if (!grid) return;
  const q = anggotaFilter.toLowerCase();
  const list = getAllAnggota().filter((m) => {
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
    const member = getMemberById(m.id);
    if (!member) return;
    const card = document.createElement("div");
    card.className = "member-card reveal";
    card.onclick = () => openProfile(m.id);
    const inner = document.createElement("div");
    inner.innerHTML += avatarHtml(member, 90);
    const roleBadge =
      member.role && member.role !== "Anggota" ? `<span class="badge">${esc(member.role)}</span>` : "";
    inner.innerHTML += `
      <h4>${esc(member.name)}</h4>
      <div class="sub">${esc(member.fullname)}</div>
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

  const avatar = avatarHtml(member, 130);
  const roleBadge =
    member.role && member.role !== "Anggota"
      ? `<span class="badge">${esc(member.role)}</span>`
      : `<span class="badge">Anggota</span>`;

  const ownerBlock = isOwner(member.id) && !memberReadonly ? editProfileHtml(member) : "";
  const registeredOnly = isRegisteredOnly();
  const canManage = canManageProfile(member.id);

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

  const songsHtml = '<div id="songsList"></div>';
  const songFormHtml = canManage
    ? `<div class="song-form">
        <input type="text" id="songTitle" placeholder="Judul lagu (mis. Sisa Rasa)">
        <input type="text" id="songArtist" placeholder="Penyanyi (mis. Mahalini)">
        <input type="url" id="songUrl" placeholder="Link: Spotify / YouTube / TikTok / .mp3">
        <button class="btn btn-yellow" onclick="addSong()">+ Tambah Lagu</button>
      </div>
      <p class="song-hint">Tempel link lagu dari Spotify, YouTube, TikTok, atau file audio langsung (.mp3 / .m4a / .ogg / .wav).</p>`
    : "";

  const uploadAccept = registeredOnly
    ? "image/*,audio/*"
    : "image/*,video/*,audio/*,.pdf,.txt,.doc,.docx,.ppt,.pptx,.zip";
  const uploadTitle = registeredOnly
    ? "Kirim Gambar, Sticker, Gift & Sound"
    : "Upload Media / File";
  const uploadHint = registeredOnly
    ? "Bisa upload gambar, sticker, gift, atau sound (audio)."
    : "Bisa upload foto, video, audio, atau dokumen.";

  content.innerHTML = `
    <a href="#" class="pengurus-link" onclick="showView('anggota');return false">Kembali ke anggota</a>

    <div class="card reveal" style="margin-top:.8rem">
      <div class="profile-head">
        <div id="profileAvatar">${avatar}</div>
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

    ${ownerBlock}

    <div class="card reveal">
      <h2 class="section-title"><span class="dot"></span> Media Sosial</h2>
      <div class="sosmed-row">${sosmedLinks}</div>
    </div>

    <div class="card reveal">
      <h2 class="section-title"><span class="dot"></span> Lagu Favorit</h2>
      <div id="songsList">${songsHtml}</div>
      ${songFormHtml}
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
      <h2 class="section-title"><span class="dot"></span> ${uploadTitle}</h2>
      <form class="upload-form" onsubmit="uploadMedia(event)">
        <input type="file" id="fileInput" multiple accept="${uploadAccept}">
        <button type="submit" class="btn btn-primary">Upload</button>
      </form>
      <p style="font-size:.78rem;color:var(--muted);margin-top:.5rem">${uploadHint}</p>
      <div id="mediaGrid" class="media-grid"></div>
    </div>`;

  renderSongList();
  renderMessages();
  renderMedia();
  memberReadonly = false;
}

// ===== MENU PROFIL (pemilik akun: Lihat / Edit / Hapus) =====
function openProfile(memberId) {
  if (isOwner(memberId)) {
    showProfileMenu(memberId);
  } else {
    showView("member", memberId);
  }
}

function showProfileMenu(memberId) {
  const member = getMemberById(memberId);
  if (!member) return;
  let overlay = document.getElementById("profileMenuModal");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "profileMenuModal";
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal-box">
        <h3 class="modal-title pmm-title"></h3>
        <p class="modal-message pmm-sub"></p>
        <div class="pmm-actions">
          <button type="button" class="btn btn-primary" onclick="viewProfileMenu()">Lihat Profile</button>
          <button type="button" class="btn btn-yellow" onclick="editProfileMenu()">Edit Profile</button>
          <button type="button" class="btn btn-danger" onclick="deleteProfileMenu()">Hapus Profile</button>
        </div>
        <p class="pmm-hint">Buka profil seperti orang lain, edit, atau hapus profil ini.</p>
      </div>`;
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeProfileMenu();
    });
    document.body.appendChild(overlay);
  }
  overlay.querySelector(".pmm-title").textContent = member.name;
  overlay.querySelector(".pmm-sub").textContent = "Ini profil kamu, " + member.name + ". Mau lakukan apa?";
  overlay._memberId = memberId;
  overlay.classList.remove("hidden");
  requestAnimationFrame(() => overlay.classList.add("open"));
}

function closeProfileMenu() {
  const o = document.getElementById("profileMenuModal");
  if (!o) return;
  o.classList.remove("open");
  setTimeout(() => o.classList.add("hidden"), 200);
}

function profileMenuMemberId() {
  const o = document.getElementById("profileMenuModal");
  return o ? o._memberId : null;
}

function viewProfileMenu() {
  const id = profileMenuMemberId();
  closeProfileMenu();
  if (id) {
    memberReadonly = true;
    showView("member", id);
  }
}

function editProfileMenu() {
  const id = profileMenuMemberId();
  closeProfileMenu();
  if (id) {
    showView("member", id);
    setTimeout(() => {
      const card = document.getElementById("editProfileCard");
      if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  }
}

function deleteProfileMenu() {
  const id = profileMenuMemberId();
  closeProfileMenu();
  if (id) deleteProfile(id);
}

function deleteProfile(memberId) {
  if (!canManageProfile(memberId)) {
    toast("Kamu tidak punya izin menghapus profil.", "error");
    return;
  }
  const member = getMemberById(memberId);
  if (!member) return;
  confirmAction({
    title: "Hapus profil?",
    message: 'Profil "' + member.name + '" beserta semua komentar, foto, file, dan lagunya akan dihapus permanen.',
    confirmText: "Hapus",
    onConfirm: () => {
      const deleted = getDeletedIds();
      if (!deleted.includes(memberId)) deleted.push(memberId);
      saveDeletedIds(deleted);
      saveCustomMembers(getCustomMembers().filter((m) => m.id !== memberId));
      localStorage.removeItem(LS_MSG_PREFIX + memberId);
      localStorage.removeItem(LS_MEDIA_PREFIX + memberId);
      localStorage.removeItem(LS_SONG_PREFIX + memberId);
      localStorage.removeItem(LS_SONG_REMOVED_PREFIX + memberId);
      localStorage.removeItem(LS_PROFILE_PREFIX + memberId);
      localStorage.removeItem(LS_OWNER_PREFIX + memberId);
      const users = getUsers();
      const key = (member.fullname || member.name).toLowerCase();
      if (users[key]) {
        delete users[key];
        saveUsers(users);
      }
      const s = getSession();
      if (s && s.memberId === memberId) {
        logout();
        return;
      }
      if (currentMemberId === memberId) currentMemberId = null;
      showView("anggota");
      toast("Profil dihapus.");
    },
  });
}

// ===== LOGIN & EDIT PROFIL (khusus pemilik nama) =====
function editProfileHtml(member) {
  const sos = member.sosmed || {};
  return `
    <div class="card reveal" id="editProfileCard">
      <h2 class="section-title"><span class="dot"></span> Edit Profil <span class="badge" style="transform:none">Kamu pemilik akun ini</span></h2>
      <form onsubmit="saveProfile(event,'${member.id}')">
        <div class="profile-edit-grid">
          <div class="form-group">
            <label for="pfPhoto">Foto Profile</label>
            <div class="edit-preview">${avatarHtml(member, 84)}</div>
            <input type="file" id="pfPhoto" accept="image/*" class="form-control">
            <p class="song-hint">Unggah foto profil baru (maks 2MB). Kosongkan jika tidak mengganti.</p>
          </div>
          <div class="form-group">
            <label for="pfName">Nama Panggilan</label>
            <input type="text" id="pfName" class="form-control" value="${escAttr(member.name)}" required>
          </div>
          <div class="form-group">
            <label for="pfMotto">Bio / Motto Hidup</label>
            <textarea id="pfMotto" class="form-control" rows="2" placeholder="Tulis bio atau motto hidupmu...">${esc(member.motto)}</textarea>
          </div>
          <div class="form-group">
            <label for="pfFullname">Nama Lengkap</label>
            <input type="text" id="pfFullname" class="form-control" value="${escAttr(member.fullname)}" required>
          </div>
          <div class="form-group">
            <label for="pfBirth">Tanggal Lahir</label>
            <input type="text" id="pfBirth" class="form-control" value="${escAttr(member.birth)}" placeholder="mis. 15 September 2010">
          </div>
          <div class="form-group">
            <label for="pfHobby">Hobi</label>
            <input type="text" id="pfHobby" class="form-control" value="${escAttr(member.hobby)}">
          </div>
          <div class="form-group">
            <label for="pfIg">Instagram</label>
            <input type="url" id="pfIg" class="form-control" value="${escAttr(sos.instagram || "")}" placeholder="https://instagram.com/...">
          </div>
          <div class="form-group">
            <label for="pfTt">TikTok</label>
            <input type="url" id="pfTt" class="form-control" value="${escAttr(sos.tiktok || "")}" placeholder="https://tiktok.com/...">
          </div>
          <div class="form-group">
            <label for="pfYt">YouTube</label>
            <input type="url" id="pfYt" class="form-control" value="${escAttr(sos.youtube || "")}" placeholder="https://youtube.com/...">
          </div>
          <div class="form-group">
            <label for="pfFb">Facebook</label>
            <input type="url" id="pfFb" class="form-control" value="${escAttr(sos.facebook || "")}" placeholder="https://facebook.com/...">
          </div>
        </div>
        <div class="profile-edit-actions">
          <button type="submit" class="btn btn-primary">Simpan Perubahan</button>
          <button type="button" class="btn btn-outline" onclick="ownerLogout('${member.id}')">Kunci Profil</button>
        </div>
      </form>
    </div>`;
}

function syncSessionName(memberId, name) {
  const s = getSession();
  if (s && s.memberId === memberId) {
    s.name = name;
    setSession(s);
  }
}

function saveProfile(e, memberId) {
  e.preventDefault();
  if (!canManageProfile(memberId)) {
    toast("Kamu tidak punya izin mengubah profil.", "error");
    return;
  }
  const member = getMemberById(memberId);
  if (!member) return;
  const ov = getProfileOverride(memberId);
  const next = {
    name: document.getElementById("pfName").value.trim() || member.name,
    fullname: document.getElementById("pfFullname").value.trim() || member.fullname,
    birth: document.getElementById("pfBirth").value.trim(),
    hobby: document.getElementById("pfHobby").value.trim(),
    motto: document.getElementById("pfMotto").value.trim(),
  };
  const sos = {};
  const ig = document.getElementById("pfIg").value.trim();
  const tt = document.getElementById("pfTt").value.trim();
  const yt = document.getElementById("pfYt").value.trim();
  const fb = document.getElementById("pfFb").value.trim();
  if (ig) sos.instagram = ig;
  if (tt) sos.tiktok = tt;
  if (yt) sos.youtube = yt;
  if (fb) sos.facebook = fb;
  if (Object.keys(sos).length) next.sosmed = sos;

  const file = document.getElementById("pfPhoto").files[0];
  if (file) {
    if (file.size > 2 * 1024 * 1024) {
      toast("Foto maksimal 2MB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      next.photo = reader.result;
      saveProfileOverride(memberId, { ...ov, ...next });
      syncSessionName(memberId, next.name);
      renderMember(memberId);
      toast("Profil berhasil diubah!");
    };
    reader.readAsDataURL(file);
    return;
  }
  saveProfileOverride(memberId, { ...ov, ...next });
  syncSessionName(memberId, next.name);
  renderMember(memberId);
  toast("Profil berhasil diubah!");
}

// ===== DATABASE PEMILIK PROFIL (khusus admin) =====
function getAdminPassword() {
  return localStorage.getItem(LS_ADMIN_PASS) || ADMIN_PASSWORD;
}

function isAdmin() {
  return localStorage.getItem(LS_ADMIN) === "1";
}

function renderDatabase() {
  const gate = document.getElementById("dbGate");
  const table = document.getElementById("dbTable");
  if (!gate || !table) return;
  if (isAdmin()) {
    gate.innerHTML = "";
    table.classList.remove("hidden");
    renderDbTable();
  } else {
    gate.innerHTML = `
      <div class="card reveal">
        <h2 class="section-title"><span class="dot"></span> Masuk Database Pemilik</h2>
        <p style="margin-bottom:1rem;color:var(--muted);font-size:.9rem">
          Khusus admin kelas. Masukkan password admin untuk melihat seluruh username & password pemilik profil.
        </p>
        <form class="db-login" onsubmit="dbLogin(event)">
          <div class="form-group">
            <label for="dbPass">Password Admin</label>
            <input type="password" id="dbPass" class="form-control" placeholder="Password admin" required>
          </div>
          <button type="submit" class="btn btn-primary">Buka Database</button>
        </form>
      </div>`;
    table.classList.add("hidden");
  }
}

function dbLogin(e) {
  e.preventDefault();
  const pass = document.getElementById("dbPass").value;
  if (pass === getAdminPassword()) {
    localStorage.setItem(LS_ADMIN, "1");
    renderDatabase();
    toast("Berhasil masuk database!");
  } else {
    toast("Password admin salah.", "error");
  }
}

function dbLogout() {
  adminLogout();
}

function dbSetPass() {
  const pass = document.getElementById("newAdminPass").value;
  if (!pass || pass.length < 6) {
    toast("Password admin minimal 6 karakter.", "error");
    return;
  }
  localStorage.setItem(LS_ADMIN_PASS, pass);
  document.getElementById("newAdminPass").value = "";
  toast("Password admin berhasil diubah!");
}

function dbMasukPemilik(memberId) {
  const member = getMemberById(memberId);
  if (!member) return;
  localStorage.setItem(LS_OWNER_PREFIX + memberId, "1");
  showView("member", memberId);
  toast("Kamu masuk sebagai pemilik " + member.fullname);
}

let dbSortKey = "name";
let dbSortDir = "asc";
let dbSearch = "";

function dbSortOptions() {
  return [
    { value: "name", label: "Nama Panggilan" },
    { value: "fullname", label: "Nama Lengkap" },
    { value: "id", label: "ID / Username" },
    { value: "role", label: "Peran" },
    { value: "created", label: "Tanggal Dibuat" },
  ];
}

function setDbSort(key) {
  if (dbSortKey === key) {
    dbSortDir = dbSortDir === "asc" ? "desc" : "asc";
  } else {
    dbSortKey = key;
    dbSortDir = "asc";
  }
  renderDbTable();
}

function onDbSearch() {
  const el = document.getElementById("dbSearch");
  dbSearch = el ? el.value.trim().toLowerCase() : "";
  renderDbTable();
}

function sortDbMembers(list) {
  const sorted = [...list];
  sorted.sort((a, b) => {
    const ma = getMemberById(a.id);
    const mb = getMemberById(b.id);
    let va, vb;
    if (dbSortKey === "created") {
      va = a.created || "";
      vb = b.created || "";
    } else if (dbSortKey === "id") {
      va = a.id || "";
      vb = b.id || "";
    } else if (dbSortKey === "fullname") {
      va = (ma && ma.fullname) || a.fullname || "";
      vb = (mb && mb.fullname) || b.fullname || "";
    } else if (dbSortKey === "role") {
      va = ((ma && ma.role) || a.role || "Anggota").toLowerCase();
      vb = ((mb && mb.role) || b.role || "Anggota").toLowerCase();
    } else {
      va = ((ma && ma.name) || a.name || "").toLowerCase();
      vb = ((mb && mb.name) || b.name || "").toLowerCase();
    }
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return dbSortDir === "asc" ? cmp : -cmp;
  });
  return sorted;
}

function renderDbTable() {
  const table = document.getElementById("dbTable");
  if (!table) return;
  const customIds = new Set(getCustomMembers().map((m) => m.id));
  let list = getAllAnggota();
  if (dbSearch) {
    list = list.filter((m) => {
      const member = getMemberById(m.id);
      const hay = [
        member.id,
        member.name,
        member.fullname,
        member.role,
        member.birth,
        member.hobby,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(dbSearch);
    });
  }
  const sorted = sortDbMembers(list);
  const rows = sorted.map((m, i) => {
    const member = getMemberById(m.id);
    const isCustom = customIds.has(member.id);
    const created = m.created ? new Date(m.created).toLocaleDateString("id-ID") : "-";
    const badge = isCustom
      ? '<span class="badge" style="transform:none">Dibuat Admin</span>'
      : '<span class="badge badge-bawaan" style="transform:none">Bawaan</span>';
    const passCell = isCustom
      ? `<code class="db-code">${esc(member.id)} / ${esc(member.id + "123")}</code>`
      : `<span class="db-noaccount">Belum ada akun</span>`;
    return `
      <div class="db-row">
        <span class="db-no">${i + 1}</span>
        <div class="db-nama">
          <div class="db-full">${esc(member.fullname)} ${badge}</div>
          <div class="db-panggil">${esc(member.name)} <span class="db-role">(${esc(member.role || "Anggota")})</span></div>
        </div>
        <div class="db-pass">
          <span class="db-label">ID / Password</span>
          ${passCell}
        </div>
        <div class="db-pass">
          <span class="db-label">Dibuat</span>
          <span class="db-date">${esc(created)}</span>
        </div>
        <div class="db-actions">
          <button class="btn btn-yellow db-masuk" onclick="dbMasukPemilik('${member.id}')">Buka Profil Pemilik</button>
          <button class="btn btn-danger db-masuk" onclick="adminDeleteMember('${member.id}')">Hapus</button>
        </div>
      </div>`;
  }).join("");
  const dirIcon = dbSortDir === "asc" ? "&#8593;" : "&#8595;";
  table.innerHTML = `
    <div class="db-toolbar">
      <div>
        <h2 class="section-title" style="margin-bottom:.2rem"><span class="dot"></span> Database Anggota</h2>
        <p style="color:var(--muted);font-size:.85rem">Semua anggota kelas: 12 bawaan (profil tanpa akun login) + akun buatan admin. Password pemilik akun = ID + "123".</p>
      </div>
      <button class="btn btn-danger" onclick="dbLogout()">Keluar Admin</button>
    </div>

    <div class="db-controls">
      <input type="text" id="dbSearch" class="form-control db-search" placeholder="Cari nama / ID / peran..." oninput="onDbSearch()" value="${escAttr(dbSearch)}">
      <div class="db-sort">
        <label class="db-label">Urutkan</label>
        <select id="dbSortSelect" class="form-control" onchange="setDbSort(this.value)">
          ${dbSortOptions()
            .map(
              (o) =>
                `<option value="${o.value}" ${dbSortKey === o.value ? "selected" : ""}>${o.label}</option>`
            )
            .join("")}
        </select>
        <button class="btn btn-outline db-sortdir" onclick="setDbSort(dbSortKey)" title="Balik arah urutan">${dirIcon}</button>
      </div>
    </div>

    <div class="db-count">${sorted.length} anggota</div>

    <div class="db-change">
      <input type="password" id="newAdminPass" class="form-control" placeholder="Password admin baru (min 6 karakter)">
      <button class="btn btn-outline" onclick="dbSetPass()">Ubah Password Admin</button>
    </div>
    <div class="db-list">${rows || '<div class="empty">Tidak ada anggota yang cocok.</div>'}</div>`;
}

// ===== PANEL ADMIN =====
let adminCurrentTab = "ringkasan";

function renderAdmin() {
  const content = document.getElementById("adminContent");
  if (!content) return;
  document.querySelectorAll(".admin-tab").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === adminCurrentTab);
  });
  if (adminCurrentTab === "ringkasan") content.innerHTML = adminRingkasanHtml();
  else if (adminCurrentTab === "database") {
    content.innerHTML = '<div id="dbGate"></div><div id="dbTable" class="card"></div>';
    renderDatabase();
  } else if (adminCurrentTab === "tambah") content.innerHTML = adminAddHtml();
  else if (adminCurrentTab === "komentar") renderAdminComments();
  else if (adminCurrentTab === "foto") renderAdminMedia("image/");
  else if (adminCurrentTab === "video") renderAdminMedia("video/");
  else if (adminCurrentTab === "file") renderAdminMedia("file");
  else if (adminCurrentTab === "musik") renderAdminSongs();
  initReveal();
}

function adminTab(tab) {
  adminCurrentTab = tab;
  renderAdmin();
}

function adminRingkasanHtml() {
  let msg = 0, img = 0, vid = 0, audio = 0, file = 0, song = 0;
  getAllAnggota().forEach((m) => {
    msg += getMessages(m.id).length;
    getMedia(m.id).forEach((x) => {
      if (x.type.startsWith("image/")) img++;
      else if (x.type.startsWith("video/")) vid++;
      else if (x.type.startsWith("audio/")) audio++;
      else file++;
    });
    song += getAllSongs(m).length;
  });
  const stats = [
    { label: "Anggota", value: getAllAnggota().length },
    { label: "Komentar", value: msg },
    { label: "Foto", value: img },
    { label: "Video", value: vid },
    { label: "File", value: file },
    { label: "Lagu", value: song },
  ];
  return `
    <div class="admin-stats">
      ${stats.map((s) => `
        <div class="admin-stat reveal">
          <div class="admin-stat-num">${s.value}</div>
          <div class="admin-stat-label">${s.label}</div>
        </div>`).join("")}
    </div>
    <div class="card reveal">
      <h2 class="section-title"><span class="dot"></span> Selamat Datang di Panel Admin</h2>
      <p>
        Dari panel ini kamu bisa mengelola seluruh konten website kelas: melihat dan menghapus
        <b>komentar</b>, <b>foto</b>, <b>video</b>, <b>file</b>, dan <b>musik</b> dari semua anggota,
        serta <b>membuat akun</b> bagi anggota (tab Tambah Anggota) dan melihat akun yang sudah dibuat.
      </p>
    </div>`;
}

// ===== TAMBAH ANGGOTA (oleh admin) =====
function adminAddHtml() {
  return `
    <div class="admin-tab-head reveal">
      <h2><span class="dot"></span> Tambah Anggota Baru</h2>
      <p>Buat akun & profil untuk orang lain. Mereka tinggal login dengan ID / nama + password yang dibuat.</p>
    </div>
    <div class="card reveal">
      <h2 class="section-title"><span class="dot"></span> Form Profil Baru</h2>
      <form onsubmit="adminAddMember(event)">
        <div class="profile-edit-grid">
          <div class="form-group">
            <label for="amId">ID (username login)</label>
            <input type="text" id="amId" class="form-control" placeholder="mis. dimas" required>
            <p class="song-hint">Tanpa spasi. Password otomatis = ID + "123" (mis. dimas / dimas123).</p>
          </div>
          <div class="form-group">
            <label for="amName">Nama Panggilan</label>
            <input type="text" id="amName" class="form-control" placeholder="mis. Dimas" required>
          </div>
          <div class="form-group">
            <label for="amFullname">Nama Lengkap</label>
            <input type="text" id="amFullname" class="form-control" placeholder="mis. Dimas Prasetyo" required>
          </div>
          <div class="form-group">
            <label for="amBirth">Tanggal Lahir</label>
            <input type="text" id="amBirth" class="form-control" placeholder="mis. 12 Mei 2011">
          </div>
          <div class="form-group">
            <label for="amHobby">Hobi</label>
            <input type="text" id="amHobby" class="form-control" placeholder="mis. Membaca">
          </div>
          <div class="form-group">
            <label for="amMotto">Bio / Motto</label>
            <textarea id="amMotto" class="form-control" rows="2" placeholder="Tulis motto hidup..."></textarea>
          </div>
          <div class="form-group">
            <label for="amPhoto">Foto Profil (opsional)</label>
            <input type="file" id="amPhoto" accept="image/*" class="form-control">
          </div>
        </div>
        <div class="profile-edit-actions">
          <button type="submit" class="btn btn-primary">Buat Akun & Profil</button>
        </div>
      </form>
    </div>`;
}

function clearAddForm() {
  ["amId", "amName", "amFullname", "amBirth", "amHobby", "amMotto", "amPhoto"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

function adminAddMember(e) {
  e.preventDefault();
  const id = document.getElementById("amId").value.trim();
  const name = document.getElementById("amName").value.trim();
  const fullname = document.getElementById("amFullname").value.trim();
  const birth = document.getElementById("amBirth").value.trim();
  const hobby = document.getElementById("amHobby").value.trim();
  const motto = document.getElementById("amMotto").value.trim();
  if (!id || !name || !fullname) {
    toast("ID, nama panggilan, dan nama lengkap wajib diisi.", "error");
    return;
  }
  if (/\s/.test(id)) {
    toast("ID tidak boleh mengandung spasi.", "error");
    return;
  }
  const existing = getAllAnggota().some((m) => m.id.toLowerCase() === id.toLowerCase());
  if (existing) {
    toast('ID "' + id + '" sudah dipakai anggota lain.', "error");
    return;
  }
  const member = { id, name, fullname, gender: "", birth, hobby, motto, role: "Anggota", sosmed: {}, songs: [], created: new Date().toISOString() };
  const file = document.getElementById("amPhoto").files[0];
  if (file) {
    if (file.size > 2 * 1024 * 1024) {
      toast("Foto maksimal 2MB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      member.photo = reader.result;
      const custom = getCustomMembers();
      custom.push(member);
      saveCustomMembers(custom);
      clearAddForm();
      renderAdmin();
      toast('Anggota "' + name + '" berhasil dibuat! Login: ' + id + " / " + id + "123");
    };
    reader.readAsDataURL(file);
    return;
  }
  const custom = getCustomMembers();
  custom.push(member);
  saveCustomMembers(custom);
  clearAddForm();
  renderAdmin();
  toast('Anggota "' + name + '" berhasil dibuat! Login: ' + id + " / " + id + "123");
}

function adminDeleteMember(memberId) {
  const member = getMemberById(memberId);
  const isCustom = getCustomMembers().some((m) => m.id === memberId);
  confirmAction({
    title: "Hapus anggota?",
    message:
      'Anggota "' +
      (member ? member.fullname || member.name : memberId) +
      '" beserta semua komentar, foto, file, dan lagunya akan dihapus permanen.',
    confirmText: "Hapus",
    onConfirm: () => {
      const deleted = getDeletedIds();
      if (!deleted.includes(memberId)) deleted.push(memberId);
      saveDeletedIds(deleted);
      if (isCustom) {
        saveCustomMembers(getCustomMembers().filter((m) => m.id !== memberId));
      }
      localStorage.removeItem(LS_MSG_PREFIX + memberId);
      localStorage.removeItem(LS_MEDIA_PREFIX + memberId);
      localStorage.removeItem(LS_SONG_PREFIX + memberId);
      localStorage.removeItem(LS_SONG_REMOVED_PREFIX + memberId);
      localStorage.removeItem(LS_PROFILE_PREFIX + memberId);
      localStorage.removeItem(LS_OWNER_PREFIX + memberId);
      renderAdmin();
      toast("Anggota dihapus.");
    },
  });
}

function adminCommentsHtml() {
  const all = [];
  getAllAnggota().forEach((m) => {
    getMessages(m.id).forEach((msg, i) => {
      all.push({ memberId: m.id, memberName: m.name, index: i, msg });
    });
  });
  all.sort((a, b) => (b.msg.ts || 0) - (a.msg.ts || 0));
  if (!all.length) return '<div class="empty">Belum ada komentar dari siapa pun.</div>';
  return all.map((item) => `
    <div class="msg-item has-del">
      <button class="del-msg" onclick="adminDeleteMsg('${item.memberId}',${item.index})" title="Hapus">${ICON_TRASH}</button>
      <div class="msg-head">
        <div class="msg-from">${esc(item.msg.from)} <span class="msg-owner">ke ${esc(item.memberName)}</span></div>
        <div class="msg-time">${esc(item.msg.time)}</div>
      </div>
      <div class="msg-text">${esc(item.msg.text)}</div>
    </div>`).join("");
}

function renderAdminComments() {
  const content = document.getElementById("adminContent");
  content.innerHTML = `
    <div class="admin-tab-head reveal">
      <h2><span class="dot"></span> Komentar</h2>
      <p>Semua pesan dari teman-teman ke profil setiap anggota.</p>
    </div>
    <div class="card reveal"><div class="msg-list">${adminCommentsHtml()}</div></div>`;
}

function adminDeleteMsg(memberId, index) {
  const member = getMemberById(memberId);
  const messages = getMessages(memberId);
  if (index < 0 || index >= messages.length) return;
  const msg = messages[index];
  confirmAction({
    title: "Hapus komentar?",
    message: 'Komentar dari "' + msg.from + '" ke profil ' + (member ? member.name : memberId) + " akan dihapus.",
    onConfirm: () => {
      const m = getMessages(memberId);
      m.splice(index, 1);
      saveMessages(memberId, m);
      renderAdmin();
      toast("Komentar dihapus.");
    },
  });
}

function collectMediaOfType(filter) {
  const all = [];
  getAllAnggota().forEach((m) => {
    getMedia(m.id).forEach((media, i) => {
      const isImg = media.type.startsWith("image/");
      const isVid = media.type.startsWith("video/");
      const isAud = media.type.startsWith("audio/");
      let match = false;
      if (filter === "file") match = !isImg && !isVid && !isAud;
      else match = media.type.startsWith(filter);
      if (match) all.push({ memberId: m.id, memberName: m.name, index: i, media });
    });
  });
  all.sort((a, b) => {
    const ta = a.media.time ? new Date(a.media.time).getTime() : 0;
    const tb = b.media.time ? new Date(b.media.time).getTime() : 0;
    return tb - ta;
  });
  return all;
}

function renderAdminMedia(filter) {
  const content = document.getElementById("adminContent");
  const all = collectMediaOfType(filter);
  const titles = { "image/": "Foto", "video/": "Video", file: "File" };
  content.innerHTML = `
    <div class="admin-tab-head reveal">
      <h2><span class="dot"></span> ${titles[filter]}</h2>
      <p>Semua ${titles[filter].toLowerCase()} yang diunggah anggota kelas.</p>
    </div>
    <div class="card reveal">
      ${all.length ? `
        <div class="media-grid">
          ${all.map((item) => `
            <div class="media-item">
              ${mediaPreview(item.media)}
              <div class="media-owner">${esc(item.memberName)}</div>
              <button class="del-media" onclick="adminDeleteMedia('${item.memberId}',${item.index})" title="Hapus">${ICON_TRASH}</button>
            </div>`).join("")}
        </div>`
      : '<div class="empty">Tidak ada ' + titles[filter].toLowerCase() + ".</div>"}
    </div>`;
}

function adminDeleteMedia(memberId, index) {
  const media = getMedia(memberId);
  if (index < 0 || index >= media.length) return;
  const file = media[index];
  confirmAction({
    title: "Hapus file?",
    message: 'File "' + file.name + '" akan dihapus dari profil ' + (getMemberById(memberId) ? getMemberById(memberId).name : memberId) + ".",
    onConfirm: () => {
      const m = getMedia(memberId);
      m.splice(index, 1);
      saveMedia(memberId, m);
      renderAdmin();
      toast("Media dihapus.");
    },
  });
}

function collectAllSongsAdmin() {
  const all = [];
  getAllAnggota().forEach((m) => {
    getAllSongsWithSource(m).forEach((item) => {
      all.push({ memberId: m.id, memberName: m.name, song: item.song, source: item.source });
    });
  });
  return all;
}

function adminSongCardHtml(item) {
  const { song, memberName, source } = item;
  const parsed = parseSongUrl(song.url);
  const tag = songPlatformTag(song);
  let player = "";
  if (parsed && parsed.type === "mp3") {
    player = `
      <div class="song-player open" data-type="audio">
        <audio src="${esc(song.url)}" preload="none"></audio>
        <div class="mini-player">
          <div class="mini-progress" onclick="seekSong(event, this)"><div class="mini-progress-fill"></div></div>
          <div class="mini-time"><span class="mini-current">0:00</span><span>&bull;</span><span class="mini-duration">0:00</span></div>
        </div>
      </div>`;
  } else {
    player = `<div class="song-player">${songEmbedHtml(song)}</div>`;
  }
  return `
    <div class="song-card">
      <button class="del-song" onclick="adminDeleteSong('${item.memberId}','${escAttr(song.url)}')" title="Hapus">${ICON_TRASH}</button>
      <div class="song-card-head">
        <div class="song-cover">${ICON_NOTE}</div>
        <div class="song-meta">
          <div class="song-title">${esc(song.title)} ${tag}</div>
          <div class="song-artist">${esc(song.artist)}</div>
          <div class="song-artist" style="margin-top:0.15rem">milik <b>${esc(memberName)}</b> <span class="msg-owner">(${source})</span></div>
        </div>
        <button class="song-play" onclick="toggleSongPlayer(this)" title="Putar">${ICON_PLAY}</button>
      </div>
      ${player}
    </div>`;
}

function renderAdminSongs() {
  const content = document.getElementById("adminContent");
  const all = collectAllSongsAdmin();
  content.innerHTML = `
    <div class="admin-tab-head reveal">
      <h2><span class="dot"></span> Musik</h2>
      <p>Semua lagu favorit milik anggota, lengkap dengan pemiliknya.</p>
    </div>
    <div class="card reveal">
      ${all.length ? all.map((item) => adminSongCardHtml(item)).join("") : '<div class="empty">Belum ada lagu.</div>'}
    </div>`;
  wireSongAudios();
}

function adminDeleteSong(memberId, url) {
  const member = getMemberById(memberId);
  if (!member) return;
  const items = getAllSongsWithSource(member);
  const item = items.find((i) => i.song.url === url);
  if (!item) return;
  confirmAction({
    title: "Hapus lagu?",
    message: 'Lagu "' + item.song.title + '" milik ' + member.name + " akan dihapus.",
    onConfirm: () => {
      if (item.source === "extra") {
        saveExtraSongs(member.id, getExtraSongs(member.id).filter((s) => s.url !== url));
      } else {
        const removed = getRemovedSongUrls(member.id);
        if (!removed.includes(url)) removed.push(url);
        saveRemovedSongUrls(member.id, removed);
      }
      renderAdmin();
      toast("Lagu dihapus.");
    },
  });
}

function renderMessages() {
  const list = document.getElementById("msgList");
  const member = getMemberById(currentMemberId);
  if (!member || !list) return;
  const me = getSession();
  const myName = me ? me.name : "";
  const canEdit = canManageProfile(member.id);
  const messages = getMessages(member.id);
  if (messages.length === 0) {
    list.innerHTML = '<div class="empty">Belum ada pesan. Jadilah yang pertama memberi semangat!</div>';
    return;
  }
  list.innerHTML = messages
    .map((msg, i) => {
      const isMine = myName && msg.from === myName;
      return `
        <div class="msg-item ${isMine ? "has-del" : ""}">
          ${canEdit && isMine ? `<button class="del-msg" onclick="deleteMessage(${i})" title="Hapus pesan">${ICON_TRASH}</button>` : ""}
          <div class="msg-head">
            <div class="msg-from">${esc(msg.from)}</div>
            <div class="msg-time">${esc(msg.time)}</div>
          </div>
          <div class="msg-text">${esc(msg.text)}</div>
        </div>`;
    })
    .reverse()
    .join("");
}

function deleteMessage(index) {
  if (!canManageProfile(currentMemberId)) {
    toast("Kamu tidak punya izin menghapus pesan.", "error");
    return;
  }
  const member = getMemberById(currentMemberId);
  if (!member) return;
  const messages = getMessages(member.id);
  if (index < 0 || index >= messages.length) return;
  const msg = messages[index];
  confirmAction({
    title: "Hapus pesan?",
    message: 'Pesan dari "' + msg.from + '" akan dihapus.',
    onConfirm: () => {
      const m = getMessages(member.id);
      m.splice(index, 1);
      saveMessages(member.id, m);
      renderMessages();
      toast("Pesan dihapus.");
    },
  });
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
    ts: Date.now(),
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
  const canEdit = canManageProfile(currentMemberId);
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
          ${canEdit ? `<button class="del-media" onclick="deleteMedia(${i})" title="Hapus">${ICON_TRASH}</button>` : ""}
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
  const registeredOnly = isRegisteredOnly();
  const files = document.getElementById("fileInput").files;
  if (files.length === 0) {
    toast("Pilih file terlebih dahulu.", "error");
    return;
  }
  let media = getMedia(member.id);
  let pending = files.length;
  let failed = 0;

  Array.from(files).forEach((file) => {
    const allowed = registeredOnly
      ? file.type.startsWith("image/") || file.type.startsWith("audio/")
      : true;
    if (!allowed || file.size > 3 * 1024 * 1024) {
      failed++;
      pending--;
      if (pending === 0) {
        saveMedia(member.id, media);
        finishUpload(failed);
      }
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
      if (pending === 0) {
        saveMedia(member.id, media);
        finishUpload(failed);
      }
    };
    reader.readAsDataURL(file);
  });
}

function finishUpload(failed) {
  document.getElementById("fileInput").value = "";
  renderMedia();
  if (failed > 0) {
    const hint = isRegisteredOnly()
      ? "Hanya gambar, sticker, gift, atau sound (audio) yang boleh diupload. Maks. 3MB per file."
      : "Maks. 3MB per file.";
    toast(failed + " file dilewati. " + hint, "error");
  } else {
    toast("Upload berhasil!");
  }
}

function deleteMedia(index) {
  if (!canManageProfile(currentMemberId)) {
    toast("Kamu tidak punya izin menghapus media.", "error");
    return;
  }
  const member = getMemberById(currentMemberId);
  if (!member) return;
  const media = getMedia(member.id);
  if (index < 0 || index >= media.length) return;
  const file = media[index];
  confirmAction({
    title: "Hapus file?",
    message: 'File "' + file.name + '" akan dihapus.',
    onConfirm: () => {
      const m = getMedia(member.id);
      m.splice(index, 1);
      saveMedia(member.id, m);
      renderMedia();
      toast("Media dihapus.");
    },
  });
}

// ===== LAGU =====
function addSong() {
  if (!canManageProfile(currentMemberId)) {
    toast("Kamu tidak punya izin menambah lagu.", "error");
    return;
  }
  const member = getMemberById(currentMemberId);
  if (!member) return;
  const title = document.getElementById("songTitle").value.trim();
  const artist = document.getElementById("songArtist").value.trim();
  const url = document.getElementById("songUrl").value.trim();
  if (!title || !url) {
    toast("Judul dan link lagu wajib diisi.", "error");
    return;
  }
  if (!parseSongUrl(url)) {
    toast("Link tidak dikenali. Gunakan link Spotify, YouTube, TikTok, atau file audio.", "error");
    return;
  }
  if (parseSongUrl(url).type === "tiktok-short") {
    toast("Link TikTok pendek tidak bisa diputar. Salin link video lengkap (tiktok.com/@user/video/...).", "error");
    return;
  }
  const extra = getExtraSongs(member.id);
  extra.push({ title, artist: artist || "Unknown", url });
  saveExtraSongs(member.id, extra);
  document.getElementById("songTitle").value = "";
  document.getElementById("songArtist").value = "";
  document.getElementById("songUrl").value = "";
  renderSongList();
  toast("Lagu berhasil ditambahkan!");
}

// ===== LOGIN & REGISTER =====
function handleLogin(e) {
  e.preventDefault();
  const users = getUsers();
  const rawName = document.getElementById("loginName").value.trim();
  const password = document.getElementById("loginPassword").value;
  const alertBox = document.getElementById("loginAlert");
  const lower = rawName.toLowerCase();

  // 1) Akun anggota yang dibuat admin (Panel Admin > Tambah Anggota)
  const member = getCustomMembers().find(
    (m) =>
      m.id.toLowerCase() === lower ||
      m.name.toLowerCase() === lower ||
      m.fullname.toLowerCase() === lower
  );
  if (member) {
    if (password.toLowerCase() === (member.id + "123").toLowerCase()) {
      setSession({ name: member.name, memberId: member.id, owner: true });
      showView("dashboard");
      toast("Halo " + member.name + "! Kamu masuk sebagai pemilik akun.");
      return;
    }
    alertBox.className = "alert error";
    alertBox.textContent =
      'Password salah untuk akun "' + member.name + '". Gunakan password ID-nya (mis. ' + member.id + "123).";
    return;
  }

  // 2) Akun terdaftar lewat register
  const u = users[lower];
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

// ===== LOGIN & LOGOUT ADMIN =====
function showAdminLogin() {
  document.getElementById("adminAlert").className = "alert";
  document.getElementById("adminAlert").textContent = "";
  showView("adminlogin");
}

function handleAdminLogin(e) {
  e.preventDefault();
  const user = document.getElementById("adminUser").value.trim().toLowerCase();
  const pass = document.getElementById("adminPass").value;
  const alertBox = document.getElementById("adminAlert");
  if (user === "admin" && pass === getAdminPassword()) {
    localStorage.setItem(LS_ADMIN, "1");
    setSession({ name: "Admin" });
    adminCurrentTab = "ringkasan";
    showView("admin");
    toast("Selamat datang di Panel Admin!");
  } else {
    alertBox.className = "alert error";
    alertBox.textContent = "Username atau password admin salah.";
  }
}

function adminLogout() {
  localStorage.removeItem(LS_ADMIN);
  showView("login");
  toast("Keluar dari panel admin.");
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
