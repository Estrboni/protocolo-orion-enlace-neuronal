// A* Pathfinding + Advanced Enemy AI for Protocolo Orión
// Supports: chase, patrol, ambush, flank behaviors

export function aStar(grid, start, goal, maxIterations = 600) {
  const rows = grid.length
  const cols = grid[0].length

  if (!isWalkable(grid, goal.x, goal.y, cols, rows)) return []

  function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
  }
  function key(pos) { return `${pos.x},${pos.y}` }

  const openSet = new Map()
  const closedSet = new Set()
  const cameFrom = new Map()
  const gScore = new Map()
  const fScore = new Map()

  const startKey = key(start)
  openSet.set(startKey, start)
  gScore.set(startKey, 0)
  fScore.set(startKey, heuristic(start, goal))

  const dirs = [
    { x: 0, y: -1 }, { x: 0, y: 1 },
    { x: -1, y: 0 }, { x: 1, y: 0 }
  ]

  let iterations = 0
  while (openSet.size > 0 && iterations++ < maxIterations) {
    // Lowest fScore
    let current = null, lowestF = Infinity
    for (const [k, node] of openSet) {
      const f = fScore.get(k) ?? Infinity
      if (f < lowestF) { lowestF = f; current = node }
    }
    if (!current) break

    const currentKey = key(current)

    if (current.x === goal.x && current.y === goal.y) {
      const path = []
      let c = currentKey
      while (cameFrom.has(c)) {
        const pos = openSet.get(c) ?? closedSet.get(c)
        if (pos) path.unshift(pos)
        c = cameFrom.get(c)
      }
      return path
    }

    openSet.delete(currentKey)
    closedSet.set(currentKey, current)

    for (const dir of dirs) {
      const nx = current.x + dir.x
      const ny = current.y + dir.y
      if (!isWalkable(grid, nx, ny, cols, rows)) continue
      const neighborKey = key({ x: nx, y: ny })
      if (closedSet.has(neighborKey)) continue
      const neighbor = { x: nx, y: ny }
      const tentativeG = (gScore.get(currentKey) ?? Infinity) + 1
      if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
        cameFrom.set(neighborKey, currentKey)
        gScore.set(neighborKey, tentativeG)
        fScore.set(neighborKey, tentativeG + heuristic(neighbor, goal))
        openSet.set(neighborKey, neighbor)
      }
    }
  }
  return []
}

function isWalkable(grid, x, y, cols, rows) {
  if (x < 0 || y < 0 || x >= cols || y >= rows) return false
  return grid[y][x] !== 1
}

function manhattanDist(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

/**
 * Predict bot's next position based on direction.
 * Used for ambush behavior.
 */
function predictBotPosition(bot, steps = 2) {
  const DIRS = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }]
  const d = DIRS[bot.direction ?? 1]
  return { x: bot.x + d.x * steps, y: bot.y + d.y * steps }
}

/**
 * Get a flanking position — offset perpendicular to the enemy→bot vector.
 */
function flankPosition(enemy, bot, offset = 2) {
  const dx = bot.x - enemy.x
  const dy = bot.y - enemy.y
  // Perpendicular: (-dy, dx)
  return { x: bot.x + (-dy > 0 ? offset : -offset), y: bot.y + (dx > 0 ? offset : -offset) }
}

/**
 * Main enemy movement function.
 * Behavior types:
 *   - 'chase'   → A* directly toward bot
 *   - 'patrol'  → follow patrolPath, switch to chase if bot is close
 *   - 'ambush'  → move to predicted bot position
 *   - 'flank'   → approach from the side
 */
export function moveEnemyToward(enemy, bot, grid) {
  const dist = manhattanDist(enemy, bot)
  const behavior = enemy.behavior ?? enemy.type ?? 'chase'

  // All enemies become aggressive when bot is very close
  if (dist <= 2) {
    const path = aStar(grid, { x: enemy.x, y: enemy.y }, { x: bot.x, y: bot.y })
    if (path.length > 0) return { ...enemy, x: path[0].x, y: path[0].y, lastBehavior: 'chase_close' }
    return enemy
  }

  switch (behavior) {
    case 'patrol': {
      // Abandon patrol and chase if bot is within detection range
      const detectionRange = enemy.detectionRange ?? 5
      if (dist <= detectionRange) {
        const path = aStar(grid, { x: enemy.x, y: enemy.y }, { x: bot.x, y: bot.y })
        if (path.length > 0) return { ...enemy, x: path[0].x, y: path[0].y, lastBehavior: 'chase_detected' }
      }
      // Follow patrol path
      const patrolPath = enemy.patrolPath ?? []
      if (patrolPath.length === 0) return enemy
      const patrolIndex = (enemy.patrolIndex ?? 0) % patrolPath.length
      const target = patrolPath[patrolIndex]
      if (enemy.x === target.x && enemy.y === target.y) {
        return { ...enemy, patrolIndex: (patrolIndex + 1) % patrolPath.length, lastBehavior: 'patrol_advance' }
      }
      const path = aStar(grid, { x: enemy.x, y: enemy.y }, target)
      if (path.length > 0) return { ...enemy, x: path[0].x, y: path[0].y, lastBehavior: 'patrol_move' }
      return { ...enemy, patrolIndex: (patrolIndex + 1) % patrolPath.length }
    }

    case 'ambush': {
      // Move toward predicted bot position
      const predicted = predictBotPosition(bot, 3)
      const clampedTarget = {
        x: Math.max(0, Math.min(grid[0].length - 1, predicted.x)),
        y: Math.max(0, Math.min(grid.length - 1, predicted.y))
      }
      const path = aStar(grid, { x: enemy.x, y: enemy.y }, clampedTarget)
      if (path.length > 0) return { ...enemy, x: path[0].x, y: path[0].y, lastBehavior: 'ambush' }
      // Fall back to direct chase
      const fallback = aStar(grid, { x: enemy.x, y: enemy.y }, { x: bot.x, y: bot.y })
      if (fallback.length > 0) return { ...enemy, x: fallback[0].x, y: fallback[0].y, lastBehavior: 'ambush_fallback' }
      return enemy
    }

    case 'flank': {
      const flankPos = flankPosition(enemy, bot, 2)
      const clampedFlank = {
        x: Math.max(0, Math.min(grid[0].length - 1, flankPos.x)),
        y: Math.max(0, Math.min(grid.length - 1, flankPos.y))
      }
      const path = aStar(grid, { x: enemy.x, y: enemy.y }, clampedFlank)
      if (path.length > 0) return { ...enemy, x: path[0].x, y: path[0].y, lastBehavior: 'flank' }
      // Fall back to direct chase
      const fallback = aStar(grid, { x: enemy.x, y: enemy.y }, { x: bot.x, y: bot.y })
      if (fallback.length > 0) return { ...enemy, x: fallback[0].x, y: fallback[0].y, lastBehavior: 'flank_fallback' }
      return enemy
    }

    case 'chase':
    default: {
      const path = aStar(grid, { x: enemy.x, y: enemy.y }, { x: bot.x, y: bot.y })
      if (path.length > 0) return { ...enemy, x: path[0].x, y: path[0].y, lastBehavior: 'chase' }
      return enemy
    }
  }
}

/**
 * Proximity detection — returns enemies within range.
 */
export function detectProximity(bot, enemies, range = 3) {
  return enemies.filter(e => manhattanDist(bot, e) <= range)
}

/**
 * Check if bot is caught by any enemy (same cell).
 */
export function isCaught(bot, enemies) {
  return enemies.some(e => e.x === bot.x && e.y === bot.y)
}
