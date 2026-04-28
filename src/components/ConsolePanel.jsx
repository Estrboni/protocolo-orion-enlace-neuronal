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
  const { consoleLog, currentLevel, levelData, collectedNodes, bot } = useSelector(s => s.game)
  const { blocks } = useSelector(s => s.program)
  const bottomRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [consoleLog])

  const errorCount = consoleLog.filter(e => e.type === 'error').length
  const successCount = consoleLog.filter(e => e.type === 'success').length

  return (
    <div style={{ width: '100%', height: '100%', background: '#020a02', border: '1px solid #002200', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="panel-header" style={{ fontSize: 8 }}>
        CONSOLE {errorCount > 0 && <span style={{ color: '#ff0040', marginLeft: 8 }}>⚠ {errorCount} errors</span>}
        {successCount > 0 && <span style={{ color: '#00ff41', marginLeft: 8 }}>✓ {successCount} success</span>}
      </div>

      {levelData?.hint && (
        <div style={{ padding: '3px 8px', background: '#001a00', borderBottom: '1px solid #002200', color: '#ffb000', fontSize: 8, letterSpacing: 1, lineHeight: 1.4 }}>
          💡 {levelData.hint}
        </div>
      )}

      <div ref={containerRef} style={{ flex: 1, overflowY: 'auto', padding: '4px 8px', fontFamily: 'var(--font-mono)', fontSize: 8, lineHeight: 1.6 }}>
        {consoleLog.map((entry, i) => (
          <div key={i} style={{
            color: TYPE_COLORS[entry.type] ?? '#004400',
            animation: i === consoleLog.length - 1 ? 'fadeInUp 0.2s ease' : 'none',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            <span style={{ color: '#002200', marginRight: 3, fontWeight: 'bold' }}>[{String(i).padStart(3, '0')}]</span>
            {entry.msg}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Stats footer */}
      <div style={{ padding: '4px 8px', borderTop: '1px solid #002200', display: 'flex', gap: 12, fontSize: 7, color: '#003300', flexWrap: 'wrap' }}>
        <span>POS: <span style={{ color: '#00d4ff' }}>[{bot.x},{bot.y}]</span></span>
        <span>PROG: <span style={{ color: '#00ff41' }}>{blocks.length}</span></span>
        <span>NODES: <span style={{ color: '#00ff41' }}>{collectedNodes.length}/{levelData?.dataNodes?.length ?? 0}</span></span>
      </div>
    </div>
  )
}
