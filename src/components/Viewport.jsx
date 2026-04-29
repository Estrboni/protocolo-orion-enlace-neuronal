import React, { useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { CELL } from '../levels/levelData'

const CELL_SIZE = 38
const ISO_W = CELL_SIZE * 1.2
const ISO_H = CELL_SIZE * 0.6

// Isometric projection helpers
function isoX(x, y) { return (x - y) * (ISO_W / 2) }
function isoY(x, y) { return (x + y) * (ISO_H / 2) }

const WALL_COLOR   = '#001a00'
const WALL_TOP     = '#003300'
const EMPTY_COLOR  = '#020d02'
const GATE_COLORS  = { [CELL.AND_GATE]: '#00d4ff', [CELL.OR_GATE]: '#bf00ff', [CELL.NOT_GATE]: '#ff6600', [CELL.XOR_GATE]: '#ff0040' }

function spawnParticles(arr, x, y, color, count = 6) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
    arr.push({ x, y, vx: Math.cos(angle) * (1 + Math.random() * 2), vy: Math.sin(angle) * (1 + Math.random() * 2), life: 1, color })
  }
}

const Viewport = React.memo(function Viewport() {
  const canvasRef = useRef(null)
  const { bot, enemies, levelData, collectedNodes, status, executionStep } = useSelector(s => s.game)
  const stateRef = useRef({
    tick: 0,
    particles: [],
    prevCollected: [],
    prevBot: { x: bot.x, y: bot.y },
    botLerp: { x: bot.x, y: bot.y },
    enemyLerps: {},
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf

    function resize() {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    function isoToScreen(gx, gy, cx, cy) {
      return [cx + isoX(gx, gy), cy + isoY(gx, gy)]
    }

    function drawIsoTile(ctx, gx, gy, cx, cy, fillTop, fillLeft, fillRight, h = ISO_H * 0.5) {
      const [sx, sy] = isoToScreen(gx, gy, cx, cy)
      const hw = ISO_W / 2
      const hh = ISO_H / 2

      // Top face
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(sx + hw, sy + hh)
      ctx.lineTo(sx, sy + ISO_H)
      ctx.lineTo(sx - hw, sy + hh)
      ctx.closePath()
      ctx.fillStyle = fillTop
      ctx.fill()
      ctx.strokeStyle = '#003300'
      ctx.lineWidth = 0.5
      ctx.stroke()

      if (h > 0) {
        // Left face
        ctx.beginPath()
        ctx.moveTo(sx - hw, sy + hh)
        ctx.lineTo(sx, sy + ISO_H)
        ctx.lineTo(sx, sy + ISO_H + h)
        ctx.lineTo(sx - hw, sy + hh + h)
        ctx.closePath()
        ctx.fillStyle = fillLeft
        ctx.fill()
        ctx.strokeStyle = '#002200'
        ctx.lineWidth = 0.5
        ctx.stroke()

        // Right face
        ctx.beginPath()
        ctx.moveTo(sx + hw, sy + hh)
        ctx.lineTo(sx, sy + ISO_H)
        ctx.lineTo(sx, sy + ISO_H + h)
        ctx.lineTo(sx + hw, sy + hh + h)
        ctx.closePath()
        ctx.fillStyle = fillRight
        ctx.fill()
        ctx.strokeStyle = '#002200'
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
    }

    function drawGlowDiamond(ctx, sx, sy, color, size, alpha = 1) {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.shadowColor = color
      ctx.shadowBlur = 18
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(sx, sy - size)
      ctx.lineTo(sx + size, sy)
      ctx.lineTo(sx, sy + size)
      ctx.lineTo(sx - size, sy)
      ctx.closePath()
      ctx.stroke()
      ctx.fillStyle = color + '22'
      ctx.fill()
      ctx.restore()
    }

    function drawBot(ctx, lerp, direction, energy, tick, cx, cy) {
      const [sx, sy] = isoToScreen(lerp.x, lerp.y, cx, cy)
      const py = sy + ISO_H / 2
      const pulse = Math.sin(tick * 0.1) * 3
      const isLow = energy < 25
      const col = isLow ? '#ff0040' : '#00ff41'

      ctx.save()
      ctx.shadowColor = col
      ctx.shadowBlur = 14 + pulse

      // Bot body — glowing hexagon
      ctx.strokeStyle = col
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6
        const r = 9 + (status === 'running' ? pulse * 0.5 : 0)
        i === 0 ? ctx.moveTo(sx + Math.cos(a) * r, py + Math.sin(a) * r)
                : ctx.lineTo(sx + Math.cos(a) * r, py + Math.sin(a) * r)
      }
      ctx.closePath()
      ctx.fillStyle = col + '22'
      ctx.fill()
      ctx.stroke()

      // Direction arrow
      const angle = direction * Math.PI / 2 - Math.PI / 2
      const ax = sx + Math.cos(angle) * 6
      const ay = py + Math.sin(angle) * 6
      ctx.strokeStyle = col
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(sx, py)
      ctx.lineTo(ax, ay)
      ctx.stroke()

      // Thruster trail when running
      if (status === 'running') {
        for (let i = 1; i <= 3; i++) {
          ctx.globalAlpha = 0.2 / i
          ctx.fillStyle = col
          ctx.beginPath()
          ctx.arc(sx - Math.cos(angle) * i * 5, py - Math.sin(angle) * i * 5, 4 - i, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.restore()
    }

    function drawEnemy(ctx, e, tick, cx, cy) {
      const [sx, sy] = isoToScreen(e.x, e.y, cx, cy)
      const py = sy + ISO_H / 2
      const flicker = Math.sin(tick * 0.18 + e.id * 1.7) * 0.25 + 0.75

      ctx.save()
      ctx.globalAlpha = flicker
      ctx.shadowColor = '#ff0040'
      ctx.shadowBlur = 18
      ctx.strokeStyle = '#ff0040'
      ctx.lineWidth = 1.5

      // Spinning threat square
      ctx.save()
      ctx.translate(sx, py)
      ctx.rotate(tick * 0.03 + e.id)
      ctx.strokeRect(-7, -7, 14, 14)
      ctx.fillStyle = '#ff004011'
      ctx.fillRect(-7, -7, 14, 14)
      ctx.restore()

      ctx.fillStyle = '#ff0040'
      ctx.font = '9px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('✕', sx, py + 4)
      ctx.restore()
    }

    function drawDataNode(ctx, n, collected, tick, cx, cy) {
      if (collected) return
      const [sx, sy] = isoToScreen(n.x, n.y, cx, cy)
      const py = sy + ISO_H / 2
      const bob = Math.sin(tick * 0.06 + n.id * 0.9) * 3
      const pulse = Math.sin(tick * 0.08 + n.id) * 4 + 8

      ctx.save()
      ctx.shadowColor = '#00ff41'
      ctx.shadowBlur = pulse + 6
      ctx.strokeStyle = '#00ff41'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(sx, py + bob, pulse * 0.4 + 3, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = '#00ff4122'
      ctx.fill()
      ctx.fillStyle = '#00ff41'
      ctx.font = 'bold 10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('◈', sx, py + bob + 4)
      ctx.restore()
    }

    function drawExit(ctx, exit, tick, cx, cy) {
      const [sx, sy] = isoToScreen(exit.x, exit.y, cx, cy)
      const py = sy + ISO_H / 2
      const pulse = Math.sin(tick * 0.04) * 0.35 + 0.65

      ctx.save()
      ctx.globalAlpha = pulse
      ctx.shadowColor = '#ffb000'
      ctx.shadowBlur = 20
      ctx.strokeStyle = '#ffb000'
      ctx.lineWidth = 2
      ctx.save()
      ctx.translate(sx, py)
      ctx.rotate(tick * 0.015)
      ctx.strokeRect(-10, -10, 20, 20)
      ctx.restore()
      ctx.fillStyle = '#ffb000'
      ctx.font = '14px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('⬡', sx, py + 5)
      ctx.restore()
    }

    function updateParticles(particles) {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx; p.y += p.vy
        p.vx *= 0.9; p.vy *= 0.9
        p.life -= 0.04
        if (p.life <= 0) particles.splice(i, 1)
      }
    }

    function drawParticles(ctx, particles) {
      particles.forEach(p => {
        ctx.save()
        ctx.globalAlpha = p.life
        ctx.shadowColor = p.color
        ctx.shadowBlur = 8
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })
    }

    function render() {
      const s = stateRef.current
      s.tick++
      const tick = s.tick

      if (!levelData) { raf = requestAnimationFrame(render); return }

      // Lerp bot position
      s.botLerp.x += (bot.x - s.botLerp.x) * 0.18
      s.botLerp.y += (bot.y - s.botLerp.y) * 0.18

      // Detect newly collected nodes → spawn particles
      collectedNodes.forEach(id => {
        if (!s.prevCollected.includes(id)) {
          const n = levelData.dataNodes.find(n => n.id === id)
          if (n) {
            const cx = canvas.width / 2
            const cy = canvas.height / 2 - (levelData.grid.length * ISO_H * 0.4)
            const [sx, sy] = isoToScreen(n.x, n.y, cx, cy)
            spawnParticles(s.particles, sx, sy + ISO_H / 2, '#00ff41', 10)
          }
          s.prevCollected.push(id)
        }
      })

      updateParticles(s.particles)

      const rows = levelData.grid.length
      const cols = levelData.grid[0].length
      const cx = canvas.width / 2
      const cy = Math.max(40, canvas.height / 2 - rows * ISO_H * 0.5)

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw tiles back to front (painter's algorithm)
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const type = levelData.grid[y][x]
          if (type === CELL.WALL) {
            drawIsoTile(ctx, x, y, cx, cy, WALL_TOP, '#001500', '#001800', ISO_H * 0.7)
          } else {
            const gateCol = GATE_COLORS[type]
            if (gateCol) {
              drawIsoTile(ctx, x, y, cx, cy, gateCol + '33', gateCol + '18', gateCol + '22', ISO_H * 0.2)
              const [sx, sy] = isoToScreen(x, y, cx, cy)
              const labels = { [CELL.AND_GATE]: 'AND', [CELL.OR_GATE]: 'OR', [CELL.NOT_GATE]: 'NOT', [CELL.XOR_GATE]: 'XOR' }
              ctx.save()
              ctx.shadowColor = gateCol; ctx.shadowBlur = 8
              ctx.fillStyle = gateCol; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center'
              ctx.fillText(labels[type], sx, sy + ISO_H + 4)
              ctx.restore()
            } else {
              drawIsoTile(ctx, x, y, cx, cy, EMPTY_COLOR, '#010801', '#010a01', 0)
            }
          }
        }
      }

      drawExit(ctx, levelData.exitPos, tick, cx, cy)
      levelData.dataNodes.forEach(n => drawDataNode(ctx, n, collectedNodes.includes(n.id), tick, cx, cy))
      enemies.forEach(e => drawEnemy(ctx, e, tick, cx, cy))
      drawBot(ctx, s.botLerp, bot.direction, bot.energy, tick, cx, cy)
      drawParticles(ctx, s.particles)

      raf = requestAnimationFrame(render)
    }

    render()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [bot, enemies, levelData, collectedNodes, status])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000' }}>
      <div className="panel-header" style={{ fontSize: 9, letterSpacing: 3 }}>VIEWPORT — ISO SECTOR MAP</div>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: 'calc(100% - 22px)', display: 'block' }}
      />
    </div>
  )
})

export default Viewport
