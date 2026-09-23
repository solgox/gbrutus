# G Brutus Power

A cinematic, scroll-driven website concept for a digital design studio. A fictional marine restoration illustrates what a client's work might look like as an immersive narrative. The imagery is generated concept art; it does not depict an actual customer repair.

## Run locally

Serve the `public/` folder as a static site, for example from the project root:

```sh
python3 -m http.server 8080 --directory public
```

Then open `http://localhost:8080`. The website itself has no build step or API key.

## Deploy

The public site is hosted as a Cloudflare Worker with Git integration for `solgox/gbrutus`. The `wrangler.jsonc` file publishes only `public/`, keeping `node_modules` and other build files outside the static assets. Cloudflare uses the repository root, with `npx wrangler deploy` as its production deploy command and `npx wrangler preview` for branch previews. Commits to `main` can then deploy to [gbrutuspower.com](https://gbrutuspower.com/).

## What is inside

- `public/index.html`: six chapters, studio story, before and after comparison, contact.
- `public/styles.css`: editorial layout, immersive stages, responsive and reduced-motion styling.
- `public/script.js`: story scroll, photographic fallback, HUD, chapter navigation, atmosphere and comparison.
- `public/ship-scene.js`: an experimental WebGL yacht scene, retained in the source but not loaded by the published page until a visually suitable boat is available.
- `public/assets/3d/`: desktop and mobile optimized GLB models, a local Three.js runtime, and license notices. No third-party CDN is needed at runtime.
- `public/assets/`: a generated empty shipyard background for the 3D scene; aligned before and after views, three close-up studies and a return-to-water frame for the WebGL/reduced-motion fallback.

The published page uses the aligned photographic yacht images throughout the scroll restoration and before/after comparison. The experimental 3D asset is disabled because its untextured appearance does not meet the visual standard of the photographs. The current page does not provide a 360-degree orbit. This concept should never be represented as a documented restoration case study. See `ATTRIBUTION.md` for the model source and code licenses.

The contact button opens `hello@gbrutuspower.com`. Confirm that the mailbox exists before using the site to receive leads.
