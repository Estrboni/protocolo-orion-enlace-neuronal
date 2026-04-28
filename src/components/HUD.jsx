import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { pauseExecution, resumeExecution } from '../store/gameSlice'
import { BLOCK_COSTS_MAP } from '../store/programSlice'
import { LEVELS } from '../levels/levelData'

export default function HUD({ onRun, onStop, onReset, onNext }) {
  const dispatch = useDispatch()
  const { status, bot, currentLevel, levelData, collectedNodes, score } = useSelector(s => s.game)
  const { blocks } = useSelector(s => s.program)

  const memoryUsed = blocks.reduce((acc, b) => acc + (BLOCK_COSTS_MAP[b.type] || 8), 0)
  const memoryTotal = levelData?.memoryBuffer ?? 128
  const memPct = Math.min(100, (memoryUsed / memoryTotal) * 100)
  const memColor = memPct > 90 ? '#ff0040' : memPct > 70 ? '#ffb000' : '#00ff41'

  const energyPct = bot.energy
  const energyColor = energyPct < 20 ? '#ff0040' : energyPct < 50 ? '#ffb000' : '#00ff41'

  const nodesTotal = levelData?.dataNodes?.length ?? 0
  const nodesCollected = collectedNodes.length

  const dirNames = ['▲ N', '▶ E', '▼ S', '◀ W']
  const isOverflow = memoryUsed > memoryTotal

  return (
    <div style={{
      background: '#050f05',
      borderBottom: '1px solid #003300',
      padding: 'clamp(4px, 1vw, 8px)',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 'clamp(8px, 2vw, 16px)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'clamp(8px, 1.5vw, 11px)',
      minHeight: 'auto'
    }}>
      {/* Title */}
      <div style={{ color: '#00ff41', fontFamily: 'var(--font-display)', fontSize: 'clamp(14px, 2vw, 20px)', letterSpacing: 4, textShadow: '0 0 10px #00ff41' }}>
        ORIÓN
      </div>

      {/* Level — hide on very small screens */}
      <div style={{ color: '#006622', letterSpacing: 2, display: window.innerWidth < 600 ? 'none' : 'block' }}>
        LVL <span style={{ color: '#ffb000' }}>{String(currentLevel + 1).padStart(2, '0')}</span>
        <span style={{ color: '#004400' }}> — </span>
        <span style={{ color: '#00ff41' }}>{levelData?.name}</span>
      </div>

      {/* Memory */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#006622' }}>MEM</span>
        <div style={{ width: 60, height: 6, background: '#001100', border: '1px solid #003300', borderRadius: 2 }}>
          <div style={{ width: `${memPct}%`, height: '100%', background: memColor, transition: 'all 0.3s', boxShadow: `0 0 6px ${memColor}` }} />
        </div>
        <span style={{ color: memColor, fontSize: 'clamp(7px, 1.2vw, 10px)' }}>{memoryUsed}KB</span>
      </div>

      {/* Energy */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#006622' }}>PWR</span>
        <div style={{ width: 50, height: 6, background: '#001100', border: '1px solid #003300', borderRadius: 2 }}>
          <div style={{ width: `${energyPct}%`, height: '100%', background: energyColor, transition: 'all 0.3s' }} />
        </div>
        <span style={{ color: energyColor, fontSize: 'clamp(7px, 1.2vw, 10px)' }}>{bot.energy.toFixed(0)}%</span>
      </div>

      {/* Nodes — hide on small screens */}
      <div style={{ color: '#006622', display: window.innerWidth < 500 ? 'none' : 'block' }}>
        NODES <span style={{ color: '#00ff41' }}>{nodesCollected}/{nodesTotal}</span>
      </div>

      {/* Score */}
      <div style={{ color: '#006622' }}>
        <span style={{ color: '#ffb000', fontWeight: 'bold' }}>{score}</span>
      </div>

      {/* Warning */}
      {isOverflow && (
        <div style={{ color: '#ff0040', animation: 'blink 0.5s infinite', letterSpacing: 1, fontSize: 'clamp(7px, 1.2vw, 10px)' }}>
          ⚠ OVERFLOW
        </div>
      )}

      {/* Controls */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {status === 'running' ? (
          <>
            <button onClick={() => dispatch(pauseExecution())} style={{ fontSize: 'clamp(8px, 1.2vw, 10px)', padding: '4px 10px', borderColor: '#ffb000', color: '#ffb000', minWidth: 'auto' }}>⏸ PAUSE</button>
            <button onClick={onStop} className="danger" style={{ fontSize: 'clamp(8px, 1.2vw, 10px)', padding: '4px 10px', minWidth: 'auto' }}>■ HALT</button>
          </>
        ) : status === 'paused' ? (
          <>
            <button onClick={() => dispatch(resumeExecution())} style={{ fontSize: 'clamp(8px, 1.2vw, 10px)', padding: '4px 10px', borderColor: '#00ff41', color: '#00ff41', minWidth: 'auto' }}>▶ RESUME</button>
            <button onClick={onStop} className="danger" style={{ fontSize: 'clamp(8px, 1.2vw, 10px)', padding: '4px 10px', minWidth: 'auto' }}>■ STOP</button>
          </>
        ) : (
          <button onClick={onRun} disabled={isOverflow} style={{ fontSize: 'clamp(8px, 1.2vw, 10px)', padding: '4px 10px', borderColor: '#00ff41', color: '#00ff41', minWidth: 'auto' }}>▶ EXEC</button>
        )}
        <button onClick={onReset} style={{ fontSize: 'clamp(8px, 1.2vw, 10px)', padding: '4px 10px', borderColor: '#ffb000', color: '#ffb000', minWidth: 'auto' }}>↺</button>
      </div>
    </div>
  )
}
