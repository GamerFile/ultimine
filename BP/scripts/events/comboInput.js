// Combo detection, hologram updates, hotbar change
import { system, world, Player } from "@minecraft/server";
import { Vec3 } from "utils";
import { slotMessageMap } from "../config.js";
import { playerSequences, getPlayerData, clearHighlights, isActive, isHungry } from "../state.js";
import { getBlocksForMode } from "../mining.js";
import { spawnHighlights } from "../highlight.js";

// Main tick loop — combo detection + hologram updating
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        const data = getPlayerData(player);
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

        data.wasSneaking = isSneaking;
        data.wasJumping = isJumping;

        // Hologram update
        if (data.slot !== -1 && !data.active) {
            if (isHungry(player)) {
                clearHighlights(player);
                data.lastTarget = null;
                player.onScreenDisplay.setActionBar(`Selected ${slotMessageMap[data.slot]} §c(Low Hunger)`);
            } else {
                const hit = player.getBlockFromViewDirection({ maxDistance: 8 });
                if (hit && hit.block) {
                    const blockPos = Vec3(hit.block);
                    const currentTargetStr = blockPos.toKey();

                    const inv = player.getComponent("inventory").container;
                    const tool = inv.getItem(player.selectedSlotIndex);
                    const currentToolStr = tool ? tool.typeId : "none";

                    const viewDir = player.getViewDirection();
                    let cardinalDir;
                    if (viewDir.y > 0.7) cardinalDir = "UP";
                    else if (viewDir.y < -0.7) cardinalDir = "DN";
                    else {
                        const angle = Math.atan2(viewDir.x, viewDir.z) * 180 / Math.PI;
                        cardinalDir = `${Math.round(angle / 45) * 45}`;
                    }

                    const checkStr = `${currentTargetStr}:${currentToolStr}:${hit.face}:${cardinalDir}`;

                    if (data.lastTarget !== checkStr) {
                        data.lastTarget = checkStr;
                        data.cachedFace = hit.face;
                        data.cachedViewDir = viewDir;
                        clearHighlights(player);

                        const blocks = getBlocksForMode(hit.block, hit.face, viewDir, data.slot, tool, player);
                        spawnHighlights(blocks, player);

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

// Combo activation/deactivation
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

// Hotbar slot change
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
