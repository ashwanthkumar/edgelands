import * as THREE from 'three';
import { PLAYER, WEAPONS, ZoneManager, getDifficulty, getDifficultyKey, setDifficulty } from '../config/constants.js';
import { WeaponFactory } from '../combat/WeaponFactory.js';

const _PI = Math.PI;

export class Player {
  constructor(game) {
    this.game = game;
    this.points = PLAYER.startPoints;
    this.maxHp = WEAPONS[0].maxHp;
    this.hp = this.maxHp;
    this.dead = false;
    this.invulnerable = false;
    this.invulnerableTimer = 0;
    this.attackCooldownTimer = 0;
    this.isAttacking = false;
    this.attackAnimTimer = 0;
    this.facing = new THREE.Vector3(0, 0, -1); // default facing direction

    // Zone gating
    this._zoneBlockedCooldown = 0;

    // Safe zone regen
    this._regenTimer = 0;

    // Current weapon
    this.weaponIndex = 0;
    this.weapon = WEAPONS[0];

    // Build mesh
    this.mesh = new THREE.Group();
    this._buildBody();
    this._buildWeaponMesh();
    this._createSlashArc();
    this.mesh.position.set(0, 0, 0);
    game.scene.add(this.mesh);
  }

  _buildBody() {
    this.bodyMesh = new THREE.Group();

    // Materials
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xf4c28a });
    const tunicMat = new THREE.MeshLambertMaterial({ color: 0x2d6e3f });
    const beltMat = new THREE.MeshLambertMaterial({ color: 0x6b3a2a });
    const pantsMat = new THREE.MeshLambertMaterial({ color: 0x5c3a1e });
    const hatMat = new THREE.MeshLambertMaterial({ color: 0x1a4d2e });
    const capeMat = new THREE.MeshLambertMaterial({ color: 0x3b1a1a });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x222222 });

    // Legs (two cylinders)
    const legGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.3, 6);
    const legL = new THREE.Mesh(legGeo, pantsMat);
    legL.position.set(-0.09, 0.15, 0);
    this.bodyMesh.add(legL);
    const legR = new THREE.Mesh(legGeo, pantsMat);
    legR.position.set(0.09, 0.15, 0);
    this.bodyMesh.add(legR);

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.35, 0.4, 0.2);
    const torso = new THREE.Mesh(torsoGeo, tunicMat);
    torso.position.y = 0.5;
    this.bodyMesh.add(torso);

    // Belt
    const beltGeo = new THREE.BoxGeometry(0.37, 0.06, 0.22);
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.y = 0.32;
    this.bodyMesh.add(belt);

    // Arms (two cylinders)
    const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.35, 6);
    const armL = new THREE.Mesh(armGeo, skinMat);
    armL.position.set(-0.24, 0.48, 0);
    this.bodyMesh.add(armL);
    const armR = new THREE.Mesh(armGeo, skinMat);
    armR.position.set(0.24, 0.48, 0);
    this.bodyMesh.add(armR);

    // Cape (behind torso)
    const capeGeo = new THREE.BoxGeometry(0.3, 0.35, 0.02);
    const cape = new THREE.Mesh(capeGeo, capeMat);
    cape.position.set(0, 0.48, 0.12);
    this.bodyMesh.add(cape);

    // Head
    const headGeo = new THREE.SphereGeometry(0.18, 8, 6);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 0.88;
    this.bodyMesh.add(head);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.08, 0.9, -0.15);
    this.bodyMesh.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.08, 0.9, -0.15);
    this.bodyMesh.add(eyeR);

    // Hat / hood (cone)
    const hatGeo = new THREE.ConeGeometry(0.22, 0.3, 6);
    const hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.y = 1.15;
    this.bodyMesh.add(hat);

    this.bodyMesh.castShadow = true;
    this.mesh.add(this.bodyMesh);
  }

  _buildWeaponMesh() {
    if (this.weaponMesh) this.mesh.remove(this.weaponMesh);
    this.weaponMesh = WeaponFactory.createWeaponMesh(this.weaponIndex);
    this.weaponMesh.position.set(0.5, PLAYER.size * 1.5, -0.3);
    this.mesh.add(this.weaponMesh);
  }

  _createSlashArc() {
    const geo = new THREE.RingGeometry(1.0, 2.5, 16, 1, 0, _PI);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.slashArc = new THREE.Mesh(geo, mat);
    this.slashArc.position.y = 0.8;
    this.slashArc.rotation.x = -_PI / 2; // flat on XZ plane
    this.slashArc.visible = false;
    this.mesh.add(this.slashArc);
  }

  update(dt) {
    if (this.dead) return;

    // Invulnerability timer
    if (this.invulnerable) {
      this.invulnerableTimer -= dt;
      // Flash effect
      this.bodyMesh.visible = Math.floor(this.invulnerableTimer * 10) % 2 === 0;
      if (this.invulnerableTimer <= 0) {
        this.invulnerable = false;
        this.bodyMesh.visible = true;
      }
    }

    // Attack cooldown
    if (this.attackCooldownTimer > 0) {
      this.attackCooldownTimer -= dt;
    }

    // Attack animation
    if (this.isAttacking) {
      this.attackAnimTimer -= dt;
      const t = 1 - (this.attackAnimTimer / 0.3);
      // Swing weapon in an arc
      this.weaponMesh.rotation.y = -_PI * 0.5 + Math.sin(t * _PI) * _PI;
      // Slash arc visual
      if (this.slashArc) {
        this.slashArc.visible = true;
        this.slashArc.rotation.z = -t * _PI;
        this.slashArc.material.opacity = Math.sin(t * _PI) * 0.4;
        this.slashArc.material.color.setHex(this.weapon.color);
      }
      // Body lean into swing
      this.bodyMesh.rotation.y = Math.sin(t * _PI) * 0.2;
      this.bodyMesh.rotation.z = Math.sin(t * _PI) * 0.1;
      if (this.attackAnimTimer <= 0) {
        this.isAttacking = false;
        this.weaponMesh.rotation.y = 0;
        this.bodyMesh.rotation.y = 0;
        this.bodyMesh.rotation.z = 0;
        if (this.slashArc) {
          this.slashArc.visible = false;
          this.slashArc.material.opacity = 0;
        }
      }
    }

    // Zone blocked cooldown
    this._zoneBlockedCooldown -= dt;

    // Safe zone HP regen
    if (this.getCurrentZone() === 0 && this.hp < this.maxHp) {
      this._regenTimer += dt;
      if (this._regenTimer >= 1) {
        this._regenTimer -= 1;
        this.hp = Math.min(this.hp + 1, this.maxHp);
        // Heal VFX: ring of rising particles
        if (this.game.particleSystem) {
          const px = this.mesh.position.x;
          const pz = this.mesh.position.z;
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            this.game.particleSystem.healBurst(
              px + Math.cos(a) * 0.8, 0.3, pz + Math.sin(a) * 0.8
            );
          }
        }
        // Floating +1 text
        if (this.game.damageNumbers) {
          this.game.damageNumbers.spawnText(
            this.mesh.position.x, 2.5, this.mesh.position.z,
            '+1', 0xff4444
          );
        }
      }
    } else {
      this._regenTimer = 0;
    }

    // Movement
    const move = this.game.input.getMovement();
    if (move.x !== 0 || move.z !== 0) {
      const speed = PLAYER.speed * dt;
      let newX = this.mesh.position.x + move.x * speed;
      let newZ = this.mesh.position.z + move.z * speed;

      // Clamp to max generated zone boundary
      let dist = Math.sqrt(newX * newX + newZ * newZ);
      const worldMax = ZoneManager.getMaxRadius();
      if (dist >= worldMax) {
        const clamp = worldMax / dist;
        newX = newX * clamp;
        newZ = newZ * clamp;
        dist = worldMax;
      }

      // Zone gating: clamp to max unlocked zone's outer radius
      if (this.game.enemyManager) {
        const maxUnlocked = this.game.enemyManager.getMaxUnlockedZone();
        const maxRadius = ZoneManager.getZone(maxUnlocked).outerRadius;
        if (dist > maxRadius) {
          const clamp = maxRadius / dist;
          newX = newX * clamp;
          newZ = newZ * clamp;
          // Feedback when blocked
          if (this._zoneBlockedCooldown <= 0) {
            this.game.shake(0.05);
            if (this.game.audioManager) {
              this.game.audioManager.play('zoneBlocked');
            }
            this._zoneBlockedCooldown = 0.5;
          }
        }
      }

      this.mesh.position.x = newX;
      this.mesh.position.z = newZ;

      // Update facing direction
      this.facing.set(move.x, 0, move.z).normalize();
      // Rotate mesh to face movement direction
      const angle = Math.atan2(move.x, move.z);
      this.mesh.rotation.y = angle + Math.PI;
    }

    // Attack input
    if (this.game.input.consumeAttack() && this.attackCooldownTimer <= 0) {
      this.attack();
    }
  }

  attack() {
    this.attackCooldownTimer = PLAYER.attackCooldown;
    this.isAttacking = true;
    this.attackAnimTimer = 0.3;
    // Combat system handles the actual hit detection
    if (this.game.combatSystem) {
      this.game.combatSystem.playerAttack();
    }
    if (this.game.audioManager) {
      this.game.audioManager.play('swing');
    }
  }

  takeDamage(amount) {
    if (this.dead || this.invulnerable) return;
    this.hp -= amount;
    this.game.shake(0.15);
    if (this.game.damageNumbers) {
      this.game.damageNumbers.spawn(
        this.mesh.position.x, this.mesh.position.y + 2, this.mesh.position.z,
        Math.round(amount), 0xff4444
      );
    }
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
    }
  }

  die() {
    this.dead = true;
    this.bodyMesh.visible = false;
    this.weaponMesh.visible = false;
    if (this.game.audioManager) {
      this.game.audioManager.play('death');
    }
    if (this.game.deathScreen) {
      this.game.deathScreen.show(() => {
        if (this.game.titleScreen) {
          this.game.titleScreen.show();
        } else {
          this.respawn();
        }
      });
    }
  }

  respawn() {
    // Full reset on death
    this.points = PLAYER.startPoints;
    this.weaponIndex = 0;
    this.weapon = WEAPONS[0];
    this.maxHp = WEAPONS[0].maxHp;
    this.hp = this.maxHp;
    this._buildWeaponMesh();

    this.mesh.position.set(0, 0, 0);
    this.dead = false;
    this.bodyMesh.visible = true;
    this.weaponMesh.visible = true;
    this.invulnerable = true;
    this.invulnerableTimer = PLAYER.respawnInvulnerability;

    // Clear saved progress
    try {
      localStorage.removeItem('edgelands_save');
    } catch (e) { /* ignore */ }

    // Reset enemy/zone progress
    if (this.game.enemyManager) {
      this.game.enemyManager.reset();
    }
  }

  addPoints(amount) {
    this.points += amount;
    this.save();
  }

  multiplyPoints(multiplier) {
    this.points = Math.floor(this.points * multiplier);
    this.save();
  }

  upgradeWeapon() {
    if (this.weaponIndex >= WEAPONS.length - 1) return;
    this.weaponIndex++;
    this.weapon = WEAPONS[this.weaponIndex];
    this.maxHp = this.weapon.maxHp;
    this.hp = this.maxHp;
    this._buildWeaponMesh();
    if (this.game.audioManager) {
      this.game.audioManager.play('levelup');
    }
  }

  getDamage() {
    return this.weaponIndex + 1;
  }

  getCurrentZone() {
    const dist = Math.sqrt(
      this.mesh.position.x ** 2 + this.mesh.position.z ** 2
    );
    return ZoneManager.getZoneForRadius(dist);
  }

  save() {
    const data = {
      points: this.points,
      weaponIndex: this.weaponIndex,
      difficulty: getDifficultyKey(),
    };
    try {
      localStorage.setItem('edgelands_save', JSON.stringify(data));
    } catch (e) { /* ignore */ }
  }

  load() {
    try {
      const raw = localStorage.getItem('edgelands_save');
      if (!raw) return;
      const data = JSON.parse(raw);
      // Backward compat: support old 'strength' key
      this.points = data.points || data.strength || PLAYER.startPoints;
      this.weaponIndex = data.weaponIndex || 0;
      if (data.difficulty) {
        setDifficulty(data.difficulty);
      }
      this.weapon = WEAPONS[this.weaponIndex];
      this.maxHp = this.weapon.maxHp;
      this.hp = this.maxHp;
      this._buildWeaponMesh();
    } catch (e) { /* ignore */ }
  }
}
