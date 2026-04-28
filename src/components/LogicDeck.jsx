import React, { useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useDrag, useDrop } from 'react-dnd'
import { addBlock, removeBlock, moveBlock, updateBlockParam, clearProgram, BLOCK_COSTS_MAP } from '../store/programSlice'

const BLOCK_PALETTE = [
  { type: 'MOVE', color: '#00ff41', desc: 'Move N steps forward' },
  { type: 'ROTATE', color: '#00d4ff', desc: 'Rotate left/right' },
  { type: 'IF_SENSOR', color: '#ffb000', desc: 'Detect enemies' },
  { type: 'LOOP_UNTIL', color: '#bf00ff', desc: 'Loop condition' },
  { type: 'AND_GATE', color: '#00d4ff', desc: 'AND operation' },
  { type: 'OR_GATE', color: '#bf00ff', desc: 'OR operation' },
  { type: 'NOT_GATE', color: '#ff6600', desc: 'NOT gate' },
  { type: 'XOR_GATE', color: '#ff0040', desc: 'XOR gate' },
  { type: 'RECURSE', color: '#ff0040', desc: 'Call recursively' },
  { type: 'WAIT', color: '#006622', desc: 'Wait N ticks' },
]

function PaletteBlock({ block }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'palette-block',
    item: { blockType: block.type },
    collect: m => ({ isDragging: m.isDragging() })
  }))

  return (
    <div ref={drag} style={{
      border: `1px solid ${block.color}33`,
      background: `${block.color}11`,
      padding: '3px 6px',
      cursor: 'grab',
      opacity: isDragging ? 0.4 : 1,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      transition: 'all 0.15s',
      fontSize: 9,
      borderRadius: 2,
      userSelect: 'none'
    }}
      onMouseEnter={e => {
        e.currentTarget.style.background = `${block.color}22`
        e.currentTarget.style.borderColor = block.color
        e.currentTarget.style.boxShadow = `0 0 8px ${block.color}44`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = `${block.color}11`
        e.currentTarget.style.borderColor = `${block.color}33`
        e.currentTarget.style.boxShadow = 'none'
      }}
      data-tooltip={block.desc}
    >
      <span style={{ color: block.color, fontWeight: 'bold', fontSize: 9 }}>{block.type}</span>
      <span style={{ color: '#004400', fontSize: 8 }}>{BLOCK_COSTS_MAP[block.type]}KB</span>
    </div>
  )
}

function ProgramBlock({ block, index }) {
  const dispatch = useDispatch()
  const ref = useRef(null)

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'program-block',
    item: { index },
    collect: m => ({ isDragging: m.isDragging() })
  }))

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'program-block',
    drop(item) {
      if (item.index !== index) dispatch(moveBlock({ fromIndex: item.index, toIndex: index }))
    },
    collect: m => ({ isOver: m.isOver() })
  }))

  drag(drop(ref))

  const blockColor = BLOCK_PALETTE.find(b => b.type === block.type)?.color ?? '#00ff41'

  return (
    <div ref={ref} style={{
      border: `1px solid ${isOver ? blockColor : blockColor + '44'}`,
      background: isOver ? `${blockColor}22` : `${blockColor}0a`,
      padding: '4px 8px',
      cursor: isDragging ? 'grabbing' : 'grab',
      opacity: isDragging ? 0.3 : 1,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      transition: 'all 0.1s',
      marginBottom: 1,
      fontSize: 9,
      borderRadius: 2,
      userSelect: 'none'
    }}>
      <span style={{ color: '#003300', fontSize: 8, minWidth: 18, textAlign: 'center' }}>{String(index + 1).padStart(2, '0')}</span>
      <span style={{ color: blockColor, fontWeight: 'bold', minWidth: 70, fontSize: 9 }}>{block.type}</span>

      {/* Params */}
      {block.type === 'MOVE' && (
        <input
          type="number"
          min="1"
          max="10"
          value={block.params.steps ?? 1}
          onChange={e => dispatch(updateBlockParam({ id: block.id, key: 'steps', value: parseInt(e.target.value) }))}
          style={{
            width: 32, background: '#000', border: '1px solid #003300', color: '#00ff41',
            fontSize: 9, textAlign: 'center', fontFamily: 'var(--font-mono)', borderRadius: 2, padding: 2
          }}
        />
      )}
      {block.type === 'ROTATE' && (
        <select
          value={block.params.direction ?? 'right'}
          onChange={e => dispatch(updateBlockParam({ id: block.id, key: 'direction', value: e.target.value }))}
          style={{
            background: '#000', border: '1px solid #003300', color: '#00d4ff', fontSize: 9,
            fontFamily: 'var(--font-mono)', borderRadius: 2, padding: 2
          }}>
          <option value="right">→</option>
          <option value="left">←</option>
        </select>
      )}
      {block.type === 'IF_SENSOR' && (
        <input
          type="number"
          min="1"
          max="6"
          value={block.params.range ?? 3}
          onChange={e => dispatch(updateBlockParam({ id: block.id, key: 'range', value: parseInt(e.target.value) }))}
          style={{
            width: 32, background: '#000', border: '1px solid #003300', color: '#ffb000',
            fontSize: 9, textAlign: 'center', fontFamily: 'var(--font-mono)', borderRadius: 2, padding: 2
          }}
        />
      )}
      {block.type === 'LOOP_UNTIL' && (
        <select
          value={block.params.condition ?? 'EXIT'}
          onChange={e => dispatch(updateBlockParam({ id: block.id, key: 'condition', value: e.target.value }))}
          style={{
            background: '#000', border: '1px solid #003300', color: '#bf00ff', fontSize: 9,
            fontFamily: 'var(--font-mono)', borderRadius: 2, padding: 2
          }}>
          <option value="EXIT">EXIT</option>
          <option value="ALL_NODES">NODES</option>
          <option value="NO_ENEMIES">CLEAR</option>
        </select>
      )}
      {block.type === 'WAIT' && (
        <input
          type="number"
          min="1"
          max="5"
          value={block.params.ticks ?? 1}
          onChange={e => dispatch(updateBlockParam({ id: block.id, key: 'ticks', value: parseInt(e.target.value) }))}
          style={{
            width: 32, background: '#000', border: '1px solid #003300', color: '#006622',
            fontSize: 9, textAlign: 'center', fontFamily: 'var(--font-mono)', borderRadius: 2, padding: 2
          }}
        />
      )}

      <span style={{ marginLeft: 'auto', color: '#003300', fontSize: 8, minWidth: 28, textAlign: 'right' }}>{block.cost}KB</span>
      <button
        onClick={() => dispatch(removeBlock(block.id))}
        style={{
          border: 'none', background: 'none', color: '#ff004066', cursor: 'pointer',
          fontSize: 10, padding: '0 2px', lineHeight: 1, transition: 'color 0.15s'
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#ff0040'}
        onMouseLeave={e => e.currentTarget.style.color = '#ff004066'}
      >
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
      minHeight: 40,
      border: isOver ? '2px dashed #00ff41' : '1px dashed #002200',
      background: isOver ? '#00ff4108' : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#003300',
      fontSize: 9,
      letterSpacing: 2,
      transition: 'all 0.15s',
      borderRadius: 2
    }}>
      {isOver ? '✓ DROP BLOCK' : '• DRAG BLOCKS •'}
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
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: '#050f05', border: '1px solid #003300', overflow: 'hidden',
      borderRadius: 2
    }}>
      <div className="panel-header" style={{ fontSize: 9 }}>
        LOGIC DECK
        <span style={{ marginLeft: 'auto', color: overflow ? '#ff0040' : '#006622', fontSize: 8 }}>
          {memUsed}/{memTotal}KB {overflow && '⚠'}
        </span>
      </div>

      {/* Palette */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, padding: 4,
        borderBottom: '1px solid #002200', overflowY: 'auto', maxHeight: '30%'
      }}>
        {BLOCK_PALETTE.map(b => <PaletteBlock key={b.type} block={b} />)}
      </div>

      {/* Program */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 4 }}>
        {blocks.length === 0 ? (
          <DropZone />
        ) : (
          <>
            {blocks.map((b, i) => <ProgramBlock key={b.id} block={b} index={i} />)}
            <DropZone />
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '4px 8px', borderTop: '1px solid #002200', display: 'flex',
        gap: 6, alignItems: 'center', fontSize: 9
      }}>
        <span style={{ color: '#003300', flex: 1 }}>{blocks.length} opcodes</span>
        <button
          onClick={() => dispatch(clearProgram())}
          className="danger"
          style={{ fontSize: 8, padding: '2px 8px' }}
          data-tooltip="Clear all blocks"
        >
          CLR
        </button>
      </div>
    </div>
  )
}
