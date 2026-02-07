export class ZoneClearOverlay {
  constructor() {
    this.container = document.getElementById('zone-clear-overlay');
  }

  show(clearedZoneName, nextZoneName) {
    // Build confetti particles
    let confettiHTML = '';
    const colors = ['#ff4444', '#44ff44', '#4488ff', '#ffd700', '#ff44ff', '#44ffff', '#ff8800', '#ffffff'];
    for (let i = 0; i < 60; i++) {
      const color = colors[i % colors.length];
      const left = Math.random() * 100;
      const delay = Math.random() * 0.6;
      const size = 6 + Math.random() * 6;
      const drift = (Math.random() - 0.5) * 200;
      confettiHTML += `<div class="confetti-piece" style="left:${left}%;background:${color};animation-delay:${delay}s;width:${size}px;height:${size * 2.5}px;--drift:${drift}px"></div>`;
    }

    this.container.innerHTML = `
      <div class="confetti-container">${confettiHTML}</div>
      <div class="zone-clear-content">
        <div class="zone-clear-title">ZONE CLEARED</div>
        <div class="zone-clear-zone">${clearedZoneName}</div>
        <div class="zone-clear-next">${nextZoneName} is now available</div>
      </div>
    `;

    this.container.classList.add('active');

    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.container.classList.add('fade-out');
      setTimeout(() => {
        this.container.classList.remove('active', 'fade-out');
      }, 500);
    }, 3000);
  }
}
