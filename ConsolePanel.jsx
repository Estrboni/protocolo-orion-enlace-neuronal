import React, { useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { clearLog } from '../store/gameSlice'

const TYPE_COLORS = {
  system: '#006622',
  info: '#004d00',
  warn: '#ffb000',
  error: '#ff0040',
  success: '#00ff41',
}

export default function ConsolePanel() {
  const dispatch = useDispatch()
  const { consoleLog, currentLevel, levelData } = useSelector(s => s.game)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [consoleLog])

  return (
    <div style={{ width: '100%', height: '100%', background: '#020a02', border: '1px solid #002200', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 10px',
        fontSize: 9,
        letterSpacing: 3,
        color: '#006622',
        borderBottom: '1px solid #003300',
        textTransform: 'uppercase'
      }}>
        <span>▶ CONSOLE</span>
        <button onClick={() => dispatch(clearLog())} style={{
          border: '1px solid #003300', background: 'transparent', color: '#003300',
          padding: '2px 6px', fontSize: 8, cursor: 'pointer', transition: 'all 0.2s'
        }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ffb000'; e.currentTarget.style.borderColor = '#ffb000' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#003300'; e.currentTarget.style.borderColor = '#003300' }}
        >CLR</button>
      </div>

      {/* Hint */}
      {levelData?.hint && (
        <div style={{ padding: '3px 8px', background: '#001a00', borderBottom: '1px solid #002200', color: '#ffb000', fontSize: 8, letterSpacing: 1 }}>
          ⚡ {levelData.hint}
        </div>
      )}

      {/* Log */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px', fontFamily: 'var(--font-mono)', fontSize: 8 }}>
        {consoleLog.map((entry, i) => (
          <div key={i} style={{
            color: TYPE_COLORS[entry.type] ?? '#004400',
            lineHeight: 1.4,
            animation: i === consoleLog.length - 1 ? 'fadeInUp 0.2s ease' : 'none',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            <span style={{ color: '#002200', marginRight: 4 }}>{String(i).padStart(2, '0')}|</span>
            {entry.msg}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
