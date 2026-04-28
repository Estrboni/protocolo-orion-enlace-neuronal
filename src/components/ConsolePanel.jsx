import React, { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'

const TYPE_COLORS = {
  system: '#006622',
  info: '#004d00',
  warn: '#ffb000',
  error: '#ff0040',
  success: '#00ff41',
}

const TYPE_ICONS = {
  system: '▶',
  info: '◆',
  warn: '⚠',
  error: '✕',
  success: '✓',
}

export default function ConsolePanel() {
  const { consoleLog, currentLevel, levelData } = useSelector(s => s.game)
  const bottomRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    // Only auto-scroll if user is at bottom
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
      if (isAtBottom) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [consoleLog])

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#020a02',
      border: '1px solid #002200',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}
      role="region"
      aria-label="System console output"
      aria-live="polite">
      <div className="panel-header" style={{ fontSize: '9px' }}>
        SYSTEM CONSOLE
        <span style={{ marginLeft: 'auto', color: '#003300', fontSize: '8px' }}>
          LVL {currentLevel + 1} — {consoleLog.length} msgs
        </span>
      </div>

      {/* Hint */}
      {levelData?.hint && (
        <div style={{
          padding: '3px 8px',
          background: '#001a00',
          borderBottom: '1px solid #002200',
          color: '#ffb000',
          fontSize: '9px',
          letterSpacing: 1,
          lineHeight: 1.4,
          animation: 'fadeInUp 0.4s ease'
        }}
          role="note">
          ⚡ {levelData.hint}
        </div>
      )}

      {/* Log */}
      <div ref={containerRef} style={{
        flex: 1,
        overflowY: 'auto',
        padding: '4px 8px',
        fontFamily: 'var(--font-mono)',
        fontSize: '9px',
        scrollBehavior: 'smooth'
      }}>
        {consoleLog.length === 0 ? (
          <div style={{ color: '#003300', textAlign: 'center', marginTop: '20px' }}>
            [awaiting system events]
          </div>
        ) : (
          consoleLog.map((entry, i) => (
            <div key={i} style={{
              color: TYPE_COLORS[entry.type] ?? '#004400',
              lineHeight: 1.6,
              animation: i === consoleLog.length - 1 ? 'fadeInUp 0.2s ease' : 'none',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              display: 'flex',
              gap: 4,
            }}
              role={entry.type === 'error' ? 'alert' : undefined}
              aria-live={entry.type === 'error' || entry.type === 'success' ? 'assertive' : undefined}>
              <span style={{
                color: '#003300',
                minWidth: 30,
                fontSize: '8px',
                userSelect: 'none',
                flexShrink: 0
              }}>
                {TYPE_ICONS[entry.type] || '·'} {String(i).padStart(3, '0')}
              </span>
              <span style={{ flex: 1 }}>
                {entry.msg}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} style={{ height: 1 }} aria-hidden="true" />
      </div>

      {/* Status footer */}
      {consoleLog.length > 50 && (
        <div style={{
          padding: '2px 8px',
          borderTop: '1px solid #002200',
          color: '#003300',
          fontSize: '8px',
          letterSpacing: 1,
          textAlign: 'right'
        }}>
          showing last {Math.min(consoleLog.length, 80)} of {consoleLog.length} messages
        </div>
      )}
    </div>
  )
}
