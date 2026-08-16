// Configuration constants for Ultimine

export const EDGE_ENTITY = "file:selected_block";

export const slotMessageMap = {
    0: "§bShapeless",
    1: "§bSmall Tunnel",
    2: "§bSmall Square (3 x 3)",
    3: "§bLarge Tunnel (3 x 3)",
    4: "§bMining Tunnel",
    5: "§bEscape Tunnel",
    6: "§cUnavailable",
    7: "§cUnavailable",
    8: "§cUnavailable",
};

export const MAX_BLOCKS = 64;

export const EXCLUDED_BLOCKS = new Set([
    "minecraft:air", "minecraft:bedrock", "minecraft:water", "minecraft:lava",
    "minecraft:flowing_water", "minecraft:flowing_lava", "minecraft:fire",
    "minecraft:soul_fire", "minecraft:light_block", "minecraft:structure_void",
    "minecraft:barrier"
]);


export const blockGroups = [
    new Set(["minecraft:dirt", "minecraft:grass_block", "minecraft:grass_path", "minecraft:podzol", "minecraft:mycelium"]),
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
