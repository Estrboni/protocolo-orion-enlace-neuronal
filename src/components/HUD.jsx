import React from 'react'
import { useSelector } from 'react-redux'
import { BLOCK_COSTS_MAP } from '../store/programSlice'

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
  const nodesPct = (nodesCollected / nodesTotal) * 100

  const dirNames = ['▲', '▶', '▼', '◀']
  const statusColor = status === 'running' ? '#00ff41' : status === 'won' ? '#00ff41' : status === 'lost' ? '#ff0040' : '#006622'

  return (
    <div style={{
      background: 'linear-gradient(to bottom, #050f05, #030905)',
      borderBottom: '2px solid #00ff4133',
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      flexWrap: 'wrap',
      fontFamily: 'var(--font-mono)',
      fontSize: 9
    }}>
      {/* Title + Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ color: '#00ff41', fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: 3, textShadow: '0 0 10px #00ff41' }}>
          ◆
        </div>
        <div>
          <div style={{ color: '#00ff41', letterSpacing: 2, fontSize: 9 }}>PROTOCOLO ORIÓN</div>
          <div style={{ color: '#003300', letterSpacing: 1, fontSize: 7 }}>ENLACE NEURONAL</div>
        </div>
      </div>

      <div style={{ width: 1, height: 24, background: '#003300' }} />

      {/* Level */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#006622', fontSize: 8, letterSpacing: 1 }}>LEVEL</span>
        <div style={{
          background: '#001100',
          border: '1px solid #003300',
          padding: '2px 6px',
          borderRadius: 2,
          color: '#ffb000',
          fontFamily: 'var(--font-display)',
          fontSize: 11
        }}>
          {String(currentLevel + 1).padStart(2, '0')}
        </div>
        <span style={{ color: '#004400', fontSize: 8 }}>{levelData?.name}</span>
      </div>

      <div style={{ width: 1, height: 24, background: '#003300' }} />

      {/* Memory */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#006622', fontSize: 8 }}>MEM</span>
        <div style={{ width: 70, height: 8, background: '#001100', border: '1px solid #003300', borderRadius: 2 }}>
          <div style={{
            width: `${memPct}%`,
            height: '100%',
            background: memColor,
            transition: 'all 0.3s',
            boxShadow: `0 0 6px ${memColor}`,
            borderRadius: 1
          }} />
        </div>
        <span style={{ color: memColor, fontSize: 8 }}>{memoryUsed}/{memoryTotal}KB</span>
        {memPct > 90 && <span style={{ color: '#ff0040', fontSize: 7, animation: 'blink 0.5s infinite' }}>⚠</span>}
      </div>

      {/* Energy */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#006622', fontSize: 8 }}>PWR</span>
        <div style={{ width: 60, height: 8, background: '#001100', border: '1px solid #003300', borderRadius: 2 }}>
          <div style={{
            width: `${energyPct}%`,
            height: '100%',
            background: energyColor,
            transition: 'all 0.2s',
            borderRadius: 1
          }} />
        </div>
        <span style={{ color: energyColor, fontSize: 8 }}>{bot.energy.toFixed(0)}%</span>
      </div>

      {/* Bot pos + direction */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ color: '#006622', fontSize: 8 }}>
          POS <span style={{ color: '#00d4ff', fontFamily: 'var(--font-display)', fontSize: 10 }}>{dirNames[bot.direction]}</span>
        </div>
        <div style={{ color: '#004400', fontSize: 7 }}>[{bot.x},{bot.y}]</div>
      </div>

      {/* Nodes progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#006622', fontSize: 8 }}>NODES</span>
        <div style={{ width: 40, height: 8, background: '#001100', border: '1px solid #003300', borderRadius: 2 }}>
          <div style={{
            width: `${nodesPct}%`,
            height: '100%',
            background: '#00ff41',
            transition: 'all 0.3s',
            borderRadius: 1
          }} />
        </div>
        <span style={{ color: '#00ff41', fontSize: 8 }}>{nodesCollected}/{nodesTotal}</span>
      </div>

      {/* Score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ color: '#006622', fontSize: 8 }}>SCORE</span>
        <span style={{ color: '#ffb000', fontFamily: 'var(--font-display)', fontSize: 11 }}>{score}</span>
      </div>

      {/* Status indicator */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 8, height: 8,
          background: statusColor,
          borderRadius: '50%',
          boxShadow: `0 0 8px ${statusColor}`,
          animation: status === 'running' ? 'pulse 0.6s infinite' : 'none'
        }} />
        <span style={{ color: statusColor, fontSize: 8, letterSpacing: 1 }}>
          {status === 'running' ? '● RUNNING' : status === 'won' ? '✓ WON' : status === 'lost' ? '✗ LOST' : 'IDLE'}
        </span>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 6 }}>
        {status === 'running' ? (
          <button onClick={onStop} className="danger" style={{ fontSize: 8, padding: '4px 10px' }}>■ STOP</button>
        ) : (
          <button onClick={onRun}
            disabled={memoryUsed > memoryTotal}
            style={{ fontSize: 8, padding: '4px 10px', borderColor: '#00ff41', color: '#00ff41' }}>
            ▶ EXECUTE
          </button>
        )}
        <button onClick={onReset} style={{ fontSize: 8, padding: '4px 10px', borderColor: '#ffb000', color: '#ffb000' }}>↺ RST</button>
        {currentLevel < 4 && (
          <button onClick={onNext} style={{ fontSize: 8, padding: '4px 10px', borderColor: '#00d4ff', color: '#00d4ff' }}>» NEXT</button>
        )}
      </div>
    </div>
  )
}

// Add pulse animation to global styles (in global.css)
