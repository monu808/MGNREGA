import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  Briefcase,
  TrendingUp,
  DollarSign,
  Calendar,
  Volume2,
  ArrowLeft,
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { api } from '../services/api';
import { getTranslation } from '../utils/translations';
import { formatNumber, formatCurrency, getPerformanceColor, speakText } from '../utils/helpers';
import './DistrictPerformance.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const DistrictPerformance = ({ language }) => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const t = (key) => getTranslation(language, key);

  // Get state and financial year from URL query params
  const searchParams = new URLSearchParams(window.location.search);
  const stateName = searchParams.get('state');
  const fyParam = searchParams.get('fy') || '2024-2025';

  useEffect(() => {
    if (stateName) {
      loadPerformanceData();
      loadHistoryData();
    } else {
      setError('State parameter is missing');
      setLoading(false);
    }
  }, [id, stateName, fyParam]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      const response = await api.getLatestPerformance(id, stateName, fyParam);
      // Response structure: { success: true, data: { district, performance, indicators } }
      setData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryData = async () => {
    try {
      const response = await api.getPerformanceHistory(id, stateName, fyParam, 12);
      // Response structure: { success: true, data: { district, history } }
      setHistory(response.data?.history || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleSpeak = (text) => {
    speakText(text, language === 'hi' ? 'hi-IN' : 'en-US');
  };

  if (loading) {
    return <div className="loading">{t('loading')}</div>;
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
        <Link to="/" className="btn-primary">
          {language === 'en' ? 'Go Back' : 'वापस जाएं'}
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container">
        <div className="error">{t('noData')}</div>
        <Link to="/" className="btn-primary">
          {language === 'en' ? 'Go Back' : 'वापस जाएं'}
        </Link>
      </div>
    );
  }

  const { district, performance, indicators } = data;

  // Chart data - safely handle API response format
  const chartData = {
    labels: history && history.length > 0
      ? history
          .slice()
          .reverse()
          .map((h) => {
            if (h.financial_year && h.month) {
              return `${h.month} ${h.financial_year}`;
            } else if (h.month && h.year) {
              return `${h.month}/${h.year?.toString().slice(2) || ''}`;
            }
            return 'N/A';
          })
      : [],
    datasets: [
      {
        label: language === 'en' ? 'Person Days (in thousands)' : 'व्यक्ति दिवस (हजारों में)',
        data: history && history.length > 0
          ? history.map((h) => {
              const personDays = h.person_days_generated || 0;
              return (personDays / 1000).toFixed(0);
            })
          : [],
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="district-performance">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <Link to="/" className="back-btn">
            <ArrowLeft size={20} />
            <span>{language === 'en' ? 'Back' : 'वापस'}</span>
          </Link>
          <div className="district-header">
            <h1 className="district-title">
              {language === 'hi' && district.district_name_hindi
                ? district.district_name_hindi
                : district.district_name}
            </h1>
            <p className="district-subtitle">
              {language === 'hi' && district.state_name_hindi
                ? district.state_name_hindi
                : district.state_name}
            </p>
          </div>
        </div>

        {/* Overall Performance Card */}
        <div className="card performance-overview">
          <div
            className="performance-badge"
            style={{ backgroundColor: getPerformanceColor(indicators.overall_score) }}
          >
            <div className="performance-icon">{indicators.performance_icon}</div>
            <div>
              <div className="performance-score">{indicators.overall_score}/100</div>
              <div className="performance-level">{indicators.performance_level}</div>
            </div>
          </div>
          <div className="performance-description">
            <h2>{t('overall')}</h2>
            <p>
              {language === 'en'
                ? `This district's performance is ${indicators.performance_level.toLowerCase()} based on employment days, demand fulfillment, and payment timeliness.`
                : `यह जिला का प्रदर्शन रोजगार दिवस, मांग पूर्ति, और भुगतान समय के आधार पर ${indicators.performance_level} है।`}
            </p>
            <button
              className="speak-btn"
              onClick={() =>
                handleSpeak(
                  language === 'en'
                    ? `District ${district.district_name} performance is ${indicators.performance_level}`
                    : `जिला ${district.district_name_hindi || district.district_name} का प्रदर्शन ${indicators.performance_level} है`
                )
              }
            >
              <Volume2 size={18} />
              <span>{language === 'en' ? 'Listen' : 'सुनें'}</span>
            </button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="metrics-grid">
          {/* Job Cards */}
          <div className="metric-card card">
            <div className="metric-icon" style={{ backgroundColor: '#E3F2FD' }}>
              <Briefcase size={32} color="#2196F3" />
            </div>
            <div className="metric-content">
              <h3 className="metric-label">{t('jobCards')}</h3>
              <div className="metric-value">{formatNumber(performance.total_job_cards_issued)}</div>
              <p className="metric-description">{t('jobCardsExplain')}</p>
            </div>
          </div>

          {/* Workers */}
          <div className="metric-card card">
            <div className="metric-icon" style={{ backgroundColor: '#F3E5F5' }}>
              <Users size={32} color="#9C27B0" />
            </div>
            <div className="metric-content">
              <h3 className="metric-label">{t('workers')}</h3>
              <div className="metric-value">{formatNumber(performance.active_workers)}</div>
              <p className="metric-description">{t('workersExplain')}</p>
              <div className="metric-detail">
                👩 {formatNumber(performance.women_workers)} {language === 'en' ? 'women' : 'महिलाएं'}
              </div>
            </div>
          </div>

          {/* Work Days */}
          <div className="metric-card card">
            <div className="metric-icon" style={{ backgroundColor: '#FFF3E0' }}>
              <Calendar size={32} color="#FF9800" />
            </div>
            <div className="metric-content">
              <h3 className="metric-label">{t('workDays')}</h3>
              <div className="metric-value">
                {formatNumber(performance.person_days_generated)}
              </div>
              <p className="metric-description">{t('workDaysExplain')}</p>
              <div className="metric-detail">
                📊 {performance.average_days_per_household} {language === 'en' ? 'days/household' : 'दिन/परिवार'}
              </div>
            </div>
          </div>

          {/* Wages */}
          <div className="metric-card card">
            <div className="metric-icon" style={{ backgroundColor: '#E8F5E9' }}>
              <DollarSign size={32} color="#4CAF50" />
            </div>
            <div className="metric-content">
              <h3 className="metric-label">{t('wages')}</h3>
              <div className="metric-value">{formatCurrency(performance.total_expenditure)}</div>
              <p className="metric-description">{t('wagesExplain')}</p>
              <div className="metric-detail">
                💰 ₹{performance.average_wage_per_day}/
                {language === 'en' ? 'day' : 'दिन'}
              </div>
            </div>
          </div>
        </div>

        {/* Performance History Chart */}
        {showHistory && history.length > 0 && (
          <div className="card chart-container">
            <h2>{t('performanceHistory')}</h2>
            <div style={{ height: '300px' }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Toggle History Button */}
        <div style={{ textAlign: 'center', margin: '2rem 0' }}>
          <button
            className="btn-secondary"
            onClick={() => setShowHistory(!showHistory)}
          >
            <TrendingUp size={20} />
            <span>
              {showHistory
                ? language === 'en'
                  ? 'Hide History'
                  : 'इतिहास छिपाएं'
                : t('viewHistory')}
            </span>
          </button>
        </div>

        {/* Additional Details */}
        <div className="details-section card">
          <h2>{language === 'en' ? 'Additional Details' : 'अतिरिक्त विवरण'}</h2>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">{t('ongoingWorks')}</span>
              <span className="detail-value">{performance.total_works_ongoing}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">{t('completedWorks')}</span>
              <span className="detail-value">{performance.total_works_completed}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">
                {language === 'en' ? 'Demand Fulfilled' : 'मांग पूर्ति'}
              </span>
              <span className="detail-value">
                {performance.employment_demand_fulfilled_percent}%
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">
                {language === 'en' ? 'Timely Payment' : 'समय पर भुगतान'}
              </span>
              <span className="detail-value">
                {performance.payment_within_15_days_percent}%
              </span>
            </div>
          </div>
          <p className="data-timestamp">
            {language === 'en' ? 'Data Source' : 'डेटा स्रोत'}:{' '}
            {performance.data_source || 'data.gov.in API'} 
            {performance.financial_year && ` (FY ${performance.financial_year})`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DistrictPerformance;
