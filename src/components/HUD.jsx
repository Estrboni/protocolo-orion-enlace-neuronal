import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { BLOCK_COSTS_MAP } from '../store/programSlice'
import { LEVELS } from '../levels/levelData'

export default function HUD({ onRun, onStop, onReset, onNext }) {
  const { status, bot, currentLevel, levelData, collectedNodes, score } = useSelector(s => s.game)
  const { blocks } = useSelector(s => s.program)
  const [hoveredLevel, setHoveredLevel] = useState(null)

  const memoryUsed = blocks.reduce((acc, b) => acc + (BLOCK_COSTS_MAP[b.type] || 8), 0)
  const memoryTotal = levelData?.memoryBuffer ?? 128
  const memPct = Math.min(100, (memoryUsed / memoryTotal) * 100)
  const memColor = memPct > 90 ? '#ff0040' : memPct > 70 ? '#ffb000' : '#00ff41'
  const memStatus = memPct > memoryTotal ? '⚠' : memPct > 80 ? '⚡' : '✓'

  const energyPct = bot.energy
  const energyColor = energyPct < 20 ? '#ff0040' : energyPct < 50 ? '#ffb000' : '#00ff41'

  const nodesTotal = levelData?.dataNodes?.length ?? 0
  const nodesCollected = collectedNodes.length
  const nodeStatus = nodesCollected === nodesTotal ? '✓' : nodesCollected > 0 ? '→' : '○'

  const dirNames = ['▲ N', '▶ E', '▼ S', '◀ W']
  const dirColors = ['#00d4ff', '#00ff41', '#ffb000', '#bf00ff']

  return (
    <div style={{
      background: '#050f05',
      borderBottom: '2px solid #003300',
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      flexWrap: 'wrap',
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      boxShadow: 'inset 0 0 10px #00ff4110'
    }}>
      {/* Title */}
      <div style={{ 
        color: '#00ff41', 
        fontFamily: 'var(--font-display)', 
        fontSize: 'clamp(14px, 3vw, 20px)', 
        letterSpacing: 4, 
        textShadow: '0 0 15px #00ff41, 0 0 30px #00ff4155',
        marginRight: 8,
        animation: 'flicker 8s infinite'
      }}>
        ORIÓN
      </div>

      {/* Level Info with Tooltip */}
      <div style={{ position: 'relative' }}>
        <div style={{ color: '#006622', letterSpacing: 2 }}>
          LVL <span style={{ color: '#ffb000', fontWeight: 'bold' }}>{String(currentLevel + 1).padStart(2, '0')}</span>
          {' '}<span style={{ color: '#004400' }}>—</span>{' '}
          <span 
            style={{ color: '#00ff41', cursor: 'help', borderBottom: '1px dotted #003300' }}
            onMouseEnter={() => setHoveredLevel(currentLevel)}
            onMouseLeave={() => setHoveredLevel(null)}
          >
            {levelData?.name}
          </span>
        </div>
        {hoveredLevel !== null && (
          <div style={{
            position: 'absolute', top: '100%', left: 0,
            background: '#0a0a0a', border: '1px solid #00ff41', padding: '6px 8px',
            fontSize: 8, color: '#ffb000', whiteSpace: 'nowrap', zIndex: 100,
            marginTop: 4, boxShadow: '0 0 10px #00ff4133'
          }}>
            {levelData?.description}
          </div>
        )}
      </div>

      <div style={{ width: 1, height: 20, background: '#003300' }} />

      {/* Memory Bar with Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#006622' }}>{memStatus} MEM</span>
        <div style={{ 
          width: 100, height: 9, background: '#001100', 
          border: '1px solid #003300', borderRadius: 2,
          overflow: 'hidden', boxShadow: 'inset 0 0 4px #00000055'
        }}>
          <div style={{ 
            width: `${memPct}%`, height: '100%', background: memColor, 
            transition: 'all 0.2s', boxShadow: `inset 0 0 2px ${memColor}, 0 0 8px ${memColor}` 
          }} />
        </div>
        <span style={{ color: memColor, fontWeight: memPct > 80 ? 'bold' : 'normal', minWidth: 50 }}>{memoryUsed}/{memoryTotal}KB</span>
      </div>

      {/* Energy Bar with Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#006622' }}>⚡ PWR</span>
        <div style={{ 
          width: 70, height: 9, background: '#001100', 
          border: '1px solid #003300', borderRadius: 2,
          overflow: 'hidden', boxShadow: 'inset 0 0 4px #00000055'
        }}>
          <div style={{ 
            width: `${energyPct}%`, height: '100%', background: energyColor, 
            transition: 'all 0.15s', boxShadow: `0 0 8px ${energyColor}` 
          }} />
        </div>
        <span style={{ color: energyColor, fontWeight: energyPct < 30 ? 'bold' : 'normal', minWidth: 40 }}>{bot.energy.toFixed(0)}%</span>
      </div>

      {/* Bot Position */}
      <div style={{ color: '#006622', display: 'flex', gap: 6, alignItems: 'center' }}>
        <span>POS</span>
        <span style={{ color: '#00d4ff', fontFamily: 'var(--font-display)', fontWeight: 'bold' }}>[{bot.x},{bot.y}]</span>
        <span style={{ color: dirColors[bot.direction], fontWeight: 'bold', minWidth: 32 }}>{dirNames[bot.direction]}</span>
      </div>

      {/* Node Collection Status */}
      <div style={{ color: '#006622', display: 'flex', gap: 4, alignItems: 'center' }}>
        <span>{nodeStatus} NODES</span>
        <span style={{ color: '#00ff41', fontWeight: 'bold' }}>{nodesCollected}/{nodesTotal}</span>
      </div>

      {/* Score */}
      <div style={{ color: '#006622' }}>
        💾 <span style={{ color: '#ffb000', fontWeight: 'bold' }}>{score}</span>
      </div>

      {/* Memory Overflow Warning */}
      {memoryUsed > memoryTotal && (
        <div style={{ 
          color: '#ff0040', 
          animation: 'blink 0.4s infinite', 
          letterSpacing: 2, 
          fontSize: 10,
          fontWeight: 'bold'
        }}>
          ⚠ BUFFER OVERFLOW
        </div>
      )}

      {/* Status Badge */}
      <div style={{
        marginLeft: 'auto',
        padding: '3px 8px',
        background: status === 'running' ? '#1a001a' : '#001a00',
        border: `1px solid ${status === 'running' ? '#ff0040' : '#00ff41'}`,
        color: status === 'running' ? '#ff0040' : '#00ff41',
        fontSize: 9,
        letterSpacing: 2,
        borderRadius: 2,
        fontWeight: 'bold'
      }}>
        {status === 'running' ? '► RUNNING' : '■ IDLE'}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8 }}>
        {status === 'running' ? (
          <button onClick={onStop} className="danger" style={{ fontSize: 10, padding: '5px 14px', cursor: 'pointer' }}>■ HALT</button>
        ) : (
          <button onClick={onRun}
            disabled={memoryUsed > memoryTotal}
            style={{ 
              fontSize: 10, padding: '5px 14px', borderColor: '#00ff41', color: '#00ff41',
              cursor: memoryUsed > memoryTotal ? 'not-allowed' : 'pointer',
              opacity: memoryUsed > memoryTotal ? 0.4 : 1
            }}>
            ▶ EXEC
          </button>
        )}
        <button onClick={onReset} style={{ fontSize: 10, padding: '5px 14px', borderColor: '#ffb000', color: '#ffb000', cursor: 'pointer' }}>↺ RST</button>
      </div>
    </div>
  )
}
