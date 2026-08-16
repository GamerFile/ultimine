# Changelog - Files Ultimine v1.2.0

## [1.2.0] - The Hologram & Modularization Update

A massive architectural upgrade splitting the pack into a Behavior Pack (BP) and Resource Pack (RP) structure, while introducing visual coordinates highlights.

### Added
- **Visual Selector Outlines (Resource Pack)**:
  - Added animations, entity schemas, render controllers, custom geometry, and textures to display a holographic frame over the blocks targeted by the player.
  - Custom entity `selected_block` spawned on targeted positions to show selection highlights.
- **Code Modularization**:
  - Refactored the monolithic script codebase into distinct, specialized modules:
    - `index.js`: Main entry point.
    - `config.js`: Hardcoded configuration variables (ore maps, groups, shears settings).
    - `mining.js`: Mining shape coordinates calculation.
    - `highlight.js`: Selected block wireframe spawning logic.
    - `state.js`: Player state cache (combos, active highlights, hunger checks).
    - `utils.js`: Math clamp, vector helpers, and chunked job runner.
- **Isolated Event Subscribers**:
  - `events/breakBlock.js`: Main break block subscriber.
  - `events/comboInput.js`: Double-sneak combo sequence detection.
  - `events/interactBlock.js`: Shovel pathing, axe copper scraping / log stripping, and hoe tilling.
