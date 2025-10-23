import axios from 'axios';
import logger from '../config/logger.js';

/**
 * Direct API Service - Fetches data directly from data.gov.in API
 * No database, no caching, pure real-time data
 */
class DirectApiService {
  constructor() {
    this.baseUrl = 'https://api.data.gov.in/resource/ee03643a-ee4c-48c2-ac30-9f2ff26ab722';
    this.apiKey = '579b464db66ec23bdd0000018181f33c85ab4f67523535494f7c8783';
  }

  /**
   * Fetch all unique states from API
   */
  async getStates() {
    try {
      logger.info('Fetching states from data.gov.in API');
      
      const response = await axios.get(this.baseUrl, {
        params: {
          'api-key': this.apiKey,
          format: 'json',
          limit: 1000,
        },
        timeout: 30000,
      });

      if (!response.data?.records) {
        return [];
      }

      // Extract unique states
      const statesMap = new Map();
      response.data.records.forEach(record => {
        if (record.state_name && record.state_code) {
          statesMap.set(record.state_code, {
            state_code: record.state_code,
            state_name: record.state_name,
          });
        }
      });

      const states = Array.from(statesMap.values());
      logger.info(`Found ${states.length} states`);
      return states;
    } catch (error) {
      logger.error('Error fetching states:', error.message);
      throw error;
    }
  }

  /**
   * Fetch districts for a specific state
   */
  async getDistrictsByState(stateName) {
    try {
      logger.info(`Fetching districts for state: ${stateName}`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          'api-key': this.apiKey,
          format: 'json',
          'filters[state_name]': stateName,
          limit: 1000,
        },
        timeout: 30000,
      });

      if (!response.data?.records) {
        return [];
      }

      // Extract unique districts
      const districtsMap = new Map();
      response.data.records.forEach(record => {
        if (record.district_name && record.district_code) {
          districtsMap.set(record.district_code, {
            district_code: record.district_code,
            district_name: record.district_name,
            state_name: record.state_name,
            state_code: record.state_code,
          });
        }
      });

      const districts = Array.from(districtsMap.values());
      logger.info(`Found ${districts.length} districts for ${stateName}`);
      return districts;
    } catch (error) {
      logger.error(`Error fetching districts for ${stateName}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch performance data for a district
   */
  async getDistrictPerformance(districtName, stateName, financialYear = '2024-2025') {
    try {
      logger.info(`Fetching performance for district: ${districtName}, state: ${stateName}`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          'api-key': this.apiKey,
          format: 'json',
          'filters[state_name]': stateName,
          'filters[district_name]': districtName,
          'filters[fin_year]': financialYear,
          limit: 1,
        },
        timeout: 30000,
      });

      if (!response.data?.records || response.data.records.length === 0) {
        logger.warn(`No data found for ${districtName}, ${stateName}, FY: ${financialYear}`);
        return null;
      }

      const record = response.data.records[0];
      return this.formatPerformanceData(record);
    } catch (error) {
      logger.error(`Error fetching performance for ${districtName}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch performance history for a district
   */
  async getDistrictPerformanceHistory(districtName, stateName, financialYear = '2024-2025', limit = 12) {
    try {
      logger.info(`Fetching performance history for district: ${districtName}, state: ${stateName}, FY: ${financialYear}`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          'api-key': this.apiKey,
          format: 'json',
          'filters[state_name]': stateName,
          'filters[district_name]': districtName,
          'filters[fin_year]': financialYear,
          limit: limit,
        },
        timeout: 30000,
      });

      if (!response.data?.records || response.data.records.length === 0) {
        logger.warn(`No history found for ${districtName}, ${stateName}, FY: ${financialYear}`);
        return [];
      }

      return response.data.records.map(record => this.formatPerformanceData(record));
    } catch (error) {
      logger.error(`Error fetching performance history for ${districtName}:`, error.message);
      throw error;
    }
  }

  /**
   * Format raw API data to frontend-friendly format
   */
  formatPerformanceData(record) {
    const parse = (val) => {
      const num = parseFloat(val);
      return isNaN(num) ? 0 : num;
    };

    return {
      // District info
      district_name: record.district_name,
      district_code: record.district_code,
      state_name: record.state_name,
      state_code: record.state_code,
      
      // Time period
      financial_year: record.fin_year,
      month: record.month,
      
      // Job cards & workers
      total_job_cards_issued: parse(record.Total_No_of_JobCards_issued),
      active_job_cards: parse(record.Total_No_of_Active_Job_Cards),
      total_workers: parse(record.Total_No_of_Workers),
      active_workers: parse(record.Total_No_of_Active_Workers),
      total_individuals_worked: parse(record.Total_Individuals_Worked),
      
      // Work metrics
      person_days_generated: parse(record.Persondays_of_Central_Liability_so_far),
      households_employed: parse(record.Total_Households_Worked),
      average_days_per_household: parse(record.Average_days_of_employment_provided_per_Household),
      households_completed_100_days: parse(record.Total_No_of_HHs_completed_100_Days_of_Wage_Employment),
      
      // Demographic breakdown
      women_persondays: parse(record.Women_Persondays),
      women_workers: Math.round(parse(record.Women_Persondays) / 50), // Estimate
      sc_workers: parse(record.SC_workers_against_active_workers),
      sc_persondays: parse(record.SC_persondays),
      st_workers: parse(record.ST_workers_against_active_workers),
      st_persondays: parse(record.ST_persondays),
      differently_abled_persons_worked: parse(record.Differently_abled_persons_worked),
      
      // Financial data
      total_expenditure: parse(record.Total_Exp),
      wage_expenditure: parse(record.Wages),
      material_expenditure: parse(record.Material_and_skilled_Wages),
      admin_expenditure: parse(record.Total_Adm_Expenditure),
      average_wage_per_day: parse(record.Average_Wage_rate_per_day_per_person),
      
      // Works
      total_works_takenup: parse(record.Total_No_of_Works_Takenup),
      total_works_ongoing: parse(record.Number_of_Ongoing_Works),
      total_works_completed: parse(record.Number_of_Completed_Works),
      
      // Performance indicators
      approved_labour_budget: parse(record.Approved_Labour_Budget),
      payment_within_15_days_percent: parse(record.percentage_payments_gererated_within_15_days),
      employment_demand_fulfilled_percent: this.calculateDemandFulfilled(record),
      
      // Additional metrics
      percent_category_b_works: parse(record.percent_of_Category_B_Works),
      percent_nrm_expenditure: parse(record.percent_of_NRM_Expenditure),
      percent_agriculture_expenditure: parse(record.percent_of_Expenditure_on_Agriculture_Allied_Works),
      number_of_gps_with_nil_exp: parse(record.Number_of_GPs_with_NIL_exp),
      
      // Meta
      data_source: 'data.gov.in',
      remarks: record.Remarks || '',
    };
  }

  /**
   * Calculate employment demand fulfilled percentage
   */
  calculateDemandFulfilled(record) {
    const activeWorkers = parseFloat(record.Total_No_of_Active_Workers) || 0;
    const totalWorkers = parseFloat(record.Total_No_of_Workers) || 0;
    
    if (totalWorkers > 0) {
      return Math.round((activeWorkers / totalWorkers) * 100);
    }
    return 85; // Default
  }

  /**
   * Calculate performance indicators
   */
  calculateIndicators(performance) {
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
    };
  }
}

export default new DirectApiService();
