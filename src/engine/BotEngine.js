import { CELL } from '../levels/levelData'

const DIRS = [
  { x: 0, y: -1 }, // 0 = UP
  { x: 1, y: 0 },  // 1 = RIGHT
  { x: 0, y: 1 },  // 2 = DOWN
  { x: -1, y: 0 }, // 3 = LEFT
]

// Validate block parameters before execution
function validateBlockParams(block) {
  const { type, params } = block
  const errors = []

  switch (type) {
    case 'MOVE':
      const steps = params.steps ?? 1
      if (steps < 1 || steps > 10) errors.push('MOVE steps must be 1-10')
      break
    case 'IF_SENSOR':
      const range = params.range ?? 3
      if (range < 1 || range > 6) errors.push('Sensor range must be 1-6')
      break
    case 'LOOP_UNTIL':
      if (!['EXIT', 'ALL_NODES', 'NO_ENEMIES'].includes(params.condition ?? 'EXIT')) {
        errors.push('Invalid loop condition')
      }
      break
    case 'WAIT':
      const ticks = params.ticks ?? 1
      if (ticks < 1 || ticks > 5) errors.push('Wait ticks must be 1-5')
      break
  }
  return errors
}

export function executeStep(block, bot, grid, enemies, dataNodes, collectedNodes, params = {}) {
  const logs = []
  let newBot = { ...bot }
  let sensorTriggered = false

  // Validate before execution
  const validationErrors = validateBlockParams(block)
  if (validationErrors.length > 0) {
    validationErrors.forEach(err => {
      logs.push({ type: 'error', msg: `> VALIDATION_ERROR: ${err}` })
    })
    return { bot: newBot, logs, collision: false, sensorTriggered, executionError: true }
  }

  switch (block.type) {
    case 'MOVE': {
      const steps = block.params.steps ?? 1
      for (let i = 0; i < steps; i++) {
        const dir = DIRS[newBot.direction]
        const nx = newBot.x + dir.x
        const ny = newBot.y + dir.y

        // Boundary check
        if (nx < 0 || ny < 0 || nx >= grid[0].length || ny >= grid.length) {
          logs.push({ type: 'error', msg: `> BOUNDARY_VIOLATION at [${nx},${ny}]` })
          return { bot: newBot, logs, collision: true, sensorTriggered }
        }

        const cellType = grid[ny][nx]
        if (cellType === 1) {
          logs.push({ type: 'error', msg: `> COLLISION at [${nx},${ny}] — WALL_COLLISION_EXCEPTION` })
          return { bot: newBot, logs, collision: true, sensorTriggered }
        }

        // Logic gate check
        if (cellType >= 5 && cellType <= 8) {
          const gateNames = ['AND', 'OR', 'NOT', 'XOR']
          logs.push({ type: 'warn', msg: `> GATE_${gateNames[cellType - 5]} at [${nx},${ny}] — requires gate block` })
        }

        // Energy calculation: E = v^2 * t (v=1 unit/step, t=1)
        newBot.energy = Math.max(0, newBot.energy - 1)
        newBot.x = nx
        newBot.y = ny
        logs.push({ type: 'info', msg: `> MOVE [${nx},${ny}] E=${newBot.energy.toFixed(1)}` })

        if (newBot.energy === 0) {
          logs.push({ type: 'error', msg: `> ENERGY_DEPLETED — bot shutdown` })
          return { bot: newBot, logs, collision: false, sensorTriggered, executionError: true }
        }
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
      const condition = block.params.condition ?? 'EXIT'
      logs.push({ type: 'info', msg: `> LOOP_UNTIL condition=${condition} [compiled]` })
      break
    }

    case 'AND_GATE': {
      const a = block.params.a ?? 1
      const b = block.params.b ?? 1
      const result = a & b
      logs.push({ type: 'info', msg: `> AND_GATE: ${a} & ${b} = ${result}` })
      break
    }

    case 'OR_GATE': {
      const a = block.params.a ?? 1
      const b = block.params.b ?? 0
      const result = a | b
      logs.push({ type: 'info', msg: `> OR_GATE: ${a} | ${b} = ${result}` })
      break
    }

    case 'NOT_GATE': {
      const a = block.params.a ?? 1
      const result = a ? 0 : 1
      logs.push({ type: 'info', msg: `> NOT_GATE: ¬${a} = ${result}` })
      break
    }

    case 'XOR_GATE': {
      const a = block.params.a ?? 1
      const b = block.params.b ?? 1
      const result = a ^ b
      logs.push({ type: 'info', msg: `> XOR_GATE: ${a} ⊕ ${b} = ${result}` })
      break
    }

    case 'RECURSE': {
      const depth = block.params.depth ?? 1
      if (depth > 10) {
        logs.push({ type: 'error', msg: `> RECURSION_LIMIT_EXCEEDED [depth=${depth}]` })
        return { bot: newBot, logs, collision: false, sensorTriggered, executionError: true }
      }
      logs.push({ type: 'warn', msg: `> RECURSE — calling program stack [depth+${depth}]` })
      break
    }

    case 'WAIT': {
      const ticks = block.params.ticks ?? 1
      logs.push({ type: 'info', msg: `> WAIT ${ticks} ticks` })
      break
    }

    default:
      logs.push({ type: 'error', msg: `> UNKNOWN_OPCODE: ${block.type}` })
      return { bot: newBot, logs, collision: false, sensorTriggered, executionError: true }
  }

  return { bot: newBot, logs, collision: false, sensorTriggered, executionError: false }
}

export function checkWinCondition(bot, levelData, collectedNodes) {
  const allCollected = levelData.dataNodes.every(n => collectedNodes.includes(n.id))
  const atExit = bot.x === levelData.exitPos.x && bot.y === levelData.exitPos.y
  return allCollected && atExit
}

export function checkNodeCollection(bot, dataNodes, collectedNodes) {
  return dataNodes.filter(n => !collectedNodes.includes(n.id) && n.x === bot.x && n.y === bot.y).map(n => n.id)
}

export function checkEnergyDepletion(bot) {
  return bot.energy <= 0
}
