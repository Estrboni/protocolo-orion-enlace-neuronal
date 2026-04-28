import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { startGame } from './store/gameSlice'
import { closeTutorial, setMobileLayout } from './store/uiSlice'
import MainGame from './components/MainGame'
import MenuScreen from './components/MenuScreen'
import Tutorial from './components/Tutorial'

export default function App() {
  const showMenu = useSelector(s => s.game.showMenu)
  const showTutorial = useSelector(s => s.ui.showTutorial)
  const dispatch = useDispatch()

  useEffect(() => {
    // Check if tutorial was already viewed
    if (localStorage.getItem('tutorialViewed')) {
      dispatch(closeTutorial())
    }
  }, [dispatch])

  useEffect(() => {
    // Handle window resize for responsive layout
    function handleResize() {
      dispatch(setMobileLayout(window.innerWidth < 768))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [dispatch])

  return (
    <DndProvider backend={HTML5Backend}>
      {showMenu ? (
        <MenuScreen onStart={() => dispatch(startGame())} />
      ) : (
        <MainGame />
      )}
      {showTutorial && !showMenu && (
        <Tutorial onComplete={() => dispatch(closeTutorial())} />
      )}
    </DndProvider>
  )
}
