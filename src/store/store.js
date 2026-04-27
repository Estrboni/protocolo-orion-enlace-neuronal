import { configureStore } from '@reduxjs/toolkit'
import gameReducer from './gameSlice'
import programReducer from './programSlice'

export const store = configureStore({
  reducer: {
    game: gameReducer,
    program: programReducer,
  }
})
