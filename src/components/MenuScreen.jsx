import React, { useEffect, useState } from 'react'

const ASCII_LOGO = `
██████╗ ██████╗  ██████╗ ████████╗ ██████╗  ██████╗ ██████╗ ██╗      ██████╗ 
██╔══██╗██╔══██╗██╔═══██╗╚══██╔══╝██╔═══██╗██╔════╝██╔═══██╗██║     ██╔═══██╗
██████╔╝██████╔╝██║   ██║   ██║   ██║   ██║██║     ██║   ██║██║     ██║   ██║
██╔═══╝ ██╔══██╗██║   ██║   ██║   ██║   ██║██║     ██║   ██║██║     ██║   ██║
██║     ██║  ██║╚██████╔╝   ██║   ╚██████╔╝╚██████╗╚██████╔╝███████╗╚██████╔╝
╚═╝     ╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝  ╚═════╝ ╚═════╝ ╚══════╝ ╚═════╝`

export default function MenuScreen({ onStart }) {
  const [glitch, setGlitch] = useState(false)
  const [line, setLine] = useState(0)
  const bootLines = [
    'BIOS v4.2.1 — ORION NEURAL SYSTEMS',
    'Initializing memory buffers...',
    'Loading combat logic module...',
    'A* pathfinding engine: OK',
    'Sensor array: CALIBRATED',
    'Energy systems: ONLINE',
    '> All systems nominal. Awaiting operator input.',
  ]

  useEffect(() => {
    if (line < bootLines.length) {
      const t = setTimeout(() => setLine(l => l + 1), 220)
      return () => clearTimeout(t)
    }
  }, [line])

  useEffect(() => {
    const t = setInterval(() => { setGlitch(true); setTimeout(() => setGlitch(false), 120) }, 4000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#000',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'linear-gradient(#00ff41 1px, transparent 1px), linear-gradient(90deg, #00ff41 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      {/* Corner decorations */}
      {['topleft','topright','bottomleft','bottomright'].map(pos => (
        <div key={pos} style={{
          position: 'absolute',
          top: pos.includes('top') ? 16 : 'auto',
          bottom: pos.includes('bottom') ? 16 : 'auto',
          left: pos.includes('left') ? 16 : 'auto',
          right: pos.includes('right') ? 16 : 'auto',
          width: 40, height: 40,
          borderTop: pos.includes('top') ? '2px solid #00ff41' : 'none',
          borderBottom: pos.includes('bottom') ? '2px solid #00ff41' : 'none',
          borderLeft: pos.includes('left') ? '2px solid #00ff41' : 'none',
          borderRight: pos.includes('right') ? '2px solid #00ff41' : 'none',
          opacity: 0.6
        }} />
      ))}

      {/* Logo */}
      <pre style={{
        color: '#00ff41',
        textShadow: glitch ? '3px 0 #ff0040, -3px 0 #00d4ff' : '0 0 20px #00ff41',
        fontSize: 'clamp(5px, 0.7vw, 9px)',
        letterSpacing: 1,
        animation: 'flicker 8s infinite',
        marginBottom: 8,
        userSelect: 'none',
        transition: 'text-shadow 0.1s'
      }}>{ASCII_LOGO}</pre>

      <div style={{ color: '#ffb000', fontSize: 'clamp(14px, 2vw, 22px)', letterSpacing: 8, fontFamily: 'var(--font-display)', marginBottom: 32, textShadow: '0 0 20px #ffb000' }}>
        ENLACE NEURONAL
      </div>

      {/* Boot sequence */}
      <div style={{
        width: 480, background: '#050f05', border: '1px solid #003300',
        padding: '12px 16px', marginBottom: 32, minHeight: 130
      }}>
        {bootLines.slice(0, line).map((l, i) => (
          <div key={i} style={{
            color: i === bootLines.length - 1 ? '#00ff41' : '#006622',
            fontSize: 11, lineHeight: '1.6',
            animation: 'fadeInUp 0.3s ease'
          }}>
            {l}
          </div>
        ))}
        {line < bootLines.length && (
          <span style={{ color: '#00ff41', animation: 'blink 1s infinite' }}>█</span>
        )}
      </div>

      {line >= bootLines.length && (
        <button onClick={onStart} style={{
          fontSize: 14, letterSpacing: 6, padding: '12px 48px',
          border: '1px solid #00ff41', background: 'transparent',
          color: '#00ff41', cursor: 'pointer', fontFamily: 'var(--font-mono)',
          boxShadow: '0 0 20px #00ff4144, inset 0 0 20px #00ff4111',
          animation: 'pulse-green 2s infinite',
          transition: 'all 0.2s'
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#00ff41'; e.currentTarget.style.color = '#000' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#00ff41' }}
        >
          INICIAR PROTOCOLO
        </button>
      )}

      <div style={{ position: 'absolute', bottom: 12, color: '#003300', fontSize: 10, letterSpacing: 2 }}>
        ORIÓN NEURAL SYSTEMS — BUILD 2.4.1 — CLASSIFIED
      </div>
    </div>
  )
}
