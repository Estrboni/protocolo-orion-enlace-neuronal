import React, { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'

const TYPE_COLORS = {
  system: '#006622',
  info: '#004d00',
  warn: '#ffb000',
  error: '#ff0040',
  success: '#00ff41',
}

const ConsolePanel = React.memo(function ConsolePanel() {
  const { consoleLog, currentLevel, levelData } = useSelector(s => s.game)
  const bottomRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [consoleLog])

  return (
    <div style={{ width: '100%', height: '100%', background: '#020a02', border: '1px solid #002200', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="panel-header" style={{ fontSize: 9, background: 'linear-gradient(180deg, #050f05 0%, #020a02 100%)', boxShadow: 'inset 0 1px 0 #003300' }}>
        SYSTEM CONSOLE
        <span style={{ marginLeft: 'auto', color: '#003300', fontSize: 8 }}>LVL {currentLevel + 1}</span>
      </div>

      {levelData?.hint && (
        <div style={{
          padding: '4px 8px',
          background: 'linear-gradient(90deg, #001a0033, transparent)',
          borderBottom: '1px solid #002200',
          color: '#ffb000',
          fontSize: 8,
          letterSpacing: 1,
          textShadow: '0 0 5px #ffb00033',
          borderLeft: '2px solid #ffb000'
        }}>
          ⚡ {levelData.hint}
        </div>
      )}

      <div ref={containerRef} style={{ flex: 1, overflowY: 'auto', padding: '4px 8px', fontFamily: 'var(--font-mono)', fontSize: 9, lineHeight: 1.5, background: '#000' }}>
        {consoleLog.map((entry, i) => (
          <div
            key={i}
            style={{
              color: TYPE_COLORS[entry.type] ?? '#004400',
              animation: i === consoleLog.length - 1 ? 'fadeInUp 0.2s ease' : 'none',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              display: 'grid',
              gridTemplateColumns: '32px 1fr',
              gap: 4,
              marginBottom: 1
            }}
          >
            <span style={{ color: '#002200', userSelect: 'none' }}>{String(i).padStart(3, '0')}|</span>
            <span>{entry.msg}</span>
          </div>
        ))}
      </div>
    </div>
  )
})

export default ConsolePanel
