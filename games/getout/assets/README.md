# Photographic materials pass

Generated with the built-in image-generation tool; exact prompts in prompts.json. Four local monochrome 512px WebP surface textures, compressed with sharp. Materials are composited into existing geometry using soft-light before clue text and object details are drawn. They do not add or remove puzzle objects, hit targets or clues. Existing room color palettes remain authoritative. This is a material refinement of the illustrated rooms, not a full photographic scene rebuild.

The original renderer remains usable before textures load or if loading fails. Loading a texture invalidates cached room drawings without touching game state. All files are in this game's service-worker group. Engine and room-rule scripts are unchanged.
