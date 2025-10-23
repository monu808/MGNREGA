import axios from 'axios';
import logger from '../config/logger.js';

/**
 * Service to fetch data directly from data.gov.in API
 * No database caching - real-time data fetching
 */
class ApiService {
  constructor() {
    this.apiUrl = 'https://api.data.gov.in/resource/ee03643a-ee4c-48c2-ac30-9f2ff26ab722';
    this.apiKey = process.env.DATA_GOV_API_KEY || '579b464db66ec23bdd0000018181f33c85ab4f67523535494f7c8783';
  }

  /**
   * Fetch all available states from the API
   */
  async fetchStates() {
    try {
      const response = await axios.get(this.apiUrl, {
        params: {
          'api-key': this.apiKey,
          format: 'json',
          limit: 1000,
          offset: 0,
        },
        timeout: 15000,
      });

      if (!response.data || !response.data.records) {
        logger.warn('No records found in API response');
        return [];
      }

      // Extract unique states from the records
      const statesMap = new Map();
      response.data.records.forEach((record) => {
        if (record.state_name && record.state_code) {
          if (!statesMap.has(record.state_code)) {
            statesMap.set(record.state_code, {
              id: parseInt(record.state_code),
              state_code: record.state_code,
              state_name: record.state_name,
            });
          }
        }
      });

      return Array.from(statesMap.values());
    } catch (error) {
      logger.error('Error fetching states from API:', error);
      throw error;
    }
  }

  /**
   * Fetch districts for a specific state
   */
  async fetchDistrictsByState(stateName) {
    try {
      const response = await axios.get(this.apiUrl, {
        params: {
          'api-key': this.apiKey,
          format: 'json',
          limit: 1000,
          offset: 0,
          'filters[state_name]': stateName,
        },
        timeout: 15000,
      });

      if (!response.data || !response.data.records) {
        logger.warn(`No records found for state: ${stateName}`);
        return [];
      }

      // Extract unique districts
      const districtsMap = new Map();
      response.data.records.forEach((record) => {
        if (record.district_name && record.district_code) {
          if (!districtsMap.has(record.district_code)) {
            districtsMap.set(record.district_code, {
              id: parseInt(record.district_code),
              district_code: record.district_code,
              district_name: record.district_name,
              state_name: record.state_name,
              state_code: record.state_code,
            });
          }
        }
      });

      return Array.from(districtsMap.values());
    } catch (error) {
      logger.error(`Error fetching districts for state ${stateName}:`, error);
      throw error;
    }
  }

  /**
   * Fetch performance data for a specific district
   */
  async fetchDistrictPerformance(districtName, stateName, financialYear = '2024-2025') {
    try {
      const response = await axios.get(this.apiUrl, {
        params: {
          'api-key': this.apiKey,
          format: 'json',
          limit: 100,
          offset: 0,
          'filters[state_name]': stateName,
          'filters[district_name]': districtName,
          'filters[fin_year]': financialYear,
        },
        timeout: 15000,
      });

      if (!response.data || !response.data.records || response.data.records.length === 0) {
        logger.warn(`No data found for district ${districtName}, state ${stateName}, FY ${financialYear}`);
        return null;
      }

      // Return the most recent record (first one)
      const record = response.data.records[0];
      return this.parsePerformanceData(record);
    } catch (error) {
      logger.error(`Error fetching performance for district ${districtName}:`, error);
      throw error;
    }
  }

  /**
   * Fetch performance history for a district
   */
  async fetchDistrictPerformanceHistory(districtName, stateName, financialYear = null, limit = 12) {
    try {
      const params = {
        'api-key': this.apiKey,
        format: 'json',
        limit: limit,
        offset: 0,
        'filters[state_name]': stateName,
        'filters[district_name]': districtName,
      };

      if (financialYear) {
        params['filters[fin_year]'] = financialYear;
      }

      const response = await axios.get(this.apiUrl, {
        params,
        timeout: 15000,
      });

      if (!response.data || !response.data.records) {
        logger.warn(`No history found for district ${districtName}`);
        return [];
      }

      return response.data.records.map((record) => this.parsePerformanceData(record));
    } catch (error) {
      logger.error(`Error fetching performance history for ${districtName}:`, error);
      throw error;
    }
  }

  /**
   * Search districts by name
   */
  async searchDistricts(searchQuery) {
    try {
      // Fetch all records (limited) and filter client-side
      const response = await axios.get(this.apiUrl, {
        params: {
          'api-key': this.apiKey,
          format: 'json',
          limit: 1000,
          offset: 0,
        },
        timeout: 15000,
      });

      if (!response.data || !response.data.records) {
        return [];
      }

      const searchLower = searchQuery.toLowerCase();
      const districtsMap = new Map();

      response.data.records.forEach((record) => {
        if (record.district_name && record.district_code) {
          const districtNameLower = record.district_name.toLowerCase();
          if (districtNameLower.includes(searchLower)) {
            if (!districtsMap.has(record.district_code)) {
              districtsMap.set(record.district_code, {
                id: parseInt(record.district_code),
                district_code: record.district_code,
                district_name: record.district_name,
                state_name: record.state_name,
                state_code: record.state_code,
              });
            }
          }
        }
      });

      return Array.from(districtsMap.values());
    } catch (error) {
      logger.error('Error searching districts:', error);
      throw error;
    }
  }

  /**
   * Parse API response to performance data format
   */
  parsePerformanceData(apiData) {
    return {
      financial_year: apiData.fin_year || 'N/A',
      month: apiData.month || 'N/A',
      district_name: apiData.district_name,
      state_name: apiData.state_name,
      district_code: apiData.district_code,
      state_code: apiData.state_code,
      
      // Employment metrics
      total_job_cards_issued: this.parseNumber(apiData.Total_No_of_JobCards_issued),
      active_job_cards: this.parseNumber(apiData.Total_No_of_Active_Job_Cards),
      total_workers: this.parseNumber(apiData.Total_No_of_Workers),
      active_workers: this.parseNumber(apiData.Total_No_of_Active_Workers),
      total_individuals_worked: this.parseNumber(apiData.Total_Individuals_Worked),
      
      // Person days and households
      person_days_generated: this.parseNumber(apiData.Persondays_of_Central_Liability_so_far),
      households_employed: this.parseNumber(apiData.Total_Households_Worked),
      average_days_per_household: this.parseNumber(apiData.Average_days_of_employment_provided_per_Household),
      households_completed_100_days: this.parseNumber(apiData.Total_No_of_HHs_completed_100_Days_of_Wage_Employment),
      
      // Demographic data
      women_persondays: this.parseNumber(apiData.Women_Persondays),
      women_workers: Math.round(this.parseNumber(apiData.Women_Persondays) / 50), // Estimate: persondays / 50 days
      sc_workers: this.parseNumber(apiData.SC_workers_against_active_workers),
      sc_persondays: this.parseNumber(apiData.SC_persondays),
      st_workers: this.parseNumber(apiData.ST_workers_against_active_workers),
      st_persondays: this.parseNumber(apiData.ST_persondays),
      differently_abled_persons_worked: this.parseNumber(apiData.Differently_abled_persons_worked),
      
      // Financial data
      total_expenditure: this.parseNumber(apiData.Total_Exp),
      wage_expenditure: this.parseNumber(apiData.Wages),
      material_expenditure: this.parseNumber(apiData.Material_and_skilled_Wages),
      admin_expenditure: this.parseNumber(apiData.Total_Adm_Expenditure),
      average_wage_per_day: this.parseNumber(apiData.Average_Wage_rate_per_day_per_person),
      
      // Works data
      total_works_takenup: this.parseNumber(apiData.Total_No_of_Works_Takenup),
      total_works_ongoing: this.parseNumber(apiData.Number_of_Ongoing_Works),
      total_works_completed: this.parseNumber(apiData.Number_of_Completed_Works),
      
      // Performance indicators
      approved_labour_budget: this.parseNumber(apiData.Approved_Labour_Budget),
      payment_within_15_days_percent: this.parseNumber(apiData.percentage_payments_gererated_within_15_days),
      percent_category_b_works: this.parseNumber(apiData.percent_of_Category_B_Works),
      percent_nrm_expenditure: this.parseNumber(apiData.percent_of_NRM_Expenditure),
      percent_agriculture_expenditure: this.parseNumber(apiData.percent_of_Expenditure_on_Agriculture_Allied_Works),
      number_of_gps_with_nil_exp: this.parseNumber(apiData.Number_of_GPs_with_NIL_exp),
      
      // Employment demand fulfilled - calculated
      employment_demand_fulfilled_percent: this.calculateDemandFulfilled(apiData),
      
      // Data source
      data_source: 'data.gov.in',
      remarks: apiData.Remarks || '',
    };
  }

  /**
   * Calculate employment demand fulfilled percentage
   */
  calculateDemandFulfilled(apiData) {
    const activeWorkers = this.parseNumber(apiData.Total_No_of_Active_Workers);
    const totalWorkers = this.parseNumber(apiData.Total_No_of_Workers);
    
    if (totalWorkers > 0) {
      return Math.round((activeWorkers / totalWorkers) * 100);
    }
    return 85; // Default estimate
  }

  parseNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
}

const apiService = new ApiService();
export default apiService;
