import { CELL } from '../levels/levelData'

const DIRS = [
  { x: 0, y: -1 }, // 0 = UP
  { x: 1, y: 0 },  // 1 = RIGHT
  { x: 0, y: 1 },  // 2 = DOWN
  { x: -1, y: 0 }, // 3 = LEFT
]

export function executeStep(block, bot, grid, enemies, dataNodes, collectedNodes, params = {}) {
  const logs = []
  let newBot = { ...bot }
  let sensorTriggered = false

  switch (block.type) {
    case 'MOVE': {
      const steps = block.params.steps ?? 1
      for (let i = 0; i < steps; i++) {
        const dir = DIRS[newBot.direction]
        const nx = newBot.x + dir.x
        const ny = newBot.y + dir.y
        const cellType = grid[ny]?.[nx]
        if (cellType === 1) {
          logs.push({ type: 'error', msg: `> COLLISION at [${nx},${ny}] — WALL_COLLISION_EXCEPTION` })
          return { bot: newBot, logs, collision: true, sensorTriggered }
        }
        // Logic gate check
        if (cellType >= 5 && cellType <= 8) {
          logs.push({ type: 'warn', msg: `> GATE_${['AND','OR','NOT','XOR'][cellType-5]} at [${nx},${ny}] — requires gate block` })
        }
        // Energy calculation: E = v^2 * t (v=1 unit/step, t=1)
        newBot.energy = Math.max(0, newBot.energy - 1)
        newBot.x = nx
        newBot.y = ny
        logs.push({ type: 'info', msg: `> MOVE [${nx},${ny}] E=${newBot.energy.toFixed(1)}` })
      }
      break
    }
    case 'ROTATE': {
      const dir = block.params.direction === 'left' ? -1 : 1
      newBot.direction = ((newBot.direction + dir) + 4) % 4
      const dirNames = ['NORTH', 'EAST', 'SOUTH', 'WEST']
      logs.push({ type: 'info', msg: `> ROTATE → facing ${dirNames[newBot.direction]}` })
      break
    }
    case 'IF_SENSOR': {
      const range = block.params.range ?? 3
      const nearby = enemies.filter(e => {
        const dist = Math.sqrt(Math.pow(e.x - newBot.x, 2) + Math.pow(e.y - newBot.y, 2))
        return dist <= range
      })
      sensorTriggered = nearby.length > 0
      logs.push({ type: sensorTriggered ? 'warn' : 'info', msg: `> IF_SENSOR range=${range} → ${sensorTriggered ? `THREAT_DETECTED [${nearby.length}]` : 'CLEAR'}` })
      break
    }
    case 'LOOP_UNTIL': {
      logs.push({ type: 'info', msg: `> LOOP_UNTIL condition=${block.params.condition ?? 'EXIT'} [compiled]` })
      break
    }
    case 'AND_GATE': {
      logs.push({ type: 'info', msg: `> AND_GATE: A=${block.params.a ?? 1} B=${block.params.b ?? 1} → ${(block.params.a ?? 1) & (block.params.b ?? 1)}` })
      break
    }
    case 'OR_GATE': {
      logs.push({ type: 'info', msg: `> OR_GATE: A=${block.params.a ?? 1} B=${block.params.b ?? 0} → ${(block.params.a ?? 1) | (block.params.b ?? 0)}` })
      break
    }
    case 'NOT_GATE': {
      logs.push({ type: 'info', msg: `> NOT_GATE: A=${block.params.a ?? 1} → ${block.params.a ?? 1 ? 0 : 1}` })
      break
    }
    case 'XOR_GATE': {
      logs.push({ type: 'info', msg: `> XOR_GATE: A=${block.params.a ?? 1} B=${block.params.b ?? 1} → ${(block.params.a ?? 1) ^ (block.params.b ?? 1)}` })
      break
    }
    case 'RECURSE': {
      logs.push({ type: 'warn', msg: `> RECURSE — calling program stack [depth+1]` })
      break
    }
    case 'WAIT': {
      logs.push({ type: 'info', msg: `> WAIT ${block.params.ticks ?? 1} ticks` })
      break
    }
    default:
      logs.push({ type: 'error', msg: `> UNKNOWN_OPCODE: ${block.type}` })
  }

  return { bot: newBot, logs, collision: false, sensorTriggered }
}

export function checkWinCondition(bot, levelData, collectedNodes) {
  const allCollected = levelData.dataNodes.every(n => collectedNodes.includes(n.id))
  const atExit = bot.x === levelData.exitPos.x && bot.y === levelData.exitPos.y
  return allCollected && atExit
}

export function checkNodeCollection(bot, dataNodes, collectedNodes) {
  return dataNodes.filter(n => !collectedNodes.includes(n.id) && n.x === bot.x && n.y === bot.y).map(n => n.id)
}
