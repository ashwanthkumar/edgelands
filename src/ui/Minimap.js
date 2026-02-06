import { ZoneManager } from '../config/constants.js';

export class Minimap {
  constructor(game) {
    this.game = game;
    const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    this.size = isMobile ? 110 : 160;

    const container = document.getElementById('minimap-container');
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'minimap-canvas';
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
  }

  update(dt) {
    const ctx = this.ctx;
    const s = this.size;
    const center = s / 2;

    ctx.clearRect(0, 0, s, s);

    // Compute scale based on current max generated radius
    const maxRadius = ZoneManager.getMaxRadius();
    const scale = s / (maxRadius * 2);

    // Draw zone rings
    const zoneCount = ZoneManager.getZoneCount();
    for (let i = zoneCount - 1; i >= 0; i--) {
      const zone = ZoneManager.getZone(i);
      const outerR = zone.outerRadius * scale;
      ctx.beginPath();
      ctx.arc(center, center, outerR, 0, Math.PI * 2);
      const color = typeof zone.color === 'number'
        ? `#${zone.color.toString(16).padStart(6, '0')}`
        : `#${zone.color}`;
      ctx.fillStyle = color;
      ctx.fill();
    }

    // Draw enemy dots
    if (this.game.enemyManager) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
      const enemies = this.game.enemyManager.enemies;
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (!e.alive) continue;
        const ex = center + e.mesh.position.x * scale;
        const ez = center + e.mesh.position.z * scale;
        ctx.fillRect(ex - 0.5, ez - 0.5, 1, 1);
      }
    }

    // Draw player dot
    const player = this.game.player;
    if (player) {
      const px = center + player.mesh.position.x * scale;
      const pz = center + player.mesh.position.z * scale;
      ctx.fillStyle = '#3399ff';
      ctx.beginPath();
      ctx.arc(px, pz, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}
