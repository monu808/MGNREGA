import apiService from '../services/apiService.js';
import cache from '../config/cache.js';
import logger from '../config/logger.js';

class PerformanceController {
  static async getLatestPerformance(req, res) {
    try {
      const { districtId } = req.params;

      const cacheKey = `performance:latest:${districtId}`;
      const cached = cache.get(cacheKey);
      
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          cached: true,
        });
      }

      // Parse districtId to get district name and state
      // Format: districtName or districtCode
      const districtName = districtId;
      const stateName = req.query.state || null;
      const fy = req.query.fy || '2024-2025';

      if (!stateName) {
        return res.status(400).json({
          success: false,
          error: 'State name is required as query parameter',
        });
      }

      const performance = await apiService.fetchDistrictPerformance(districtName, stateName, fy);
      
      if (!performance) {
        return res.status(404).json({
          success: false,
          error: 'No performance data available for this district',
        });
      }

      const result = {
        district: {
          district_name: performance.district_name,
          state_name: performance.state_name,
          district_code: performance.district_code,
          state_code: performance.state_code,
        },
        performance,
        indicators: PerformanceController.calculateIndicators(performance),
      };

      cache.set(cacheKey, result, 1800); // 30 minutes cache

      res.json({
        success: true,
        data: result,
        cached: false,
        source: 'data.gov.in API',
      });
    } catch (error) {
      logger.error('Error fetching performance:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch performance data from API',
      });
    }
  }

  static async getPerformanceHistory(req, res) {
    try {
  const { districtId } = req.params;
  const { limit, state, fy } = req.query;

  const financialYear = fy || '2024-2025';

  const cacheKey = `performance:history:${districtId}:${financialYear}:${limit || 12}`;
      const cached = cache.get(cacheKey);
      
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          cached: true,
        });
      }

      const districtName = districtId;
      const stateName = state || null;

      if (!stateName) {
        return res.status(400).json({
          success: false,
          error: 'State name is required as query parameter',
        });
      }

      const history = await apiService.fetchDistrictPerformanceHistory(
        districtName,
        stateName,
        financialYear,
        parseInt(limit) || 12
      );

      const result = {
        district: history.length > 0 ? {
          district_name: history[0].district_name,
          state_name: history[0].state_name,
          district_code: history[0].district_code,
          state_code: history[0].state_code,
        } : null,
        history: history.map(record => ({
          ...record,
          indicators: PerformanceController.calculateIndicators(record),
        })),
      };

      cache.set(cacheKey, result, 1800);

      res.json({
        success: true,
        data: result,
        cached: false,
        source: 'data.gov.in API',
      });
    } catch (error) {
      logger.error('Error fetching performance history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch performance history from API',
      });
    }
  }

  static async compareDistricts(req, res) {
    try {
      const { districtIds, financialYear } = req.query;

      if (!districtIds) {
        return res.status(400).json({
          success: false,
          error: 'District IDs are required',
        });
      }

      const ids = districtIds.split(',').map(id => parseInt(id));
      const year = financialYear || '2024-25';

      const cacheKey = `performance:compare:${ids.join('-')}:${year}`;
      const cached = cache.get(cacheKey);
      
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          cached: true,
        });
      }

      const comparison = await PerformanceModel.getComparisonData(ids, year);

      const result = comparison.map(record => ({
        district_id: record.district_id,
        district_name: record.district_name,
        performance: {
          person_days_generated: record.person_days_generated,
          households_employed: record.households_employed,
          average_days_per_household: record.average_days_per_household,
          average_wage_per_day: record.average_wage_per_day,
          total_expenditure: record.total_expenditure,
        },
        indicators: PerformanceController.calculateIndicators(record),
      }));

      cache.set(cacheKey, result, 3600);

      res.json({
        success: true,
        data: result,
        cached: false,
      });
    } catch (error) {
      logger.error('Error comparing districts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to compare districts',
      });
    }
  }

  static calculateIndicators(performance) {
    if (!performance) return null;

    const {
      average_days_per_household,
      employment_demand_fulfilled_percent,
      payment_within_15_days_percent,
      households_completed_100_days,
      households_employed,
    } = performance;

    // Calculate overall performance score
    let overallScore = 0;
    let factors = 0;

    if (average_days_per_household !== null) {
      overallScore += Math.min(average_days_per_household / 100 * 100, 100);
      factors++;
    }

    if (employment_demand_fulfilled_percent !== null) {
      overallScore += employment_demand_fulfilled_percent;
      factors++;
    }

    if (payment_within_15_days_percent !== null) {
      overallScore += payment_within_15_days_percent;
      factors++;
    }

    const finalScore = factors > 0 ? overallScore / factors : 0;

    // Determine performance level
    let performanceLevel, performanceColor, performanceIcon;
    
    if (finalScore >= 75) {
      performanceLevel = 'Excellent';
      performanceColor = 'green';
      performanceIcon = '✅';
    } else if (finalScore >= 50) {
      performanceLevel = 'Good';
      performanceColor = 'lightgreen';
      performanceIcon = '👍';
    } else if (finalScore >= 30) {
      performanceLevel = 'Average';
      performanceColor = 'yellow';
      performanceIcon = '⚠️';
    } else {
      performanceLevel = 'Needs Improvement';
      performanceColor = 'red';
      performanceIcon = '❌';
    }

    return {
      overall_score: Math.round(finalScore),
      performance_level: performanceLevel,
      performance_color: performanceColor,
      performance_icon: performanceIcon,
      employment_rating: average_days_per_household >= 80 ? 'High' : 
                        average_days_per_household >= 50 ? 'Medium' : 'Low',
      demand_fulfillment_rating: employment_demand_fulfilled_percent >= 80 ? 'Excellent' :
                                employment_demand_fulfilled_percent >= 60 ? 'Good' : 'Poor',
      payment_timeliness_rating: payment_within_15_days_percent >= 80 ? 'Excellent' :
                                payment_within_15_days_percent >= 60 ? 'Good' : 'Poor',
      households_100_days_percent: households_employed > 0 ? 
        Math.round((households_completed_100_days / households_employed) * 100) : 0,
    };
  }
}

export default PerformanceController;
