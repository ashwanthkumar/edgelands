import * as THREE from 'three';
import { ZoneManager } from '../config/constants.js';
import { TerrainBuilder } from './TerrainBuilder.js';
import { Decorations } from './Decorations.js';

export class WorldManager {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;

    // Background / fog
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.Fog(0x1a1a2e, 150, 400);

    // Build terrain
    this.terrain = new TerrainBuilder(this.scene);
    this.terrain.build();

    // Build decorations
    this.decorations = new Decorations(this.scene);
    this.decorations.build();

    // Dynamic boundary ring (updated as world expands)
    this._boundaryRadius = 0;
    this._addBoundary();
  }

  _addBoundary() {
    if (this.boundaryMesh) {
      this.scene.remove(this.boundaryMesh);
      this.boundaryMesh.geometry.dispose();
      this.boundaryMesh.material.dispose();
    }
    const maxR = ZoneManager.getMaxRadius();
    this._boundaryRadius = maxR;
    const geo = new THREE.RingGeometry(maxR - 0.5, maxR + 0.5, 64);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    this.boundaryMesh = new THREE.Mesh(geo, mat);
    this.boundaryMesh.position.y = 0.1;
    this.scene.add(this.boundaryMesh);
  }

  update(dt) {
    // Check if world expanded and update boundary
    const maxR = ZoneManager.getMaxRadius();
    if (Math.abs(maxR - this._boundaryRadius) > 10) {
      this._addBoundary();
      this.scene.fog.far = Math.max(400, maxR + 100);
    }
  }
}
