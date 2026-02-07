export class InputManager {
  constructor() {
    this.keys = { w: false, a: false, s: false, d: false };
    this._attackPressed = false;

    // -45° rotation for isometric: rotate input so W = screen-up
    this.cos45 = Math.cos(Math.PI / 4);
    this.sin45 = Math.sin(Math.PI / 4);

    // Touch joystick state (normalized -1 to 1)
    this.touchMovement = { x: 0, z: 0 };
    this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('mousedown', this._onMouseDown);

    if (this.isTouchDevice) {
      this._setupTouchControls();
    }
  }

  _onKeyDown(e) {
    const key = e.key.toLowerCase();
    if (key in this.keys) this.keys[key] = true;
    if (key === ' ') {
      e.preventDefault();
      this._attackPressed = true;
    }
  }

  _onKeyUp(e) {
    const key = e.key.toLowerCase();
    if (key in this.keys) this.keys[key] = false;
  }

  _onMouseDown(e) {
    if (e.button === 0) this._attackPressed = true;
  }

  _setupTouchControls() {
    const container = document.getElementById('touch-controls');
    if (!container) return;
    container.classList.add('active');

    // Joystick base
    const base = document.createElement('div');
    base.className = 'touch-joystick-base';
    container.appendChild(base);

    // Joystick thumb
    const thumb = document.createElement('div');
    thumb.className = 'touch-joystick-thumb';
    base.appendChild(thumb);

    // Attack button
    const attackBtn = document.createElement('div');
    attackBtn.className = 'touch-attack-btn';
    attackBtn.textContent = '\u2694'; // crossed swords
    container.appendChild(attackBtn);

    // Joystick tracking
    let joystickActive = false;
    const getBaseRadius = () => base.offsetWidth / 2;
    const getMaxThumbOffset = () => getBaseRadius() * 0.75;

    const handleJoystickMove = (clientX, clientY) => {
      const rect = base.getBoundingClientRect();
      const baseRadius = getBaseRadius();
      const maxThumbOffset = getMaxThumbOffset();
      const centerX = rect.left + baseRadius;
      const centerY = rect.top + baseRadius;

      let dx = clientX - centerX;
      let dy = clientY - centerY;

      // Clamp to max offset
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.001) return; // dead center — no movement
      if (dist > maxThumbOffset) {
        dx = (dx / dist) * maxThumbOffset;
        dy = (dy / dist) * maxThumbOffset;
      }

      // Position thumb
      thumb.style.left = (baseRadius + dx) + 'px';
      thumb.style.top = (baseRadius + dy) + 'px';

      // Normalize to -1..1
      const nx = dx / maxThumbOffset;
      const ny = dy / maxThumbOffset;

      // Map screen (right, down) to world (x, z), then apply -45° rotation
      this.touchMovement.x = nx;
      this.touchMovement.z = ny;
    };

    const resetJoystick = () => {
      joystickActive = false;
      thumb.style.left = '50%';
      thumb.style.top = '50%';
      thumb.style.transform = 'translate(-50%, -50%)';
      this.touchMovement.x = 0;
      this.touchMovement.z = 0;
    };

    base.addEventListener('touchstart', (e) => {
      e.preventDefault();
      joystickActive = true;
      // Remove the CSS centering transform since we'll position manually
      thumb.style.transform = 'translate(-50%, -50%)';
      const touch = e.touches[0];
      handleJoystickMove(touch.clientX, touch.clientY);
    }, { passive: false });

    base.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!joystickActive) return;
      const touch = e.touches[0];
      handleJoystickMove(touch.clientX, touch.clientY);
    }, { passive: false });

    base.addEventListener('touchend', (e) => {
      e.preventDefault();
      resetJoystick();
    }, { passive: false });

    base.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      resetJoystick();
    }, { passive: false });

    // Attack button
    attackBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this._attackPressed = true;
      attackBtn.style.background = 'rgba(255, 80, 80, 0.5)';
    }, { passive: false });

    attackBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      attackBtn.style.background = 'rgba(200, 50, 50, 0.3)';
    }, { passive: false });

    this._touchElements = { container, base, thumb, attackBtn };
  }

  getMovement() {
    // Check touch input first
    const hasTouchInput = this.touchMovement.x !== 0 || this.touchMovement.z !== 0;

    let x, z;
    if (hasTouchInput) {
      x = this.touchMovement.x;
      z = this.touchMovement.z;
    } else {
      x = 0;
      z = 0;
      if (this.keys.w) z -= 1;
      if (this.keys.s) z += 1;
      if (this.keys.a) x -= 1;
      if (this.keys.d) x += 1;

      // Normalize
      const len = Math.sqrt(x * x + z * z);
      if (len > 0) { x /= len; z /= len; }
    }

    // Rotate -45° for isometric projection (camera at +X,+Z offset)
    const rx = x * this.cos45 + z * this.sin45;
    const rz = -x * this.sin45 + z * this.cos45;

    return { x: rx, z: rz };
  }

  consumeAttack() {
    if (this._attackPressed) {
      this._attackPressed = false;
      return true;
    }
    return false;
  }

  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('mousedown', this._onMouseDown);
    if (this._touchElements) {
      const { base, attackBtn } = this._touchElements;
      base.replaceWith(base.cloneNode(true));
      attackBtn.replaceWith(attackBtn.cloneNode(true));
    }
  }
}
