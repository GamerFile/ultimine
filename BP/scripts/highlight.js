// Highlight system — spawns per-block wireframe entities
import { system } from "@minecraft/server";
import { Vec3 } from "utils";
import { EDGE_ENTITY } from "./config.js";
import { activeHighlights } from "./state.js";

export function spawnHighlights(blocks, player) {
    const blockSet = new Set(blocks.map(b => Vec3(b).toKey()));
    const has = (x, y, z) => blockSet.has(`${x},${y},${z}`);
    const entities = [];
    const dim = player.dimension;

    for (const b of blocks) {
        const pos = Vec3(b);
        const { x, y, z } = pos;

        // 6 face neighbors
        const north = has(x, y, z - 1);
        const south = has(x, y, z + 1);
        const east = has(x + 1, y, z);
        const west = has(x - 1, y, z);
        const up = has(x, y + 1, z);
        const down = has(x, y - 1, z);

        // Skip fully enclosed blocks
        if (north && south && east && west && up && down) continue;

        // 12 edge-diagonal neighbors
        const ne = has(x + 1, y, z - 1);
        const nw = has(x - 1, y, z - 1);
        const se = has(x + 1, y, z + 1);
        const sw = has(x - 1, y, z + 1);
        const bn = has(x, y - 1, z - 1);
        const bs = has(x, y - 1, z + 1);
        const be = has(x + 1, y - 1, z);
        const bw = has(x - 1, y - 1, z);
        const tn = has(x, y + 1, z - 1);
        const ts = has(x, y + 1, z + 1);
        const te = has(x + 1, y + 1, z);
        const tw = has(x - 1, y + 1, z);

        try {
            const e = dim.spawnEntity(EDGE_ENTITY, pos.center());
            e.addTag(`file_owner:${player.id}`);

            const expr =
                `v.north=${north};v.south=${south};v.east=${east};v.west=${west};v.up=${up};v.down=${down};` +
                `v.ne=${ne};v.nw=${nw};v.se=${se};v.sw=${sw};` +
                `v.bn=${bn};v.bs=${bs};v.be=${be};v.bw=${bw};` +
                `v.tn=${tn};v.ts=${ts};v.te=${te};v.tw=${tw};` +
                `v.show=true;0;`;

            system.runTimeout(() => {
                if (e.isValid) {
                    e.playAnimation("animation.file.selected_block.edges", {
                        players: [player],
                        nextState: "none",
                        stopExpression: expr
                    });
                }
            }, 2);

            entities.push(e);
        } catch (err) { }
    }

    activeHighlights.set(player.id, entities);
}
