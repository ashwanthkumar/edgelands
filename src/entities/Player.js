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

    // Animation state
    this._walkPhase = 0;
    this._idlePhase = 0;
    this._isMoving = false;

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

    // --- Legs with pivot joints at hips ---
    const legGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.3, 6);

    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.09, 0.30, 0); // hip joint
    const legL = new THREE.Mesh(legGeo, pantsMat);
    legL.position.set(0, -0.15, 0); // hangs down from pivot
    this.leftLegPivot.add(legL);
    this.bodyMesh.add(this.leftLegPivot);

    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.09, 0.30, 0); // hip joint
    const legR = new THREE.Mesh(legGeo, pantsMat);
    legR.position.set(0, -0.15, 0);
    this.rightLegPivot.add(legR);
    this.bodyMesh.add(this.rightLegPivot);

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

    // --- Arms with pivot joints at shoulders ---
    const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.35, 6);

    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.24, 0.65, 0); // shoulder
    const armL = new THREE.Mesh(armGeo, skinMat);
    armL.position.set(0, -0.175, 0); // hangs down from shoulder
    this.leftArmPivot.add(armL);
    this.bodyMesh.add(this.leftArmPivot);

    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.24, 0.65, 0); // shoulder
    const armR = new THREE.Mesh(armGeo, skinMat);
    armR.position.set(0, -0.175, 0);
    this.rightArmPivot.add(armR);

    // Hand anchor at end of right arm for weapon
    this.handAnchor = new THREE.Group();
    this.handAnchor.position.set(0, -0.35, 0); // end of arm
    this.rightArmPivot.add(this.handAnchor);

    this.bodyMesh.add(this.rightArmPivot);

    // Cape (behind torso)
    const capeGeo = new THREE.BoxGeometry(0.3, 0.35, 0.02);
    this.capeMesh = new THREE.Mesh(capeGeo, capeMat);
    this.capeMesh.position.set(0, 0.48, 0.12);
    this.bodyMesh.add(this.capeMesh);

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

    // HP number label above head
    this._hpLabelCanvas = document.createElement('canvas');
    this._hpLabelCanvas.width = 64;
    this._hpLabelCanvas.height = 32;
    this._hpLabelCtx = this._hpLabelCanvas.getContext('2d');
    this._hpLabelTexture = new THREE.CanvasTexture(this._hpLabelCanvas);
    const hpLabelMat = new THREE.SpriteMaterial({
      map: this._hpLabelTexture,
      transparent: true,
      depthTest: false,
    });
    this.hpLabelSprite = new THREE.Sprite(hpLabelMat);
    this.hpLabelSprite.position.y = 1.45;
    this.hpLabelSprite.scale.set(0.8, 0.4, 1);
    this.bodyMesh.add(this.hpLabelSprite);
    this._updateHpLabel();

    this.bodyMesh.castShadow = true;
    this.mesh.add(this.bodyMesh);
  }

  _updateHpLabel() {
    const ctx = this._hpLabelCtx;
    ctx.clearRect(0, 0, 64, 32);
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(Math.round(this.hp)), 32, 16);
    this._hpLabelTexture.needsUpdate = true;
  }

  _buildWeaponMesh() {
    if (this.weaponMesh && this.weaponMesh.parent) {
      this.weaponMesh.parent.remove(this.weaponMesh);
    }
    this.weaponMesh = WeaponFactory.createWeaponMesh(this.weaponIndex);
    this.weaponMesh.position.set(0, 0.15, -0.05); // grip at hand, blade up/forward
    this.weaponMesh.rotation.x = -_PI / 6; // forward tilt for isometric readability
    this.handAnchor.add(this.weaponMesh);
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

    // Update HP label
    this._updateHpLabel();

    // Attack cooldown
    if (this.attackCooldownTimer > 0) {
      this.attackCooldownTimer -= dt;
    }

    // Attack animation
    if (this.isAttacking) {
      this.attackAnimTimer -= dt;
      const t = 1 - (this.attackAnimTimer / 0.3);
      // Arm swing: raised back (+0.8) through swept forward (-1.0)
      this.rightArmPivot.rotation.x = 0.8 - t * 1.8;
      // Cross-body sweep
      this.rightArmPivot.rotation.z = Math.sin(t * _PI) * -0.3;
      // Wrist flick for flair
      this.weaponMesh.rotation.z = Math.sin(t * _PI) * 0.4;
      // Slash arc visual
      if (this.slashArc) {
        this.slashArc.visible = true;
        this.slashArc.rotation.z = -t * _PI;
        this.slashArc.material.opacity = Math.sin(t * _PI) * 0.4;
        this.slashArc.material.color.setHex(this.weapon.color);
      }
      // Subtle body lean (arm provides most feedback now)
      this.bodyMesh.rotation.y = Math.sin(t * _PI) * 0.1;
      this.bodyMesh.rotation.z = Math.sin(t * _PI) * 0.05;
      if (this.attackAnimTimer <= 0) {
        this.isAttacking = false;
        this.rightArmPivot.rotation.x = 0;
        this.rightArmPivot.rotation.z = 0;
        this.weaponMesh.rotation.x = -_PI / 6; // restore forward tilt
        this.weaponMesh.rotation.z = 0;
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
      if (dist >= worldMax && dist > 0.001) {
        const clamp = worldMax / dist;
        newX = newX * clamp;
        newZ = newZ * clamp;
        dist = worldMax;
      }

      // Zone gating: clamp to max unlocked zone's outer radius
      if (this.game.enemyManager && dist > 0.001) {
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
      this._isMoving = true;
    } else {
      this._isMoving = false;
    }

    // Walk cycle animation
    if (this._isMoving) {
      this._walkPhase += dt * 10;
      const s = Math.sin(this._walkPhase);
      // Leg swing
      this.leftLegPivot.rotation.x = s * 0.5;
      this.rightLegPivot.rotation.x = -s * 0.5;
      // Arm swing opposite to legs (natural gait), skip right arm during attack
      this.leftArmPivot.rotation.x = -s * 0.35;
      if (!this.isAttacking) {
        this.rightArmPivot.rotation.x = s * 0.35;
      }
      // Reset idle phase and body bob
      this._idlePhase = 0;
      this.bodyMesh.position.y = 0;
    } else {
      // Decay limbs to rest when stopping
      const decay = Math.exp(-dt * 12);
      this.leftLegPivot.rotation.x *= decay;
      this.rightLegPivot.rotation.x *= decay;
      this.leftArmPivot.rotation.x *= decay;
      if (!this.isAttacking) {
        this.rightArmPivot.rotation.x *= decay;
      }
      this._walkPhase = 0;

      // Idle animation (breathing bob + subtle arm drift)
      this._idlePhase += dt;
      this.bodyMesh.position.y = Math.sin(this._idlePhase * 2) * 0.02;
      const armDrift = Math.sin(this._idlePhase * 1.5) * 0.05;
      this.leftArmPivot.rotation.x += armDrift;
      if (!this.isAttacking) {
        this.rightArmPivot.rotation.x += armDrift;
      }
      // Cape flutter
      if (this.capeMesh) {
        this.capeMesh.rotation.x = Math.sin(this._idlePhase * 2.5) * 0.04;
      }
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

    // Reset animation state
    this._walkPhase = 0;
    this._idlePhase = 0;
    this._isMoving = false;
    this.leftLegPivot.rotation.x = 0;
    this.rightLegPivot.rotation.x = 0;
    this.leftArmPivot.rotation.x = 0;
    this.rightArmPivot.rotation.x = 0;
    this.rightArmPivot.rotation.z = 0;
    this.bodyMesh.position.y = 0;
    this.bodyMesh.rotation.y = 0;
    this.bodyMesh.rotation.z = 0;

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
