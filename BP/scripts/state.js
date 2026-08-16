// Player state management
import { system } from "@minecraft/server";

export const playerSequences = new Map();
export const activeHighlights = new Map();

export function clearHighlights(player) {
    if (activeHighlights.has(player.id)) {
        activeHighlights.get(player.id).forEach(e => {
            try { if (e.isValid) system.run(() => e.remove()); } catch (_) { }
        });
        activeHighlights.delete(player.id);
    }
}

export function getPlayerData(player) {
    if (!playerSequences.has(player.id)) {
        playerSequences.set(player.id, {
            step: 0,
            lastUpdate: 0,
            wasSneaking: false,
            wasJumping: false,
            active: false,
            slot: -1,
            lastTarget: null,
            cachedFace: null,
            cachedViewDir: null,
        });
    }
    return playerSequences.get(player.id);
}

export function isActive(player) {
    return playerSequences.get(player.id)?.active ?? false;
}

export function isHungry(player) {
    try {
        const hungerComp = player.getComponent("minecraft:player.hunger");
        if (hungerComp && hungerComp.currentValue <= hungerComp.effectiveMin) return true;
    } catch (e) { }
    return false;
}
