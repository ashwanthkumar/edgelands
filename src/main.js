import { Game } from './core/Game.js';
import { AudioManager } from './core/AudioManager.js';
import { Player } from './entities/Player.js';
import { WorldManager } from './world/WorldManager.js';
import { EnemyManager } from './entities/EnemyManager.js';
import { CombatSystem } from './combat/CombatSystem.js';
import { PickupManager } from './entities/PickupManager.js';
import { ParticleSystem } from './effects/ParticleSystem.js';
import { DamageNumbers } from './ui/DamageNumbers.js';
import { HUD } from './ui/HUD.js';
import { Minimap } from './ui/Minimap.js';
import { DeathScreen } from './ui/DeathScreen.js';
import { Settings } from './ui/Settings.js';
import { TitleScreen } from './ui/TitleScreen.js';

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);

// Audio
const audio = new AudioManager();
game.audioManager = audio;

// Particles
const particles = new ParticleSystem(game);
game.particleSystem = particles;
game.addSystem(particles);

// Create world
const world = new WorldManager(game);
game.worldManager = world;
game.addSystem(world);

// Create player
const player = new Player(game);
game.player = player;
player.load(); // restore saved progress
game.addSystem(player);

// Create enemies
const enemies = new EnemyManager(game);
game.enemyManager = enemies;
enemies.load(); // restore saved zone progress
game.addSystem(enemies);

// Combat system
const combat = new CombatSystem(game);
game.combatSystem = combat;
game.addSystem(combat);

// Damage numbers
const damageNumbers = new DamageNumbers(game);
game.damageNumbers = damageNumbers;

// Pickup manager
const pickups = new PickupManager(game);
game.pickupManager = pickups;
game.addSystem(pickups);

// HUD
const hud = new HUD(game);
game.hud = hud;
game.addSystem(hud);

// Minimap
const minimap = new Minimap(game);
game.minimap = minimap;
game.addSystem(minimap);

// Death screen
const deathScreen = new DeathScreen(game);
game.deathScreen = deathScreen;
game.addSystem(deathScreen);

// Settings
const settings = new Settings(game);
game.settings = settings;
game.addSystem(settings);

// Title screen — defer game start until player clicks "Start Game"
const titleScreen = new TitleScreen(() => {
  if (!game._running) {
    game.start();
  } else {
    // Restart after game over
    game.player.respawn();
  }
});
game.titleScreen = titleScreen;
titleScreen.show();
