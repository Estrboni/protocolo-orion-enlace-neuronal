import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { BLOCK_COSTS_MAP } from '../store/programSlice'
import { LEVELS } from '../levels/levelData'

export default function HUD({ onRun, onStop, onReset, onNext }) {
  const { status, bot, currentLevel, levelData, collectedNodes, score } = useSelector(s => s.game)
  const { blocks } = useSelector(s => s.program)
  const [hoveredControl, setHoveredControl] = useState(null)

  const memoryUsed = blocks.reduce((acc, b) => acc + (BLOCK_COSTS_MAP[b.type] || 8), 0)
  const memoryTotal = levelData?.memoryBuffer ?? 128
  const memPct = Math.min(100, (memoryUsed / memoryTotal) * 100)
  const memColor = memPct > 90 ? '#ff0040' : memPct > 70 ? '#ffb000' : '#00ff41'

  const energyPct = bot.energy
  const energyColor = energyPct < 20 ? '#ff0040' : energyPct < 50 ? '#ffb000' : '#00ff41'

  const nodesTotal = levelData?.dataNodes?.length ?? 0
  const nodesCollected = collectedNodes.length

  const dirNames = ['▲ N', '▶ E', '▼ S', '◀ W']

  const controls = [
    { id: 'exec', label: 'EXEC', onClick: onRun, disabled: memoryUsed > memoryTotal, color: '#00ff41', hint: 'Execute program' },
    { id: 'halt', label: 'HALT', onClick: onStop, disabled: status !== 'running', color: '#ff0040', hint: 'Stop execution', show: status === 'running' },
    { id: 'reset', label: 'RST', onClick: onReset, color: '#ffb000', hint: 'Reset level' },
  ]

  return (
    <div style={{
      background: '#050f05',
      borderBottom: '1px solid #003300',
      padding: '6px 12px',
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      gap: 16,
      alignItems: 'center',
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      width: '100%',
      overflowX: 'auto',
      minHeight: 50
    }}>
      {/* Title + Level */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, whiteSpace: 'nowrap' }}>
        <div style={{ color: '#00ff41', fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: 4, textShadow: '0 0 10px #00ff41' }}>
          ORIÓN
        </div>
        <div style={{ color: '#006622', letterSpacing: 2, fontSize: 9 }}>
          LVL <span style={{ color: '#ffb000' }}>{String(currentLevel + 1).padStart(2, '0')}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 12,
        alignItems: 'center'
      }}>
        {/* Memory */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#006622', fontSize: 9 }}>MEM</span>
          <div style={{ width: 60, height: 6, background: '#001100', border: '1px solid #003300', borderRadius: 2, minWidth: 60 }}>
            <div style={{ width: `${memPct}%`, height: '100%', background: memColor, transition: 'all 0.3s', boxShadow: `0 0 6px ${memColor}` }} />
          </div>
          <span style={{ color: memColor, fontSize: 8 }}>{memoryUsed}/{memoryTotal}</span>
        </div>

        {/* Energy */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#006622', fontSize: 9 }}>PWR</span>
          <div style={{ width: 50, height: 6, background: '#001100', border: '1px solid #003300', borderRadius: 2, minWidth: 50 }}>
            <div style={{ width: `${energyPct}%`, height: '100%', background: energyColor, transition: 'all 0.3s' }} />
          </div>
          <span style={{ color: energyColor, fontSize: 8 }}>{bot.energy.toFixed(0)}%</span>
        </div>

        {/* Nodes */}
        <div style={{ color: '#006622', fontSize: 9 }}>
          NODES <span style={{ color: '#00ff41' }}>{nodesCollected}/{nodesTotal}</span>
        </div>

        {/* Score */}
        <div style={{ color: '#006622', fontSize: 9 }}>
          SCORE <span style={{ color: '#ffb000' }}>{score}</span>
        </div>
      </div>

      {/* Memory overflow warning */}
      {memoryUsed > memoryTotal && (
        <div style={{ color: '#ff0040', animation: 'blink 0.5s infinite', letterSpacing: 2, fontSize: 9, whiteSpace: 'nowrap' }}>
          ⚠ OVERFLOW
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 6, position: 'relative' }}>
        {controls.map(ctrl => {
          if (ctrl.show === false) return null
          return (
            <div key={ctrl.id} style={{ position: 'relative' }}>
              <button
                onClick={ctrl.onClick}
                disabled={ctrl.disabled}
                onMouseEnter={() => setHoveredControl(ctrl.id)}
                onMouseLeave={() => setHoveredControl(null)}
                style={{
                  fontSize: 9,
                  padding: '4px 10px',
                  borderColor: ctrl.color,
                  color: ctrl.color,
                  background: hoveredControl === ctrl.id && !ctrl.disabled ? `${ctrl.color}22` : 'transparent',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                  cursor: ctrl.disabled ? 'not-allowed' : 'pointer',
                  opacity: ctrl.disabled ? 0.3 : 1
                }}
              >
                {ctrl.label}
              </button>
              {hoveredControl === ctrl.id && !ctrl.disabled && (
                <div style={{
                  position: 'absolute',
                  bottom: -28,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#000',
                  border: `1px solid ${ctrl.color}`,
                  color: ctrl.color,
                  padding: '2px 6px',
                  fontSize: 8,
                  whiteSpace: 'nowrap',
                  zIndex: 10,
                  pointerEvents: 'none'
                }}>
                  {ctrl.hint}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
