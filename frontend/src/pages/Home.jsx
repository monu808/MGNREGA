import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation } from 'lucide-react';
import { api } from '../services/api';
import './Home.css';

const Home = ({ language }) => {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedYear, setSelectedYear] = useState('2024-2025');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    loadStates();
  }, []);

  useEffect(() => {
    if (selectedState) {
      // Find state name
      const state = states.find(s => s.state_code === selectedState);
      if (state) {
        loadDistricts(state.state_name);
      }
    }
  }, [selectedState]);

  useEffect(() => {
    if (selectedDistrict && selectedState) {
      // Find the selected district and state names
      const district = districts.find(d => d.district_code === selectedDistrict);
      const state = states.find(s => s.state_code === selectedState);
      
      if (district && state) {
        // Include financial year (fy) in the query so backend can request the correct FY
        navigate(`/district/${encodeURIComponent(district.district_name)}?state=${encodeURIComponent(state.state_name)}&fy=${encodeURIComponent(selectedYear)}`);
      }
    }
  }, [selectedDistrict, selectedState, districts, states, selectedYear, navigate]);

  const loadStates = async () => {
    try {
      setLoading(true);
      const response = await api.getStates();
      const statesList = response.data || [];
      setStates(statesList);
      // Don't auto-select - let user choose
      setError(null);
    } catch (err) {
      console.error('Error loading states:', err);
      setError(err.message || 'Failed to load states');
    } finally {
      setLoading(false);
    }
  };

  const loadDistricts = async (stateName) => {
    try {
      setLoading(true);
      setDistricts([]);
      const response = await api.getDistrictsByState(stateName);
      setDistricts(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error loading districts:', err);
      setError(err.message || 'Failed to load districts');
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use reverse geocoding API to get location details
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          
          const data = await response.json();
          
          if (data && data.address) {
            const detectedState = data.address.state;
            const detectedDistrict = data.address.state_district || data.address.county;
            
            // Try to match with available states
            const matchedState = states.find(s => 
              s.state_name.toLowerCase().includes(detectedState?.toLowerCase() || '')
            );
            
            if (matchedState) {
              setSelectedState(matchedState.state_code);
              
              // Load districts and then try to match
              try {
                const districtResponse = await api.getDistrictsByState(matchedState.state_name);
                const loadedDistricts = districtResponse.data || [];
                setDistricts(loadedDistricts);
                
                // Try to match district
                const matchedDistrict = loadedDistricts.find(d => 
                  d.district_name.toLowerCase().includes(detectedDistrict?.toLowerCase() || '') ||
                  detectedDistrict?.toLowerCase().includes(d.district_name.toLowerCase())
                );
                
                if (matchedDistrict) {
                  setSelectedDistrict(matchedDistrict.district_code);
                  setLocationError(`✓ Location detected: ${matchedDistrict.district_name}, ${matchedState.state_name}`);
                } else {
                  setLocationError(`State detected: ${matchedState.state_name}. Please select your district manually.`);
                }
              } catch (err) {
                console.error('Error loading districts:', err);
                setLocationError(`State detected: ${matchedState.state_name}. Please select your district manually.`);
              }
            } else {
              setLocationError(`Location detected: ${detectedState}. Could not match with available states. Please select manually.`);
            }
          }
        } catch (err) {
          console.error('Error getting location details:', err);
          setLocationError('Could not determine your location. Please select manually.');
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Could not get your location. ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access in your browser.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'Please select your district manually.';
        }
        
        setLocationError(errorMessage);
        setDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
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
        
        {/* Auto-Location Detection Button */}
        <div className="auto-location-section">
          <button 
            className="auto-location-btn"
            onClick={detectLocation}
            disabled={detectingLocation || loading}
          >
            <Navigation size={20} />
            {detectingLocation ? 'Detecting Location...' : 'Auto-Detect My District'}
          </button>
          {locationError && <div className="location-info">{locationError}</div>}
        </div>

        <div className="divider">
          <span>OR SELECT MANUALLY</span>
        </div>
        
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
                <option key={state.state_code} value={state.state_code}>
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
                <option key={district.district_code} value={district.district_code}>
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
              <option value="2025-2026">2025-2026</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2023-2024">2023-2024</option>
              <option value="2022-2023">2022-2023</option>
              <option value="2021-2022">2021-2022</option>
              <option value="2020-2021">2020-2021</option>
              <option value="2019-2020">2019-2020</option>
              <option value="2018-2019">2018-2019</option>
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
