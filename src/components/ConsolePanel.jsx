import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'

const TYPE_CONFIG = {
  system:  { color: '#00ff41', bg: '#00ff4108', prefix: 'SYS', icon: '◈' },
  info:    { color: '#006622', bg: 'transparent', prefix: 'INF', icon: '·' },
  warn:    { color: '#ffb000', bg: '#ffb00008', prefix: 'WRN', icon: '▲' },
  error:   { color: '#ff0040', bg: '#ff004008', prefix: 'ERR', icon: '✕' },
  success: { color: '#00ff41', bg: '#00ff4111', prefix: 'OK!', icon: '✓' },
}

function timestamp() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}.${String(d.getMilliseconds()).slice(0,2)}`
}

const ConsolePanel = React.memo(function ConsolePanel() {
  const { consoleLog, currentLevel, levelData, status } = useSelector(s => s.game)
  const containerRef = useRef(null)
  const [filter, setFilter] = useState('all')
  const [paused, setPaused] = useState(false)
  const [ts] = useState(() => consoleLog.map(() => timestamp()))
  const tsRef = useRef(ts)

  // Track timestamps for new entries
  useEffect(() => {
    const prev = tsRef.current.length
    if (consoleLog.length > prev) {
      for (let i = prev; i < consoleLog.length; i++) {
        tsRef.current.push(timestamp())
      }
    } else if (consoleLog.length < prev) {
      tsRef.current = consoleLog.map(() => timestamp())
    }
  }, [consoleLog])

  // Auto-scroll unless paused
  useEffect(() => {
    if (!paused && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [consoleLog, paused])

  const handleScroll = useCallback(e => {
    const el = e.currentTarget
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 20
    setPaused(!atBottom)
  }, [])

  const filtered = filter === 'all' ? consoleLog : consoleLog.filter(e => e.type === filter)

  const counts = consoleLog.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1
    return acc
  }, {})

  return (
    <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div className="panel-header" style={{ fontSize: 9, gap: 6 }}>
        <span>SYSTEM CONSOLE</span>
        <span style={{
          fontSize: 7, letterSpacing: 1, padding: '1px 5px',
          border: `1px solid ${status === 'running' ? '#00ff41' : '#003300'}`,
          color: status === 'running' ? '#00ff41' : '#003300',
          animation: status === 'running' ? 'flicker 2s infinite' : 'none'
        }}>
          {status === 'running' ? '● LIVE' : '■ IDLE'}
        </span>
        <span style={{ marginLeft: 'auto', color: '#003300', fontSize: 7 }}>LVL {currentLevel + 1}</span>
      </div>

      {/* Hint bar */}
      {levelData?.hint && (
        <div style={{
          padding: '3px 8px', background: '#0a0700',
          borderBottom: '1px solid #332200', borderLeft: '2px solid #ffb000',
          color: '#ffb000', fontSize: 8, letterSpacing: 1,
          textShadow: '0 0 5px #ffb00033', display: 'flex', gap: 5, alignItems: 'center'
        }}>
          <span style={{ opacity: 0.6 }}>⚡</span>
          <span>{levelData.hint}</span>
        </div>
      )}

      {/* Filter bar */}
      <div style={{
        display: 'flex', gap: 1, padding: '2px 4px',
        borderBottom: '1px solid #001800', background: '#020902', flexWrap: 'wrap'
      }}>
        {['all', 'system', 'warn', 'error', 'success'].map(t => {
          const cfg = TYPE_CONFIG[t] ?? { color: '#006622' }
          const count = t === 'all' ? consoleLog.length : (counts[t] || 0)
          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              style={{
                fontSize: 7, padding: '1px 5px', letterSpacing: 1,
                border: `1px solid ${filter === t ? cfg.color : '#002200'}`,
                background: filter === t ? cfg.color + '22' : 'transparent',
                color: filter === t ? cfg.color : '#003300',
                transition: 'all 0.1s'
              }}
            >
              {t.toUpperCase()} {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}
            </button>
          )
        })}
        {paused && (
          <button
            onClick={() => { setPaused(false); containerRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' }) }}
            style={{ fontSize: 7, padding: '1px 5px', marginLeft: 'auto', borderColor: '#ffb000', color: '#ffb000' }}
          >
            ↓ RESUME
          </button>
        )}
      </div>

      {/* Log body */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          flex: 1, overflowY: 'auto', padding: '4px 6px',
          fontFamily: 'var(--font-mono)', fontSize: 9, lineHeight: 1.6,
          background: '#000'
        }}
      >
        {filtered.length === 0 && (
          <div style={{ color: '#002200', fontSize: 9, letterSpacing: 2, padding: '12px 0', textAlign: 'center' }}>
            — NO ENTRIES —
          </div>
        )}
        {filtered.map((entry, i) => {
          const cfg = TYPE_CONFIG[entry.type] ?? TYPE_CONFIG.info
          const realIndex = consoleLog.indexOf(entry)
          const ts = tsRef.current[realIndex] ?? '??:??:??.??'
          const isLast = i === filtered.length - 1

          return (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '22px 68px 28px 1fr',
                gap: 4,
                marginBottom: 1,
                padding: '1px 3px',
                background: entry.highlight ? cfg.bg : (isLast ? '#ffffff04' : 'transparent'),
                borderLeft: entry.highlight ? `2px solid ${cfg.color}` : '2px solid transparent',
                animation: isLast ? 'fadeInUp 0.15s ease' : 'none',
                transition: 'background 0.2s',
                borderRadius: 1,
              }}
            >
              <span style={{ color: '#002200', fontSize: 7, paddingTop: 1 }}>
                {String(realIndex).padStart(3, '0')}
              </span>
              <span style={{ color: '#003300', fontSize: 7, paddingTop: 1, letterSpacing: 0 }}>
                {ts}
              </span>
              <span style={{
                color: cfg.color,
                fontSize: 7,
                letterSpacing: 1,
                paddingTop: 1,
                opacity: 0.8,
              }}>
                {cfg.icon} {cfg.prefix}
              </span>
              <span style={{
                color: cfg.color,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                textShadow: entry.highlight ? `0 0 5px ${cfg.color}` : 'none',
              }}>
                {entry.msg}
              </span>
            </div>
          )
        })}
      </div>

      {/* Footer stats */}
      <div style={{
        padding: '3px 8px', borderTop: '1px solid #001800',
        display: 'flex', gap: 10, fontSize: 7, color: '#003300', letterSpacing: 1
      }}>
        <span>{consoleLog.length} LINES</span>
        {counts.error > 0 && <span style={{ color: '#ff004077' }}>{counts.error} ERR</span>}
        {counts.warn > 0 && <span style={{ color: '#ffb00077' }}>{counts.warn} WRN</span>}
        <span style={{ marginLeft: 'auto' }}>
          {paused ? '⏸ PAUSED' : '▼ LIVE'}
        </span>
      </div>
    </div>
  )
})

export default ConsolePanel
