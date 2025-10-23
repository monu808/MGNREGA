import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { api } from '../services/api';
import './Home.css';

const Home = ({ language }) => {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedYear, setSelectedYear] = useState('2024-25');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    loadStates();
  }, []);

  useEffect(() => {
    if (selectedState) {
      loadDistricts(selectedState);
    }
  }, [selectedState]);

  useEffect(() => {
    if (selectedDistrict) {
      navigate(`/district/${selectedDistrict}`);
    }
  }, [selectedDistrict, navigate]);

  const loadStates = async () => {
    try {
      setLoading(true);
      const response = await api.getStates();
      setStates(response.data || []);
      // Auto-select UP
      if (response.data && response.data.length > 0) {
        setSelectedState(response.data[0].id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDistricts = async (stateId) => {
    try {
      setLoading(true);
      const response = await api.getDistrictsByState(stateId);
      setDistricts(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home">
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <h1 className="dashboard-title">
            <span className="dashboard-title-icon">📊</span>
            MGNREGA District Performance Dashboard
          </h1>
          <p className="dashboard-subtitle">
            Understand your district's MGNREGA performance in simple language
          </p>
        </div>
      </div>

      <div className="dashboard-container">
        {error && <div className="error">{error}</div>}
        
        <div className="selection-grid">
          {/* State Selection */}
          <div className="selection-card">
            <h3 className="selection-card-title">Select Your State</h3>
            <p className="selection-card-subtitle">Choose the state you want to check</p>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              disabled={loading}
            >
              <option value="">Choose a state...</option>
              {states.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.state_name}
                </option>
              ))}
            </select>
          </div>

          {/* District Selection */}
          <div className="selection-card">
            <h3 className="selection-card-title">Select Your District</h3>
            <p className="selection-card-subtitle">Choose your district</p>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedState || loading}
            >
              <option value="">Choose a district...</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.district_name}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selection */}
          <div className="selection-card">
            <h3 className="selection-card-title">Select Year</h3>
            <p className="selection-card-subtitle">Choose the financial year</p>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="2024-25">2024-25</option>
              <option value="2023-24">2023-24</option>
              <option value="2022-23">2022-23</option>
            </select>
          </div>
        </div>

        <div className="placeholder-section">
          <div className="placeholder-icon">
            <MapPin size={80} />
          </div>
          <h2 className="placeholder-title">Select Your District</h2>
          <p className="placeholder-text">
            Choose your state and district above to see how MGNREGA is helping your community.
            We'll show you job opportunities, worker benefits, and more.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
