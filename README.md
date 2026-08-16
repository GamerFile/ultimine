# ultimine

ultimine is an unofficial remake of Java's FTB Ultimine for Minecraft Bedrock, leveraging the Bedrock Script API.

This repository contains the Bedrock scripting implementation and helper modules (see `index.js`, `utils.js`).

Repository: [GamerFile/ultimine tree - main](https://github.com/GamerFile/ultimine/tree/main)

## Features

- Fast block mining behavior inspired by FTB Ultimine (Java edition)
- Built using the Bedrock Script API for Bedrock Edition
- Lightweight, script-driven implementation suitable for behavior packs

## Requirements

- Minecraft Bedrock Edition (version supporting the Script API)
- A behavior pack environment that allows Bedrock scripts (experimental features may be required)

## Quick Start

1. Copy this repository into a behavior pack folder inside your Minecraft `com.mojang`/behavior_packs directory (or into your workspace if you use a pack-building tool).
2. Ensure the behavior pack is added to your world and enabled in the world settings.
3. Enable any required experimental gameplay features so that the Bedrock Script API is available.
4. Restart the world so the scripts are loaded.

Notes:
- Place script entry files under a `scripts/` (or root) folder inside the behavior pack and reference them according to the Bedrock Script API manifest/module configuration for your target Minecraft version.

## Installation

- Manual: Copy the repository contents into your behavior pack folder and add the pack to your world.
- With tooling: If you use a pack builder or pipeline for Bedrock add-ons, include the repository contents in the pack output and follow your tool's packaging steps.

## Usage

- The main entry point is `index.js`. Load this script as part of your behavior pack's script configuration.
- The code is organized with helper functions in `utils.js`.
- Tweak configuration in `index.js` (or other modules) to adjust mining radius, speed, or block filters for your use case.

For details about configuring scripts in a behavior pack, refer to the Minecraft Bedrock Edition Script API documentation for your game version.

## Example (behavior pack layout)

A simple pack layout might look like:

- my_behavior_pack/
  - manifest.json
  - scripts/
    - index.js
    - utils.js
  - other files...

Refer to official documentation to configure script modules/entries in `manifest.json` — the exact fields depend on the Bedrock version and script API you target.

## Development

- This project is written in JavaScript. Edit the `.js` files and test by installing the behavior pack into a Bedrock instance.
- Run quick manual tests in a local Bedrock world (enable experimental features as necessary).

## Contributing

Contributions are welcome. Please open issues to discuss changes before sending larger pull requests. When opening PRs, include:

- A short description of the change
- How to reproduce or test it
- Any compatibility notes (target Bedrock version, required experimental flags)

## License

See the `LICENSE` file in this repository for licensing information.

## Contact

Raised issues on GitHub are the best way to report problems or request features.
