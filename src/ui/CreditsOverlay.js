export class CreditsOverlay {
  constructor(game) {
    this.game = game;
    this.container = document.getElementById('credits-overlay');
    this.active = false;
    this._build();
    this._setupKeyboard();
  }

  _build() {
    this.container.innerHTML = `
      <div class="credits-content">
        <h2 class="credits-title">Credits</h2>
        <div class="credits-section">
          <h3>Created By</h3>
          <div class="credits-row"><a href="https://www.linkedin.com/in/ashwanthkumar/" target="_blank" rel="noopener">Ashwanth Kumar</a></div>
        </div>
        <div class="credits-section">
          <h3>Built With</h3>
          <div class="credits-row">
            <span class="credits-label">Three.js</span>
            <span class="credits-desc">3D rendering engine</span>
          </div>
          <div class="credits-row">
            <span class="credits-label">Vite</span>
            <span class="credits-desc">Build tool & dev server</span>
          </div>
          <div class="credits-row">
            <span class="credits-label">Web Audio API</span>
            <span class="credits-desc">Procedural sound & music</span>
          </div>
          <div class="credits-row">
            <span class="credits-label">WebGL</span>
            <span class="credits-desc">Hardware-accelerated graphics</span>
          </div>
          <div class="credits-row">
            <span class="credits-label">Vanilla JS</span>
            <span class="credits-desc">No frameworks, just ES modules</span>
          </div>
        </div>
        <div class="credits-section">
          <h3>AI Assist</h3>
          <div class="credits-row">
            <span class="credits-label">Claude Code</span>
            <span class="credits-desc">Development assistant</span>
          </div>
        </div>
        <div class="credits-section">
          <h3>Deployed With</h3>
          <div class="credits-row">
            <span class="credits-label">GitHub Pages</span>
            <span class="credits-desc">Hosting & CI/CD</span>
          </div>
        </div>
        <div class="credits-links">
          <a href="https://github.com/ashwanthkumar/edgelands" target="_blank" rel="noopener">View on GitHub</a>
          <span class="credits-license">MIT License</span>
        </div>
        <div class="credits-dismiss">Press <span class="help-key">C</span> or <span class="help-key">Esc</span> to close</div>
      </div>
    `;
  }

  _setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey) {
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
