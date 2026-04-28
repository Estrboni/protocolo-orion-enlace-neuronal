import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { BLOCK_COSTS_MAP } from '../store/programSlice'

const HUD = React.memo(function HUD({ onRun, onStop, onReset, onNext }) {
  const { status, bot, currentLevel, levelData, collectedNodes, score } = useSelector(s => s.game)
  const { blocks } = useSelector(s => s.program)

  const memoryStats = useMemo(() => {
    const used = blocks.reduce((acc, b) => acc + (BLOCK_COSTS_MAP[b.type] || 8), 0)
    const total = levelData?.memoryBuffer ?? 128
    return { used, total, pct: Math.min(100, (used / total) * 100), overflow: used > total }
  }, [blocks, levelData])

  const energyPct = bot.energy
  const energyColor = energyPct < 20 ? '#ff0040' : energyPct < 50 ? '#ffb000' : '#00ff41'

  const nodesTotal = levelData?.dataNodes?.length ?? 0
  const nodesCollected = collectedNodes.length

  const dirNames = ['▲ N', '▶ E', '▼ S', '◀ W']

  return (
    <div style={{
      background: 'linear-gradient(180deg, #050f05 0%, #000 100%)',
      borderBottom: '1px solid #003300',
      padding: '6px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      flexWrap: 'wrap',
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      boxShadow: '0 0 20px #00ff4108'
    }}>
      <div style={{ color: '#00ff41', fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: 4, textShadow: '0 0 10px #00ff41', marginRight: 8 }}>
        ORIÓN
      </div>

      <div style={{ color: '#006622', letterSpacing: 2 }}>
        LVL <span style={{ color: '#ffb000' }}>{String(currentLevel + 1).padStart(2, '0')}</span>
        {' '}<span style={{ color: '#004400' }}>—</span>{' '}
        <span style={{ color: '#00ff41' }}>{levelData?.name}</span>
      </div>

      <div style={{ width: 1, height: 20, background: '#003300' }} />

      {/* Memory with better styling */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#006622', fontWeight: 'bold' }}>MEM</span>
        <div style={{ width: 100, height: 10, background: '#001100', border: '1px solid #003300', borderRadius: 3, overflow: 'hidden', boxShadow: 'inset 0 0 3px #000' }}>
          <div style={{
            width: `${memoryStats.pct}%`,
            height: '100%',
            background: memoryStats.pct > 90 ? '#ff0040' : memoryStats.pct > 70 ? '#ffb000' : '#00ff41',
            transition: 'all 0.2s ease',
            boxShadow: `inset 0 0 2px ${memoryStats.pct > 90 ? '#ff0040' : memoryStats.pct > 70 ? '#ffb000' : '#00ff41'}99`
          }} />
        </div>
        <span style={{ color: memoryStats.overflow ? '#ff0040' : '#006622', fontWeight: memoryStats.overflow ? 'bold' : 'normal' }}>
          {memoryStats.used}KB/{memoryStats.total}KB
        </span>
      </div>

      {/* Energy */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#006622', fontWeight: 'bold' }}>PWR</span>
        <div style={{ width: 80, height: 10, background: '#001100', border: '1px solid #003300', borderRadius: 3, overflow: 'hidden', boxShadow: 'inset 0 0 3px #000' }}>
          <div style={{
            width: `${energyPct}%`,
            height: '100%',
            background: energyColor,
            transition: 'all 0.2s ease',
            boxShadow: `inset 0 0 2px ${energyColor}99`
          }} />
        </div>
        <span style={{ color: energyColor, fontWeight: energyPct < 30 ? 'bold' : 'normal' }}>{bot.energy.toFixed(0)}%</span>
      </div>

      {/* Bot state */}
      <div style={{ color: '#006622' }}>
        <span style={{ color: '#00d4ff', fontFamily: 'var(--font-mono)' }}>[{bot.x},{bot.y}]</span>
        {' '}
        <span style={{ color: '#ffb000' }}>{dirNames[bot.direction]}</span>
      </div>

      {/* Nodes */}
      <div style={{ color: '#006622' }}>
        NODES <span style={{ color: '#00ff41', fontWeight: 'bold' }}>{nodesCollected}/{nodesTotal}</span>
      </div>

      {/* Score */}
      <div style={{ color: '#006622' }}>
        SCR <span style={{ color: '#ffb000', fontWeight: 'bold' }}>{score}</span>
      </div>

      {/* Warning */}
      {memoryStats.overflow && (
        <div style={{ color: '#ff0040', animation: 'blink 0.6s infinite', letterSpacing: 2, fontSize: 9, fontWeight: 'bold', marginLeft: 8 }}>
          ⚠ OVERFLOW
        </div>
      )}

      {/* Controls */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        {status === 'running' ? (
          <button
            onClick={onStop}
            aria-label="Halt execution"
            style={{
              fontSize: 10,
              padding: '4px 12px',
              border: '1px solid #ff0040',
              color: '#ff0040',
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              transition: 'all 0.15s',
              letterSpacing: 2,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#ff0040'; e.currentTarget.style.color = '#000' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ff0040' }}
          >
            ■ HALT
          </button>
        ) : (
          <button
            onClick={onRun}
            disabled={memoryStats.overflow}
            aria-label="Execute program"
            style={{
              fontSize: 10,
              padding: '4px 12px',
              border: '1px solid #00ff41',
              color: '#00ff41',
              background: 'transparent',
              cursor: memoryStats.overflow ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-mono)',
              transition: 'all 0.15s',
              letterSpacing: 2,
              opacity: memoryStats.overflow ? 0.4 : 1,
            }}
            onMouseEnter={e => !memoryStats.overflow && (e.currentTarget.style.background = '#00ff41', e.currentTarget.style.color = '#000')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = '#00ff41')}
          >
            ▶ EXEC
          </button>
        )}
        <button
          onClick={onReset}
          aria-label="Reset level"
          style={{
            fontSize: 10,
            padding: '4px 12px',
            border: '1px solid #ffb000',
            color: '#ffb000',
            background: 'transparent',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            transition: 'all 0.15s',
            letterSpacing: 2,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#ffb000'; e.currentTarget.style.color = '#000' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ffb000' }}
        >
          ↺ RST
        </button>
      </div>
    </div>
  )
})

export default HUD
