import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { BLOCK_COSTS_MAP } from '../store/programSlice'
import { LEVELS } from '../levels/levelData'

export default function HUD({ onRun, onStop, onReset, onNext }) {
  const { status, bot, currentLevel, levelData, collectedNodes, score } = useSelector(s => s.game)
  const { blocks } = useSelector(s => s.program)
  const [showOverflowHint, setShowOverflowHint] = useState(false)

  const memoryUsed = blocks.reduce((acc, b) => acc + (BLOCK_COSTS_MAP[b.type] || 8), 0)
  const memoryTotal = levelData?.memoryBuffer ?? 128
  const memPct = Math.min(100, (memoryUsed / memoryTotal) * 100)
  const memColor = memPct > 90 ? '#ff0040' : memPct > 70 ? '#ffb000' : '#00ff41'
  const memOverflow = memoryUsed > memoryTotal

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
      fontSize: 10,
      minHeight: 32
    }}>
      {/* Title */}
      <div style={{ color: '#00ff41', fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: 4, textShadow: '0 0 10px #00ff41', marginRight: 8 }}>
        ORIÓN
      </div>

      {/* Level */}
      <div style={{ color: '#006622', letterSpacing: 2 }}>
        LVL <span style={{ color: '#ffb000' }}>{String(currentLevel + 1).padStart(2, '0')}</span>
        {' '}<span style={{ color: '#004400' }}>—</span>{' '}
        <span style={{ color: '#00ff41', fontSize: 9 }}>{levelData?.name}</span>
      </div>

      <div style={{ width: 1, height: 20, background: '#003300' }} />

      {/* Memory with tooltip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}
        onMouseEnter={() => memOverflow && setShowOverflowHint(true)}
        onMouseLeave={() => setShowOverflowHint(false)}>
        <span style={{ color: '#006622' }}>MEM</span>
        <div style={{ width: 80, height: 8, background: '#001100', border: '1px solid #003300', borderRadius: 2, position: 'relative' }}>
          <div style={{ width: `${memPct}%`, height: '100%', background: memColor, transition: 'all 0.3s', boxShadow: `0 0 6px ${memColor}` }} />
          {memOverflow && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,0,64,0.3) 4px, rgba(255,0,64,0.3) 8px)',
              animation: 'shimmer 2s infinite'
            }} />
          )}
        </div>
        <span style={{ color: memColor, fontSize: 9 }}>{memoryUsed}/{memoryTotal}KB</span>
        {memOverflow && showOverflowHint && (
          <div style={{
            position: 'absolute', bottom: -32, left: 0,
            background: '#ff004077', color: '#ff0040', padding: '4px 8px', fontSize: 8,
            border: '1px solid #ff0040', whiteSpace: 'nowrap', zIndex: 100,
            textShadow: '0 0 5px #ff0040'
          }}>
            BUFFER OVERFLOW — remove blocks
          </div>
        )}
      </div>

      {/* Energy */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#006622' }}>PWR</span>
        <div style={{ width: 60, height: 8, background: '#001100', border: '1px solid #003300', borderRadius: 2 }}>
          <div style={{ width: `${energyPct}%`, height: '100%', background: energyColor, transition: 'all 0.3s' }} />
        </div>
        <span style={{ color: energyColor, fontSize: 9 }}>{bot.energy.toFixed(0)}%</span>
      </div>

      {/* Bot position */}
      <div style={{ color: '#006622', fontSize: 9 }}>
        POS <span style={{ color: '#00d4ff' }}>[{bot.x},{bot.y}]</span>
        {' '}<span style={{ color: '#ffb000' }}>{dirNames[bot.direction]}</span>
      </div>

      {/* Nodes */}
      <div style={{ color: '#006622', fontSize: 9 }}>
        NODES <span style={{ color: '#00ff41' }}>{nodesCollected}/{nodesTotal}</span>
      </div>

      {/* Score */}
      <div style={{ color: '#006622', fontSize: 9 }}>
        SCR <span style={{ color: '#ffb000' }}>{score}</span>
      </div>

      {/* Controls */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        {status === 'running' ? (
          <button onClick={onStop} className="danger" style={{ fontSize: 10, padding: '4px 12px' }}>■ HALT</button>
        ) : (
          <button onClick={onRun}
            disabled={memOverflow}
            style={{ fontSize: 10, padding: '4px 12px', borderColor: '#00ff41', color: '#00ff41' }}
            title="SPACE to execute">
            ▶ EXEC
          </button>
        )}
        <button onClick={onReset} style={{ fontSize: 10, padding: '4px 12px', borderColor: '#ffb000', color: '#ffb000' }} title="CTRL+R to reset">↺ RST</button>
      </div>
    </div>
  )
}
