import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addBlock } from '../store/programSlice'

const TUTORIAL_STEPS = [
  {
    title: 'Welcome to ORIÓN',
    body: 'You control a neural bot. Your mission: collect all data nodes (◆) and reach the exit (⬡) without getting caught by enemies (✕).',
    tip: 'Use the Logic Deck on the right to build your bot\'s program.',
  },
  {
    title: 'Understanding MOVE',
    body: 'MOVE pushes your bot forward N steps in its current direction. Each step costs 1 energy.',
    tip: 'Drag the MOVE block into the Logic Deck. Set steps to 3 and hit EXEC.',
    blockHighlight: 'MOVE',
  },
  {
    title: 'ROTATE to Change Direction',
    body: 'Your bot faces one of 4 directions: North, East, South, West. Use ROTATE to turn left or right.',
    tip: 'After MOVE, add ROTATE blocks to navigate corners.',
    blockHighlight: 'ROTATE',
  },
  {
    title: 'IF_SENSOR Detects Danger',
    body: 'Enemies within 3 cells trigger this sensor. Use it to branch your logic — for example, ROTATE to escape.',
    tip: 'IF_SENSOR doesn\'t stop execution by itself; you decide what to do next.',
    blockHighlight: 'IF_SENSOR',
  },
  {
    title: 'Memory Matters',
    body: 'Each block costs memory (shown in KB). Your level has a buffer limit — exceed it and the program won\'t run.',
    tip: 'Use LOOP_UNTIL to repeat blocks efficiently instead of duplicating them.',
    blockHighlight: 'LOOP_UNTIL',
  },
  {
    title: 'Logic Gates & Obstacles',
    body: 'AND, OR, NOT, XOR gates block paths. You must have the matching gate block in your program to pass.',
    tip: 'Plan your route to avoid obstacles or use the right logic block.',
    blockHighlight: 'AND_GATE',
  },
  {
    title: 'Ready to Play?',
    body: 'You\'ve got the basics. Now let\'s get to work. The first level is forgiving — use it to practice.',
    tip: 'Remember: MOVE, ROTATE, IF_SENSOR. That\'s enough for level 1.',
  },
]

export default function Tutorial({ onComplete }) {
  const [step, setStep] = useState(0)
  const dispatch = useDispatch()
  const current = TUTORIAL_STEPS[step]

  const handleNext = () => {
    if (step < TUTORIAL_STEPS.length - 1) {
      setStep(step + 1)
    } else {
      onComplete()
    }
  }

  const handlePrev = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleTryBlock = () => {
    if (current.blockHighlight) {
      dispatch(addBlock({ type: current.blockHighlight }))
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#000000dd',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: 16
    }}>
      <div style={{
        maxWidth: 480,
        background: '#050f05',
        border: '2px solid #00ff41',
        borderRadius: 2,
        padding: 24,
        boxShadow: '0 0 20px #00ff4144, inset 0 0 20px #00ff4108',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        {/* Progress */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          color: '#006622', fontSize: 11, letterSpacing: 2
        }}>
          <span>TUTORIAL</span>
          <div style={{ flex: 1, height: 2, background: '#001a00', position: 'relative' }}>
            <div style={{
              height: '100%',
              width: `${((step + 1) / TUTORIAL_STEPS.length) * 100}%`,
              background: '#00ff41',
              transition: 'width 0.4s ease'
            }} />
          </div>
          <span>{step + 1} / {TUTORIAL_STEPS.length}</span>
        </div>

        {/* Title */}
        <div style={{
          fontSize: 20,
          fontFamily: 'var(--font-display)',
          color: '#00ff41',
          letterSpacing: 3,
          textShadow: '0 0 10px #00ff41'
        }}>
          {current.title}
        </div>

        {/* Body */}
        <p style={{
          color: '#004d00',
          fontSize: 14,
          lineHeight: 1.6,
          margin: 0
        }}>
          {current.body}
        </p>

        {/* Tip */}
        <div style={{
          background: '#001a0088',
          border: '1px solid #003300',
          borderLeft: '3px solid #ffb000',
          padding: 12,
          fontSize: 12,
          color: '#ffb000',
          borderRadius: 2
        }}>
          💡 {current.tip}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
          <button onClick={handlePrev} disabled={step === 0}
            style={{
              fontSize: 12, padding: '8px 16px',
              border: '1px solid #003300', color: '#003300',
              background: 'transparent', cursor: step === 0 ? 'not-allowed' : 'pointer',
              opacity: step === 0 ? 0.3 : 1, transition: 'all 0.2s'
            }}
            onMouseEnter={e => { if (step > 0) { e.currentTarget.style.color = '#00ff41'; e.currentTarget.style.borderColor = '#00ff41' } }}
            onMouseLeave={e => { e.currentTarget.style.color = '#003300'; e.currentTarget.style.borderColor = '#003300' }}
          >
            ← PREV
          </button>

          {current.blockHighlight && (
            <button onClick={handleTryBlock}
              style={{
                fontSize: 12, padding: '8px 16px',
                border: '1px solid #ffb000', color: '#ffb000',
                background: 'transparent', cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#ffb00022' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              TRY {current.blockHighlight}
            </button>
          )}

          <button onClick={handleNext}
            style={{
              fontSize: 12, padding: '8px 16px',
              border: '1px solid #00ff41', color: '#00ff41',
              background: 'transparent', cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#00ff4122' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            {step === TUTORIAL_STEPS.length - 1 ? 'START →' : 'NEXT →'}
          </button>
        </div>
      </div>
    </div>
  )
}
