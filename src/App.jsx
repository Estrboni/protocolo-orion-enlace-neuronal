import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { startGame } from './store/gameSlice'
import MainGame from './components/MainGame'
import MenuScreen from './components/MenuScreen'

export default function App() {
  const showMenu = useSelector(s => s.game.showMenu)
  const dispatch = useDispatch()

  return (
    <DndProvider backend={HTML5Backend}>
      {showMenu ? (
        <MenuScreen onStart={() => dispatch(startGame())} />
      ) : (
        <MainGame />
      )}
    </DndProvider>
  )
}
