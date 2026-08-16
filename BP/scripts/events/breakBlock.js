// Block break event handler
import { Dimension, system, world } from "@minecraft/server";
import { Vec3, giveItem, runJob } from "utils";
import { getPlayerData, clearHighlights, isHungry } from "../state.js";
import { getBlocksForMode, isOre } from "../mining.js";

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

    let hasSilkTouch = false;
    let unbreaking = 0;
    if (currentItem) {
        const enchantComp = currentItem.getComponent("minecraft:enchantable");
        if (enchantComp) {
            hasSilkTouch = enchantComp.hasEnchantment("silk_touch") || enchantComp.hasEnchantment("minecraft:silk_touch") ? true : false;
            unbreaking = enchantComp.getEnchantment("unbreaking")?.level || enchantComp.getEnchantment("minecraft:unbreaking")?.level || 0;
        }
    }

    clearHighlights(player);
    data.lastTarget = null;

    const dropTarget = Vec3(block).add(0.5, 0, 0.5);
    const ltm = world.getLootTableManager();

    system.run(() => {
        runJob(blocksToMine, (b) => {
            const bPos = Vec3(b);
            if (isCreative) {
                b.dimension.runCommand(`setblock ${bPos.toUse()} air`);
                return;
            }

            // Generate loot using the loot table (handles fortune, silk touch, shears, etc.)
            const loot = ltm.generateLootFromBlock(b, currentItem);
            const blockTypeId = b.typeId;
            // giveItem(player, loot);
            loot.forEach(item => {
                b.dimension.spawnItem(item, dropTarget);
            });
            b.setType("air");

            // Ore XP (loot tables don't produce XP orbs)
            if (isOre(blockTypeId) && !hasSilkTouch) {
                try {
                    b.dimension.runCommand(`summon xp_orb ${dropTarget.toUse()}`);
                } catch (e) { }
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
