import React, { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'

const TYPE_COLORS = {
  system: '#006622',
  info: '#004d00',
  warn: '#ffb000',
  error: '#ff0040',
  success: '#00ff41',
}

export default function ConsolePanel() {
  const { consoleLog, currentLevel, levelData } = useSelector(s => s.game)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [consoleLog])

  return (
    <div style={{ width: '100%', height: '100%', background: '#020a02', border: '1px solid #002200', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="panel-header" style={{ fontSize: 9 }}>
        SYSTEM CONSOLE
        <span style={{ marginLeft: 'auto', color: '#003300', fontSize: 8 }}>LVL {currentLevel + 1}</span>
      </div>

      {/* Hint */}
      {levelData?.hint && (
        <div style={{ padding: '3px 8px', background: '#001a00', borderBottom: '1px solid #002200', color: '#ffb000', fontSize: 9, letterSpacing: 1 }}>
          ⚡ {levelData.hint}
        </div>
      )}

      {/* Log */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px', fontFamily: 'var(--font-mono)', fontSize: 9 }}>
        {consoleLog.map((entry, i) => (
          <div key={i} style={{
            color: TYPE_COLORS[entry.type] ?? '#004400',
            lineHeight: 1.5,
            animation: i === consoleLog.length - 1 ? 'fadeInUp 0.2s ease' : 'none',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}>
            <span style={{ color: '#002200', marginRight: 4 }}>{String(i).padStart(3, '0')}|</span>
            {entry.msg}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
