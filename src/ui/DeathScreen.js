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

    const gameUrl = 'https://ashwanthkumar.github.io/edgelands/';
    const shareText = `I scored ${points} points in EDGELANDS and reached zone ${zone}! Can you beat my score?\n\n${gameUrl}`;
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

    const share = () => {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    };
    const playAgain = () => {
      this._removeKeyListener();
      this.active = false;
      this.container.classList.remove('active');
      if (this.onRespawn) this.onRespawn();
    };

    document.getElementById('death-share').addEventListener('click', share, { once: true });
    document.getElementById('death-play').addEventListener('click', playAgain, { once: true });

    this._removeKeyListener();
    this._deathKeydown = (e) => {
      if (!this.active) return;
      if (e.key === 'x' || e.key === 'X') {
        share();
      } else if (e.key === 'Enter') {
        playAgain();
      }
    };
    window.addEventListener('keydown', this._deathKeydown);
  }

  _removeKeyListener() {
    if (this._deathKeydown) {
      window.removeEventListener('keydown', this._deathKeydown);
      this._deathKeydown = null;
    }
  }

  update(dt) {
    // No longer auto-countdown — buttons handle it
  }
}
