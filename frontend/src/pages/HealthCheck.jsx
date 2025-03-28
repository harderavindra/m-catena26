import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HealthCheck from './pages/HealthCheck';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/healthcheck" element={<HealthCheck />} />
      </Routes>
    </Router>
  );
}

export default App;
