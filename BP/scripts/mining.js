// Mining logic — block selection, tool validation, type matching
import { Vec3 } from "utils";
import { blockGroups, EXCLUDED_BLOCKS, SHEARABLE_BLOCKS, MAX_BLOCKS } from "./config.js";

export const isOre = (id) => id.includes("ore") || id.includes("ancient_debris");
export const isShearable = (id) => SHEARABLE_BLOCKS.has(id) || id.includes("leaves");

export function canMine(block, tool, player) {
    if (player) {
        try {
            const gm = player.getGameMode();
            if (gm === "creative" || gm === "Creative" || gm === 1) return true;
        } catch (e) { }
    }

    const blockId = block.typeId;

    if (blockId.includes("log") || blockId.includes("leaves") || blockId.includes("dirt") ||
        (blockId.includes("sand") && !blockId.includes("sandstone")) ||
        blockId.includes("gravel") || blockId.includes("wood") || blockId.includes("plank") ||
        blockId.includes("glass") || blockId.includes("wool") || blockId.includes("sponge") ||
        blockId.includes("glowstone") || blockId.includes("mushroom") || blockId.includes("wart") ||
        blockId.includes("stem") || blockId.includes("clay") || blockId.includes("mud")) {
        return true;
    }

    const toolId = tool ? tool.typeId : "";
    let isPickaxe = toolId.includes("pickaxe");

    if (blockId.includes("snow") && !blockId.includes("snow_golem")) {
        return toolId.includes("shovel");
    }
    if (blockId.includes("web")) {
        return toolId.includes("sword") || toolId.includes("shears");
    }

    let pickTier = 0;
    if (isPickaxe) {
        if (toolId.includes("wood") || toolId.includes("gold")) pickTier = 1;
        else if (toolId.includes("stone_") || toolId.includes("copper_")) pickTier = 2;
        else if (toolId.includes("iron_")) pickTier = 3;
        else if (toolId.includes("diamond_")) pickTier = 4;
        else if (toolId.includes("netherite_")) pickTier = 5;
    }

    if (blockId.includes("obsidian") || blockId.includes("ancient_debris") ||
        blockId.includes("netherite_block") || blockId.includes("respawn_anchor")) {
        return pickTier >= 4;
    }
    if (blockId.includes("gold_or") || blockId.includes("diamond_or") ||
        blockId.includes("emerald_or") || blockId.includes("redstone_or") ||
        blockId.includes("lit_redstone_or") || blockId.includes("gold_block") ||
        blockId.includes("diamond_block") || blockId.includes("emerald_block") ||
        blockId.includes("raw_gold_block")) {
        return pickTier >= 3;
    }
    if (blockId.includes("iron_or") || blockId.includes("copper_or") ||
        blockId.includes("lapis_or") || blockId.includes("iron_block") ||
        blockId.includes("copper_block") || blockId.includes("lapis_block") ||
        blockId.includes("raw_iron_block") || blockId.includes("raw_copper_block") ||
        blockId.includes("lightning_rod")) {
        return pickTier >= 2;
    }
    if (blockId.includes("stone") || blockId.includes("deepslate") || blockId.includes("tuff") ||
        blockId.includes("basalt") || blockId.includes("quartz") || blockId.includes("brick") ||
        (blockId.includes("concrete") && !blockId.includes("powder")) || blockId.includes("terracotta") ||
        blockId.includes("prismarine") || blockId.includes("purpur") || blockId.includes("shulker_box") ||
        blockId.includes("cobble") || blockId.includes("andesite") || blockId.includes("diorite") ||
        blockId.includes("granite") || blockId.includes("netherrack") || blockId.includes("end_stone") ||
        blockId.includes("coal_or") || blockId.includes("iron_bars") || blockId.includes("hopper") ||
        blockId.includes("cauldron") || blockId.includes("spawner") || blockId.includes("lantern") ||
        blockId.includes("chain") || blockId.includes("bell") || blockId.includes("anvil") ||
        blockId.includes("furnace") || blockId.includes("dispenser") || blockId.includes("enchanting_table") ||
        blockId.includes("grinder") || blockId.includes("grindstone") || blockId.includes("smoker") ||
        blockId.includes("blast_furnace") || blockId.includes("magma") || blockId.includes("bone_block")) {
        return pickTier >= 1;
    }

    return true;
}

export function isSameType(id1, id2) {
    if (id1 === id2) return true;

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
        const startLoc = Vec3(startBlock);
        const queue = [{ b: startBlock, cost: 0 }];
        blockIds.add(startLoc.toKey());

        while (queue.length > 0 && blocksToMine.length < MAX_BLOCKS) {
            queue.sort((a, b) => a.cost - b.cost);
            const current = queue.shift().b;
            blocksToMine.push(current);

            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dz = -1; dz <= 1; dz++) {
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
                            const cost = Math.max(costF, costU, costR);

                            if (locF >= -64 && locF <= 64 && Math.abs(locU) <= 64 && Math.abs(locR) <= 64) {
                                try {
                                    const neighbor = current.dimension.getBlock(nPos);
                                    if (neighbor && isSameType(neighbor.typeId, targetType) && canMine(neighbor, tool, player)) {
                                        queue.push({ b: neighbor, cost });
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
