# G Brutus Power

A cinematic, scroll-driven website concept for a digital design studio. A fictional marine restoration illustrates what a client's work might look like as an immersive narrative. The imagery is generated concept art; it does not depict an actual customer repair.

## Run locally

Open `index.html` in a browser or serve this folder as a static site. There is no build step, package manager, API key or external dependency.

## Deploy

The public site is hosted as a Cloudflare Worker with Git integration for `solgox/gbrutus`. The `wrangler.jsonc` file configures this repository as a static-asset Worker. Cloudflare should use the repository root, with `npx wrangler deploy` as its production deploy command and `npx wrangler preview` for branch previews. Commits to `main` can then deploy to [gbrutuspower.com](https://gbrutuspower.com/).

## What is inside

- `index.html`: six chapters, studio story, before and after comparison, contact.
- `styles.css`: editorial layout, immersive stages, responsive and reduced-motion styling.
- `script.js`: scroll camera, shot transitions, hull wipe, HUD, chapter navigation, atmosphere and comparison.
- `assets/`: paired wide views and four generated close-up / return-to-water frames, optimized as WebP.

The camera simulates depth with perspective and photo motion, without a real-time 3D engine. The concept imagery deliberately communicates the idea; it should never be represented as a documented restoration case study.

The contact button opens `hello@gbrutuspower.com`. Confirm that the mailbox exists before using the site to receive leads.
