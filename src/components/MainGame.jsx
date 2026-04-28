import React, { useEffect, useRef, useCallback } from 'react'
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

export default function MainGame() {
  const dispatch = useDispatch()
  const { status, bot, enemies, levelData, collectedNodes, currentLevel, score } = useSelector(s => s.game)
  const { blocks } = useSelector(s => s.program)
  const executionRef = useRef(null)
  const stepRef = useRef(0)
  const enemyTickRef = useRef(0)
  const containerRef = useRef(null)

  const triggerShake = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.style.animation = 'wallHitShake 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      setTimeout(() => {
        if (containerRef.current) containerRef.current.style.animation = ''
      }, 400)
    }
  }, [])

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

    // Wall collision
    if (result.collision) {
      triggerShake()
      dispatch(addLog({ type: 'error', msg: `> EXECUTION_FAILED at step ${step}` }))
      dispatch(setStatus('idle'))
      return
    }

    // Check node collection
    const newlyCollected = checkNodeCollection(newBot, levelData.dataNodes, currentCollected)
    newlyCollected.forEach(id => dispatch(collectNode(id)))
    const allCollected = [...currentCollected, ...newlyCollected]

    // Move enemies every 2 steps with smooth pathfinding
    enemyTickRef.current += 1
    let newEnemies = currentEnemies
    if (enemyTickRef.current % 2 === 0) {
      newEnemies = currentEnemies.map(e => moveEnemyToward(e, newBot, levelData.grid))
      dispatch(updateEnemies(newEnemies))
    }

    // Check enemy collision
    const caught = newEnemies.some(e => e.x === newBot.x && e.y === newBot.y)
    if (caught) {
      triggerShake()
      dispatch(addLog({ type: 'error', msg: `> FATAL: ENEMY_COLLISION at [${newBot.x},${newBot.y}]` }))
      dispatch(addLog({ type: 'error', msg: `> STACK TRACE: No evasion logic at step ${step}. Systems critical.` }))
      dispatch(setGameOver('lost'))
      return
    }

    // Check low energy warning
    if (newBot.energy < 20 && newBot.energy > 0) {
      dispatch(addLog({ type: 'warn', msg: `> WARNING: Low power — ${Math.ceil(newBot.energy)}% remaining` }))
    }

    // Check out of energy
    if (newBot.energy <= 0) {
      dispatch(addLog({ type: 'error', msg: `> POWER_FAILURE — bot shutdown` }))
      dispatch(setStatus('idle'))
      return
    }

    // Check win
    if (checkWinCondition(newBot, levelData, allCollected)) {
      dispatch(addLog({ type: 'success', msg: `> WIN_CONDITION_MET — all nodes collected!` }))
      dispatch(addLog({ type: 'success', msg: `> NEURAL_PROTOCOL_COMPLETE — advancing neural matrix` }))
      dispatch(setGameOver('won'))
      return
    }

    executionRef.current = setTimeout(() => {
      runNextStep(currentBlocks, newBot, newEnemies, allCollected, step + 1)
    }, 400)
  }, [dispatch, levelData, triggerShake])

  const handleRun = useCallback(() => {
    if (blocks.length === 0) {
      dispatch(addLog({ type: 'error', msg: '> ERROR: Program buffer empty. Load opcodes into Logic Deck.' }))
      return
    }
    dispatch(setStatus('running'))
    dispatch(addLog({ type: 'system', msg: `> EXECUTING ${blocks.length} opcodes...` }))
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

  useEffect(() => () => { if (executionRef.current) clearTimeout(executionRef.current) }, [])

  return (
    <div ref={containerRef} style={{
      width: '100vw', height: '100vh',
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto',
      gridTemplateColumns: '1fr',
      background: '#000',
      overflow: 'hidden'
    }}>
      <HUD onRun={handleRun} onStop={handleStop} onReset={handleReset} onNext={handleNext} />

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gridTemplateRows: '1fr 180px',
        gap: 2,
        padding: '2px',
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* Viewport */}
        <div style={{ gridRow: '1 / 3', overflow: 'hidden' }}>
          <Viewport />
        </div>

        {/* Logic Deck */}
        <div style={{ overflow: 'hidden' }}>
          <LogicDeck />
        </div>

        {/* Console */}
        <div style={{ overflow: 'hidden' }}>
          <ConsolePanel />
        </div>
      </div>

      {/* Game over overlay */}
      {(status === 'won' || status === 'lost') && (
        <div style={{
          position: 'fixed', inset: 0, background: '#00000099',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, flexDirection: 'column', gap: 24
        }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 6vw, 72px)',
            color: status === 'won' ? '#00ff41' : '#ff0040',
            textShadow: `0 0 40px ${status === 'won' ? '#00ff41' : '#ff0040'}`,
            letterSpacing: 8,
            animation: status === 'won' ? 'glitch 0.3s, glitchColor 2s infinite' : 'glitch 0.2s infinite'
          }}>
            {status === 'won' ? '✓ PROTOCOL COMPLETE' : '✗ NEURAL FAILURE'}
          </div>
          {status === 'won' && (
            <div style={{ color: '#ffb000', fontFamily: 'var(--font-mono)', fontSize: 14, letterSpacing: 4, animation: 'fadeInUp 0.5s ease' }}>
              SCORE: {score} pts • NODE_INDEX_COMPLETE
            </div>
          )}
          <div style={{ display: 'flex', gap: 16 }}>
            <button onClick={handleReset}>↺ RETRY</button>
            {status === 'won' && currentLevel < 4 && (
              <button onClick={handleNext} style={{ borderColor: '#00ff41', color: '#00ff41' }}>→ NEXT_LEVEL</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
