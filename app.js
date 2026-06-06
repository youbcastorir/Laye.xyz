// ============================================================
// LAYE MOVIES — Main Application
// Routing, state, UI rendering, reels player, favorites,
// watch history, i18n, and all UI interactions.
// ============================================================

(function () {
  "use strict";

  // ── STATE ────────────────────────────────────────────────
  const state = {
    lang: localStorage.getItem("laye_lang") || "en",
    favorites: JSON.parse(localStorage.getItem("laye_favorites") || "[]"),
    watchLater: JSON.parse(localStorage.getItem("laye_watch_later") || "[]"),
    history: JSON.parse(localStorage.getItem("laye_history") || "[]"),
    currentView: "home", // home | reels | movie | search | favorites | discover
    currentMovie: null,
    reelIndex: 0,
    reelMovies: [],
    searchQuery: "",
    searchFilters: {},
    darkMode: true,
  };

  // ── HELPERS ──────────────────────────────────────────────
  const t = key => (I18N[state.lang] || I18N.en)[key] || key;
  const isRTL = () => state.lang === "ar";

  const save = () => {
    localStorage.setItem("laye_favorites", JSON.stringify(state.favorites));
    localStorage.setItem("laye_watch_later", JSON.stringify(state.watchLater));
    localStorage.setItem("laye_history", JSON.stringify(state.history));
    localStorage.setItem("laye_lang", state.lang);
  };

  const addHistory = id => {
    state.history = [id, ...state.history.filter(x => x !== id)].slice(0, 50);
    save();
  };

  const toggleFavorite = id => {
    if (state.favorites.includes(id)) {
      state.favorites = state.favorites.filter(x => x !== id);
    } else {
      state.favorites.unshift(id);
    }
    save();
  };

  const toggleWatchLater = id => {
    if (state.watchLater.includes(id)) {
      state.watchLater = state.watchLater.filter(x => x !== id);
    } else {
      state.watchLater.unshift(id);
    }
    save();
  };

  const ratingStars = r => {
    const full = Math.round(r / 2);
    return "★".repeat(full) + "☆".repeat(5 - full);
  };

  // ── INSTANCES ────────────────────────────────────────────
  const search = new LayeSearch(MOVIES);
  const reco = new LayeRecommendations(MOVIES);

  // ── ROOT RENDER ──────────────────────────────────────────
  const app = document.getElementById("app");

  function render() {
    document.documentElement.dir = isRTL() ? "rtl" : "ltr";
    document.documentElement.lang = state.lang;
    document.title = t("appName") + " — " + t("tagline");

    switch (state.currentView) {
      case "home":     renderHome(); break;
      case "reels":    renderReels(); break;
      case "movie":    renderMoviePage(); break;
      case "search":   renderSearch(); break;
      case "favorites":renderFavorites(); break;
      case "discover": renderDiscover(); break;
      case "category": renderCategory(); break;
      default:         renderHome();
    }

    renderNav();
    bindGlobalEvents();
  }

  // ── NAV ──────────────────────────────────────────────────
  function renderNav() {
    let nav = document.getElementById("bottom-nav");
    if (!nav) {
      nav = document.createElement("nav");
      nav.id = "bottom-nav";
      nav.setAttribute("role", "navigation");
      document.body.appendChild(nav);
    }
    const items = [
      { view: "home", icon: "⌂", label: t("home") },
      { view: "reels", icon: "▶", label: t("reels") },
      { view: "discover", icon: "✦", label: t("discover") },
      { view: "search", icon: "⌕", label: t("search") },
      { view: "favorites", icon: "♥", label: t("favorites") },
    ];
    nav.innerHTML = items.map(it => `
      <button class="nav-btn ${state.currentView === it.view ? "active" : ""}"
        data-nav="${it.view}" aria-label="${it.label}" title="${it.label}">
        <span class="nav-icon">${it.icon}</span>
        <span class="nav-label">${it.label}</span>
      </button>`).join("");
  }

  // ── HOME ──────────────────────────────────────────────────
  function renderHome() {
    const featured = reco.getFeatured(6);
    const trending = reco.getTrending(10);
    const recommended = reco.getForUser(state.history, state.favorites, 8);
    const gems = reco.getHiddenGems(6);

    app.innerHTML = `
      <div class="home-view">
        <header class="home-header">
          <div class="header-logo">
            <span class="logo-mark">L</span>
            <span class="logo-text">${t("appName")}</span>
          </div>
          <div class="header-actions">
            <button class="icon-btn" id="lang-btn" aria-label="Language" title="Language">
              <span class="lang-flag">${langFlag(state.lang)}</span>
            </button>
            <button class="icon-btn" id="search-btn-header" aria-label="${t("search")}">⌕</button>
          </div>
        </header>

        ${featured.length ? heroSection(featured[0]) : ""}

        <div class="home-sections">
          ${sectionRow(t("trending"), trending, "trending")}
          ${recommended.length ? sectionRow(t("featured"), recommended, "recommended") : ""}
          ${genreGrid()}
          ${sectionRow(t("hiddenGems"), gems, "gems")}
        </div>

        <footer class="home-footer">
          <p>🎬 ${t("appName")} — ${t("legal")} · ${t("publicDomain")}</p>
          <p><a href="https://laye.xyz" target="_blank" rel="noopener">laye.xyz</a></p>
        </footer>
      </div>`;
  }

  function heroSection(movie) {
    const isFav = state.favorites.includes(movie.id);
    return `
      <section class="hero-section" style="background-image: url('${movie.backdrop || movie.poster}')">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <div class="hero-badge">✦ ${t("featured")}</div>
          <h1 class="hero-title">${movie.title}</h1>
          <div class="hero-meta">
            <span>${movie.year}</span>
            <span class="dot">·</span>
            <span>${movie.genre[0]}</span>
            <span class="dot">·</span>
            <span>${movie.runtime} ${t("minutes")}</span>
          </div>
          <p class="hero-desc">${movie.description.slice(0, 120)}…</p>
          <div class="hero-actions">
            <button class="btn-primary" data-action="watch" data-id="${movie.id}">
              ▶ ${t("watchNow")}
            </button>
            <button class="btn-ghost ${isFav ? "active" : ""}" data-action="favorite" data-id="${movie.id}">
              ${isFav ? "♥" : "♡"} 
            </button>
          </div>
        </div>
      </section>`;
  }

  function sectionRow(label, movies, key) {
    if (!movies.length) return "";
    return `
      <section class="movie-row-section">
        <div class="section-header">
          <h2 class="section-title">${label}</h2>
          <button class="see-all-btn" data-section="${key}">→</button>
        </div>
        <div class="movie-row" id="row-${key}">
          ${movies.map(movieCard).join("")}
        </div>
      </section>`;
  }

  function movieCard(movie) {
    const isFav = state.favorites.includes(movie.id);
    return `
      <article class="movie-card" data-id="${movie.id}" role="button" tabindex="0"
        aria-label="${movie.title} (${movie.year})">
        <div class="card-poster">
          <img src="${movie.poster}" alt="${movie.title}" loading="lazy"
            onerror="this.src='https://via.placeholder.com/300x450/111/gold?text=${encodeURIComponent(movie.title)}'">
          <div class="card-overlay">
            <button class="card-play" data-action="watch" data-id="${movie.id}" aria-label="Watch ${movie.title}">▶</button>
          </div>
          <button class="card-fav ${isFav ? "active" : ""}" data-action="favorite" data-id="${movie.id}" aria-label="Favorite">
            ${isFav ? "♥" : "♡"}
          </button>
          <div class="card-badge">${movie.license === "Public Domain" ? "PD" : "Free"}</div>
        </div>
        <div class="card-info">
          <h3 class="card-title">${movie.title}</h3>
          <p class="card-meta">${movie.year} · ${movie.genre[0]}</p>
          <div class="card-rating" title="${movie.rating}/10">
            <span class="stars">${ratingStars(movie.rating)}</span>
          </div>
        </div>
      </article>`;
  }

  function genreGrid() {
    const genreIcons = {
      "Classic Cinema": "🎞",
      "Horror": "💀",
      "Science Fiction": "🚀",
      "Comedy": "😄",
      "Drama": "🎭",
      "Adventure": "⚔",
      "Documentary": "📽",
      "Animation": "✨",
      "Historical Films": "🏛",
      "Fantasy": "🔮",
      "Independent Movies": "🎬",
      "Documentaries": "📽"
    };
    const usedGenres = GENRES.slice(0, 10);
    return `
      <section class="genre-section">
        <div class="section-header">
          <h2 class="section-title">${t("categories")}</h2>
        </div>
        <div class="genre-grid">
          ${usedGenres.map(g => `
            <button class="genre-chip" data-category="${g}">
              <span class="genre-icon">${genreIcons[g] || "🎬"}</span>
              <span class="genre-name">${g}</span>
            </button>`).join("")}
        </div>
      </section>`;
  }

  // ── REELS ─────────────────────────────────────────────────
  function renderReels() {
    if (!state.reelMovies.length) {
      state.reelMovies = [...MOVIES].sort(() => Math.random() - 0.5);
      state.reelIndex = 0;
    }

    app.innerHTML = `
      <div class="reels-container" id="reels-container">
        <div class="reels-track" id="reels-track">
          ${state.reelMovies.slice(0, 20).map((m, i) => reelCard(m, i)).join("")}
        </div>
        <div class="reels-overlay-ui">
          <button class="reel-close" data-nav="home" aria-label="Close">✕</button>
          <div class="reel-progress-bar">
            <div class="reel-progress-fill" id="reel-progress"></div>
          </div>
        </div>
        <div class="swipe-hint" id="swipe-hint">
          <span>↑ ${t("swipeHint")}</span>
        </div>
      </div>`;

    initReels();
  }

  function reelCard(movie, index) {
    const isFav = state.favorites.includes(movie.id);
    return `
      <div class="reel-card ${index === 0 ? "active" : ""}" data-index="${index}" data-id="${movie.id}">
        <div class="reel-bg" style="background-image: url('${movie.backdrop || movie.poster}')"></div>
        <div class="reel-gradient"></div>

        <div class="reel-embed-wrapper" id="embed-${index}">
          ${index < 2 ? `
            <iframe
              src="${movie.embedUrl}"
              allowfullscreen
              allow="autoplay; fullscreen"
              loading="${index === 0 ? 'eager' : 'lazy'}"
              title="${movie.title}"
              class="reel-iframe"
            ></iframe>` : `<div class="reel-poster-fallback">
              <img src="${movie.poster}" alt="${movie.title}" loading="lazy">
            </div>`}
        </div>

        <div class="reel-info">
          <div class="reel-badge">${movie.license}</div>
          <h2 class="reel-title">${movie.title}</h2>
          <p class="reel-meta">${movie.year} · ${movie.director} · ${movie.runtime} ${t("minutes")}</p>
          <div class="reel-genres">
            ${movie.genre.slice(0, 2).map(g => `<span class="genre-tag">${g}</span>`).join("")}
          </div>
          <p class="reel-desc">${movie.description.slice(0, 110)}…</p>
          <div class="reel-actions">
            <button class="reel-btn-primary" data-action="watch" data-id="${movie.id}">
              ▶ ${t("watchNow")}
            </button>
            <button class="reel-btn-info" data-action="movie" data-id="${movie.id}">
              ℹ Info
            </button>
          </div>
        </div>

        <div class="reel-side-actions">
          <button class="side-btn ${isFav ? "active" : ""}" data-action="favorite" data-id="${movie.id}"
            aria-label="${t("addFavorite")}">
            <span class="side-icon">${isFav ? "♥" : "♡"}</span>
            <span class="side-label">${t("addFavorite").split(" ")[0]}</span>
          </button>
          <button class="side-btn" data-action="watchlater" data-id="${movie.id}"
            aria-label="${t("watchLater")}">
            <span class="side-icon">⊕</span>
            <span class="side-label">${t("watchLater").split(" ")[0]}</span>
          </button>
          <button class="side-btn" data-action="share" data-id="${movie.id}" aria-label="Share">
            <span class="side-icon">⟳</span>
            <span class="side-label">Share</span>
          </button>
          <div class="side-rating">
            <span class="side-icon">★</span>
            <span class="side-label">${movie.rating}</span>
          </div>
        </div>
      </div>`;
  }

  function initReels() {
    const track = document.getElementById("reels-track");
    if (!track) return;

    let startY = 0;
    let isDragging = false;
    let currentIndex = state.reelIndex;

    const scrollToIndex = (idx) => {
      if (idx < 0 || idx >= state.reelMovies.length) return;
      currentIndex = idx;
      state.reelIndex = idx;
      track.style.transform = `translateY(-${idx * 100}dvh)`;

      // Lazy-load embed for adjacent cards
      const card = document.querySelector(`.reel-card[data-index="${idx}"]`);
      if (card) {
        const movie = state.reelMovies[idx];
        const embedWrapper = card.querySelector(`#embed-${idx}`);
        if (embedWrapper && !embedWrapper.querySelector("iframe")) {
          embedWrapper.innerHTML = `
            <iframe src="${movie.embedUrl}" allowfullscreen
              allow="autoplay; fullscreen" loading="lazy"
              title="${movie.title}" class="reel-iframe"></iframe>`;
        }
        addHistory(movie.id);
      }

      // Progress
      const progress = document.getElementById("reel-progress");
      if (progress) {
        const pct = ((idx + 1) / Math.min(state.reelMovies.length, 20)) * 100;
        progress.style.width = `${pct}%`;
      }

      // Hide swipe hint after first swipe
      if (idx > 0) {
        const hint = document.getElementById("swipe-hint");
        if (hint) hint.style.opacity = "0";
      }

      // Update side buttons
      document.querySelectorAll(".side-btn[data-action='favorite']").forEach(btn => {
        const id = btn.dataset.id;
        btn.classList.toggle("active", state.favorites.includes(id));
        btn.querySelector(".side-icon").textContent = state.favorites.includes(id) ? "♥" : "♡";
      });
    };

    // Touch
    track.addEventListener("touchstart", e => {
      startY = e.touches[0].clientY;
      isDragging = true;
    }, { passive: true });

    track.addEventListener("touchend", e => {
      if (!isDragging) return;
      isDragging = false;
      const diff = startY - e.changedTouches[0].clientY;
      if (Math.abs(diff) > 50) {
        scrollToIndex(currentIndex + (diff > 0 ? 1 : -1));
      }
    }, { passive: true });

    // Mouse wheel
    let wheelTimeout;
    track.addEventListener("wheel", e => {
      e.preventDefault();
      clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => {
        scrollToIndex(currentIndex + (e.deltaY > 0 ? 1 : -1));
      }, 80);
    }, { passive: false });

    // Keyboard
    document.addEventListener("keydown", reelKeyHandler);

    function reelKeyHandler(e) {
      if (state.currentView !== "reels") {
        document.removeEventListener("keydown", reelKeyHandler);
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowRight") scrollToIndex(currentIndex + 1);
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") scrollToIndex(currentIndex - 1);
      if (e.key === "Escape") navigate("home");
    }

    scrollToIndex(currentIndex);
  }

  // ── MOVIE PAGE ────────────────────────────────────────────
  function renderMoviePage() {
    const movie = state.currentMovie;
    if (!movie) { navigate("home"); return; }

    const similar = reco.getSimilar(movie.id, 6);
    const isFav = state.favorites.includes(movie.id);
    const isWL = state.watchLater.includes(movie.id);

    app.innerHTML = `
      <div class="movie-page">
        <div class="movie-hero" style="background-image: url('${movie.backdrop || movie.poster}')">
          <div class="movie-hero-overlay"></div>
          <button class="back-btn" data-nav="back" aria-label="Back">←</button>
          <div class="movie-hero-content">
            <img class="movie-poster" src="${movie.poster}" alt="${movie.title}"
              onerror="this.src='https://via.placeholder.com/300x450/111/gold?text=${encodeURIComponent(movie.title)}'">
            <div class="movie-hero-info">
              <h1 class="movie-title">${movie.title}</h1>
              <div class="movie-meta-row">
                <span class="meta-badge">${movie.year}</span>
                <span class="meta-badge">${movie.runtime} ${t("minutes")}</span>
                <span class="meta-badge license-badge">${movie.license}</span>
              </div>
              <div class="movie-rating">
                <span class="stars">${ratingStars(movie.rating)}</span>
                <span class="rating-num">${movie.rating}/10</span>
              </div>
              <div class="movie-actions">
                <button class="btn-primary large" data-action="watch" data-id="${movie.id}">
                  ▶ ${t("watchNow")}
                </button>
                <button class="btn-ghost ${isFav ? "active" : ""}" data-action="favorite" data-id="${movie.id}">
                  ${isFav ? "♥" : "♡"} ${t("addFavorite")}
                </button>
                <button class="btn-ghost ${isWL ? "active" : ""}" data-action="watchlater" data-id="${movie.id}">
                  ${isWL ? "✓" : "⊕"} ${t("watchLater")}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="movie-details">
          <section class="detail-section">
            <h2 class="detail-heading">Synopsis</h2>
            <p class="movie-description">${movie.description}</p>
          </section>

          <section class="detail-section detail-grid">
            ${detailRow(t("director"), movie.director)}
            ${movie.cast.length ? detailRow(t("cast"), movie.cast.slice(0, 4).join(", ")) : ""}
            ${detailRow(t("genre"), movie.genre.join(", "))}
            ${detailRow(t("language"), LANGUAGES[movie.language] || movie.language)}
            ${detailRow(t("country"), movie.country)}
            ${detailRow(t("source"), `<a href="${movie.watchUrl}" target="_blank" rel="noopener">${movie.source} ↗</a>`)}
            ${detailRow(t("license"), movie.license)}
          </section>

          <section class="detail-section">
            <h2 class="detail-heading">Tags</h2>
            <div class="tags-row">
              ${(movie.tags || []).map(tag => `<span class="tag-chip">#${tag}</span>`).join("")}
            </div>
          </section>

          <section class="detail-section">
            <h2 class="detail-heading">Watch</h2>
            <div class="player-container">
              <iframe
                src="${movie.embedUrl}"
                allowfullscreen
                allow="autoplay; fullscreen"
                loading="lazy"
                title="${movie.title} — Laye Movies"
                class="movie-player"
              ></iframe>
            </div>
            <p class="player-note">
              Streaming courtesy of <strong>${movie.source}</strong> · 
              <a href="${movie.watchUrl}" target="_blank" rel="noopener">Open on ${movie.source} ↗</a>
            </p>
          </section>

          ${similar.length ? `
          <section class="detail-section">
            <h2 class="detail-heading">${t("similarMovies")}</h2>
            <div class="similar-row">
              ${similar.map(movieCard).join("")}
            </div>
          </section>` : ""}
        </div>
      </div>`;
  }

  function detailRow(label, value) {
    return `
      <div class="detail-row">
        <span class="detail-label">${label}</span>
        <span class="detail-value">${value}</span>
      </div>`;
  }

  // ── SEARCH ────────────────────────────────────────────────
  function renderSearch() {
    const results = state.searchQuery
      ? search.search(state.searchQuery, state.searchFilters)
      : search.search("", state.searchFilters);

    app.innerHTML = `
      <div class="search-view">
        <div class="search-header">
          <button class="back-btn" data-nav="back" aria-label="Back">←</button>
          <div class="search-input-wrap">
            <span class="search-icon">⌕</span>
            <input type="search" id="search-input" class="search-input"
              placeholder="${t("search")}"
              value="${state.searchQuery}"
              autocomplete="off"
              aria-label="${t("search")}">
          </div>
        </div>

        <div class="filter-bar" id="filter-bar">
          <select id="filter-genre" class="filter-select" aria-label="${t("genre")}">
            <option value="">${t("genre")}</option>
            ${GENRES.map(g => `<option value="${g}" ${state.searchFilters.genre === g ? "selected" : ""}>${g}</option>`).join("")}
          </select>
          <select id="filter-year" class="filter-select" aria-label="${t("year")}">
            <option value="">${t("year")}</option>
            ${search.getYears().map(y => `<option value="${y}" ${state.searchFilters.year == y ? "selected" : ""}>${y}</option>`).join("")}
          </select>
          <select id="filter-lang" class="filter-select" aria-label="${t("language")}">
            <option value="">${t("language")}</option>
            ${Object.entries(LANGUAGES).map(([k, v]) => `<option value="${k}" ${state.searchFilters.language === k ? "selected" : ""}>${v}</option>`).join("")}
          </select>
          <button class="clear-filters-btn" id="clear-filters">✕</button>
        </div>

        <div class="search-results-info">
          ${state.searchQuery || Object.values(state.searchFilters).some(Boolean)
            ? `<span>${results.length} ${results.length === 1 ? "film" : "films"}</span>`
            : `<span>${MOVIES.length} films in catalog</span>`}
        </div>

        <div class="search-results" id="search-results">
          ${results.length
            ? `<div class="movie-grid">${results.map(movieCard).join("")}</div>`
            : `<div class="no-results"><span>🎬</span><p>${t("noResults")}</p></div>`}
        </div>
      </div>`;

    const input = document.getElementById("search-input");
    if (input) {
      input.focus();
      input.addEventListener("input", e => {
        state.searchQuery = e.target.value;
        const resultsContainer = document.getElementById("search-results");
        const r = search.search(state.searchQuery, state.searchFilters);
        if (resultsContainer) {
          resultsContainer.innerHTML = r.length
            ? `<div class="movie-grid">${r.map(movieCard).join("")}</div>`
            : `<div class="no-results"><span>🎬</span><p>${t("noResults")}</p></div>`;
          document.querySelector(".search-results-info").innerHTML =
            `<span>${r.length} ${r.length === 1 ? "film" : "films"}</span>`;
        }
      });
    }

    ["filter-genre", "filter-year", "filter-lang"].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("change", () => {
        state.searchFilters.genre = document.getElementById("filter-genre")?.value;
        state.searchFilters.year = document.getElementById("filter-year")?.value;
        state.searchFilters.language = document.getElementById("filter-lang")?.value;
        renderSearch();
      });
    });

    document.getElementById("clear-filters")?.addEventListener("click", () => {
      state.searchFilters = {};
      state.searchQuery = "";
      renderSearch();
    });
  }

  // ── FAVORITES ─────────────────────────────────────────────
  function renderFavorites() {
    const favMovies = MOVIES.filter(m => state.favorites.includes(m.id));
    const wlMovies = MOVIES.filter(m => state.watchLater.includes(m.id));
    const histMovies = MOVIES.filter(m => state.history.includes(m.id)).slice(0, 10);

    app.innerHTML = `
      <div class="favorites-view">
        <header class="page-header">
          <h1 class="page-title">♥ ${t("favorites")}</h1>
        </header>

        ${favMovies.length ? `
          <section class="fav-section">
            <h2 class="section-title">${t("favorites")} (${favMovies.length})</h2>
            <div class="movie-grid">${favMovies.map(movieCard).join("")}</div>
          </section>` : `
          <div class="empty-state">
            <span class="empty-icon">♡</span>
            <p>No favorites yet. Browse films and tap ♡ to save them.</p>
            <button class="btn-primary" data-nav="discover">Discover Films</button>
          </div>`}

        ${wlMovies.length ? `
          <section class="fav-section">
            <h2 class="section-title">⊕ ${t("watchLater")} (${wlMovies.length})</h2>
            <div class="movie-grid">${wlMovies.map(movieCard).join("")}</div>
          </section>` : ""}

        ${histMovies.length ? `
          <section class="fav-section">
            <h2 class="section-title">◷ ${t("history")} (${histMovies.length})</h2>
            <div class="movie-grid">${histMovies.map(movieCard).join("")}</div>
          </section>` : ""}
      </div>`;
  }

  // ── DISCOVER ──────────────────────────────────────────────
  function renderDiscover() {
    const all = [...MOVIES].sort((a, b) => b.rating - a.rating);

    app.innerHTML = `
      <div class="discover-view">
        <header class="page-header">
          <h1 class="page-title">✦ ${t("discover")}</h1>
        </header>

        ${genreGrid()}

        <section class="discover-section">
          <h2 class="section-title">🏆 Highest Rated</h2>
          <div class="movie-grid">${all.slice(0, 8).map(movieCard).join("")}</div>
        </section>

        <section class="discover-section">
          <h2 class="section-title">🕰 By Era</h2>
          <div class="era-tabs">
            ${["1900s–1920s", "1920s–1940s", "1940s–1960s", "1960s+"].map((era, i) => `
              <button class="era-tab" data-era="${i}">${era}</button>`).join("")}
          </div>
          <div class="era-movies" id="era-movies">
            ${eraMovies(0)}
          </div>
        </section>

        <section class="discover-section">
          <h2 class="section-title">🌍 By Country</h2>
          <div class="country-grid">
            ${[...new Set(MOVIES.map(m => m.country))].map(c => `
              <button class="country-chip" data-country="${c}">${countryFlag(c)} ${c}</button>`).join("")}
          </div>
        </section>
      </div>`;

    // Era tabs
    document.querySelectorAll(".era-tab").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".era-tab").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const container = document.getElementById("era-movies");
        if (container) container.innerHTML = eraMovies(Number(btn.dataset.era));
      });
    });
    document.querySelector(".era-tab")?.classList.add("active");

    document.querySelectorAll(".country-chip").forEach(btn => {
      btn.addEventListener("click", () => {
        const country = btn.dataset.country;
        state.searchFilters = { country };
        state.searchQuery = "";
        navigate("search");
      });
    });
  }

  function eraMovies(eraIndex) {
    const eras = [
      [1900, 1919],
      [1920, 1939],
      [1940, 1959],
      [1960, 2025],
    ];
    const [from, to] = eras[eraIndex];
    const filtered = MOVIES.filter(m => m.year >= from && m.year <= to)
      .sort((a, b) => b.rating - a.rating);
    return filtered.length
      ? `<div class="movie-grid">${filtered.map(movieCard).join("")}</div>`
      : `<div class="no-results"><p>${t("noResults")}</p></div>`;
  }

  // ── CATEGORY ─────────────────────────────────────────────
  function renderCategory() {
    const genre = state.currentCategory;
    const movies = search.byGenre(genre).sort((a, b) => b.rating - a.rating);

    app.innerHTML = `
      <div class="category-view">
        <header class="page-header">
          <button class="back-btn" data-nav="back" aria-label="Back">←</button>
          <h1 class="page-title">${genre}</h1>
        </header>
        ${movies.length
          ? `<div class="movie-grid">${movies.map(movieCard).join("")}</div>`
          : `<div class="no-results"><p>${t("noResults")}</p></div>`}
      </div>`;
  }

  // ── PLAYER MODAL ──────────────────────────────────────────
  function openPlayer(movieId) {
    const movie = MOVIES.find(m => m.id === movieId);
    if (!movie) return;

    addHistory(movieId);

    let modal = document.getElementById("player-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "player-modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="player-modal-backdrop"></div>
      <div class="player-modal-content">
        <div class="player-modal-header">
          <h2>${movie.title}</h2>
          <button class="player-close-btn" id="player-close" aria-label="Close player">✕</button>
        </div>
        <div class="player-modal-body">
          <iframe
            src="${movie.embedUrl}"
            allowfullscreen
            allow="autoplay; fullscreen"
            loading="eager"
            title="${movie.title}"
            class="modal-player-iframe"
          ></iframe>
        </div>
        <div class="player-modal-footer">
          <p>Source: <a href="${movie.watchUrl}" target="_blank" rel="noopener">${movie.source} ↗</a>
          · License: ${movie.license}</p>
        </div>
      </div>`;

    modal.classList.add("visible");
    document.body.style.overflow = "hidden";

    document.getElementById("player-close")?.addEventListener("click", closePlayer);
    modal.querySelector(".player-modal-backdrop")?.addEventListener("click", closePlayer);
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") closePlayer();
    }, { once: true });
  }

  function closePlayer() {
    const modal = document.getElementById("player-modal");
    if (modal) {
      modal.classList.remove("visible");
      document.body.style.overflow = "";
      setTimeout(() => { modal.innerHTML = ""; }, 300);
    }
  }

  // ── LANGUAGE SELECTOR ─────────────────────────────────────
  function showLangPicker() {
    let picker = document.getElementById("lang-picker");
    if (picker) { picker.remove(); return; }

    picker = document.createElement("div");
    picker.id = "lang-picker";
    picker.innerHTML = `
      <div class="lang-picker-backdrop"></div>
      <div class="lang-picker-sheet">
        <h3>Language / اللغة / Langue / Idioma</h3>
        ${[
          { code: "en", label: "🇬🇧 English" },
          { code: "ar", label: "🇸🇦 العربية" },
          { code: "fr", label: "🇫🇷 Français" },
          { code: "es", label: "🇪🇸 Español" }
        ].map(l => `
          <button class="lang-option ${state.lang === l.code ? "active" : ""}" data-lang="${l.code}">
            ${l.label}
          </button>`).join("")}
      </div>`;

    document.body.appendChild(picker);

    picker.querySelectorAll("[data-lang]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.lang = btn.dataset.lang;
        save();
        picker.remove();
        render();
      });
    });

    picker.querySelector(".lang-picker-backdrop")?.addEventListener("click", () => picker.remove());
  }

  // ── NAVIGATION ────────────────────────────────────────────
  function navigate(view, data = {}) {
    const prev = state.currentView;
    state._prevView = prev;
    state.currentView = view;

    if (data.movie) state.currentMovie = data.movie;
    if (data.category) state.currentCategory = data.category;

    render();
    window.scrollTo(0, 0);
  }

  // ── GLOBAL EVENT DELEGATION ──────────────────────────────
  function bindGlobalEvents() {
    document.querySelectorAll("[data-nav]").forEach(el => {
      el.addEventListener("click", e => {
        const target = el.dataset.nav;
        if (target === "back") navigate(state._prevView || "home");
        else navigate(target);
      });
    });

    document.querySelectorAll("[data-action]").forEach(el => {
      el.addEventListener("click", e => {
        e.stopPropagation();
        const action = el.dataset.action;
        const id = el.dataset.id;

        if (action === "watch") openPlayer(id);
        else if (action === "movie") {
          const movie = MOVIES.find(m => m.id === id);
          if (movie) navigate("movie", { movie });
        }
        else if (action === "favorite") {
          toggleFavorite(id);
          // Update all instances of this button
          document.querySelectorAll(`[data-action="favorite"][data-id="${id}"]`).forEach(btn => {
            const isFav = state.favorites.includes(id);
            btn.classList.toggle("active", isFav);
            const icon = btn.querySelector(".side-icon, .card-fav") || btn;
            if (icon) icon.textContent = isFav ? "♥" : "♡";
          });
        }
        else if (action === "watchlater") toggleWatchLater(id);
        else if (action === "share") shareMovie(id);
      });
    });

    // Movie cards
    document.querySelectorAll(".movie-card").forEach(card => {
      card.addEventListener("click", e => {
        if (e.target.closest("[data-action]")) return;
        const id = card.dataset.id;
        const movie = MOVIES.find(m => m.id === id);
        if (movie) navigate("movie", { movie });
      });
      card.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") card.click();
      });
    });

    // Genre chips
    document.querySelectorAll("[data-category]").forEach(btn => {
      btn.addEventListener("click", () => navigate("category", { category: btn.dataset.category }));
    });

    // Search button in header
    document.getElementById("search-btn-header")?.addEventListener("click", () => navigate("search"));

    // Language button
    document.getElementById("lang-btn")?.addEventListener("click", showLangPicker);
  }

  // ── SHARE ────────────────────────────────────────────────
  function shareMovie(id) {
    const movie = MOVIES.find(m => m.id === id);
    if (!movie) return;
    const url = `https://laye.xyz/?movie=${id}`;
    const text = `🎬 ${movie.title} (${movie.year}) — Free & Legal on Laye Movies`;
    if (navigator.share) {
      navigator.share({ title: movie.title, text, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).then(() => {
        showToast("Link copied! 📋");
      });
    }
  }

  // ── TOAST ─────────────────────────────────────────────────
  function showToast(msg) {
    let toast = document.getElementById("toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add("visible");
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove("visible"), 2500);
  }

  // ── UTILITY ───────────────────────────────────────────────
  function langFlag(lang) {
    const flags = { en: "🇬🇧", ar: "🇸🇦", fr: "🇫🇷", es: "🇪🇸" };
    return flags[lang] || "🌐";
  }

  function countryFlag(country) {
    const flags = {
      "USA": "🇺🇸", "Germany": "🇩🇪", "France": "🇫🇷",
      "USSR": "🇷🇺", "UK": "🇬🇧", "Italy": "🇮🇹", "Japan": "🇯🇵"
    };
    return flags[country] || "🌍";
  }

  // ── URL ROUTING ───────────────────────────────────────────
  function handleURLRoute() {
    const params = new URLSearchParams(window.location.search);
    const movieId = params.get("movie");
    const genre = params.get("genre");
    const q = params.get("q");

    if (movieId) {
      const movie = MOVIES.find(m => m.id === movieId);
      if (movie) { state.currentMovie = movie; state.currentView = "movie"; }
    } else if (genre) {
      state.currentCategory = genre;
      state.currentView = "category";
    } else if (q) {
      state.searchQuery = q;
      state.currentView = "search";
    }
  }

  // ── BOOT ─────────────────────────────────────────────────
  handleURLRoute();
  render();

  // Install PWA prompt
  let deferredPrompt;
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferredPrompt = e;
  });

})();
