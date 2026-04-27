import React from 'react'
import { useSelector } from 'react-redux'
import { BLOCK_COSTS_MAP } from '../store/programSlice'
import { LEVELS } from '../levels/levelData'

export default function HUD({ onRun, onStop, onReset, onNext }) {
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

  return (
    <div style={{
      background: '#050f05',
      borderBottom: '1px solid #003300',
      padding: '6px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      flexWrap: 'wrap',
      fontFamily: 'var(--font-mono)',
      fontSize: 10
    }}>
      {/* Title */}
      <div style={{ color: '#00ff41', fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: 4, textShadow: '0 0 10px #00ff41', marginRight: 8 }}>
        ORIÓN
      </div>

      {/* Level */}
      <div style={{ color: '#006622', letterSpacing: 2 }}>
        LVL <span style={{ color: '#ffb000' }}>{String(currentLevel + 1).padStart(2, '0')}</span>
        {' '}<span style={{ color: '#004400' }}>—</span>{' '}
        <span style={{ color: '#00ff41' }}>{levelData?.name}</span>
      </div>

      <div style={{ width: 1, height: 20, background: '#003300' }} />

      {/* Memory */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#006622' }}>MEM</span>
        <div style={{ width: 80, height: 8, background: '#001100', border: '1px solid #003300', borderRadius: 2 }}>
          <div style={{ width: `${memPct}%`, height: '100%', background: memColor, transition: 'all 0.3s', boxShadow: `0 0 6px ${memColor}` }} />
        </div>
        <span style={{ color: memColor }}>{memoryUsed}KB/{memoryTotal}KB</span>
      </div>

      {/* Energy */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#006622' }}>PWR</span>
        <div style={{ width: 60, height: 8, background: '#001100', border: '1px solid #003300', borderRadius: 2 }}>
          <div style={{ width: `${energyPct}%`, height: '100%', background: energyColor, transition: 'all 0.3s' }} />
        </div>
        <span style={{ color: energyColor }}>{bot.energy.toFixed(0)}%</span>
      </div>

      {/* Bot position */}
      <div style={{ color: '#006622' }}>
        POS <span style={{ color: '#00d4ff' }}>[{bot.x},{bot.y}]</span>
        {' '}<span style={{ color: '#ffb000' }}>{dirNames[bot.direction]}</span>
      </div>

      {/* Nodes */}
      <div style={{ color: '#006622' }}>
        NODES <span style={{ color: '#00ff41' }}>{nodesCollected}/{nodesTotal}</span>
      </div>

      {/* Score */}
      <div style={{ color: '#006622' }}>
        SCR <span style={{ color: '#ffb000' }}>{score}</span>
      </div>

      {/* Memory overflow warning */}
      {memoryUsed > memoryTotal && (
        <div style={{ color: '#ff0040', animation: 'blink 0.5s infinite', letterSpacing: 2, fontSize: 10 }}>
          ⚠ BUFFER OVERFLOW
        </div>
      )}

      {/* Controls */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        {status === 'running' ? (
          <button onClick={onStop} className="danger" style={{ fontSize: 10, padding: '4px 12px' }}>■ HALT</button>
        ) : (
          <button onClick={onRun}
            disabled={memoryUsed > memoryTotal}
            style={{ fontSize: 10, padding: '4px 12px', borderColor: '#00ff41', color: '#00ff41' }}>
            ▶ EXEC
          </button>
        )}
        <button onClick={onReset} style={{ fontSize: 10, padding: '4px 12px', borderColor: '#ffb000', color: '#ffb000' }}>↺ RST</button>
      </div>
    </div>
  )
}
