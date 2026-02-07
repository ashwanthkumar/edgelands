import { ZoneManager, WEAPONS } from '../config/constants.js';
import { formatNumber, colorToHex } from '../utils.js';

export class HUD {
  constructor(game) {
    this.game = game;
    this.container = document.getElementById('hud');
    this._build();
  }

  _build() {
    this.container.innerHTML = `
      <div class="hud-stat" id="hud-zone">Sanctuary</div>
      <div class="hud-safe-zone" id="hud-safe-zone" style="display:none">SAFE ZONE</div>
      <div class="hud-bar">
        <div class="hud-bar-fill hp-fill" id="hud-hp-fill"></div>
      </div>
      <div class="hud-stat" id="hud-hp-text">HP: 10 / 10</div>
      <div class="hud-stat" id="hud-points">Points: 2</div>
      <div class="hud-stat" id="hud-weapon">Grass Stick (2 dmg)</div>
      <div class="hud-next-upgrade" id="hud-next-upgrade"></div>
      <div class="hud-stat hud-zone-progress" id="hud-zone-progress"></div>
    `;
    this.hpFill = document.getElementById('hud-hp-fill');
    this.hpText = document.getElementById('hud-hp-text');
    this.pointsText = document.getElementById('hud-points');
    this.weaponText = document.getElementById('hud-weapon');
    this.zoneText = document.getElementById('hud-zone');
    this.safeZoneText = document.getElementById('hud-safe-zone');
    this.nextUpgradeText = document.getElementById('hud-next-upgrade');
    this.zoneProgressText = document.getElementById('hud-zone-progress');
  }

  update(dt) {
    const p = this.game.player;
    if (!p) return;

    // HP bar
    const ratio = p.maxHp > 0 ? p.hp / p.maxHp : 0;
    this.hpFill.style.width = `${ratio * 100}%`;
    this.hpText.textContent = `HP: ${Math.ceil(p.hp)} / ${p.maxHp}`;

    // Points
    this.pointsText.textContent = `Points: ${formatNumber(p.points)}`;

    // Weapon
    this.weaponText.textContent = `${p.weapon.name} (${p.getDamage()} dmg)`;

    // Upgrade info
    if (p.weaponIndex >= WEAPONS.length - 1) {
      this.nextUpgradeText.textContent = 'MAX WEAPON';
    } else {
      this.nextUpgradeText.textContent = `Clear zone to upgrade`;
    }

    // Zone
    const zi = p.getCurrentZone();
    const zone = ZoneManager.getZone(zi);
    this.zoneText.textContent = zone.name;
    this.zoneText.style.color = colorToHex(zone.color);

    // Safe zone indicator
    if (zi === 0) {
      this.safeZoneText.style.display = 'block';
    } else {
      this.safeZoneText.style.display = 'none';
    }

    // Zone progress
    if (this.game.enemyManager) {
      const progress = this.game.enemyManager.getZoneProgress(zi);
      if (progress.threshold === 0) {
        this.zoneProgressText.textContent = '';
      } else if (progress.unlocked) {
        this.zoneProgressText.textContent = 'Zone cleared!';
      } else {
        this.zoneProgressText.textContent = `Defeated: ${progress.kills}/${progress.threshold}`;
      }
    }
  }

}
