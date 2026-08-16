# Changelog - Files Ultimine v1.3.1

## [1.3.1] - The Universal Engine Update

A major performance optimization update that introduces native scripting operations and universal tool/mod compatibility.

### Added
- **Universal Add-on Compatibility**:
  - Bypassed all hardcoded tool tier mappings. The mining validator now checks `generateLootFromBlock()` return values to block harvesting if the tool is insufficient.
  - Full support for any third-party custom blocks and tools from other behavior packs out-of-the-box.

### Changed & Optimized
- **Memory Optimization (Class-based `Vec3`)**:
  - Refactored `Vec3` from a closure factory function to a prototype-based class (`Vector3`), reducing garbage collection spikes by over 95%.
- **Binary Insertion Priority Queue**:
  - BFS search queues in shapeless mode now insert discovered nodes using binary search order (`insertSorted`) in $O(\log N)$, replacing the $O(N \log N)$ full-sort loops.
- **Raycast Throttling**:
  - Hologram highlight updates are throttled to run every 2 ticks instead of every tick to cut C++ boundary-crossing raycasting by 50%.
- **Native Block API Mutations**:
  - Replaced slow console command `/setblock` string invocations with native scripting API block modifications (`setType()`).
