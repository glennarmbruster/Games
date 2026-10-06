# Peg Lagoon scenic edition

18 photographic environments generated using the built-in image generation tool, one per existing scene. Exact prompts are in prompts.json. Canonical runtime files are the local *-v1.webp images, resized to 800×1200 and compressed at quality 84 with sharp. The originals are creation intermediates, not runtime dependencies.

photo-art.js keeps at most two decoded photographs, flattens the active one into the existing cached backdrop canvas, and retains the procedural renderer as an immediate fallback if a file fails. The service worker caches every image before the new group activates. No remote image service is used during play.

The original 18-scene rotation, procedural level generation, physics, scoring, powers, guides, maps and storage are unchanged. Foreground targets remain crisp canvas sprites; the target peg has a restrained engraved ring. The launcher is rendered as metal. Guide portraits and the animated catcher retain their existing identity, so this is photographic scenery with readable arcade pieces rather than a wholly photographic simulation.
