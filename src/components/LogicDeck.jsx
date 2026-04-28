import React, { useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useDrag, useDrop } from 'react-dnd'
import { addBlock, removeBlock, moveBlock, updateBlockParam, clearProgram, BLOCK_COSTS_MAP } from '../store/programSlice'

const BLOCK_PALETTE = [
  { type: 'MOVE', color: '#00ff41', desc: 'Move forward N steps', cost: 8 },
  { type: 'ROTATE', color: '#00d4ff', desc: 'Rotate left or right', cost: 4 },
  { type: 'IF_SENSOR', color: '#ffb000', desc: 'Detect enemies nearby', cost: 16 },
  { type: 'LOOP_UNTIL', color: '#bf00ff', desc: 'Loop until condition', cost: 20 },
  { type: 'AND_GATE', color: '#00d4ff', desc: 'Logical AND operation', cost: 8 },
  { type: 'OR_GATE', color: '#bf00ff', desc: 'Logical OR operation', cost: 8 },
  { type: 'NOT_GATE', color: '#ff6600', desc: 'Logical NOT invert', cost: 6 },
  { type: 'XOR_GATE', color: '#ff0040', desc: 'Logical XOR gate', cost: 8 },
  { type: 'RECURSE', color: '#ff0040', desc: 'Call program recursively', cost: 24 },
  { type: 'WAIT', color: '#006622', desc: 'Wait N ticks', cost: 4 },
]

function PaletteBlock({ block }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'palette-block',
    item: { blockType: block.type },
    collect: m => ({ isDragging: m.isDragging() })
  }))

  return (
    <div ref={drag}
      style={{
        border: `1px solid ${block.color}33`,
        background: `${block.color}11`,
        padding: 'clamp(2px, 0.5vw, 4px) clamp(4px, 1vw, 8px)',
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        transition: 'all 0.15s',
        fontSize: 'clamp(7px, 1vw, 9px)',
        borderRadius: 2,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = `${block.color}22`
        e.currentTarget.style.borderColor = block.color
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = `${block.color}11`
        e.currentTarget.style.borderColor = `${block.color}33`
      }}
      title={block.desc}
      role="button"
      tabIndex={0}
    >
      <span style={{ color: block.color, fontWeight: 'bold' }}>{block.type}</span>
      <span style={{ color: '#004400', fontSize: 'clamp(6px, 0.8vw, 8px)' }}>{block.cost}KB</span>
    </div>
  )
}

function ProgramBlock({ block, index, willExceed }) {
  const dispatch = useDispatch()
  const ref = useRef(null)

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'program-block',
    item: { index },
    collect: m => ({ isDragging: m.isDragging() })
  }), [index])

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'program-block',
    drop(item) {
      if (item.index !== index) dispatch(moveBlock({ fromIndex: item.index, toIndex: index }))
    },
    collect: m => ({ isOver: m.isOver() })
  }), [index])

  drag(drop(ref))

  const blockColor = BLOCK_PALETTE.find(b => b.type === block.type)?.color ?? '#00ff41'

  return (
    <div ref={ref}
      style={{
        border: `1px solid ${isOver ? blockColor : blockColor + '44'}`,
        background: isOver ? `${blockColor}22` : `${blockColor}0a`,
        padding: 'clamp(2px, 0.5vw, 4px) clamp(4px, 1vw, 8px)',
        cursor: 'grab',
        opacity: isDragging ? 0.3 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        transition: 'all 0.1s',
        marginBottom: 1,
        fontSize: 'clamp(7px, 1vw, 9px)',
        borderRadius: 2,
        flexWrap: 'wrap',
        minHeight: 'min-content'
      }}
      role="listitem"
      draggable>
      <span style={{ color: '#003300', fontSize: 'clamp(6px, 0.8vw, 8px)' }}>{String(index + 1).padStart(2, '0')}</span>
      <span style={{ color: blockColor, fontWeight: 'bold', minWidth: 60, fontSize: 'clamp(7px, 1vw, 9px)' }}>{block.type}</span>

      {/* Params */}
      {block.type === 'MOVE' && (
        <input type="number" min="1" max="10" value={block.params.steps ?? 1}
          onChange={e => dispatch(updateBlockParam({ id: block.id, key: 'steps', value: parseInt(e.target.value) }))}
          style={{
            width: 28,
            background: '#000',
            border: '1px solid #003300',
            color: '#00ff41',
            fontSize: 'clamp(7px, 1vw, 9px)',
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            padding: '1px 2px'
          }}
          aria-label="Steps" />
      )}
      {block.type === 'ROTATE' && (
        <select value={block.params.direction ?? 'right'}
          onChange={e => dispatch(updateBlockParam({ id: block.id, key: 'direction', value: e.target.value }))}
          style={{
            background: '#000',
            border: '1px solid #003300',
            color: '#00d4ff',
            fontSize: 'clamp(7px, 1vw, 9px)',
            fontFamily: 'var(--font-mono)',
            padding: '1px 2px'
          }}
          aria-label="Direction">
          <option value="right">R</option>
          <option value="left">L</option>
        </select>
      )}
      {block.type === 'IF_SENSOR' && (
        <input type="number" min="1" max="6" value={block.params.range ?? 3}
          onChange={e => dispatch(updateBlockParam({ id: block.id, key: 'range', value: parseInt(e.target.value) }))}
          style={{
            width: 28,
            background: '#000',
            border: '1px solid #003300',
            color: '#ffb000',
            fontSize: 'clamp(7px, 1vw, 9px)',
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            padding: '1px 2px'
          }}
          aria-label="Sensor range" />
      )}
      {block.type === 'LOOP_UNTIL' && (
        <select value={block.params.condition ?? 'EXIT'}
          onChange={e => dispatch(updateBlockParam({ id: block.id, key: 'condition', value: e.target.value }))}
          style={{
            background: '#000',
            border: '1px solid #003300',
            color: '#bf00ff',
            fontSize: 'clamp(6px, 0.9vw, 8px)',
            fontFamily: 'var(--font-mono)',
            padding: '1px 2px'
          }}
          aria-label="Loop condition">
          <option value="EXIT">EXT</option>
          <option value="ALL_NODES">ALL</option>
          <option value="NO_ENEMIES">EXE</option>
        </select>
      )}
      {block.type === 'WAIT' && (
        <input type="number" min="1" max="5" value={block.params.ticks ?? 1}
          onChange={e => dispatch(updateBlockParam({ id: block.id, key: 'ticks', value: parseInt(e.target.value) }))}
          style={{
            width: 28,
            background: '#000',
            border: '1px solid #003300',
            color: '#006622',
            fontSize: 'clamp(7px, 1vw, 9px)',
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            padding: '1px 2px'
          }}
          aria-label="Wait ticks" />
      )}

      <span style={{
        marginLeft: 'auto',
        color: willExceed ? '#ff0040' : '#003300',
        fontSize: 'clamp(6px, 0.8vw, 8px)',
        fontWeight: willExceed ? 'bold' : 'normal'
      }}>
        {block.cost}KB
      </span>
      <button onClick={() => dispatch(removeBlock(block.id))}
        style={{
          border: 'none',
          background: 'none',
          color: '#ff004066',
          cursor: 'pointer',
          fontSize: 'clamp(8px, 1vw, 10px)',
          padding: '0 1px',
          lineHeight: 1,
          transition: 'color 0.15s'
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#ff0040'}
        onMouseLeave={e => e.currentTarget.style.color = '#ff004066'}
        aria-label={`Remove ${block.type}`}>
        ✕
      </button>
    </div>
  )
}

function DropZone() {
  const dispatch = useDispatch()
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'palette-block',
    drop(item) { dispatch(addBlock({ type: item.blockType })) },
    collect: m => ({ isOver: m.isOver() })
  }))

  return (
    <div ref={drop} style={{
      flex: 1,
      minHeight: 30,
      border: isOver ? '1px dashed #00ff41' : '1px dashed #002200',
      background: isOver ? '#00ff4108' : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#003300',
      fontSize: 'clamp(7px, 1.5vw, 9px)',
      letterSpacing: 2,
      transition: 'all 0.15s',
      borderRadius: 2
    }}
      role="region"
      aria-label="Drop zone for logic blocks">
      {isOver ? '+ DROP' : '— DRAG HERE —'}
    </div>
  )
}

export default function LogicDeck() {
  const dispatch = useDispatch()
  const { blocks } = useSelector(s => s.program)
  const { levelData } = useSelector(s => s.game)
  const memUsed = blocks.reduce((a, b) => a + (BLOCK_COSTS_MAP[b.type] || 8), 0)
  const memTotal = levelData?.memoryBuffer ?? 128
  const overflow = memUsed > memTotal

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#050f05',
      border: '1px solid #003300',
      overflow: 'hidden'
    }}
      role="region"
      aria-label="Logic programming deck">
      <div className="panel-header" style={{ fontSize: 'clamp(7px, 1.5vw, 9px)' }}>
        LOGIC DECK
        <span style={{
          marginLeft: 'auto',
          color: overflow ? '#ff0040' : '#006622',
          fontSize: 'clamp(6px, 1.2vw, 8px)',
          animation: overflow ? 'blink 0.6s infinite' : 'none',
          fontWeight: overflow ? 'bold' : 'normal'
        }}>
          {memUsed}KB/{memTotal}KB {overflow && '⚠'}
        </span>
      </div>

      {/* Palette */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 1,
        padding: 3,
        borderBottom: '1px solid #002200',
        overflow: 'auto',
        maxHeight: '35%'
      }}
        role="group"
        aria-label="Available logic blocks">
        {BLOCK_PALETTE.map(b => <PaletteBlock key={b.type} block={b} />)}
      </div>

      {/* Program */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 3,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
      }}
        role="list"
        aria-label="Program instructions">
        {blocks.length === 0 ? (
          <DropZone />
        ) : (
          <>
            {blocks.map((b, i) => (
              <ProgramBlock key={b.id} block={b} index={i} willExceed={overflow} />
            ))}
            <DropZone />
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: 'clamp(2px, 0.5vh, 4px) clamp(4px, 1vw, 8px)',
        borderTop: '1px solid #002200',
        display: 'flex',
        gap: 4,
        alignItems: 'center',
        fontSize: 'clamp(7px, 1vw, 9px)',
        flexShrink: 0
      }}>
        <span style={{ color: '#003300', flex: 1 }}>{blocks.length} opcodes</span>
        <button onClick={() => dispatch(clearProgram())} className="danger" style={{
          fontSize: 'clamp(7px, 1vw, 9px)',
          padding: 'clamp(2px, 0.5vh, 3px) clamp(4px, 1vw, 6px)'
        }} aria-label="Clear program">
          CLR
        </button>
      </div>
    </div>
  )
}
