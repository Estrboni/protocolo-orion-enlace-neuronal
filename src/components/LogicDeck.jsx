import React, { useRef, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useDrag, useDrop } from 'react-dnd'
import { addBlock, removeBlock, moveBlock, updateBlockParam, clearProgram, BLOCK_COSTS_MAP } from '../store/programSlice'

const CATEGORIES = {
  MOTION:  { label: 'MOTION',  color: '#00ff41', blocks: ['MOVE', 'ROTATE', 'WAIT'] },
  CONTROL: { label: 'CONTROL', color: '#ffb000', blocks: ['IF_SENSOR', 'LOOP_UNTIL', 'RECURSE'] },
  LOGIC:   { label: 'LOGIC',   color: '#00d4ff', blocks: ['AND_GATE', 'OR_GATE', 'NOT_GATE', 'XOR_GATE'] },
}

const BLOCK_META = {
  MOVE:      { color: '#00ff41', cat: 'MOTION',  icon: '→', desc: 'Move forward N steps' },
  ROTATE:    { color: '#00d4ff', cat: 'MOTION',  icon: '↻', desc: 'Rotate left or right' },
  WAIT:      { color: '#006622', cat: 'MOTION',  icon: '◉', desc: 'Wait N ticks' },
  IF_SENSOR: { color: '#ffb000', cat: 'CONTROL', icon: '?', desc: 'Branch if enemy nearby' },
  LOOP_UNTIL:{ color: '#bf00ff', cat: 'CONTROL', icon: '⟳', desc: 'Loop until condition' },
  RECURSE:   { color: '#ff0040', cat: 'CONTROL', icon: '∞', desc: 'Recurse program' },
  AND_GATE:  { color: '#00d4ff', cat: 'LOGIC',   icon: '∧', desc: 'AND logic gate' },
  OR_GATE:   { color: '#bf00ff', cat: 'LOGIC',   icon: '∨', desc: 'OR logic gate' },
  NOT_GATE:  { color: '#ff6600', cat: 'LOGIC',   icon: '¬', desc: 'NOT invert gate' },
  XOR_GATE:  { color: '#ff0040', cat: 'LOGIC',   icon: '⊕', desc: 'XOR exclusive gate' },
}

function PaletteBlock({ type }) {
  const meta = BLOCK_META[type]
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'palette-block',
    item: { blockType: type },
    collect: m => ({ isDragging: m.isDragging() })
  }))

  return (
    <div
      ref={drag}
      title={`${meta.desc} — ${BLOCK_COSTS_MAP[type]}KB`}
      style={{
        border: `1px solid ${meta.color}44`,
        background: isDragging ? `${meta.color}33` : `${meta.color}0d`,
        padding: '3px 6px',
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        display: 'flex', alignItems: 'center', gap: 5,
        transition: 'all 0.12s',
        fontSize: 9, userSelect: 'none',
        borderRadius: 2,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `${meta.color}22`; e.currentTarget.style.borderColor = meta.color; e.currentTarget.style.boxShadow = `0 0 6px ${meta.color}55` }}
      onMouseLeave={e => { e.currentTarget.style.background = `${meta.color}0d`; e.currentTarget.style.borderColor = `${meta.color}44`; e.currentTarget.style.boxShadow = 'none' }}
    >
      <span style={{ color: meta.color, fontSize: 11, lineHeight: 1 }}>{meta.icon}</span>
      <span style={{ color: meta.color, fontWeight: 'bold', letterSpacing: 1, fontSize: 8 }}>{type}</span>
      <span style={{ color: '#003a00', fontSize: 7, marginLeft: 'auto' }}>{BLOCK_COSTS_MAP[type]}K</span>
    </div>
  )
}

function ProgramBlock({ block, index, isActive }) {
  const dispatch = useDispatch()
  const ref = useRef(null)
  const meta = BLOCK_META[block.type] ?? { color: '#00ff41', icon: '■' }

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'program-block',
    item: { index },
    collect: m => ({ isDragging: m.isDragging() })
  }))

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ['program-block', 'palette-block'],
    drop(item, monitor) {
      if (monitor.getItemType() === 'program-block') {
        if (item.index !== index) dispatch(moveBlock({ fromIndex: item.index, toIndex: index }))
      } else {
        dispatch(addBlock({ type: item.blockType, atIndex: index }))
      }
    },
    collect: m => ({ isOver: m.isOver(), canDrop: m.canDrop() })
  }))

  drag(drop(ref))

  return (
    <div
      ref={ref}
      style={{
        border: `1px solid ${isActive ? meta.color : isOver ? meta.color + 'aa' : meta.color + '33'}`,
        background: isActive
          ? `${meta.color}20`
          : isOver ? `${meta.color}15` : `${meta.color}08`,
        padding: '5px 8px',
        cursor: 'grab',
        opacity: isDragging ? 0.25 : 1,
        display: 'flex', alignItems: 'center', gap: 6,
        transition: 'all 0.1s',
        marginBottom: 2,
        fontSize: 9, userSelect: 'none',
        minHeight: 30,
        borderRadius: 2,
        boxShadow: isActive ? `0 0 10px ${meta.color}55, inset 0 0 8px ${meta.color}11` : isOver ? `0 0 6px ${meta.color}33` : 'none',
        animation: isActive ? 'fadeInUp 0.15s ease' : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Active execution scan line */}
      {isActive && (
        <div style={{
          position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
          background: `linear-gradient(90deg, transparent, ${meta.color}18, transparent)`,
          animation: 'scanBeam 0.8s linear infinite',
          pointerEvents: 'none',
        }} />
      )}

      {/* Drop indicator */}
      {isOver && !isDragging && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: meta.color, boxShadow: `0 0 6px ${meta.color}`,
        }} />
      )}

      <span style={{ color: '#004400', fontSize: 8, minWidth: 16, textAlign: 'right' }}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <span style={{ color: meta.color, fontSize: 12 }}>{meta.icon}</span>
      <span style={{
        color: meta.color, fontWeight: 'bold', fontSize: 8, letterSpacing: 1,
        textShadow: isActive ? `0 0 8px ${meta.color}` : 'none',
        minWidth: 60
      }}>{block.type}</span>

      {/* Params */}
      {block.type === 'MOVE' && (
        <input type="number" min="1" max="10" value={block.params?.steps ?? 1}
          onChange={e => dispatch(updateBlockParam({ id: block.id, key: 'steps', value: parseInt(e.target.value) }))}
          onClick={e => e.stopPropagation()}
          style={{ width: 30, background: '#000', border: `1px solid #003300`, color: meta.color, fontSize: 8, textAlign: 'center', fontFamily: 'var(--font-mono)', padding: '1px 2px' }}
          title="Steps"
        />
      )}
      {block.type === 'ROTATE' && (
        <select value={block.params?.direction ?? 'right'}
          onChange={e => dispatch(updateBlockParam({ id: block.id, key: 'direction', value: e.target.value }))}
          onClick={e => e.stopPropagation()}
          style={{ background: '#000', border: '1px solid #003300', color: meta.color, fontSize: 8, fontFamily: 'var(--font-mono)' }}
        >
          <option value="right">▶ R</option>
          <option value="left">◀ L</option>
        </select>
      )}
      {block.type === 'IF_SENSOR' && (
        <input type="number" min="1" max="6" value={block.params?.range ?? 3}
          onChange={e => dispatch(updateBlockParam({ id: block.id, key: 'range', value: parseInt(e.target.value) }))}
          onClick={e => e.stopPropagation()}
          style={{ width: 30, background: '#000', border: '1px solid #003300', color: meta.color, fontSize: 8, textAlign: 'center', fontFamily: 'var(--font-mono)', padding: '1px 2px' }}
          title="Sensor range"
        />
      )}
      {block.type === 'LOOP_UNTIL' && (
        <select value={block.params?.condition ?? 'EXIT'}
          onChange={e => dispatch(updateBlockParam({ id: block.id, key: 'condition', value: e.target.value }))}
          onClick={e => e.stopPropagation()}
          style={{ background: '#000', border: '1px solid #003300', color: meta.color, fontSize: 8, fontFamily: 'var(--font-mono)' }}
        >
          <option value="EXIT">EXIT</option>
          <option value="NODES">NODES</option>
          <option value="CLEAR">CLEAR</option>
        </select>
      )}
      {block.type === 'WAIT' && (
        <input type="number" min="1" max="5" value={block.params?.ticks ?? 1}
          onChange={e => dispatch(updateBlockParam({ id: block.id, key: 'ticks', value: parseInt(e.target.value) }))}
          onClick={e => e.stopPropagation()}
          style={{ width: 30, background: '#000', border: '1px solid #003300', color: meta.color, fontSize: 8, textAlign: 'center', fontFamily: 'var(--font-mono)', padding: '1px 2px' }}
          title="Ticks to wait"
        />
      )}

      <span style={{ marginLeft: 'auto', color: '#003300', fontSize: 7 }}>{block.cost ?? BLOCK_COSTS_MAP[block.type]}K</span>
      <button
        onClick={e => { e.stopPropagation(); dispatch(removeBlock(block.id)) }}
        style={{ border: 'none', background: 'none', color: '#ff004055', cursor: 'pointer', fontSize: 11, padding: '0 2px', lineHeight: 1, transition: 'color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.color = '#ff0040'}
        onMouseLeave={e => e.currentTarget.style.color = '#ff004055'}
        title="Remove"
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
      minHeight: 36,
      border: `1px dashed ${isOver ? '#00ff41' : '#002200'}`,
      background: isOver ? '#00ff4111' : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: isOver ? '#00ff41' : '#003300',
      fontSize: 9, letterSpacing: 3,
      transition: 'all 0.15s', borderRadius: 2, marginTop: 2,
      boxShadow: isOver ? '0 0 10px #00ff4133' : 'none',
    }}>
      {isOver ? '↓ DROP HERE' : '+ DRAG BLOCK HERE'}
    </div>
  )
}

export default function LogicDeck() {
  const dispatch = useDispatch()
  const { blocks } = useSelector(s => s.program)
  const { levelData, executionStep, status } = useSelector(s => s.game)

  const memUsed = useMemo(() => blocks.reduce((a, b) => a + (BLOCK_COSTS_MAP[b.type] || 8), 0), [blocks])
  const memTotal = levelData?.memoryBuffer ?? 128
  const overflow = memUsed > memTotal
  const memPct = Math.min(100, Math.round((memUsed / memTotal) * 100))
  const memColor = overflow ? '#ff0040' : memPct > 75 ? '#ffb000' : '#00ff41'

  const activeIndex = status === 'running' ? (executionStep ?? -1) : -1

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#050f05', overflow: 'hidden' }}>
      <div className="panel-header" style={{ fontSize: 9 }}>
        LOGIC DECK
        <span style={{ marginLeft: 'auto', color: overflow ? '#ff0040' : '#006622', fontSize: 8 }}>
          MEM {memUsed}/{memTotal}K {overflow && '⚠ OVERFLOW'}
        </span>
      </div>

      {/* Memory bar */}
      <div style={{ padding: '3px 6px', borderBottom: '1px solid #001800' }}>
        <div style={{ height: 3, background: '#001a00', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${memPct}%`,
            background: memColor, boxShadow: `0 0 4px ${memColor}`,
            transition: 'width 0.3s, background 0.3s', borderRadius: 2
          }} />
        </div>
      </div>

      {/* Palette by category */}
      <div style={{ borderBottom: '1px solid #001800', maxHeight: '32%', overflowY: 'auto' }}>
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <div key={key}>
            <div style={{ padding: '2px 8px', fontSize: 7, letterSpacing: 3, color: cat.color + '88', background: '#020a02', borderBottom: '1px solid #001400' }}>
              {cat.label}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, padding: '3px 4px' }}>
              {cat.blocks.map(t => <PaletteBlock key={t} type={t} />)}
            </div>
          </div>
        ))}
      </div>

      {/* Program sequence */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 4 }}>
        {blocks.length === 0 ? (
          <DropZone />
        ) : (
          <>
            {blocks.map((b, i) => (
              <ProgramBlock key={b.id} block={b} index={i} isActive={i === activeIndex} />
            ))}
            <DropZone />
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '4px 8px', borderTop: '1px solid #001800',
        display: 'flex', alignItems: 'center', gap: 6, fontSize: 8
      }}>
        <span style={{ color: '#004400' }}>{blocks.length} OPS</span>
        {status === 'running' && activeIndex >= 0 && (
          <span style={{ color: '#00ff41', animation: 'flicker 1s infinite' }}>
            ▶ STEP {activeIndex + 1}
          </span>
        )}
        <button
          onClick={() => dispatch(clearProgram())}
          className="danger"
          style={{ fontSize: 7, padding: '2px 8px', marginLeft: 'auto', letterSpacing: 2 }}
          title="Clear all"
        >CLR ALL</button>
      </div>
    </div>
  )
}
