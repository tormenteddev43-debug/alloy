const STORAGE_KEY = "alloy-artists-v1";
const DEFAULT_LINKS = [
  { label: "Instagram", url: "" },
  { label: "Facebook", url: "" },
  { label: "TikTok", url: "" },
  { label: "Website", url: "" },
  { label: "Booking", url: "" }
];

const seed = [
  {
    id: "novaink",
    name: "Nova Reyes",
    handle: "novaink",
    role: "Tattoo Artist",
    location: "Austin, TX",
    bio: "Blackwork and fine line. Book a consult or follow the shop.",
    links: [
      { label: "Instagram", url: "https://instagram.com" },
      { label: "TikTok", url: "https://tiktok.com" },
      { label: "Booking", url: "https://example.com/book" }
    ]
  },
  {
    id: "faderoom",
    name: "Marcus Cole",
    handle: "faderoom",
    role: "Barber",
    location: "Atlanta, GA",
    bio: "Skin fades, beard work, and same-week appointments.",
    links: [
      { label: "Instagram", url: "https://instagram.com" },
      { label: "Facebook", url: "https://facebook.com" },
      { label: "Booking", url: "https://example.com/book" }
    ]
  }
];

const els = {
  views: {
    home: document.getElementById("view-home"),
    studio: document.getElementById("view-studio"),
    profile: document.getElementById("view-profile")
  },
  form: document.getElementById("artist-form"),
  links: document.getElementById("links-editor"),
  directory: document.getElementById("directory"),
  profile: document.getElementById("profile-root"),
  addLink: document.getElementById("add-link")
};

let cache = null;
let formReady = false;

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function loadArtists() {
  if (cache) return cache;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    cache = seed;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return cache;
  }
  try {
    cache = JSON.parse(raw);
  } catch {
    cache = seed;
  }
  return cache;
}

function saveArtists(artists) {
  cache = artists;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(artists));
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "artist";
}

function initials(name) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function showView(name) {
  Object.entries(els.views).forEach(([key, node]) => {
    const on = key === name;
    node.classList.toggle("hidden", !on);
    node.hidden = !on;
  });
  document.querySelectorAll("[data-view]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === name);
  });
  if (window.scrollY > 0) window.scrollTo(0, 0);
}

function linkRow(link = { label: "", url: "" }) {
  const row = document.createElement("div");
  row.className = "link-row";
  row.innerHTML = `
    <input class="link-label" placeholder="Instagram" value="${escapeHtml(link.label)}" inputmode="text">
    <input class="link-url" placeholder="https://" value="${escapeHtml(link.url)}" inputmode="url" autocapitalize="none">
    <button type="button" class="remove-link" aria-label="Remove link">Remove</button>
  `;
  return row;
}

function ensureForm() {
  if (formReady) return;
  els.links.replaceChildren(...DEFAULT_LINKS.map((link) => linkRow(link)));
  formReady = true;
}

function renderDirectory(artists) {
  if (!artists.length) {
    els.directory.innerHTML = `<p class="empty">No artists yet. Add one in Studio.</p>`;
    return;
  }
  els.directory.innerHTML = artists.map((artist) => `
    <article class="artist-card" data-id="${escapeHtml(artist.id)}">
      <div class="avatar">${escapeHtml(initials(artist.name))}</div>
      <div class="role">${escapeHtml(artist.role)}</div>
      <h3>${escapeHtml(artist.name)}</h3>
      <p>@${escapeHtml(artist.handle)} · ${escapeHtml(artist.location || "Anywhere")}</p>
    </article>
  `).join("");
}

function renderProfile(artist) {
  const links = (artist.links || []).filter((item) => item.url);
  els.profile.innerHTML = `
    <div class="profile-card">
      <div class="avatar">${escapeHtml(initials(artist.name))}</div>
      <div class="role">${escapeHtml(artist.role)}</div>
      <h1>${escapeHtml(artist.name)}</h1>
      <p class="sub">@${escapeHtml(artist.handle)}${artist.location ? " · " + escapeHtml(artist.location) : ""}</p>
      <p>${escapeHtml(artist.bio)}</p>
      <div class="socials">
        ${links.map((link) => `
          <a class="social" href="${escapeHtml(link.url)}" target="_blank" rel="noopener">
            <strong>${escapeHtml(link.label)}</strong>
            <span>Open</span>
          </a>
        `).join("") || `<p class="empty">No links added yet.</p>`}
      </div>
    </div>
  `;
}

function openProfile(id) {
  const artist = loadArtists().find((item) => item.id === id);
  if (!artist) return;
  if (location.hash !== `#/u/${artist.id}`) location.hash = `#/u/${artist.id}`;
  renderProfile(artist);
  showView("profile");
}

function route() {
  const hash = location.hash;
  const match = hash.match(/^#\/u\/(.+)$/);
  if (match) {
    const artist = loadArtists().find((item) => item.id === match[1]);
    if (artist) {
      renderProfile(artist);
      showView("profile");
      return;
    }
  }
  if (hash === "#studio") {
    ensureForm();
    showView("studio");
    return;
  }
  showView("home");
}

document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-view]");
  if (nav) {
    const view = nav.dataset.view;
    if (view === "studio") location.hash = "#studio";
    else if (view === "home") location.hash = "";
    return;
  }
  const card = event.target.closest(".artist-card");
  if (card) {
    openProfile(card.dataset.id);
    return;
  }
  if (event.target.closest(".remove-link")) {
    event.target.closest(".link-row")?.remove();
  }
});

els.addLink.addEventListener("click", () => {
  ensureForm();
  els.links.append(linkRow());
});

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(els.form);
  const name = String(data.get("name") || "").trim();
  if (!name) return;

  const handle = slugify(String(data.get("handle") || name));
  const links = [...els.links.querySelectorAll(".link-row")].map((row) => ({
    label: row.querySelector(".link-label").value.trim() || "Link",
    url: row.querySelector(".link-url").value.trim()
  })).filter((link) => link.url);

  const artist = {
    id: handle,
    name,
    handle,
    role: String(data.get("role") || "Artist"),
    location: String(data.get("location") || ""),
    bio: String(data.get("bio") || ""),
    links
  };
  saveArtists([artist, ...loadArtists().filter((item) => item.id !== handle)]);
  renderDirectory(cache);
  els.form.reset();
  formReady = false;
  ensureForm();
  openProfile(handle);
});

renderDirectory(loadArtists());
window.addEventListener("hashchange", route);
route();
