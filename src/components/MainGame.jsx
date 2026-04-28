import React, { useEffect, useRef, useCallback, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { resetLevel, nextLevel, addLog, updateBot, updateEnemies, collectNode, setGameOver, setStatus } from '../store/gameSlice'
import { setExecutionStep } from '../store/gameSlice'
import Viewport from './Viewport'
import LogicDeck from './LogicDeck'
import ConsolePanel from './ConsolePanel'
import HUD from './HUD'
import { executeStep, checkWinCondition, checkNodeCollection } from '../engine/BotEngine'
import { moveEnemyToward } from '../engine/AStarEnemy'
import { clearProgram } from '../store/programSlice'

// Memoized child components for performance
const MemoViewport = React.memo(Viewport)
const MemoLogicDeck = React.memo(LogicDeck)
const MemoConsolePanel = React.memo(ConsolePanel)
const MemoHUD = React.memo(HUD)

export default function MainGame() {
  const dispatch = useDispatch()
  const { status, bot, enemies, levelData, collectedNodes, currentLevel, score } = useSelector(s => s.game)
  const { blocks } = useSelector(s => s.program)
  const executionRef = useRef(null)
  const stepRef = useRef(0)
  const enemyTickRef = useRef(0)

  const stopExecution = useCallback(() => {
    if (executionRef.current) { clearTimeout(executionRef.current); executionRef.current = null }
    dispatch(setStatus('idle'))
    stepRef.current = 0
  }, [dispatch])

  const runNextStep = useCallback((currentBlocks, currentBot, currentEnemies, currentCollected, step) => {
    if (step >= currentBlocks.length) {
      dispatch(addLog({ type: 'system', msg: '> PROGRAM_END — execution complete' }))
      dispatch(setStatus('idle'))
      stepRef.current = 0
      return
    }

    const block = currentBlocks[step]
    dispatch(setExecutionStep(step))

    const result = executeStep(block, currentBot, levelData.grid, currentEnemies, levelData.dataNodes, currentCollected)
    result.logs.forEach(l => dispatch(addLog(l)))

    const newBot = result.bot
    dispatch(updateBot(newBot))

    // Check node collection
    const newlyCollected = checkNodeCollection(newBot, levelData.dataNodes, currentCollected)
    newlyCollected.forEach(id => dispatch(collectNode(id)))
    const allCollected = [...currentCollected, ...newlyCollected]

    // Move enemies every 2 steps
    enemyTickRef.current += 1
    let newEnemies = currentEnemies
    if (enemyTickRef.current % 2 === 0) {
      newEnemies = currentEnemies.map(e => moveEnemyToward(e, newBot, levelData.grid))
      dispatch(updateEnemies(newEnemies))
    }

    // Check enemy collision
    const caught = newEnemies.some(e => e.x === newBot.x && e.y === newBot.y)
    if (caught) {
      dispatch(addLog({ type: 'error', msg: `> FATAL: ENEMY_COLLISION — bot destroyed at [${newBot.x},${newBot.y}]` }))
      dispatch(addLog({ type: 'error', msg: `> STACK TRACE: Entity contact at step ${step}. No evasion logic found.` }))
      dispatch(setGameOver('lost'))
      return
    }

    // Check win
    if (checkWinCondition(newBot, levelData, allCollected)) {
      dispatch(addLog({ type: 'success', msg: `> WIN_CONDITION_MET — all nodes collected, exit reached!` }))
      dispatch(setGameOver('won'))
      return
    }

    // Adaptive step timing based on execution step (faster at end)
    const stepTiming = Math.max(120, 380 - step * 2)
    executionRef.current = setTimeout(() => {
      runNextStep(currentBlocks, newBot, newEnemies, allCollected, step + 1)
    }, stepTiming)
  }, [dispatch, levelData])

  const handleRun = useCallback(() => {
    if (blocks.length === 0) {
      dispatch(addLog({ type: 'error', msg: '> ERROR: No program loaded. Add blocks to Logic Deck.' }))
      return
    }
    dispatch(setStatus('running'))
    dispatch(addLog({ type: 'system', msg: `> EXECUTING program [${blocks.length} opcodes]` }))
    stepRef.current = 0
    enemyTickRef.current = 0
    runNextStep(blocks, bot, enemies, collectedNodes, 0)
  }, [blocks, bot, enemies, collectedNodes, dispatch, runNextStep])

  const handleStop = useCallback(() => {
    stopExecution()
    dispatch(addLog({ type: 'warn', msg: '> EXECUTION_HALTED by operator' }))
  }, [stopExecution, dispatch])

  const handleReset = useCallback(() => {
    stopExecution()
    dispatch(resetLevel())
    dispatch(clearProgram())
  }, [stopExecution, dispatch])

  const handleNext = useCallback(() => {
    stopExecution()
    dispatch(nextLevel())
    dispatch(clearProgram())
  }, [stopExecution, dispatch])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e) {
      if (e.code === 'Space' && status !== 'running') { handleRun(); e.preventDefault() }
      if (e.code === 'Escape') { handleStop(); e.preventDefault() }
      if (e.code === 'KeyR') { handleReset(); e.preventDefault() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [status, handleRun, handleStop, handleReset])

  useEffect(() => () => { if (executionRef.current) clearTimeout(executionRef.current) }, [])

  const isGameOver = status === 'won' || status === 'lost'
  const gameOverColor = status === 'won' ? '#00ff41' : '#ff0040'
  const gameOverText = status === 'won' ? '✓ LEVEL COMPLETE' : '✗ SYSTEM FAILURE'

  return (
    <div role="main" aria-label="Protocolo Orión Game" style={{
      width: '100vw', height: '100vh',
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto',
      gridTemplateColumns: '1fr',
      background: '#000',
      overflow: 'hidden'
    }}>
      <MemoHUD onRun={handleRun} onStop={handleStop} onReset={handleReset} onNext={handleNext} />

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gridTemplateRows: '1fr 180px',
        gap: 2,
        padding: '2px',
        height: '100%',
        overflow: 'hidden'
      }}>
        <div style={{ gridRow: '1 / 3', overflow: 'hidden' }}>
          <MemoViewport />
        </div>
        <div style={{ overflow: 'hidden' }}>
          <MemoLogicDeck />
        </div>
        <div style={{ overflow: 'hidden' }}>
          <MemoConsolePanel />
        </div>
      </div>

      {isGameOver && (
        <div role="dialog" aria-label={gameOverText} style={{
          position: 'fixed', inset: 0,
          background: 'linear-gradient(135deg, #00000099 0%, #1a001a99 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, flexDirection: 'column', gap: 24,
          animation: 'fadeInUp 0.4s ease-out',
          backdropFilter: 'blur(2px)',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 8vw, 72px)',
            color: gameOverColor,
            textShadow: `0 0 40px ${gameOverColor}, 0 0 80px ${gameOverColor}33`,
            letterSpacing: 8,
            animation: 'glitch 0.6s infinite alternate',
            fontWeight: 'bold',
          }}>
            {gameOverText}
          </div>

          {status === 'won' && (
            <div style={{ color: '#ffb000', fontFamily: 'var(--font-mono)', fontSize: 14, letterSpacing: 4, animation: 'pulse-green 2s infinite' }}>
              SCORE: {score} pts
            </div>
          )}

          <div style={{ display: 'flex', gap: 16 }}>
            <button onClick={handleReset} style={{ fontSize: 10, padding: '4px 12px', borderColor: '#ffb000', color: '#ffb000' }}>↺ RETRY</button>
            {status === 'won' && currentLevel < 4 && (
              <button onClick={handleNext} style={{ fontSize: 10, padding: '4px 12px', borderColor: '#00ff41', color: '#00ff41' }}>▶ NEXT</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
