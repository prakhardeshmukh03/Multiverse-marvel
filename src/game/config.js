export const HEROES = [
  { id: 'ironman', name: 'IRON MAN', color: '#f04b42', accent: '#ffd36e', hp: 100, damage: 15, speed: 270, jump: 590, special: 'ARC LANCE', ultimate: 'ORBITAL STRIKE', cooldown: 4.5 },
  { id: 'spiderman', name: 'SPIDER-MAN', color: '#48b7e8', accent: '#f24c4c', hp: 82, damage: 12, speed: 330, jump: 620, special: 'WEB BURST', ultimate: 'WEB STORM', cooldown: 3.4 },
  { id: 'thor', name: 'THOR', color: '#e5bb56', accent: '#8ec8ff', hp: 112, damage: 19, speed: 250, jump: 560, special: 'STORMCALL', ultimate: 'RAGNAROK', cooldown: 5.2 },
  { id: 'hulk', name: 'HULK', color: '#79c875', accent: '#d8ff88', hp: 140, damage: 23, speed: 230, jump: 660, special: 'RAGEQUAKE', ultimate: 'WORLD BREAKER', cooldown: 5.8 },
]

export const LEVELS = [
  { name: 'NEW YORK CITY', region: 'EARTH-616', sky: '#101a31', horizon: '#243a59', ground: '#242e42', accent: '#ed5549', length: 2700, boss: 'ULTRON PRIME', bossColor: '#db4b4d', enemy: 'DRONE', count: 6 },
  { name: 'ASGARD', region: 'NINE REALMS', sky: '#17182f', horizon: '#655044', ground: '#594336', accent: '#e6bd67', length: 3000, boss: 'THE ILLUSIONIST', bossColor: '#8b67d8', enemy: 'DRAUGR', count: 7 },
  { name: 'SAKAAR', region: 'OUTER RIM', sky: '#281729', horizon: '#754538', ground: '#49313a', accent: '#e87745', length: 3150, boss: 'CHAMPION ZERO', bossColor: '#63c6bd', enemy: 'ARENA HUNTER', count: 8 },
  { name: 'THE COLLAPSE', region: 'BEYOND TIME', sky: '#111127', horizon: '#483b72', ground: '#292b46', accent: '#b88aff', length: 3300, boss: 'THE TITAN', bossColor: '#9271cf', enemy: 'VOID WRAITH', count: 9 },
]

export const ACHIEVEMENTS = [
  { id: 'first-blood', title: 'FIRST BLOOD', description: 'Defeat your first enemy.' },
  { id: 'shard-hunter', title: 'SHARD HUNTER', description: 'Collect five cosmic shards.' },
  { id: 'boss-breaker', title: 'BOSS BREAKER', description: 'Defeat a dimension boss.' },
  { id: 'rift-walker', title: 'RIFT WALKER', description: 'Defeat bosses in three dimensions.' },
  { id: 'reality-saver', title: 'REALITY SAVER', description: 'Restore the multiverse.' },
]

export const LAB_CONCEPTS = [
  ['2D computer graphics', 'Canvas paths and gradients draw the full scene, characters, skyline, energy effects, and interface marks in real time.'],
  ['Sprite animation', 'The hero is procedurally assembled from animated shapes, with a unique silhouette, armor accents, and action poses per champion.'],
  ['Frame-based animation', 'requestAnimationFrame advances a time-based simulation, while pose cycles and particles change on each rendered frame.'],
  ['Real-time rendering', 'The game redraws the visible world every frame and scales the canvas to the display pixel ratio.'],
  ['Collision detection', 'Axis-aligned bounds resolve platforms, enemy hits, projectiles, pickups, and the player hurtbox.'],
  ['Game physics', 'Velocity, gravity, jump impulses, landing resolution, knockback, and camera follow drive movement.'],
  ['Particle systems', 'Short-lived sparks, impact rings, floating damage labels, and pickups are updated and culled by lifetime.'],
  ['Sound design', 'Web Audio oscillators and filtered noise synthesize jump, punch, blast, hit, and victory cues without external assets.'],
  ['Background music', 'A quiet synthesized pulse pattern starts only after a player gesture and follows the selected volume setting.'],
  ['Keyboard interaction', 'A/D or arrows move; Space jumps; J, K, and L attack; Escape or P pauses the campaign.'],
  ['Mouse interaction', 'Menus, champion cards, and HUD controls use native pointer-driven buttons with visible selected states.'],
  ['Touch interaction', 'On-screen directional and combat controls use pointer events and capture so they work on touch screens.'],
  ['Parallax scrolling', 'Distant stars and skyline silhouettes move at different camera ratios to create depth.'],
  ['Color theory', 'Each world uses a distinct limited palette; warm enemy and pickup highlights contrast against deep cool environments.'],
  ['User interface design', 'React renders a readable HUD over the canvas, separating game state presentation from simulation.'],
  ['Animation principles', 'Anticipation, squash, recoil, easing, hit-stop, and screen shake make attacks feel readable and impactful.'],
]