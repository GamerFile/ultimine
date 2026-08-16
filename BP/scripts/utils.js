import { Block, ItemStack, World, system } from "@minecraft/server";


/**
 * 
 * @param {import("@minecraft/server").Vector3} direction 
 * @param {import("@minecraft/server").Vector3} location
 * @param {Number} dist
 * @returns {import("@minecraft/server").Vector3}
 */
function getPoint(direction, location, dist) {
    return {
        x: location.x + direction.x * dist,
        y: location.y + direction.y * dist,
        z: location.z + direction.z * dist
    }
}
/**
 * 
 * @param {import("@minecraft/server").Vector3} loc1 
 * @param {import("@minecraft/server").Vector3} loc2 
 * @returns {Number}
 */
function getDist(loc1, loc2) {
    return Math.hypot(loc1.x - loc2.x, loc1.y - loc2.y, loc1.z - loc2.z);
}



/**
 * 
 * @param {Number} val 
 * @param {Number} min 
 * @param {Number} max 
 * @returns Number
 */
const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

/**
 * 
 * @param {Array} arr1 
 * @param {Array} arr2 
 * @returns {Boolean}
 */
function sameArray(arr1, arr2) {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false
    if (arr1.length !== arr2.length) return false
    for (let i in arr1) {
        if (arr1[i] !== arr2[i]) return false
    }
    return true
}
/**
 * 
 * @param {ItemStack} toItem 
 * @param {ItemStack} fromItem 
 * @returns {Number | void}
 */
function stackNum(fromItem, toItem) {
    if (!fromItem || !toItem) return
    if (toItem.isStackableWith(fromItem)) {
        const toAmt = toItem.amount
        const fromAmt = fromItem.amount
        if (toAmt < toItem.maxAmount) {
            const diff = toItem.maxAmount - toAmt
            if (diff <= fromAmt) {
                return diff
            } else if (diff > fromAmt) {
                return fromAmt
            }
        }
    }
}

/**
 * 
 * @param {Player} player 
 * @param {ItemStack} itemStack 
 * @param {Number} amount 
 */
/**
 * @param {Entity} entity
 * @param {ItemStack | ItemStack[]} items
 */
function giveItem(entity, items) {
    const inv = entity.getComponent('inventory')?.container;
    if (inv == undefined) return;
    if (!Array.isArray(items)) items = [items];

    for (let item of items) {
        if (item == undefined) continue;

        item = inv.addItem(item);
        if (item) try {
            entity.dimension.spawnItem(item, entity.location);
        } catch { }
    }
}
/**
 * 
 * @param {Number | import("@minecraft/server").Vector3} x 
 * @param {Number} y 
 * @param {Number} z 
 * @returns {import("@minecraft/server").Vector3}
 */
// const Vec3 = (x,y,z) => ({x,y,z, add: (x2,y2,z2) => Vec3(x + x2, y + y2, z + z2), mul: (x2,y2,z2) => Vec3(x * x2, y * y2, z * z2) })

export class Vector3 {
    constructor(x, y, z) {
        if (typeof x === 'object' && x !== null) {
            this.x = x.x;
            this.y = x.y;
            this.z = x.z;
        } else {
            this.x = x;
            this.y = y;
            this.z = z;
        }
    }

    add(x2, y2, z2) { return new Vector3(this.x + x2, this.y + y2, this.z + z2); }
    addV(v) { return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z); }
    mul(x2, y2, z2) { return new Vector3(this.x * x2, this.y * y2, this.z * z2); }
    mulV(v) { return new Vector3(this.x * v.x, this.y * v.y, this.z * v.z); }
    sub(x2, y2, z2) { return new Vector3(this.x - x2, this.y - y2, this.z - z2); }
    subV(v) { return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z); }
    scale(s) { return new Vector3(this.x * s, this.y * s, this.z * s); }
    normalize() {
        const len = Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
        return len === 0 ? new Vector3(0, 0, 0) : new Vector3(this.x / len, this.y / len, this.z / len);
    }
    map(fn) { return new Vector3(fn(this.x), fn(this.y), fn(this.z)); }
    lerp(v, t) { return new Vector3(this.x + (v.x - this.x) * t, this.y + (v.y - this.y) * t, this.z + (v.z - this.z) * t); }
    rotateY(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vector3(this.x * cos - this.z * sin, this.y, this.x * sin + this.z * cos);
    }
    owx(v) { return new Vector3(v, this.y, this.z); }
    owy(v) { return new Vector3(this.x, v, this.z); }
    owz(v) { return new Vector3(this.x, this.y, v); }
    length() { return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2); }
    dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
    crossV(v) { return new Vector3(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x); }
    cross(x1, y1, z1) { return new Vector3(this.y * z1 - this.z * y1, this.z * x1 - this.x * z1, this.x * y1 - this.y * x1); }
    distanceTo(v) { return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2 + (this.z - v.z) ** 2); }
    inV(v1, v2) { return this.x >= v1.x && this.x <= v2.x && this.y >= v1.y && this.y <= v2.y && this.z >= v1.z && this.z <= v2.z; }
    in([x1, y1, z1], [x2, y2, z2]) { return this.x >= x1 && this.x <= x2 && this.y >= y1 && this.y <= y2 && this.z >= z1 && this.z <= z2; }
    toString() { return `Vec3(${this.x.toFixed(2)}, ${this.y.toFixed(2)}, ${this.z.toFixed(2)})`; }
    toUse() { return `${this.x} ${this.y} ${this.z}`; }
    toKey() { return `${this.x},${this.y},${this.z}`; }
    center() { return new Vector3(this.x + 0.5, this.y + 0.5, this.z + 0.5); }
    floor() { return new Vector3(Math.floor(this.x), Math.floor(this.y), Math.floor(this.z)); }
    abs() { return new Vector3(Math.abs(this.x), Math.abs(this.y), Math.abs(this.z)); }
    equals(v) { return this.x === v.x && this.y === v.y && this.z === v.z; }
}

const Vec3 = (x, y, z) => new Vector3(x, y, z);
Vec3.convert = ({ x, y, z }) => new Vector3(x, y, z);




/**
 * 
 * @param {import("@minecraft/server").Vector3} a 
 * @param {import("@minecraft/server").Vector3} b 
 * @returns {import("@minecraft/server").Vector3}
 */
function addVec3(a, b) {
    return Vec3(a.x + b.x, a.y + b.y, a.z + b.z)
}

/**
 * 
 * @param {import("@minecraft/server").Vector3} a 
 * @param {import("@minecraft/server").Vector3} b 
 * @returns {import("@minecraft/server").Vector3}
 */
function multiplyVec3(a, b) {
    return Vec3(a.x * b.x, a.y * b.y, a.z * b.z)
}

function* range(from, to, skip = 1) {
    !(!!(to)) && ((to = from), (from = 0))
    for (let i = from; i < to; i += skip) yield i
}

//@debug
const jsonStringify = (obj, indent = 2) => {
    const color = {
        key: '§6',       // gold
        string: '§a',    // green
        number: '§b',    // aqua
        boolean: '§d',   // light purple
        null: '§8',      // dark gray
        brace: '§f'      // white
    };

    const replacer = (value, depth = 0) => {
        const pad = ' '.repeat(indent * depth);

        if (value === null) return color.null + 'null' + color.brace;
        if (Array.isArray(value)) {
            const items = value.map(v => replacer(v, depth + 1));
            return color.brace + '[\n' + items.map(i => pad + ' '.repeat(indent) + i).join(',\n') + '\n' + pad + ']' + color.brace;
        }
        if (typeof value === 'object') {
            const entries = Object.entries(value).map(([k, v]) =>
                pad + ' '.repeat(indent) + color.key + `"${k}"` + color.brace + ': ' + replacer(v, depth + 1)
            );
            return color.brace + '{\n' + entries.join(',\n') + '\n' + pad + '}' + color.brace;
        }
        switch (typeof value) {
            case 'string': return color.string + `"${value}"` + color.brace;
            case 'number': return color.number + value + color.brace;
            case 'boolean': return color.boolean + value + color.brace;
            default: return color.brace + String(value);
        }
    };

    return replacer(obj);
};
/**
 * 
 * @param {Number} ms 
 * @returns {String}
 */
function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}


/**
 * Runs a job by processing items in chunks to avoid watchdog termination,
 * while creating a smooth proportional "block by block" visual animation.
 * @template T
 * @param {T[]} items Array of items to process
 * @param {(item: T) => void} processFn Function to process each item
 * @param {() => void} [onDone] Optional callback when done
 */
function runJob(items, processFn, onDone) {
    let index = 0;
    const total = items.length;

    // Dynamic batch size: Aim for ~2 seconds (40 ticks) completion
    // Plateau at 500 blocks/tick, floor at 2 blocks/tick
    const maxBatch = 500;
    const minBatch = 64;
    const targetTicks = 20; // Faster 1-second animation looks better
    const batchSize = Math.floor(Math.min(maxBatch, Math.max(minBatch, total / targetTicks)));

    const interval = system.runInterval(() => {
        let processed = 0;
        // Process up to batchSize items per tick
        while (processed < batchSize && index < total) {
            processFn(items[index]);
            index++;
            processed++;
        }

        if (index >= total) {
            system.clearRun(interval);
            if (onDone) onDone();
        }
    }, 1); // Every 1 tick for a smooth effect
}

export { clamp, stackNum, sameArray, giveItem, Vec3, formatTime, range, runJob };