# Blank Page

A single-page Next.js app that fills a screen (typically a second monitor) with a solid colour, with all controls in a sheet that slides in from the right. Settings are saved in the browser.

- **Basic mode (the default):** colour, random, black, clock and fullscreen.
- **Advanced mode:** a toggle that switches the controls to a hover.dev-style neo-brutalist panel, with a light/dark/system theme, and unlocks:
  - a photo slideshow (Kazeem Quadri's own photos, from Vercel Blob): a collage of 1–6 photos or auto, or a gallery of one photo at a time, with varied transitions and a lightbox
  - crazy mode (colours change on an interval)
  - a random quote
  - a focus timer and a breathing guide
  - ambient noise
  - a screen dimmer and warm light
  - a developer toolkit (passwords, tokens, UUIDs, hashes, Base64, URL encoding, JWT, JSON, timestamps)

Keyboard shortcuts and the toolkit (Ctrl+/ or ⌘+/) work in both modes. First-time visitors get a short walkthrough guide.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript (`strict: false`)
- Tailwind CSS v3.4 (`@tailwind` directives in `app/globals.css`)
- shadcn/ui (Radix + `class-variance-authority` + `tailwind-merge`), lucide-react icons
- TanStack React Query v5 for data fetching, axios as the HTTP client
- Vercel Blob as the only source of collage photos (`@vercel/blob`); `sharp` (dev) to resize them before upload
- Biome for lint/format (no ESLint)
- Yarn 4 (Berry) with `nodeLinker: node-modules` (see `.yarnrc.yml`)

## Commands

```bash
yarn dev      # dev server
yarn build    # production build, also runs the TypeScript check
yarn lint     # biome lint .
yarn check    # biome check . (lint + format + import sorting)
yarn upload-backgrounds "<folder>"  # resize photos and upload them to Vercel Blob
yarn build:extension  # Chrome and Firefox extension, in dist/
```

## Browser extension

`yarn build:extension` (`scripts/build-extension.mjs`) builds the same app as a Manifest V3 extension for Chrome and Firefox. It writes `dist/chrome/` and `dist/firefox/` (load unpacked) and a store-ready `.zip` of each. The extension opens Blank Page on every new tab (`chrome_url_overrides`) and from its toolbar button (`extension/background.js`).

- **Static export:** `NEXT_PUBLIC_EXTENSION=1` switches `next.config.js` to `output: 'export'` into `.next-extension/`. `pageExtensions: ['tsx']` leaves out `app/api/backgrounds/route.ts`, so the extension fetches the photo list from the deployed site (`SITE_URL` in `lib/helpers.js`, which sends `Access-Control-Allow-Origin: *`). `IS_EXTENSION` also drops Google Analytics, because extensions can't load remote scripts.
- **Post-processing:** Chrome refuses names starting with `_`, so `_next/` is renamed `next/`, references to it are rewritten, and other `_` files are dropped. MV3's CSP blocks inline scripts, so each one is moved to `next/inline/<hash>.js` and loaded from the same spot. The build fails if anything still references `/_next/`.
- **Manifests:** generated in the script. They differ only in the background (a service worker for Chrome, `background.scripts` for Firefox) and Firefox's `browser_specific_settings` (add-on ID `blank-page@darkace01`, no data collection, Firefox 140+). The version comes from `package.json`, and the icons are rendered from an inline SVG with `sharp`.
- **Settings:** stored in the extension's own localStorage, separate from the website's.

There are no tests. Verify changes with `yarn lint` and `yarn build`, then check the page in a browser, at desktop and phone widths.

## Layout

- `app/layout.tsx`: root layout.
  - Sets metadata, loads Google Analytics via `next/script` (`NEXT_PUBLIC_GA_ID` from `.env`), and wraps children in `Providers`.
  - Loads Poppins with `next/font/google` as `--font-poppins` (Tailwind's `font-brutal`).
  - `<html class="dark">` selects the dark shadcn theme, used by basic mode. Advanced mode's own dark theme is a separate `night` class, added and removed by the page.
- `app/providers.tsx`: client component that creates the `QueryClient` (`refetchOnWindowFocus: false`).
- `lib/settings.tsx`: every saved setting, in `useSettingsState()`, each a `usePersistentState` with a validator, so a bad stored value falls back to the default. The page calls it once and shares it through `SettingsProvider`, and components read it with `useSettings()`.
  - **Settings:** `advanced`, `theme`, `color`, `showClock`, `bgMode`, `photoLayout` (`'collage' | 'gallery'`) and `photoCount` (0 = auto, or 1–6), `crazyMode` and its interval, the slideshow (`autoChange`, `changeInterval`), `showQuote`, `showTimer` and `timerMinutes`, `showBreathing`, `ambientSound` and `ambientVolume`, `dim` and `warmLight`.
  - **Not saved:** fullscreen (browsers only allow entering it from a click), the lightbox, open dialogs and the hidden-UI toggle. The walkthrough's "seen" flag (`blank-page:tourSeen`) is stored by `components/Walkthrough.tsx` itself, read directly before deciding to show, so returning visitors never get a flash of it.
- `app/page.tsx`: wires everything together.
  - **Basic mode:** `advanced` gates every advanced feature. While it's off, the page uses `bgMode = 'color'`, no quote, timer, breathing or sound, and no dimmer or warm light. The advanced settings are kept, so they return when advanced mode is switched back on.
  - **Dark theme:** while advanced mode is on, the page toggles `night` on `<html>` from `theme`. With `'system'` it follows `prefers-color-scheme`, including live changes.
  - **Crazy mode** cycles colours (advanced mode, colour background only).
  - **Slideshow:** calls `next()` every `changeInterval` (default 10s, from `SLIDESHOW_INTERVALS` in `lib/helpers.js`; the shortest is 5s). It pauses while the lightbox is open. A manual shuffle bumps `shuffleCount` to restart the countdown (that dependency is biome-ignore'd on purpose).
  - **Keyboard shortcuts:** Space for a random colour or shuffle, F fullscreen, B black, H to hide the clock and widgets, D for the developer toolkit. They're ignored while typing, on sliders and selects, inside any dialog, and with Ctrl/Alt/Meta. The exception is Ctrl+/ or ⌘+/, which toggles the toolkit from anywhere, even while typing or inside a dialog. The toolkit is mounted in both modes. Space on a focused button is left to the button. The listener is re-bound every render (no dependency list), so the handlers always see current state.
  - **Fullscreen:** a `fullscreenchange` listener keeps the toggle in sync when fullscreen is left with Esc.
  - **Layering:** the collage (and quote, z-10) sit under `ScreenFilters` (z-15). The clock, timer (top-left; `top-16` on phones to clear the clock), breathing guide (bottom-centre) and controls button sit above at z-20.
  - **Footer credit:** `FooterCredit` only shows with a colour background, because in picture mode the bottom-right corner holds a photo's lightbox button.
  - DOM helpers (`isIOSDevice`, `requestFullScreen`, `exitFullscreen`) sit at module scope so effects don't need them as dependencies.
  - **Quote:** follows the background. An effect watches `backgroundKey` (the colour in colour mode, the collage id in picture mode) and refetches the quote when it changes. Colour changes are throttled to one quote per `QUOTE_MIN_INTERVAL` (5s), because crazy mode can change colour every 100ms. Photo changes always get a new quote (they're at least 5s apart). Random and Shuffle don't fetch quotes themselves.
  - **Walkthrough:** opened 600ms after a first visit (`hasSeenWalkthrough()`), and replayable from either panel via `startTour`. "Try it" on its last step switches on advanced mode and opens the controls.
- `components/Walkthrough.tsx`: the first-visit guide, 4 steps: welcome, the controls button, shortcuts, advanced mode.
  - **Spotlight:** steps with a `target` light up any element with a matching `data-tour` attribute (both controls triggers have `data-tour='controls'`) using a bordered box with a huge `box-shadow` that darkens the rest of the screen. It's a border, not a Tailwind `ring`, because rings are drawn with box-shadow and the inline shadow would replace them.
  - **Card position:** below the target, or centred. An outer box positions it and an inner box animates, because the entry animation's transform would replace the centring transform.
  - **Keys:** Escape or ✕ skips, and both skipping and finishing mark it seen. Focus moves into the guide, so the app's shortcuts stay quiet while it's open.
- `components/ControlsSheet.tsx`: the trigger button (top-right) and the shadcn `Sheet`, which the page controls so the toolkit can close it before opening. It shows one of two panels.
  - **Basic:** a round, faded trigger and `controls/BasicControls.tsx`: a dark shadcn panel with colour, Random, Black, clock, fullscreen and a "Switch to advanced mode" card.
  - **Advanced:** a square indigo trigger with a hard shadow and `controls/AdvancedControls.tsx` on grid paper. The panel has:
    - a header card with the advanced toggle and Light / Dark / Auto theme buttons
    - Background (colour or pictures, with their options)
    - Focus (timer, breathing, quote)
    - Ambient sound
    - Screen (dim, warm light, clock, fullscreen)
    - Developer toolkit
    - a shortcuts list (`SHORTCUTS`)
  - **Credits:** `controls/Credits.tsx` holds "Developed by". The `photos` prop adds "All photos taken by Kazeem Quadri", in advanced mode only.
- `components/brutal.tsx`: the advanced-mode building blocks in hover.dev's neo-brutalist style: `BrutalCard`, `BrutalButton` (`primary`, `dark`, `light`, `active`), `BrutalLabel`, `BrutalSwitch`, `BrutalSlider`, `BrutalRow`, and class names for restyling shadcn's Select.
  - **Cut corner:** clipping a single element would cut away its border along the diagonal. So cards and buttons stack three clipped layers (the offset shadow, a border-coloured layer and the face), and the face's cut is about 1px smaller so the 2px border shows along the diagonal too.
  - **Pressed effect:** a button's face slides onto its shadow on hover, focus and press.
- `components/widgets/`:
  - `FocusTimer.tsx`: work for `timerMinutes`, then a 5 minute break (`BREAK_MINUTES`), repeating. It counts against a wall-clock end time, so it stays accurate in background tabs. It plays a chime at each switch (`playChime`) and shows the countdown in the tab title while running. Changing the work length resets it only when it isn't running; `workMinutes` is the only trigger, so pausing doesn't reset it.
  - `BreathingGuide.tsx`: box breathing, 4s each for in, hold, out, hold. The square uses the CSS `breathe` animation (16s, in `app/globals.css`), and the label and countdown follow the same cycle from mount.
  - `ScreenFilters.tsx`: the dimmer (black at `dim` opacity, up to 80%) and the warm light (an amber multiply layer), with `pointer-events-none`.
- `lib/useAmbientNoise.ts`: `useAmbientNoise(sound, volume)` plays looping white, pink (Paul Kellet's filter) or brown (leaky random walk) noise, generated with the Web Audio API, so there are no audio files.
  - Changes fade in and out.
  - Browsers block audio until a user gesture, so a sound restored on load starts on the first click or key press.
  - Also exports `playChime()` for the timer.
- `components/devtools/DevToolkit.tsx`: the developer toolkit, a shadcn `Dialog` styled after hover.dev's app-window mockup: title bar with traffic lights, a sidebar (Generate / Encode / Inspect, a scrolling row on phones), and the tool on grid paper. The tool UIs are in `components/devtools/tools.tsx`, and the logic in `lib/devtools.ts`.
  - **Pure functions:** the logic is easy to test from Node 24, which runs `.ts` directly.
  - **Randomness:** always `crypto.getRandomValues`, with rejection sampling (`randomInt`) to avoid modulo bias, so there's no `Math.random`.
  - **Passwords:** guarantee one character from each chosen set and are then shuffled. Entropy is `length × log2(pool)`.
  - **Encoding and hashing:** Base64 is UTF-8 safe, and hashes use `crypto.subtle.digest`.
  - **JWT:** decoded only, and the signature is **not** verified (the UI says so).
  - **Timestamps:** numbers above 1e11 are read as milliseconds, below as seconds.
  - **Privacy:** nothing leaves the browser.
- `components/PictureCollage.tsx`: the collage, inset `COLLAGE_INSET_VMIN` (1.5vmin, the same as the tile gap) from the viewport edges. The controls button and clock overlay it, so it uses the full height.
  - **Skeleton:** collage-shaped shadcn `Skeleton` blocks show until the first collage loads, or an error message if it can't.
  - **Layers:** each collage records the box size it was laid out for (`boxWidth`/`boxHeight`). Each layer keeps that aspect ratio and is fitted, centred, into the container with container query units (`containerType: 'size'`), so a window resize scales it evenly.
  - **Tiles** are absolutely positioned by percentage, using `<img>` with `object-cover`. The plain `<img>` is deliberate (biome-ignore'd): tiles are preloaded by exact URL, and `next/image` would fetch them again through its optimizer.
  - **Tile buttons:** each tile has a credit link (bottom-left) and a lightbox button (bottom-right). They appear on hover with a mouse and are always visible on touch screens, via `[@media(hover:hover)]:opacity-0 group-hover:opacity-100`.
  - **Lightbox:** a shadcn `Dialog` showing the photo with `object-contain`, its credit, previous/next buttons and left/right arrow keys. It shows the same Blob URL as the tile, which is already cached. `onLightboxOpenChange` tells the page to pause the slideshow.
  - **Gallery layout** (`collage.layout === 'gallery'`, `GalleryLayer`): one photo shown whole (`object-contain`) over a blurred, darkened copy of itself filling the frame, with its credit and lightbox buttons in the frame's corners.
    - **Transitions:** each change uses one of `GALLERY_TRANSITIONS`: `fade`, `kenburns` (fade in, then a slow 20s pan and zoom while on screen), `slide`, `zoom`, `blur` or `flip`. The keyframes are in `app/globals.css`.
    - **Crossfade:** the new photo enters on top over 1100ms (`.gallery-enter`) while the old one stays fully opaque underneath (`.gallery-leaving` has no animation). The old one is unmounted after `LEAVE_MS.gallery`. Fading both at once would dip through to the background halfway.
  - **Collage transitions:** the previous collage stays mounted for 700ms fading out (`.collage-leaving`), while new tiles enter one after another, staggered via the `--tile-delay` CSS variable. Each collage picks a random entry animation (`rise`, `zoom` or `slide`), passed as an inline `animationName`. In both layouts the transition is never the same twice in a row (`pickDifferent`). The keyframes are in `app/globals.css`, and `prefers-reduced-motion` turns them off. The container is `overflow-hidden`, so sliding tiles can't cause scrollbars.
- `components/ui/`: shadcn components (button, dialog, label, select, separator, sheet, skeleton, slider, switch, tabs). They're ours to edit, and two are customised:
  - `sheet.tsx`: a lighter overlay (`bg-black/30`), so background changes stay visible while the sheet is open.
  - `dialog.tsx`: a close button on a dark round background, so it stays visible over photos.
- `components/QuoteCard.tsx`: renders the quote from `useQuote()`. The skeleton and error state only show before the first quote; after that the current quote stays up while the next loads, and each new one fades in (keyed by its text). Centred over everything when quotes are on, using a `pointer-events-none` wrapper so tile buttons behind it still work.
- `components/Clock.tsx`: live time, top-right next to the controls button. Loaded with `next/dynamic` and `ssr: false` to avoid hydration mismatches.
- `components/FooterCredit.tsx`: footer (colour mode only).
- `lib/utils.ts`: shadcn's `cn()` (clsx + tailwind-merge).
- `lib/usePersistentState.ts`: `usePersistentState(key, default, isValid?)`, a drop-in for `useState` that saves to localStorage under `blank-page:<key>`.
  - The page is prerendered, so the saved value is read after mount, to avoid a hydration mismatch. The default shows for the first frame.
  - Nothing is written until that read has happened, so defaults never overwrite saved values.
  - A stored value that fails `isValid` (by default, a type check against the default) is ignored and then overwritten.
  - Blocked or full storage is caught, and the hook then behaves like `useState`.
- `lib/helpers.js`:
  - `randomColor()`: always a 6-digit hex, which the colour picker requires.
  - `PICTURES_URL` (`/api/backgrounds`), the quotes URL, `SLIDESHOW_INTERVALS` and `DEFAULT_SLIDESHOW_INTERVAL`.
  - `collageBox()`: the collage area in CSS px, the JS twin of the CSS inset.
- `lib/collage.js`: `buildCollage(pool, boxWidth, boxHeight, photoCount = 0)`, a pure layout that's easy to stress-test from Node. With `photoCount` 1–6 it uses exactly that many photos (cropping more for small counts with mostly-portrait photos on wide screens); 0 is auto.
  - **Shape:** up to `MAX_TILES` (6) photos in 1–3 rows that span the full width and together fill the full height. Within a row, photos keep their aspect ratio and the row is scaled to exactly the box width. Then all rows are stretched vertically by one shared factor to fill the height, and tiles absorb that stretch by cropping (`object-cover`).
  - **Choosing photos by aspect ratio:** it tries `ATTEMPTS` (600) random candidates, each with a random photo count and row count. Each row's last photo is the one, from a sample of 12, whose ratio best completes the row. The winner has the lowest `|ln(stretch)| + TILE_BONUS * (6 - count)`, so the least cropping, with a slight preference for more photos.
  - **Results** with the real photo set (mostly portrait) on a 1080p-sized box: 6 photos nearly always, cropping typically about 2%. All 600 attempts take about 1ms.
  - **Output:** each photo's fields plus its tile position in percent (`left`, `top`, `width`, `height`).
- `lib/apiHelpers.js`: `useQuote()` (React Query) and `QUOTE_QUERY_KEY`. Random and Shuffle in the sheet call `queryClient.refetchQueries({ queryKey: QUOTE_QUERY_KEY })` for a new quote.
  - **`useRandomCollage(enabled, { layout, photoCount })`** returns `{ collage, next, isError }`. It fetches the `/api/backgrounds` list once and caches it for the session. A gallery "collage" is a single tile filling the box. Changing `layout` or `photoCount` builds a new one immediately.
  - **`next()`** lays out a collage, avoiding the previous collage's photos when at least 6 others are available, and preloads every tile before swapping it in.
  - **Failures:** if any tile fails to load, that collage is discarded, the broken photos are dropped from the pool and a new collage is built automatically. After `MAX_PICTURE_FAILURES` (5) failed collages in a row it stops, so being offline doesn't cause endless retries.
  - **`isError`** is true when the list request fails, when the store is empty or every photo in it failed, or after giving up. There's no fallback photo source: the collage shows "Couldn't load pictures."
- `types.ts`: `Quote` type (legacy shape from the old quotable API; only `content` and `author` are used).

## shadcn/ui on Tailwind v3

The current shadcn CLI targets Tailwind v4, so this project uses the last v3-compatible release: `yarn dlx shadcn@2.3.0 add <component> -y`. `components.json` uses the new-york style with the zinc base colour and CSS variables.

The CLI's `init` wrote the theme variables as full `oklch(...)` colours, the v4 format. But `tailwind.config.js` wraps them as `hsl(var(--x))`, so `app/globals.css` holds shadcn's v3 zinc palette as bare HSL channels (e.g. `--background: 240 10% 3.9%`). Keep that format if variables are added. Check that newly added components don't use v4-only classes (`outline-hidden`, `shadow-xs`, `in-data-*` and the like). Biome needs `css.parser.tailwindDirectives` for `@apply`.

## Quotes API

Quotes come from DummyJSON (`https://dummyjson.com/quotes/random`): free, no key, CORS allowed. It returns `{ id, quote, author }`, which `fetchQuote` maps to `{ content, author }` for the card. Earlier APIs are dead: quotable.io (broken TLS) and quote-garden. ZenQuotes doesn't send CORS headers, so browser code can't call it.

## Pictures

Vercel Blob is the only source of photos. There's no local folder and no third-party fallback. `app/api/backgrounds/route.ts` lists the store's `backgrounds/` prefix and returns `{ src, author, link, width, height }` for each photo. `author` is always "Kazeem Quadri" (`PHOTOGRAPHER`), since every photo in the store is his.

- **Caching:** the route uses `revalidate = 3600`. In production it's cached and refreshed hourly, so new uploads appear within an hour without a redeploy, and a failed refresh keeps serving the last good list. In `yarn dev` it runs on every request.
- **Token:** it needs `BLOB_READ_WRITE_TOKEN`, locally in `.env.local` (git-ignored). On Vercel it's added automatically when the Blob store is connected to the project. Without the token the route returns `[]`, and picture mode shows "Couldn't load pictures."
- **URLs:** the store is public, and tiles load straight from its `*.public.blob.vercel-storage.com` URLs.

Photos get there through `scripts/upload-backgrounds.mjs` (`yarn upload-backgrounds "<folder>"`, with env loaded via `node --env-file=.env.local`).
- **Processing:** `sharp` rotates each photo upright, shrinks it to 2400px on the longest side and converts it to WebP at quality 80.
- **Naming:** each photo is uploaded as `backgrounds/<slugified-name>-<width>x<height>.webp`. Blob has no custom metadata, so the dimensions live in the pathname, and the route parses them so collages can be laid out before any photo downloads. Blobs without a size in their name (e.g. uploaded by hand in the dashboard) are skipped.
- **Upload settings:** `addRandomSuffix: false` and a one-year `cacheControlMaxAge`, since a name never changes once uploaded.
- **Re-runs and errors:** photos already in the store are skipped, so it can be re-run after adding more. The first photo is uploaded alone, so a bad token or a private store fails fast. Original files are never modified.

The current store holds 103 photos (55MB, resized from 88MB of originals), 87 of them portrait.

## Dead code to be aware of

- `context/AppContext.tsx`: an unused React context duplicating `page.tsx` state. It still fetches from the dead quote-garden API. Nothing imports it.
- `components/ActionItems.tsx`: empty, unused.
- Commented-out `getStaticProps` at the bottom of `page.tsx` (Pages Router leftover).

## Conventions

- 2-space indent, single quotes (JSX too), trailing commas. Biome's formatter enforces this (`biome.json`). The generated `components/ui/*` files keep shadcn's own double-quote style.
- Mark client components with `'use client'`. Import with the `@/` path alias (`@/components/...`, `@/lib/...`).
- Use `import type` for type-only imports (Biome enforces it).
- Tailwind utility classes inline. No CSS modules. Build new UI from the shadcn components in `components/ui/` (add more with the v3 CLI above) and lucide icons.
- Advanced-mode UI uses the `brutal-*` colours (`border-brutal-line`, `bg-brutal-paper`, `text-brutal-text`, `text-brutal-muted`, `bg-brutal-soft`, `text-brutal-accent`, `bg-brutal-shadow`) and `shadow-[Npx_Npx_0_0_rgb(var(--brutal-shadow))]`, never `black`/`white`/`#000`. Those tokens are what dark mode (`.night` in `app/globals.css`) swaps. The exceptions are the indigo-600 accent fills and text on fixed light badges (e.g. `bg-emerald-300 text-black`). Build new advanced UI from `components/brutal.tsx`.
- Don't add a fast-interval quote refetch to crazy mode: the interval can be as low as 100ms and would flood the API.
