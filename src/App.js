import React, { useState, useMemo, useEffect } from 'react';

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Homepage from './pages/home';
import Driveby from './pages/driveby';
import './App.css';

function App() {

  const getSubdomain = () => {
    const host = window.location.hostname; // e.g., 'multisender.domain.com'
    const parts = host.split('.');
    
    // Assuming format is subdomain.domain.com
    if (parts.length >= 3) {
      return parts[0]; // 'multisender', 'tool2', etc.
    }
    return null;
  };

  const subdomain = getSubdomain();
  
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<Homepage/>} />
        <Route path="/driveby" element={<Driveby/>} />
      </Routes>
    </Router>
  );
}

export default App;