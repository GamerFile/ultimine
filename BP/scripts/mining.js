// Mining logic — block selection, tool validation, type matching
import { world } from "@minecraft/server";
import { Vec3, isVegetation } from "utils";
import { blockGroups, EXCLUDED_BLOCKS, MAX_BLOCKS } from "./config.js";

export const isOre = (id) => id.includes("ore") || id.includes("ancient_debris");

export function canMine(block, tool, player) {
    if (player) {
        try {
            const gm = player.getGameMode();
            if (gm === "creative" || gm === "Creative" || gm === 1) return true;
        } catch (e) { }
    }

    const blockId = block.typeId;
    const toolId = tool ? tool.typeId : "";

    if (blockId.includes("snow") && !blockId.includes("snow_golem")) {
        return toolId.includes("shovel");
    }
    if (blockId.includes("web")) {
        return toolId.includes("sword") || toolId.includes("shears");
    }

    // Axe scraping exception: only scrapable copper blocks (waxed, oxidized, weathered, exposed)
    if (toolId.includes("axe") && blockId.includes("copper") && (blockId.includes("waxed_") || blockId.includes("oxidized_") || blockId.includes("weathered_") || blockId.includes("exposed_"))) {
        return true;
    }

    //Native Approach
    try {
        const ltm = world.getLootTableManager();
        const loot = ltm.generateLootFromBlock(block, tool);
        if (loot === undefined) return false;
    } catch (e) { }

    return true;
}


export function isSameType(id1, id2) {
    if (id1 === id2) return true;

    if (isVegetation(id1) && isVegetation(id2)) return true;

    if (id1.includes("copper") && id2.includes("copper")) {
        const getBase = (id) => id.replace("waxed_", "").replace("oxidized_", "").replace("weathered_", "").replace("exposed_", "");
        if (getBase(id1) === getBase(id2)) return true;
    }

    if ((id1.includes("log") || id1.includes("wood")) && (id2.includes("log") || id2.includes("wood"))) return true;

    for (const group of blockGroups) {
        if (group.has(id1) && group.has(id2)) return true;
    }
    return false;
}

function insertSorted(queue, item) {
    let low = 0;
    let high = queue.length;
    while (low < high) {
        const mid = (low + high) >>> 1;
        if (queue[mid].cost < item.cost) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }
    queue.splice(low, 0, item);
}

export function getBlocksForMode(startBlock, face, viewDir, mode, tool, player) {
    const blocksToMine = [];
    const blockIds = new Set();

    if (!canMine(startBlock, tool, player)) return [];

    let forward = Vec3(0, 0, 0);
    let up = Vec3(0, 1, 0);

    if (face === "Up" || face === "Down") {
        forward = face === "Up" ? Vec3(0, -1, 0) : Vec3(0, 1, 0);
        up = Vec3(0, 0, 1);
    } else {
        forward = face === "North" ? Vec3(0, 0, 1) : face === "South" ? Vec3(0, 0, -1) : face === "East" ? Vec3(-1, 0, 0) : Vec3(1, 0, 0);
        up = Vec3(0, 1, 0);
    }
    const right = forward.crossV(up);

    if (mode === 0) {
        const targetType = startBlock.typeId;
        const isVeg = isVegetation(targetType);
        const reachH = isVeg ? 2 : 1;
        const reachV = 1;
        const startLoc = Vec3(startBlock);
        const queue = [{ b: startBlock, cost: 0 }];
        blockIds.add(startLoc.toKey());

        while (queue.length > 0 && blocksToMine.length < MAX_BLOCKS) {
            const current = queue.shift().b;
            blocksToMine.push(current);

            for (let dx = -reachH; dx <= reachH; dx++) {
                for (let dy = -reachV; dy <= reachV; dy++) {
                    for (let dz = -reachH; dz <= reachH; dz++) {
                        if (dx === 0 && dy === 0 && dz === 0) continue;

                        const nPos = Vec3(current).add(dx, dy, dz);
                        const key = nPos.toKey();

                        if (!blockIds.has(key)) {
                            blockIds.add(key);

                            const diff = nPos.subV(startLoc);
                            const locF = forward.dot(diff);
                            const locU = up.dot(diff);
                            const locR = right.dot(diff);

                            const costF = locF < 0 ? -locF * 3 : locF;
                            const costU = Math.abs(locU) * 1.5;
                            const costR = Math.abs(locR) * 1.5;
                            const cost = isVeg ? (Math.abs(dx) + Math.abs(dy) + Math.abs(dz)) : Math.max(costF, costU, costR);

                            if (locF >= -64 && locF <= 64 && Math.abs(locU) <= 64 && Math.abs(locR) <= 64) {
                                try {
                                    const neighbor = current.dimension.getBlock(nPos);
                                    if (neighbor && isSameType(neighbor.typeId, targetType) && canMine(neighbor, tool, player)) {
                                        insertSorted(queue, { b: neighbor, cost });
                                    }
                                } catch (e) { }
                            }
                        }
                    }
                }
            }
        }
    } else {
        const startLoc = Vec3(startBlock);
        const shapeOffsets = [];

        if (mode === 1) {
            for (let d = 0; d < MAX_BLOCKS; d++) shapeOffsets.push(forward.scale(d));
        } else if (mode === 2) {
            for (let x = -1; x <= 1; x++) {
                for (let y = -1; y <= 1; y++) {
                    shapeOffsets.push(right.scale(x).addV(up.scale(y)));
                }
            }
        } else if (mode === 3) {
            for (let d = 0; d < 7; d++) {
                for (let x = -1; x <= 1; x++) {
                    for (let y = -1; y <= 1; y++) {
                        shapeOffsets.push(right.scale(x).addV(up.scale(y)).addV(forward.scale(d)));
                    }
                }
            }
        } else if (mode === 4 || mode === 5) {
            const yDir = mode === 4 ? -1 : 1;
            let flatForward = Vec3(viewDir.x, 0, viewDir.z).normalize();
            if (Math.abs(flatForward.x) > Math.abs(flatForward.z)) flatForward = Vec3(Math.sign(flatForward.x), 0, 0);
            else flatForward = Vec3(0, 0, Math.sign(flatForward.z));

            for (let i = 0; i < 32; i++) {
                const base = flatForward.scale(i).addV(Vec3(0, yDir * i, 0));
                shapeOffsets.push(base);
                shapeOffsets.push(base.add(0, 1, 0));
            }
        }

        const validOffsets = new Set(shapeOffsets.map(v => v.toKey()));
        const queue = [Vec3(0, 0, 0)];
        const visited = new Set(["0,0,0"]);

        blocksToMine.push(startBlock);

        const dirs = [
            Vec3(1, 0, 0), Vec3(-1, 0, 0),
            Vec3(0, 1, 0), Vec3(0, -1, 0),
            Vec3(0, 0, 1), Vec3(0, 0, -1)
        ];

        while (queue.length > 0 && blocksToMine.length < MAX_BLOCKS) {
            const currentOffset = queue.shift();

            for (const dir of dirs) {
                const n = currentOffset.addV(dir);
                const key = n.toKey();

                if (validOffsets.has(key) && !visited.has(key)) {
                    visited.add(key);
                    try {
                        const absTarget = startLoc.addV(n);
                        const b = startBlock.dimension.getBlock(absTarget);
                        if (b && !EXCLUDED_BLOCKS.has(b.typeId) && !isOre(b.typeId)) {
                            if (canMine(b, tool, player)) {
                                blocksToMine.push(b);
                                queue.push(n);
                            }
                        }
                    } catch (e) { }
                }
            }
        }
    }

    return blocksToMine;
}
