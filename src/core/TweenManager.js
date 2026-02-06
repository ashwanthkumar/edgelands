export class Tween {
  constructor(target, props, duration, easing = Tween.easeOutCubic) {
    this.target = target;
    this.props = {};
    this.duration = duration;
    this.easing = easing;
    this.elapsed = 0;
    this.done = false;
    this.onComplete = null;

    for (const key in props) {
      this.props[key] = { start: target[key], end: props[key] };
    }
  }

  update(dt) {
    if (this.done) return;
    this.elapsed += dt;
    const t = Math.min(this.elapsed / this.duration, 1);
    const e = this.easing(t);

    for (const key in this.props) {
      const { start, end } = this.props[key];
      this.target[key] = start + (end - start) * e;
    }

    if (t >= 1) {
      this.done = true;
      if (this.onComplete) this.onComplete();
    }
  }

  static easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  static easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  static linear(t) { return t; }
}

export class TweenManager {
  constructor() {
    this.tweens = [];
  }

  add(target, props, duration, easing) {
    const tween = new Tween(target, props, duration, easing);
    this.tweens.push(tween);
    return tween;
  }

  update(dt) {
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      this.tweens[i].update(dt);
      if (this.tweens[i].done) {
        this.tweens.splice(i, 1);
      }
    }
  }
}
