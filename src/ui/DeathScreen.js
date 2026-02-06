export class DeathScreen {
  constructor(game) {
    this.game = game;
    this.container = document.getElementById('death-screen');
    this.onRespawn = null;
    this.active = false;
  }

  show(onRespawn) {
    this.onRespawn = onRespawn;
    this.active = true;

    const points = this.game.player ? this.game.player.points : 0;
    const weapon = this.game.player ? this.game.player.weapon.name : 'Grass Stick';
    const zone = this.game.player ? this.game.player.getCurrentZone() : 0;

    const shareText = `I scored ${points} points in EDGELANDS and reached zone ${zone}! Can you beat my score?`;
    const shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

    this.container.innerHTML = `
      <div class="death-title">You are out of health</div>
      <div class="death-stats">
        <div class="death-score">${points.toLocaleString()} points</div>
        <div class="death-details">Weapon: ${weapon}</div>
      </div>
      <div class="death-actions">
        <button class="death-share-btn" id="death-share">Share on 𝕏</button>
        <button class="death-play-btn" id="death-play">Play Again</button>
      </div>
    `;

    this.container.classList.add('active');

    document.getElementById('death-share').addEventListener('click', () => {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    });

    document.getElementById('death-play').addEventListener('click', () => {
      this.active = false;
      this.container.classList.remove('active');
      if (this.onRespawn) this.onRespawn();
    });
  }

  update(dt) {
    // No longer auto-countdown — buttons handle it
  }
}
