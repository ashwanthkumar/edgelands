export class Settings {
  constructor(game) {
    this.game = game;
    this._build();
  }

  _build() {
    const overlay = document.getElementById('ui-overlay');

    // Gear button
    this.btn = document.createElement('div');
    this.btn.id = 'settings-btn';
    this.btn.className = 'settings-btn';
    this.btn.textContent = '\u2699';
    this.btn.style.pointerEvents = 'auto';
    this.btn.addEventListener('click', () => this._toggle());
    overlay.appendChild(this.btn);

    // Panel
    this.panel = document.createElement('div');
    this.panel.id = 'settings-panel';
    this.panel.className = 'settings-panel';
    this.panel.style.display = 'none';
    this.panel.style.pointerEvents = 'auto';

    const audio = this.game.audioManager;

    this.panel.innerHTML = `
      <div class="settings-header">
        <span>Settings</span>
        <span class="settings-close" id="settings-close">\u2715</span>
      </div>
      <div class="settings-row">
        <span>Music</span>
        <label class="settings-toggle">
          <input type="checkbox" id="settings-music" ${audio && audio.musicEnabled ? 'checked' : ''}>
          <span class="settings-slider"></span>
        </label>
      </div>
      <div class="settings-row">
        <span>SFX</span>
        <label class="settings-toggle">
          <input type="checkbox" id="settings-sfx" ${audio && audio.sfxEnabled ? 'checked' : ''}>
          <span class="settings-slider"></span>
        </label>
      </div>
      <button class="settings-reset-btn" id="settings-reset">Reset Progress</button>
    `;

    overlay.appendChild(this.panel);

    // Event listeners
    document.getElementById('settings-close').addEventListener('click', () => this._toggle());

    document.getElementById('settings-music').addEventListener('change', (e) => {
      if (!audio) return;
      audio.musicEnabled = e.target.checked;
      if (e.target.checked) {
        audio.startMusic();
      } else {
        audio.stopMusic();
      }
      audio._saveSettings();
    });

    document.getElementById('settings-sfx').addEventListener('change', (e) => {
      if (!audio) return;
      audio.sfxEnabled = e.target.checked;
      audio._saveSettings();
    });

    document.getElementById('settings-reset').addEventListener('click', () => {
      const player = this.game.player;
      if (!player || player.dead) return;
      player.die();
      this._toggle();
    });
  }

  _toggle() {
    const visible = this.panel.style.display !== 'none';
    this.panel.style.display = visible ? 'none' : 'block';
  }

  update(dt) {}
}
