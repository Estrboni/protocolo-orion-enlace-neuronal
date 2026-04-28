import React, { useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useDrag, useDrop } from 'react-dnd'
import { addBlock, removeBlock, moveBlock, updateBlockParam, clearProgram, BLOCK_COSTS_MAP } from '../store/programSlice'

const BLOCK_PALETTE = [
  { type: 'MOVE', color: '#00ff41', desc: 'Move forward N steps (costs 8KB per step)' },
  { type: 'ROTATE', color: '#00d4ff', desc: 'Rotate left or right (costs 4KB)' },
  { type: 'IF_SENSOR', color: '#ffb000', desc: 'Detect enemies within range (costs 16KB)' },
  { type: 'LOOP_UNTIL', color: '#bf00ff', desc: 'Repeat block until condition (costs 20KB)' },
  { type: 'AND_GATE', color: '#00d4ff', desc: 'Logical AND (A && B) (costs 8KB)' },
  { type: 'OR_GATE', color: '#bf00ff', desc: 'Logical OR (A || B) (costs 8KB)' },
  { type: 'NOT_GATE', color: '#ff6600', desc: 'Logical NOT (!A) (costs 6KB)' },
  { type: 'XOR_GATE', color: '#ff0040', desc: 'Logical XOR (A ^ B) (costs 8KB)' },
  { type: 'RECURSE', color: '#ff0040', desc: 'Call program recursively (costs 24KB)' },
  { type: 'WAIT', color: '#006622', desc: 'Wait N ticks (costs 4KB per tick)' },
]

function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'inline-block' }} onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 0, background: '#001a00', border: '1px solid #00ff41',
          padding: '6px 8px', borderRadius: 2, fontSize: '8px', color: '#00ff41', whiteSpace: 'nowrap', zIndex: 100,
          boxShadow: '0 0 8px #00ff4144', marginBottom: 4
        }}>
          {text}
        </div>
      )}
    </div>
  )
}

function PaletteBlock({ block }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'palette-block',
    item: { blockType: block.type },
    collect: m => ({ isDragging: m.isDragging() })
  }))

  return (
    <Tooltip text={block.desc}>
      <div ref={drag} style={{
        border: `1px solid ${block.color}44`,
        background: `${block.color}15`,
        padding: '3px 6px',
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        transition: 'all 0.15s',
        fontSize: 8,
        borderRadius: 2,
        userSelect: 'none'
      }}
        onMouseEnter={e => { e.currentTarget.style.background = `${block.color}22`; e.currentTarget.style.borderColor = block.color; e.currentTarget.style.boxShadow = `0 0 8px ${block.color}44` }}
        onMouseLeave={e => { e.currentTarget.style.background = `${block.color}15`; e.currentTarget.style.borderColor = `${block.color}44`; e.currentTarget.style.boxShadow = 'none' }}
      >
        <span style={{ color: block.color, fontWeight: 'bold', fontSize: 8, minWidth: 50 }}>{block.type}</span>
        <span style={{ color: '#003300', fontSize: 7, marginLeft: 'auto' }}>{BLOCK_COSTS_MAP[block.type]}KB</span>
      </div>
    </Tooltip>
  )
}

function ProgramBlock({ block, index }) {
  const dispatch = useDispatch()
  const ref = useRef(null)
  const [showParams, setShowParams] = useState(false)

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
      marginBottom: 2,
      fontSize: 8,
      borderRadius: 1,
      boxShadow: isOver ? `inset 0 0 6px ${blockColor}33` : 'none'
    }}>
      <span style={{ color: '#003300', fontSize: 7, fontWeight: 'bold', minWidth: 20 }}>{String(index + 1).padStart(2, '0')}</span>
      <span style={{ color: blockColor, fontWeight: 'bold', minWidth: 65, fontSize: 8 }}>{block.type}</span>

      {/* Compact parameter display */}
      <div style={{ display: 'flex', gap: 3, flexGrow: 1 }}>
        {block.type === 'MOVE' && (
          <input type="number" min="1" max="10" value={block.params.steps ?? 1}
            onChange={e => dispatch(updateBlockParam({ id: block.id, key: 'steps', value: parseInt(e.target.value) }))}
            style={{ width: 28, background: '#000', border: '1px solid #003300', color: '#00ff41', fontSize: 7, textAlign: 'center', fontFamily: 'var(--font-mono)', padding: '1px', borderRadius: 1 }} 
            title="Number of steps to move forward"
          />
        )}
        {block.type === 'ROTATE' && (
          <select value={block.params.direction ?? 'right'}
            onChange={e => dispatch(updateBlockParam({ id: block.id, key: 'direction', value: e.target.value }))}
            style={{ background: '#000', border: '1px solid #003300', color: '#00d4ff', fontSize: 7, fontFamily: 'var(--font-mono)', padding: '1px', borderRadius: 1 }}>
            <option value="right">→</option>
            <option value="left">←</option>
          </select>
        )}
        {block.type === 'IF_SENSOR' && (
          <input type="number" min="1" max="6" value={block.params.range ?? 3}
            onChange={e => dispatch(updateBlockParam({ id: block.id, key: 'range', value: parseInt(e.target.value) }))}
            style={{ width: 28, background: '#000', border: '1px solid #003300', color: '#ffb000', fontSize: 7, textAlign: 'center', fontFamily: 'var(--font-mono)', padding: '1px', borderRadius: 1 }}
            title="Detection range in cells"
          />
        )}
        {block.type === 'LOOP_UNTIL' && (
          <select value={block.params.condition ?? 'EXIT'}
            onChange={e => dispatch(updateBlockParam({ id: block.id, key: 'condition', value: e.target.value }))}
            style={{ background: '#000', border: '1px solid #003300', color: '#bf00ff', fontSize: 7, fontFamily: 'var(--font-mono)', padding: '1px', borderRadius: 1 }}>
            <option value="EXIT">EXIT</option>
            <option value="ALL_NODES">NODES</option>
            <option value="NO_ENEMIES">SAFE</option>
          </select>
        )}
        {block.type === 'WAIT' && (
          <input type="number" min="1" max="5" value={block.params.ticks ?? 1}
            onChange={e => dispatch(updateBlockParam({ id: block.id, key: 'ticks', value: parseInt(e.target.value) }))}
            style={{ width: 28, background: '#000', border: '1px solid #003300', color: '#006622', fontSize: 7, textAlign: 'center', fontFamily: 'var(--font-mono)', padding: '1px', borderRadius: 1 }}
            title="Ticks to wait"
          />
        )}
      </div>

      <span style={{ marginLeft: 'auto', color: '#003300', fontSize: 7 }}>{block.cost}KB</span>
      <button onClick={() => dispatch(removeBlock(block.id))}
        style={{ border: 'none', background: 'none', color: '#ff004055', cursor: 'pointer', fontSize: 9, padding: '0 2px', lineHeight: 1, transition: 'all 0.1s' }}
        onMouseEnter={e => { e.currentTarget.style.color = '#ff0040'; e.currentTarget.style.textShadow = '0 0 4px #ff0040' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#ff004055'; e.currentTarget.style.textShadow = 'none' }}
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
      borderRadius: 1
    }}>
      {isOver ? '✓ DROP' : '• DRAG HERE'}
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
  const memPct = (memUsed / memTotal) * 100

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#050f05', border: '1px solid #003300', overflow: 'hidden' }}>
      <div className="panel-header" style={{ fontSize: 8 }}>
        LOGIC DECK
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ width: 50, height: 6, background: '#001100', border: '1px solid #003300', borderRadius: 1 }}>
            <div style={{ width: `${Math.min(100, memPct)}%`, height: '100%', background: overflow ? '#ff0040' : memPct > 80 ? '#ffb000' : '#00ff41', transition: 'all 0.3s' }} />
          </div>
          <span style={{ color: overflow ? '#ff0040' : '#006622', fontSize: 7, minWidth: 45 }}>
            {memUsed}/{memTotal}KB
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, padding: 4, borderBottom: '1px solid #002200', maxHeight: 140, overflowY: 'auto' }}>
        {BLOCK_PALETTE.map(b => <PaletteBlock key={b.type} block={b} />)}
      </div>

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

      <div style={{ padding: '4px 8px', borderTop: '1px solid #002200', display: 'flex', gap: 6, alignItems: 'center', fontSize: 8 }}>
        <span style={{ color: '#003300' }}>{blocks.length} opcodes</span>
        <button onClick={() => dispatch(clearProgram())} className="danger" style={{ fontSize: 7, padding: '2px 6px', marginLeft: 'auto' }}>✕ CLEAR</button>
      </div>
    </div>
  )
}
