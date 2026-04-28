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

function lerp(a, b, t) { return a + (b - a) * t }

export default function Viewport() {
  const canvasRef = useRef(null)
  const { bot, enemies, levelData, collectedNodes, status, executionStep } = useSelector(s => s.game)
  const animRef = useRef({ botPos: { x: bot.x, y: bot.y }, enemyPos: enemies.map(e => ({ x: e.x, y: e.y })), tick: 0, transitionT: 0 })
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 })
  const resizeRef = useRef(null)

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        setCanvasSize({ w: canvasRef.current.offsetWidth, h: canvasRef.current.offsetHeight })
      }
    }
    handleResize()
    resizeRef.current = setInterval(handleResize, 500)
    return () => clearInterval(resizeRef.current)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !levelData) return
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

      // Gate cells with better visuals
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
        ctx.shadowColor = color
        ctx.shadowBlur = 6
        ctx.strokeStyle = color
        ctx.lineWidth = 1.5
        ctx.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2)
        ctx.shadowBlur = 0
      }
    }

    function drawDataNode(n, collected, tick) {
      if (collected) return
      const px = n.x * CELL_SIZE + CELL_SIZE / 2
      const py = n.y * CELL_SIZE + CELL_SIZE / 2
      const pulse = Math.sin(tick * 0.08 + n.id) * 4 + 8

      ctx.save()
      ctx.shadowColor = '#00ff41'
      ctx.shadowBlur = 12 + pulse
      ctx.strokeStyle = '#00ff41'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(px, py, pulse, 0, Math.PI * 2)
      ctx.stroke()

      ctx.fillStyle = '#00ff41'
      ctx.font = 'bold 10px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('◆', px, py)
      ctx.restore()
    }

    function drawExit(exit, tick) {
      const px = exit.x * CELL_SIZE
      const py = exit.y * CELL_SIZE
      const pulse = Math.sin(tick * 0.05) * 0.4 + 0.6

      ctx.save()
      ctx.globalAlpha = pulse
      ctx.fillStyle = '#ffb00022'
      ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE)
      ctx.strokeStyle = '#ffb000'
      ctx.lineWidth = 2.5
      ctx.shadowColor = '#ffb000'
      ctx.shadowBlur = 12
      ctx.strokeRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4)
      ctx.globalAlpha = 1
      ctx.fillStyle = '#ffb000'
      ctx.font = 'bold 18px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('⬡', px + CELL_SIZE / 2, py + CELL_SIZE / 2)
      ctx.restore()
    }

    function drawBot(bx, by, direction, energy, tick) {
      const px = bx * CELL_SIZE + CELL_SIZE / 2
      const py = by * CELL_SIZE + CELL_SIZE / 2
      const r = CELL_SIZE * 0.35

      ctx.save()
      // Energy-based glow
      const glowColor = energy < 20 ? '#ff0040' : energy < 50 ? '#ffb000' : '#00ff41'
      ctx.shadowColor = glowColor
      ctx.shadowBlur = 18 + Math.sin(tick * 0.1) * 6
      ctx.strokeStyle = glowColor
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.arc(px, py, r, 0, Math.PI * 2)
      ctx.stroke()

      // Inner circle
      ctx.fillStyle = energy < 20 ? '#1a0000' : '#001a00'
      ctx.fill()

      // Direction arrow with smooth rotation
      const angle = direction * Math.PI / 2 - Math.PI / 2 + Math.sin(tick * 0.05) * 0.1
      ctx.beginPath()
      ctx.moveTo(px + Math.cos(angle) * (r - 6), py + Math.sin(angle) * (r - 6))
      ctx.lineTo(px + Math.cos(angle + 2.6) * (r - 12), py + Math.sin(angle + 2.6) * (r - 12))
      ctx.lineTo(px + Math.cos(angle - 2.6) * (r - 12), py + Math.sin(angle - 2.6) * (r - 12))
      ctx.closePath()
      ctx.fillStyle = glowColor
      ctx.fill()

      // Center dot
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(px, py, 4, 0, Math.PI * 2)
      ctx.fill()

      // Energy bar below
      const barW = r * 1.8, barH = 4
      ctx.fillStyle = '#001a00'
      ctx.fillRect(px - barW / 2, py + r + 8, barW, barH)
      ctx.fillStyle = energy < 20 ? '#ff0040' : energy < 50 ? '#ffb000' : '#00ff41'
      ctx.fillRect(px - barW / 2, py + r + 8, (barW * energy) / 100, barH)
      ctx.strokeStyle = glowColor
      ctx.lineWidth = 1
      ctx.strokeRect(px - barW / 2, py + r + 8, barW, barH)

      ctx.restore()
    }

    function drawEnemy(e, tick, isActive) {
      const px = e.x * CELL_SIZE + CELL_SIZE / 2
      const py = e.y * CELL_SIZE + CELL_SIZE / 2
      const r = CELL_SIZE * 0.3
      const flicker = Math.sin(tick * 0.15 + e.id * 1.3) * 0.25 + 0.75

      ctx.save()
      ctx.globalAlpha = flicker
      ctx.shadowColor = '#ff0040'
      ctx.shadowBlur = isActive ? 20 : 14
      ctx.strokeStyle = '#ff0040'
      ctx.lineWidth = isActive ? 2.5 : 2
      // Diamond with rotation
      const rot = tick * 0.02 + e.id
      ctx.translate(px, py)
      ctx.rotate(rot)
      ctx.beginPath()
      ctx.moveTo(0, -r)
      ctx.lineTo(r, 0)
      ctx.lineTo(0, r)
      ctx.lineTo(-r, 0)
      ctx.closePath()
      ctx.stroke()
      ctx.fillStyle = '#1a0000'
      ctx.fill()
      ctx.rotate(-rot)
      ctx.translate(-px, -py)
      ctx.fillStyle = '#ff0040'
      ctx.font = 'bold 10px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('✕', px, py + 1)
      ctx.globalAlpha = 1
      ctx.restore()
    }

    function render() {
      animRef.current.tick++
      const tick = animRef.current.tick

      const grid = levelData.grid
      const gridW = grid[0].length * CELL_SIZE
      const gridH = grid.length * CELL_SIZE

      canvas.width = canvasSize.w
      canvas.height = canvasSize.h

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

      // Draw enemies with activity highlight
      enemies.forEach((e, i) => {
        const isActive = status === 'running'
        drawEnemy(e, tick, isActive)
      })

      // Draw bot
      drawBot(bot.x, bot.y, bot.direction, bot.energy, tick)

      // Execution highlight with pulsing border
      if (status === 'running') {
        const pulse = Math.sin(tick * 0.08) * 2 + 2
        ctx.strokeStyle = `#00ff41${Math.floor((0.5 + Math.sin(tick * 0.08) * 0.3) * 255).toString(16)}`
        ctx.lineWidth = pulse
        ctx.setLineDash([3, 3])
        ctx.strokeRect(bot.x * CELL_SIZE + pulse/2, bot.y * CELL_SIZE + pulse/2, CELL_SIZE - pulse, CELL_SIZE - pulse)
        ctx.setLineDash([])
      }

      ctx.restore()

      raf = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(raf)
  }, [bot, enemies, levelData, collectedNodes, status, canvasSize])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div className="panel-header" style={{ fontSize: 9 }}>VIEWPORT — SECTOR MAP</div>
      <canvas ref={canvasRef} style={{ width: '100%', height: 'calc(100% - 22px)', display: 'block', background: '#000' }} />
    </div>
  )
}
