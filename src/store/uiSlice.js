import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  showTutorial: true,
  volume: 0.7,
  colorblindMode: false,
  showMobileLayout: window.innerWidth < 768,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    closeTutorial(state) {
      state.showTutorial = false
      localStorage.setItem('tutorialViewed', 'true')
    },
    setVolume(state, action) { state.volume = action.payload },
    setColorblindMode(state, action) { state.colorblindMode = action.payload },
    setMobileLayout(state, action) { state.showMobileLayout = action.payload },
  }
})

export const { closeTutorial, setVolume, setColorblindMode, setMobileLayout } = uiSlice.actions
export default uiSlice.reducer
