# 🎬 Laye Movies

**[laye.xyz](https://laye.xyz)** — Free & legal movie discovery platform with a TikTok-style reels experience.

> Discover cinema's greatest treasures — public domain masterpieces, creative commons films, and officially free independent movies.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎞 **Movie Reels** | TikTok-style full-screen vertical swipe experience |
| 🔍 **Smart Search** | Search by title, genre, year, language, director, country |
| 🧠 **Recommendations** | Algorithm based on watch history and favorites |
| ♥ **Favorites** | Save films to personal favorites list |
| ⊕ **Watch Later** | Queue films for later |
| 🌍 **Multilingual** | English, Arabic (RTL), French, Spanish |
| 📱 **PWA** | Installable as a mobile app |
| ⚡ **Offline** | Service worker caches the app shell |
| ♿ **Accessible** | ARIA roles, keyboard navigation, focus management |
| 🔎 **SEO** | sitemap.xml, robots.txt, Open Graph, Twitter Cards, schema.org |

---

## 🗂 File Structure

```
laye-movies/
├── index.html          # App shell + SEO meta + schema.org
├── style.css           # Complete dark-mode cinematic stylesheet
├── app.js              # Main app: routing, rendering, state, UI
├── movies.js           # Movie database + i18n strings
├── search.js           # Full-text search engine with filters
├── recommendations.js  # Smart recommendation algorithm
├── sw.js               # Service Worker (PWA / offline)
├── manifest.json       # PWA manifest
├── sitemap.xml         # SEO sitemap with VideoObject entries
├── robots.txt          # Crawler directives
└── README.md           # This file
```

---

## 🚀 GitHub Pages Deployment

### 1. Create the repository

```bash
# Create a new repo on GitHub called "laye-movies" (or your domain name)
git init
git add .
git commit -m "Initial commit — Laye Movies"
git remote add origin https://github.com/YOUR_USERNAME/laye-movies.git
git push -u origin main
```

### 2. Enable GitHub Pages

1. Go to your repository → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` → `/` (root)
4. Click **Save**

Your site will be live at `https://YOUR_USERNAME.github.io/laye-movies/`

### 3. Custom Domain (laye.xyz)

1. In your domain registrar, add a CNAME record:
   - Name: `www` → Value: `YOUR_USERNAME.github.io`
   - For apex domain, add A records pointing to GitHub's IPs:
     ```
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```
2. In GitHub Pages settings, enter `laye.xyz` as the custom domain.
3. Check **Enforce HTTPS**.
4. Update `sitemap.xml` and `index.html` canonical URLs to your domain.

---

## 🎬 Movie Catalog Management

### Adding a new movie

Open `movies.js` and add an entry to the `MOVIES` array:

```javascript
{
  id: "unique-id-year",          // URL-safe unique identifier
  title: "Movie Title",
  year: 1935,
  director: "Director Name",
  cast: ["Actor 1", "Actor 2"],
  genre: ["Genre1", "Genre2"],   // Must match GENRES list
  language: "en",                // ISO 639-1 code
  country: "USA",
  runtime: 90,                   // minutes
  rating: 7.5,                   // out of 10
  description: "Full synopsis.",
  poster: "https://...",         // Poster image URL
  backdrop: "https://...",       // Widescreen background image
  watchUrl: "https://archive.org/details/...",  // Link to source
  embedUrl: "https://archive.org/embed/...",    // Embeddable player URL
  license: "Public Domain",      // or "Creative Commons", "Free"
  source: "Internet Archive",
  tags: ["silent", "horror"],
  featured: false,               // Show in hero/featured row
  trending: false                // Show in trending row
}
```

### Legal Content Sources

All movies must be from one of these legal sources:

| Source | URL | Content |
|---|---|---|
| **Internet Archive** | archive.org | Public domain films, classic cinema |
| **Wikimedia Commons** | commons.wikimedia.org | Free-licensed media |
| **Public Domain Torrents** | publicdomaintorrents.info | PD movies |
| **Open Culture** | openculture.com/freemoviesonline | Curated free films |
| **Vimeo (CC)** | vimeo.com | Creative Commons licensed films |
| **YouTube (Free)** | youtube.com/movies | Officially free ad-supported films |

### Verifying public domain status

A work is in the public domain in the USA if:
- Published before **January 1, 1928** (as of 2024) — automatically PD
- Published 1928–1963 without copyright renewal
- Published with a Creative Commons Zero (CC0) license
- Created by the US federal government

**Always verify** at the [Copyright Office Records](https://cocatalog.loc.gov/) for works 1923–1963.

---

## 🧠 Recommendation Algorithm

The recommendation engine in `recommendations.js` works as follows:

1. **Genre affinity profile** — Built from watch history (weight: 1) and favorites (weight: 3)
2. **Similar movies** — Scored by genre overlap, same director, same era, tag overlap
3. **Cold start** — New users see highest-rated featured/trending films
4. **Hidden gems** — High-rated films not in featured or trending lists

To tune the algorithm, adjust weights in `recommendations.js`:

```javascript
history.forEach(id => score(id, 1));    // History weight
favorites.forEach(id => score(id, 3)); // Favorites weight (stronger signal)
```

---

## 🔍 SEO Guide

### Update canonical URLs

In `index.html`, update:
```html
<link rel="canonical" href="https://YOUR_DOMAIN/">
<meta property="og:url" content="https://YOUR_DOMAIN/">
```

### Update sitemap

In `sitemap.xml`, replace all `https://laye.xyz/` with your domain.

Submit your sitemap to:
- [Google Search Console](https://search.google.com/search-console)
- [Bing Webmaster Tools](https://www.bing.com/webmasters)

### Per-movie schema.org

When a user navigates to a movie page, dynamically inject Movie schema:

```javascript
function injectMovieSchema(movie) {
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.text = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Movie",
    "name": movie.title,
    "dateCreated": String(movie.year),
    "director": { "@type": "Person", "name": movie.director },
    "description": movie.description,
    "genre": movie.genre,
    "url": `https://laye.xyz/?movie=${movie.id}`,
    "image": movie.poster
  });
  document.head.appendChild(script);
}
```

---

## 🌍 Adding Languages

1. Open `movies.js`
2. Add a new entry to the `I18N` object:

```javascript
de: {
  appName: "Laye Filme",
  tagline: "Entdecke Cinemas größte Schätze",
  watchNow: "Jetzt ansehen",
  // ... all keys
}
```

3. Add to the language picker in `app.js` → `showLangPicker()`:

```javascript
{ code: "de", label: "🇩🇪 Deutsch" }
```

4. Update `manifest.json` and `index.html` with the new locale.

---

## 📱 PWA Installation

Users on mobile can install Laye Movies as a native-feeling app:

- **iOS Safari**: Share button → "Add to Home Screen"
- **Android Chrome**: Three-dot menu → "Add to Home Screen" or "Install App"
- **Desktop Chrome/Edge**: Address bar install icon

The service worker (`sw.js`) caches the app shell for offline use.

---

## ⚡ Performance Tips

- **Images**: Use WebP format when possible. Posters should be ≤ 300KB.
- **Lazy loading**: All images use `loading="lazy"` automatically.
- **Reels**: Only 2 iframes are pre-loaded; others are lazy-loaded on scroll.
- **Local storage**: Favorites, history, and watch-later are stored locally — no backend needed.
- **Fonts**: Bebas Neue + DM Sans load via Google Fonts with `display=swap`.

To add more movies without bloating JS, consider loading `movies.js` asynchronously:

```html
<script src="movies.js" defer></script>
```

---

## 🔧 Local Development

No build tools required — pure HTML/CSS/JS.

```bash
# Option 1: Python
python3 -m http.server 8080

# Option 2: Node.js
npx serve .

# Option 3: VS Code
# Install "Live Server" extension, right-click index.html → Open with Live Server
```

Open `http://localhost:8080` in your browser.

---

## 📄 License

- **Code**: MIT License — free to use, modify, and distribute.
- **Movie content**: Each film retains its own license (Public Domain, Creative Commons, etc.) as noted in the `movies.js` database.
- **Fonts**: Google Fonts Open Font License.

---

## 🤝 Contributing

1. Fork the repository
2. Add legally distributable movies to `movies.js`
3. Verify the license and source URL
4. Submit a pull request

**Only submit movies that are:**
- Genuinely in the public domain
- Licensed under Creative Commons
- Officially distributed for free by rights holders

---

*Built with ♥ for cinema lovers everywhere · [laye.xyz](https://laye.xyz)*
