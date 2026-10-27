# Blank Page

A single-page Next.js app that fills a screen (typically a second monitor) with a solid colour or a slideshow of photo collages. Extras: random colour, "crazy mode" (colour changes on an interval), a lightbox for each photo, fullscreen, a clock and an optional random quote card. All controls live in a sheet that slides in from the right.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript (`strict: false`)
- Tailwind CSS v3.4 (`@tailwind` directives in `app/globals.css`)
- shadcn/ui (Radix + `class-variance-authority` + `tailwind-merge`), lucide-react icons
- TanStack React Query v5 for data fetching, axios as the HTTP client
- Vercel Blob for the collage photos (`@vercel/blob`); `sharp` (dev) to resize them before upload
- Biome for lint/format (no ESLint)
- Yarn 4 (Berry) with `nodeLinker: node-modules` (see `.yarnrc.yml`)

## Commands

```bash
yarn dev      # dev server
yarn build    # production build, also runs the TypeScript check
yarn lint     # biome lint .
yarn check    # biome check . (lint + format + import sorting)
yarn upload-backgrounds "<folder>"  # resize photos and upload them to Vercel Blob
```

There are no tests. Verify changes with `yarn lint` and `yarn build`, then check the page in a browser, at desktop and phone widths.

## Layout

- `app/layout.tsx`: root layout. Sets metadata, loads Google Analytics via `next/script` (`NEXT_PUBLIC_GA_ID` from `.env`), wraps children in `Providers`. `<html class="dark">` selects the dark shadcn theme.
- `app/providers.tsx`: client component that creates the `QueryClient` (`refetchOnWindowFocus: false`).
- `app/page.tsx`: the page and all app state, held in `useState`: colour, `bgMode` (`'color' | 'picture'`), crazy mode and its interval, the slideshow (`autoChange`, `changeInterval`), clock, quote, fullscreen, and whether the lightbox is open.
  - **Crazy mode** only cycles colours, and only in colour mode. Pictures have their own slideshow effect.
  - **Slideshow:** calls `next()` every `changeInterval` (default 10s, from `SLIDESHOW_INTERVALS` in `lib/helpers.js`; the shortest is 5s). It pauses while the lightbox is open. A manual shuffle bumps `shuffleCount` to restart the countdown (that dependency is biome-ignore'd on purpose).
  - **Fullscreen:** a `fullscreenchange` listener keeps the toggle in sync when fullscreen is left with Esc.
  - **Footer credit:** `FooterCredit` only shows in colour mode, because in picture mode the bottom-right corner holds a photo's lightbox button. The credit also appears in the sheet.
  - DOM helpers (`isIOSDevice`, `requestFullScreen`, `exitFullscreen`) sit at module scope so effects don't need them as dependencies.
- `components/ControlsSheet.tsx`: every control, in a shadcn `Sheet` (side right, `w-[88vw] sm:max-w-sm`, so it's near full width on phones). It's opened by a round button fixed top-right, faded (`opacity-40`) until hovered or focused.
  - **Tabs:** Colour has a colour picker, Random, Black, and a crazy mode switch with a speed slider. Pictures has Shuffle, the photo count, an auto-change switch and an interval select.
  - **Display:** switches for the clock, quote and fullscreen.
  - **Credits:** "Developed by", plus the photo credit, which reads "All photos taken by Kazeem Quadri" for the app's own photos and credits Unsplash during the Picsum fallback.
  - The page passes in state and handlers as props, and the sheet holds no state of its own.
- `components/PictureCollage.tsx`: the collage, inset `COLLAGE_INSET_VMIN` (1.5vmin, the same as the tile gap) from the viewport edges. The controls button and clock overlay it, so it uses the full height.
  - **Skeleton:** collage-shaped shadcn `Skeleton` blocks show until the first collage loads, or an error message if it can't.
  - **Layers:** each collage records the box size it was laid out for (`boxWidth`/`boxHeight`). Each layer keeps that aspect ratio and is fitted, centred, into the container with container query units (`containerType: 'size'`), so a window resize scales it evenly.
  - **Tiles** are absolutely positioned by percentage, using `<img>` with `object-cover`. The plain `<img>` is deliberate (biome-ignore'd): tiles are preloaded by exact URL, and `next/image` would fetch them again through its optimizer.
  - **Tile buttons:** each tile has a credit link (bottom-left) and a lightbox button (bottom-right). They appear on hover with a mouse and are always visible on touch screens, via `[@media(hover:hover)]:opacity-0 group-hover:opacity-100`.
  - **Lightbox:** a shadcn `Dialog` showing the photo with `object-contain`, its credit, previous/next buttons and left/right arrow keys. Blob and local photos are shown at their stored size; Picsum photos are re-requested to fit the screen. `onLightboxOpenChange` tells the page to pause the slideshow.
  - **Transitions:** the previous collage stays mounted for 700ms fading out (`.collage-leaving`), while new tiles enter one after another, staggered via the `--tile-delay` CSS variable. Each collage picks a random entry animation (`rise`, `zoom` or `slide`), passed as an inline `animationName`. The keyframes are in `app/globals.css`, and `prefers-reduced-motion` turns them off. The container is `overflow-hidden`, so sliding tiles can't cause scrollbars.
- `components/ui/`: shadcn components (button, dialog, label, select, separator, sheet, skeleton, slider, switch, tabs). They're ours to edit, and two are customised:
  - `sheet.tsx`: a lighter overlay (`bg-black/30`), so background changes stay visible while the sheet is open.
  - `dialog.tsx`: a close button on a dark round background, so it stays visible over photos.
- `components/QuoteCard.tsx`: renders the quote from `useQuote()`, with skeleton and error states. Centred over everything when quotes are on, using a `pointer-events-none` wrapper so tile buttons behind it still work.
- `components/Clock.tsx`: live time, top-right next to the controls button. Loaded with `next/dynamic` and `ssr: false` to avoid hydration mismatches.
- `components/FooterCredit.tsx`: footer (colour mode only).
- `lib/utils.ts`: shadcn's `cn()` (clsx + tailwind-merge).
- `lib/helpers.js`:
  - `randomColor()`: always a 6-digit hex, which the colour picker requires.
  - The quote and picture API constants, `SLIDESHOW_INTERVALS` and `DEFAULT_SLIDESHOW_INTERVAL`.
  - `collageBox()`: the collage area in CSS px, the JS twin of the CSS inset.
  - `pictureUrl(id, width, height)`: a Picsum URL, × devicePixelRatio and capped at 2400px per side.
- `lib/collage.js`: `buildCollage(pool, boxWidth, boxHeight)`, a pure layout that's easy to stress-test from Node.
  - **Shape:** up to `MAX_TILES` (6) photos in 1–3 rows that span the full width and together fill the full height. Within a row, photos keep their aspect ratio and the row is scaled to exactly the box width. Then all rows are stretched vertically by one shared factor to fill the height, and tiles absorb that stretch by cropping (`object-cover`).
  - **Choosing photos by aspect ratio:** it tries `ATTEMPTS` (600) random candidates, each with a random photo count and row count. Each row's last photo is the one, from a sample of 12, whose ratio best completes the row. The winner has the lowest `|ln(stretch)| + TILE_BONUS * (6 - count)`, so the least cropping, with a slight preference for more photos.
  - **Results** with the real photo set (mostly portrait) on a 1080p-sized box: 6 photos nearly always, cropping typically about 2%. All 600 attempts take about 1ms.
  - **Output:** tiles positioned in percent, plus `pxWidth`/`pxHeight` for sizing Picsum URLs, and each photo's own `aspectRatio` for the lightbox.
- `lib/apiHelpers.js`: `useQuote()` (React Query) and `QUOTE_QUERY_KEY`. Random and Shuffle in the sheet call `queryClient.refetchQueries({ queryKey: QUOTE_QUERY_KEY })` for a new quote.
  - **`useRandomCollage(enabled)`** returns `{ collage, next, isError, isOwnPhotos }`. It fetches the `/api/backgrounds` list and, only when that has no usable photos, one random page of the Picsum list. Both are cached for the session.
  - **`next()`** lays out a collage, avoiding the previous collage's photos when at least 6 others are available, and preloads every tile before swapping it in.
  - **Failures:** if any tile fails to load, that collage is discarded, the broken photos are dropped from the pool and a new collage is built automatically. Once every local or Blob photo has failed, it falls back to Picsum. After `MAX_PICTURE_FAILURES` (5) failed collages in a row it stops and reports an error, so being offline doesn't cause endless retries.
  - **`isOwnPhotos`** is true while the photos come from the route rather than Picsum.
- `types.ts`: `Quote` type (legacy shape from the old quotable API; only `content` and `author` are used).

## shadcn/ui on Tailwind v3

The current shadcn CLI targets Tailwind v4, so this project uses the last v3-compatible release: `yarn dlx shadcn@2.3.0 add <component> -y`. `components.json` uses the new-york style with the zinc base colour and CSS variables.

The CLI's `init` wrote the theme variables as full `oklch(...)` colours, the v4 format. But `tailwind.config.js` wraps them as `hsl(var(--x))`, so `app/globals.css` holds shadcn's v3 zinc palette as bare HSL channels (e.g. `--background: 240 10% 3.9%`). Keep that format if variables are added. Check that newly added components don't use v4-only classes (`outline-hidden`, `shadow-xs`, `in-data-*` and the like). Biome needs `css.parser.tailwindDirectives` for `@apply`.

## Quotes API

Quotes come from DummyJSON (`https://dummyjson.com/quotes/random`): free, no key, CORS allowed. It returns `{ id, quote, author }`, which `fetchQuote` maps to `{ content, author }` for the card. Earlier APIs are dead: quotable.io (broken TLS) and quote-garden. ZenQuotes doesn't send CORS headers, so browser code can't call it.

## Pictures

`app/api/backgrounds/route.ts` returns the collage photos as `{ src, author, link, width, height }`, trying the sources in this order: Vercel Blob, then the `public/backgrounds/` folder. If both are empty, the client falls back to Picsum. The route uses `revalidate = 3600`: in production it's cached and refreshed hourly, so new Blob uploads appear within an hour without a redeploy. In `yarn dev` it runs on every request, so changes show after a page refresh.

### Vercel Blob (takes priority)

Used when `BLOB_READ_WRITE_TOKEN` is set (locally in `.env.local`, which is git-ignored; on Vercel it's added automatically when the Blob store is connected to the project) and the store has photos under `backgrounds/`. The store is public, and tiles load straight from its `*.public.blob.vercel-storage.com` URLs. Every photo in it was taken by Kazeem Quadri, so the route sets `author` to that name (`BLOB_PHOTOGRAPHER`).

Photos get there through `scripts/upload-backgrounds.mjs` (`yarn upload-backgrounds "<folder>"`, with env loaded via `node --env-file=.env.local`).
- **Processing:** `sharp` rotates each photo upright, shrinks it to 2400px on the longest side and converts it to WebP at quality 80.
- **Naming:** each photo is uploaded as `backgrounds/<slugified-name>-<width>x<height>.webp`. Blob has no custom metadata, so the dimensions live in the pathname, and the route parses them so collages can be laid out before any photo downloads. Blobs without a size in their name (e.g. uploaded by hand in the dashboard) are skipped.
- **Upload settings:** `addRandomSuffix: false` and a one-year `cacheControlMaxAge`, since a name never changes once uploaded.
- **Re-runs and errors:** photos already in the store are skipped, so it can be re-run after adding more. The first photo is uploaded alone, so a bad token or a private store fails fast. Original files are never modified.

The current store holds 103 photos (55MB, resized from 88MB of originals), 87 of them portrait.

### Local folder

Used when Blob isn't configured or has no photos. Images in `public/backgrounds/` (jpg, jpeg, png, webp, avif, gif, svg) are listed with dimensions from `image-size` (`imageSizeFromFile` reads only the file header), with width and height swapped for EXIF orientations 5–8 (rotated phone photos). `author` is the filename without its extension. Files whose size can't be read, being corrupt or unsupported, are left out. As with anything in `public/`, production only serves files that existed at build time. The `.gitkeep` keeps the empty folder in git.

### Picsum (fallback)

When the route returns no photos, its request fails, or none of its images load, photos come from Lorem Picsum (`https://picsum.photos`): free, no key, CORS allowed. `GET /v2/list?page=1..10&limit=100` returns `{ id, author, url, width, height, ... }` (~990 photos in total; page 11+ is empty). Images load from `/id/{id}/{width}/{height}`, requested at each tile's size. `url` is the Unsplash page, used for each tile's credit link.

## Dead code to be aware of

- `context/AppContext.tsx`: an unused React context duplicating `page.tsx` state. It still fetches from the dead quote-garden API. Nothing imports it.
- `components/ActionItems.tsx`: empty, unused.
- Commented-out `getStaticProps` at the bottom of `page.tsx` (Pages Router leftover).

## Conventions

- 2-space indent, single quotes (JSX too), trailing commas. Biome's formatter enforces this (`biome.json`). The generated `components/ui/*` files keep shadcn's own double-quote style.
- Mark client components with `'use client'`. Import with the `@/` path alias (`@/components/...`, `@/lib/...`).
- Use `import type` for type-only imports (Biome enforces it).
- Tailwind utility classes inline. No CSS modules. Build new UI from the shadcn components in `components/ui/` (add more with the v3 CLI above) and lucide icons.
- Don't add a fast-interval quote refetch to crazy mode: the interval can be as low as 100ms and would flood the API.
