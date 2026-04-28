import React, { useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { CELL } from '../levels/levelData'

function getAdaptiveCellSize(windowWidth, windowHeight) {
  if (windowWidth < 600) return 24
  if (windowWidth < 1000) return 28
  return 36
}

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
  const { bot, enemies, levelData, collectedNodes, status } = useSelector(s => s.game)
  const animRef = useRef({ tick: 0, cellSize: 36 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf

    function drawCell(x, y, type, cellSize, isActive) {
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
        for (let i = 0; i < cellSize; i += 6) {
          ctx.beginPath(); ctx.moveTo(px + i, py); ctx.lineTo(px + i, py + cellSize); ctx.stroke()
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
        ctx.font = `bold ${Math.max(6, cellSize * 0.25)}px monospace`
        ctx.textAlign = 'center'
        ctx.fillText(labels[type - 5], px + cellSize / 2, py + cellSize / 2 + 2)
        ctx.strokeStyle = color
        ctx.lineWidth = 1
        ctx.strokeRect(px + 1, py + 1, cellSize - 2, cellSize - 2)
      }
    }

    function drawDataNode(n, collected, tick, cellSize) {
      if (collected) return
      const px = n.x * cellSize + cellSize / 2
      const py = n.y * cellSize + cellSize / 2
      const pulse = Math.sin(tick * 0.08 + n.id) * 2 + 4

      ctx.save()
      ctx.shadowColor = '#00ff41'
      ctx.shadowBlur = 10 + pulse
      ctx.strokeStyle = '#00ff41'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(px, py, pulse, 0, Math.PI * 2)
      ctx.stroke()

      ctx.fillStyle = '#00ff41'
      ctx.font = `${Math.max(6, cellSize * 0.4)}px monospace`
      ctx.textAlign = 'center'
      ctx.fillText('◆', px, py + 2)
      ctx.restore()
    }

    function drawExit(exit, tick, cellSize) {
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
      ctx.font = `${cellSize * 0.6}px monospace`
      ctx.textAlign = 'center'
      ctx.fillText('⬡', px + cellSize / 2, py + cellSize / 2 + 3)
      ctx.restore()
    }

    function drawBot(bx, by, direction, energy, tick, cellSize) {
      const px = bx * cellSize + cellSize / 2
      const py = by * cellSize + cellSize / 2
      const r = cellSize * 0.32

      ctx.save()
      // Glow
      ctx.shadowColor = energy < 20 ? '#ff0040' : '#00ff41'
      ctx.shadowBlur = 12
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
      ctx.moveTo(px + Math.cos(angle) * (r - 3), py + Math.sin(angle) * (r - 3))
      ctx.lineTo(px + Math.cos(angle + 2.5) * (r - 8), py + Math.sin(angle + 2.5) * (r - 8))
      ctx.lineTo(px + Math.cos(angle - 2.5) * (r - 8), py + Math.sin(angle - 2.5) * (r - 8))
      ctx.closePath()
      ctx.fillStyle = energy < 20 ? '#ff0040' : '#00ff41'
      ctx.shadowBlur = 6
      ctx.fill()

      // Center dot
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(px, py, 2, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }

    function drawEnemy(e, tick, cellSize) {
      const px = e.x * cellSize + cellSize / 2
      const py = e.y * cellSize + cellSize / 2
      const r = cellSize * 0.28
      const flicker = Math.sin(tick * 0.15 + e.id * 1.3) * 0.3 + 0.7

      ctx.save()
      ctx.globalAlpha = flicker
      ctx.shadowColor = '#ff0040'
      ctx.shadowBlur = 12
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
      ctx.font = `${cellSize * 0.5}px monospace`
      ctx.textAlign = 'center'
      ctx.fillText('✕', px, py + 2)
      ctx.globalAlpha = 1
      ctx.restore()
    }

    function render() {
      animRef.current.tick++
      const tick = animRef.current.tick

      if (!levelData) return

      // Adaptive cell size
      const cellSize = getAdaptiveCellSize(canvas.offsetWidth, canvas.offsetHeight)
      animRef.current.cellSize = cellSize

      const grid = levelData.grid
      const gridW = grid[0].length * cellSize
      const gridH = grid.length * cellSize

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
          drawCell(x, y, grid[y][x], cellSize)
        }
      }

      // Draw exit
      drawExit(levelData.exitPos, tick, cellSize)

      // Draw data nodes
      levelData.dataNodes.forEach(n => drawDataNode(n, collectedNodes.includes(n.id), tick, cellSize))

      // Draw enemies
      enemies.forEach(e => drawEnemy(e, tick, cellSize))

      // Draw bot
      drawBot(bot.x, bot.y, bot.direction, bot.energy, tick, cellSize)

      // Execution highlight
      if (status === 'running' || status === 'paused') {
        ctx.strokeStyle = status === 'paused' ? '#ffb04466' : '#00ff4133'
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
  }, [bot, enemies, levelData, collectedNodes, status])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{
        padding: '4px 10px',
        fontSize: 'clamp(7px, 1.2vw, 9px)',
        letterSpacing: 3,
        color: '#006622',
        borderBottom: '1px solid #003300',
        textTransform: 'uppercase'
      }}>▶ VIEWPORT</div>
      <canvas ref={canvasRef} style={{ width: '100%', height: 'calc(100% - 22px)', display: 'block', background: '#000' }} />
    </div>
  )
}
