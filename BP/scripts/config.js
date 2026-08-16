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

export const SHEARABLE_BLOCKS = new Set([
    "minecraft:leaves", "minecraft:leaves2",
    "minecraft:azalea_leaves", "minecraft:azalea_leaves_flowered",
    "minecraft:mangrove_leaves", "minecraft:cherry_leaves",
    "minecraft:vine", "minecraft:cobweb",
    "minecraft:short_grass", "minecraft:tall_grass",
    "minecraft:fern", "minecraft:large_fern",
    "minecraft:dead_bush", "minecraft:seagrass",
    "minecraft:glow_lichen", "minecraft:hanging_roots",
    "minecraft:nether_sprouts", "minecraft:twisting_vines",
    "minecraft:weeping_vines", "minecraft:cave_vines",
    "minecraft:cave_vines_body_with_berries", "minecraft:cave_vines_head_with_berries"
]);

export const blockGroups = [
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

export const oreDropMap = {
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
