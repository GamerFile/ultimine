// Block interact event handler — hoe/axe/shovel/crop actions
import { system, world, BlockPermutation, ItemStack } from "@minecraft/server";
import { Vec3, runJob, getCropInfo } from "utils";
import { getPlayerData, clearHighlights, isHungry } from "../state.js";
import { getBlocksForMode } from "../mining.js";

world.beforeEvents.playerInteractWithBlock.subscribe(ev => {
    const { player, block, itemStack } = ev;

    if (!player || player.typeId !== "minecraft:player") return;

    const data = getPlayerData(player);
    if (!data || data.slot === -1 || data.active || data.slot > 5) return;
    if (isHungry(player)) return;

    const bType = block.typeId;
    let action = null;

    const cropInfo = getCropInfo(block);
    if (cropInfo) {
        action = "harvest";
    } else {
        if (!itemStack) return;

        const isHoe = itemStack.typeId.includes("hoe");
        const isAxe = itemStack.typeId.includes("axe");
        const isShovel = itemStack.typeId.includes("shovel");

        if (!isHoe && !isAxe && !isShovel) return;

        if (isHoe && (bType === "minecraft:dirt" || bType === "minecraft:grass_block" || bType === "minecraft:dirt_with_roots" || bType === "minecraft:grass_path" || bType === "minecraft:coarse_dirt")) {
            action = "till";
        } else if (isShovel && (bType === "minecraft:grass_block" || bType === "minecraft:podzol" || bType === "minecraft:coarse_dirt" || bType === "minecraft:mycelium" || bType === "minecraft:dirt")) {
            action = "shove";
        } else if (isAxe) {
            const isScrapableCopper = bType.includes("copper") && (bType.includes("waxed_") || bType.includes("oxidized_") || bType.includes("weathered_") || bType.includes("exposed_"));
            const isStrippableWood = (bType.includes("log") || bType.includes("wood")) && !bType.includes("stripped_");
            if (isScrapableCopper || isStrippableWood) {
                action = "scrape";
            }
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
    if (itemStack) {
        const enchantComp = itemStack.getComponent("minecraft:enchantable");
        if (enchantComp) {
            unbreaking = enchantComp.getEnchantment("unbreaking")?.level || enchantComp.getEnchantment("minecraft:unbreaking")?.level || 0;
        }
    }

    clearHighlights(player);
    data.lastTarget = null;
    let inventory = player.getComponent("inventory").container;
    const dropTarget = Vec3(block).add(0.5, 0, 0.5);
    const ltm = world.getLootTableManager();

    if (action === "harvest") {
        try {
            player.playSound("block.sweet_berry_bush.pick");
        } catch (e) { }
    }

    system.run(() => {
        runJob(blocksToMine, (b) => {
            const bPos = Vec3(b);
            const targetType = b.typeId;

            if (action === "harvest") {
                const info = getCropInfo(b);
                if (info) {
                    try {
                        const loot = ltm.generateLootFromBlock(b, itemStack);
                        loot?.forEach(item => {
                            b.dimension.spawnItem(item, dropTarget);
                        });

                        if (info.crop.resetState) {
                            b.setPermutation(b.permutation.withState(info.crop.resetState, info.crop.resetVal));
                        } else {
                            b.setType("minecraft:air");
                        }
                    } catch (e) { }

                    if (!isCreative) {
                        try {
                            const exhaustComp = player.getComponent("minecraft:player.exhaustion");
                            if (exhaustComp) exhaustComp.setCurrentValue(exhaustComp.currentValue + 0.02);
                        } catch (e) { }

                        if (itemStack && itemStack.typeId.includes("hoe")) {
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
                }
                return;
            }

            let targetBlockId = null;

            if (action === "till") {
                if (targetType === "minecraft:coarse_dirt") {
                    targetBlockId = "minecraft:dirt";
                } else if (targetType === "minecraft:dirt_with_roots") {
                    targetBlockId = "minecraft:dirt";
                } else if (targetType === "minecraft:dirt" || targetType === "minecraft:grass_block" || targetType === "minecraft:grass_path") {
                    let canTill = true;
                    try {
                        const blockAbove = b.dimension.getBlock(bPos.add(0, 1, 0));
                        if (blockAbove && !blockAbove.isAir) canTill = false;
                    } catch (e) { }
                    if (canTill) targetBlockId = "minecraft:farmland";
                }
            } else if (action === "shove") {
                if (targetType === "minecraft:grass_block" || targetType === "minecraft:podzol" || targetType === "minecraft:coarse_dirt" || targetType === "minecraft:mycelium" || targetType === "minecraft:dirt") {
                    let canShove = true;
                    try {
                        const blockAbove = b.dimension.getBlock(bPos.add(0, 1, 0));
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
                if (targetBlockId === "minecraft:copper" || targetBlockId === "copper") targetBlockId = "minecraft:copper_block";
            }

            if (targetBlockId && targetBlockId !== targetType) {
                try {
                    if (action === "till" && targetBlockId === "minecraft:farmland") {
                        b.setType("minecraft:farmland");
                    } else if (action === "till" && targetBlockId === "minecraft:dirt") {
                        b.setType("minecraft:dirt");
                        if (targetType === "minecraft:dirt_with_roots") {
                            try {
                                b.dimension.spawnItem(new ItemStack("minecraft:hanging_roots", 1), bPos.center());
                            } catch (e) { }
                        }
                    } else if (action === "shove") {
                        b.setType("minecraft:grass_path");
                    } else {
                        const blockPerm = b.permutation;
                        const states = blockPerm.getAllStates();
                        const newPerm = BlockPermutation.resolve(targetBlockId, states);
                        b.setPermutation(newPerm);
                    }
                } catch (e) {
                    b.setType(targetBlockId);
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

