// A* Pathfinding for adaptive enemies
export function aStar(grid, start, goal) {
  const rows = grid.length
  const cols = grid[0].length

  function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
  }

  function key(pos) { return `${pos.x},${pos.y}` }

  function isWalkable(x, y) {
    if (x < 0 || y < 0 || x >= cols || y >= rows) return false
    return grid[y][x] !== 1
  }

  const openSet = new Map()
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
  while (openSet.size > 0 && iterations < 500) {
    iterations++
    // Get node with lowest fScore
    let current = null
    let lowestF = Infinity
    for (const [k, node] of openSet) {
      const f = fScore.get(k) ?? Infinity
      if (f < lowestF) { lowestF = f; current = node; }
    }

    if (!current) break
    const currentKey = key(current)

    if (current.x === goal.x && current.y === goal.y) {
      // Reconstruct path
      const path = []
      let c = currentKey
      while (cameFrom.has(c)) {
        path.unshift(openSet.get(c) || current)
        c = cameFrom.get(c)
      }
      return path
    }

    openSet.delete(currentKey)

    for (const dir of dirs) {
      const neighbor = { x: current.x + dir.x, y: current.y + dir.y }
      if (!isWalkable(neighbor.x, neighbor.y)) continue
      const neighborKey = key(neighbor)
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

export function moveEnemyToward(enemy, bot, grid) {
  if (enemy.type === 'patrol' && enemy.patrolPath?.length > 0) {
    const patrolIndex = enemy.patrolIndex ?? 0
    const target = enemy.patrolPath[patrolIndex % enemy.patrolPath.length]
    if (enemy.x === target.x && enemy.y === target.y) {
      return { ...enemy, patrolIndex: (patrolIndex + 1) % enemy.patrolPath.length }
    }
    const path = aStar(grid, { x: enemy.x, y: enemy.y }, target)
    if (path.length > 0) return { ...enemy, x: path[0].x, y: path[0].y }
  } else {
    // A* chase
    const path = aStar(grid, { x: enemy.x, y: enemy.y }, { x: bot.x, y: bot.y })
    if (path.length > 0) return { ...enemy, x: path[0].x, y: path[0].y }
  }
  return enemy
}

export function detectProximity(bot, enemies, range = 3) {
  return enemies.filter(e => {
    const dist = Math.sqrt(Math.pow(e.x - bot.x, 2) + Math.pow(e.y - bot.y, 2))
    return dist <= range
  })
}
