import { DIFFICULTY, getDifficultyKey, setDifficulty } from '../config/constants.js';

export class TitleScreen {
  constructor(onStart) {
    this.container = document.getElementById('title-screen');
    this.onStart = onStart;
    this._selectedDifficulty = getDifficultyKey();
    this._build();
  }

  _build() {
    this.container.innerHTML = `
      <div class="title-content">
        <h1 class="title-name">EDGELANDS</h1>
        <div class="title-credit">by <a href="https://www.linkedin.com/in/ashwanthkumar/" target="_blank" rel="noopener noreferrer">Ashwanth Kumar</a></div>
        <div class="title-rules">
          <p>WASD to move, Space/Click to attack</p>
          <p>Clear all enemies in a zone to upgrade your weapon</p>
          <p>Each enemy takes <span id="title-hits-count">${DIFFICULTY[this._selectedDifficulty].hitsToKill}</span> hits to kill</p>
          <p>Your progress is saved &mdash; come back anytime to continue</p>
          <p class="title-warning">But if you die... it's game over. Everything resets.</p>
        </div>
        <div class="difficulty-selector">
          <button class="difficulty-btn${this._selectedDifficulty === 'easy' ? ' selected' : ''}" data-difficulty="easy"><u>E</u>asy</button>
          <button class="difficulty-btn${this._selectedDifficulty === 'medium' ? ' selected' : ''}" data-difficulty="medium"><u>M</u>edium</button>
          <button class="difficulty-btn${this._selectedDifficulty === 'hard' ? ' selected' : ''}" data-difficulty="hard"><u>H</u>ard</button>
        </div>
        <button class="title-start-btn">Start Game</button>
      </div>
    `;

    this.hitsCountEl = document.getElementById('title-hits-count');

    // Difficulty buttons
    const diffBtns = this.container.querySelectorAll('.difficulty-btn');
    diffBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.difficulty;
        this._selectedDifficulty = key;
        setDifficulty(key);
        diffBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.hitsCountEl.textContent = DIFFICULTY[key].hitsToKill;
      });
    });

    const startBtn = this.container.querySelector('.title-start-btn');
    const startGame = () => {
      this.hide();
      if (this.onStart) this.onStart();
    };
    startBtn.addEventListener('click', startGame);
    const keyToDifficulty = { e: 'easy', m: 'medium', h: 'hard' };
    this._onKeydown = (e) => {
      if (!this.container.classList.contains('active')) return;
      if (e.key === 'Enter') {
        startGame();
      } else if (keyToDifficulty[e.key]) {
        const key = keyToDifficulty[e.key];
        this._selectedDifficulty = key;
        setDifficulty(key);
        diffBtns.forEach(b => b.classList.remove('selected'));
        this.container.querySelector(`.difficulty-btn[data-difficulty="${key}"]`).classList.add('selected');
        this.hitsCountEl.textContent = DIFFICULTY[key].hitsToKill;
      }
    };
    window.addEventListener('keydown', this._onKeydown);
  }

  show() {
    // Sync difficulty selection with current state (e.g. after load)
    this._selectedDifficulty = getDifficultyKey();
    const diffBtns = this.container.querySelectorAll('.difficulty-btn');
    diffBtns.forEach(b => {
      b.classList.toggle('selected', b.dataset.difficulty === this._selectedDifficulty);
    });
    if (this.hitsCountEl) {
      this.hitsCountEl.textContent = DIFFICULTY[this._selectedDifficulty].hitsToKill;
    }
    this.container.classList.add('active');
  }

  hide() {
    this.container.classList.add('fade-out');
    setTimeout(() => {
      this.container.classList.remove('active', 'fade-out');
    }, 500);
  }
}
