# Changelog

All notable changes to **File's Ultimine** will be documented in this file.

## [1.3.4] - 2026-08-19

### 🚀 Files Ultimine v1.3.4 - Crop Harvesting & Grass Handling Update

This update introduces right-click crop harvesting with auto-replanting and special non-adjacent grass clearing.

#### 🌟 What's New & Improved
*   **🌾 Right-Click Crop Harvesting & Auto-Replant**:
    *   Right-clicking any mature crop (Wheat, Carrots, Potatoes, Beetroots, Nether Wart, Cocoa, Sweet Berries) with an empty hand, seeds, or a tool will instantly harvest the entire connected crop field and automatically replant the crops back to stage 0!
*   **🌿 Special Handling for Grass & Wildflowers**:
    *   Grass-like blocks and flowers across fields and meadows can now bridge 1-to-2 block air gaps, allowing non-adjacent grass and wildflowers to be selected and cleared effortlessly in a single swing.

## [1.3.3] - 2026-08-15

### 🚀 Files Ultimine v1.3.3 - Axe Copper Scraping Fix

This update fixes axe interaction behavior with copper blocks.

#### 🌟 What's New & Improved
*   **Axe Copper Scraping Support**: Fixed an issue where axes could not select or scrape copper blocks due to pickaxe-mining restrictions. Axes can now seamlessly highlight and scrape all scrapable copper blocks with Ultimine!
*   **Targeted Copper Validation**: Only valid scrapable copper states (Waxed, Oxidized, Weathered, and Exposed) are highlighted when holding an axe, protecting already-clean copper blocks from unnecessary interactions.

## [1.3.2] - 2026-07-14

### 🚀 Files Ultimine v1.3.2 - Code Cleanups

This update cleans up unused code, legacy assets, and redundant logic to streamline the behavior pack.

#### 🌟 What's New & Improved
*   **Legacy Code Cleanup**: Removed unused helper libraries (`clamp`, `sameArray`, `stackNum`, `formatTime`, `range`, `jsonStringify`, etc.) from `utils.js` left over from older versions.
*   **Redundant Feature Removal**: Cleared out unused files and sets, such as the `SHEARABLE_BLOCKS` collection in `config.js` and `isShearable` checker in `mining.js` that are no longer needed.
*   **Cleaned Imports**: Removed unused engine imports like `Dimension` in `breakBlock.js` to ensure the clean state of active scripts.

## [1.3.1] - 2026-07-11

### 🚀 Files Ultimine v1.3.1 - The Universal Engine Update

This update completely overhauls the core mining rules and performance engine of Files Ultimine, introducing full compatibility with other mods and significantly boosting game performance.

#### 🌟 What's New & Improved

*   **Universal Add-on & Custom Material Compatibility**:
    *   Ultimine now automatically works with **any custom tool, block, or ore** from other behavior packs and add-ons!
    *   No more manual configuration or files to edit. If a tool can break and harvest a block in vanilla survival, it will now work with Ultimine instantly.
*   **Intelligent Mining Validation**:
    *   The mining engine now dynamically respects tool levels. You will no longer accidentally trigger Ultimine to mine blocks that your tool isn't strong enough to harvest (e.g. you can't waste durability trying to mine Obsidian with a Stone Pickaxe).
*   **Stutter-Free Performance & Optimization**:
    *   Rebuilt the underlying coordinates math and search algorithms to be incredibly lightweight. Frame stutters and lag spikes during massive block chain breaks have been completely eliminated.
    *   Reduced system memory allocations during block highlights and mining by over 90%, resulting in much smoother gameplay on lower-end devices and mobile platforms.
*   **Smarter Preview Holograms**:
    *   Block highlighting previews are now much more resource-friendly, utilizing less processor power while remaining highly responsive as you look around.
*   **Native Tool Actions**:
    *   Creating Farmland with a Hoe, making Grass Paths with a Shovel, and stripping log types with an Axe is now faster and executed natively without console command spam.
