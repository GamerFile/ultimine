# ultimine

ultimine is an unofficial remake of Java's FTB Ultimine for Minecraft Bedrock, leveraging the Bedrock Script API.

This repository contains the Bedrock scripting implementation and helper modules (see `index.js`, `utils.js`).

## Features

- Fast block mining behavior inspired by FTB Ultimine (Java edition)
- Built using the Bedrock Script API for Bedrock Edition
- Lightweight, script-driven implementation suitable for behavior packs

## Requirements

- Minecraft Bedrock Edition (version supporting the Script API)
- A behavior pack environment that allows Bedrock scripts (experimental features may be required)

## Installation

1. Copy the contents of this repository into a behavior pack folder for your world or server.
2. Ensure the behavior pack is added to your world and enabled.
3. Enable any required experimental gameplay features so that the Bedrock Script API is available.

(If you use a specific tooling/packer for Bedrock add-ons, adapt these steps to your workflow.)

## Usage

- The main entry point is `index.js`. Load this script as part of your behavior pack's script configuration.
- The code is organized with helper functions in `utils.js`.

For details about configuring scripts in a behavior pack, refer to the Bedrock Edition documentation for the Script API.

## Development

- This project is written in JavaScript. Edit the `.js` files and test by installing the behavior pack into a Bedrock instance.
- Submit issues or pull requests if you find bugs or want to propose improvements.

## Contributing

Contributions are welcome. Please open issues to discuss changes before sending larger pull requests.

## License

See the `LICENSE` file in this repository for licensing information.

## Contact

Raised issues on GitHub are the best way to report problems or request features.
