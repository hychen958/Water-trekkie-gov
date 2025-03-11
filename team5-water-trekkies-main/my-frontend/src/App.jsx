import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import CharacterSelect from "./CharacterSelect"; 
import HelpScreen from "./HelpScreen"; 
import { PhaserGame } from './game/PhaserGame';
import GameTest from "./GameTest"; 
import Menu from "./Menu"; 



const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const ProtectedRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  return (
<Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/game"
          element={<PhaserGame />}
        />
    <Route path="/characterselect" element={<CharacterSelect />} />
    <Route path="/helpscreen" element={<HelpScreen />} />
    <Route path="/gametest" element={<GameTest />} />
    <Route path="/menu" element={<Menu />} />

      </Routes>
    </Router>
  );
};

export default App;
