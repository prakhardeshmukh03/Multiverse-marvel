import { useEffect, useRef, useState } from 'react'
import GameCanvas from './game/GameCanvas'
import { AudioManager } from './game/audio'
import { ACHIEVEMENTS, HEROES, LAB_CONCEPTS, LEVELS } from './game/config'
import './App.css'

const heroes = [
  { id: 'ironman', name: 'IRON MAN', title: 'The armored vanguard', color: '#e74338', hp: 82, power: 88, speed: 68, ability: 'Arc Lance', mark: 'I' },
  { id: 'spiderman', name: 'SPIDER-MAN', title: 'The skyline phantom', color: '#47b5e8', hp: 68, power: 72, speed: 96, ability: 'Web Burst', mark: 'S' },
  { id: 'thor', name: 'THOR', title: 'Storm of the nine realms', color: '#eabf56', hp: 88, power: 94, speed: 62, ability: 'Stormcall', mark: 'T' },
  { id: 'hulk', name: 'HULK', title: 'The unstoppable force', color: '#83c97e', hp: 100, power: 100, speed: 55, ability: 'Ragequake', mark: 'H' },
]

function App() {
  const [screen, setScreen] = useState('menu')
  const [heroIndex, setHeroIndex] = useState(0)
  const [stageIndex, setStageIndex] = useState(0)
  const [muted, setMuted] = useState(false)
  const [difficulty, setDifficulty] = useState('STANDARD')
  const hero = heroes[heroIndex]
  const unlockedHeroes = new Set(JSON.parse(localStorage.getItem('chaos-unlocked-heroes') || '["ironman","spiderman"]'))
  const menuAudio = useRef(null)
  const inGame = screen === 'game'

  useEffect(() => {
    if (inGame) return undefined
    const audio = new AudioManager()
    const startMusic = () => audio.startMusic('menu')
    menuAudio.current = audio
    window.addEventListener('pointerdown', startMusic, { once: true })
    window.addEventListener('keydown', startMusic, { once: true })
    return () => {
      window.removeEventListener('pointerdown', startMusic)
      window.removeEventListener('keydown', startMusic)
      audio.dispose()
      menuAudio.current = null
    }
  }, [inGame])

  useEffect(() => menuAudio.current?.setMuted(muted), [muted])

  return (
    <main className="app-shell">
      <div className="starfield" aria-hidden="true" />
      <header className="topbar">
        <button className="wordmark" onClick={() => setScreen('menu')} aria-label="Return to main menu">
          <span className="wordmark-symbol">M</span><span>MM<span className="wordmark-dot">:</span>C</span>
        </button>
        <div className="topbar-right"><span className="status"><i /> MULTIVERSE SIGNAL: UNSTABLE</span><button className="sound-toggle" onClick={() => setMuted(!muted)} aria-label={muted ? 'Unmute audio' : 'Mute audio'}>{muted ? 'SOUND OFF' : 'SOUND ON'}</button></div>
      </header>

      {screen === 'menu' && <section className="menu-screen">
        <div className="menu-copy">
          <p className="eyebrow"><span /> A REALITY-ENDING EVENT</p>
          <h1>MARVEL<br /><em>MULTIVERSE</em><br />CHAOS<span className="title-period">.</span></h1>
          <p className="menu-description">Every universe is under attack. Choose your champion, master their power, and fight your way to the heart of the collapse.</p>
          <div className="menu-actions"><button className="primary-button" onClick={() => setScreen('select')}><span>▶</span> STORY MODE</button><button className="text-button" onClick={() => setScreen('lab')}>MULTIMEDIA LAB <span>↗</span></button></div>
          <nav className="menu-secondary"><button onClick={() => setScreen('missions')}>MISSIONS</button><button onClick={() => setScreen('records')}>HIGH SCORES</button><button onClick={() => setScreen('settings')}>SETTINGS</button><button onClick={() => { setHeroIndex(0); setStageIndex(0); setScreen('briefing') }}>QUICK DEPLOY</button></nav>
          <div className="menu-meta"><span>4 CHAMPIONS</span><b>·</b><span>4 DIMENSIONS</span><b>·</b><span>1 LAST CHANCE</span></div>
        </div>
        <div className="portal-scene" aria-label="An animated cosmic portal">
          <div className="portal-halo halo-one" /><div className="portal-halo halo-two" /><div className="portal-core" />
          <div className="hero-silhouette"><div className="figure-head" /><div className="figure-body" /><div className="figure-cape" /></div>
          <span className="portal-coordinate">EARTH-616 <i>///</i> BREACH 04</span>
        </div>
        <div className="menu-index"><span>01</span><i /> THE COLLAPSE BEGINS</div>
      </section>}

      {screen === 'select' && <section className="selection-screen">
        <div className="section-heading"><p className="eyebrow"><span /> CHOOSE YOUR CHAMPION</p><h2>WHO ANSWERS<br /><em>THE CALL?</em></h2></div>
        <div className="hero-grid">{heroes.map((item, index) => { const unlocked = unlockedHeroes.has(item.id); return <button key={item.name} disabled={!unlocked} className={`hero-card ${index === heroIndex ? 'selected' : ''} ${unlocked ? '' : 'locked'}`} style={{ '--hero-color': item.color }} onClick={() => setHeroIndex(index)}>
          <div className="card-art"><div className="card-rings" /><div className="card-avatar"><span>{item.mark}</span></div><i className="card-index">{unlocked ? `0${index + 1}` : 'LOCKED'}</i></div>
          <div className="card-details"><strong>{item.name}</strong><small>{item.title}</small><div className="stat-row"><span>VITALITY</span><i><b style={{ width: `${item.hp}%` }} /></i><b>{item.hp}</b></div><div className="stat-row"><span>POWER</span><i><b style={{ width: `${item.power}%` }} /></i><b>{item.power}</b></div><div className="stat-row"><span>SPEED</span><i><b style={{ width: `${item.speed}%` }} /></i><b>{item.speed}</b></div><div className="ability-line">{unlocked ? `✦  ${item.ability}` : index === 2 ? 'LOCKED · DEFEAT A BOSS' : 'LOCKED · CLEAR 3 DIMENSIONS'}</div></div>
        </button> })}</div>
        <div className="selection-footer"><button className="text-button" onClick={() => setScreen('menu')}>← BACK</button><span>CHAMPION SELECTED: <b style={{ color: hero.color }}>{hero.name}</b></span><button className="primary-button" onClick={() => setScreen('missions')}>LOCK IN <span>→</span></button></div>
      </section>}

      {screen === 'missions' && <section className="missions-screen"><div className="section-heading"><p className="eyebrow"><span /> SELECT A DIMENSION</p><h2>FOUR WORLDS.<br /><em>ONE COLLAPSE.</em></h2></div><div className="mission-grid">{LEVELS.map((level, index) => <button key={level.name} className={`mission-card mission-${index + 1}`} onClick={() => { setStageIndex(index); setScreen('briefing') }}><span>0{index + 1} / {level.region}</span><strong>{level.name}</strong><small>THREAT: {level.boss}</small><i>DEPLOY →</i></button>)}</div><div className="selection-footer"><button className="text-button" onClick={() => setScreen('select')}>← CHOOSE CHAMPION</button><span>CHAMPION: <b style={{ color: hero.color }}>{hero.name}</b></span><button className="text-button" onClick={() => setScreen('menu')}>MAIN MENU</button></div></section>}

      {screen === 'briefing' && <section className="briefing-screen"><p className="eyebrow"><span /> INCOMING TRANSMISSION // S.H.I.E.L.D.</p><h2>THE SKY IS<br /><em>BREAKING.</em></h2><p className="briefing-text">A wave of rifts has torn open the boundaries between realities. Ultron's machines are sweeping the city while a presence beyond the stars gathers power. Four worlds. One source. No backup.</p><div className="mission-strip"><span>MISSION 0{stageIndex + 1} // {LEVELS[stageIndex].region}</span><strong>{LEVELS[stageIndex].name}</strong><small>DEFEAT {LEVELS[stageIndex].BOSS || LEVELS[stageIndex].boss} · COLLECT COSMIC SHARDS · SURVIVE THE BOSS</small></div><div className="briefing-actions"><button className="text-button" onClick={() => setScreen('missions')}>← CHANGE MISSION</button><button className="primary-button" onClick={() => setScreen('game')}>DEPLOY <span>→</span></button></div></section>}

      {screen === 'game' && <GameCanvas key={`${heroIndex}-${stageIndex}`} hero={HEROES[heroIndex]} startingLevel={stageIndex} difficulty={difficulty.toLowerCase()} muted={muted} onMute={() => setMuted(!muted)} onExit={() => setScreen('menu')} />}

      {screen === 'records' && <section className="records-screen"><p className="eyebrow"><span /> MULTIVERSE ARCHIVE</p><h2>LEGENDS<br /><em>REMEMBERED.</em></h2><div className="record-list"><div><span>CAMPAIGN HIGH SCORE</span><strong>{Number(localStorage.getItem('chaos-high-score') || 0).toLocaleString()}</strong></div><div><span>FURTHEST DIMENSION REACHED</span><strong>{Math.min(4, Number(localStorage.getItem('chaos-level-unlock') || 0) + 1)} / 4</strong></div><div><span>CHAMPION LAST SELECTED</span><strong>{hero.name}</strong></div></div><h3 className="achievement-heading">ACHIEVEMENTS <span>{JSON.parse(localStorage.getItem('chaos-achievements') || '[]').length} / {ACHIEVEMENTS.length}</span></h3><div className="achievement-list">{ACHIEVEMENTS.map((achievement) => { const earned = JSON.parse(localStorage.getItem('chaos-achievements') || '[]').includes(achievement.id); return <article className={earned ? 'earned' : ''} key={achievement.id}><span>{earned ? '✦' : '○'}</span><div><strong>{achievement.title}</strong><small>{achievement.description}</small></div></article> })}</div><button className="text-button" onClick={() => setScreen('menu')}>← MAIN MENU</button></section>}

      {screen === 'settings' && <section className="settings-screen"><p className="eyebrow"><span /> CONFIGURE YOUR RUN</p><h2>YOUR RULES.<br /><em>YOUR REALITY.</em></h2><div className="setting-row"><div><strong>DIFFICULTY</strong><small>Adjust enemy pressure and resilience.</small></div><div className="segmented-control">{['CASUAL', 'STANDARD', 'HEROIC'].map((option) => <button key={option} className={difficulty === option ? 'active' : ''} onClick={() => setDifficulty(option)}>{option}</button>)}</div></div><div className="setting-row"><div><strong>MASTER AUDIO</strong><small>Sound begins after your first interaction.</small></div><button className="setting-toggle" onClick={() => setMuted(!muted)}>{muted ? 'MUTED' : 'ON'}</button></div><button className="text-button" onClick={() => setScreen('menu')}>← APPLY & RETURN</button></section>}

      {screen === 'lab' && <section className="lab-screen"><div className="section-heading"><p className="eyebrow"><span /> MULTIMEDIA LAB EXPLAINED</p><h2>THE SCIENCE<br /><em>OF THE SHOW.</em></h2></div><div className="lab-grid">{LAB_CONCEPTS.map(([concept, explanation], index) => <article key={concept}><span>{String(index + 1).padStart(2, '0')}</span><h3>{concept}</h3><p>{explanation}</p></article>)}</div><button className="text-button" onClick={() => setScreen('menu')}>← MAIN MENU</button></section>}

      <footer className="site-footer"><span>AN ORIGINAL MULTIVERSE ARCADE EXPERIENCE</span><span>© 2026 · MULTIMEDIA LAB</span><span className="footer-coordinate">EARTH-616 / 04.11.26</span></footer>
    </main>
  )
}

export default App
