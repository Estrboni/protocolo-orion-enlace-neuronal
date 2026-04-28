import React, { useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { CELL } from '../levels/levelData'

const CELL_SIZE = 36
const COLORS = {
  [CELL.EMPTY]: '#050f05',
  [CELL.WALL]: '#001a00',
  [CELL.NODE]: '#00ff41',
  [CELL.EXIT]: '#ffb000',
  [CELL.AND_GATE]: '#00d4ff',
  [CELL.OR_GATE]: '#bf00ff',
  [CELL.NOT_GATE]: '#ff6600',
  [CELL.XOR_GATE]: '#ff0040',
}

function lerp(a, b, t) { return a + (b - a) * t }

export default function Viewport() {
  const canvasRef = useRef(null)
  const { bot, enemies, levelData, collectedNodes, status, executionStep } = useSelector(s => s.game)
  const { blocks } = useSelector(s => s.program)
  const animRef = useRef({ botX: bot.x, botY: bot.y, tick: 0, particles: [], explosions: [] })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf

    function drawCell(x, y, type, isActive) {
      const px = x * CELL_SIZE
      const py = y * CELL_SIZE
      const color = COLORS[type] ?? '#050f05'

      ctx.fillStyle = color
      if (type === CELL.WALL) {
        ctx.fillStyle = '#001a00'
        ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE)
        ctx.strokeStyle = '#003300'
        ctx.lineWidth = 1
        ctx.strokeRect(px + 0.5, py + 0.5, CELL_SIZE - 1, CELL_SIZE - 1)
        // Wall pattern
        ctx.strokeStyle = '#002200'
        ctx.lineWidth = 0.5
        for (let i = 0; i < CELL_SIZE; i += 8) {
          ctx.beginPath(); ctx.moveTo(px + i, py); ctx.lineTo(px + i, py + CELL_SIZE); ctx.stroke()
        }
      } else {
        ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE)
        ctx.strokeStyle = '#003300'
        ctx.lineWidth = 0.5
        ctx.strokeRect(px + 0.5, py + 0.5, CELL_SIZE - 1, CELL_SIZE - 1)
      }

      // Gate cells
      if (type >= 5 && type <= 8) {
        const labels = ['AND', 'OR', 'NOT', 'XOR']
        ctx.fillStyle = color
        ctx.globalAlpha = 0.15
        ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE)
        ctx.globalAlpha = 1
        ctx.fillStyle = color
        ctx.font = `bold 8px monospace`
        ctx.textAlign = 'center'
        ctx.fillText(labels[type - 5], px + CELL_SIZE / 2, py + CELL_SIZE / 2 + 3)
        ctx.strokeStyle = color
        ctx.lineWidth = 1
        ctx.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2)
      }
    }

    function drawDataNode(n, collected, tick) {
      if (collected) return
      const px = n.x * CELL_SIZE + CELL_SIZE / 2
      const py = n.y * CELL_SIZE + CELL_SIZE / 2
      const pulse = Math.sin(tick * 0.08 + n.id) * 3 + 6
      const glow = Math.sin(tick * 0.05 + n.id * 0.7) * 5 + 12

      ctx.save()
      ctx.shadowColor = '#00ff41'
      ctx.shadowBlur = glow
      ctx.strokeStyle = '#00ff41'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(px, py, pulse, 0, Math.PI * 2)
      ctx.stroke()

      // Inner pulsing diamond
      ctx.fillStyle = '#00ff41'
      ctx.globalAlpha = 0.8
      ctx.font = '10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('◆', px, py + 4)
      
      // Outer ring
      ctx.globalAlpha = 0.4
      ctx.strokeStyle = '#00ff41'
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.arc(px, py, pulse + 3, 0, Math.PI * 2)
      ctx.stroke()

      ctx.restore()
    }

    function drawExit(exit, tick) {
      const px = exit.x * CELL_SIZE
      const py = exit.y * CELL_SIZE
      const pulse = Math.sin(tick * 0.05) * 0.3 + 0.7
      const rotation = (tick * 0.01) % (Math.PI * 2)

      ctx.save()
      ctx.translate(px + CELL_SIZE / 2, py + CELL_SIZE / 2)
      ctx.rotate(rotation)

      ctx.globalAlpha = pulse
      ctx.fillStyle = '#ffb00022'
      ctx.fillRect(-CELL_SIZE/2, -CELL_SIZE/2, CELL_SIZE, CELL_SIZE)
      ctx.strokeStyle = '#ffb000'
      ctx.lineWidth = 2
      ctx.shadowColor = '#ffb000'
      ctx.shadowBlur = 12
      ctx.strokeRect(-CELL_SIZE/2 + 2, -CELL_SIZE/2 + 2, CELL_SIZE - 4, CELL_SIZE - 4)
      
      ctx.globalAlpha = 1
      ctx.fillStyle = '#ffb000'
      ctx.font = '20px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('⬡', 0, 6)
      ctx.restore()
    }

    function drawBot(bx, by, direction, energy, tick) {
      const px = bx * CELL_SIZE + CELL_SIZE / 2
      const py = by * CELL_SIZE + CELL_SIZE / 2
      const r = CELL_SIZE * 0.32
      const energyColor = energy < 20 ? '#ff0040' : energy < 50 ? '#ffb000' : '#00ff41'
      const glow = Math.sin(tick * 0.06) * 5 + 16

      ctx.save()
      // Glow
      ctx.shadowColor = energyColor
      ctx.shadowBlur = glow
      ctx.strokeStyle = energyColor
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(px, py, r, 0, Math.PI * 2)
      ctx.stroke()

      // Inner
      const innerColor = energy < 20 ? '#1a0000' : '#001a00'
      ctx.fillStyle = innerColor
      ctx.fill()

      // Direction arrow with energy color
      const angle = direction * Math.PI / 2 - Math.PI / 2
      ctx.beginPath()
      ctx.moveTo(px + Math.cos(angle) * (r - 4), py + Math.sin(angle) * (r - 4))
      ctx.lineTo(px + Math.cos(angle + 2.5) * (r - 10), py + Math.sin(angle + 2.5) * (r - 10))
      ctx.lineTo(px + Math.cos(angle - 2.5) * (r - 10), py + Math.sin(angle - 2.5) * (r - 10))
      ctx.closePath()
      ctx.fillStyle = energyColor
      ctx.shadowBlur = 8
      ctx.fill()

      // Center dot
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(px, py, 3, 0, Math.PI * 2)
      ctx.fill()

      // Direction indicator
      ctx.fillStyle = energyColor
      ctx.globalAlpha = 0.3
      ctx.font = '8px monospace'
      ctx.textAlign = 'center'
      const dirText = ['▲', '▶', '▼', '◀'][direction]
      ctx.fillText(dirText, px, py - r - 4)

      ctx.restore()
    }

    function drawEnemy(e, tick, idx) {
      const px = e.x * CELL_SIZE + CELL_SIZE / 2
      const py = e.y * CELL_SIZE + CELL_SIZE / 2
      const r = CELL_SIZE * 0.28
      const flicker = Math.sin(tick * 0.15 + e.id * 1.3) * 0.3 + 0.7
      const pulse = Math.sin(tick * 0.1 + e.id) * 2 + 2
      const colorShift = Math.sin(tick * 0.03 + e.id * 0.5)
      const color = colorShift > 0.5 ? '#ff0040' : '#ff1a5f'

      ctx.save()
      ctx.globalAlpha = flicker
      ctx.shadowColor = color
      ctx.shadowBlur = 14 + pulse
      ctx.strokeStyle = color
      ctx.lineWidth = 1.8
      
      // Rotating diamond
      ctx.translate(px, py)
      ctx.rotate(tick * 0.08 + e.id)
      
      ctx.beginPath()
      ctx.moveTo(0, -r)
      ctx.lineTo(r, 0)
      ctx.lineTo(0, r)
      ctx.lineTo(-r, 0)
      ctx.closePath()
      ctx.stroke()
      
      ctx.fillStyle = '#0a0000'
      ctx.fill()
      
      ctx.fillStyle = color
      ctx.font = '10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('✕', 0, 4)
      
      ctx.globalAlpha = 1
      ctx.restore()
    }

    function drawExplosion(exp, tick) {
      const age = tick - exp.startTick
      const lifetime = 30
      if (age > lifetime) return false

      const progress = age / lifetime
      const px = exp.x * CELL_SIZE + CELL_SIZE / 2
      const py = exp.y * CELL_SIZE + CELL_SIZE / 2

      ctx.save()
      ctx.globalAlpha = 1 - progress
      ctx.fillStyle = exp.color
      ctx.shadowColor = exp.color
      ctx.shadowBlur = 20 * (1 - progress)

      const size = CELL_SIZE * (1 + progress * 2)
      ctx.fillRect(px - size/2, py - size/2, size, size)

      // Particles
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + progress * Math.PI
        const dist = progress * CELL_SIZE * 1.5
        const px2 = px + Math.cos(angle) * dist
        const py2 = py + Math.sin(angle) * dist
        ctx.beginPath()
        ctx.arc(px2, py2, 2, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()
      return true
    }

    function render() {
      animRef.current.tick++
      const tick = animRef.current.tick

      if (!levelData) return

      const grid = levelData.grid
      const gridW = grid[0].length * CELL_SIZE
      const gridH = grid.length * CELL_SIZE

      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight

      // Center the grid
      const offsetX = Math.max(0, (canvas.width - gridW) / 2)
      const offsetY = Math.max(0, (canvas.height - gridH) / 2)

      ctx.save()
      ctx.translate(offsetX, offsetY)

      // Background
      ctx.fillStyle = '#000'
      ctx.fillRect(-offsetX, -offsetY, canvas.width, canvas.height)

      // Draw grid
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          drawCell(x, y, grid[y][x])
        }
      }

      // Draw exit
      drawExit(levelData.exitPos, tick)

      // Draw data nodes
      levelData.dataNodes.forEach(n => drawDataNode(n, collectedNodes.includes(n.id), tick))

      // Draw enemies
      enemies.forEach((e, i) => drawEnemy(e, tick, i))

      // Draw explosions
      animRef.current.explosions = animRef.current.explosions.filter(exp => drawExplosion(exp, tick))

      // Draw bot
      drawBot(bot.x, bot.y, bot.direction, bot.energy, tick)

      // Execution highlight with pulsing aura
      if (status === 'running') {
        const auraSize = Math.sin(tick * 0.1) * 2 + 4
        ctx.strokeStyle = `#00ff41${Math.floor((1 - auraSize/12) * 255).toString(16).padStart(2, '0')}`
        ctx.lineWidth = 2
        ctx.strokeRect(bot.x * CELL_SIZE - auraSize, bot.y * CELL_SIZE - auraSize, CELL_SIZE + auraSize*2, CELL_SIZE + auraSize*2)
      }

      ctx.restore()

      raf = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(raf)
  }, [bot, enemies, levelData, collectedNodes, status])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div className="panel-header" style={{ fontSize: 9 }}>VIEWPORT — SECTOR MAP</div>
      <canvas ref={canvasRef} style={{ width: '100%', height: 'calc(100% - 22px)', display: 'block', background: '#000' }} />
    </div>
  )
}
