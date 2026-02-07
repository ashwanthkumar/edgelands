import * as THREE from 'three';
import { ENEMY, ZoneManager, getDifficulty } from '../config/constants.js';

const ZONE_GEOMETRIES = [
  null, // zone 0: no enemies
  new THREE.SphereGeometry(1, 8, 6),            // Grasslands
  new THREE.IcosahedronGeometry(1, 0),           // Dark Woods
  new THREE.OctahedronGeometry(1, 0),            // Scorched Flats
  new THREE.DodecahedronGeometry(1, 0),          // Crimson Wastes
  new THREE.ConeGeometry(1, 1.6, 5),             // Frozen Abyss
  new THREE.TorusGeometry(0.6, 0.3, 8, 12),      // Void Lands
  new THREE.IcosahedronGeometry(1, 1),           // Mythic Core
];

function getGeometryForZone(zoneIndex) {
  if (zoneIndex < ZONE_GEOMETRIES.length) return ZONE_GEOMETRIES[zoneIndex];
  // Cycle through geometries 1-7 for zones beyond 7
  return ZONE_GEOMETRIES[1 + (zoneIndex % 7)];
}

export class Enemy {
  constructor(zoneIndex, game) {
    this.game = game;
    this.zoneIndex = zoneIndex;
    this.zone = ZoneManager.getZone(zoneIndex);
    this.maxHp = getDifficulty().hitsToKill * this.zoneIndex;
    this.hp = this.maxHp;
    this.alive = true;
    this.attackCooldownTimer = 0;

    // AI state
    this.state = 'wander'; // 'wander' | 'chase'
    this.wanderTarget = null;
    this.wanderTimer = 0;

    // Respawn
    this.respawnTimer = 0;
    this._flashTimeout = null;

    // Attack animation
    this._attackAnimTimer = 0;
    this._isAttackAnim = false;

    // Walk animation
    this._walkPhase = 0;
    this._isMoving = false;

    // Visual size scales with log(strength)
    const scale = 0.3 + Math.log2(this.maxHp + 1) * 0.12;
    this.scale = Math.min(scale, 1.5);

    // Build mesh
    this.mesh = new THREE.Group();
    this._buildMesh();

    // Place randomly in zone
    this._placeInZone();
    game.scene.add(this.mesh);
  }

  _buildMesh() {
    const geo = getGeometryForZone(this.zoneIndex);
    if (!geo) return;

    const mat = new THREE.MeshLambertMaterial({
      color: this.zone.color,
      emissive: this.zone.color,
      emissiveIntensity: 0.15,
    });

    const legHeight = this.scale * 0.8;
    this.bodyMesh = new THREE.Mesh(geo, mat);
    this.bodyMesh.scale.setScalar(this.scale);
    this.bodyMesh.position.y = this.scale + legHeight;
    this.bodyMesh.castShadow = true;
    this.mesh.add(this.bodyMesh);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.06 * this.scale, 6, 6);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.2 * this.scale, this.scale * 1.2 + legHeight, -0.5 * this.scale);
    this.mesh.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.2 * this.scale, this.scale * 1.2 + legHeight, -0.5 * this.scale);
    this.mesh.add(eyeR);

    // Claw arms with pivot joints
    const clawMat = new THREE.MeshLambertMaterial({
      color: this.zone.color,
      emissive: this.zone.color,
      emissiveIntensity: 0.4,
    });
    const clawLen = this.scale * 1.0;
    const clawGeo = new THREE.ConeGeometry(0.12 * this.scale, clawLen, 5);

    this.leftClawPivot = new THREE.Group();
    this.leftClawPivot.position.set(-this.scale * 1.2, this.scale * 0.8 + legHeight, 0);
    const clawL = new THREE.Mesh(clawGeo, clawMat);
    clawL.position.y = -clawLen * 0.5;
    this.leftClawPivot.add(clawL);
    this.mesh.add(this.leftClawPivot);

    this.rightClawPivot = new THREE.Group();
    this.rightClawPivot.position.set(this.scale * 1.2, this.scale * 0.8 + legHeight, 0);
    const clawR = new THREE.Mesh(clawGeo, clawMat);
    clawR.position.y = -clawLen * 0.5;
    this.rightClawPivot.add(clawR);
    this.mesh.add(this.rightClawPivot);

    // Legs with pivot joints at bottom of body
    const legMat = new THREE.MeshLambertMaterial({
      color: this.zone.color,
      emissive: this.zone.color,
      emissiveIntensity: 0.2,
    });
    const legLen = legHeight;
    const legGeo = new THREE.CylinderGeometry(0.12 * this.scale, 0.09 * this.scale, legLen, 6);

    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-this.scale * 0.45, legHeight + this.scale * 0.15, 0);
    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.y = -legLen * 0.5;
    this.leftLegPivot.add(legL);
    this.mesh.add(this.leftLegPivot);

    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(this.scale * 0.45, legHeight + this.scale * 0.15, 0);
    const legR = new THREE.Mesh(legGeo, legMat);
    legR.position.y = -legLen * 0.5;
    this.rightLegPivot.add(legR);
    this.mesh.add(this.rightLegPivot);

    // Strength label above head
    this._buildStrengthLabel();
  }

  _buildStrengthLabel() {
    this.labelCanvas = document.createElement('canvas');
    this.labelCanvas.width = 64;
    this.labelCanvas.height = 32;
    this.labelCtx = this.labelCanvas.getContext('2d');

    this.labelTexture = new THREE.CanvasTexture(this.labelCanvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: this.labelTexture,
      transparent: true,
      depthTest: false,
    });
    this.labelSprite = new THREE.Sprite(spriteMat);
    this.labelSprite.position.y = this.scale * 2.2 + this.scale * 0.8;
    this.labelSprite.scale.set(1.0, 0.5, 1);
    this.mesh.add(this.labelSprite);

    this._updateStrengthLabel();
  }

  _updateStrengthLabel() {
    const ctx = this.labelCtx;
    ctx.clearRect(0, 0, 64, 32);
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const val = this.hp;
    const text = val >= 1000000 ? (val / 1000000).toFixed(1) + 'M'
      : val >= 1000 ? (val / 1000).toFixed(1) + 'K'
      : String(Math.round(val));
    ctx.fillText(text, 32, 16);
    this.labelTexture.needsUpdate = true;
  }

  _placeInZone() {
    const pos = this._randomInZone();
    this.mesh.position.set(pos.x, 0, pos.z);
  }

  _randomInZone() {
    const angle = Math.random() * Math.PI * 2;
    const inner = this.zone.innerRadius + 1;
    const outer = this.zone.outerRadius - 1;
    const r = Math.sqrt(Math.random() * (outer * outer - inner * inner) + inner * inner);
    return { x: Math.cos(angle) * r, z: Math.sin(angle) * r };
  }

  update(dt) {
    if (!this.alive) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this._respawn();
      }
      return;
    }

    this.attackCooldownTimer -= dt;

    // Idle bob
    if (this.bodyMesh) {
      this.bodyMesh.rotation.y += dt * 0.5;
    }

    // Attack animation
    if (this._isAttackAnim) {
      this._attackAnimTimer -= dt;
      const t = 1 - (this._attackAnimTimer / 0.3);
      // Both claws swing forward (negative x = toward player)
      const swing = Math.sin(t * Math.PI) * -1.2;
      if (this.leftClawPivot) this.leftClawPivot.rotation.x = swing;
      if (this.rightClawPivot) this.rightClawPivot.rotation.x = swing;
      if (this._attackAnimTimer <= 0) {
        this._isAttackAnim = false;
        if (this.leftClawPivot) this.leftClawPivot.rotation.x = 0;
        if (this.rightClawPivot) this.rightClawPivot.rotation.x = 0;
      }
    } else if (this.state === 'chase') {
      // Subtle claw readiness while chasing
      const ready = Math.sin(Date.now() * 0.006) * 0.2;
      if (this.leftClawPivot) this.leftClawPivot.rotation.x = ready;
      if (this.rightClawPivot) this.rightClawPivot.rotation.x = ready;
    } else {
      // Idle: gentle sway
      const sway = Math.sin(Date.now() * 0.003) * 0.1;
      if (this.leftClawPivot) this.leftClawPivot.rotation.x = sway;
      if (this.rightClawPivot) this.rightClawPivot.rotation.x = -sway;
    }

    // Check distance to player
    const player = this.game.player;
    if (!player || player.dead) {
      this._wander(dt);
      return;
    }

    const dx = player.mesh.position.x - this.mesh.position.x;
    const dz = player.mesh.position.z - this.mesh.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    const em = this.game.enemyManager;
    if (dist < ENEMY.chaseRange && em && em.zoneUnlocked[this.zoneIndex]) {
      this.state = 'chase';
      this._chase(dt, dx, dz, dist);
    } else {
      this.state = 'wander';
      this._wander(dt);
    }

    // Leg walk animation
    if (this._isMoving) {
      const legSpeed = this.state === 'chase' ? 12 : 8;
      this._walkPhase += dt * legSpeed;
      const s = Math.sin(this._walkPhase);
      if (this.leftLegPivot) this.leftLegPivot.rotation.x = s * 0.6;
      if (this.rightLegPivot) this.rightLegPivot.rotation.x = -s * 0.6;
    } else {
      // Decay to rest
      const decay = Math.exp(-dt * 10);
      if (this.leftLegPivot) this.leftLegPivot.rotation.x *= decay;
      if (this.rightLegPivot) this.rightLegPivot.rotation.x *= decay;
      this._walkPhase = 0;
    }

    // Update HP label
    this._updateStrengthLabel();
  }

  _wander(dt) {
    this.wanderTimer -= dt;
    if (this.wanderTimer <= 0 || !this.wanderTarget) {
      this.wanderTarget = this._randomInZone();
      this.wanderTimer = 2 + Math.random() * 3;
    }

    const dx = this.wanderTarget.x - this.mesh.position.x;
    const dz = this.wanderTarget.z - this.mesh.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.5) {
      this._isMoving = false;
      return;
    }

    this._isMoving = true;
    const speed = ENEMY.wanderSpeed * (this.zone.speedMultiplier || 1) * dt;
    this.mesh.position.x += (dx / dist) * speed;
    this.mesh.position.z += (dz / dist) * speed;
    this.mesh.rotation.y = Math.atan2(dx, dz);
    this._clampToZone();
  }

  _chase(dt, dx, dz, dist) {
    if (dist > 1) {
      this._isMoving = true;
      const speed = ENEMY.chaseSpeed * (this.zone.speedMultiplier || 1) * dt;
      this.mesh.position.x += (dx / dist) * speed;
      this.mesh.position.z += (dz / dist) * speed;
      this.mesh.rotation.y = Math.atan2(dx, dz);
      this._clampToZone();
    } else {
      this._isMoving = false;
    }

    // Attack player if close enough and zone is unlocked
    const em = this.game.enemyManager;
    if (dist < 1.5 && this.attackCooldownTimer <= 0 && em && em.zoneUnlocked[this.zoneIndex]) {
      this.attackCooldownTimer = ENEMY.attackCooldown;
      this._isAttackAnim = true;
      this._attackAnimTimer = 0.3;
      const damage = this.zoneIndex * 2;
      this.game.player.takeDamage(damage);
      if (this.game.audioManager) {
        this.game.audioManager.play('hit');
      }
    }
  }

  _clampToZone() {
    const x = this.mesh.position.x;
    const z = this.mesh.position.z;
    const dist = Math.sqrt(x * x + z * z);
    if (dist < 0.001) return; // at origin — skip to avoid div-by-zero
    const inner = this.zone.innerRadius + 0.5;
    const outer = this.zone.outerRadius - 0.5;

    if (dist < inner) {
      const scale = inner / dist;
      this.mesh.position.x = x * scale;
      this.mesh.position.z = z * scale;
    } else if (dist > outer) {
      const scale = outer / dist;
      this.mesh.position.x = x * scale;
      this.mesh.position.z = z * scale;
    }
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.hp -= amount;
    this._updateStrengthLabel();
    // Flash red
    if (this.bodyMesh) {
      this.bodyMesh.material.emissiveIntensity = 0.8;
      if (this._flashTimeout) clearTimeout(this._flashTimeout);
      this._flashTimeout = setTimeout(() => {
        this._flashTimeout = null;
        if (this.bodyMesh && this.bodyMesh.material) {
          this.bodyMesh.material.emissiveIntensity = 0.15;
        }
      }, 100);
    }
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
    }
  }

  die() {
    this.alive = false;
    this.mesh.visible = false;
    if (this._flashTimeout) {
      clearTimeout(this._flashTimeout);
      this._flashTimeout = null;
    }
    this.respawnTimer = ENEMY.respawnTimeMin + Math.random() * (ENEMY.respawnTimeMax - ENEMY.respawnTimeMin);

    // Death particles
    if (this.game.particleSystem) {
      this.game.particleSystem.burst(
        this.mesh.position.x, this.scale, this.mesh.position.z,
        this.zone.color, 10
      );
    }

    // Screen shake
    this.game.shake(0.2);

    // Heal player 1 HP on kill
    const player = this.game.player;
    if (player && !player.dead) {
      player.hp = Math.min(player.hp + 1, player.maxHp);
    }

    // Notify enemy manager for zone kill tracking
    if (this.game.enemyManager) {
      this.game.enemyManager.onEnemyKilled(this.zoneIndex);
    }

    // Notify pickup manager to drop loot
    if (this.game.pickupManager) {
      this.game.pickupManager.spawnDrop(this.mesh.position.x, this.mesh.position.z, this.maxHp);
    }
  }

  recalculateHp() {
    this.maxHp = getDifficulty().hitsToKill * this.zoneIndex;
    this.hp = this.maxHp;
    this._updateStrengthLabel();
  }

  _respawn() {
    this.alive = true;
    this.recalculateHp();
    this.mesh.visible = true;
    this._placeInZone();
    this._isAttackAnim = false;
    this._attackAnimTimer = 0;
    this._walkPhase = 0;
    this._isMoving = false;
    if (this.leftClawPivot) this.leftClawPivot.rotation.x = 0;
    if (this.rightClawPivot) this.rightClawPivot.rotation.x = 0;
    if (this.leftLegPivot) this.leftLegPivot.rotation.x = 0;
    if (this.rightLegPivot) this.rightLegPivot.rotation.x = 0;
  }
}
