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
  const memStatus = memoryUsed > memoryTotal ? 'OVERFLOW' : memPct > 85 ? 'CRITICAL' : memPct > 70 ? 'WARNING' : 'NORMAL'

  const energyPct = bot.energy
  const energyColor = energyPct < 20 ? '#ff0040' : energyPct < 50 ? '#ffb000' : '#00ff41'
  const energyStatus = energyPct < 10 ? 'CRITICAL' : energyPct < 30 ? 'LOW' : 'OK'

  const nodesTotal = levelData?.dataNodes?.length ?? 0
  const nodesCollected = collectedNodes.length
  const nodesRemaining = nodesTotal - nodesCollected

  const dirNames = ['▲ N', '▶ E', '▼ S', '◀ W']
  const levelName = levelData?.name ?? 'UNKNOWN'
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <div style={{
      background: '#050f05',
      borderBottom: '1px solid #003300',
      padding: isMobile ? '4px 8px' : '6px 12px',
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr auto auto auto auto auto auto',
      gap: isMobile ? 8 : 16,
      flexWrap: 'wrap',
      fontFamily: 'var(--font-mono)',
      fontSize: isMobile ? 9 : 10,
      alignItems: 'center'
    }}>
      {/* Title */}
      <div style={{ 
        color: '#00ff41', 
        fontFamily: 'var(--font-display)', 
        fontSize: isMobile ? 14 : 18, 
        letterSpacing: 4, 
        textShadow: '0 0 10px #00ff41', 
        whiteSpace: 'nowrap',
        gridColumn: isMobile ? '1' : 'auto'
      }}>
        ORIÓN
      </div>

      {/* Level info */}
      <div style={{ 
        color: '#006622', 
        letterSpacing: 2,
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        gridColumn: isMobile ? '1' : 'auto'
      }}>
        <span>LVL</span>
        <span style={{ color: '#ffb000', fontWeight: 'bold' }}>{String(currentLevel + 1).padStart(2, '0')}</span>
        <span style={{ color: '#004400' }}>—</span>
        <span style={{ color: '#00ff41', fontSize: isMobile ? 8 : 10 }}>{isMobile ? 'LV' + (currentLevel + 1) : levelName}</span>
      </div>

      {isMobile && <div style={{ gridColumn: '1' }} />}

      {/* Memory bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 6,
        gridColumn: isMobile ? '1' : 'auto'
      }}>
        <span style={{ color: '#006622' }}>MEM</span>
        <div style={{ width: isMobile ? 60 : 80, height: 8, background: '#001100', border: '1px solid #003300', borderRadius: 2 }}>
          <div style={{ 
            width: `${Math.min(100, memPct)}%`, 
            height: '100%', 
            background: memColor, 
            transition: 'all 0.3s', 
            boxShadow: `0 0 6px ${memColor}`,
            borderRadius: 1
          }} />
        </div>
        <span style={{ 
          color: memColor, 
          fontSize: isMobile ? 8 : 10,
          minWidth: isMobile ? 50 : 70,
          fontWeight: memoryUsed > memoryTotal ? 'bold' : 'normal'
        }}>
          {memoryUsed}/{memoryTotal}KB
        </span>
        {memoryUsed > memoryTotal && (
          <span style={{ color: '#ff0040', fontSize: 8, animation: 'blink 0.5s infinite', fontWeight: 'bold' }}>⚠</span>
        )}
      </div>

      {/* Energy bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 6,
        gridColumn: isMobile ? '1' : 'auto'
      }}>
        <span style={{ color: '#006622' }}>PWR</span>
        <div style={{ width: isMobile ? 50 : 60, height: 8, background: '#001100', border: '1px solid #003300', borderRadius: 2 }}>
          <div style={{ 
            width: `${energyPct}%`, 
            height: '100%', 
            background: energyColor, 
            transition: 'all 0.3s',
            borderRadius: 1
          }} />
        </div>
        <span style={{ color: energyColor, fontSize: isMobile ? 8 : 10, minWidth: 30 }}>
          {bot.energy.toFixed(0)}%
        </span>
      </div>

      {/* Nodes */}
      <div style={{ 
        color: '#006622',
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        gridColumn: isMobile ? '1' : 'auto'
      }}>
        <span>◆</span>
        <span style={{ color: '#00ff41' }}>{nodesCollected}/{nodesTotal}</span>
      </div>

      {/* Score */}
      <div style={{ 
        color: '#006622',
        gridColumn: isMobile ? '1' : 'auto'
      }}>
        <span style={{ color: '#ffb000' }}>§ {score}</span>
      </div>

      {/* Position */}
      <div style={{ 
        color: '#006622',
        display: 'flex',
        gap: 6,
        gridColumn: isMobile ? '1' : 'auto'
      }}>
        <span>[@]</span>
        <span style={{ color: '#00d4ff' }}>[{bot.x},{bot.y}]</span>
      </div>

      {/* Controls */}
      <div style={{ 
        marginLeft: isMobile ? '0' : 'auto', 
        display: 'flex', 
        gap: 8,
        gridColumn: isMobile ? '1' : 'auto',
        justifyContent: 'flex-end'
      }}>
        {status === 'running' ? (
          <button onClick={onStop} className="danger" style={{ fontSize: isMobile ? 9 : 10, padding: isMobile ? '3px 10px' : '4px 12px' }}>■ HALT</button>
        ) : (
          <button onClick={onRun}
            disabled={memoryUsed > memoryTotal}
            data-tip="Run the program"
            style={{ fontSize: isMobile ? 9 : 10, padding: isMobile ? '3px 10px' : '4px 12px', borderColor: '#00ff41', color: '#00ff41' }}>
            ▶ EXEC
          </button>
        )}
        <button onClick={onReset} 
          data-tip="Restart level"
          style={{ fontSize: isMobile ? 9 : 10, padding: isMobile ? '3px 10px' : '4px 12px', borderColor: '#ffb000', color: '#ffb000' }}>
          ↺ RST
        </button>
      </div>
    </div>
  )
}
