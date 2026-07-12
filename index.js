import { system, world, BlockPermutation, ItemStack, Player } from "@minecraft/server";
import { debugDrawer, DebugLine } from '@minecraft/debug-utilities'
import { Vec3, runJob, EXCLUDED_BLOCKS } from "utils";

const playerSequences = new Map();
const activeHighlights = new Map();

const slotMessageMap = {
    0: "§bShapeless",
    1: "§bSmall Tunnel",
    2: "§bSmall Square (3 x 3)",
    3: "§bLarge Tunnel (3 x 3)",
    4: "§bMining Tunnel",
    5: "§bEscape Tunnel",
    6: "§cUnavailable",
    7: "§cUnavailable",
    8: "§cUnavailable",
    9: "§cUnavailable",
};

function clearHighlights(player) {
    if (activeHighlights.has(player.id)) {
        activeHighlights.get(player.id).forEach(box => box.remove());
        activeHighlights.delete(player.id);
    }
}

const isOre = (id) => id.includes("ore") || id.includes("ancient_debris");

function isHungry(player) {
    try {
        const hungerComp = player.getComponent("minecraft:player.hunger");
        if (hungerComp && hungerComp.currentValue <= hungerComp.effectiveMin) return true;
    } catch (e) { }
    return false;
}

function canMine(block, tool, player) {
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

    // Tier 4 (Diamond Pickaxe+)
    if (blockId.includes("obsidian") || blockId.includes("ancient_debris") ||
        blockId.includes("netherite_block") || blockId.includes("respawn_anchor")) {
        return pickTier >= 4;
    }

    // Tier 3 (Iron Pickaxe+)
    if (blockId.includes("gold_or") || blockId.includes("diamond_or") ||
        blockId.includes("emerald_or") || blockId.includes("redstone_or") ||
        blockId.includes("lit_redstone_or") || blockId.includes("gold_block") ||
        blockId.includes("diamond_block") || blockId.includes("emerald_block") ||
        blockId.includes("raw_gold_block")) {
        return pickTier >= 3;
    }

    // Tier 2 (Stone Pickaxe+)
    if (blockId.includes("iron_or") || blockId.includes("copper_or") ||
        blockId.includes("lapis_or") || blockId.includes("iron_block") ||
        blockId.includes("copper_block") || blockId.includes("lapis_block") ||
        blockId.includes("raw_iron_block") || blockId.includes("raw_copper_block") ||
        blockId.includes("lightning_rod")) {
        return pickTier >= 2;
    }

    // Tier 1 (Wooden Pickaxe+)
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

const blockGroups = [
    new Set(["minecraft:dirt", "minecraft:grass_block", "minecraft:dirt_with_roots", "minecraft:grass_path", "minecraft:podzol", "minecraft:mycelium", "minecraft:farmland"]),
    new Set(["minecraft:stone", "minecraft:andesite", "minecraft:diorite", "minecraft:granite"]),
    new Set(["minecraft:tuff", "minecraft:deepslate"]),
    new Set(["minecraft:coal_ore", "minecraft:deepslate_coal_ore"]),
    new Set(["minecraft:iron_ore", "minecraft:deepslate_iron_ore"]),
    new Set(["minecraft:copper_ore", "minecraft:deepslate_copper_ore"]),
    new Set(["minecraft:gold_ore", "minecraft:deepslate_gold_ore"]),
    new Set(["minecraft:lapis_ore", "minecraft:deepslate_lapis_ore"]),
    new Set(["minecraft:diamond_ore", "minecraft:deepslate_diamond_ore"]),
    new Set(["minecraft:emerald_ore", "minecraft:deepslate_emerald_ore"]),
    new Set(["minecraft:redstone_ore", "minecraft:deepslate_redstone_ore", "minecraft:lit_redstone_ore", "minecraft:lit_deepslate_redstone_ore"])
];

function isSameType(id1, id2) {
    if (id1 === id2) return true;

    // Dynamic grouping for Copper (match base types instead of any copper)
    if (id1.includes("copper") && id2.includes("copper")) {
        const getBase = (id) => id.replace("waxed_", "").replace("oxidized_", "").replace("weathered_", "").replace("exposed_", "");
        if (getBase(id1) === getBase(id2)) return true;
    }

    // Dynamic grouping for Logs (any log/wood matches any other log/wood)
    if ((id1.includes("log") || id1.includes("wood")) && (id2.includes("log") || id2.includes("wood"))) return true;

    for (const group of blockGroups) {
        if (group.has(id1) && group.has(id2)) return true;
    }
    return false;
}

function getBlocksForMode(startBlock, face, viewDir, mode, tool, player) {
    const blocksToMine = [];
    const blockIds = new Set();
    const MAX_BLOCKS = 64;

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
        const queue = [{ b: startBlock, cost: 0 }];
        blockIds.add(`${startBlock.x},${startBlock.y},${startBlock.z}`);

        const startLoc = Vec3(startBlock);

        while (queue.length > 0 && blocksToMine.length < MAX_BLOCKS) {
            queue.sort((a, b) => a.cost - b.cost);
            const current = queue.shift().b;
            blocksToMine.push(current);

            const dirs = [];
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dz = -1; dz <= 1; dz++) {
                        if (dx !== 0 || dy !== 0 || dz !== 0) dirs.push({ x: dx, y: dy, z: dz });
                    }
                }
            }

            for (const d of dirs) {
                const nx = current.x + d.x;
                const ny = current.y + d.y;
                const nz = current.z + d.z;
                const key = `${nx},${ny},${nz}`;

                if (!blockIds.has(key)) {
                    blockIds.add(key);

                    const diff = Vec3(nx, ny, nz).subV(startLoc);

                    let locF = forward.dot(diff);
                    let locU = up.dot(diff);
                    let locR = right.dot(diff);

                    let costF = locF < 0 ? -locF * 3 : locF;
                    let costU = Math.abs(locU) * 1.5;
                    let costR = Math.abs(locR) * 1.5;
                    let cost = Math.max(costF, costU, costR);

                    if (locF >= -64 && locF <= 64 && Math.abs(locU) <= 64 && Math.abs(locR) <= 64) {
                        try {
                            const neighbor = current.dimension.getBlock({ x: nx, y: ny, z: nz });
                            if (neighbor && isSameType(neighbor.typeId, targetType) && canMine(neighbor, tool, player)) {
                                queue.push({ b: neighbor, cost: cost });
                            }
                        } catch (e) { }
                    }
                }
            }
        }
    } else {
        const startLoc = Vec3(startBlock);
        const shapeOffsets = [];

        if (mode === 1) {
            for (let d = 0; d < MAX_BLOCKS; d++) {
                shapeOffsets.push(forward.scale(d));
            }
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
                let base = flatForward.scale(i).addV(Vec3(0, yDir * i, 0));
                shapeOffsets.push(base);
                shapeOffsets.push(base.addV(Vec3(0, 1, 0)));
            }
        }

        // BFS within valid offsets to ensure contiguous blocks only!
        const validOffsets = new Set(shapeOffsets.map(v => `${v.x},${v.y},${v.z}`));
        const queue = [Vec3(0, 0, 0)];
        const visited = new Set(["0,0,0"]);

        blocksToMine.push(startBlock);

        while (queue.length > 0 && blocksToMine.length < MAX_BLOCKS) {
            const currentOffset = queue.shift();

            const dirs = [
                Vec3(1, 0, 0), Vec3(-1, 0, 0),
                Vec3(0, 1, 0), Vec3(0, -1, 0),
                Vec3(0, 0, 1), Vec3(0, 0, -1)
            ];

            for (const dir of dirs) {
                const n = Vec3(currentOffset).addV(dir);
                const key = `${n.x},${n.y},${n.z}`;

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

system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        if (!playerSequences.has(player.id)) {
            playerSequences.set(player.id, {
                step: 0,
                lastUpdate: 0,
                wasSneaking: false,
                wasJumping: false,
                active: false,
                slot: -1,
                lastTarget: null
            });
        }


        const data = playerSequences.get(player.id);
        const now = system.currentTick;

        if (data.step > 0 && now - data.lastUpdate > 15) {
            data.step = 0;
        }

        const isSneaking = player.isSneaking;
        const isJumping = player.isJumping;

        if (data.step === 0 && isSneaking && !data.wasSneaking) {
            data.step = 1;
            data.lastUpdate = now;
        }
        else if (data.step === 1 && !isSneaking && data.wasSneaking) {
            data.step = 2;
            data.lastUpdate = now;
        }
        else if (data.step === 2 && isSneaking && !data.wasSneaking) {
            player.onComboComplete();
            data.step = 0;
        }

        if (data.step === 0 && !isSneaking && data.wasSneaking && data.slot !== -1 && data.active) {
            data.active = false;
        }

        if (data.slot !== -1 && !data.active) {
            // we will update the display at the bottom based on hit
        }

        data.wasSneaking = isSneaking;
        data.wasJumping = isJumping;

        if (data.slot !== -1 && !data.active) {
            if (isHungry(player)) {
                clearHighlights(player);
                data.lastTarget = null;
                player.onScreenDisplay.setActionBar(`Selected ${slotMessageMap[data.slot]} §c(Low Hunger)`);
            } else {
                const hit = player.getBlockFromViewDirection({ maxDistance: 8 });
                if (hit && hit.block) {
                    const currentTargetStr = `${hit.block.x},${hit.block.y},${hit.block.z}`;

                    // Track selected tool to see if it changes
                    const inv = player.getComponent("inventory").container;
                    const tool = inv.getItem(player.selectedSlotIndex);
                    const currentToolStr = tool ? tool.typeId : "none";

                    // Cardinal view direction bucket (8 directions + up/down)
                    const viewDir = player.getViewDirection();
                    let cardinalDir;
                    if (viewDir.y > 0.7) cardinalDir = "UP";
                    else if (viewDir.y < -0.7) cardinalDir = "DN";
                    else {
                        const angle = Math.atan2(viewDir.x, viewDir.z) * 180 / Math.PI;
                        const snap = Math.round(angle / 45) * 45;
                        cardinalDir = `${snap}`;
                    }

                    const checkStr = currentTargetStr + ":" + currentToolStr + ":" + hit.face + ":" + cardinalDir;

                    if (data.lastTarget !== checkStr) {
                        data.lastTarget = checkStr;
                        data.cachedFace = hit.face;
                        data.cachedViewDir = viewDir;
                        clearHighlights(player);

                        const blocks = getBlocksForMode(hit.block, hit.face, viewDir, data.slot, tool, player);

                        const blockSet = new Set(blocks.map(b => `${b.x},${b.y},${b.z}`));
                        const edges = new Set();
                        for (const b of blocks) {
                            const { x, y, z } = b;
                            const es = [
                                `X,${x},${y},${z}`, `X,${x},${y + 1},${z}`, `X,${x},${y},${z + 1}`, `X,${x},${y + 1},${z + 1}`,
                                `Y,${x},${y},${z}`, `Y,${x + 1},${y},${z}`, `Y,${x},${y},${z + 1}`, `Y,${x + 1},${y},${z + 1}`,
                                `Z,${x},${y},${z}`, `Z,${x + 1},${y},${z}`, `Z,${x},${y + 1},${z}`, `Z,${x + 1},${y + 1},${z}`
                            ];
                            for (const e of es) edges.add(e);
                        }

                        const lines = [];
                        for (const edge of edges) {
                            const [axis, sx, sy, sz] = edge.split(',');
                            const x = parseInt(sx), y = parseInt(sy), z = parseInt(sz);

                            let b1, b2, b3, b4;
                            if (axis === 'X') {
                                b1 = blockSet.has(`${x},${y},${z}`);
                                b2 = blockSet.has(`${x},${y - 1},${z}`);
                                b3 = blockSet.has(`${x},${y - 1},${z - 1}`);
                                b4 = blockSet.has(`${x},${y},${z - 1}`);
                            } else if (axis === 'Y') {
                                b1 = blockSet.has(`${x},${y},${z}`);
                                b2 = blockSet.has(`${x - 1},${y},${z}`);
                                b3 = blockSet.has(`${x - 1},${y},${z - 1}`);
                                b4 = blockSet.has(`${x},${y},${z - 1}`);
                            } else {
                                b1 = blockSet.has(`${x},${y},${z}`);
                                b2 = blockSet.has(`${x - 1},${y},${z}`);
                                b3 = blockSet.has(`${x - 1},${y - 1},${z}`);
                                b4 = blockSet.has(`${x},${y - 1},${z}`);
                            }

                            const count = b1 + b2 + b3 + b4;
                            let draw = false;
                            if (count === 1 || count === 3) draw = true;
                            else if (count === 2 && ((b1 && b3) || (b2 && b4))) draw = true;

                            if (draw) {
                                const I = 0.01; // User requested 0.2 offset inflation
                                let d = Vec3(0, 0, 0);
                                let startLoc = Vec3(x, y, z);
                                let endLoc = Vec3(x, y, z);

                                if (axis === 'X') {
                                    if (b1) d = d.add(0, 1, 1);
                                    if (b2) d = d.add(0, -1, 1);
                                    if (b3) d = d.add(0, -1, -1);
                                    if (b4) d = d.add(0, 1, -1);
                                    const offset = Vec3(0, -Math.sign(d.y) * I, -Math.sign(d.z) * I);
                                    startLoc = startLoc.addV(offset).add(-I, 0, 0);
                                    endLoc = startLoc.add(1 + 2 * I, 0, 0);
                                } else if (axis === 'Y') {
                                    if (b1) d = d.add(1, 0, 1);
                                    if (b2) d = d.add(-1, 0, 1);
                                    if (b3) d = d.add(-1, 0, -1);
                                    if (b4) d = d.add(1, 0, -1);
                                    const offset = Vec3(-Math.sign(d.x) * I, 0, -Math.sign(d.z) * I);
                                    startLoc = startLoc.addV(offset).add(0, -I, 0);
                                    endLoc = startLoc.add(0, 1 + 2 * I, 0);
                                } else {
                                    if (b1) d = d.add(1, 1, 0);
                                    if (b2) d = d.add(-1, 1, 0);
                                    if (b3) d = d.add(-1, -1, 0);
                                    if (b4) d = d.add(1, -1, 0);
                                    const offset = Vec3(-Math.sign(d.x) * I, -Math.sign(d.y) * I, 0);
                                    startLoc = startLoc.addV(offset).add(0, 0, -I);
                                    endLoc = startLoc.add(0, 0, 1 + 2 * I);
                                }

                                const line = new DebugLine(startLoc, endLoc);
                                line.color = { red: 1, green: 1, blue: 1, alpha: 10 };
                                line.visibleTo = [player];
                                debugDrawer.addShape(line);
                                lines.push(line);
                            }
                        }
                        activeHighlights.set(player.id, lines);

                        if (blocks.length > 0) {
                            if (isHungry(player)) {
                                player.onScreenDisplay.setActionBar(`Selected ${slotMessageMap[data.slot]} (Low Hunger)`);
                            } else {
                                player.onScreenDisplay.setActionBar(`Selected ${slotMessageMap[data.slot]} (${blocks.length} blocks)`);
                            }
                        } else {
                            player.onScreenDisplay.setActionBar(`Selected ${slotMessageMap[data.slot]} §c(Cannot Break)`);
                        }
                    }
                } else {
                    if (data.lastTarget !== null) {
                        clearHighlights(player);
                        data.lastTarget = null;
                        player.onScreenDisplay.setActionBar(`Selected ${slotMessageMap[data.slot]}`);
                    } else if (system.currentTick % 20 === 0) {
                        // Refresh just in case while armed but not looking
                        player.onScreenDisplay.setActionBar(`Selected ${slotMessageMap[data.slot]}`);
                    }
                }
            }
        } else {
            if (data.lastTarget !== null) {
                clearHighlights(player);
                data.lastTarget = null;
            }
        }
    }
}, 1);

Player.prototype.onComboComplete = function () {
    const data = playerSequences.get(this.id);
    if (data.slot !== -1) {
        this.sendMessage("§bUltimine Deactivated");
        this.playSound("random.orb", { pitch: 0.5 });
        data.slot = -1;
        clearHighlights(this);
        return;
    }
    if (this.selectedSlotIndex > 5) {
        this.sendMessage("§cInvalid Mode Selected");
        return;
    }
    this.sendMessage("§bUltimine Activated");
    this.playSound("random.orb", { pitch: 1.5 });
    data.active = true;
    this.onScreenDisplay.setActionBar(slotMessageMap[this.selectedSlotIndex]);
    data.slot = this.selectedSlotIndex;
};

function isActive(player) {
    return playerSequences.get(player.id).active;
}

world.afterEvents.playerHotbarSelectedSlotChange.subscribe(evd => {
    if (isActive(evd.player)) {
        if (evd.newSlotSelected > 5) {
            evd.player.onScreenDisplay.setActionBar("§cUnavailable");
            playerSequences.get(evd.player.id).slot = evd.newSlotSelected;
            return;
        }
        evd.player.onScreenDisplay.setActionBar(slotMessageMap[evd.newSlotSelected]);
        playerSequences.get(evd.player.id).slot = evd.newSlotSelected;
    }
});

world.beforeEvents.playerBreakBlock.subscribe(ev => {
    const { player, block } = ev;
    const data = playerSequences.get(player.id);
    if (!data || data.slot === -1 || data.active || data.slot > 5) return;
    if (isHungry(player)) return;

    let inventory = player.getComponent("inventory").container;
    const currentItem = inventory.getItem(player.selectedSlotIndex);

    // Use cached face+viewDir from the hologram to guarantee consistency
    const face = data.cachedFace || "Up";
    const viewDir = data.cachedViewDir || player.getViewDirection();

    const blocksToMine = getBlocksForMode(block, face, viewDir, data.slot, currentItem, player);

    // Only intercept if we actually mapped blocks!
    if (blocksToMine.length === 0) return;

    ev.cancel = true;

    let isCreative = false;
    try {
        const gm = player.getGameMode();
        isCreative = gm === "creative" || gm === "Creative" || gm === 1;
    } catch (e) { }

    // Evaluate enchantments for ores
    let fortuneLevel = 0;
    let hasSilkTouch = false;
    let unbreaking = 0;
    if (currentItem) {
        const enchantComp = currentItem.getComponent("minecraft:enchantable");
        if (enchantComp) {
            fortuneLevel = enchantComp.getEnchantment("fortune")?.level || enchantComp.getEnchantment("minecraft:fortune")?.level || 0;
            hasSilkTouch = enchantComp.hasEnchantment("silk_touch") || enchantComp.hasEnchantment("minecraft:silk_touch") ? true : false;
            unbreaking = enchantComp.getEnchantment("unbreaking")?.level || enchantComp.getEnchantment("minecraft:unbreaking")?.level || 0;
        }
    }

    clearHighlights(player);
    data.lastTarget = null;

    const dropTarget = { x: block.x + 0.5, y: block.y, z: block.z + 0.5 };

    system.run(() => {
        runJob(blocksToMine, (b) => {
            if (isCreative) {
                b.dimension.runCommand(`setblock ${b.x} ${b.y} ${b.z} air`);
                return;
            }

            const isTargetOre = isOre(b.typeId);

            if (isTargetOre) {
                if (hasSilkTouch) {
                    try {
                        const itemToDrop = new ItemStack(b.typeId, 1);
                        const e = b.dimension.spawnItem(itemToDrop, { x: b.x, y: b.y, z: b.z });
                        b.dimension.runCommand(`setblock ${b.x} ${b.y} ${b.z} air`);
                        e.teleport(dropTarget);
                    } catch (e) { }
                } else {
                    const dropMap = {
                        "minecraft:coal_ore": "minecraft:coal", "minecraft:deepslate_coal_ore": "minecraft:coal",
                        "minecraft:iron_ore": "minecraft:raw_iron", "minecraft:deepslate_iron_ore": "minecraft:raw_iron",
                        "minecraft:gold_ore": "minecraft:raw_gold", "minecraft:deepslate_gold_ore": "minecraft:raw_gold",
                        "minecraft:copper_ore": "minecraft:raw_copper", "minecraft:deepslate_copper_ore": "minecraft:raw_copper",
                        "minecraft:diamond_ore": "minecraft:diamond", "minecraft:deepslate_diamond_ore": "minecraft:diamond",
                        "minecraft:emerald_ore": "minecraft:emerald", "minecraft:deepslate_emerald_ore": "minecraft:emerald",
                        "minecraft:lapis_ore": "minecraft:lapis_lazuli", "minecraft:deepslate_lapis_ore": "minecraft:lapis_lazuli",
                        "minecraft:redstone_ore": "minecraft:redstone", "minecraft:deepslate_redstone_ore": "minecraft:redstone",
                        "minecraft:lit_redstone_ore": "minecraft:redstone", "minecraft:lit_deepslate_redstone_ore": "minecraft:redstone",
                        "minecraft:nether_quartz_ore": "minecraft:quartz", "minecraft:nether_gold_ore": "minecraft:gold_nugget"
                    };
                    const itemDrop = dropMap[b.typeId] || b.typeId;

                    let baseAmount = 1;
                    if (itemDrop === "minecraft:redstone" || itemDrop === "minecraft:lapis_lazuli") baseAmount = 4;
                    if (itemDrop === "minecraft:gold_nugget") baseAmount = 3;

                    let fortuneMultiplier = 1;
                    if (fortuneLevel > 0) {
                        const r = Math.random();
                        if (r > 0.5) fortuneMultiplier = Math.floor(Math.random() * (fortuneLevel + 2)) + 1;
                    }

                    const dropAmount = baseAmount * fortuneMultiplier;
                    if (dropAmount > 0 && b.typeId !== "minecraft:air") {
                        try {
                            const itemStackToDrop = new ItemStack(itemDrop, dropAmount > 64 ? 64 : dropAmount);
                            const e = b.dimension.spawnItem(itemStackToDrop, { x: b.x, y: b.y, z: b.z });
                            e.teleport(dropTarget);
                            b.dimension.runCommand(`setblock ${b.x} ${b.y} ${b.z} air`);
                        } catch (e) { console.warn(e) }
                    }
                }
                // Spawn XP orbs at drop target for ore mining
                if (!hasSilkTouch) {
                    try {
                        const xpAmount = Math.floor(Math.random() * 3) + 1;
                        b.dimension.runCommand(`summon xp_orb ${dropTarget.x} ${dropTarget.y} ${dropTarget.z}`);
                    } catch (e) { }
                }
            } else {
                b.dimension.runCommand(`setblock ${b.x} ${b.y} ${b.z} air destroy`);
                const items = b.dimension.getEntities({ location: { x: b.x + 0.5, y: b.y + 0.5, z: b.z + 0.5 }, maxDistance: 2, type: "minecraft:item" });
                items.forEach(e => e.teleport(dropTarget));
            }

            // Hunger / Exhaustion updating
            try {
                const exhaustComp = player.getComponent("minecraft:player.exhaustion");
                if (exhaustComp) exhaustComp.setCurrentValue(exhaustComp.currentValue + 0.05);
            } catch (e) { }

            // Tool Damage Updating
            const tool = inventory.getItem(player.selectedSlotIndex);
            if (tool) {
                const dur = tool.getComponent("durability");
                if (dur) {
                    let shouldDamage = true;
                    if (unbreaking > 0) {
                        shouldDamage = Math.random() < (1 / (unbreaking + 1));
                    }

                    if (shouldDamage) {
                        dur.damage += 1;
                        if (dur.damage >= dur.maxDurability) {
                            inventory.setItem(player.selectedSlotIndex, undefined);
                            player.playSound("random.break");
                        } else {
                            inventory.setItem(player.selectedSlotIndex, tool);
                        }
                    }
                }
            }
        });
    });
});

world.beforeEvents.playerInteractWithBlock.subscribe(ev => {
    const { player, block, itemStack } = ev;

    if (!player || player.typeId !== "minecraft:player") return;

    const data = playerSequences.get(player.id);
    if (!data || data.slot === -1 || data.active || data.slot > 5) return;
    if (isHungry(player)) return;

    if (!itemStack) return;

    const isHoe = itemStack.typeId.includes("hoe");
    const isAxe = itemStack.typeId.includes("axe");
    const isShovel = itemStack.typeId.includes("shovel");

    if (!isHoe && !isAxe && !isShovel) return;

    const bType = block.typeId;
    let action = null;

    if (isHoe && (bType === "minecraft:dirt" || bType === "minecraft:grass_block" || bType === "minecraft:dirt_with_roots" || bType === "minecraft:grass_path" || bType === "minecraft:coarse_dirt")) {
        action = "till";
    } else if (isShovel && (bType === "minecraft:grass_block" || bType === "minecraft:podzol" || bType === "minecraft:coarse_dirt" || bType === "minecraft:mycelium" || bType === "minecraft:dirt")) {
        action = "shove";
    } else if (isAxe) {
        if (bType.includes("copper") || bType.includes("log") || bType.includes("wood")) {
            action = "scrape";
        }
    }

    if (!action) return;

    let face = ev.blockFace || "Up";

    const blocksToMine = getBlocksForMode(block, face, player.getViewDirection(), data.slot, itemStack, player);
    if (blocksToMine.length === 0) return;

    ev.cancel = true;

    let isCreative = false;
    try {
        const gm = player.getGameMode();
        isCreative = gm === "creative" || gm === "Creative" || gm === 1;
    } catch (e) { }

    let unbreaking = 0;
    const enchantComp = itemStack.getComponent("minecraft:enchantable");
    if (enchantComp) {
        unbreaking = enchantComp.getEnchantment("unbreaking")?.level || enchantComp.getEnchantment("minecraft:unbreaking")?.level || 0;
    }

    clearHighlights(player);
    data.lastTarget = null;
    let inventory = player.getComponent("inventory").container;

    system.run(() => {
        runJob(blocksToMine, (b) => {
            const targetType = b.typeId;
            let targetBlockId = null;

            if (action === "till") {
                if (targetType === "minecraft:coarse_dirt") {
                    targetBlockId = "minecraft:dirt";
                } else if (targetType === "minecraft:dirt_with_roots") {
                    targetBlockId = "minecraft:dirt";
                } else if (targetType === "minecraft:dirt" || targetType === "minecraft:grass_block" || targetType === "minecraft:grass_path") {
                    let canTill = true;
                    try {
                        const blockAbove = b.dimension.getBlock({ x: b.x, y: b.y + 1, z: b.z });
                        if (blockAbove && !blockAbove.isAir) canTill = false;
                    } catch (e) { }
                    if (canTill) targetBlockId = "minecraft:farmland";
                }
            } else if (action === "shove") {
                if (targetType === "minecraft:grass_block" || targetType === "minecraft:podzol" || targetType === "minecraft:coarse_dirt" || targetType === "minecraft:mycelium" || targetType === "minecraft:dirt") {
                    let canShove = true;
                    try {
                        const blockAbove = b.dimension.getBlock({ x: b.x, y: b.y + 1, z: b.z });
                        if (blockAbove && !blockAbove.isAir) canShove = false;
                    } catch (e) { }
                    if (canShove) targetBlockId = "minecraft:grass_path";
                }
            } else if (action === "scrape" && isAxe) {
                if (targetType.includes("waxed_")) targetBlockId = targetType.replace("waxed_", "");
                else if (targetType.includes("oxidized_")) targetBlockId = targetType.replace("oxidized_", "weathered_");
                else if (targetType.includes("weathered_")) targetBlockId = targetType.replace("weathered_", "exposed_");
                else if (targetType.includes("exposed_")) targetBlockId = targetType.replace("exposed_", "");
                else if ((targetType.includes("log") || targetType.includes("wood")) && !targetType.includes("stripped_")) {
                    targetBlockId = targetType.replace("minecraft:", "minecraft:stripped_");
                }
                if (targetBlockId == "minecraft:copper") targetBlockId = "copper_block"
            }
            if (targetBlockId && targetBlockId !== targetType) {
                try {
                    if (action === "till" && targetBlockId === "minecraft:farmland") {
                        b.dimension.runCommand(`setblock ${b.x} ${b.y} ${b.z} farmland`);
                    } else if (action === "till" && targetBlockId === "minecraft:dirt") {
                        b.dimension.runCommand(`setblock ${b.x} ${b.y} ${b.z} dirt`);
                        if (targetType === "minecraft:dirt_with_roots") {
                            try {
                                b.dimension.spawnItem(new ItemStack("minecraft:hanging_roots", 1), { x: b.x + 0.5, y: b.y + 0.5, z: b.z + 0.5 });
                            } catch (e) { }
                        }
                    } else if (action === "shove") {
                        b.dimension.runCommand(`setblock ${b.x} ${b.y} ${b.z} grass_path`);
                    } else {
                        const blockPerm = b.permutation;
                        const states = blockPerm.getAllStates();
                        const newPerm = BlockPermutation.resolve(targetBlockId, states);
                        b.setPermutation(newPerm);
                    }
                } catch (e) {
                    b.dimension.runCommand(`setblock ${b.x} ${b.y} ${b.z} ${targetBlockId.replace("minecraft:", "")}`);
                }

                if (!isCreative) {
                    try {
                        const exhaustComp = player.getComponent("minecraft:player.exhaustion");
                        if (exhaustComp) exhaustComp.setCurrentValue(exhaustComp.currentValue + 0.05);
                    } catch (e) { }

                    const tool = inventory.getItem(player.selectedSlotIndex);
                    if (tool) {
                        const dur = tool.getComponent("durability");
                        if (dur) {
                            let shouldDamage = true;
                            if (unbreaking > 0) {
                                shouldDamage = Math.random() < (1 / (unbreaking + 1));
                            }

                            if (shouldDamage) {
                                dur.damage += 1;
                                if (dur.damage >= dur.maxDurability) {
                                    inventory.setItem(player.selectedSlotIndex, undefined);
                                    player.playSound("random.break");
                                } else {
                                    inventory.setItem(player.selectedSlotIndex, tool);
                                }
                            }
                        }
                    }
                }
            }
        });
    });
});
