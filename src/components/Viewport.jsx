import React, { useRef, useEffect, useState } from 'react'
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

export default function Viewport() {
  const canvasRef = useRef(null)
  const { bot, enemies, levelData, collectedNodes, status, executionStep } = useSelector(s => s.game)
  const animRef = useRef({ tick: 0, particles: [] })
  const [cellSize, setCellSize] = useState(CELL_SIZE)

  // Responsive cell sizing
  useEffect(() => {
    function handleResize() {
      if (!canvasRef.current) return
      const w = canvasRef.current.offsetWidth
      const h = canvasRef.current.offsetHeight
      const gridW = levelData?.grid[0].length ?? 16
      const gridH = levelData?.grid.length ?? 16
      const maxCellX = Math.floor(w / gridW)
      const maxCellY = Math.floor(h / gridH)
      const newSize = Math.min(maxCellX, maxCellY, CELL_SIZE)
      setCellSize(Math.max(16, newSize))
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [levelData])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf

    function drawCell(x, y, type) {
      const px = x * cellSize
      const py = y * cellSize
      const color = COLORS[type] ?? '#050f05'

      ctx.fillStyle = color
      if (type === CELL.WALL) {
        ctx.fillStyle = '#001a00'
        ctx.fillRect(px, py, cellSize, cellSize)
        ctx.strokeStyle = '#003300'
        ctx.lineWidth = 1
        ctx.strokeRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1)
        // Wall pattern
        ctx.strokeStyle = '#002200'
        ctx.lineWidth = 0.5
        for (let i = 0; i < cellSize; i += 8) {
          ctx.beginPath()
          ctx.moveTo(px + i, py)
          ctx.lineTo(px + i, py + cellSize)
          ctx.stroke()
        }
      } else {
        ctx.fillRect(px, py, cellSize, cellSize)
        ctx.strokeStyle = '#003300'
        ctx.lineWidth = 0.5
        ctx.strokeRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1)
      }

      // Gate cells
      if (type >= 5 && type <= 8) {
        const labels = ['AND', 'OR', 'NOT', 'XOR']
        ctx.fillStyle = color
        ctx.globalAlpha = 0.15
        ctx.fillRect(px, py, cellSize, cellSize)
        ctx.globalAlpha = 1
        ctx.fillStyle = color
        const fontSize = Math.max(6, cellSize / 5)
        ctx.font = `bold ${fontSize}px monospace`
        ctx.textAlign = 'center'
        ctx.fillText(labels[type - 5], px + cellSize / 2, py + cellSize / 2 + fontSize / 3)
        ctx.strokeStyle = color
        ctx.lineWidth = 1
        ctx.strokeRect(px + 1, py + 1, cellSize - 2, cellSize - 2)
      }
    }

    function drawDataNode(n, collected, tick) {
      if (collected) return
      const px = n.x * cellSize + cellSize / 2
      const py = n.y * cellSize + cellSize / 2
      const pulse = Math.sin(tick * 0.08 + n.id) * 3 + 6

      ctx.save()
      ctx.shadowColor = '#00ff41'
      ctx.shadowBlur = 12 + pulse
      ctx.strokeStyle = '#00ff41'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(px, py, pulse, 0, Math.PI * 2)
      ctx.stroke()

      ctx.fillStyle = '#00ff41'
      const fontSize = Math.max(8, cellSize / 4)
      ctx.font = `${fontSize}px monospace`
      ctx.textAlign = 'center'
      ctx.fillText('◆', px, py + fontSize / 3)
      ctx.restore()
    }

    function drawExit(exit, tick) {
      const px = exit.x * cellSize
      const py = exit.y * cellSize
      const pulse = Math.sin(tick * 0.05) * 0.3 + 0.7

      ctx.save()
      ctx.globalAlpha = pulse
      ctx.fillStyle = '#ffb00022'
      ctx.fillRect(px, py, cellSize, cellSize)
      ctx.strokeStyle = '#ffb000'
      ctx.lineWidth = 2
      ctx.shadowColor = '#ffb000'
      ctx.shadowBlur = 10
      ctx.strokeRect(px + 2, py + 2, cellSize - 4, cellSize - 4)
      ctx.globalAlpha = 1
      ctx.fillStyle = '#ffb000'
      const fontSize = Math.max(14, cellSize / 2)
      ctx.font = `${fontSize}px monospace`
      ctx.textAlign = 'center'
      ctx.fillText('⬡', px + cellSize / 2, py + cellSize / 2 + fontSize / 3)
      ctx.restore()
    }

    function drawBot(bx, by, direction, energy, tick) {
      const px = bx * cellSize + cellSize / 2
      const py = by * cellSize + cellSize / 2
      const r = cellSize * 0.32

      ctx.save()
      // Glow
      ctx.shadowColor = energy < 20 ? '#ff0040' : '#00ff41'
      ctx.shadowBlur = 16
      ctx.strokeStyle = energy < 20 ? '#ff0040' : '#00ff41'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(px, py, r, 0, Math.PI * 2)
      ctx.stroke()

      // Inner
      ctx.fillStyle = energy < 20 ? '#1a0000' : '#001a00'
      ctx.fill()

      // Direction arrow
      const angle = direction * Math.PI / 2 - Math.PI / 2
      ctx.beginPath()
      ctx.moveTo(px + Math.cos(angle) * (r - 4), py + Math.sin(angle) * (r - 4))
      ctx.lineTo(px + Math.cos(angle + 2.5) * (r - 10), py + Math.sin(angle + 2.5) * (r - 10))
      ctx.lineTo(px + Math.cos(angle - 2.5) * (r - 10), py + Math.sin(angle - 2.5) * (r - 10))
      ctx.closePath()
      ctx.fillStyle = energy < 20 ? '#ff0040' : '#00ff41'
      ctx.shadowBlur = 8
      ctx.fill()

      // Center dot
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(px, py, 3, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }

    function drawEnemy(e, tick) {
      const px = e.x * cellSize + cellSize / 2
      const py = e.y * cellSize + cellSize / 2
      const r = cellSize * 0.28
      const flicker = Math.sin(tick * 0.15 + e.id * 1.3) * 0.3 + 0.7

      ctx.save()
      ctx.globalAlpha = flicker
      ctx.shadowColor = '#ff0040'
      ctx.shadowBlur = 14
      ctx.strokeStyle = '#ff0040'
      ctx.lineWidth = 1.5
      // Diamond shape
      ctx.beginPath()
      ctx.moveTo(px, py - r)
      ctx.lineTo(px + r, py)
      ctx.lineTo(px, py + r)
      ctx.lineTo(px - r, py)
      ctx.closePath()
      ctx.stroke()
      ctx.fillStyle = '#1a0000'
      ctx.fill()
      ctx.fillStyle = '#ff0040'
      const fontSize = Math.max(8, cellSize / 4)
      ctx.font = `${fontSize}px monospace`
      ctx.textAlign = 'center'
      ctx.fillText('✕', px, py + fontSize / 3)
      ctx.globalAlpha = 1
      ctx.restore()
    }

    function drawParticles() {
      for (let i = animRef.current.particles.length - 1; i >= 0; i--) {
        const p = animRef.current.particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.1 // gravity
        p.life -= 0.02
        if (p.life <= 0) {
          animRef.current.particles.splice(i, 1)
          continue
        }
        ctx.save()
        ctx.globalAlpha = p.life
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }

    function render() {
      animRef.current.tick++
      const tick = animRef.current.tick

      if (!levelData) return

      const grid = levelData.grid
      const gridW = grid[0].length * cellSize
      const gridH = grid.length * cellSize

      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight

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
      enemies.forEach(e => drawEnemy(e, tick))

      // Draw bot
      drawBot(bot.x, bot.y, bot.direction, bot.energy, tick)

      // Particles
      drawParticles()

      // Execution highlight
      if (status === 'running') {
        ctx.strokeStyle = '#00ff4133'
        ctx.lineWidth = 2
        ctx.setLineDash([4, 4])
        ctx.strokeRect(bot.x * cellSize + 1, bot.y * cellSize + 1, cellSize - 2, cellSize - 2)
        ctx.setLineDash([])
      }

      ctx.restore()

      raf = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(raf)
  }, [bot, enemies, levelData, collectedNodes, status, cellSize])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div className="panel-header" style={{ fontSize: '9px', flexShrink: 0 }}>VIEWPORT — SECTOR MAP</div>
      <canvas
        ref={canvasRef}
        style={{
          flex: 1,
          display: 'block',
          background: '#000',
          width: '100%',
          minHeight: 0
        }}
        role="img"
        aria-label="Game viewport showing bot and enemies"
      />
    </div>
  )
}
