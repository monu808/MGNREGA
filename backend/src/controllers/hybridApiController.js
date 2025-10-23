import hybridApiService from '../services/hybridApiService.js';
import logger from '../config/logger.js';

/**
 * Get all unique states (from cache or API)
 */
export const getStates = async (req, res) => {
  try {
    const states = await hybridApiService.getStates();
    
    res.json({
      success: true,
      count: states.length,
      data: states,
      source: 'hybrid',
    });
  } catch (error) {
    logger.error('Error in getStates controller:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch states',
      message: error.message,
    });
  }
};

/**
 * Get all districts for a state (from cache or API)
 */
export const getDistrictsByState = async (req, res) => {
  try {
    const { stateName } = req.params;

    if (!stateName) {
      return res.status(400).json({
        success: false,
        error: 'State name is required',
      });
    }

    const districts = await hybridApiService.getDistrictsByState(stateName);

    res.json({
      success: true,
      count: districts.length,
      state: stateName,
      data: districts,
      source: 'hybrid',
    });
  } catch (error) {
    logger.error('Error in getDistrictsByState controller:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch districts',
      message: error.message,
    });
  }
};

/**
 * Get latest performance data for a district (always from API)
 */
export const getDistrictPerformance = async (req, res) => {
  try {
    const { districtName } = req.params;
    const { state, fy } = req.query;
    const financialYear = fy || '2024-2025';

    if (!districtName || !state) {
      return res.status(400).json({
        success: false,
        error: 'District name and state are required',
      });
    }

    const performance = await hybridApiService.getDistrictPerformance(
      districtName, 
      state, 
      financialYear
    );

    if (!performance) {
      return res.status(404).json({
        success: false,
        error: 'No performance data found for this district',
      });
    }

    // Calculate additional indicators
    const indicators = calculateIndicators(performance);

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
      source: 'hybrid',
    });
  } catch (error) {
    logger.error('Error in getDistrictPerformance controller:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch district performance',
      message: error.message,
    });
  }
};

/**
 * Get performance history for a district (always from API)
 */
export const getDistrictPerformanceHistory = async (req, res) => {
  try {
    const { districtName } = req.params;
    const { state, fy, limit } = req.query;
    const financialYear = fy || '2024-2025';
    const maxLimit = parseInt(limit) || 12;

    if (!districtName || !state) {
      return res.status(400).json({
        success: false,
        error: 'District name and state are required',
      });
    }

    const history = await hybridApiService.getDistrictPerformanceHistory(
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
          indicators: calculateIndicators(record),
        })),
      },
      source: 'hybrid',
      count: history.length,
    });
  } catch (error) {
    logger.error('Error in getDistrictPerformanceHistory controller:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance history',
      message: error.message,
    });
  }
};

/**
 * Calculate performance indicators
 */
function calculateIndicators(performance) {
  const avgDays = performance.average_days_per_household || 0;
  const demandFulfilled = performance.employment_demand_fulfilled_percent || 0;
  const paymentTimeliness = performance.payment_within_15_days_percent || 0;

  // Calculate overall score
  let score = 0;
  let factors = 0;

  if (avgDays > 0) {
    score += Math.min((avgDays / 100) * 100, 100);
    factors++;
  }

  if (demandFulfilled > 0) {
    score += demandFulfilled;
    factors++;
  }

  if (paymentTimeliness > 0) {
    score += paymentTimeliness;
    factors++;
  }

  const overallScore = factors > 0 ? Math.round(score / factors) : 0;

  // Determine performance level
  let level, color, icon;
  if (overallScore >= 75) {
    level = 'Excellent';
    color = '#4CAF50';
    icon = '✅';
  } else if (overallScore >= 50) {
    level = 'Good';
    color = '#8BC34A';
    icon = '👍';
  } else if (overallScore >= 30) {
    level = 'Average';
    color = '#FFC107';
    icon = '⚠️';
  } else {
    level = 'Needs Improvement';
    color = '#F44336';
    icon = '❌';
  }

  return {
    overall_score: overallScore,
    performance_level: level,
    performance_color: color,
    performance_icon: icon,
    employment_rating: avgDays >= 80 ? 'High' : avgDays >= 50 ? 'Medium' : 'Low',
    demand_fulfillment_rating: demandFulfilled >= 80 ? 'Excellent' : demandFulfilled >= 60 ? 'Good' : 'Poor',
    payment_timeliness_rating: paymentTimeliness >= 80 ? 'Excellent' : paymentTimeliness >= 60 ? 'Good' : 'Poor',
    employment_rate: calculateEmploymentRate(performance),
    budget_utilization: calculateBudgetUtilization(performance),
    women_participation: calculateWomenParticipation(performance),
    payment_efficiency: performance.payment_within_15_days_percent || 0,
    work_completion_rate: calculateWorkCompletionRate(performance),
  };
}

function calculateEmploymentRate(perf) {
  if (!perf.active_workers || perf.active_workers === 0) return 0;
  return Math.round((perf.total_individuals_worked / perf.active_workers) * 100);
}

function calculateBudgetUtilization(perf) {
  if (!perf.approved_labour_budget || perf.approved_labour_budget === 0) return 0;
  return Math.min(100, Math.round((perf.person_days_generated / perf.approved_labour_budget) * 100));
}

function calculateWomenParticipation(perf) {
  if (!perf.person_days_generated || perf.person_days_generated === 0) return 0;
  return Math.round((perf.women_persondays / perf.person_days_generated) * 100);
}

function calculateWorkCompletionRate(perf) {
  if (!perf.total_works_takenup || perf.total_works_takenup === 0) return 0;
  return Math.round((perf.total_works_completed / perf.total_works_takenup) * 100);
}
