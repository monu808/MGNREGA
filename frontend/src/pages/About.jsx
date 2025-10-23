import React from 'react';
import { Link } from 'react-router-dom';
import { Info, CheckCircle, Database, Code, TrendingUp, ArrowLeft } from 'lucide-react';
import './About.css';

const About = ({ language }) => {
  return (
    <div className="about-page">
      <div className="about-container">
        {/* Hero Section */}
        <div className="about-hero">
          <div className="about-hero-content">
            <h1 className="about-title">
              {language === 'en' ? 'About MGNREGA Dashboard' : 'मनरेगा डैशबोर्ड के बारे में'}
            </h1>
            <p className="about-description">
              {language === 'en'
                ? 'A modern platform to track and analyze MGNREGA performance data across India with real-time insights and automatic location detection.'
                : 'भारत भर में मनरेगा प्रदर्शन डेटा को ट्रैक और विश्लेषण करने के लिए एक आधुनिक मंच, वास्तविक समय की जानकारी और स्वचालित स्थान पहचान के साथ।'}
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="about-content-grid">
          {/* Mission Section */}
          <div className="about-card about-card-featured">
            <div className="card-icon card-icon-primary">
              <Info size={32} />
            </div>
            <h2 className="card-title">
              {language === 'en' ? 'Our Mission' : 'हमारा मिशन'}
            </h2>
            <p className="card-text">
              {language === 'en'
                ? 'Making MGNREGA performance data accessible and understandable for every Indian citizen. We believe transparency empowers communities to demand better governance and accountability.'
                : 'मनरेगा प्रदर्शन डेटा को हर भारतीय नागरिक के लिए सुलभ और समझने योग्य बनाना। हम मानते हैं कि पारदर्शिता समुदायों को बेहतर शासन और जवाबदेही की मांग करने के लिए सशक्त बनाती है।'}
            </p>
          </div>

          {/* Key Features */}
          <div className="about-card">
            <div className="card-icon card-icon-success">
              <CheckCircle size={32} />
            </div>
            <h2 className="card-title">
              {language === 'en' ? 'Key Features' : 'मुख्य विशेषताएं'}
            </h2>
            <ul className="features-list">
              <li>
                <span className="feature-icon">📍</span>
                <div className="feature-content">
                  <strong>{language === 'en' ? 'Auto-Location Detection' : 'स्वचालित स्थान पता लगाना'}</strong>
                  <p>{language === 'en' ? 'Automatically find your district using GPS' : 'GPS का उपयोग करके स्वचालित रूप से अपना जिला खोजें'}</p>
                </div>
              </li>
              <li>
                <span className="feature-icon">🔄</span>
                <div className="feature-content">
                  <strong>{language === 'en' ? 'Real-time Data' : 'वास्तविक समय डेटा'}</strong>
                  <p>{language === 'en' ? 'Live data directly from government sources' : 'सरकारी स्रोतों से सीधे लाइव डेटा'}</p>
                </div>
              </li>
              <li>
                <span className="feature-icon">📊</span>
                <div className="feature-content">
                  <strong>{language === 'en' ? 'Historical Trends' : 'ऐतिहासिक रुझान'}</strong>
                  <p>{language === 'en' ? 'View past performance and trends over time' : 'समय के साथ पिछले प्रदर्शन और रुझान देखें'}</p>
                </div>
              </li>
              <li>
                <span className="feature-icon">📅</span>
                <div className="feature-content">
                  <strong>{language === 'en' ? 'Multi-Year Analysis' : 'बहु-वर्षीय विश्लेषण'}</strong>
                  <p>{language === 'en' ? 'Access data from 2018-2019 to 2025-2026' : '2018-2019 से 2025-2026 तक का डेटा एक्सेस करें'}</p>
                </div>
              </li>
              <li>
                <span className="feature-icon">🌐</span>
                <div className="feature-content">
                  <strong>{language === 'en' ? 'Voice Support' : 'आवाज समर्थन'}</strong>
                  <p>{language === 'en' ? 'Listen to summaries in your language' : 'अपनी भाषा में सारांश सुनें'}</p>
                </div>
              </li>
              <li>
                <span className="feature-icon">📱</span>
                <div className="feature-content">
                  <strong>{language === 'en' ? 'Simple Visual Design' : 'सरल दृश्य डिजाइन'}</strong>
                  <p>{language === 'en' ? 'Icons, colors, and minimal text' : 'आइकन, रंग और न्यूनतम पाठ'}</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Data Source */}
          <div className="about-card">
            <div className="card-icon card-icon-warning">
              <Database size={32} />
            </div>
            <h2 className="card-title">
              {language === 'en' ? 'Data Source' : 'डेटा स्रोत'}
            </h2>
            <p className="card-text">
              {language === 'en'
                ? 'All data is sourced directly from the official Government of India Open Data Portal (data.gov.in) in real-time. The platform fetches fresh data for every query, ensuring you always have the most up-to-date MGNREGA performance metrics.'
                : 'सभी डेटा सीधे आधिकारिक भारत सरकार के ओपन डेटा पोर्टल (data.gov.in) से वास्तविक समय में प्राप्त किया जाता है। प्लेटफ़ॉर्म प्रत्येक क्वेरी के लिए ताज़ा डेटा प्राप्त करता है।'}
            </p>
            <div className="data-source-badge">
              <span className="badge badge-success">Official Government Data</span>
              <span className="badge badge-info">8 Years Historical Data</span>
            </div>
          </div>

          {/* Technical Architecture */}
          <div className="about-card">
            <div className="card-icon card-icon-info">
              <Code size={32} />
            </div>
            <h2 className="card-title">
              {language === 'en' ? 'Technology Stack' : 'तकनीकी स्टैक'}
            </h2>
            <div className="tech-grid">
              <div className="tech-item">
                <div className="tech-label">Frontend</div>
                <div className="tech-value">React + Vite</div>
              </div>
              <div className="tech-item">
                <div className="tech-label">Backend</div>
                <div className="tech-value">Node.js + Express</div>
              </div>
              <div className="tech-item">
                <div className="tech-label">API</div>
                <div className="tech-value">data.gov.in</div>
              </div>
              <div className="tech-item">
                <div className="tech-label">Charts</div>
                <div className="tech-value">Recharts</div>
              </div>
              <div className="tech-item">
                <div className="tech-label">Location</div>
                <div className="tech-value">Geolocation API</div>
              </div>
              <div className="tech-item">
                <div className="tech-label">Maps</div>
                <div className="tech-value">OpenStreetMap</div>
              </div>
            </div>
            <p className="card-text" style={{ marginTop: '1.5rem' }}>
              {language === 'en'
                ? 'Built with modern web technologies for fast performance and real-time data access without database dependencies.'
                : 'तेज प्रदर्शन और डेटाबेस निर्भरता के बिना वास्तविक समय डेटा एक्सेस के लिए आधुनिक वेब तकनीकों के साथ बनाया गया।'}
            </p>
          </div>

          {/* About MGNREGA - Full Width */}
          <div className="about-card about-card-full">
            <div className="card-icon card-icon-primary">
              <TrendingUp size={32} />
            </div>
            <h2 className="card-title">
              {language === 'en' ? 'About MGNREGA' : 'मनरेगा के बारे में'}
            </h2>
            <p className="card-text">
              {language === 'en'
                ? 'The Mahatma Gandhi National Rural Employment Guarantee Act (MGNREGA) is an Indian labor law and social security measure that aims to guarantee the "right to work". It provides a legal guarantee for 100 days of employment in every financial year to adult members of any rural household willing to do public work-related unskilled manual work.'
                : 'महात्मा गांधी राष्ट्रीय ग्रामीण रोजगार गारंटी अधिनियम (मनरेगा) एक भारतीय श्रम कानून और सामाजिक सुरक्षा उपाय है जिसका उद्देश्य "काम के अधिकार" की गारंटी देना है।'}
            </p>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">12.15 Cr</div>
                <div className="stat-label">
                  {language === 'en' ? 'Beneficiaries' : 'लाभार्थी'}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-number">100+</div>
                <div className="stat-label">
                  {language === 'en' ? 'Days Guaranteed' : 'गारंटीकृत दिन'}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-number">33</div>
                <div className="stat-label">
                  {language === 'en' ? 'States & UTs' : 'राज्य और केंद्र शासित प्रदेश'}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-number">2005</div>
                <div className="stat-label">
                  {language === 'en' ? 'Year Enacted' : 'अधिनियमित वर्ष'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="about-footer">
          <Link to="/" className="btn-back">
            <ArrowLeft size={20} />
            {language === 'en' ? 'Back to Dashboard' : 'डैशबोर्ड पर वापस जाएं'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default About;
