# MARVEL: MULTIVERSE CHAOS

A browser-based, side-scrolling superhero arcade campaign created as a Multimedia Lab project. The game uses original procedural Canvas artwork and synthesized Web Audio effects; it does not depend on remote image or audio files.

## Objective

Choose a hero, cross four dimensions, collect cosmic energy, defeat each region's boss, and stop the final breach. Enemies pursue and attack the player, while boss battles add projectile patterns and a second phase at half health.

## Technology

- React 19 for menus, selection screens, HUD, settings, and overlays
- Vite 8 for development and production bundling
- HTML5 Canvas 2D and `requestAnimationFrame` for gameplay
- Web Audio API for generated music and sound cues
- CSS animations and responsive layouts for the interface
- LocalStorage for high scores and campaign progress

## Run Locally

Requirements: Node.js 20.19+ or 22.12+, and npm.

```bash
npm install
npm run dev
```

Vite prints a local URL (normally `http://localhost:5173`). Create and inspect the production build with:

```bash
npm run build
npm run preview
```

## How to Play

Keyboard: `A` / `D` or Left / Right to move, `Space` to jump, `J` for a basic attack, `K` for a special, `L` for the ultimate, and `P` / `Escape` to pause. Spider-Man can double-jump; Iron Man can briefly glide while holding jump after takeoff.

On touch devices, use the on-screen arrows and `↑`, `J`, `K`, and `L` buttons. Sound begins after the first interaction to comply with browser autoplay restrictions. Volume and mute controls are available during play and in Settings.

## Heroes

| Hero | Strengths | Special | Ultimate |
| --- | --- | --- | --- |
| Iron Man | Ranged repulsors, brief powered glide | Arc Lance | Orbital Strike |
| Spider-Man | Fast movement, double jump, web stun | Web Burst | Web Storm |
| Thor | Heavy hammer strikes and lightning reach | Stormcall | Ragnarok |
| Hulk | Highest health and close-range impact | Ragequake | World Breaker |

Each hero has independent health, damage, movement speed, jump force, cooldown, and attack behavior. Their original procedural silhouettes are not extracted from film or game assets.

Iron Man and Spider-Man are available from the start. Defeating a dimension boss unlocks Thor; clearing bosses in three distinct dimensions unlocks Hulk. High scores, cleared dimensions, and achievements persist in LocalStorage.

## Dimensions

1. **New York City:** skyline traversal, drones, cosmic shards, and Ultron Prime.
2. **Asgard:** golden realm platforms, draugr, and the Illusionist.
3. **Sakaar:** alien arena, arena hunters, and Champion Zero.
4. **The Collapse:** void wraiths, the highest threat scaling, and the multi-pattern Titan finale.

Each stage has a distinct palette, enemy pressure, collectible route, and boss encounter. Asgard platforms float, Sakaar platforms move horizontally, and the final dimension periodically shifts to low gravity. Stage selection is available from the mission screen; the campaign can also be played from New York through the finale.

## Multimedia Concepts

The **Multimedia Lab Explained** screen provides implementation notes for 16 lab topics, including 2D graphics, sprite and frame animation, real-time rendering, collision detection, physics, particles, generated audio, input modes, parallax, color theory, UI, and animation principles. See [MULTIMEDIA_LAB_DOCUMENTATION.md](MULTIMEDIA_LAB_DOCUMENTATION.md) for viva-ready detail.

## Architecture

- `src/game/GameEngine.js`: independent simulation, input, physics, collision, AI, combat, boss phases, particles, and Canvas rendering
- `src/game/config.js`: hero, dimension, and lab content data
- `src/game/audio.js`: generated sound cues and gesture-started music
- `src/game/GameCanvas.jsx`: Canvas lifecycle, React HUD, controls, and game overlays
- `src/App.jsx`: menu flow, character and mission selection, settings, records, and lab screen
- `src/game/game.css` and `src/App.css`: responsive gameplay and application presentation

## Persistence

The high score and furthest entered dimension are stored in browser LocalStorage. Clearing browser site data resets these values.

## Screenshots

Capture the main menu, champion selection, an active boss fight, and the Multimedia Lab screen here after running the application. No screenshots are checked into this source tree yet.

## Deployment

Vercel SPA routing is configured in `vercel.json`. The production deployment URL will be added after a successful authenticated deployment and live verification.