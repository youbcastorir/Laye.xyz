// ============================================================
// LAYE MOVIES — Smart Recommendation Engine
// Uses watch history, favorites, genre affinity, and
// collaborative-style scoring to surface great matches.
// ============================================================

class LayeRecommendations {
  constructor(movies) {
    this.movies = movies;
  }

  // Build a genre-affinity score map from history + favorites
  _buildProfile(history, favorites) {
    const profile = {};

    const score = (movieId, weight) => {
      const m = this.movies.find(x => x.id === movieId);
      if (!m) return;
      m.genre.forEach(g => {
        profile[g] = (profile[g] || 0) + weight;
      });
      (m.tags || []).forEach(t => {
        profile[`tag:${t}`] = (profile[`tag:${t}`] || 0) + weight * 0.5;
      });
    };

    history.forEach(id => score(id, 1));
    favorites.forEach(id => score(id, 3)); // favorites count triple

    return profile;
  }

  // Score a single movie against a profile
  _scoreMovie(movie, profile, seen) {
    if (seen.has(movie.id)) return -1; // never re-recommend seen

    let score = 0;
    movie.genre.forEach(g => {
      score += profile[g] || 0;
    });
    (movie.tags || []).forEach(t => {
      score += profile[`tag:${t}`] || 0;
    });

    // Boost for high-rated films
    score += movie.rating * 0.5;

    // Boost for trending/featured
    if (movie.trending) score += 2;
    if (movie.featured) score += 1;

    return score;
  }

  // Get personalized recommendations
  getForUser(history = [], favorites = [], limit = 10) {
    const seen = new Set([...history, ...favorites]);
    const profile = this._buildProfile(history, favorites);
    const hasProfile = Object.keys(profile).length > 0;

    let candidates = this.movies.filter(m => !seen.has(m.id));

    if (!hasProfile) {
      // Cold start: return top-rated featured films
      return candidates
        .filter(m => m.featured || m.trending)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, limit);
    }

    return candidates
      .map(m => ({ movie: m, score: this._scoreMovie(m, profile, seen) }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.movie);
  }

  // Similar movies to a given movie
  getSimilar(movieId, limit = 6) {
    const source = this.movies.find(m => m.id === movieId);
    if (!source) return [];

    return this.movies
      .filter(m => m.id !== movieId)
      .map(m => {
        let score = 0;
        // Genre overlap
        const overlap = m.genre.filter(g => source.genre.includes(g)).length;
        score += overlap * 5;
        // Same director
        if (m.director === source.director) score += 8;
        // Same era (within 15 years)
        if (Math.abs(m.year - source.year) <= 15) score += 3;
        // Same language
        if (m.language === source.language) score += 2;
        // Tag overlap
        const tagOverlap = (m.tags || []).filter(t => (source.tags || []).includes(t)).length;
        score += tagOverlap * 2;
        // Popularity
        score += m.rating * 0.3;

        return { movie: m, score };
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.movie);
  }

  // Trending: highly rated + trending flag
  getTrending(limit = 10) {
    return this.movies
      .filter(m => m.trending)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  // Featured films
  getFeatured(limit = 8) {
    return this.movies
      .filter(m => m.featured)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  // Hidden gems: high-rated but not widely known
  getHiddenGems(limit = 8) {
    return this.movies
      .filter(m => !m.featured && !m.trending && m.rating >= 7.5)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  // Random pick
  getRandom(exclude = [], limit = 5) {
    const pool = this.movies.filter(m => !exclude.includes(m.id));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  }
}

window.LayeRecommendations = LayeRecommendations;
