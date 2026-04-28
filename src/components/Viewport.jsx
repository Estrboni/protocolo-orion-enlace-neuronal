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
  const animRef = useRef({ botX: bot.x, botY: bot.y, tick: 0, particles: [], nodeCollectParticles: [] })

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

      // Gate cells — enhanced visuals
      if (type >= 5 && type <= 8) {
        const labels = ['AND', 'OR', 'NOT', 'XOR']
        ctx.fillStyle = color
        ctx.globalAlpha = 0.12
        ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE)
        ctx.globalAlpha = 1
        ctx.fillStyle = color
        ctx.font = `bold 8px monospace`
        ctx.textAlign = 'center'
        ctx.shadowColor = color
        ctx.shadowBlur = 6
        ctx.fillText(labels[type - 5], px + CELL_SIZE / 2, py + CELL_SIZE / 2 + 3)
        ctx.shadowColor = 'transparent'
        ctx.strokeStyle = color
        ctx.lineWidth = 1.2
        ctx.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2)
      }
    }

    function drawDataNode(n, collected, tick) {
      if (collected) return
      const px = n.x * CELL_SIZE + CELL_SIZE / 2
      const py = n.y * CELL_SIZE + CELL_SIZE / 2
      const pulse = Math.sin(tick * 0.08 + n.id) * 3 + 7
      const wobble = Math.sin(tick * 0.05 + n.id * 0.7) * 1.5

      ctx.save()
      ctx.shadowColor = '#00ff41'
      ctx.shadowBlur = 14 + pulse
      ctx.strokeStyle = '#00ff41'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(px + wobble, py, pulse, 0, Math.PI * 2)
      ctx.stroke()

      // Inner ring
      ctx.strokeStyle = '#00ff4166'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(px + wobble, py, pulse * 0.6, 0, Math.PI * 2)
      ctx.stroke()

      ctx.fillStyle = '#00ff41'
      ctx.font = '10px monospace'
      ctx.textAlign = 'center'
      ctx.shadowBlur = 8
      ctx.fillText('◆', px + wobble, py + 4)
      ctx.restore()
    }

    function drawExit(exit, tick) {
      const px = exit.x * CELL_SIZE
      const py = exit.y * CELL_SIZE
      const pulse = Math.sin(tick * 0.05) * 0.3 + 0.7
      const rotate = (tick * 0.02) % (Math.PI * 2)

      ctx.save()
      ctx.globalAlpha = pulse
      ctx.fillStyle = '#ffb00018'
      ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE)
      ctx.strokeStyle = '#ffb000'
      ctx.lineWidth = 2.5
      ctx.shadowColor = '#ffb000'
      ctx.shadowBlur = 12
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      ctx.strokeRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4)
      
      ctx.globalAlpha = 1
      ctx.fillStyle = '#ffb000'
      ctx.font = '18px monospace'
      ctx.textAlign = 'center'
      ctx.save()
      ctx.translate(px + CELL_SIZE / 2, py + CELL_SIZE / 2)
      ctx.rotate(rotate)
      ctx.fillText('⬡', 0, 6)
      ctx.restore()
      ctx.restore()
    }

    function drawBot(bx, by, direction, energy, tick) {
      const px = bx * CELL_SIZE + CELL_SIZE / 2
      const py = by * CELL_SIZE + CELL_SIZE / 2
      const r = CELL_SIZE * 0.35
      const energyColor = energy < 20 ? '#ff0040' : energy < 50 ? '#ffb000' : '#00ff41'

      ctx.save()
      // Glow with energy color
      ctx.shadowColor = energyColor
      ctx.shadowBlur = 18 + (energy / 100) * 4
      ctx.strokeStyle = energyColor
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.arc(px, py, r, 0, Math.PI * 2)
      ctx.stroke()

      // Energy ring (inner)
      ctx.strokeStyle = energyColor + '44'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(px, py, r - 4, 0, Math.PI * 2)
      ctx.stroke()

      // Inner fill
      ctx.fillStyle = energy < 20 ? '#1a0005' : energy < 50 ? '#1a1400' : '#001500'
      ctx.beginPath()
      ctx.arc(px, py, r - 1, 0, Math.PI * 2)
      ctx.fill()

      // Direction arrow — enhanced
      const angle = direction * Math.PI / 2 - Math.PI / 2
      ctx.beginPath()
      ctx.moveTo(px + Math.cos(angle) * (r - 5), py + Math.sin(angle) * (r - 5))
      ctx.lineTo(px + Math.cos(angle + 2.4) * (r - 11), py + Math.sin(angle + 2.4) * (r - 11))
      ctx.lineTo(px + Math.cos(angle - 2.4) * (r - 11), py + Math.sin(angle - 2.4) * (r - 11))
      ctx.closePath()
      ctx.fillStyle = energyColor
      ctx.shadowBlur = 10
      ctx.fill()
      ctx.shadowBlur = 0

      // Center dot with pulse
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(px, py, 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = energyColor
      ctx.lineWidth = 0.8
      ctx.stroke()

      ctx.restore()
    }

    function drawEnemy(e, tick) {
      const px = e.x * CELL_SIZE + CELL_SIZE / 2
      const py = e.y * CELL_SIZE + CELL_SIZE / 2
      const r = CELL_SIZE * 0.30
      const flicker = Math.sin(tick * 0.15 + e.id * 1.3) * 0.25 + 0.75
      const rotation = (tick * 0.03 + e.id) % (Math.PI * 2)

      ctx.save()
      ctx.globalAlpha = flicker
      ctx.shadowColor = '#ff0040'
      ctx.shadowBlur = 16
      ctx.strokeStyle = '#ff0040'
      ctx.lineWidth = 2
      
      // Rotating diamond
      ctx.translate(px, py)
      ctx.rotate(rotation)
      ctx.beginPath()
      ctx.moveTo(0, -r)
      ctx.lineTo(r, 0)
      ctx.lineTo(0, r)
      ctx.lineTo(-r, 0)
      ctx.closePath()
      ctx.stroke()
      
      // Inner diamond
      ctx.strokeStyle = '#ff004044'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, -r * 0.6)
      ctx.lineTo(r * 0.6, 0)
      ctx.lineTo(0, r * 0.6)
      ctx.lineTo(-r * 0.6, 0)
      ctx.closePath()
      ctx.stroke()

      ctx.fillStyle = '#1a0000'
      ctx.beginPath()
      ctx.moveTo(0, -r)
      ctx.lineTo(r, 0)
      ctx.lineTo(0, r)
      ctx.lineTo(-r, 0)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = '#ff0040'
      ctx.font = 'bold 11px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('✕', 0, 4)
      
      ctx.globalAlpha = 1
      ctx.restore()
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

      // Animated background grid
      ctx.strokeStyle = '#00ff4108'
      ctx.lineWidth = 0.5
      const gridGap = CELL_SIZE
      for (let x = 0; x <= gridW; x += gridGap) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, gridH)
        ctx.stroke()
      }
      for (let y = 0; y <= gridH; y += gridGap) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(gridW, y)
        ctx.stroke()
      }

      // Draw grid cells
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
      enemies.forEach(e => drawEnemy(e, tick))

      // Draw bot
      drawBot(bot.x, bot.y, bot.direction, bot.energy, tick)

      // Execution highlight with glow
      if (status === 'running') {
        const bx = bot.x * CELL_SIZE
        const by = bot.y * CELL_SIZE
        ctx.shadowColor = '#00ff4155'
        ctx.shadowBlur = 8
        ctx.strokeStyle = '#00ff4166'
        ctx.lineWidth = 2.5
        ctx.setLineDash([5, 3])
        ctx.strokeRect(bx + 1, by + 1, CELL_SIZE - 2, CELL_SIZE - 2)
        ctx.setLineDash([])
        ctx.shadowColor = 'transparent'
      }

      ctx.restore()

      raf = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(raf)
  }, [bot, enemies, levelData, collectedNodes, status])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div className="panel-header" style={{ fontSize: 9, userSelect: 'none' }}>VIEWPORT — SECTOR MAP</div>
      <canvas ref={canvasRef} style={{ 
        width: '100%', 
        height: 'calc(100% - 22px)', 
        display: 'block', 
        background: '#000',
        imageRendering: 'crisp-edges'
      }} />
    </div>
  )
}
