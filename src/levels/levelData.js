// Grid cell types
export const CELL = {
  EMPTY: 0, WALL: 1, NODE: 2, START: 3, EXIT: 4,
  AND_GATE: 5, OR_GATE: 6, NOT_GATE: 7, XOR_GATE: 8, ENERGY: 9
}

export const LEVELS = [
  {
    id: 1,
    name: 'BOOT SEQUENCE',
    description: 'Collect all data nodes. Simple path, no enemies.',
    memoryBuffer: 128,
    gridSize: 12,
    botStart: { x: 1, y: 1 },
    exitPos: { x: 10, y: 10 },
    enemies: [],
    dataNodes: [
      { id: 0, x: 5, y: 1 }, { id: 1, x: 8, y: 4 }, { id: 2, x: 3, y: 7 }
    ],
    grid: (() => {
      const g = Array.from({ length: 12 }, () => Array(12).fill(0))
      // Walls
      for (let i = 0; i < 12; i++) { g[0][i] = 1; g[11][i] = 1; g[i][0] = 1; g[i][11] = 1 }
      g[3][2] = 1; g[3][3] = 1; g[3][4] = 1
      g[6][6] = 1; g[6][7] = 1; g[6][8] = 1
      g[9][2] = 1; g[9][3] = 1
      return g
    })(),
    hint: 'Use MOVE() and ROTATE() to navigate. Avoid walls.',
  },
  {
    id: 2,
    name: 'SENSOR PROTOCOL',
    description: 'One enemy patrols. Use IF_SENSOR to detect and evade.',
    memoryBuffer: 96,
    gridSize: 14,
    botStart: { x: 1, y: 1 },
    exitPos: { x: 12, y: 12 },
    enemies: [
      { id: 0, x: 6, y: 6, speed: 1, type: 'patrol', patrolPath: [{ x: 6, y: 6 }, { x: 9, y: 6 }, { x: 9, y: 9 }, { x: 6, y: 9 }] }
    ],
    dataNodes: [
      { id: 0, x: 4, y: 2 }, { id: 1, x: 10, y: 3 }, { id: 2, x: 7, y: 11 }, { id: 3, x: 2, y: 10 }
    ],
    grid: (() => {
      const g = Array.from({ length: 14 }, () => Array(14).fill(0))
      for (let i = 0; i < 14; i++) { g[0][i] = 1; g[13][i] = 1; g[i][0] = 1; g[i][13] = 1 }
      g[4][4] = 1; g[4][5] = 1; g[5][4] = 1
      g[8][7] = 1; g[8][8] = 1; g[8][9] = 1; g[9][7] = 1
      g[3][9] = 1; g[3][10] = 1; g[4][10] = 1
      return g
    })(),
    hint: 'IF_SENSOR detects enemies within 3 cells. Program a reaction!',
  },
  {
    id: 3,
    name: 'LOOP MATRIX',
    description: 'Memory is limited to 64KB. Optimize with LOOP_UNTIL.',
    memoryBuffer: 64,
    gridSize: 14,
    botStart: { x: 1, y: 12 },
    exitPos: { x: 12, y: 1 },
    enemies: [
      { id: 0, x: 7, y: 7, speed: 1, type: 'astar' }
    ],
    dataNodes: [
      { id: 0, x: 3, y: 10 }, { id: 1, x: 6, y: 7 }, { id: 2, x: 9, y: 4 }, { id: 3, x: 11, y: 2 }, { id: 4, x: 2, y: 5 }
    ],
    grid: (() => {
      const g = Array.from({ length: 14 }, () => Array(14).fill(0))
      for (let i = 0; i < 14; i++) { g[0][i] = 1; g[13][i] = 1; g[i][0] = 1; g[i][13] = 1 }
      g[5][1] = 1; g[5][2] = 1; g[5][3] = 1; g[5][4] = 1; g[5][5] = 1
      g[8][8] = 1; g[8][9] = 1; g[8][10] = 1; g[9][10] = 1; g[10][10] = 1
      g[3][7] = 1; g[4][7] = 1; g[4][8] = 1
      g[10][3] = 1; g[10][4] = 1; g[11][4] = 1
      return g
    })(),
    hint: 'Each MOVE costs 8KB. Use LOOP_UNTIL to repeat with less memory.',
  },
  {
    id: 4,
    name: 'GATE PROTOCOL',
    description: 'Logic gates block paths. Use AND/OR/NOT/XOR to unlock them.',
    memoryBuffer: 80,
    gridSize: 16,
    botStart: { x: 1, y: 1 },
    exitPos: { x: 14, y: 14 },
    enemies: [
      { id: 0, x: 8, y: 3, speed: 1, type: 'astar' },
      { id: 1, x: 12, y: 8, speed: 1, type: 'patrol', patrolPath: [{ x: 12, y: 8 }, { x: 12, y: 12 }] }
    ],
    dataNodes: [
      { id: 0, x: 4, y: 4 }, { id: 1, x: 8, y: 8 }, { id: 2, x: 12, y: 4 }, { id: 3, x: 4, y: 12 }, { id: 4, x: 10, y: 14 }
    ],
    grid: (() => {
      const g = Array.from({ length: 16 }, () => Array(16).fill(0))
      for (let i = 0; i < 16; i++) { g[0][i] = 1; g[15][i] = 1; g[i][0] = 1; g[i][15] = 1 }
      // Gate corridors — must use logic blocks
      g[6][3] = 5; g[6][4] = 5  // AND gates
      g[6][10] = 6; g[6][11] = 6  // OR gates
      g[10][6] = 7; g[10][7] = 7  // NOT gates
      g[10][10] = 8; g[10][11] = 8 // XOR gates
      // Walls
      g[3][5] = 1; g[3][6] = 1; g[4][5] = 1
      g[8][2] = 1; g[8][3] = 1; g[9][3] = 1
      return g
    })(),
    hint: 'Logic gates require the right gate block in your program to pass.',
  },
  {
    id: 5,
    name: 'NEURAL SIEGE',
    description: 'Two A* hunters. Limited memory 48KB. Recursion is the only way.',
    memoryBuffer: 48,
    gridSize: 16,
    botStart: { x: 1, y: 14 },
    exitPos: { x: 14, y: 1 },
    enemies: [
      { id: 0, x: 7, y: 7, speed: 1, type: 'astar' },
      { id: 1, x: 10, y: 10, speed: 1, type: 'astar' },
      { id: 2, x: 3, y: 3, speed: 1, type: 'astar' }
    ],
    dataNodes: [
      { id: 0, x: 2, y: 11 }, { id: 1, x: 5, y: 8 }, { id: 2, x: 8, y: 5 },
      { id: 3, x: 11, y: 2 }, { id: 4, x: 13, y: 8 }, { id: 5, x: 7, y: 13 }
    ],
    grid: (() => {
      const g = Array.from({ length: 16 }, () => Array(16).fill(0))
      for (let i = 0; i < 16; i++) { g[0][i] = 1; g[15][i] = 1; g[i][0] = 1; g[i][15] = 1 }
      g[4][4] = 1; g[4][5] = 1; g[5][4] = 1; g[5][5] = 1
      g[4][10] = 1; g[4][11] = 1; g[5][10] = 1
      g[10][4] = 1; g[10][5] = 1; g[11][4] = 1
      g[10][10] = 1; g[10][11] = 1; g[11][10] = 1; g[11][11] = 1
      g[7][7] = 1; g[7][8] = 1; g[8][7] = 1
      return g
    })(),
    hint: 'RECURSE block calls the program on itself. Use it to repeat patrol logic.',
  }
]
