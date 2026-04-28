import { configureStore } from '@reduxjs/toolkit'
import gameReducer from './gameSlice'
import programReducer from './programSlice'
import uiReducer from './uiSlice'

export const store = configureStore({
  reducer: {
    game: gameReducer,
    program: programReducer,
    ui: uiReducer,
  }
})
