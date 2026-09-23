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
- `public/ship-scene.js`: WebGL yacht, a camera that orbits one full turn, and scroll-controlled grime removal on the 3D hull.
- `public/assets/3d/`: desktop and mobile optimized GLB models, a local Three.js runtime, and license notices. No third-party CDN is needed at runtime.
- `public/assets/`: aligned before and after views, three close-up detail studies and a return-to-water frame, optimized as WebP.

The opening and final photographs bookend a genuine 3D orbit. While the camera completes a 360-degree circuit, a shader clears grime progressively along the model's hull. The rendered yacht is a licensed concept model, not a photogrammetric reconstruction of the generated yacht in the still imagery. The aligned photographic cleaning effect remains a fallback if WebGL is unavailable or reduced motion is requested. This concept should never be represented as a documented restoration case study. See `ATTRIBUTION.md` for the model source and code licenses.

The contact button opens `hello@gbrutuspower.com`. Confirm that the mailbox exists before using the site to receive leads.
