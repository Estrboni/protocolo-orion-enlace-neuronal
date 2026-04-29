import React, { useMemo, useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { BLOCK_COSTS_MAP } from '../store/programSlice'

const HUD = React.memo(function HUD({ onRun, onStop, onReset, onNext }) {
  const { status, bot, currentLevel, levelData, collectedNodes, score } = useSelector(s => s.game)
  const { blocks } = useSelector(s => s.program)
  const [prevScore, setPrevScore] = useState(score)
  const [scoreFlash, setScoreFlash] = useState(false)

  useEffect(() => {
    if (score !== prevScore) {
      setScoreFlash(true)
      setPrevScore(score)
      setTimeout(() => setScoreFlash(false), 800)
    }
  }, [score, prevScore])

  const totalNodes = levelData?.dataNodes?.length ?? 0
  const energyPct = Math.round((bot.energy / 100) * 100)
  const energyColor = bot.energy < 25 ? '#ff0040' : bot.energy < 50 ? '#ffb000' : '#00ff41'

  const totalCost = useMemo(() =>
    blocks.reduce((sum, b) => sum + (BLOCK_COSTS_MAP[b.type] ?? 0), 0), [blocks])

  const running = status === 'running'
  const idle = status === 'idle'
  const won = status === 'won'
  const lost = status === 'game_over'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      gap: 6, padding: '6px 8px', background: '#020902'
    }}>

      {/* Level badge */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid #003300', paddingBottom: 5
      }}>
        <span style={{ fontSize: 9, letterSpacing: 3, color: '#006622' }}>LEVEL</span>
        <span style={{
          fontFamily: "'VT323', monospace", fontSize: 22, color: '#00ff41',
          textShadow: '0 0 10px #00ff41'
        }}>{String(currentLevel + 1).padStart(2, '0')}</span>
        <span style={{
          fontSize: 9, letterSpacing: 2,
          color: scoreFlash ? '#00ff41' : '#006622',
          textShadow: scoreFlash ? '0 0 10px #00ff41' : 'none',
          transition: 'all 0.2s'
        }}>
          {score.toString().padStart(6, '0')} PTS
        </span>
      </div>

      {/* Energy bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#006622', marginBottom: 3, letterSpacing: 2 }}>
          <span>ENERGY</span>
          <span style={{ color: energyColor }}>{energyPct}%</span>
        </div>
        <div style={{ height: 6, background: '#001a00', borderRadius: 2, overflow: 'hidden', border: '1px solid #002200' }}>
          <div style={{
            height: '100%', width: `${energyPct}%`,
            background: energyColor,
            boxShadow: `0 0 6px ${energyColor}`,
            transition: 'width 0.3s ease, background 0.3s',
            borderRadius: 2
          }} />
        </div>
      </div>

      {/* Node collection */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 8, letterSpacing: 2, color: '#006622' }}>DATA NODES</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: totalNodes }).map((_, i) => (
            <div key={i} style={{
              width: 10, height: 10,
              background: i < collectedNodes.length ? '#00ff41' : '#001a00',
              border: `1px solid ${i < collectedNodes.length ? '#00ff41' : '#003300'}`,
              boxShadow: i < collectedNodes.length ? '0 0 6px #00ff41' : 'none',
              borderRadius: 2,
              transition: 'all 0.2s'
            }} />
          ))}
        </div>
      </div>

      {/* Bot stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4,
        fontSize: 8, color: '#006622', letterSpacing: 1
      }}>
        <div style={{ background: '#010601', border: '1px solid #002200', padding: '3px 5px', borderRadius: 2 }}>
          <div>POS</div>
          <div style={{ color: '#00ff41', fontFamily: 'monospace', fontSize: 10 }}>
            {bot.x},{bot.y}
          </div>
        </div>
        <div style={{ background: '#010601', border: '1px solid #002200', padding: '3px 5px', borderRadius: 2 }}>
          <div>DIR</div>
          <div style={{ color: '#00d4ff', fontSize: 10 }}>
            {['▶ E','▼ S','◀ W','▲ N'][bot.direction] ?? '?'}
          </div>
        </div>
        <div style={{ background: '#010601', border: '1px solid #002200', padding: '3px 5px', borderRadius: 2 }}>
          <div>PROG COST</div>
          <div style={{ color: totalCost > bot.energy ? '#ff0040' : '#ffb000', fontSize: 10 }}>
            {totalCost} E
          </div>
        </div>
        <div style={{ background: '#010601', border: '1px solid #002200', padding: '3px 5px', borderRadius: 2 }}>
          <div>BLOCKS</div>
          <div style={{ color: '#bf00ff', fontSize: 10 }}>
            {blocks.length}
          </div>
        </div>
      </div>

      {/* Status badge */}
      <div style={{
        textAlign: 'center', fontSize: 9, letterSpacing: 3, padding: '3px 0',
        color: running ? '#00ff41' : won ? '#ffb000' : lost ? '#ff0040' : '#006622',
        textShadow: running ? '0 0 8px #00ff41' : won ? '0 0 8px #ffb000' : lost ? '0 0 8px #ff0040' : 'none',
        borderTop: '1px solid #002200', borderBottom: '1px solid #002200',
        animation: running ? 'flicker 3s infinite' : 'none'
      }}>
        {running ? '⚙ EXECUTING...' : won ? '✓ LEVEL CLEAR' : lost ? '✗ TERMINATED' : '■ STANDBY'}
      </div>

      {/* Control buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 'auto' }}>
        {won ? (
          <button onClick={onNext} style={{ letterSpacing: 2, fontSize: 10, padding: '7px 0' }}>
            ▶ NEXT LEVEL
          </button>
        ) : lost ? (
          <button onClick={onReset} className="danger" style={{ letterSpacing: 2, fontSize: 10, padding: '7px 0' }}>
            ↺ RETRY
          </button>
        ) : running ? (
          <button onClick={onStop} className="danger" style={{ letterSpacing: 2, fontSize: 10, padding: '7px 0' }}>
            ■ ABORT
          </button>
        ) : (
          <>
            <button onClick={onRun} disabled={blocks.length === 0} style={{ letterSpacing: 2, fontSize: 10, padding: '7px 0' }}>
              ▶ EXECUTE
            </button>
            <button onClick={onReset} style={{ letterSpacing: 1, fontSize: 9, padding: '5px 0', opacity: 0.7 }}>
              ↺ RESET
            </button>
          </>
        )}
      </div>

      {/* System info footer */}
      <div style={{ fontSize: 7, color: '#003300', letterSpacing: 1, textAlign: 'center', marginTop: 4 }}>
        PROTOCOLO-ORION v2.0 // ENLACE-NEURONAL
      </div>
    </div>
  )
})

export default HUD
