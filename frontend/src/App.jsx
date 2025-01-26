import './App.css'
import { Routes, Route } from 'react-router-dom';
import Chat from './components/Chat';
import Home from './components/Home';

function App() {
    return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </>
  )
}

export default App
