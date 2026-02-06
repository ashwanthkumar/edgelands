import * as THREE from 'three';

export class DamageNumbers {
  constructor(game) {
    this.game = game;
    this.container = document.getElementById('ui-overlay');
  }

  spawn(worldX, worldY, worldZ, amount, color = 0xffff44) {
    const pos = new THREE.Vector3(worldX, worldY, worldZ);
    pos.project(this.game.camera);

    const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-pos.y * 0.5 + 0.5) * window.innerHeight;

    const el = document.createElement('div');
    el.className = 'damage-number';
    el.textContent = this._formatNumber(amount);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.color = `#${color.toString(16).padStart(6, '0')}`;

    // Scale font size for bigger numbers
    const fontSize = Math.min(14 + Math.log10(amount + 1) * 6, 32);
    el.style.fontSize = `${fontSize}px`;

    this.container.appendChild(el);

    // Remove after animation
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 800);
  }

  spawnText(worldX, worldY, worldZ, text, color = 0x44ff44) {
    const pos = new THREE.Vector3(worldX, worldY, worldZ);
    pos.project(this.game.camera);

    const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-pos.y * 0.5 + 0.5) * window.innerHeight;

    const el = document.createElement('div');
    el.className = 'damage-number';
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.color = `#${color.toString(16).padStart(6, '0')}`;
    el.style.fontSize = '18px';

    this.container.appendChild(el);

    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 800);
  }

  _formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
  }

  update(dt) {}
}
