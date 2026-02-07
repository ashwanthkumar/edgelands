import * as THREE from 'three';

class Particle {
  constructor(mesh, velocity, lifetime) {
    this.mesh = mesh;
    this.velocity = velocity;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
  }

  update(dt) {
    this.lifetime -= dt;
    this.mesh.position.x += this.velocity.x * dt;
    this.mesh.position.y += this.velocity.y * dt;
    this.mesh.position.z += this.velocity.z * dt;
    if (!this._noGravity) this.velocity.y -= 9.8 * dt; // gravity

    const t = this.lifetime / this.maxLifetime;
    this.mesh.scale.setScalar(t);
    if (this.mesh.material) {
      this.mesh.material.opacity = t;
    }
    return this.lifetime > 0;
  }
}

export class ParticleSystem {
  constructor(game) {
    this.game = game;
    this.particles = [];
  }

  burst(x, y, z, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.08, 4, 4);
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      this.game.scene.add(mesh);

      const speed = 2 + Math.random() * 4;
      const angle = Math.random() * Math.PI * 2;
      const upSpeed = 2 + Math.random() * 3;
      const velocity = {
        x: Math.cos(angle) * speed,
        y: upSpeed,
        z: Math.sin(angle) * speed,
      };

      this.particles.push(new Particle(mesh, velocity, 0.6 + Math.random() * 0.4));
    }
  }

  healBurst(x, y, z) {
    const geo = new THREE.SphereGeometry(0.06, 4, 4);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x44ff66,
      transparent: true,
      opacity: 1,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    this.game.scene.add(mesh);

    const velocity = { x: 0, y: 1.5 + Math.random() * 0.5, z: 0 };
    const p = new Particle(mesh, velocity, 0.8 + Math.random() * 0.3);
    p._noGravity = true;
    this.particles.push(p);
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const alive = this.particles[i].update(dt);
      if (!alive) {
        const mesh = this.particles[i].mesh;
        this.game.scene.remove(mesh);
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
        this.particles.splice(i, 1);
      }
    }
  }
}
