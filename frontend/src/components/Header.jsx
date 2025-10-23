import React from 'react';
import { Link } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { getTranslation } from '../utils/translations';
import './Header.css';

const Header = ({ language, onLanguageToggle }) => {
  const t = (key) => getTranslation(language, key);

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <div className="logo-icon">🌾</div>
            <div className="logo-text">
              <h1>MGNREGA</h1>
              <p className="subtitle">{t('subtitle')}</p>
            </div>
          </Link>
          
          <nav className="nav">
            <Link to="/" className="nav-link">
              {language === 'en' ? 'Home' : 'होम'}
            </Link>
            <Link to="/about" className="nav-link">
              {language === 'en' ? 'About' : 'जानकारी'}
            </Link>
            <button onClick={onLanguageToggle} className="language-btn" aria-label="Change language">
              <Globe size={20} />
              <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
