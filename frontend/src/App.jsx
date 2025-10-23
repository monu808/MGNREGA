import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import DistrictPerformance from './pages/DistrictPerformance';
import About from './pages/About';
import './index.css';

function App() {
  const [language, setLanguage] = useState('hi');

  useEffect(() => {
    // Check for saved language preference
    const savedLang = localStorage.getItem('language') || 'hi';
    setLanguage(savedLang);
  }, []);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'hi' : 'en';
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <Router>
      <div className="App">
        <Header language={language} onLanguageToggle={toggleLanguage} />
        <Routes>
          <Route path="/" element={<Home language={language} />} />
          <Route path="/district/:id" element={<DistrictPerformance language={language} />} />
          <Route path="/about" element={<About language={language} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
