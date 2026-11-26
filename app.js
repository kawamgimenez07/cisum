const genres = ["Todos", "Traps", "Rap", "Funk", "MPB", "Sertanejo", "Rock"];

let tracks = [];
let currentGenre = "Todos";
let currentIndex = -1;

const audio = document.getElementById("audio-player");
const titleEl = document.getElementById("track-title");
const genreEl = document.getElementById("track-genre");
const playlistEl = document.getElementById("playlist");
const filtersEl = document.getElementById("genre-filters");

function toStreamUrl(url) {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  if (!match) return url;
  return `https://docs.google.com/uc?export=open&id=${match[1]}`;
}

function getFilteredTracks() {
  if (currentGenre === "Todos") return tracks;
  return tracks.filter((t) => t.genre === currentGenre);
}

function renderFilters() {
  filtersEl.innerHTML = "";
  genres.forEach((genre) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `filter-btn ${genre === currentGenre ? "active" : ""}`;
    btn.textContent = genre;
    btn.onclick = () => {
      currentGenre = genre;
      currentIndex = -1;
      renderFilters();
      renderPlaylist();
    };
    filtersEl.appendChild(btn);
  });
}

function renderPlaylist() {
  const list = getFilteredTracks();
  playlistEl.innerHTML = "";

  if (!list.length) {
    playlistEl.innerHTML = `<li class="track-item"><span class="track-name">Nenhuma música nesse gênero ainda.</span></li>`;
    return;
  }

  list.forEach((track, idx) => {
    const li = document.createElement("li");
    li.className = `track-item ${idx === currentIndex ? "active" : ""}`;
    li.innerHTML = `
      <span class="track-name">${track.title}</span>
      <span class="track-tag">${track.genre}</span>
    `;
    li.onclick = () => playTrack(idx);
    playlistEl.appendChild(li);
  });
}

function playTrack(index) {
  const list = getFilteredTracks();
  if (!list[index]) return;

  currentIndex = index;
  const track = list[index];

  titleEl.textContent = track.title;
  genreEl.textContent = track.genre;
  audio.src = toStreamUrl(track.driveUrl);
  audio.play().catch(() => {});
  renderPlaylist();
}

document.getElementById("btn-prev").onclick = () => {
  const list = getFilteredTracks();
  if (!list.length) return;
  const prev = currentIndex <= 0 ? list.length - 1 : currentIndex - 1;
  playTrack(prev);
};

document.getElementById("btn-next").onclick = () => {
  const list = getFilteredTracks();
  if (!list.length) return;
  const next = currentIndex >= list.length - 1 ? 0 : currentIndex + 1;
  playTrack(next);
};

audio.addEventListener("ended", () => {
  document.getElementById("btn-next").click();
});

async function loadTracks() {
  try {
    titleEl.textContent = "Carregando músicas...";
    const res = await fetch("./musicas.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Falha ao carregar musicas.json");
    tracks = await res.json();
    titleEl.textContent = "Toque em uma música";
    renderFilters();
    renderPlaylist();
  } catch (err) {
    titleEl.textContent = "Erro ao carregar musicas.json";
    console.error(err);
  }
}

loadTracks();
