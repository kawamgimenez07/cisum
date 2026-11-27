const genres = ["Todos", "Traps", "Rap", "Funk", "MPB", "Sertanejo", "Rock"];

let tracks = [];
let currentGenre = "Todos";
let searchQuery = "";
let currentTrackUrl = null;
let isShuffle = false;
let isLoop = false;

const audio = document.getElementById("audio-player");
const titleEl = document.getElementById("track-title");
const genreEl = document.getElementById("track-genre");
const countEl = document.getElementById("track-count");
const playlistEl = document.getElementById("playlist");
const filtersEl = document.getElementById("genre-filters");
const searchInput = document.getElementById("search-input");

const btnPlay = document.getElementById("btn-play");
const iconPlay = document.getElementById("icon-play");
const iconPause = document.getElementById("icon-pause");
const equalizer = document.getElementById("equalizer");
const progressBar = document.getElementById("progress-bar");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");
const btnShuffle = document.getElementById("btn-shuffle");
const btnLoop = document.getElementById("btn-loop");


function cleanTitle(raw) {
  return raw
    .replace(/\s*\[[a-zA-Z0-9_-]{8,}\]\s*/g, "")
    .replace(/\s*\((Clipe Oficial|Video Clipe|Videoclipe Oficial|Official Video|Official Audio|Visualizer|Lyric Video Oficial)\)/gi, "")
    .trim();
}

function formatTime(sec) {
  if (!Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function toStreamUrl(track) {
  if (track.url) return track.url;
  const rawUrl = track.driveUrl || "";
  const match =
    rawUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
    rawUrl.match(/id=([a-zA-Z0-9_-]+)/);
  if (!match) return rawUrl;
  return `https://drive.usercontent.google.com/download?id=${match[1]}&export=download`;
}

function getFilteredTracks() {
  return tracks.filter((t) => {
    const matchesGenre = currentGenre === "Todos" || t.genre === currentGenre;
    const matchesSearch =
      !searchQuery ||
      cleanTitle(t.title).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGenre && matchesSearch;
  });
}

function updatePlayUI(isPlaying) {
  iconPlay.classList.toggle("hidden", isPlaying);
  iconPause.classList.toggle("hidden", !isPlaying);
  equalizer.classList.toggle("hidden", !isPlaying);
  equalizer.classList.toggle("flex", isPlaying);
}

function updateProgressVisual() {
  const pct = (progressBar.value / (progressBar.max || 100)) * 100;
  progressBar.style.background = `linear-gradient(to right, #6d5dfc ${pct}%, #27272a ${pct}%)`;
}

function renderFilters() {
  filtersEl.innerHTML = "";
  genres.forEach((genre) => {
    const active = genre === currentGenre;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = active
      ? "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-brand text-white border border-brand-light shadow-md shadow-brand/30 transition"
      : "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-zinc-950 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200 transition";
    btn.textContent = genre;
    btn.onclick = () => {
      currentGenre = genre;
      renderFilters();
      renderPlaylist();
    };
    filtersEl.appendChild(btn);
  });
}

function renderPlaylist() {
  const list = getFilteredTracks();
  countEl.textContent = `${list.length} ${list.length === 1 ? "faixa" : "faixas"}`;
  playlistEl.innerHTML = "";

  if (!list.length) {
    playlistEl.innerHTML = `
      <li class="rounded-xl bg-zinc-950/60 border border-zinc-900 p-6 text-center text-sm text-zinc-500">
        Nenhuma música encontrada.
      </li>`;
    return;
  }

  list.forEach((track, idx) => {
    const streamUrl = toStreamUrl(track);
    const isCurrent = streamUrl === currentTrackUrl;
    const displayTitle = cleanTitle(track.title);

    const li = document.createElement("li");
    li.className = isCurrent
      ? "group flex items-center justify-between gap-3 p-3.5 rounded-xl bg-brand/25 border border-brand-light/70 cursor-pointer transition"
      : "group flex items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-900/90 border border-zinc-900 hover:border-zinc-800 cursor-pointer transition";

    li.innerHTML = `
      <div class="flex items-center gap-3 min-w-0">
        <span class="w-6 text-center text-xs font-mono ${isCurrent ? "text-brand-light font-bold" : "text-zinc-600 group-hover:text-zinc-400"}">
          ${isCurrent ? "▶" : idx + 1}
        </span>
        <span class="text-sm font-medium truncate ${isCurrent ? "text-white" : "text-zinc-200"}">
          ${displayTitle}
        </span>
      </div>
      <span class="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-400 border border-zinc-800">
        ${track.genre}
      </span>
    `;

    li.onclick = () => playTrack(track);
    playlistEl.appendChild(li);
  });
}

function playTrack(track) {
  if (!track) return;
  const streamUrl = toStreamUrl(track);
  currentTrackUrl = streamUrl;

  titleEl.textContent = cleanTitle(track.title);
  genreEl.textContent = track.genre;
  audio.src = streamUrl;
  audio.play().then(() => updatePlayUI(true)).catch(() => updatePlayUI(false));
  renderPlaylist();
}


btnPlay.onclick = () => {
  if (!audio.src) {
    const list = getFilteredTracks();
    if (list.length) playTrack(list[0]);
    return;
  }
  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
};

audio.addEventListener("play", () => updatePlayUI(true));
audio.addEventListener("pause", () => updatePlayUI(false));

audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;
  progressBar.max = Math.floor(audio.duration);
  progressBar.value = Math.floor(audio.currentTime);
  currentTimeEl.textContent = formatTime(audio.currentTime);
  durationEl.textContent = formatTime(audio.duration);
  updateProgressVisual();
});

progressBar.addEventListener("input", () => {
  audio.currentTime = progressBar.value;
  updateProgressVisual();
});

document.getElementById("btn-prev").onclick = () => {
  const list = getFilteredTracks();
  if (!list.length) return;
  const idx = list.findIndex((t) => toStreamUrl(t) === currentTrackUrl);
  const prevIdx = idx <= 0 ? list.length - 1 : idx - 1;
  playTrack(list[prevIdx]);
};

document.getElementById("btn-next").onclick = () => {
  const list = getFilteredTracks();
  if (!list.length) return;

  if (isShuffle && list.length > 1) {
    let randIdx;
    const currIdx = list.findIndex((t) => toStreamUrl(t) === currentTrackUrl);
    do {
      randIdx = Math.floor(Math.random() * list.length);
    } while (randIdx === currIdx);
    playTrack(list[randIdx]);
    return;
  }

  const idx = list.findIndex((t) => toStreamUrl(t) === currentTrackUrl);
  const nextIdx = idx >= list.length - 1 ? 0 : idx + 1;
  playTrack(list[nextIdx]);
};

btnShuffle.onclick = () => {
  isShuffle = !isShuffle;
  btnShuffle.classList.toggle("text-brand-light", isShuffle);
  btnShuffle.classList.toggle("bg-brand/20", isShuffle);
  btnShuffle.classList.toggle("text-zinc-400", !isShuffle);
};

btnLoop.onclick = () => {
  isLoop = !isLoop;
  audio.loop = isLoop;
  btnLoop.classList.toggle("text-brand-light", isLoop);
  btnLoop.classList.toggle("bg-brand/20", isLoop);
  btnLoop.classList.toggle("text-zinc-400", !isLoop);
};

audio.addEventListener("ended", () => {
  if (!isLoop) document.getElementById("btn-next").click();
});

searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  renderPlaylist();
});

async function loadTracks() {
  try {
    titleEl.textContent = "Carregando músicas...";
    const res = await fetch("./musicas.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Falha ao carregar musicas.json");
    tracks = await res.json();
    titleEl.textContent = "Toque em uma música";
    updateProgressVisual();
    renderFilters();
    renderPlaylist();
  } catch (err) {
    titleEl.textContent = "Erro ao carregar musicas.json";
    console.error(err);
  }
}

loadTracks();
