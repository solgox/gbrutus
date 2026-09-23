# G Brutus Power

A cinematic, scroll-driven website concept for a digital design studio. A fictional marine restoration illustrates what a client's work might look like as an immersive narrative. The imagery is generated concept art; it does not depict an actual customer repair.

## Run locally

Open `public/index.html` in a browser or serve the `public/` folder as a static site. The website itself has no build step, API key or external dependency.

## Deploy

The public site is hosted as a Cloudflare Worker with Git integration for `solgox/gbrutus`. The `wrangler.jsonc` file publishes only `public/`, keeping `node_modules` and other build files outside the static assets. Cloudflare uses the repository root, with `npx wrangler deploy` as its production deploy command and `npx wrangler preview` for branch previews. Commits to `main` can then deploy to [gbrutuspower.com](https://gbrutuspower.com/).

## What is inside

- `public/index.html`: six chapters, studio story, before and after comparison, contact.
- `public/styles.css`: editorial layout, immersive stages, responsive and reduced-motion styling.
- `public/script.js`: story scroll, photographic fallback, HUD, chapter navigation, atmosphere and comparison.
- `public/ship-scene.js`: a single WebGL yacht throughout the story, a scroll-controlled 360-degree camera orbit, layered hull weathering and progressive restoration.
- `public/assets/3d/`: desktop and mobile optimized GLB models, a local Three.js runtime, and license notices. No third-party CDN is needed at runtime.
- `public/assets/`: a generated empty shipyard background for the 3D scene; aligned before and after views, three close-up studies and a return-to-water frame for the WebGL/reduced-motion fallback.

With WebGL enabled, the camera orbits one yacht throughout the scroll story, and a shader removes persistent grime and a surface scar progressively on its actual geometry. The before/after comparison captures that same 3D yacht at one camera angle. The licensed model is a concept asset with no photographic texture maps; the render must not be presented as photography or photogrammetry. The photographic stills show a different, generated yacht and are used only as a fallback when WebGL is unavailable or reduced motion is requested. This concept should never be represented as a documented restoration case study. See `ATTRIBUTION.md` for the model source and code licenses.

The contact button opens `hello@gbrutuspower.com`. Confirm that the mailbox exists before using the site to receive leads.
