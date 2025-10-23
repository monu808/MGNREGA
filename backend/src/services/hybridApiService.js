import axios from 'axios';
import dotenv from 'dotenv';
import pool from '../config/database.js';
import logger from '../config/logger.js';

dotenv.config();

class HybridApiService {
  constructor() {
    this.baseUrl = process.env.DATA_GOV_API_URL;
    this.apiKey = process.env.DATA_GOV_API_KEY;
    this.cacheEnabled = process.env.ENABLE_DB_CACHE === 'true';
    this.cacheExpiryHours = parseInt(process.env.CACHE_EXPIRY_HOURS) || 6;
  }

  /**
   * Get states from cache or API
   */
  async getStates() {
    try {
      // Try cache first
      if (this.cacheEnabled) {
        const cached = await this.getStatesFromCache();
        if (cached && cached.length > 0) {
          logger.info('States fetched from database cache');
          return cached;
        }
      }

      // Fetch from API
      logger.info('Fetching states from API');
      const response = await axios.get(this.baseUrl, {
        params: {
          'api-key': this.apiKey,
          format: 'json',
          limit: 1000,
        },
        timeout: 30000,
      });

      if (!response.data?.records) {
        throw new Error('No data received from API');
      }

      // Extract unique states
      const statesMap = new Map();
      response.data.records.forEach(record => {
        if (record.state_name && record.state_code) {
          statesMap.set(record.state_code, {
            state_name: record.state_name,
            state_code: record.state_code,
          });
        }
      });

      const states = Array.from(statesMap.values());

      // Cache in database
      if (this.cacheEnabled) {
        await this.cacheStates(states);
      }

      return states;
    } catch (error) {
      logger.error('Error fetching states:', error.message);
      throw error;
    }
  }

  /**
   * Get districts by state from cache or API
   */
  async getDistrictsByState(stateName) {
    try {
      // Try cache first
      if (this.cacheEnabled) {
        const cached = await this.getDistrictsFromCache(stateName);
        if (cached && cached.length > 0) {
          logger.info(`Districts for ${stateName} fetched from database cache`);
          return cached;
        }
      }

      // Fetch from API
      logger.info(`Fetching districts for ${stateName} from API`);
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
        throw new Error('No data received from API');
      }

      // Extract unique districts
      const districtsMap = new Map();
      response.data.records.forEach(record => {
        if (record.district_name && record.district_code) {
          districtsMap.set(record.district_code, {
            district_name: record.district_name,
            district_code: record.district_code,
            state_name: record.state_name,
            state_code: record.state_code,
          });
        }
      });

      const districts = Array.from(districtsMap.values());

      // Cache in database
      if (this.cacheEnabled) {
        await this.cacheDistricts(districts, stateName);
      }

      return districts;
    } catch (error) {
      logger.error(`Error fetching districts for ${stateName}:`, error.message);
      throw error;
    }
  }

  /**
   * Get district performance - always fetch fresh from API
   */
  async getDistrictPerformance(districtName, stateName, financialYear = '2024-2025') {
    try {
      logger.info(`Fetching performance for ${districtName}, ${stateName}, FY: ${financialYear} from API`);
      
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
        logger.warn(`No performance data found for ${districtName}, ${stateName}`);
        return null;
      }

      const performance = this.formatPerformanceData(response.data.records[0]);

      // Optionally cache performance data
      if (this.cacheEnabled) {
        await this.cachePerformance(performance);
      }

      return performance;
    } catch (error) {
      logger.error(`Error fetching performance for ${districtName}:`, error.message);
      throw error;
    }
  }

  /**
   * Get district performance history - always fetch fresh from API
   */
  async getDistrictPerformanceHistory(districtName, stateName, financialYear = '2024-2025', limit = 12) {
    try {
      logger.info(`Fetching performance history for ${districtName}, ${stateName}`);
      
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

  // Database Cache Methods

  async getStatesFromCache() {
    try {
      const result = await pool.query(
        `SELECT DISTINCT state_name, state_code 
         FROM states 
         WHERE updated_at > NOW() - INTERVAL '${this.cacheExpiryHours} hours'
         ORDER BY state_name`
      );
      return result.rows;
    } catch (error) {
      logger.warn('Error fetching states from cache:', error.message);
      return null;
    }
  }

  async cacheStates(states) {
    try {
      for (const state of states) {
        await pool.query(
          `INSERT INTO states (state_name, state_code, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (state_code) 
           DO UPDATE SET state_name = $1, updated_at = NOW()`,
          [state.state_name, state.state_code]
        );
      }
      logger.info(`Cached ${states.length} states in database`);
    } catch (error) {
      logger.warn('Error caching states:', error.message);
    }
  }

  async getDistrictsFromCache(stateName) {
    try {
      const result = await pool.query(
        `SELECT district_name, district_code, state_name, state_code
         FROM districts 
         WHERE state_name = $1 
         AND updated_at > NOW() - INTERVAL '${this.cacheExpiryHours} hours'
         ORDER BY district_name`,
        [stateName]
      );
      return result.rows;
    } catch (error) {
      logger.warn('Error fetching districts from cache:', error.message);
      return null;
    }
  }

  async cacheDistricts(districts, stateName) {
    try {
      for (const district of districts) {
        await pool.query(
          `INSERT INTO districts (district_name, district_code, state_name, state_code, updated_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (district_code) 
           DO UPDATE SET district_name = $1, state_name = $3, state_code = $4, updated_at = NOW()`,
          [district.district_name, district.district_code, district.state_name, district.state_code]
        );
      }
      logger.info(`Cached ${districts.length} districts for ${stateName} in database`);
    } catch (error) {
      logger.warn('Error caching districts:', error.message);
    }
  }

  async cachePerformance(performance) {
    try {
      await pool.query(
        `INSERT INTO performance (
          district_name, district_code, state_name, state_code,
          financial_year, month, data, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (district_code, financial_year, month)
         DO UPDATE SET data = $7, updated_at = NOW()`,
        [
          performance.district_name,
          performance.district_code,
          performance.state_name,
          performance.state_code,
          performance.financial_year,
          performance.month,
          JSON.stringify(performance)
        ]
      );
    } catch (error) {
      logger.warn('Error caching performance data:', error.message);
    }
  }

  // Format performance data
  formatPerformanceData(record) {
    const parse = (val) => {
      const num = parseFloat(val);
      return isNaN(num) ? 0 : num;
    };

    return {
      district_name: record.district_name,
      district_code: record.district_code,
      state_name: record.state_name,
      state_code: record.state_code,
      financial_year: record.fin_year,
      month: record.month,
      total_job_cards_issued: parse(record.Total_No_of_JobCards_issued),
      active_job_cards: parse(record.Total_No_of_Active_Job_Cards),
      total_workers: parse(record.Total_No_of_Workers),
      active_workers: parse(record.Total_No_of_Active_Workers),
      total_individuals_worked: parse(record.Total_Individuals_Worked),
      person_days_generated: parse(record.Persondays_of_Central_Liability_so_far),
      households_employed: parse(record.Total_Households_Worked),
      average_days_per_household: parse(record.Average_days_of_employment_provided_per_Household),
      households_completed_100_days: parse(record.Total_No_of_HHs_completed_100_Days_of_Wage_Employment),
      women_persondays: parse(record.Women_Persondays),
      women_workers: Math.round(parse(record.Women_Persondays) / 50),
      sc_workers: parse(record.SC_workers_against_active_workers),
      sc_persondays: parse(record.SC_persondays),
      st_workers: parse(record.ST_workers_against_active_workers),
      st_persondays: parse(record.ST_persondays),
      differently_abled_persons_worked: parse(record.Differently_abled_persons_worked),
      total_expenditure: parse(record.Total_Exp),
      wage_expenditure: parse(record.Wages),
      material_expenditure: parse(record.Material_and_skilled_Wages),
      admin_expenditure: parse(record.Total_Adm_Expenditure),
      average_wage_per_day: parse(record.Average_Wage_rate_per_day_per_person),
      total_works_takenup: parse(record.Total_No_of_Works_Takenup),
      total_works_ongoing: parse(record.Number_of_Ongoing_Works),
      total_works_completed: parse(record.Number_of_Completed_Works),
      approved_labour_budget: parse(record.Approved_Labour_Budget),
      payment_within_15_days_percent: parse(record.percentage_payments_gererated_within_15_days),
      employment_demand_fulfilled_percent: this.calculateDemandFulfilled(record),
      percent_category_b_works: parse(record.percent_of_Category_B_Works),
      percent_nrm_expenditure: parse(record.percent_of_NRM_Expenditure),
      percent_agriculture_expenditure: parse(record.percent_of_Expenditure_on_Agriculture_Allied_Works),
      number_of_gps_with_nil_exp: parse(record.Number_of_GPs_with_NIL_exp),
      data_source: 'data.gov.in',
      remarks: record.Remarks || '',
    };
  }

  calculateDemandFulfilled(record) {
    const activeWorkers = parseFloat(record.Total_No_of_Active_Workers) || 0;
    const individualsWorked = parseFloat(record.Total_Individuals_Worked) || 0;
    
    if (activeWorkers === 0) return 0;
    return Math.min(100, Math.round((individualsWorked / activeWorkers) * 100));
  }
}

export default new HybridApiService();
