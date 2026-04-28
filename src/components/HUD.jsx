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
  const isOverflow = memoryUsed > memoryTotal

  return (
    <div style={{
      background: '#050f05',
      borderBottom: '1px solid #003300',
      padding: 'clamp(4px, 1vw, 8px)',
      display: 'flex',
      alignItems: 'center',
      gap: 'clamp(8px, 2vw, 16px)',
      flexWrap: 'wrap',
      fontFamily: 'var(--font-mono)',
      fontSize: 'clamp(8px, 1.5vw, 12px)',
      animation: 'vignette 6s ease-in-out infinite'
    }}>
      {/* Title */}
      <div style={{
        color: '#00ff41',
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(14px, 3vw, 20px)',
        letterSpacing: 4,
        textShadow: '0 0 10px #00ff41',
        marginRight: 8,
        whiteSpace: 'nowrap'
      }} role="heading" aria-label="Protocolo Orión">
        ORIÓN
      </div>

      {/* Level */}
      <div style={{ color: '#006622', letterSpacing: 2, whiteSpace: 'nowrap' }}>
        LVL <span style={{ color: '#ffb000' }}>{String(currentLevel + 1).padStart(2, '0')}</span>
        {' '}<span style={{ color: '#004400' }}>—</span>{' '}
        <span style={{ color: '#00ff41' }}>{levelData?.name}</span>
      </div>

      <div style={{ width: 1, height: 20, background: '#003300' }} aria-hidden="true" />

      {/* Memory */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
        <span style={{ color: '#006622' }}>MEM</span>
        <div style={{
          width: 80,
          height: 8,
          background: '#001100',
          border: '1px solid #003300',
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden'
        }}
          role="progressbar"
          aria-valuenow={memoryUsed}
          aria-valuemin={0}
          aria-valuemax={memoryTotal}>
          <div style={{
            width: `${memPct}%`,
            height: '100%',
            background: memColor,
            transition: 'all 0.2s',
            boxShadow: `0 0 6px ${memColor}`,
            position: 'relative'
          }}>
            {isOverflow && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(90deg, transparent, ${memColor}66, transparent)`,
                animation: 'shimmer 1.5s infinite'
              }} />
            )}
          </div>
        </div>
        <span style={{ color: memColor }}>{memoryUsed}KB/{memoryTotal}KB</span>
      </div>

      {/* Energy */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
        <span style={{ color: '#006622' }}>PWR</span>
        <div style={{
          width: 60,
          height: 8,
          background: '#001100',
          border: '1px solid #003300',
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden'
        }}
          role="progressbar"
          aria-valuenow={Math.round(energyPct)}
          aria-valuemin={0}
          aria-valuemax={100}>
          <div style={{
            width: `${energyPct}%`,
            height: '100%',
            background: energyColor,
            transition: 'all 0.3s',
            animation: energyPct < 20 ? 'pulse-red 0.6s infinite' : 'none'
          }} />
        </div>
        <span style={{ color: energyColor, animation: energyPct < 20 ? 'pulse-red 0.6s infinite' : 'none' }}>
          {bot.energy.toFixed(0)}%
        </span>
      </div>

      {/* Bot position */}
      <div style={{ color: '#006622', whiteSpace: 'nowrap' }}>
        POS <span style={{ color: '#00d4ff' }}>[{bot.x},{bot.y}]</span>
        {' '}<span style={{ color: '#ffb000' }}>{dirNames[bot.direction]}</span>
      </div>

      {/* Nodes */}
      <div style={{ color: '#006622', whiteSpace: 'nowrap' }}>
        NODES <span style={{ color: '#00ff41' }}>{nodesCollected}/{nodesTotal}</span>
      </div>

      {/* Score */}
      <div style={{ color: '#006622', whiteSpace: 'nowrap' }}>
        SCR <span style={{ color: '#ffb000' }}>{score}</span>
      </div>

      {/* Memory overflow warning */}
      {isOverflow && (
        <div style={{
          color: '#ff0040',
          animation: 'blink 0.5s infinite',
          letterSpacing: 2,
          fontSize: '10px',
          fontWeight: 'bold'
        }}
          role="alert"
          aria-live="polite">
          ⚠ BUFFER OVERFLOW
        </div>
      )}

      {/* Controls */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, whiteSpace: 'nowrap' }}>
        {status === 'running' ? (
          <button
            onClick={onStop}
            className="danger"
            style={{ fontSize: '10px', padding: '4px 12px' }}
            aria-label="Halt execution">
            ■ HALT
          </button>
        ) : (
          <button
            onClick={onRun}
            disabled={isOverflow}
            style={{ fontSize: '10px', padding: '4px 12px', borderColor: '#00ff41', color: '#00ff41' }}
            aria-label={isOverflow ? 'Cannot execute - buffer overflow' : 'Execute program'}>
            ▶ EXEC
          </button>
        )}
        <button
          onClick={onReset}
          style={{ fontSize: '10px', padding: '4px 12px', borderColor: '#ffb000', color: '#ffb000' }}
          aria-label="Reset level">
          ↺ RST
        </button>
      </div>
    </div>
  )
}
