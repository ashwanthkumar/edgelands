# Padmahastha - A Learning Adventure

A 3D educational game for grade 1 students (ages 5-7) built with Three.js. Teaches math, letters, shapes, and colors through interactive low-poly 3D levels.

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Install & Run

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

### Build for Production

```bash
npm run build
npm run preview
```

The built files will be in the `dist/` directory.

## Game Levels

1. **Counting Garden** - Count animals and objects (1-10)
2. **Addition Adventure** - Visual addition with colorful blocks (sums up to 10)
3. **Take Away Trail** - Subtraction with gems that fly away
4. **Letter Land** - Match letters to objects that start with them
5. **Shape World** - Identify 3D shapes (cube, sphere, cone, etc.)
6. **Color Quest** - Click all objects matching a target color

## How to Play

- Click **Play** on the start screen to see the level select
- Complete a level to unlock the next one
- Earn 1-3 stars per level based on mistakes (0 mistakes = 3 stars)
- Progress is saved automatically in your browser

## Tech Stack

- **Vite** - Bundler
- **Three.js** - 3D rendering
- **Web Audio API** - Procedural sound effects
- **localStorage** - Progress persistence

All 3D objects are procedurally generated using Three.js geometry — no external model files required.
