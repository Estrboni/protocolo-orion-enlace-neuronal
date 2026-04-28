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
      fontSize: 10,
      minHeight: 40
    }}>
      {/* Title */}
      <div style={{
        color: '#00ff41',
        fontFamily: 'var(--font-display)',
        fontSize: 18,
        letterSpacing: 4,
        textShadow: '0 0 10px #00ff41',
        marginRight: 8,
        userSelect: 'none'
      }}>
        ORIÓN
      </div>

      {/* Level */}
      <div style={{ color: '#006622', letterSpacing: 2, userSelect: 'none' }}>
        LVL <span style={{ color: '#ffb000' }}>{String(currentLevel + 1).padStart(2, '0')}</span>
        {' '}<span style={{ color: '#004400' }}>—</span>{' '}
        <span style={{ color: '#00ff41', textShadow: '0 0 5px #00ff41' }}>{levelData?.name}</span>
      </div>

      <div style={{ width: 1, height: 20, background: '#003300' }} />

      {/* Memory */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 140 }}>
        <span style={{ color: '#006622', minWidth: 32 }}>MEM</span>
        <div style={{
          width: 80, height: 8, background: '#001100', border: '1px solid #003300', borderRadius: 2,
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${memPct}%`, height: '100%', background: memColor,
            transition: 'all 0.2s', boxShadow: `inset 0 0 4px ${memColor}`
          }} />
        </div>
        <span style={{ color: memColor, minWidth: 55, fontSize: 9 }}>{memoryUsed}/{memoryTotal}KB</span>
      </div>

      {/* Energy */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 120 }}>
        <span style={{ color: '#006622', minWidth: 32 }}>PWR</span>
        <div style={{
          width: 60, height: 8, background: '#001100', border: '1px solid #003300', borderRadius: 2,
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${energyPct}%`, height: '100%', background: energyColor,
            transition: 'all 0.2s', boxShadow: `inset 0 0 4px ${energyColor}`
          }} />
        </div>
        <span style={{ color: energyColor, minWidth: 32, fontSize: 9 }}>{bot.energy.toFixed(0)}%</span>
      </div>

      {/* Bot position */}
      <div style={{ color: '#006622', userSelect: 'none' }}>
        POS <span style={{ color: '#00d4ff', fontFamily: 'monospace' }}>[{bot.x},{bot.y}]</span>
        {' '}<span style={{ color: '#ffb000' }}>{dirNames[bot.direction]}</span>
      </div>

      {/* Nodes collected */}
      <div style={{ color: '#006622', userSelect: 'none' }}>
        NODES <span style={{ color: '#00ff41', fontWeight: 'bold' }}>{nodesCollected}/{nodesTotal}</span>
      </div>

      {/* Score */}
      <div style={{ color: '#006622', userSelect: 'none' }}>
        SCORE <span style={{ color: '#ffb000' }}>{score.toString().padStart(6, '0')}</span>
      </div>

      {/* Memory overflow warning */}
      {memoryUsed > memoryTotal && (
        <div style={{
          color: '#ff0040',
          animation: 'blink 0.6s infinite',
          letterSpacing: 2,
          fontSize: 10,
          marginLeft: 4,
          fontWeight: 'bold'
        }}>
          ⚠ BUFFER_OVERFLOW
        </div>
      )}

      {/* Status indicator */}
      <div style={{
        color: status === 'running' ? '#00ff41' : '#006622',
        fontSize: 8,
        letterSpacing: 1,
        marginLeft: 'auto',
        userSelect: 'none'
      }}>
        [{status.toUpperCase()}]
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8 }}>
        {status === 'running' ? (
          <button
            onClick={onStop}
            className="danger"
            style={{ fontSize: 10, padding: '4px 12px' }}
            data-tooltip="Halt execution"
          >
            ■ HALT
          </button>
        ) : (
          <button
            onClick={onRun}
            disabled={memoryUsed > memoryTotal}
            style={{ fontSize: 10, padding: '4px 12px', borderColor: '#00ff41', color: '#00ff41' }}
            data-tooltip={memoryUsed > memoryTotal ? 'Memory overflow' : 'Execute program'}
          >
            ▶ EXEC
          </button>
        )}
        <button
          onClick={onReset}
          style={{ fontSize: 10, padding: '4px 12px', borderColor: '#ffb000', color: '#ffb000' }}
          data-tooltip="Reset level"
        >
          ↺ RST
        </button>
      </div>
    </div>
  )
}
