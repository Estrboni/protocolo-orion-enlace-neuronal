import React, { useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useDrag, useDrop } from 'react-dnd'
import { addBlock, removeBlock, moveBlock, updateBlockParam, clearProgram, BLOCK_COSTS_MAP } from '../store/programSlice'

const BLOCK_PALETTE = [
  { type: 'MOVE', color: '#00ff41', desc: 'Move forward N steps', icon: '→' },
  { type: 'ROTATE', color: '#00d4ff', desc: 'Rotate left or right', icon: '↻' },
  { type: 'IF_SENSOR', color: '#ffb000', desc: 'Detect enemies nearby', icon: '◉' },
  { type: 'LOOP_UNTIL', color: '#bf00ff', desc: 'Loop until condition', icon: '⟲' },
  { type: 'AND_GATE', color: '#00d4ff', desc: 'Logical AND operation', icon: '∧' },
  { type: 'OR_GATE', color: '#bf00ff', desc: 'Logical OR operation', icon: '∨' },
  { type: 'NOT_GATE', color: '#ff6600', desc: 'Logical NOT invert', icon: '¬' },
  { type: 'XOR_GATE', color: '#ff0040', desc: 'Logical XOR gate', icon: '⊕' },
  { type: 'RECURSE', color: '#ff0040', desc: 'Call program recursively', icon: '∞' },
  { type: 'WAIT', color: '#006622', desc: 'Wait N ticks', icon: '⏱' },
]

function PaletteBlock({ block }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'palette-block',
    item: { blockType: block.type },
    collect: m => ({ isDragging: m.isDragging() })
  }))
  const [hovered, setHovered] = useState(false)

  return (
    <div ref={drag} style={{
      border: `1px solid ${block.color}33`,
      background: hovered ? `${block.color}22` : `${block.color}11`,
      padding: '4px 6px',
      cursor: 'grab',
      opacity: isDragging ? 0.4 : 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 3,
      transition: 'all 0.15s',
      fontSize: 9,
      userSelect: 'none',
      borderColor: hovered ? block.color : `${block.color}33`
    }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={block.desc}
    >
      <span style={{ color: block.color, fontWeight: 'bold', fontSize: 11 }}>{block.icon}</span>
      <span style={{ color: block.color, fontSize: 7, letterSpacing: 1, textTransform: 'uppercase' }}>{block.type.slice(0, 4)}</span>
      <span style={{ color: '#004400', fontSize: 7 }}>{BLOCK_COSTS_MAP[block.type]}KB</span>
    </div>
  )
}

function ProgramBlock({ block, index }) {
  const dispatch = useDispatch()
  const ref = useRef(null)
  const [expanded, setExpanded] = useState(true)

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
  const blockIcon = BLOCK_PALETTE.find(b => b.type === block.type)?.icon ?? '◆'

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
      marginBottom: 2,
      fontSize: 8,
      userSelect: 'none'
    }}>
      <span style={{ color: '#003300', fontSize: 7, fontWeight: 'bold' }}>{String(index + 1).padStart(2, '0')}</span>
      <span style={{ color: blockColor, fontWeight: 'bold', minWidth: 50, fontSize: 8 }}>{blockIcon} {block.type.slice(0, 6)}</span>

      {/* Compact params */}
      {block.type === 'MOVE' && (
        <input type="number" min="1" max="10" value={block.params.steps ?? 1}
          onChange={e => dispatch(updateBlockParam({ id: block.id, key: 'steps', value: parseInt(e.target.value) }))}
          style={{ width: 28, background: '#000', border: '1px solid #003300', color: '#00ff41', fontSize: 7, textAlign: 'center', fontFamily: 'var(--font-mono)', padding: '2px' }} />
      )}
      {block.type === 'ROTATE' && (
        <select value={block.params.direction ?? 'right'}
          onChange={e => dispatch(updateBlockParam({ id: block.id, key: 'direction', value: e.target.value }))}
          style={{ background: '#000', border: '1px solid #003300', color: '#00d4ff', fontSize: 7, fontFamily: 'var(--font-mono)', padding: '1px 2px' }}>
          <option value="right">R</option>
          <option value="left">L</option>
        </select>
      )}
      {block.type === 'IF_SENSOR' && (
        <input type="number" min="1" max="6" value={block.params.range ?? 3}
          onChange={e => dispatch(updateBlockParam({ id: block.id, key: 'range', value: parseInt(e.target.value) }))}
          style={{ width: 28, background: '#000', border: '1px solid #003300', color: '#ffb000', fontSize: 7, textAlign: 'center', fontFamily: 'var(--font-mono)', padding: '2px' }} />
      )}

      <span style={{ marginLeft: 'auto', color: '#003300', fontSize: 7 }}>{block.cost}KB</span>
      <button onClick={() => dispatch(removeBlock(block.id))}
        style={{ border: 'none', background: 'none', color: '#ff004066', cursor: 'pointer', fontSize: 9, padding: '0 2px', lineHeight: 1, transition: 'color 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.color = '#ff0040'}
        onMouseLeave={e => e.currentTarget.style.color = '#ff004066'}
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
      fontSize: 8,
      letterSpacing: 2,
      transition: 'all 0.15s',
      userSelect: 'none'
    }}>
      {isOver ? '+ DROP' : '← DRAG ←'}
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
      <div className="panel-header" style={{ fontSize: 8 }}>
        LOGIC DECK
        <span style={{ marginLeft: 'auto', color: overflow ? '#ff0040' : '#006622', fontSize: 8 }}>
          {memUsed}/{memTotal}
        </span>
      </div>

      {/* Palette */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, padding: 3, borderBottom: '1px solid #002200' }}>
        {BLOCK_PALETTE.map(b => <PaletteBlock key={b.type} block={b} />)}
      </div>

      {/* Program */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 3, paddingRight: 2 }}>
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
      <div style={{ padding: '3px 6px', borderTop: '1px solid #002200', display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ color: '#003300', fontSize: 8, flex: 1 }}>{blocks.length}x {overflow && '⚠'}</span>
        <button onClick={() => dispatch(clearProgram())} className="danger" style={{ fontSize: 7, padding: '2px 6px' }}>CLR</button>
      </div>
    </div>
  )
}
