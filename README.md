# File's Ultimine

**File's Ultimine v1.3.3** — An unofficial Bedrock remake of Java's FTB Ultimine, featuring universal add-on compatibility, intelligent mining validation, and optimized performance.

This repository contains both the Behavior Pack (BP) with scripting and the Resource Pack (RP) for visual elements.

Repository: [GamerFile/ultimine tree - main](https://github.com/GamerFile/ultimine/tree/main)

## Features

- **Universal Add-on Compatibility**: Automatically works with any custom tool, block, or ore from other behavior packs and add-ons. No manual configuration needed.
- **Multiple Mining Patterns**: Shapeless, Small Tunnel, Small Square (3x3), Large Tunnel (3x3), Mining Tunnel, Escape Tunnel
- **Intelligent Mining Validation**: Respects tool levels—you won't waste durability trying to mine blocks your tool can't harvest
- **Performance Optimized**: 90% reduction in memory allocation during block highlights and mining. Stutter-free performance on all devices
- **Smart Block Highlighting**: Resource-friendly preview holograms with responsive visual feedback
- **Native Tool Actions**: 
  - Create Farmland with Hoe
  - Make Grass Paths with Shovel
  - Strip logs with Axe
  - Scrape copper blocks with Axe
- **Massive Block Selection**: Mine up to 64 blocks at once
- **Built with Bedrock Script API** using `@minecraft/server 2.6.0` and `@minecraft/common 1.2.0`

## Requirements

- **Minecraft Bedrock Edition** 1.21.100 or higher (Script API support required)
- Both Behavior Pack (BP) and Resource Pack (RP) folders added to your Minecraft world
- A behavior pack environment that supports Bedrock scripts

## Quick Start

1. **Download**: Clone or download this repository
2. **Locate Minecraft Folder**: Navigate to `%appdata%\.minecraft\com.mojang\` (Windows) or equivalent on your platform
3. **Install Packs**:
   - Copy the `BP` folder to `com.mojang/behavior_packs/` (rename to `FileUltimineB` or similar)
   - Copy the `RP` folder to `com.mojang/resource_packs/` (rename to `FileUltimineR` or similar)
4. **Create World**:
   - Launch Minecraft and create a new world
   - In world settings, add both packs from the available list
5. **Play**: Join the world and enjoy Ultimine!

## Installation

### Option 1: Manual Installation
1. Copy `BP` folder to your behavior_packs directory
2. Copy `RP` folder to your resource_packs directory
3. Create a new world and apply both packs
4. Restart the world if scripts don't load immediately

### Option 2: With Pack Building Tools
If you use a tool like **Ore UI**, **Blockbench**, or another Bedrock add-on builder:
1. Import both BP and RP folders into your project
2. Build/export the pack
3. Follow the manual installation steps above

### Option 3: Install from Releases & Tags (recommended for non-developers)
You can install a released version without building from source by using the Releases or Tags on GitHub.

- Using Releases:
  1. Go to the Releases page: https://github.com/GamerFile/ultimine/releases
  2. Find the release you want (for example `v1.3.3`).
  3. Download the provided release assets (BP.zip / RP.zip) if available. If assets are not provided, download the "Source code (zip)" for that release.
  4. Extract the archive and copy the `BP` and `RP` folders to your `com.mojang/behavior_packs/` and `com.mojang/resource_packs/` directories respectively.

- Using Tags:
  1. Tags mirror release versions and can be found at: https://github.com/GamerFile/ultimine/tags
  2. Click a tag (for example `v1.3.3`) and download the source archive for that tag (`v1.3.3.zip`).
  3. Extract and copy `BP` and `RP` as described above.

- Git clone a specific tag (advanced):
  ```bash
  git clone --branch v1.3.3 --single-branch https://github.com/GamerFile/ultimine.git
  ```
  After cloning, copy the `BP` and `RP` folders from the checkout into your Minecraft packs directories.

Notes:
- Always verify the release or tag matches the Minecraft and Script API version required (see Requirements above).
- If downloading source archives, make sure to extract and locate the `BP` and `RP` folders inside the archive before installing.

### Note on Script Modules
The scripts are configured in `BP/manifest.json`:
- Entry point: `scripts/index.js`
- Dependencies: `@minecraft/server` v2.6.0 and `@minecraft/common` v1.2.0
- All event handling is modular (imported in `index.js`)

## Usage

### In-Game Controls
Once installed, simply hold a mining tool and look at a block. Ultimine will:
1. **Highlight compatible blocks** in the mining pattern for your tool
2. **Automatically mine groups** of compatible blocks when you break the target block
3. **Apply tool-specific actions**:
   - **Pickaxe**: Mine ore and stone blocks
   - **Axe**: Fell trees, scrape copper, strip logs
   - **Shovel**: Mine dirt, sand, snow, and create grass paths
   - **Hoe**: Mine crops and create farmland
   - **Custom Tools**: Work with any tool from other add-ons

### Configuration
- **Mining Radius**: Up to 64 blocks can be mined at once
- **Excluded Blocks**: Air, bedrock, water, lava, fire, light blocks, etc. are protected
- **Pattern Selection**: Use hotbar slots to switch mining patterns (see `slotMessageMap` in `BP/scripts/config.js`)

### Project Structure
- `BP/scripts/index.js` — Entry point and event subscription hub
- `BP/scripts/config.js` — Configuration, block groups, and mining patterns
- `BP/scripts/mining.js` — Core mining logic and block validation
- `BP/scripts/state.js` — Game state management
- `BP/scripts/utils.js` — Utility functions
- `BP/scripts/events/` — Event handlers (block break, interaction, combo input)
- `RP/` — Visual assets (models, textures, animations, materials)

For detailed API information, refer to the official [Minecraft Bedrock Script API documentation](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/scripting/index)

## Development

### Building & Testing
1. Clone the repository
2. Copy `BP` and `RP` folders to your behavior and resource pack directories
3. Create a test world with both packs enabled
4. Enable experimental features for Script API support
5. Edit JavaScript files in `BP/scripts/` and test changes by reloading the world

### Code Organization
- **Modular Design**: Each feature is in its own module and imported in `index.js`
- **Event-Driven**: Subscription-based architecture using Bedrock Script API events
- **Performance-First**: Optimized algorithms for minimal memory and CPU usage
- **Config-Driven**: Easy customization through `config.js`

### Debugging Tips
- Check Minecraft debug logs in `logs/` folder
- Use `console.log()` in your scripts for debugging (output visible in debug logs)
- Test with a single pack first (BP or RP separately) to isolate issues

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Report Issues**: Open a GitHub issue with:
   - Clear description of the problem or feature request
   - Steps to reproduce (for bugs)
   - Expected vs. actual behavior

2. **Submit Pull Requests**: 
   - Include a description of changes
   - Test with the latest Minecraft version (1.21.100+)
   - Mention any compatibility concerns
   - Keep code style consistent with existing files
   - Ensure compatibility with other add-ons

3. **Code Standards**:
   - Use ES6+ JavaScript
   - Add comments for complex logic
   - Follow existing naming conventions
   - Test performance impact of changes

For larger changes, please open an issue first to discuss the approach.

## License

See the [LICENSE](LICENSE) file in this repository for full licensing information.

## Changelog

See [CHANGELOG.md](changelog.md) for a detailed history of updates, bug fixes, and new features.

### Latest Release (v1.3.3)
- **Axe Copper Scraping Support**: Axes can now select and scrape scrapable copper blocks
- **Targeted Copper Validation**: Only valid scrapable copper states are highlighted
- Refined tool interaction patterns

## Support & Contact

- **Issues & Bug Reports**: [Open an issue on GitHub](https://github.com/GamerFile/ultimine/issues)
- **Discussions**: Use GitHub Discussions for feature requests and questions
- **Compatibility**: Works with Minecraft Bedrock Edition 1.21.100+
