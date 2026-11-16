import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Controller from './pages/Controller.jsx';
import Display from './pages/Display.jsx';
import Part from './pages/Part.jsx';
import RoleGate from './pages/RoleGate.jsx';
import RolePicker from './pages/RolePicker.jsx';

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RoleGate>
            <Home />
          </RoleGate>
        }
      />
      <Route path="/ruolo" element={<RolePicker />} />
      <Route path="/controller/:id" element={<Controller />} />
      <Route path="/display" element={<Display />} />
      <Route path="/parte" element={<Part />} />
    </Routes>
  );
}
