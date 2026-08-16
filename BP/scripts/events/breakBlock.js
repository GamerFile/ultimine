// Block break event handler
import { system, world, ItemStack } from "@minecraft/server";
import { Vec3, runJob } from "utils";
import { oreDropMap } from "../config.js";
import { getPlayerData, clearHighlights, isHungry } from "../state.js";
import { getBlocksForMode, isOre, isShearable } from "../mining.js";

world.beforeEvents.playerBreakBlock.subscribe(ev => {
    const { player, block } = ev;
    const data = getPlayerData(player);
    if (!data || data.slot === -1 || data.active || data.slot > 5) return;
    if (isHungry(player)) return;

    let inventory = player.getComponent("inventory").container;
    const currentItem = inventory.getItem(player.selectedSlotIndex);

    const face = data.cachedFace || "Up";
    const viewDir = data.cachedViewDir || player.getViewDirection();

    const blocksToMine = getBlocksForMode(block, face, viewDir, data.slot, currentItem, player);
    if (blocksToMine.length === 0) return;

    ev.cancel = true;

    let isCreative = false;
    try {
        const gm = player.getGameMode();
        isCreative = gm === "creative" || gm === "Creative" || gm === 1;
    } catch (e) { }

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

    const hasShears = currentItem ? currentItem.typeId.includes("shears") : false;

    clearHighlights(player);
    data.lastTarget = null;

    const dropTarget = Vec3(block).add(0.5, 0, 0.5);

    system.run(() => {
        runJob(blocksToMine, (b) => {
            const bPos = Vec3(b);
            if (isCreative) {
                b.dimension.runCommand(`setblock ${bPos.toUse()} air`);
                return;
            }

            const isTargetOre = isOre(b.typeId);

            if (isTargetOre) {
                if (hasSilkTouch) {
                    try {
                        const itemToDrop = new ItemStack(b.typeId, 1);
                        const e = b.dimension.spawnItem(itemToDrop, bPos);
                        b.dimension.runCommand(`setblock ${bPos.toUse()} air`);
                        e.teleport(dropTarget);
                    } catch (e) { }
                } else {
                    const itemDrop = oreDropMap[b.typeId] || b.typeId;

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
                            const itemStackToDrop = new ItemStack(itemDrop, Math.min(dropAmount, 64));
                            const e = b.dimension.spawnItem(itemStackToDrop, bPos);
                            e.teleport(dropTarget);
                            b.dimension.runCommand(`setblock ${bPos.toUse()} air`);
                        } catch (e) { console.warn(e) }
                    }
                }
                if (!hasSilkTouch) {
                    try {
                        b.dimension.runCommand(`summon xp_orb ${dropTarget.toUse()}`);
                    } catch (e) { }
                }
            } else if (hasShears && isShearable(b.typeId)) {
                try {
                    const itemToDrop = new ItemStack(b.typeId, 1);
                    b.dimension.runCommand(`setblock ${bPos.toUse()} air`);
                    const e = b.dimension.spawnItem(itemToDrop, bPos);
                    e.teleport(dropTarget);
                } catch (e) { }
            } else {
                b.dimension.runCommand(`setblock ${bPos.toUse()} air destroy`);
                const items = b.dimension.getEntities({ location: bPos.center(), maxDistance: 2, type: "minecraft:item" });
                items.forEach(e => e.teleport(dropTarget));
            }

            // Hunger / Exhaustion
            try {
                const exhaustComp = player.getComponent("minecraft:player.exhaustion");
                if (exhaustComp) exhaustComp.setCurrentValue(exhaustComp.currentValue + 0.05);
            } catch (e) { }

            // Tool Damage
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
