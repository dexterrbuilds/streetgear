import React from 'react';

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Homepage from './pages/home';
import Driveby from './pages/driveby';
import './App.css';

function App() {

  const getSubdomain = () => {
    const host = window.location.hostname;
    const parts = host.split('.');
    
    
    if (parts.length >= 3) {
      return parts[0];
    }
    return null;
  };

  const subdomain = getSubdomain();

  return (
    <Router>
      <Routes>
        {subdomain === 'driveby' && <Route path="/" element={<Driveby/>} />}
        {!subdomain && <Route path="/" element={<Homepage/>} />}
      </Routes>
    </Router>
  );
}

export default App;