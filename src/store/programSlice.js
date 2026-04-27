import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

const BLOCK_COSTS = {
  MOVE: 8, ROTATE: 4, IF_SENSOR: 16, LOOP_UNTIL: 20,
  AND_GATE: 8, OR_GATE: 8, NOT_GATE: 6, XOR_GATE: 8,
  RECURSE: 24, WAIT: 4
}

const initialState = {
  blocks: [], // the program (ordered list of block nodes)
  dragging: null,
}

const programSlice = createSlice({
  name: 'program',
  initialState,
  reducers: {
    addBlock(state, action) {
      const block = {
        id: uuidv4(),
        type: action.payload.type,
        params: action.payload.params || {},
        cost: BLOCK_COSTS[action.payload.type] || 8,
        children: [],
      }
      state.blocks.push(block)
    },
    removeBlock(state, action) {
      state.blocks = state.blocks.filter(b => b.id !== action.payload)
    },
    moveBlock(state, action) {
      const { fromIndex, toIndex } = action.payload
      const [removed] = state.blocks.splice(fromIndex, 1)
      state.blocks.splice(toIndex, 0, removed)
    },
    updateBlockParam(state, action) {
      const { id, key, value } = action.payload
      const block = state.blocks.find(b => b.id === id)
      if (block) block.params[key] = value
    },
    clearProgram(state) {
      state.blocks = []
    },
    setDragging(state, action) {
      state.dragging = action.payload
    },
    loadProgram(state, action) {
      state.blocks = action.payload
    }
  }
})

export const BLOCK_COSTS_MAP = BLOCK_COSTS
export const { addBlock, removeBlock, moveBlock, updateBlockParam, clearProgram, setDragging, loadProgram } = programSlice.actions
export default programSlice.reducer
