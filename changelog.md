# Changelog - Files Ultimine v1.2.2

## [1.2.2] - The Loot Table Update

Integrated Bedrock's native loot table manager to simplify drop logic and remove hardcoded configurations.

### Added
- **Native Loot Tables Integration**:
  - Replaced manual drop calculations, fortune multipliers, and drop lists with Minecraft's native `LootTableManager.generateLootFromBlock(block, tool)`.
  - Cleared out custom block-to-drop mapping directories (`oreDropMap` and `SILK_TOUCH_SELF_DROP`) from `config.js`.
  - Drops are generated dynamically using survival rules and teleported directly to the primary mined coordinates block.
- **XP Gating**:
  - Maintained `/summon xp_orb` command triggers for ore blocks mined without Silk Touch, as vanilla loot tables do not generate XP. 
