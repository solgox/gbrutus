# G Brutus Power

A cinematic, scroll-driven website concept for a digital design studio. A fictional marine restoration illustrates what a client's work might look like as an immersive narrative. The imagery is generated concept art; it does not depict an actual customer repair.

## Run locally

Open `public/index.html` in a browser or serve the `public/` folder as a static site. The website itself has no build step, API key or external dependency.

## Deploy

The public site is hosted as a Cloudflare Worker with Git integration for `solgox/gbrutus`. The `wrangler.jsonc` file publishes only `public/`, keeping `node_modules` and other build files outside the static assets. Cloudflare uses the repository root, with `npx wrangler deploy` as its production deploy command and `npx wrangler preview` for branch previews. Commits to `main` can then deploy to [gbrutuspower.com](https://gbrutuspower.com/).

## What is inside

- `public/index.html`: six chapters, studio story, before and after comparison, contact.
- `public/styles.css`: editorial layout, immersive stages, responsive and reduced-motion styling.
- `public/script.js`: scroll-controlled cleaning of the same aligned hull, restrained camera movement, detail studies, HUD, chapter navigation, atmosphere and comparison.
- `public/assets/`: aligned before and after views, three close-up detail studies and a return-to-water frame, optimized as WebP.

The main boat stays in place while a masked clean version advances across its hull as the visitor scrolls. Close-up studies provide craft context, and the departure is the final shot. The camera uses small 2.5D movements without a real-time 3D engine. The imagery is concept art; it should never be represented as a documented restoration case study.

The contact button opens `hello@gbrutuspower.com`. Confirm that the mailbox exists before using the site to receive leads.
