import { useEffect, useRef, useState } from 'react'
import { GameEngine } from './GameEngine'
import './game.css'

const emptyState = { hp: 100, maxHp: 100, energy: 35, score: 0, lives: 3, combo: 0, kills: 0, shards: 0, bossesDefeated: 0, level: { name: 'NEW YORK CITY', region: 'EARTH-616' }, hero: null, boss: null, paused: false, stageClear: false, gameOver: false, victory: false, specialCooldown: 0, specialMax: 4, ultimateCooldown: 0, ultimateMax: 12 }

function GameCanvas({ hero, startingLevel = 0, difficulty = 'standard', muted, onMute, onExit }) {
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const [game, setGame] = useState(emptyState)
  const [volume, setVolume] = useState(28)

  useEffect(() => {
    const engine = new GameEngine(canvasRef.current, hero.id, (next) => {
      setGame(next)
      const current = Number(localStorage.getItem('chaos-high-score') || 0)
      if (next.score > current) localStorage.setItem('chaos-high-score', String(next.score))
      if (next.levelIndex > Number(localStorage.getItem('chaos-level-unlock') || 0)) localStorage.setItem('chaos-level-unlock', String(next.levelIndex))
      const clearedWorlds = new Set(JSON.parse(localStorage.getItem('chaos-cleared-worlds') || '[]'))
      for (const index of next.clearedLevels || []) clearedWorlds.add(index)
      localStorage.setItem('chaos-cleared-worlds', JSON.stringify([...clearedWorlds]))
      const unlockedHeroes = new Set(JSON.parse(localStorage.getItem('chaos-unlocked-heroes') || '["ironman","spiderman"]'))
      if (clearedWorlds.size >= 1) unlockedHeroes.add('thor')
      if (clearedWorlds.size >= 3 || next.victory) unlockedHeroes.add('hulk')
      localStorage.setItem('chaos-unlocked-heroes', JSON.stringify([...unlockedHeroes]))
      const unlocked = new Set(JSON.parse(localStorage.getItem('chaos-achievements') || '[]'))
      if (next.kills >= 1) unlocked.add('first-blood')
      if (next.shards >= 5) unlocked.add('shard-hunter')
      if (next.bossesDefeated >= 1) unlocked.add('boss-breaker')
      if (clearedWorlds.size >= 3) unlocked.add('rift-walker')
      if (next.victory) unlocked.add('reality-saver')
      localStorage.setItem('chaos-achievements', JSON.stringify([...unlocked]))
    }, startingLevel, difficulty)
    engineRef.current = engine
    return () => {
      engine.dispose()
      engineRef.current = null
    }
  }, [hero.id, startingLevel, difficulty])

  useEffect(() => engineRef.current?.audio.setMuted(muted), [muted])
  useEffect(() => engineRef.current?.audio.setVolume(volume / 100), [volume])

  const control = (action) => ({
    onPointerDown: (event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); engineRef.current?.setPointerAction(action, true) },
    onPointerUp: (event) => { event.preventDefault(); engineRef.current?.setPointerAction(action, false) },
    onPointerCancel: () => engineRef.current?.setPointerAction(action, false),
    onContextMenu: (event) => event.preventDefault(),
  })

  const restart = () => {
    engineRef.current?.resetLevel(true)
    setGame((current) => ({ ...current, paused: false, gameOver: false, stageClear: false, victory: false }))
  }

  const progress = (value, max) => `${Math.max(0, Math.min(100, (value / max) * 100))}%`
  const highScore = Number(localStorage.getItem('chaos-high-score') || 0)

  return <section className="game-screen">
    <div className="game-hud">
      <div className="hud-hero"><span className="hud-mark" style={{ '--hero-color': hero.color }}>{hero.name.slice(0, 1)}</span><div><strong>{hero.name}</strong><small>{game.level?.name || 'NEW YORK CITY'}</small></div></div>
      <div className="hud-bars"><div className="hud-meter"><span>VITALITY</span><i className="meter-track"><b className="health-fill" style={{ width: progress(game.hp, game.maxHp) }} /></i></div><div className="hud-meter"><span>COSMIC ENERGY</span><i className="meter-track"><b className="energy-fill" style={{ width: `${game.energy}%` }} /></i></div></div>
      <div className="hud-score"><small>SCORE</small><strong>{String(game.score).padStart(6, '0')}</strong>{game.combo > 1 && <span>{game.combo}× COMBO</span>}</div>
      <div className="hud-lives"><small>RESERVE</small><strong>{'◆ '.repeat(game.lives || 0)}</strong></div>
      <button className="pause-button" onClick={() => engineRef.current?.togglePause()} aria-label="Pause game">Ⅱ</button>
    </div>
    {game.boss && <div className="boss-meter"><div><span>THREAT DETECTED</span><strong>{game.boss.name}</strong></div><i><b style={{ width: progress(game.boss.hp, game.boss.maxHp) }} /></i></div>}
    <div className="canvas-frame"><canvas ref={canvasRef} aria-label="Side-scrolling superhero combat game" /></div>
    <div className="game-bottom"><div className="ability-indicators"><button className="ability-indicator" onClick={() => engineRef.current?.attack('special')}><span>K</span><i><b style={{ width: game.specialCooldown ? `${100 - game.specialCooldown / game.specialMax * 100}%` : '100%' }} /></i><small>{hero.special}</small></button><button className="ability-indicator ultimate" onClick={() => engineRef.current?.attack('ultimate')}><span>L</span><i><b style={{ width: game.ultimateCooldown ? `${100 - game.ultimateCooldown / game.ultimateMax * 100}%` : `${game.energy}%` }} /></i><small>{hero.ultimate}</small></button><span className="desktop-hint">A / D MOVE &nbsp;·&nbsp; SPACE JUMP &nbsp;·&nbsp; J ATTACK</span></div><label className="volume-control">AUDIO <input type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} aria-label="Audio volume" /><button onClick={onMute}>{muted ? 'OFF' : 'ON'}</button></label></div>
    <div className="touch-controls"><div className="touch-direction"><button {...control('left')} aria-label="Move left">←</button><button {...control('right')} aria-label="Move right">→</button></div><div className="touch-actions"><button {...control('jump')} aria-label="Jump">↑</button><button {...control('basic')} aria-label="Attack">J</button><button {...control('special')} aria-label="Special attack">K</button><button {...control('ultimate')} aria-label="Ultimate attack">L</button></div></div>
    {(game.paused || game.stageClear || game.gameOver || game.victory) && <div className="game-overlay"><div className="overlay-panel"><p className="eyebrow"><span /> {game.victory ? 'REALITY RESTORED' : game.gameOver ? 'SIGNAL LOST' : game.stageClear ? 'THREAT NEUTRALIZED' : 'CAMPAIGN PAUSED'}</p><h2>{game.victory ? 'THE MULTIVERSE\nENDURES.' : game.gameOver ? 'HERO DOWN.' : game.stageClear ? 'WORLD\nSECURED.' : 'TAKE A\nBREATHER.'}</h2><p>{game.victory ? `Final score ${game.score.toLocaleString()} · High score ${highScore.toLocaleString()}` : game.gameOver ? `Score ${game.score.toLocaleString()} · Best ${highScore.toLocaleString()}` : game.stageClear ? `${game.level?.name} cleared. The rift is opening to the next dimension.` : 'Your fight is still here when you are ready.'}</p><div className="overlay-actions">{game.stageClear && !game.victory && <button className="primary-button" onClick={() => engineRef.current?.advanceLevel()}>NEXT DIMENSION <span>→</span></button>}{game.victory && <button className="primary-button" onClick={onExit}>RETURN TO BASE <span>→</span></button>}{game.gameOver && <button className="primary-button" onClick={restart}>RESTART CAMPAIGN <span>↻</span></button>}{game.paused && <button className="primary-button" onClick={() => engineRef.current?.togglePause(false)}>RESUME FIGHT <span>→</span></button>}<button className="text-button" onClick={onExit}>EXIT TO MENU</button></div></div></div>}
  </section>
}

export default GameCanvas