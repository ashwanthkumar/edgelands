import { DROPS } from '../config/constants.js';
import { Pickup } from './Pickup.js';

export class PickupManager {
  constructor(game) {
    this.game = game;
    this.pickups = [];
    this._totalWeight = DROPS.rates.reduce((s, r) => s + r.weight, 0);
  }

  spawnDrop(x, z, enemyStrength = 1) {
    const drop = this._rollDrop();
    const pickup = new Pickup(x, z, drop, this.game.scene, enemyStrength);
    this.pickups.push(pickup);
  }

  _rollDrop() {
    let roll = Math.random() * this._totalWeight;
    for (const rate of DROPS.rates) {
      roll -= rate.weight;
      if (roll <= 0) return rate;
    }
    return DROPS.rates[0];
  }

  update(dt) {
    const player = this.game.player;
    if (!player || player.dead) {
      // Still update pickups for despawn
      for (let i = this.pickups.length - 1; i >= 0; i--) {
        this.pickups[i].update(dt);
        if (!this.pickups[i].alive) this.pickups.splice(i, 1);
      }
      return;
    }

    const px = player.mesh.position.x;
    const pz = player.mesh.position.z;

    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pickup = this.pickups[i];
      pickup.update(dt);

      if (!pickup.alive) {
        this.pickups.splice(i, 1);
        continue;
      }

      // Collection check
      const dx = pickup.mesh.position.x - px;
      const dz = pickup.mesh.position.z - pz;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < DROPS.collectRadius) {
        this._collect(pickup);
        this.pickups.splice(i, 1);
      }
    }
  }

  _collect(pickup) {
    const player = this.game.player;
    const wx = pickup.mesh.position.x;
    const wz = pickup.mesh.position.z;

    if (pickup.type === 'points') {
      const gained = pickup.value * pickup.enemyStrength;
      player.addPoints(gained);
      // Score popup
      if (this.game.damageNumbers) {
        this.game.damageNumbers.spawnText(wx, 1.5, wz, `+${gained}`, 0x44ff44);
      }
    } else if (pickup.type === 'heal') {
      const healed = Math.min(player.maxHp - player.hp, player.maxHp);
      player.hp = player.maxHp;
      if (this.game.damageNumbers && healed > 0) {
        this.game.damageNumbers.spawnText(wx, 1.5, wz, `+${Math.round(healed)} HP`, 0xff4466);
      }
    } else if (pickup.type === 'multiplier') {
      const oldPoints = player.points;
      player.multiplyPoints(pickup.value);
      const gain = player.points - oldPoints;
      // Score popup with multiplier info
      if (this.game.damageNumbers) {
        const color = pickup.dropColor || 0x4488ff;
        this.game.damageNumbers.spawnText(wx, 1.5, wz, `+${gain}x${pickup.value}`, color);
      }
    }

    pickup.destroy();

    if (this.game.audioManager) {
      this.game.audioManager.play('pickup');
    }
  }
}
