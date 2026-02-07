import * as THREE from 'three';
import { PLAYER } from '../config/constants.js';

export class CombatSystem {
  constructor(game) {
    this.game = game;
  }

  playerAttack() {
    const player = this.game.player;
    if (!player || player.dead) return;

    const px = player.mesh.position.x;
    const pz = player.mesh.position.z;
    const facing = player.facing;

    // Get nearby enemies
    const nearby = this.game.enemyManager.getAliveEnemiesNear(px, pz, PLAYER.attackRange + 1);

    for (const enemy of nearby) {
      const ex = enemy.mesh.position.x;
      const ez = enemy.mesh.position.z;
      const dx = ex - px;
      const dz = ez - pz;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Range check
      if (dist > PLAYER.attackRange) continue;

      // Don't attack across locked zone boundaries
      const em = this.game.enemyManager;
      if (em && !em.zoneUnlocked[enemy.zoneIndex]) continue;

      // Arc check: angle between facing direction and direction to enemy
      const toEnemy = new THREE.Vector3(dx, 0, dz).normalize();
      const angle = Math.acos(
        Math.max(-1, Math.min(1, facing.dot(toEnemy)))
      );

      if (angle <= PLAYER.attackArc / 2) {
        const damage = player.getDamage();
        enemy.takeDamage(damage);

        if (this.game.damageNumbers) {
          this.game.damageNumbers.spawn(
            ex, enemy.scale * 2 + 0.5, ez,
            Math.round(damage), 0xffff44
          );
        }

        // Hit impact particles at midpoint between player and enemy
        if (this.game.particleSystem) {
          const mx = (px + ex) / 2;
          const mz = (pz + ez) / 2;
          this.game.particleSystem.burst(mx, 0.8, mz, 0xffffaa, 5);
        }

        // Subtle hit shake
        this.game.shake(0.08);

        if (this.game.audioManager) {
          this.game.audioManager.play('hit');
        }
      }
    }
  }

  update(dt) {
    // Combat system is event-driven, no per-frame updates needed
  }
}
