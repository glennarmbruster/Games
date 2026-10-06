# Photographic tour v1

Five new environments join the frozen cruise pilot: harbour café, garden retreat, railway lounge, quiet study and sunlit courtyard. All images were created with OpenAI image generation, then compressed/cropped locally. Exact generation prompts are recorded in `prompts.json`; build-machine source paths are provenance only, never runtime dependencies.

The backgrounds and 51 color-variant object layers total about 2.7 MiB. A level combines independently selected original/alternate object states and optional mirroring, using the existing difficulty counts. These are reusable environments, not a fixed list of six puzzles. The five new places currently use color changes; cruise also supports removals. Adding more object variants would increase variety within each environment.

`photo-tour-data.js` defines frozen regions; `photo-tour.js` generates/composes them. New art must receive a new renderer ID to preserve saved puzzles. The original procedural generator and `photo-cruise-v1` are unchanged. A saved cruise puzzle keeps its renderer even if that level number now rotates to another place for new puzzles.

All 77 Double Take offline-group entries are installed by the existing service worker. No network call generates a puzzle. Startup waits for local art to decode before enabling targets or timer, and retains saves on a failed load.

Validation: 2,000 new deterministic levels; 51 visible changes contained in their target bounds at phone resolution; 13 phone/tablet/desktop viewport sizes with both pictures and controls visible without page scrolling; touch, mouse, zoom, settings, six renderer saves and an older cruise save. Original 504-level and 2,000-cruise-seed fixtures still pass.
