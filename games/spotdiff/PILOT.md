# Double Take photographic pilot — 0.3.0

Development copy only. No GitHub push or production deployment occurred.

## What changed

The new default is a coherent photographic cruise pool deck: furnishings and foreground objects are photographic too. Eleven authored object regions offer color changes and object removal, selected in deterministic seeded combinations. Both pictures fit simultaneously without page scrolling: stacked on portrait phones, side by side where landscape offers more space. Existing synchronized zoom/pan remains available for small details.

This pilot contains **one photographic environment**, not an endless supply of unique photographs. The level counter and seeded combinations continue, but the location and authored variants recur. Recommend six distinct environments for the first release: cruise deck, harbour café, tropical garden, railway carriage, cozy study, Mediterranean courtyard. Validate this pilot before commissioning the other five. Unlike the original renderer, the pilot currently supports color and presence changes only; difficulty still controls counts, hints and goal times.

Settings → Scenes → Original 12 places keeps the original procedural collection available. Scene preference applies to the next puzzle; it does not discard the current one. Existing untagged saves resume through the original generator. Photographic saves use the optional `renderer: photo-cruise-v1` field in the existing `spotdiff.game` key. No storage keys were renamed. Stats, hint balances, stars, progress and backup format remain shared. The original DT logic script is byte-identical to the uploaded 0.2.0 version.

## Local review

Serve this project folder using an ordinary development web server. On Windows with Python installed:

```
py -m http.server 8080
```

Visit `http://localhost:8080/games/spotdiff/`. For offline tests use localhost or HTTPS, not a file URL. A phone visiting a computer's plain HTTP LAN address cannot install a service worker; use an HTTPS development host for real-device PWA testing.

A previously saved original puzzle intentionally resumes unchanged. Complete it and choose Next level to enter photographic mode. Fresh browser profiles start with the new scene. Scene selection can be changed in Settings without clearing data.

## Offline and asset contract

Fourteen local WebP files add 745,920 bytes (728.4 KiB). Every image and the new renderer are included in the existing Double Take service-worker cache group, now `0.3.0` with 19 entries. No runtime network, image-generation service, external fonts or new library dependencies were added. Legacy artwork is loaded lazily when its original cruise scene is used.

Photo files are decoded before gameplay begins. Missing artwork shows Retry and All games; it does not start invisible targets or consume time. An unknown saved renderer version leaves the save untouched and requests an update. Keep the `photo-cruise-v1` assets, seed algorithm, region ordering and signature stable: changing them in place would change saved puzzles. Future artwork changes require a new renderer ID and a compatible resume path.

Authored patches affect bounded regions only. Object removal includes its shadow/reflection as part of that same difference. Closely spaced drink and cocktail-parasol targets cannot both be selected as separate differences. Early Relaxed/Normal boards exclude the two smallest targets and guarantee a presence change. More local art increases installation bytes, decoded image memory and update storage. Six environments should be budgeted and tested rather than eagerly decoded together. No PWA can guarantee indefinite storage retention if the OS evicts site data; this pilot adds no new online dependency after successful caching.

## Verification

Chromium automation passed:

- 504 complete original seeded levels match the upload; original DT logic hash unchanged.
- 2,000 photographic seeds: stable output, valid difference counts and states, correctly mirrored target bounds; frozen digest fixture.
- Every authored state pair remains visibly different at 355px image width; changes stay inside its target region.
- Thirteen phone/tablet/desktop viewports fit both pictures without page overflow; simulated safe areas and 44px controls checked.
- Mouse and touch finds, synchronized wheel/pinch zoom, pan/reset, hints, difficulty, timer, restart/new-level, settings, themes, sound/music and ad controls.
- Saved original puzzle migration, saved photo resume, scene preference changes, completion, stars/stats and return to collection.
- Eleven original non-cruise renderers remain pixel-identical at sampled seeds.
- Real service-worker update from original 0.2.0 preserves the old save and caches all 19 entries.
- Browser process closed, reopened offline, photographic progress resumed; game/art served by service worker; offline tap/menu and backup restore succeeded.
- DPR 2/3 canvas resolution and missing-image handling; no external runtime requests or browser script errors in the gameplay smoke run.

Physical iPhone/iPad Safari, Android PWA, real browser bars/rotation, reboot and multi-day offline retention remain to be checked on hardware. Emulated Chromium results do not establish those behaviors. Verify legibility of the smallest Expert differences on an actual phone before adding more scenes.

## Reproduce checks

Node.js and Playwright are development-only dependencies, never shipped as runtime dependencies. Set `CHROMIUM_PATH` if using a separately installed Chromium, `DOUBLE_TAKE_BASELINE` to the unchanged uploaded 0.2.0 collection, and optionally `DOUBLE_TAKE_TEST_OUTPUT` for reports.

```
node games/spotdiff/tests/seed-compat.cjs
node games/spotdiff/tests/photo-seeds.cjs
node games/spotdiff/tests/photo-smoke.cjs
node games/spotdiff/tests/photo-pixels.cjs
node games/spotdiff/tests/photo-offline.cjs
node games/spotdiff/tests/photo-extra.cjs
```

Tests without the `photo-` prefix (except `seed-compat`) document the earlier hybrid pilot and are retained as historical checks. The photographic seed fixture is versioned; do not recapture it casually to silence a compatibility failure.

## Reversibility

Uploaded baseline: `55c6713`. Previous hybrid pilot restore point: `121b83a`, branch `restore/cruise-hybrid-0.2.1`. New work lives on `double-take-photo-pilot`. The review ZIP includes a Git bundle with the complete local history. Rollback should be reviewed in a separate profile: an older app does not understand a newer photographic save. Export a backup before testing older versions against existing data.
