# Blank Page

A single-page Next.js app that fills a screen (typically a second monitor) with a solid color or a photo. Extras: random color/photo, "crazy mode" (background changes on an interval), fullscreen toggle, a clock, and an optional random quote card.

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
- `components/QuoteCard.tsx`: renders the quote from `useQuote()`, with skeleton and error states. Rendered only while quotes are toggled on.
- `components/Clock.tsx`: live time. Loaded with `next/dynamic` and `ssr: false` to avoid hydration mismatches.
- `components/FooterCredit.tsx`: footer.
- `lib/helpers.js`: `randomColor()`, the quote and picture API constants, and `pictureUrl(id)` (builds a Picsum URL sized to the viewport × devicePixelRatio, capped at 3840×2160).
- `lib/apiHelpers.js`: `useQuote()` (React Query) and `QUOTE_QUERY_KEY`. The Random button in `page.tsx` calls `queryClient.refetchQueries({ queryKey: QUOTE_QUERY_KEY })` to get a new quote. Also `useRandomPicture(enabled)`, which returns `{ picture, next, isError }`: it fetches one random page of the Picsum list (cached for the session), and `next()` preloads a random photo before swapping it in.
- `types.ts`: `Quote` type (legacy shape from the old quotable API; only `content` and `author` are used).

## Quotes API

Quotes come from DummyJSON (`https://dummyjson.com/quotes/random`): free, no key, CORS allowed. It returns `{ id, quote, author }`, which `fetchQuote` maps to `{ content, author }` for the card. Earlier APIs are dead: quotable.io (broken TLS) and quote-garden. ZenQuotes doesn't send CORS headers, so browser code can't call it.

## Pictures API

Background photos come from Lorem Picsum (`https://picsum.photos`): free, no key, CORS allowed. `GET /v2/list?page=1..10&limit=100` returns `{ id, author, url, ... }` (~990 photos in total; page 11+ is empty). Images load from `/id/{id}/{width}/{height}`. `url` is the Unsplash page, used for the "Photo: author" credit link shown in place of the hex colour. In picture mode, crazy mode never swaps faster than `PICTURE_MIN_INTERVAL` (3s), because each swap downloads a full-screen image.

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
