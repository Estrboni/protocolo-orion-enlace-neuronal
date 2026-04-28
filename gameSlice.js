import { createSlice } from '@reduxjs/toolkit'
import { LEVELS } from '../levels/levelData'

const GRID_SIZE = 16

function initGrid(levelIndex) {
  const level = LEVELS[levelIndex]
  return level
}

const initialState = {
  currentLevel: 0,
  levelData: LEVELS[0],
  status: 'idle', // idle | running | paused | won | lost | menu
  bot: { x: 1, y: 1, direction: 0, energy: 100 },
  enemies: LEVELS[0].enemies.map(e => ({ ...e, path: [] })),
  collectedNodes: [],
  consoleLog: [
    { type: 'system', msg: 'PROTOCOLO ORIÓN v2.4.1 — ENLACE NEURONAL' },
    { type: 'system', msg: 'Sistema iniciado. Cargando nivel 01...' },
    { type: 'info', msg: 'Arrastra bloques al Logic Deck y ejecuta el programa.' },
  ],
  memoryUsed: 0,
  executionStep: -1,
  iterationsLeft: 0,
  gameOver: false,
  showMenu: true,
  score: 0,
  totalScore: 0,
}

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    startGame(state) {
      state.showMenu = false
      state.status = 'idle'
      state.consoleLog.push({ type: 'system', msg: `> NIVEL ${state.currentLevel + 1} INICIADO` })
    },
    resetLevel(state) {
      const level = LEVELS[state.currentLevel]
      state.levelData = level
      state.bot = { x: level.botStart.x, y: level.botStart.y, direction: 0, energy: 100 }
      state.enemies = level.enemies.map(e => ({ ...e, path: [] }))
      state.collectedNodes = []
      state.status = 'idle'
      state.executionStep = -1
      state.gameOver = false
      state.consoleLog.push({ type: 'warn', msg: '> REINICIANDO NIVEL...' })
    },
    nextLevel(state) {
      if (state.currentLevel < LEVELS.length - 1) {
        state.currentLevel += 1
        const level = LEVELS[state.currentLevel]
        state.levelData = level
        state.bot = { x: level.botStart.x, y: level.botStart.y, direction: 0, energy: 100 }
        state.enemies = level.enemies.map(e => ({ ...e, path: [] }))
        state.collectedNodes = []
        state.status = 'idle'
        state.executionStep = -1
        state.gameOver = false
        state.consoleLog.push({ type: 'system', msg: `> NIVEL ${state.currentLevel + 1} CARGADO` })
      }
    },
    setStatus(state, action) { state.status = action.payload },
    pauseExecution(state) {
      if (state.status === 'running') state.status = 'paused'
    },
    resumeExecution(state) {
      if (state.status === 'paused') state.status = 'running'
    },
    updateBot(state, action) { state.bot = { ...state.bot, ...action.payload } },
    updateEnemies(state, action) { state.enemies = action.payload },
    collectNode(state, action) {
      if (!state.collectedNodes.includes(action.payload)) {
        state.collectedNodes.push(action.payload)
        state.score += 50
        state.consoleLog.push({ type: 'success', msg: `> NODE_${action.payload} COLLECTED [+50pts]` })
      }
    },
    addLog(state, action) {
      state.consoleLog.push(action.payload)
      if (state.consoleLog.length > 80) state.consoleLog.shift()
    },
    clearLog(state) {
      state.consoleLog = []
    },
    setMemoryUsed(state, action) { state.memoryUsed = action.payload },
    setExecutionStep(state, action) { state.executionStep = action.payload },
    setGameOver(state, action) {
      state.gameOver = true
      state.status = action.payload === 'won' ? 'won' : 'lost'
    },
  }
})

export const { startGame, resetLevel, nextLevel, setStatus, pauseExecution, resumeExecution,
               updateBot, updateEnemies, collectNode, addLog, clearLog, setMemoryUsed, setExecutionStep, setGameOver } = gameSlice.actions
export default gameSlice.reducer
