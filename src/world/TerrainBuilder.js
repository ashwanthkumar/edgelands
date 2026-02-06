import * as THREE from 'three';
import { BASE_ZONES } from '../config/constants.js';

export class TerrainBuilder {
  constructor(scene) {
    this.scene = scene;
    this.rings = [];
  }

  build() {
    for (let i = 0; i < BASE_ZONES.length; i++) {
      const zone = BASE_ZONES[i];
      const ring = this._createRing(zone, i);
      this.rings.push(ring);
      this.scene.add(ring);
    }

    // Safe zone ring at Sanctuary outer edge
    this._addSafeZoneRing();
  }

  _addSafeZoneRing() {
    const geo = new THREE.RingGeometry(14.8, 15.2, 64);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x88ffaa,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    this.scene.add(ring);
  }

  addZoneRing(zone, index) {
    const ring = this._createRing(zone, index);
    this.rings.push(ring);
    this.scene.add(ring);
  }

  _createRing(zone, index) {
    const { innerRadius, outerRadius, color } = zone;
    const inner = Math.max(innerRadius, 0.1);
    const segments = 64;

    const geo = new THREE.RingGeometry(inner, outerRadius, segments, 1);
    // Rotate to lie flat on XZ plane
    geo.rotateX(-Math.PI / 2);

    // Add vertex displacement for organic look
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Small height variation
      const noise = Math.sin(x * 0.5 + index) * Math.cos(z * 0.5 + index) * 0.15;
      pos.setY(i, noise);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshLambertMaterial({
      color,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    return mesh;
  }
}
