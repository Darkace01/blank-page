# Blank Screen

This was created out of frustration of not wanting to turn off my second monitor when I just want to focus on one screen. It's a simple app that would fill your second monitor with a black screen. It also has some fun feature to change the color randomly and also a fun mode to do that continuously.

It was created out of necessity and I'm not sure if it's useful to anyone else. But I'm putting it out there in case it is.

## Unnecessary Features

- [x] Change color randomly
- [x] Change color continuously
- [x] Show Random Quote using [Random Quotes API](https://github.com/lukePeavey/quotable)

## Browser extension

Blank Page is also a browser extension for Chrome and Firefox. It opens on every new tab and from its toolbar button.

### Building it from source

These steps produce exactly the packages submitted to the stores.

Requirements: Node.js 24 and Corepack (included with Node 24). Any OS works. The build needs internet access, because Next.js downloads the Poppins font from Google Fonts and bundles it. No `.env` file or API keys are needed.

```bash
corepack enable
yarn install --immutable
yarn build:extension
```

`package.json` pins Yarn 4.18.1 (`packageManager`), which Corepack uses.

The output is in `dist/`:

- `dist/blank-page-firefox.zip` and `dist/blank-page-chrome.zip`: the packages as submitted
- `dist/firefox/` and `dist/chrome/`: the same files, unzipped

The build script is `scripts/build-extension.mjs`. It runs a static export of the Next.js app (`next build` with `NEXT_PUBLIC_EXTENSION=1`). It then renames `_next/` to `next/`, because extension file names can't start with `_`, and moves Next's inline scripts into files, because the extension's content security policy blocks inline scripts. Finally it writes the manifests and icons. The JavaScript in the package is the Next.js/Turbopack bundle of the TypeScript source in `app/`, `components/` and `lib/`.

### Network access

The extension sends no personal data and has no analytics. It makes these requests:

- `https://dummyjson.com/quotes/random`: random quotes, when quotes are switched on
- `https://blank-page.vercel.app/api/backgrounds`: the list of photos, in picture mode
- `*.public.blob.vercel-storage.com`: the photos themselves

Settings are saved in the extension's local storage, on the device.
