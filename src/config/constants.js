export const PLAYER = {
  speed: 8,
  attackCooldown: 0.5,
  attackRange: 2.5,
  attackArc: Math.PI / 2, // 90 degrees
  startPoints: 2,
  respawnInvulnerability: 2,
  size: 0.5,
};

export const BASE_ZONES = [
  { name: 'Sanctuary',      innerRadius: 0,   outerRadius: 15,  enemyStrength: 0,   color: 0x7ec850, enemyCount: 0,  speedMultiplier: 1.0 },
  { name: 'Grasslands',     innerRadius: 15,  outerRadius: 50,  enemyStrength: 6,   color: 0x8bba42, enemyCount: 20, speedMultiplier: 0.8 },
  { name: 'Dark Woods',     innerRadius: 50,  outerRadius: 100, enemyStrength: 30,  color: 0x4a7a2e, enemyCount: 31, speedMultiplier: 0.9 },
  { name: 'Scorched Flats', innerRadius: 100, outerRadius: 165, enemyStrength: 90,  color: 0xb8860b, enemyCount: 40, speedMultiplier: 1.0 },
  { name: 'Crimson Wastes', innerRadius: 165, outerRadius: 245, enemyStrength: 180, color: 0x8b2500, enemyCount: 46, speedMultiplier: 1.1 },
  { name: 'Frozen Abyss',   innerRadius: 245, outerRadius: 345, enemyStrength: 300, color: 0x4a6fa5, enemyCount: 51, speedMultiplier: 1.2 },
  { name: 'Void Lands',     innerRadius: 345, outerRadius: 465, enemyStrength: 450, color: 0x2d1b4e, enemyCount: 56, speedMultiplier: 1.4 },
  { name: 'Mythic Core',    innerRadius: 465, outerRadius: 600, enemyStrength: 900, color: 0x1a0020, enemyCount: 60, speedMultiplier: 1.6 },
];

const GENERATED_ZONE_NAMES = [
  'Burning Depths', 'Crystal Veil', 'Ashen Hollow', 'Nether Reach',
  'Shattered Expanse', 'Obsidian Rift', 'Twilight Wastes', 'Phantom Marshes',
  'Iron Pits', 'Molten Sanctum', 'Abyssal Frontier', 'Storm Cradle',
  'Wraithwood', 'Ember Plateau', 'Glacial Maw', 'Starfall Basin',
];

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color);
  };
  return (f(0) << 16) | (f(8) << 8) | f(4);
}

class _ZoneManager {
  constructor() {
    this._cache = [...BASE_ZONES];
  }

  getZone(index) {
    if (index < BASE_ZONES.length) return BASE_ZONES[index];
    if (this._cache[index]) return this._cache[index];

    // Generate zones up to this index
    for (let i = this._cache.length; i <= index; i++) {
      const prev = this._cache[i - 1];
      const innerRadius = prev.outerRadius;
      const outerRadius = innerRadius + 120 + (i - 7) * 15;
      const enemyStrength = Math.floor(2400 * Math.pow(1.5, i - 7));
      const hue = (i * 47) % 360;
      const color = hslToHex(hue, 60, 35);
      const enemyCount = Math.floor(20 * Math.log2(i + 1));
      const nameIndex = (i - BASE_ZONES.length) % GENERATED_ZONE_NAMES.length;
      const name = GENERATED_ZONE_NAMES[nameIndex] + (i >= BASE_ZONES.length + GENERATED_ZONE_NAMES.length ? ` ${Math.floor((i - BASE_ZONES.length) / GENERATED_ZONE_NAMES.length) + 1}` : '');

      const speedMultiplier = Math.min(1.6 + (i - 7) * 0.1, 3.0);

      this._cache[i] = {
        name,
        innerRadius,
        outerRadius,
        enemyStrength,
        color,
        enemyCount,
        speedMultiplier,
      };
    }

    return this._cache[index];
  }

  getZoneCount() {
    return this._cache.length;
  }

  getZoneForRadius(dist) {
    // Check cached zones from highest to lowest
    for (let i = this._cache.length - 1; i >= 0; i--) {
      if (dist >= this._cache[i].innerRadius) return i;
    }
    return 0;
  }

  getMaxRadius() {
    return this._cache[this._cache.length - 1].outerRadius;
  }
}

export const ZoneManager = new _ZoneManager();

// Backward compat: ZONES array reference for static 8
export const ZONES = BASE_ZONES;

export const WEAPONS = [
  { threshold: 0,     name: 'Grass Stick',     damage: 2,   color: 0x7ec850, maxHp: 10  },
  { threshold: 50,    name: 'Wooden Club',     damage: 10,  color: 0x8b5e3c, maxHp: 40  },
  { threshold: 500,   name: 'Iron Sword',      damage: 30,  color: 0xaaaaaa, maxHp: 100 },
  { threshold: 2500,  name: 'Steel Blade',     damage: 60,  color: 0xc0c0c0, maxHp: 200 },
  { threshold: 8000,  name: 'Golden Sword',    damage: 100, color: 0xffd700, maxHp: 300 },
  { threshold: 18000, name: 'Diamond Sword',   damage: 150, color: 0x00ffff, maxHp: 450 },
  { threshold: 35000, name: 'Legendary Blade', damage: 300, color: 0xff4500, maxHp: 500 },
  { threshold: 70000, name: 'Mythic Sword',    damage: 800, color: 0xff00ff, maxHp: 500 },
];

export const DROPS = {
  rates: [
    { weight: 76, type: 'points', value: 1,  color: 0x44ff44 },
    { weight: 7,  type: 'multiplier', value: 2,  color: 0x4488ff },
    { weight: 4,  type: 'multiplier', value: 3,  color: 0xaa44ff },
    { weight: 2,  type: 'multiplier', value: 5,  color: 0xffd700 },
    { weight: 1,  type: 'multiplier', value: 10, color: 0xffffff },
    { weight: 10, type: 'heal', value: 1, color: 0xff4466 },
  ],
  despawnTime: 30,
  collectRadius: 1.5,
};

export const ENEMY = {
  chaseRange: 6,
  attackCooldown: 1,
  damageMultiplier: 0.2,
  respawnTimeMin: 5,
  respawnTimeMax: 10,
  wanderSpeed: 1.5,
  chaseSpeed: 3,
};

export const CAMERA = {
  frustumSize: 30,
  mobileFrustumSize: 40,
  offsetX: 50,
  offsetY: 50,
  offsetZ: 50,
};

export const WORLD = {
  boundaryPadding: 5,
};
