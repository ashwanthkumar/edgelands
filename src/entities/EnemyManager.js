import { BASE_ZONES, ZoneManager } from '../config/constants.js';
import { Enemy } from './Enemy.js';

export class EnemyManager {
  constructor(game) {
    this.game = game;
    this.enemies = []; // flat array of all enemies
    this.zoneEnemies = []; // enemies grouped by zone index

    // Zone kill tracking
    this.zoneKills = new Array(BASE_ZONES.length).fill(0);
    this.zoneUnlocked = new Array(BASE_ZONES.length).fill(false);
    this.zoneUnlocked[0] = true; // Sanctuary always unlocked
    this.zoneUnlocked[1] = true; // Grasslands auto-unlocked (Sanctuary has 0 enemies)

    // Track highest generated zone
    this.maxGenerated = BASE_ZONES.length - 1;

    for (let i = 0; i < BASE_ZONES.length; i++) {
      const zone = BASE_ZONES[i];
      const zoneList = [];
      for (let j = 0; j < zone.enemyCount; j++) {
        const enemy = new Enemy(i, game);
        this.enemies.push(enemy);
        zoneList.push(enemy);
      }
      this.zoneEnemies.push(zoneList);
    }
  }

  recalculateAllEnemies() {
    for (let i = 0; i < this.enemies.length; i++) {
      this.enemies[i].recalculateHp();
    }
  }

  onEnemyKilled(zoneIndex) {
    // Grow arrays if needed
    while (this.zoneKills.length <= zoneIndex) {
      this.zoneKills.push(0);
    }
    this.zoneKills[zoneIndex]++;
    this._checkZoneUnlock(zoneIndex);
    this.save();
  }

  _checkZoneUnlock(zoneIndex) {
    const zone = ZoneManager.getZone(zoneIndex);
    if (zone.enemyCount === 0) return;
    // 100% kill threshold
    const threshold = zone.enemyCount;
    if (this.zoneKills[zoneIndex] >= threshold) {
      const nextZone = zoneIndex + 1;
      // Grow arrays if needed
      while (this.zoneUnlocked.length <= nextZone) {
        this.zoneUnlocked.push(false);
      }
      if (!this.zoneUnlocked[nextZone]) {
        this.zoneUnlocked[nextZone] = true;
        // Upgrade weapon and refill HP as zone clear reward
        if (this.game.player) {
          this.game.player.upgradeWeapon();
          this.game.player.hp = this.game.player.maxHp;
        }
        if (this.game.audioManager) {
          this.game.audioManager.play('zoneUnlock');
        }
        // Zone clear celebration
        if (this.game.zoneClearOverlay) {
          const nextZoneData = ZoneManager.getZone(nextZone);
          this.game.zoneClearOverlay.show(zone.name, nextZoneData.name);
        }
      }
    }
  }

  getMaxUnlockedZone() {
    for (let i = this.zoneUnlocked.length - 1; i >= 0; i--) {
      if (this.zoneUnlocked[i]) return i;
    }
    return 0;
  }

  getZoneProgress(zoneIndex) {
    const zone = ZoneManager.getZone(zoneIndex);
    if (zone.enemyCount === 0) {
      return { kills: 0, threshold: 0, unlocked: true };
    }
    // 100% kill threshold
    const threshold = zone.enemyCount;
    const kills = this.zoneKills[zoneIndex] || 0;
    return {
      kills,
      threshold,
      unlocked: kills >= threshold,
    };
  }

  expandToZone(index) {
    if (index <= this.maxGenerated) return;

    for (let i = this.maxGenerated + 1; i <= index; i++) {
      // Ensure zone config exists
      const zone = ZoneManager.getZone(i);
      const zoneList = [];
      for (let j = 0; j < zone.enemyCount; j++) {
        const enemy = new Enemy(i, this.game);
        this.enemies.push(enemy);
        zoneList.push(enemy);
      }
      this.zoneEnemies.push(zoneList);

      // Grow tracking arrays
      while (this.zoneKills.length <= i) this.zoneKills.push(0);
      while (this.zoneUnlocked.length <= i) this.zoneUnlocked.push(false);

      // Build terrain and decorations for new zone
      if (this.game.worldManager) {
        if (this.game.worldManager.terrain) {
          this.game.worldManager.terrain.addZoneRing(zone, i);
        }
        if (this.game.worldManager.decorations) {
          this.game.worldManager.decorations.decorateZone(i);
        }
      }
    }

    this.maxGenerated = index;
  }

  reset() {
    // Reset zone kill tracking
    for (let i = 0; i < this.zoneKills.length; i++) {
      this.zoneKills[i] = 0;
    }
    // Reset zone unlocks (only sanctuary and grasslands)
    for (let i = 0; i < this.zoneUnlocked.length; i++) {
      this.zoneUnlocked[i] = (i <= 1);
    }
    // Respawn all enemies to full HP (recalculate in case difficulty changed)
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      enemy.alive = true;
      enemy.recalculateHp();
      enemy.mesh.visible = true;
      enemy._placeInZone();
    }
    // Clear localStorage
    try {
      localStorage.removeItem('edgelands_zones');
    } catch (e) { /* ignore */ }
  }

  save() {
    try {
      const data = {
        zoneKills: this.zoneKills,
        zoneUnlocked: this.zoneUnlocked,
      };
      localStorage.setItem('edgelands_zones', JSON.stringify(data));
    } catch (e) { /* ignore */ }
  }

  load() {
    try {
      const raw = localStorage.getItem('edgelands_zones');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.zoneKills) {
        for (let i = 0; i < data.zoneKills.length; i++) {
          if (i >= this.zoneKills.length) this.zoneKills.push(0);
          this.zoneKills[i] = data.zoneKills[i];
        }
      }
      if (data.zoneUnlocked) {
        for (let i = 0; i < data.zoneUnlocked.length; i++) {
          if (i >= this.zoneUnlocked.length) this.zoneUnlocked.push(false);
          this.zoneUnlocked[i] = data.zoneUnlocked[i];
        }
      }
      // Ensure sanctuary and grasslands are always unlocked
      this.zoneUnlocked[0] = true;
      this.zoneUnlocked[1] = true;

      // Expand zones for any previously unlocked zones beyond base 8
      const maxUnlocked = this.getMaxUnlockedZone();
      if (maxUnlocked >= BASE_ZONES.length) {
        this.expandToZone(maxUnlocked + 1);
      }
    } catch (e) { /* ignore */ }
  }

  update(dt) {
    const player = this.game.player;
    if (!player) return;

    const playerZone = player.getCurrentZone();

    // Dynamic zone expansion: if player is near the edge of generated zones
    if (playerZone >= this.maxGenerated - 1) {
      this.expandToZone(this.maxGenerated + 2);
    }

    // Only update enemies in nearby zones for performance
    for (let i = 0; i < this.zoneEnemies.length; i++) {
      // Update enemies in player's zone and adjacent zones
      if (Math.abs(i - playerZone) <= 1) {
        const enemies = this.zoneEnemies[i];
        for (let j = 0; j < enemies.length; j++) {
          enemies[j].update(dt);
        }
      } else {
        // Only update respawn timers for distant enemies
        const enemies = this.zoneEnemies[i];
        for (let j = 0; j < enemies.length; j++) {
          if (!enemies[j].alive) {
            enemies[j].respawnTimer -= dt;
            if (enemies[j].respawnTimer <= 0) {
              enemies[j]._respawn();
            }
          }
        }
      }
    }
  }

  getAliveEnemiesNear(x, z, radius) {
    const results = [];
    const r2 = radius * radius;
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (!e.alive) continue;
      const dx = e.mesh.position.x - x;
      const dz = e.mesh.position.z - z;
      if (dx * dx + dz * dz <= r2) {
        results.push(e);
      }
    }
    return results;
  }
}
