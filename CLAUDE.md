# Blank Page

A single-page Next.js app that fills a screen (typically a second monitor) with a solid color or a collage of photos. Extras: random color/collage, "crazy mode" (background changes on an interval), fullscreen toggle, a clock, and an optional random quote card.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript (`strict: false`)
- Tailwind CSS v3 (`@tailwind` directives in `app/globals.css`)
- TanStack React Query v5 for data fetching, axios as the HTTP client
- Heroicons for the control icons
- Biome for lint/format (no ESLint)
- Yarn 4 (Berry) with `nodeLinker: node-modules` (see `.yarnrc.yml`)

## Commands

```bash
yarn dev      # dev server
yarn build    # production build, also runs the TypeScript check
yarn lint     # biome lint .
yarn check    # biome check . (lint + format + import sorting)
```

There are no tests. Verify changes with `yarn lint` and `yarn build`, then check the page in a browser.

## Layout

- `app/layout.tsx`: root layout. Sets metadata, loads Google Analytics via `next/script` (`NEXT_PUBLIC_GA_ID` from `.env`), wraps children in `Providers`.
- `app/providers.tsx`: client component that creates the `QueryClient` (`refetchOnWindowFocus: false`).
- `app/page.tsx`: the whole UI, a client component. All app state (color, `bgMode` of `'color' | 'picture'`, fullscreen, controls visibility, crazy mode and its interval, quote visibility) lives here in `useState`. Random and crazy mode act on whichever background mode is active, and the reset (arrow) button always returns to a black colour background. The control bar is a row of Heroicons with `onClick` handlers. DOM helpers (`isIOSDevice`, `requestFullScreen`, `exitFullscreen`) sit at module scope so effects don't need them as dependencies.
- `components/PictureCollage.tsx`: renders a collage inset `COLLAGE_INSET_VMIN` (4vmin) from the edges, so the background colour frames it. While the controls are visible, its top edge sits `COLLAGE_BAR_GAP_VMIN` below the control bar instead (`collageTop()`). `page.tsx` measures the bar's bottom edge with a `ResizeObserver` (`controlsBottom`, 0 when hidden) and passes it to both this component and `useRandomCollage`, whose `collageBox()` is the JS twin of these CSS insets. Each collage records the box size it was laid out for (`boxWidth`/`boxHeight`), and each layer keeps that aspect ratio and is fitted, centred, into the container using container query units (`containerType: 'size'`). So when the space changes (controls toggled, window resized) the collage scales evenly instead of being squashed, and the next collage is laid out for the new space. Tiles are absolutely positioned by percentage and use `<img>` with `object-cover`. A plain `<img>` is used on purpose (biome-ignore'd): tiles are preloaded by exact URL, and `next/image` would fetch them again through the optimizer. Hovering a tile shows its credit link. On change, the previous collage stays mounted for 700ms fading out (`.collage-leaving`), while the new tiles enter one after another, staggered via the `--tile-delay` CSS variable. Each collage picks a random entry animation (`rise`, `zoom` or `slide`), passed as an inline `animationName`. The keyframes live in `app/globals.css`, and `prefers-reduced-motion` turns the animations off. The control bar and quote wrapper are `relative z-10` so they sit above it.
- `components/QuoteCard.tsx`: renders the quote from `useQuote()`, with skeleton and error states. Rendered only while quotes are toggled on.
- `components/Clock.tsx`: live time. Loaded with `next/dynamic` and `ssr: false` to avoid hydration mismatches.
- `components/FooterCredit.tsx`: footer.
- `lib/helpers.js`: `randomColor()`, the quote and picture API constants, `collageBox()` (the collage area in CSS px), and `pictureUrl(id, width, height)` (a Picsum URL for one tile, × devicePixelRatio, capped at 2400px per side).
- `lib/collage.js`: `buildCollage(pool, boxWidth, boxHeight)`, a pure justified-rows layout. Rows share a height, each photo keeps its aspect ratio, and each row is scaled to span the box width. Photos are chosen by aspect ratio: while a row has plenty of room it takes the next random photo, and near the end it picks, from a sample of 12, the photo whose ratio best fills the space left. It uses 2–3 rows on landscape screens and 3–4 on portrait ones, never more rows than photos, and at most 5 photos per row. The result is scaled down to fit if too tall, then centred. It returns tiles positioned in percent (so they survive window resizes), plus `pxWidth`/`pxHeight` for sizing Picsum URLs.
- `lib/apiHelpers.js`: `useQuote()` (React Query) and `QUOTE_QUERY_KEY`. The Random button in `page.tsx` calls `queryClient.refetchQueries({ queryKey: QUOTE_QUERY_KEY })` to get a new quote. Also `useRandomCollage(enabled)`, which returns `{ collage, next, isError }`. It fetches the local `/api/backgrounds` list and, only when no local photos are usable, one random page of the Picsum list (both cached for the session). `next()` lays out a collage, avoiding the previous collage's photos when at least 6 others are available, and preloads every tile before swapping it in. If any tile fails to load, that collage is discarded, the broken photos are dropped from the pool and a new collage is built automatically. Once every local image has failed, it falls back to Picsum. After `MAX_PICTURE_FAILURES` (5) failed collages in a row it stops and reports an error, so being offline doesn't cause endless retries.
- `types.ts`: `Quote` type (legacy shape from the old quotable API; only `content` and `author` are used).

## Quotes API

Quotes come from DummyJSON (`https://dummyjson.com/quotes/random`): free, no key, CORS allowed. It returns `{ id, quote, author }`, which `fetchQuote` maps to `{ content, author }` for the card. Earlier APIs are dead: quotable.io (broken TLS) and quote-garden. ZenQuotes doesn't send CORS headers, so browser code can't call it.

## Pictures

### Local folder (takes priority)

Images dropped into `public/backgrounds/` (jpg, jpeg, png, webp, avif, gif, svg) are used for picture mode, and Picsum is skipped. `app/api/backgrounds/route.ts` lists the folder and returns `{ src, author, link, width, height }`, where `author` is the filename without its extension (shown as the credit). Dimensions come from `image-size` (`imageSizeFromFile` reads only the file header), with width and height swapped for EXIF orientations 5–8 (rotated phone photos). Files whose size can't be read, being corrupt or unsupported, are left out of the list. The route is `force-static`. In `yarn dev` it re-reads the folder on each request, so new photos appear after a page refresh. In production it's generated at build time, same as `public/` itself, so add or remove photos before building or deploying. The `.gitkeep` keeps the empty folder in git.

### Picsum (fallback)

When the local folder is empty, its listing fails, or none of its images load, background photos come from Lorem Picsum (`https://picsum.photos`): free, no key, CORS allowed. `GET /v2/list?page=1..10&limit=100` returns `{ id, author, url, width, height, ... }` (~990 photos in total; page 11+ is empty). Images load from `/id/{id}/{width}/{height}`, requested at each tile's size. `url` is the Unsplash page, used for each tile's hover credit link. In picture mode the control bar shows the number of photos in place of the hex colour, and crazy mode never swaps faster than `PICTURE_MIN_INTERVAL` (5s), because each change downloads a whole collage and the entry transition needs time to play.

## Dead code to be aware of

- `context/AppContext.tsx`: an unused React context duplicating `page.tsx` state. It still fetches from the dead quote-garden API. Nothing imports it.
- `components/ActionItems.tsx`: empty, unused.
- Commented-out `getStaticProps` at the bottom of `page.tsx` (Pages Router leftover).

## Conventions

- 2-space indent, single quotes (JSX too), trailing commas. Biome's formatter enforces this (`biome.json`).
- Mark client components with `'use client'`. Import with the `@/` path alias (`@/components/...`, `@/lib/...`).
- Use `import type` for type-only imports (Biome enforces it).
- Tailwind utility classes inline. No CSS modules.
- Don't add a fast-interval quote refetch to crazy mode: the interval can be as low as 100ms and would flood the API.
