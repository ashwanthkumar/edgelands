# Edgelands

A 3D action game built with Three.js where you fight your way through increasingly dangerous zones, upgrade weapons, and push deeper into the unknown.

**[Play now](https://ashwanthkumar.github.io/edgelands/)**

## How to Play

- **WASD** to move, **Space** or **Click** to attack
- Clear all enemies in a zone to unlock the next one and upgrade your weapon
- Collect drops for points, score multipliers, and heals
- Death resets everything — how far can you get?

## Zones

Start in the safe **Sanctuary** and fight through 11 handcrafted zones — from the Grasslands to the Eternal Depths — with procedurally generated infinite zones beyond.

## Weapons

Progress through 11 weapons as you clear zones, each with increasing damage and HP:

Grass Stick → Wooden Club → Iron Sword → Steel Blade → Golden Sword → Diamond Sword → Legendary Blade → Mythic Sword → Void Cleaver → Astral Edge → Eternal Blade

## Controls

| Key | Action |
|-----|--------|
| W A S D | Move |
| Space / Click | Attack |
| E / M / H | Easy / Medium / Hard difficulty |
| ? | Help overlay |
| C | Credits |

Touch controls with on-screen joystick and attack button are available on mobile.

## Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Production Build

```bash
npm run build
npm run preview
```

## Tech Stack

- **[Three.js](https://threejs.org/)** — 3D rendering
- **[Vite](https://vite.dev/)** — Build tool & dev server
- **Web Audio API** — Procedural sound & music (no audio files)
- **Vanilla JS** — ES modules, no frameworks

All 3D models, terrain, and sounds are procedurally generated — no external assets required.

## License

[MIT](LICENSE)
