import directApiService from '../services/directApiService.js';
import logger from '../config/logger.js';

/**
 * Direct API Controllers - No database, pure API calls
 */

export const getStates = async (req, res) => {
  try {
    const states = await directApiService.getStates();
    
    res.json({
      success: true,
      data: states,
      source: 'data.gov.in Real-Time API',
      count: states.length,
    });
  } catch (error) {
    logger.error('Error in getStates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch states from data.gov.in API',
      message: error.message,
    });
  }
};

export const getDistrictsByState = async (req, res) => {
  try {
    const { stateName } = req.params;
    
    if (!stateName) {
      return res.status(400).json({
        success: false,
        error: 'State name is required',
      });
    }

    const districts = await directApiService.getDistrictsByState(stateName);
    
    res.json({
      success: true,
      data: districts,
      source: 'data.gov.in Real-Time API',
      count: districts.length,
      state: stateName,
    });
  } catch (error) {
    logger.error('Error in getDistrictsByState:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch districts from data.gov.in API',
      message: error.message,
    });
  }
};

export const getDistrictPerformance = async (req, res) => {
  try {
    const { districtName } = req.params;
    const { state, fy } = req.query;
    
    if (!districtName || !state) {
      return res.status(400).json({
        success: false,
        error: 'District name and state are required',
      });
    }

    const financialYear = fy || '2024-2025';
    const performance = await directApiService.getDistrictPerformance(districtName, state, financialYear);
    
    if (!performance) {
      return res.status(404).json({
        success: false,
        error: 'No performance data found for this district',
      });
    }

    const indicators = directApiService.calculateIndicators(performance);

    res.json({
      success: true,
      data: {
        district: {
          district_name: performance.district_name,
          district_code: performance.district_code,
          state_name: performance.state_name,
          state_code: performance.state_code,
        },
        performance,
        indicators,
      },
      source: 'data.gov.in Real-Time API',
    });
  } catch (error) {
    logger.error('Error in getDistrictPerformance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch district performance from data.gov.in API',
      message: error.message,
    });
  }
};

export const getDistrictPerformanceHistory = async (req, res) => {
  try {
    const { districtName } = req.params;
    const { state, fy, limit } = req.query;
    
    if (!districtName || !state) {
      return res.status(400).json({
        success: false,
        error: 'District name and state are required',
      });
    }

    const financialYear = fy || '2024-2025';
    const maxLimit = parseInt(limit) || 12;

    const history = await directApiService.getDistrictPerformanceHistory(
      districtName, 
      state, 
      financialYear, 
      maxLimit
    );
    
    res.json({
      success: true,
      data: {
        district: history.length > 0 ? {
          district_name: history[0].district_name,
          district_code: history[0].district_code,
          state_name: history[0].state_name,
          state_code: history[0].state_code,
        } : null,
        history: history.map(record => ({
          ...record,
          indicators: directApiService.calculateIndicators(record),
        })),
      },
      source: 'data.gov.in Real-Time API',
      count: history.length,
    });
  } catch (error) {
    logger.error('Error in getDistrictPerformanceHistory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch district performance history from data.gov.in API',
      message: error.message,
    });
  }
};
