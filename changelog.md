# Changelog - Files Ultimine v1.2.1

## [1.2.1] - Silk Touch & Combo Fixes

An update addressing drop rules compatibility and hotbar control fixes.

### Added
- **Silk Touch Blocks Harvest**:
  - Added block collections and validations in `config.js` (`SILK_TOUCH_SELF_DROP` and `isSilkTouchable`) to track blocks that require Silk Touch to harvest themselves (e.g. ice, amethyst buds, beehives, nylium, grass block).
  - Integrated harvesting logic in `breakBlock.js` to spawn the correct drop block when mined with Silk Touch.

### Fixed
- **Hotbar Index Boundary Check**:
  - Moved invalid selected slot checks (> 5) into the main tick loop, fixing index range exceptions when scrolling hotbars while holding sneak.
