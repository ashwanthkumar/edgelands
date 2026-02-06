import * as THREE from 'three';
import { DROPS } from '../config/constants.js';

export class Pickup {
  constructor(x, z, dropInfo, scene, enemyStrength = 1) {
    this.scene = scene;
    this.type = dropInfo.type;
    this.value = dropInfo.value;
    this.dropColor = dropInfo.color;
    this.enemyStrength = enemyStrength;
    this.alive = true;
    this.lifetime = DROPS.despawnTime;

    this.mesh = new THREE.Group();
    this._buildMesh(dropInfo);
    this.mesh.position.set(x, 0.5, z);
    this.baseY = 0.5;
    this.bobTime = Math.random() * Math.PI * 2;
    scene.add(this.mesh);
  }

  _buildMesh(dropInfo) {
    let geo;
    if (this.type === 'heal') {
      geo = this._createHeartGeometry();
    } else if (this.type === 'points') {
      geo = new THREE.SphereGeometry(0.25, 8, 8);
    } else {
      geo = new THREE.OctahedronGeometry(0.3, 0);
    }

    const mat = new THREE.MeshPhongMaterial({
      color: dropInfo.color,
      emissive: dropInfo.color,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.9,
    });

    this.bodyMesh = new THREE.Mesh(geo, mat);
    this.mesh.add(this.bodyMesh);

    // Glow
    const glowGeo = new THREE.SphereGeometry(0.4, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({
      color: dropInfo.color,
      transparent: true,
      opacity: 0.15,
    });
    this.mesh.add(new THREE.Mesh(glowGeo, glowMat));
  }

  _createHeartGeometry() {
    const shape = new THREE.Shape();
    const s = 0.06;
    shape.moveTo(0, 2 * s);
    shape.bezierCurveTo(0, 3 * s, -5 * s, 5 * s, -5 * s, 2 * s);
    shape.bezierCurveTo(-5 * s, -1 * s, 0, -3 * s, 0, -5 * s);
    shape.bezierCurveTo(0, -3 * s, 5 * s, -1 * s, 5 * s, 2 * s);
    shape.bezierCurveTo(5 * s, 5 * s, 0, 3 * s, 0, 2 * s);

    const extrudeSettings = { depth: 0.1, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }

  update(dt) {
    if (!this.alive) return;

    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      this.destroy();
      return;
    }

    // Bob animation
    this.bobTime += dt * 3;
    this.mesh.position.y = this.baseY + Math.sin(this.bobTime) * 0.15;
    this.bodyMesh.rotation.y += dt * 2;

    // Flash when about to despawn
    if (this.lifetime < 5) {
      this.mesh.visible = Math.floor(this.lifetime * 4) % 2 === 0;
    }
  }

  destroy() {
    this.alive = false;
    this.scene.remove(this.mesh);
  }
}
