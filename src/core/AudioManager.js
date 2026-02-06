export class AudioManager {
  constructor() {
    this.ctx = null;
    this._initialized = false;
    this._musicPlaying = false;
    this._musicNodes = null;
    this.sfxEnabled = true;
    this.musicEnabled = true;

    // Load settings from localStorage
    this._loadSettings();

    // Init on first user interaction
    this._initOnInteraction = () => {
      if (!this._initialized) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this._initialized = true;
        if (this.musicEnabled) {
          this.startMusic();
        }
      }
    };
    window.addEventListener('click', this._initOnInteraction, { once: false });
    window.addEventListener('keydown', this._initOnInteraction, { once: false });
    window.addEventListener('touchstart', this._initOnInteraction, { once: false });
  }

  _loadSettings() {
    try {
      const raw = localStorage.getItem('edgelands_settings');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.musicEnabled !== undefined) this.musicEnabled = data.musicEnabled;
      if (data.sfxEnabled !== undefined) this.sfxEnabled = data.sfxEnabled;
    } catch (e) { /* ignore */ }
  }

  _saveSettings() {
    try {
      localStorage.setItem('edgelands_settings', JSON.stringify({
        musicEnabled: this.musicEnabled,
        sfxEnabled: this.sfxEnabled,
      }));
    } catch (e) { /* ignore */ }
  }

  play(name) {
    if (!this.ctx || !this.sfxEnabled) return;
    const sounds = {
      swing: () => this._playTone(200, 0.08, 'square', 0.15),
      hit: () => this._playTone(150, 0.1, 'sawtooth', 0.12),
      pickup: () => this._playTone(600, 0.15, 'sine', 0.1, 800),
      death: () => this._playNoise(0.4, 0.2),
      levelup: () => this._playArpeggio([400, 500, 600, 800], 0.08, 0.1),
      zoneUnlock: () => this._playArpeggio([300, 400, 500, 600, 800], 0.1, 0.12),
      zoneBlocked: () => this._playTone(100, 0.15, 'square', 0.08),
    };
    const fn = sounds[name];
    if (fn) fn();
  }

  startMusic() {
    if (this._musicPlaying || !this.ctx) return;
    this._musicPlaying = true;

    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    masterGain.connect(this.ctx.destination);

    // Layer 1: Deep drone - sine at 55Hz (A1) with slow pitch LFO
    const drone = this.ctx.createOscillator();
    drone.type = 'sine';
    drone.frequency.setValueAtTime(55, this.ctx.currentTime);
    const droneLfo = this.ctx.createOscillator();
    droneLfo.type = 'sine';
    droneLfo.frequency.setValueAtTime(0.1, this.ctx.currentTime);
    const droneLfoGain = this.ctx.createGain();
    droneLfoGain.gain.setValueAtTime(3, this.ctx.currentTime);
    droneLfo.connect(droneLfoGain);
    droneLfoGain.connect(drone.frequency);
    drone.connect(masterGain);
    droneLfo.start();
    drone.start();

    // Layer 2: Mid pad - triangle at 82.5Hz (E2) with volume swell LFO
    const pad = this.ctx.createOscillator();
    pad.type = 'triangle';
    pad.frequency.setValueAtTime(82.5, this.ctx.currentTime);
    const padGain = this.ctx.createGain();
    padGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    const padLfo = this.ctx.createOscillator();
    padLfo.type = 'sine';
    padLfo.frequency.setValueAtTime(0.05, this.ctx.currentTime);
    const padLfoGain = this.ctx.createGain();
    padLfoGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    padLfo.connect(padLfoGain);
    padLfoGain.connect(padGain.gain);
    pad.connect(padGain);
    padGain.connect(masterGain);
    padLfo.start();
    pad.start();

    // Layer 3: High shimmer - sine at 220Hz (A3) with frequency LFO
    const shimmer = this.ctx.createOscillator();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(220, this.ctx.currentTime);
    const shimmerLfo = this.ctx.createOscillator();
    shimmerLfo.type = 'sine';
    shimmerLfo.frequency.setValueAtTime(0.07, this.ctx.currentTime);
    const shimmerLfoGain = this.ctx.createGain();
    shimmerLfoGain.gain.setValueAtTime(5, this.ctx.currentTime);
    shimmerLfo.connect(shimmerLfoGain);
    shimmerLfoGain.connect(shimmer.frequency);
    const shimmerGain = this.ctx.createGain();
    shimmerGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(masterGain);
    shimmerLfo.start();
    shimmer.start();

    this._musicNodes = {
      masterGain,
      oscillators: [drone, pad, shimmer, droneLfo, padLfo, shimmerLfo],
    };
  }

  stopMusic() {
    if (!this._musicPlaying || !this._musicNodes) return;
    const { masterGain, oscillators } = this._musicNodes;
    const now = this.ctx.currentTime;
    masterGain.gain.setValueAtTime(masterGain.gain.value, now);
    masterGain.gain.linearRampToValueAtTime(0, now + 1);
    setTimeout(() => {
      for (const osc of oscillators) {
        try { osc.stop(); } catch (e) { /* already stopped */ }
      }
    }, 1100);
    this._musicPlaying = false;
    this._musicNodes = null;
  }

  _playTone(freq, duration, type = 'sine', volume = 0.1, endFreq = null) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (endFreq) {
      osc.frequency.linearRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
    }
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  _playNoise(duration, volume) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(this.ctx.destination);
    source.start();
  }

  _playArpeggio(freqs, noteLen, volume) {
    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      const start = this.ctx.currentTime + i * noteLen;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + noteLen);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + noteLen);
    });
  }
}
