import * as THREE from 'three';
import { CAMERA } from '../config/constants.js';
import { InputManager } from './InputManager.js';
import { TweenManager } from './TweenManager.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.input = new InputManager();
    this.tweens = new TweenManager();
    this.isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    // Systems registered for update
    this.systems = [];

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Orthographic camera for isometric view
    this._setupCamera();
    this._setupLights();

    // Handle resize
    window.addEventListener('resize', () => this._onResize());

    // Screen shake
    this.shakeIntensity = 0;
    this.shakeDecay = 8;

    // Pause
    this.paused = false;

    // Refs set by main.js
    this.particleSystem = null;
    this.player = null;
    this.worldManager = null;
    this.enemyManager = null;
    this.combatSystem = null;
    this.pickupManager = null;
    this.hud = null;
    this.minimap = null;
    this.deathScreen = null;
    this.audioManager = null;
    this.damageNumbers = null;
  }

  _setupCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    this._frustumSize = this.isMobile ? CAMERA.mobileFrustumSize : CAMERA.frustumSize;
    const size = this._frustumSize;
    this.camera = new THREE.OrthographicCamera(
      -size * aspect / 2, size * aspect / 2,
      size / 2, -size / 2,
      0.1, 500
    );
    this.camera.position.set(CAMERA.offsetX, CAMERA.offsetY, CAMERA.offsetZ);
    this.camera.lookAt(0, 0, 0);
  }

  _setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(30, 50, 20);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 200;
    const s = 40;
    this.directionalLight.shadow.camera.left = -s;
    this.directionalLight.shadow.camera.right = s;
    this.directionalLight.shadow.camera.top = s;
    this.directionalLight.shadow.camera.bottom = -s;
    this.scene.add(this.directionalLight);
    this.scene.add(this.directionalLight.target);
  }

  _onResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const size = this._frustumSize;
    this.camera.left = -size * aspect / 2;
    this.camera.right = size * aspect / 2;
    this.camera.top = size / 2;
    this.camera.bottom = -size / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  addSystem(system) {
    this.systems.push(system);
  }

  shake(intensity = 0.3) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  start() {
    this._running = true;
    this._animate();
  }

  _animate() {
    requestAnimationFrame(() => this._animate());
    const dt = Math.min(this.clock.getDelta(), 0.05); // cap delta

    if (this.paused) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    // Update all systems (tweens included inside pause guard)
    this.tweens.update(dt);
    for (const system of this.systems) {
      system.update(dt);
    }

    // Camera follow player
    if (this.player && this.player.mesh) {
      const px = this.player.mesh.position.x;
      const pz = this.player.mesh.position.z;
      this.camera.position.set(
        px + CAMERA.offsetX,
        CAMERA.offsetY,
        pz + CAMERA.offsetZ
      );
      this.camera.lookAt(px, 0, pz);

      // Screen shake
      if (this.shakeIntensity > 0.01) {
        this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
        this.camera.position.z += (Math.random() - 0.5) * this.shakeIntensity;
        this.shakeIntensity *= Math.exp(-this.shakeDecay * dt);
      }

      // Shadow light follows player
      this.directionalLight.position.set(px + 30, 50, pz + 20);
      this.directionalLight.target.position.set(px, 0, pz);
    }

    this.renderer.render(this.scene, this.camera);
  }
}
