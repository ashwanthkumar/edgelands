export class TitleScreen {
  constructor(onStart) {
    this.container = document.getElementById('title-screen');
    this.onStart = onStart;
    this._build();
  }

  _build() {
    this.container.innerHTML = `
      <div class="title-content">
        <h1 class="title-name">EDGELANDS</h1>
        <div class="title-credit">by <a href="https://www.linkedin.com/in/ashwanthkumar/" target="_blank" rel="noopener noreferrer">Ashwanth Kumar</a></div>
        <div class="title-rules">
          <p>WASD to move, Space/Click to attack</p>
          <p>Kill enemies to earn points and upgrade your weapon</p>
          <p>Clear all enemies in a zone to unlock the next</p>
          <p>Your progress is saved &mdash; come back anytime to continue</p>
          <p class="title-warning">But if you die... it's game over. Everything resets.</p>
        </div>
        <button class="title-start-btn">Start Game</button>
      </div>
    `;

    const btn = this.container.querySelector('.title-start-btn');
    const startGame = () => {
      this.hide();
      if (this.onStart) this.onStart();
    };
    btn.addEventListener('click', startGame);
    this._onKeydown = (e) => {
      if (e.key === 'Enter' && this.container.classList.contains('active')) {
        startGame();
      }
    };
    window.addEventListener('keydown', this._onKeydown);
  }

  show() {
    this.container.classList.add('active');
  }

  hide() {
    this.container.classList.add('fade-out');
    setTimeout(() => {
      this.container.classList.remove('active', 'fade-out');
    }, 500);
  }
}
