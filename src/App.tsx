// src/App.tsx
import Overlay from './pages/Overlay'
import Panel from './pages/Panel'

const extType = import.meta.env.VITE_EXT_TYPE

function App() {
  if (extType === 'panel') return <Panel />
  return <Overlay />
}

export default App