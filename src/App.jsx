
import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import ModelPage from './pages/ModelPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing/>}/>
      <Route path="/website/:slug" element={<ModelPage/>}/>
    </Routes>
  )
}
