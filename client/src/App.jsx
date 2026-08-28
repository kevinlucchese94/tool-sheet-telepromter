import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Controller from './pages/Controller.jsx';
import Display from './pages/Display.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/controller/:id" element={<Controller />} />
      <Route path="/display" element={<Display />} />
    </Routes>
  );
}
