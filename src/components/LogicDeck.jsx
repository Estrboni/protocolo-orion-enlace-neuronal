import React, { useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useDrag, useDrop } from 'react-dnd'
import { addBlock, removeBlock, moveBlock, updateBlockParam, clearProgram, BLOCK_COSTS_MAP } from '../store/programSlice'

const BLOCK_PALETTE = [
  { type: 'MOVE', color: '#00ff41', desc: 'Move forward N steps' },
  { type: 'ROTATE', color: '#00d4ff', desc: 'Rotate left or right' },
  { type: 'IF_SENSOR', color: '#ffb000', desc: 'Detect enemies nearby' },
  { type: 'LOOP_UNTIL', color: '#bf00ff', desc: 'Loop until condition' },
  { type: 'AND_GATE', color: '#00d4ff', desc: 'Logical AND operation' },
  { type: 'OR_GATE', color: '#bf00ff', desc: 'Logical OR operation' },
  { type: 'NOT_GATE', color: '#ff6600', desc: 'Logical NOT invert' },
  { type: 'XOR_GATE', color: '#ff0040', desc: 'Logical XOR gate' },
  { type: 'RECURSE', color: '#ff0040', desc: 'Call program recursively' },
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
      fontSize: 'clamp(8px, 2vw, 9px)',
      userSelect: 'none',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = `${block.color}22`; e.currentTarget.style.borderColor = block.color }}
      onMouseLeave={e => { e.currentTarget.style.background = `${block.color}11`; e.currentTarget.style.borderColor = `${block.color}33` }}
      title={block.desc}
    >
      <span style={{ color: block.color, fontWeight: 'bold', fontSize: 'clamp(8px, 2vw, 9px)' }}>{block.type}</span>
      <span style={{ color: '#004400', fontSize: 'clamp(7px, 1.5vw, 8px)' }}>{BLOCK_COSTS_MAP[block.type]}KB</span>
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
      cursor: 'grab',
      opacity: isDragging ? 0.3 : 1,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      transition: 'all 0.1s',
      marginBottom: 1,
      fontSize: 'clamp(8px, 2vw, 9px)',
      userSelect: 'none',
      minHeight: 32,
      flexWrap: 'wrap',
    }}>
      <span style={{ color: '#003300', fontSize: 'clamp(7px, 1.5vw, 8px)' }}>{String(index + 1).padStart(2, '0')}</span>
      <span style={{ color: blockColor, fontWeight: 'bold', minWidth: 50, fontSize: 'clamp(8px, 2vw, 9px)' }}>{block.type}</span>

      {/* Params */}
      {block.type === 'MOVE' && (
        <input type="number" min="1" max="10" value={block.params.steps ?? 1}
          onChange={e => dispatch(updateBlockParam({ id: block.id, key: 'steps', value: parseInt(e.target.value) }))}
          style={{ width: 32, background: '#000', border: '1px solid #003300', color: '#00ff41', fontSize: 8, textAlign: 'center', fontFamily: 'var(--font-mono)' }} 
          title="Number of steps to move"
        />
      )}
      {block.type === 'ROTATE' && (
        <select value={block.params.direction ?? 'right'}
          onChange={e => dispatch(updateBlockParam({ id: block.id, key: 'direction', value: e.target.value }))}
          style={{ background: '#000', border: '1px solid #003300', color: '#00d4ff', fontSize: 8, fontFamily: 'var(--font-mono)' }}
          title="Rotation direction"
        >
          <option value="right">R</option>
          <option value="left">L</option>
        </select>
      )}
      {block.type === 'IF_SENSOR' && (
        <input type="number" min="1" max="6" value={block.params.range ?? 3}
          onChange={e => dispatch(updateBlockParam({ id: block.id, key: 'range', value: parseInt(e.target.value) }))}
          style={{ width: 32, background: '#000', border: '1px solid #003300', color: '#ffb000', fontSize: 8, textAlign: 'center', fontFamily: 'var(--font-mono)' }}
          title="Sensor detection range"
        />
      )}
      {block.type === 'LOOP_UNTIL' && (
        <select value={block.params.condition ?? 'EXIT'}
          onChange={e => dispatch(updateBlockParam({ id: block.id, key: 'condition', value: e.target.value }))}
          style={{ background: '#000', border: '1px solid #003300', color: '#bf00ff', fontSize: 8, fontFamily: 'var(--font-mono)' }}
          title="Loop condition"
        >
          <option value="EXIT">EXIT</option>
          <option value="NODES">NODES</option>
          <option value="CLEAR">CLEAR</option>
        </select>
      )}
      {block.type === 'WAIT' && (
        <input type="number" min="1" max="5" value={block.params.ticks ?? 1}
          onChange={e => dispatch(updateBlockParam({ id: block.id, key: 'ticks', value: parseInt(e.target.value) }))}
          style={{ width: 32, background: '#000', border: '1px solid #003300', color: '#006622', fontSize: 8, textAlign: 'center', fontFamily: 'var(--font-mono)' }}
          title="Number of ticks to wait"
        />
      )}

      <span style={{ marginLeft: 'auto', color: '#003300', fontSize: 'clamp(7px, 1.5vw, 8px)' }}>{block.cost}KB</span>
      <button onClick={() => dispatch(removeBlock(block.id))}
        style={{ border: 'none', background: 'none', color: '#ff004066', cursor: 'pointer', fontSize: 10, padding: '0 2px', lineHeight: 1, transition: 'color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.color = '#ff0040'}
        onMouseLeave={e => e.currentTarget.style.color = '#ff004066'}
        title="Remove block"
      >✕</button>
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
      border: isOver ? '1px dashed #00ff41' : '1px dashed #002200',
      background: isOver ? '#00ff4108' : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#003300',
      fontSize: 'clamp(8px, 2vw, 9px)',
      letterSpacing: 2,
      transition: 'all 0.15s'
    }}>
      {isOver ? '↓ DROP' : '← DRAG'}
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
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#050f05', border: '1px solid #003300', overflow: 'hidden' }}>
      <div className="panel-header" style={{ fontSize: 'clamp(9px, 2vw, 10px)' }}>
        LOGIC DECK
        <span style={{ marginLeft: 'auto', color: overflow ? '#ff0040' : '#006622', fontSize: 'clamp(8px, 2vw, 9px)' }}>
          {memUsed}/{memTotal}KB {overflow && '⚠'}
        </span>
      </div>

      {/* Palette */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, padding: 4, borderBottom: '1px solid #002200', maxHeight: 'clamp(80px, 25vh, 120px)', overflowY: 'auto' }}>
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
      <div style={{ padding: '4px 8px', borderTop: '1px solid #002200', display: 'flex', gap: 6, alignItems: 'center', fontSize: 'clamp(8px, 2vw, 9px)' }}>
        <span style={{ color: '#003300', flex: 1 }}>{blocks.length} ops</span>
        <button onClick={() => dispatch(clearProgram())} className="danger" style={{ fontSize: 8, padding: '2px 8px' }} title="Clear all blocks">CLR</button>
      </div>
    </div>
  )
}
