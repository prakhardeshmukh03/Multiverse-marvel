import { HEROES, LEVELS } from './config'
import { AudioManager } from './audio'

const WIDTH = 960
const HEIGHT = 540
const FLOOR = 454
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

export class GameEngine {
  constructor(canvas, heroId, onStateChange, startingLevel = 0, difficulty = 'standard') {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.hero = HEROES.find((entry) => entry.id === heroId) || HEROES[0]
    this.onStateChange = onStateChange
    this.difficulty = difficulty
    this.audio = new AudioManager()
    this.keys = new Set()
    this.pointerActions = new Set()
    this.particles = []
    this.projectiles = []
    this.floatingText = []
    this.lastTime = 0
    this.frame = 0
    this.camera = 0
    this.shake = 0
    this.paused = false
    this.disposed = false
    this.levelIndex = clamp(startingLevel, 0, LEVELS.length - 1)
    this.score = 0
    this.combo = 0
    this.kills = 0
    this.shards = 0
    this.bossesDefeated = 0
    this.clearedLevels = []
    this.comboTimer = 0
    this.lives = 3
    this.energy = 35
    this.boss = null
    this.bossDefeated = false
    this.lastStatePush = 0
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(canvas)
    this.resize()
    this.resetLevel(false)
    this.onKeyDown = (event) => this.keyDown(event)
    this.onKeyUp = (event) => this.keys.delete(event.code)
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    this.raf = requestAnimationFrame((time) => this.loop(time))
  }

  get level() { return LEVELS[this.levelIndex] }

  resize() {
    if (!this.canvas) return
    const rect = this.canvas.getBoundingClientRect()
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.max(1, Math.round(rect.width * ratio))
    this.canvas.height = Math.max(1, Math.round(rect.height * ratio))
    this.ctx.setTransform(this.canvas.width / WIDTH, 0, 0, this.canvas.height / HEIGHT, 0, 0)
  }

  keyDown(event) {
    const code = event.code
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'].includes(code)) event.preventDefault()
    if (!this.keys.has(code)) {
      this.audio.unlock()
      if (!this.audio.musicMode) this.audio.startMusic('combat')
      if (code === 'KeyJ') this.attack('basic')
      if (code === 'KeyK') this.attack('special')
      if (code === 'KeyL') this.attack('ultimate')
      if (code === 'KeyP' || code === 'Escape') this.togglePause()
      if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') this.jump()
    }
    this.keys.add(code)
  }

  setPointerAction(action, active) {
    this.audio.unlock()
    if (!this.audio.musicMode) this.audio.startMusic('combat')
    if (active) {
      this.pointerActions.add(action)
      if (action === 'jump') this.jump()
      if (action === 'basic') this.attack('basic')
      if (action === 'special') this.attack('special')
      if (action === 'ultimate') this.attack('ultimate')
    } else this.pointerActions.delete(action)
  }

  resetLevel(resetCampaign = true) {
    if (resetCampaign) {
      this.levelIndex = 0
      this.score = 0
      this.combo = 0
      this.kills = 0
      this.shards = 0
      this.bossesDefeated = 0
      this.clearedLevels = []
      this.lives = 3
      this.energy = 35
    }
    this.player = { x: 90, y: FLOOR - 62, w: 38, h: 62, vx: 0, vy: 0, knockbackX: 0, hp: this.hero.hp, maxHp: this.hero.hp, facing: 1, grounded: true, jumps: 0, invulnerable: 0, attackPose: 0, specialCooldown: 0, ultimateCooldown: 0, checkpointX: 90 }
    const threatScale = this.difficulty === 'casual' ? 0.72 : this.difficulty === 'heroic' ? 1.42 : 1
    this.threatScale = threatScale
    this.enemies = Array.from({ length: this.level.count }, (_, index) => ({ x: 410 + index * (this.level.length - 950) / this.level.count, y: FLOOR - 44, w: 40, h: 44, hp: (34 + this.levelIndex * 12) * threatScale, maxHp: (34 + this.levelIndex * 12) * threatScale, speed: (48 + this.levelIndex * 8) * (this.difficulty === 'heroic' ? 1.25 : 1), attackTimer: 0.8 + Math.random() * 1.3, stun: 0, hitFlash: 0, dead: false }))
    this.pickups = Array.from({ length: 8 }, (_, index) => ({ x: 300 + index * (this.level.length - 550) / 8, y: FLOOR - 76 - (index % 2) * 55, taken: false, pulse: Math.random() * 6 }))
    this.platforms = Array.from({ length: 9 }, (_, index) => {
      const y = FLOOR - 105 - (index % 3) * 48
      const x = 500 + index * 270
      return { x, baseX: x, y, baseY: y, phase: index * 0.9, w: 100 + (index % 2) * 28, h: 14 }
    })
    this.projectiles = []
    this.heroProjectiles = []
    this.particles = []
    this.floatingText = []
    this.camera = 0
    this.boss = null
    this.bossDefeated = false
    this.stageClear = false
    this.victory = false
    this.gameOver = false
    this.paused = false
    this.pushState()
  }

  advanceLevel() {
    if (this.levelIndex >= LEVELS.length - 1) {
      this.victory = true
      this.audio.cue('victory')
      this.pushState()
      return
    }
    this.levelIndex += 1
    this.resetLevel(false)
    this.audio.startMusic('combat')
  }

  togglePause(force) {
    if (this.gameOver || this.stageClear || this.victory) return
    this.paused = typeof force === 'boolean' ? force : !this.paused
    if (!this.paused) {
      this.audio.unlock()
      this.audio.startMusic('combat')
    }
    this.pushState()
  }

  jump() {
    if (this.paused || this.stageClear || this.gameOver || this.victory) return
    const canDouble = this.hero.id === 'spiderman' && this.player.jumps < 2
    if (!this.player.grounded && !canDouble) return
    this.audio.cue('jump')
    this.player.vy = this.hero.jump * (this.player.grounded ? 1 : 0.88)
    this.player.flightFuel = this.hero.id === 'ironman' ? 1.2 : 0
    this.player.grounded = false
    this.player.jumps += 1
    this.burst(this.player.x + 18, this.player.y + this.player.h, this.hero.accent, 8)
  }

  attack(kind) {
    if (this.paused || this.stageClear || this.gameOver || this.victory) return
    const now = performance.now() / 1000
    const player = this.player
    if (kind === 'basic') {
      if (player.attackPose > now) return
      player.attackPose = now + 0.22
      this.audio.cue(this.hero.id === 'ironman' ? 'blast' : 'punch')
      if (this.hero.id === 'ironman' || this.hero.id === 'spiderman') {
        this.heroProjectiles.push({ x: player.x + (player.facing > 0 ? player.w : -22), y: player.y + 26, w: 22, h: 14, vx: player.facing * (this.hero.id === 'ironman' ? 610 : 680), life: 0.85, damage: this.hero.damage, kind: this.hero.id })
        return
      }
      const range = this.hero.id === 'thor' ? 126 : 98
      const damage = this.hero.damage * (this.hero.id === 'thor' ? 1.35 : 1)
      this.hitTargets({ x: player.x + (player.facing > 0 ? 20 : -range), y: player.y + 5, w: range, h: 54 }, damage, 54, this.hero.id === 'spiderman')
      this.burst(player.x + player.w / 2 + player.facing * 58, player.y + 28, this.hero.accent, 10)
      return
    }
    if (kind === 'special') {
      if (player.specialCooldown > 0 || this.energy < 12) return
      player.specialCooldown = this.hero.cooldown
      this.energy -= 12
      this.audio.cue('blast')
      const range = this.hero.id === 'hulk' ? 270 : this.hero.id === 'thor' ? 390 : 490
      if (this.hero.id === 'thor') this.heroProjectiles.push({ x: player.x + (player.facing > 0 ? player.w : -28), y: player.y + 24, w: 28, h: 20, vx: player.facing * 520, life: 1.2, damage: this.hero.damage * 2.8, kind: 'hammer' })
      this.hitTargets({ x: player.x + (player.facing > 0 ? 0 : -range), y: player.y - 20, w: range, h: 100 }, this.hero.damage * (this.hero.id === 'thor' ? 2.1 : 1.75), 120, this.hero.id === 'spiderman')
      this.burst(player.x + 20, player.y + 30, this.hero.color, 28)
      this.shake = 9
      return
    }
    if (player.ultimateCooldown > 0 || this.energy < 65) return
    player.ultimateCooldown = 12
    this.energy -= 65
    this.audio.cue('ultimate')
    for (const enemy of this.enemies) if (!enemy.dead) this.damageEnemy(enemy, this.hero.damage * 4)
    if (this.boss && !this.boss.dead) this.damageBoss(this.hero.damage * 2.4)
    this.burst(player.x + 20, player.y + 25, this.hero.accent, 55)
    this.shake = 18
  }

  hitTargets(box, damage, knockback, stun = false) {
    for (const enemy of this.enemies) {
      if (enemy.dead || !overlap(box, enemy)) continue
      this.damageEnemy(enemy, damage, knockback, stun)
    }
    if (this.boss && !this.boss.dead && overlap(box, this.boss)) this.damageBoss(damage)
  }

  damageEnemy(enemy, amount, knockback = 54, stun = false) {
    if (enemy.dead) return
    enemy.hp -= amount
    enemy.hitFlash = 0.16
    enemy.stun = stun ? 1.4 : 0.25
    enemy.x += this.player.facing * knockback
    this.floatingText.push({ x: enemy.x, y: enemy.y - 12, text: `-${Math.round(amount)}`, life: 0.75, color: '#fff2bf' })
    this.burst(enemy.x + enemy.w / 2, enemy.y + 18, this.level.accent, 11)
    if (enemy.hp <= 0) {
      enemy.dead = true
      this.kills += 1
      this.score += 100 * (this.levelIndex + 1)
      this.combo += 1
      this.comboTimer = 3
      this.energy = clamp(this.energy + 7, 0, 100)
    }
  }

  damageBoss(amount) {
    if (!this.boss || this.boss.dead) return
    this.boss.hp -= amount
    this.boss.hitFlash = 0.18
    this.floatingText.push({ x: this.boss.x + 20, y: this.boss.y - 10, text: `-${Math.round(amount)}`, life: 0.8, color: '#fff2bf' })
    this.burst(this.boss.x + 30, this.boss.y + 45, this.level.bossColor, 14)
    this.shake = Math.max(this.shake, 6)
    if (this.boss.hp <= 0) {
      this.boss.hp = 0
      this.boss.dead = true
      this.bossDefeated = true
      this.stageClear = true
      this.bossesDefeated += 1
      if (!this.clearedLevels.includes(this.levelIndex)) this.clearedLevels.push(this.levelIndex)
      this.score += 1200 * (this.levelIndex + 1)
      this.audio.cue('victory')
      this.pushState()
    }
  }

  damagePlayer(amount) {
    const player = this.player
    if (player.invulnerable > 0 || this.stageClear || this.gameOver) return
    player.hp -= amount
    player.invulnerable = 1.1
    player.knockbackX = (player.x < this.camera + WIDTH / 2 ? -1 : 1) * 190
    this.audio.cue('hit')
    this.shake = 8
    this.burst(player.x + 18, player.y + 30, '#ff6a5e', 14)
    if (player.hp <= 0) {
      this.lives -= 1
      if (this.lives <= 0) {
        this.gameOver = true
        this.audio.cue('hit')
      } else {
        player.hp = player.maxHp
        player.x = Math.max(90, player.checkpointX)
        player.invulnerable = 2.5
      }
    }
    this.pushState()
  }

  burst(x, y, color, count) {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2
      const speed = 35 + Math.random() * 220
      this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.25 + Math.random() * 0.5, maxLife: 0.75, color, size: 2 + Math.random() * 5 })
    }
  }

  update(dt) {
    if (this.paused || this.gameOver || this.stageClear || this.victory) return
    const p = this.player
    for (const platform of this.platforms) {
      if (this.levelIndex === 1) platform.y = platform.baseY + Math.sin(this.frame * 1.2 + platform.phase) * 18
      if (this.levelIndex === 2) platform.x = platform.baseX + Math.sin(this.frame * 0.9 + platform.phase) * 42
    }
    const left = this.keys.has('KeyA') || this.keys.has('ArrowLeft') || this.pointerActions.has('left')
    const right = this.keys.has('KeyD') || this.keys.has('ArrowRight') || this.pointerActions.has('right')
    const direction = Number(right) - Number(left)
    p.vx = direction * this.hero.speed + p.knockbackX
    p.knockbackX *= Math.exp(-8 * dt)
    if (direction) p.facing = direction
    p.x = clamp(p.x + p.vx * dt, 0, this.level.length - p.w)
    const flying = this.hero.id === 'ironman' && p.flightFuel > 0 && (this.keys.has('Space') || this.keys.has('ArrowUp') || this.keys.has('KeyW') || this.pointerActions.has('jump'))
    p.flightFuel = Math.max(0, (p.flightFuel || 0) - dt)
    this.gravityAnomaly = this.levelIndex === 3 && Math.sin(this.frame * 0.35) > 0.88
    p.vy -= (flying ? 430 : this.gravityAnomaly ? 470 : 1600) * dt
    if (flying) p.vy = Math.max(p.vy, 250)
    const previousBottom = p.y + p.h
    p.y -= p.vy * dt
    p.grounded = false
    if (p.y + p.h >= FLOOR) {
      p.y = FLOOR - p.h
      p.vy = 0
      p.grounded = true
      p.jumps = 0
    }
    for (const platform of this.platforms) {
      const feet = p.y + p.h
      if (p.vy <= 0 && previousBottom <= platform.y + 8 && feet >= platform.y && p.x + p.w > platform.x && p.x < platform.x + platform.w) {
        p.y = platform.y - p.h
        p.vy = 0
        p.grounded = true
        p.jumps = 0
      }
    }
    p.invulnerable = Math.max(0, p.invulnerable - dt)
    p.specialCooldown = Math.max(0, p.specialCooldown - dt)
    p.ultimateCooldown = Math.max(0, p.ultimateCooldown - dt)
    this.comboTimer = Math.max(0, this.comboTimer - dt)
    if (!this.comboTimer) this.combo = 0

    for (const enemy of this.enemies) {
      if (enemy.dead) continue
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt)
      enemy.stun = Math.max(0, enemy.stun - dt)
      const delta = p.x - enemy.x
      if (!enemy.stun && Math.abs(delta) > 46) enemy.x += Math.sign(delta) * enemy.speed * dt
      enemy.attackTimer -= dt
      if (Math.abs(delta) < 54 && Math.abs(p.y - enemy.y) < 55 && enemy.attackTimer <= 0) {
        enemy.attackTimer = 1.45
        this.damagePlayer(9 + this.levelIndex * 3)
      }
    }
    if (!this.boss && p.x > this.level.length - 820) {
      p.checkpointX = this.level.length - 910
      const bossHealth = (420 + this.levelIndex * 180) * this.threatScale
      this.boss = { x: this.level.length - 280, y: FLOOR - 106, w: 82, h: 106, hp: bossHealth, maxHp: bossHealth, attackTimer: 1.1, pattern: 0, hitFlash: 0, dead: false }
      this.audio.cue('boss')
      this.audio.startMusic('boss')
      this.pushState()
    }
    if (this.boss && !this.boss.dead) this.updateBoss(dt)
    for (const pickup of this.pickups) {
      pickup.pulse += dt * 4
      if (!pickup.taken && Math.abs(p.x + 18 - pickup.x) < 34 && Math.abs(p.y + 30 - pickup.y) < 46) {
        pickup.taken = true
        this.shards += 1
        this.energy = clamp(this.energy + 18, 0, 100)
        this.score += 50
        this.audio.cue('pickup')
        this.burst(pickup.x, pickup.y, '#7ce5ff', 16)
      }
    }
    for (const projectile of this.projectiles) {
      projectile.x += projectile.vx * dt
      projectile.life -= dt
      if (overlap(projectile, p)) {
        projectile.life = 0
        this.damagePlayer(projectile.damage)
      }
    }
    this.projectiles = this.projectiles.filter((item) => item.life > 0)
    for (const projectile of this.heroProjectiles) {
      projectile.x += projectile.vx * dt
      projectile.life -= dt
      for (const enemy of this.enemies) {
        if (!enemy.dead && overlap(projectile, enemy)) {
          this.damageEnemy(enemy, projectile.damage, 54, projectile.kind === 'spiderman')
          projectile.life = 0
          break
        }
      }
      if (this.boss && !this.boss.dead && overlap(projectile, this.boss)) {
        this.damageBoss(projectile.damage)
        projectile.life = 0
      }
    }
    this.heroProjectiles = this.heroProjectiles.filter((item) => item.life > 0)
    for (const particle of this.particles) {
      particle.x += particle.vx * dt
      particle.y += particle.vy * dt
      particle.vy -= 400 * dt
      particle.life -= dt
    }
    this.particles = this.particles.filter((item) => item.life > 0)
    for (const label of this.floatingText) { label.y -= 34 * dt; label.life -= dt }
    this.floatingText = this.floatingText.filter((item) => item.life > 0)
    this.camera = clamp(p.x - WIDTH * 0.34, 0, this.level.length - WIDTH)
    this.shake = Math.max(0, this.shake - 30 * dt)
  }

  updateBoss(dt) {
    const boss = this.boss
    boss.hitFlash = Math.max(0, boss.hitFlash - dt)
    boss.attackTimer -= dt
    const phase = boss.hp < boss.maxHp * 0.48 ? 2 : 1
    if (boss.attackTimer <= 0) {
      boss.attackTimer = phase === 2 ? 1.35 : 2.1
      boss.pattern += 1
      if (boss.pattern % 3 === 0) {
        this.projectiles.push({ x: boss.x + 20, y: boss.y + 52, w: 28, h: 18, vx: (this.player.x < boss.x ? -1 : 1) * (230 + phase * 70), life: 4, damage: 15 + phase * 4 })
        if (phase === 2) this.projectiles.push({ x: boss.x + 20, y: boss.y + 15, w: 22, h: 22, vx: (this.player.x < boss.x ? -1 : 1) * 310, life: 4, damage: 18 })
      } else if (Math.abs(this.player.x - boss.x) < 170) {
        this.damagePlayer(18 + phase * 7)
        this.shake = 12
      }
    }
  }

  pushState() {
    if (!this.onStateChange) return
    this.onStateChange({ hero: this.hero, level: this.level, levelIndex: this.levelIndex, hp: this.player?.hp ?? this.hero.hp, maxHp: this.player?.maxHp ?? this.hero.hp, energy: this.energy, score: this.score, lives: this.lives, combo: this.combo, kills: this.kills, shards: this.shards, bossesDefeated: this.bossesDefeated, clearedLevels: [...this.clearedLevels], boss: this.boss && !this.boss.dead ? { name: this.level.boss, hp: this.boss.hp, maxHp: this.boss.maxHp } : null, paused: this.paused, stageClear: this.stageClear, gameOver: this.gameOver, victory: this.victory, specialCooldown: this.player?.specialCooldown ?? 0, specialMax: this.hero.cooldown, ultimateCooldown: this.player?.ultimateCooldown ?? 0, ultimateMax: 12 })
  }

  loop(time) {
    if (this.disposed) return
    const dt = Math.min((time - (this.lastTime || time)) / 1000, 0.035)
    this.lastTime = time
    this.frame += dt
    this.update(dt)
    this.draw()
    if (time - this.lastStatePush > 100) {
      this.lastStatePush = time
      this.pushState()
    }
    this.raf = requestAnimationFrame((next) => this.loop(next))
  }

  draw() {
    const ctx = this.ctx
    const level = this.level
    ctx.save()
    const shakeX = this.shake ? (Math.random() - 0.5) * this.shake : 0
    ctx.translate(shakeX, 0)
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT)
    sky.addColorStop(0, level.sky)
    sky.addColorStop(1, level.horizon)
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
    this.drawStars(ctx)
    this.drawWorld(ctx)
    ctx.save()
    ctx.translate(-this.camera, 0)
    this.drawPlatforms(ctx)
    this.drawPickups(ctx)
    for (const enemy of this.enemies) if (!enemy.dead) this.drawEnemy(ctx, enemy)
    if (this.boss && !this.boss.dead) this.drawBoss(ctx, this.boss)
    for (const projectile of this.projectiles) this.drawProjectile(ctx, projectile)
    for (const projectile of this.heroProjectiles) this.drawHeroProjectile(ctx, projectile)
    this.drawPlayer(ctx)
    this.drawParticles(ctx)
    ctx.restore()
    this.drawSceneLabels(ctx)
    ctx.restore()
  }

  drawStars(ctx) {
    for (let i = 0; i < 54; i += 1) {
      const x = ((i * 193.7 - this.camera * (i % 3 === 0 ? 0.07 : 0.025)) % WIDTH + WIDTH) % WIDTH
      const y = (i * 83.3) % 310
      ctx.globalAlpha = 0.22 + ((Math.sin(this.frame * 1.4 + i) + 1) * 0.16)
      ctx.fillStyle = i % 7 === 0 ? '#ffca76' : '#d5e5ff'
      ctx.fillRect(x, y, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1)
    }
    ctx.globalAlpha = 1
  }

  drawWorld(ctx) {
    const level = this.level
    ctx.save()
    ctx.translate(-this.camera * 0.28, 0)
    const base = Math.floor(this.camera * 0.28 / 120) * 120
    for (let x = base - 120; x < base + WIDTH + 240; x += 120) {
      const height = 115 + Math.abs(Math.sin(x * 0.038)) * 150
      ctx.fillStyle = level.horizon
      ctx.fillRect(x, FLOOR - height, 94, height)
      ctx.fillStyle = 'rgba(230, 202, 141, 0.24)'
      for (let wx = x + 12; wx < x + 80; wx += 18) for (let wy = FLOOR - height + 18; wy < FLOOR - 16; wy += 22) ctx.fillRect(wx, wy, 4, 7)
    }
    ctx.restore()
    ctx.fillStyle = level.ground
    ctx.fillRect(0, FLOOR, WIDTH, HEIGHT - FLOOR)
    ctx.fillStyle = level.accent
    ctx.globalAlpha = 0.6
    ctx.fillRect(0, FLOOR, WIDTH, 3)
    ctx.globalAlpha = 1
    for (let i = 0; i < 12; i += 1) {
      const x = ((i * 109 - this.camera * 0.72) % WIDTH + WIDTH) % WIDTH
      ctx.fillStyle = 'rgba(255,255,255,0.07)'
      ctx.fillRect(x, FLOOR + 18 + (i % 3) * 18, 44 + (i % 4) * 13, 2)
    }
  }

  drawPlatforms(ctx) {
    for (const platform of this.platforms) {
      ctx.fillStyle = this.level.accent
      ctx.globalAlpha = 0.78
      ctx.fillRect(platform.x, platform.y, platform.w, 3)
      ctx.globalAlpha = 1
      ctx.fillStyle = 'rgba(10, 14, 28, 0.72)'
      ctx.fillRect(platform.x, platform.y + 3, platform.w, platform.h - 3)
      ctx.fillStyle = 'rgba(255,255,255,0.12)'
      ctx.fillRect(platform.x + 8, platform.y + 8, platform.w - 16, 1)
    }
  }

  drawPickups(ctx) {
    for (const pickup of this.pickups) {
      if (pickup.taken) continue
      const size = 8 + Math.sin(pickup.pulse) * 2
      ctx.save()
      ctx.shadowColor = '#7ce5ff'
      ctx.shadowBlur = 18
      ctx.translate(pickup.x, pickup.y + Math.sin(pickup.pulse * 0.7) * 5)
      ctx.rotate(Math.PI / 4)
      ctx.fillStyle = '#b7f4ff'
      ctx.fillRect(-size / 2, -size / 2, size, size)
      ctx.restore()
    }
  }

  drawPlayer(ctx) {
    const p = this.player
    if (p.invulnerable > 0 && Math.floor(this.frame * 15) % 2 === 0) return
    const mid = p.x + p.w / 2
    const bob = p.grounded ? Math.sin(this.frame * 11) * 2 : -2
    ctx.save()
    ctx.translate(mid, p.y + p.h)
    ctx.scale(p.facing, 1)
    ctx.translate(-mid, -(p.y + p.h))
    const color = this.hero.color
    const action = p.attackPose > performance.now() / 1000
    ctx.shadowColor = this.hero.accent
    ctx.shadowBlur = action ? 22 : 8
    if (this.hero.id === 'spiderman') {
      ctx.fillStyle = 'rgba(223, 69, 75, 0.85)'
      ctx.beginPath(); ctx.moveTo(mid - 8, p.y + 24 + bob); ctx.lineTo(mid - 42, p.y + 58); ctx.lineTo(mid - 4, p.y + 49); ctx.fill()
    }
    ctx.fillStyle = color
    ctx.beginPath(); ctx.roundRect(mid - 15, p.y + 20 + bob, 30, 30, this.hero.id === 'hulk' ? 8 : 13); ctx.fill()
    ctx.fillStyle = this.hero.accent
    ctx.fillRect(mid - 9, p.y + 30 + bob, 18, 3)
    ctx.beginPath(); ctx.arc(mid, p.y + 11 + bob, this.hero.id === 'hulk' ? 12 : 10, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#101827'
    ctx.fillRect(mid - 6, p.y + 9 + bob, 4, 3)
    ctx.fillRect(mid + 2, p.y + 9 + bob, 4, 3)
    ctx.shadowBlur = 0
    ctx.strokeStyle = color
    ctx.lineWidth = 7
    ctx.lineCap = 'round'
    const stride = p.grounded && Math.abs(p.vx) > 0 ? Math.sin(this.frame * 18) * 8 : 0
    ctx.beginPath(); ctx.moveTo(mid - 7, p.y + 47 + bob); ctx.lineTo(mid - 9 + stride, p.y + 61); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(mid + 7, p.y + 47 + bob); ctx.lineTo(mid + 9 - stride, p.y + 61); ctx.stroke()
    ctx.lineWidth = 6
    ctx.beginPath(); ctx.moveTo(mid - 13, p.y + 27 + bob); ctx.lineTo(mid - 24, p.y + 39 + bob); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(mid + 13, p.y + 27 + bob); ctx.lineTo(mid + (action ? 38 : 22), p.y + (action ? 27 : 38) + bob); ctx.stroke()
    ctx.restore()
  }

  drawEnemy(ctx, enemy) {
    ctx.save()
    ctx.translate(enemy.x, enemy.y)
    ctx.globalAlpha = enemy.hitFlash ? 0.55 + enemy.hitFlash : 1
    ctx.shadowColor = this.level.accent
    ctx.shadowBlur = 10
    ctx.fillStyle = '#3e5366'
    ctx.beginPath(); ctx.roundRect(4, 8, 32, 31, 7); ctx.fill()
    ctx.fillStyle = enemy.hitFlash ? '#fff' : this.level.accent
    ctx.fillRect(10, 17, 20, 5)
    ctx.shadowBlur = 0
    ctx.fillStyle = '#192331'
    ctx.fillRect(7, 39, 8, 5); ctx.fillRect(27, 39, 8, 5)
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(1, -3, 38, 4)
    ctx.fillStyle = '#ff655b'; ctx.fillRect(1, -3, 38 * Math.max(0, enemy.hp / enemy.maxHp), 4)
    ctx.restore()
  }

  drawBoss(ctx, boss) {
    ctx.save()
    ctx.translate(boss.x, boss.y)
    const pulse = 1 + Math.sin(this.frame * 5) * 0.025
    ctx.translate(boss.w / 2, boss.h)
    ctx.scale(pulse, 1 / pulse)
    ctx.translate(-boss.w / 2, -boss.h)
    ctx.shadowColor = this.level.bossColor
    ctx.shadowBlur = 26
    ctx.fillStyle = boss.hitFlash ? '#fff' : this.level.bossColor
    ctx.beginPath(); ctx.moveTo(41, 5); ctx.lineTo(72, 22); ctx.lineTo(78, 70); ctx.lineTo(61, 102); ctx.lineTo(20, 102); ctx.lineTo(4, 70); ctx.lineTo(10, 22); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#171a2a'
    ctx.beginPath(); ctx.moveTo(41, 22); ctx.lineTo(61, 32); ctx.lineTo(64, 67); ctx.lineTo(41, 83); ctx.lineTo(18, 67); ctx.lineTo(21, 32); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#fff0bd'
    ctx.shadowBlur = 12
    ctx.fillRect(23, 39, 12, 4); ctx.fillRect(47, 39, 12, 4)
    ctx.restore()
  }

  drawProjectile(ctx, projectile) {
    const gradient = ctx.createRadialGradient(projectile.x + 10, projectile.y + 9, 2, projectile.x + 10, projectile.y + 9, 20)
    gradient.addColorStop(0, '#fff3d4')
    gradient.addColorStop(0.35, this.level.bossColor)
    gradient.addColorStop(1, 'rgba(166, 96, 238, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(projectile.x - 12, projectile.y - 10, 40, 38)
  }

  drawHeroProjectile(ctx, projectile) {
    ctx.save()
    ctx.translate(projectile.x + projectile.w / 2, projectile.y + projectile.h / 2)
    if (projectile.kind === 'hammer') {
      ctx.rotate(this.frame * 14)
      ctx.shadowColor = '#eacb76'
      ctx.shadowBlur = 18
      ctx.fillStyle = '#d9e3ef'
      ctx.fillRect(-10, -8, 20, 16)
      ctx.fillStyle = '#9b6b45'
      ctx.fillRect(-2, 5, 5, 15)
    } else {
      ctx.shadowColor = projectile.kind === 'spiderman' ? '#bdeeff' : '#f8d17a'
      ctx.shadowBlur = 18
      ctx.fillStyle = projectile.kind === 'spiderman' ? '#dff8ff' : '#ffe3a2'
      ctx.beginPath()
      ctx.ellipse(0, 0, projectile.w / 2, projectile.h / 2, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  drawParticles(ctx) {
    for (const particle of this.particles) {
      ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1)
      ctx.fillStyle = particle.color
      ctx.shadowColor = particle.color
      ctx.shadowBlur = 12
      ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalAlpha = 1
    ctx.shadowBlur = 0
    for (const label of this.floatingText) {
      ctx.globalAlpha = clamp(label.life * 1.5, 0, 1)
      ctx.font = '700 14px sans-serif'
      ctx.fillStyle = label.color
      ctx.fillText(label.text, label.x, label.y)
    }
    ctx.globalAlpha = 1
  }

  drawSceneLabels(ctx) {
    ctx.fillStyle = 'rgba(255,255,255,0.62)'
    ctx.font = '700 11px sans-serif'
    ctx.letterSpacing = '2px'
    ctx.fillText(this.level.region, 26, 34)
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.fillRect(26, 45, 80, 1)
    const progress = this.player.x / (this.level.length - this.player.w)
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(WIDTH - 170, 29, 144, 3)
    ctx.fillStyle = this.level.accent; ctx.fillRect(WIDTH - 170, 29, 144 * progress, 3)
    ctx.font = '600 10px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.64)'; ctx.textAlign = 'right'; ctx.fillText(`${Math.round(progress * 100)}%`, WIDTH - 26, 49); ctx.textAlign = 'left'
    if (this.gravityAnomaly) {
      ctx.fillStyle = '#d7bbff'
      ctx.font = '700 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('GRAVITY ANOMALY', WIDTH / 2, 34)
      ctx.textAlign = 'left'
    }
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    this.resizeObserver.disconnect()
    this.audio.dispose()
  }
}