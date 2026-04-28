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

function Confetti({ count = 40 }) {
  useEffect(() => {
    const particles = []
    for (let i = 0; i < count; i++) {
      const colors = ['green', 'amber', 'cyan', 'red']
      const el = document.createElement('div')
      el.className = `confetti ${colors[Math.floor(Math.random() * colors.length)]}`
      el.style.left = Math.random() * 100 + '%'
      el.style.top = '-20px'
      el.style.setProperty('--duration', (2 + Math.random() * 1.5) + 's')
      document.body.appendChild(el)
      particles.push(el)
    }
    return () => particles.forEach(p => p.remove())
  }, [])
  return null
}

export default function MainGame() {
  const dispatch = useDispatch()
  const { status, bot, enemies, levelData, collectedNodes, currentLevel, score } = useSelector(s => s.game)
  const { blocks } = useSelector(s => s.program)
  const isMobile = useSelector(s => s.ui.showMobileLayout)
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

    executionRef.current = setTimeout(() => {
      runNextStep(currentBlocks, newBot, newEnemies, allCollected, step + 1)
    }, 380)
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

  useEffect(() => () => { if (executionRef.current) clearTimeout(executionRef.current) }, [])

  const gridLayout = isMobile
    ? { gridTemplateColumns: '1fr', gridTemplateRows: 'auto 1fr 1fr auto' }
    : { gridTemplateColumns: '1fr 320px', gridTemplateRows: '1fr 180px' }

  return (
    <div style={{
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
        ...gridLayout,
        gap: 2,
        padding: '2px',
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* Viewport */}
        <div style={{
          ...(isMobile ? { gridRow: '1', gridColumn: '1' } : { gridRow: '1 / 3', gridColumn: '1' }),
          overflow: 'hidden'
        }}>
          <Viewport />
        </div>

        {/* Logic Deck */}
        <div style={{
          ...(isMobile ? { gridRow: '2', gridColumn: '1' } : { gridRow: '1', gridColumn: '2' }),
          overflow: 'hidden'
        }}>
          <LogicDeck />
        </div>

        {/* Console */}
        <div style={{
          ...(isMobile ? { gridRow: '3', gridColumn: '1' } : { gridRow: '2', gridColumn: '2' }),
          overflow: 'hidden'
        }}>
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
            animation: 'glitch 0.5s infinite'
          }}>
            {status === 'won' ? '✓ LEVEL COMPLETE' : '✗ SYSTEM FAILURE'}
          </div>
          {status === 'won' && (
            <div style={{ color: '#ffb000', fontFamily: 'var(--font-mono)', fontSize: 14, letterSpacing: 4 }}>
              SCORE: {score} pts
            </div>
          )}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={handleReset}>RETRY</button>
            {status === 'won' && currentLevel < 4 && (
              <button onClick={handleNext} style={{ borderColor: '#00ff41', color: '#00ff41' }}>NEXT LEVEL</button>
            )}
          </div>
        </div>
      )}

      {status === 'won' && <Confetti count={60} />}
    </div>
  )
}
