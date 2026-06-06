// ============================================================
// LAYE MOVIES — Search Engine
// Full-text search with filters: title, genre, year, language,
// country, director, tags.
// ============================================================

class LayeSearch {
  constructor(movies) {
    this.movies = movies;
    this.index = this._buildIndex(movies);
  }

  // Build a fast lookup index
  _buildIndex(movies) {
    const idx = {};
    movies.forEach(m => {
      idx[m.id] = [
        m.title.toLowerCase(),
        m.director.toLowerCase(),
        ...(m.genre || []).map(g => g.toLowerCase()),
        ...(m.cast || []).map(c => c.toLowerCase()),
        ...(m.tags || []).map(t => t.toLowerCase()),
        m.country.toLowerCase(),
        String(m.year),
        m.language.toLowerCase(),
        (m.description || "").toLowerCase()
      ].join(" ");
    });
    return idx;
  }

  // Score a movie against a query
  _score(movie, terms) {
    const text = this.index[movie.id] || "";
    let score = 0;
    terms.forEach(term => {
      if (movie.title.toLowerCase().includes(term)) score += 10;
      if (movie.director.toLowerCase().includes(term)) score += 6;
      if ((movie.genre || []).some(g => g.toLowerCase().includes(term))) score += 5;
      if ((movie.tags || []).some(t => t.toLowerCase().includes(term))) score += 4;
      if (String(movie.year) === term) score += 8;
      if (movie.language.toLowerCase() === term) score += 4;
      if (movie.country.toLowerCase().includes(term)) score += 3;
      if (text.includes(term)) score += 1;
    });
    return score;
  }

  // Main search
  search(query, filters = {}) {
    const q = (query || "").trim().toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);

    let results = [...this.movies];

    // Apply hard filters first
    if (filters.genre) {
      results = results.filter(m =>
        m.genre.some(g => g.toLowerCase() === filters.genre.toLowerCase())
      );
    }
    if (filters.year) {
      results = results.filter(m => m.year === Number(filters.year));
    }
    if (filters.language) {
      results = results.filter(m => m.language === filters.language);
    }
    if (filters.country) {
      results = results.filter(m =>
        m.country.toLowerCase().includes(filters.country.toLowerCase())
      );
    }
    if (filters.minRating) {
      results = results.filter(m => m.rating >= Number(filters.minRating));
    }

    // If no query text, return filtered results sorted by rating
    if (!terms.length) {
      return results.sort((a, b) => b.rating - a.rating);
    }

    // Score & sort
    return results
      .map(m => ({ movie: m, score: this._score(m, terms) }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(r => r.movie);
  }

  // Get suggestions (autocomplete) — returns titles and directors
  suggest(query) {
    const q = (query || "").trim().toLowerCase();
    if (q.length < 2) return [];

    const suggestions = new Set();
    this.movies.forEach(m => {
      if (m.title.toLowerCase().includes(q)) suggestions.add(m.title);
      if (m.director.toLowerCase().includes(q)) suggestions.add(`Director: ${m.director}`);
      m.genre.forEach(g => {
        if (g.toLowerCase().includes(q)) suggestions.add(`Genre: ${g}`);
      });
    });
    return [...suggestions].slice(0, 8);
  }

  // Filter by genre
  byGenre(genre) {
    return this.search("", { genre });
  }

  // Get unique years
  getYears() {
    return [...new Set(this.movies.map(m => m.year))].sort((a, b) => b - a);
  }

  // Get unique countries
  getCountries() {
    return [...new Set(this.movies.map(m => m.country))].sort();
  }
}

window.LayeSearch = LayeSearch;
