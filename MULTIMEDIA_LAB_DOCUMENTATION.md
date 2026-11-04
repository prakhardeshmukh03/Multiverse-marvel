# Multimedia Lab Documentation

## Project Overview

**MARVEL: MULTIVERSE CHAOS** is a React interface wrapped around an independent HTML5 Canvas action game. The simulation owns movement, collision, enemy behavior, combat, particles, and rendering. React observes compact game-state snapshots and presents menus, the HUD, and overlays. Visuals are procedurally drawn and audio is synthesized locally, so the project has no missing asset paths or third-party media dependencies.

## Concepts Demonstrated

### 1. 2D Computer Graphics

The renderer in `src/game/GameEngine.js` draws the scene with Canvas 2D primitives, paths, gradients, clipping, and compositing. It layers a sky, stars, parallax skyline, floor, platforms, characters, enemies, projectiles, and effects into a 960-by-540 logical viewport.

### 2. Sprite Animation

Characters are procedural sprite-like assemblies rather than downloaded bitmaps. Head, torso, limbs, armor accents, silhouette, and color are composed at render time. Hero data in `src/game/config.js` controls palette and gameplay identity.

### 3. Frame-Based Animation

`requestAnimationFrame` calls the engine loop. Elapsed time is clamped and all movement, cooldown, particle, and AI changes use delta time rather than assuming a fixed frame rate. Sine-based cycles animate idle bob, running strides, pickups, and bosses.

### 4. Real-Time Rendering

The Canvas is redrawn each animation frame. A `ResizeObserver` maps its backing resolution to the displayed size and device pixel ratio (capped at 2), while the game world remains in consistent logical coordinates.

### 5. Collision Detection

The engine uses axis-aligned rectangle overlap for attacks, enemies, projectiles, and player damage. A previous-feet/current-feet check resolves one-way platform landings. Pickup collection uses distance checks against the player center.

### 6. Game Physics

The player has horizontal and vertical velocity, gravity, jump impulses, landing state, knockback, and invulnerability time. Spider-Man receives a second jump; Iron Man receives a short powered glide window while jump is held. The camera follows the player but is clamped to stage bounds.

### 7. Particle Systems

Combat and pickups emit particles with position, velocity, color, size, and lifetime. Particles are advanced with the simulation and removed when their life reaches zero. Floating damage values use the same lifetime-based update and cleanup model. Screen shake communicates heavy impacts.

### 8. Sound Design

`src/game/audio.js` uses the Web Audio API to synthesize jump, punch, repulsor, hit, pickup, boss, and victory cues from oscillators, gain envelopes, and frequency sweeps. No prerecorded samples are required.

### 9. Background Music

A repeating low-volume tonal pattern demonstrates generated background music. It is started from a user gesture, respecting browser autoplay restrictions. Master volume and mute are controlled with a Web Audio gain node.

### 10. Keyboard Interaction

The engine registers `keydown` and `keyup` handlers for movement and edge-triggered actions. Arrow/Space scrolling is prevented while playing. `P` or `Escape` toggles pause. All global listeners and the animation frame are removed on component cleanup.

### 11. Mouse Interaction

Menus, mission cards, champion cards, and HUD actions are native buttons. Pointer hover, focus, and selection states are styled in CSS; buttons expose accessible labels for icon-like actions.

### 12. Touch Interaction

Touch controls use Pointer Events with pointer capture, plus `touch-action: none` and text selection suppression. Press/release updates directional state, while jump and attacks trigger on press. Controls are revealed at mobile breakpoints.

### 13. Parallax Scrolling

Stars and skyline buildings use different camera multipliers from the foreground. This separation produces a depth cue while the world camera follows the player through a stage.

### 14. Color Theory

Each dimension has its own sky, horizon, ground, and accent values. Cool dark environments improve contrast with warm enemy alerts, red damage feedback, gold/cyan pickups, and each hero's distinct identity color.

### 15. User Interface Design

React renders the HUD outside Canvas. Health and energy bars, score, combo, lives, boss health, cooldown indicators, pause, touch controls, and terminal overlays are derived from simulation snapshots. This separation keeps interface changes independent of world drawing.

### 16. Animation Principles

The experience uses anticipation through attack poses, follow-through through recoil and particles, easing through transitions, squash-like boss motion, idle/running cycles, hit flashes, brief invulnerability flicker, and screen shake. These cues make attacks and state changes legible.

## Game Loop and State Flow

1. React mounts `GameCanvas` for the chosen hero and stage.
2. `GameEngine` creates the canvas context, registers input and resize handling, initializes the stage, and starts `requestAnimationFrame`.
3. Each frame updates player physics, enemy AI, boss timers, pickups, projectiles, particles, and camera position; then it draws the visible scene.
4. At a bounded interval, the engine sends a small state snapshot to React for HUD rendering and LocalStorage score/progress persistence.
5. Pause, stage clear, game over, or victory stops simulation updates while the canvas and React overlay remain visible.
6. Unmount cancels animation, disconnects resize observation, removes keyboard listeners, and closes the audio context.

## Viva Demonstration

- Start a campaign and compare each hero's movement and attack reach.
- Collect the floating cosmic shards and observe the energy meter increase.
- Jump onto raised platforms and compare Spider-Man's double jump with Iron Man's glide.
- Trigger a boss and observe its health bar, projectile pattern, and phase change near half health.
- Pause with `P`, then resume from the overlay.
- Open Settings and change difficulty, then inspect the responsive controls at a mobile viewport.
- Open Multimedia Lab Explained and connect a listed topic to its live behavior in the game.