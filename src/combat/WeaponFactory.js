import * as THREE from 'three';
import { WEAPONS } from '../config/constants.js';

export class WeaponFactory {
  static createWeaponMesh(weaponIndex) {
    const w = WEAPONS[weaponIndex];
    const group = new THREE.Group();

    // Handle - always brown
    const handleGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.4, 6);
    const handleMat = new THREE.MeshLambertMaterial({ color: 0x8b5e3c });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.y = -0.15;
    group.add(handle);

    // Blade scales with weapon tier
    const bladeLength = 0.5 + weaponIndex * 0.12;
    const bladeWidth = 0.08 + weaponIndex * 0.01;

    const bladeGeo = new THREE.BoxGeometry(bladeWidth, bladeLength, 0.03);
    const bladeMat = new THREE.MeshPhongMaterial({
      color: w.color,
      emissive: w.color,
      emissiveIntensity: weaponIndex >= 5 ? 0.3 : 0.05,
      shininess: 60 + weaponIndex * 15,
    });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.y = bladeLength / 2 + 0.05;
    group.add(blade);

    // Guard / crosspiece for swords (index >= 2)
    if (weaponIndex >= 2) {
      const guardGeo = new THREE.BoxGeometry(0.2 + weaponIndex * 0.02, 0.04, 0.04);
      const guardMat = new THREE.MeshLambertMaterial({ color: w.color });
      const guard = new THREE.Mesh(guardGeo, guardMat);
      guard.position.y = 0.05;
      group.add(guard);
    }

    // Glow effect for legendary+
    if (weaponIndex >= 6) {
      const glowGeo = new THREE.SphereGeometry(bladeLength * 0.4, 8, 8);
      const glowMat = new THREE.MeshBasicMaterial({
        color: w.color,
        transparent: true,
        opacity: 0.15,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.y = bladeLength / 2;
      group.add(glow);
    }

    group.castShadow = true;
    return group;
  }
}
