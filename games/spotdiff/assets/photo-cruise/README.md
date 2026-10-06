# Photographic cruise assets, v1

Created with the built-in image generation/editing tool for this pilot, using the user's attached cruise comparison as a visual quality reference. The runtime requires only these locally bundled WebP files. There are no remote image calls.

The source was generated as one 1536×1024 photograph. Three edits independently removed the book, pool ball/reflection, and hat/ribbon/shadow. A fourth edit authored ten alternate surface colors in the same photographic composition. `generation-prompts.json` records the exact final prompts. No AI model is bundled with the game.

The base was compressed to WebP at quality 91. Removal and color variants were cropped to the regions listed in `../../photo-cruise.js` and compressed to WebP; color patches use quality 94. Cropping/compression used Node sharp. Runtime draws the same base for both pictures and composites only the selected bounded patches, feathering six source pixels at internal patch edges. It does not recolor the image using HSV filters or draw cartoon replacement objects.

Only local patch pixels enter gameplay, so unrelated differences in full generated edits cannot create unmarked differences elsewhere. Each region corresponds to one target. The generated source PNGs are production intermediates, not runtime dependencies. The WebP assets are the canonical v1 artwork; do not regenerate or replace them in place for an existing renderer ID.

Fourteen images: one base, three removal patches, ten color patches; 745,920 bytes total. The service worker lists each explicitly. Attribution/provenance documentation is not required by the runtime and is not precached.
