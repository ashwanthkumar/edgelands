export class HelpOverlay {
  constructor(game) {
    this.game = game;
    this.container = document.getElementById('help-overlay');
    this.active = false;
    this._build();
    this._setupKeyboard();
  }

  _build() {
    this.container.innerHTML = `
      <div class="help-content">
        <h2 class="help-title">Keyboard Shortcuts</h2>
        <div class="help-section">
          <h3>Gameplay</h3>
          <div class="help-row"><span class="help-key">W A S D</span><span>Move</span></div>
          <div class="help-row"><span class="help-key">Space</span><span>Attack</span></div>
          <div class="help-row"><span class="help-key">Click</span><span>Attack</span></div>
        </div>
        <div class="help-section">
          <h3>Title Screen</h3>
          <div class="help-row"><span class="help-key">E</span><span>Easy difficulty</span></div>
          <div class="help-row"><span class="help-key">M</span><span>Medium difficulty</span></div>
          <div class="help-row"><span class="help-key">H</span><span>Hard difficulty</span></div>
          <div class="help-row"><span class="help-key">Enter</span><span>Start game</span></div>
        </div>
        <div class="help-section">
          <h3>Death Screen</h3>
          <div class="help-row"><span class="help-key">X</span><span>Share on X</span></div>
          <div class="help-row"><span class="help-key">Enter</span><span>Play again</span></div>
        </div>
        <div class="help-section">
          <h3>General</h3>
          <div class="help-row"><span class="help-key">?</span><span>Toggle this help</span></div>
          <div class="help-row"><span class="help-key">C</span><span>Credits</span></div>
        </div>
        <div class="help-dismiss">Press <span class="help-key">?</span> or <span class="help-key">Esc</span> to close</div>
      </div>
    `;
  }

  _setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        this.toggle();
      } else if (e.key === 'Escape' && this.active) {
        this.hide();
      }
    });
  }

  toggle() {
    if (this.active) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    // Don't show during title or death screens
    const titleScreen = document.getElementById('title-screen');
    const deathScreen = document.getElementById('death-screen');
    if (titleScreen && titleScreen.classList.contains('active')) return;
    if (deathScreen && deathScreen.classList.contains('active')) return;

    this.active = true;
    this.container.classList.add('active');
    this.game.paused = true;
  }

  hide() {
    this.active = false;
    this.container.classList.add('fade-out');
    this.game.paused = false;
    setTimeout(() => {
      this.container.classList.remove('active', 'fade-out');
    }, 300);
  }
}
