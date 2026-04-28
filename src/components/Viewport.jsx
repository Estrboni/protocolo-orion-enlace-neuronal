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

class Particle {
  constructor(x, y, vx, vy, color, life) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy
    this.color = color; this.life = life; this.maxLife = life
    this.size = 3
  }
  update() { this.x += this.vx; this.y += this.vy; this.life--; this.size *= 0.98 }
  draw(ctx) {
    const alpha = this.life / this.maxLife
    ctx.globalAlpha = alpha
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }
}

function lerp(a, b, t) { return a + (b - a) * t }

export default function Viewport() {
  const canvasRef = useRef(null)
  const { bot, enemies, levelData, collectedNodes, status, executionStep } = useSelector(s => s.game)
  const { blocks } = useSelector(s => s.program)
  const particlesRef = useRef([])
  const animRef = useRef({ botX: bot.x, botY: bot.y, tick: 0 })
  const lastCollectedRef = useRef(collectedNodes.length)

  // Trigger particles on node collection
  useEffect(() => {
    if (collectedNodes.length > lastCollectedRef.current && levelData) {
      const nodeId = collectedNodes[collectedNodes.length - 1]
      const node = levelData.dataNodes.find(n => n.id === nodeId)
      if (node) {
        const px = node.x * CELL_SIZE + CELL_SIZE / 2
        const py = node.y * CELL_SIZE + CELL_SIZE / 2
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2
          const speed = 2 + Math.random() * 1.5
          particlesRef.current.push(
            new Particle(px, py, Math.cos(angle) * speed, Math.sin(angle) * speed, '#00ff41', 40)
          )
        }
      }
      lastCollectedRef.current = collectedNodes.length
    }
  }, [collectedNodes, levelData])

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

      ctx.save()
      ctx.shadowColor = '#00ff41'
      ctx.shadowBlur = 12 + pulse
      ctx.strokeStyle = '#00ff41'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(px, py, pulse, 0, Math.PI * 2)
      ctx.stroke()

      ctx.fillStyle = '#00ff41'
      ctx.font = '8px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('◆', px, py + 3)
      ctx.restore()
    }

    function drawExit(exit, tick) {
      const px = exit.x * CELL_SIZE
      const py = exit.y * CELL_SIZE
      const pulse = Math.sin(tick * 0.05) * 0.3 + 0.7

      ctx.save()
      ctx.globalAlpha = pulse
      ctx.fillStyle = '#ffb00022'
      ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE)
      ctx.strokeStyle = '#ffb000'
      ctx.lineWidth = 2
      ctx.shadowColor = '#ffb000'
      ctx.shadowBlur = 10
      ctx.strokeRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4)
      ctx.globalAlpha = 1
      ctx.fillStyle = '#ffb000'
      ctx.font = '16px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('⬡', px + CELL_SIZE / 2, py + CELL_SIZE / 2 + 6)
      ctx.restore()
    }

    function drawBot(bx, by, direction, energy, tick) {
      const px = bx * CELL_SIZE + CELL_SIZE / 2
      const py = by * CELL_SIZE + CELL_SIZE / 2
      const r = CELL_SIZE * 0.32
      const energyColor = energy < 20 ? '#ff0040' : energy < 50 ? '#ffb000' : '#00ff41'

      ctx.save()
      ctx.shadowColor = energyColor
      ctx.shadowBlur = 16
      ctx.strokeStyle = energyColor
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(px, py, r, 0, Math.PI * 2)
      ctx.stroke()

      ctx.fillStyle = energy < 20 ? '#1a0000' : '#001a00'
      ctx.fill()

      const angle = direction * Math.PI / 2 - Math.PI / 2
      ctx.beginPath()
      ctx.moveTo(px + Math.cos(angle) * (r - 4), py + Math.sin(angle) * (r - 4))
      ctx.lineTo(px + Math.cos(angle + 2.5) * (r - 10), py + Math.sin(angle + 2.5) * (r - 10))
      ctx.lineTo(px + Math.cos(angle - 2.5) * (r - 10), py + Math.sin(angle - 2.5) * (r - 10))
      ctx.closePath()
      ctx.fillStyle = energyColor
      ctx.shadowBlur = 8
      ctx.fill()

      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(px, py, 3, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }

    function drawEnemyDetection(enemy, tick) {
      const range = 3.5
      const px = enemy.x * CELL_SIZE + CELL_SIZE / 2
      const py = enemy.y * CELL_SIZE + CELL_SIZE / 2
      const r = range * CELL_SIZE
      const alpha = Math.sin(tick * 0.1 + enemy.id) * 0.15 + 0.1

      ctx.globalAlpha = alpha
      ctx.strokeStyle = '#ff004077'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.arc(px, py, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.globalAlpha = 1
    }

    function drawEnemy(e, tick) {
      const px = e.x * CELL_SIZE + CELL_SIZE / 2
      const py = e.y * CELL_SIZE + CELL_SIZE / 2
      const r = CELL_SIZE * 0.28
      const flicker = Math.sin(tick * 0.15 + e.id * 1.3) * 0.3 + 0.7

      ctx.save()
      ctx.globalAlpha = flicker
      ctx.shadowColor = '#ff0040'
      ctx.shadowBlur = 14
      ctx.strokeStyle = '#ff0040'
      ctx.lineWidth = 1.5
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
      ctx.font = '10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('✕', px, py + 4)
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

      const offsetX = Math.max(0, (canvas.width - gridW) / 2)
      const offsetY = Math.max(0, (canvas.height - gridH) / 2)

      ctx.save()
      ctx.translate(offsetX, offsetY)

      ctx.fillStyle = '#000'
      ctx.fillRect(-offsetX, -offsetY, canvas.width, canvas.height)

      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          drawCell(x, y, grid[y][x])
        }
      }

      drawExit(levelData.exitPos, tick)
      levelData.dataNodes.forEach(n => drawDataNode(n, collectedNodes.includes(n.id), tick))

      // Draw enemy detection ranges (only during execution)
      if (status === 'running') {
        enemies.forEach(e => drawEnemyDetection(e, tick))
      }

      enemies.forEach(e => drawEnemy(e, tick))
      drawBot(bot.x, bot.y, bot.direction, bot.energy, tick)

      // Update and draw particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i]
        p.update()
        p.draw(ctx)
        if (p.life <= 0) particlesRef.current.splice(i, 1)
      }

      if (status === 'running') {
        ctx.strokeStyle = '#00ff4133'
        ctx.lineWidth = 2
        ctx.setLineDash([4, 4])
        ctx.strokeRect(bot.x * CELL_SIZE + 1, bot.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2)
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
      <div className="panel-header" style={{ fontSize: 9 }}>VIEWPORT — SECTOR MAP</div>
      <canvas ref={canvasRef} style={{ width: '100%', height: 'calc(100% - 22px)', display: 'block', background: '#000' }} />
    </div>
  )
}
