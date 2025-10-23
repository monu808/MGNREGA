import axios from 'axios';
import PerformanceModel from '../models/Performance.js';
import DistrictModel from '../models/District.js';
import pool from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Service to sync data from data.gov.in API
 */
class SyncService {
  constructor() {
    this.apiUrl = process.env.DATA_GOV_API_URL;
    this.apiKey = process.env.DATA_GOV_API_KEY;
  }

  async syncDataFromAPI() {
    const startTime = new Date();
    let recordsSynced = 0;
    let errorMessage = null;

    try {
      logger.info('Starting data sync from data.gov.in API');

      // Log sync start
      const syncLogQuery = `
        INSERT INTO sync_logs (sync_type, status, started_at)
        VALUES ($1, $2, $3)
        RETURNING id
      `;
      const syncLogResult = await pool.query(syncLogQuery, [
        'scheduled',
        'in_progress',
        startTime,
      ]);
      const syncLogId = syncLogResult.rows[0].id;

      // Fetch all districts
      const districts = await DistrictModel.getAll();
      
      // Get current financial year and month
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      // API uses format like "2024-2025"
      // Use 2024-2025 as the most recent available data
      const financialYear = '2024-2025';

      // Fetch data for each district
      for (const district of districts) {
        try {
          const data = await this.fetchDistrictData(district.district_code, financialYear);
          
          if (data) {
            // Parse and save the data
            const performanceData = this.parsePerformanceData(
              data,
              district.id,
              financialYear,
              currentMonth,
              currentYear
            );

            await PerformanceModel.upsert(performanceData);
            recordsSynced++;
            
            logger.info(`Synced data for district: ${district.district_name}`);
          }
        } catch (error) {
          logger.error(`Failed to sync district ${district.district_name}:`, error);
        }

        // Add delay to avoid rate limiting
        await this.delay(500);
      }

      // Update sync log
      const updateLogQuery = `
        UPDATE sync_logs
        SET status = $1, records_synced = $2, completed_at = $3
        WHERE id = $4
      `;
      await pool.query(updateLogQuery, [
        'completed',
        recordsSynced,
        new Date(),
        syncLogId,
      ]);

      logger.info(`Data sync completed successfully. Records synced: ${recordsSynced}`);
      return { success: true, recordsSynced };

    } catch (error) {
      errorMessage = error.message;
      logger.error('Data sync failed:', error);

      // Update sync log with error
      const updateLogQuery = `
        UPDATE sync_logs
        SET status = $1, error_message = $2, completed_at = $3
        WHERE sync_type = $4 AND started_at = $5
      `;
      await pool.query(updateLogQuery, [
        'failed',
        errorMessage,
        new Date(),
        'scheduled',
        startTime,
      ]);

      return { success: false, error: errorMessage };
    }
  }

  async fetchDistrictData(districtCode, financialYear) {
    try {
      // Fetch real data from data.gov.in MGNREGA API
      // Using the correct API endpoint with filters
      const response = await axios.get(this.apiUrl, {
        params: {
          'api-key': this.apiKey,
          format: 'json',
          limit: 100,
          offset: 0,
          'filters[state_name]': 'Uttar Pradesh',
          'filters[fin_year]': financialYear
        },
        timeout: 15000,
      });

      if (!response.data || !response.data.records) {
        logger.warn(`No records found in API response for ${districtCode}`);
        return null;
      }

      // Find the matching district record
      const districtName = districtCode.replace('UP-', '').replace('-', ' ');
      const records = response.data.records.filter(record => {
        if (!record.district_name) return false;
        const apiDistrictName = record.district_name.toLowerCase();
        const searchName = districtName.toLowerCase();
        return apiDistrictName.includes(searchName) || searchName.includes(apiDistrictName);
      });

      if (records.length === 0) {
        logger.warn(`No data found for district ${districtCode} in FY ${financialYear}`);
        return null;
      }

      // Return the first matching record
      return records[0];
    } catch (error) {
      if (error.response?.status === 404) {
        logger.warn(`No data found for district ${districtCode}`);
        return null;
      }
      if (error.response?.status === 429) {
        logger.warn('Rate limit exceeded, retrying after delay...');
        await this.delay(5000);
        return this.fetchDistrictData(districtCode, financialYear);
      }
      throw error;
    }
  }

  parsePerformanceData(apiData, districtId, financialYear, month, year) {
    // Parse the API response from data.gov.in MGNREGA API
    // Using actual field names from the API
    
    return {
      district_id: districtId,
      financial_year: financialYear,
      month,
      year,
      total_job_cards_issued: this.parseNumber(apiData.Total_No_of_JobCards_issued),
      active_job_cards: this.parseNumber(apiData.Total_No_of_Active_Job_Cards),
      total_workers: this.parseNumber(apiData.Total_No_of_Workers),
      active_workers: this.parseNumber(apiData.Total_No_of_Active_Workers),
      women_workers: this.parseNumber(apiData.Women_Persondays) / 100, // Convert to workers estimate
      sc_workers: this.parseNumber(apiData.SC_workers_against_active_workers),
      st_workers: this.parseNumber(apiData.ST_workers_against_active_workers),
      person_days_generated: this.parseNumber(apiData.Persondays_of_Central_Liability_so_far),
      households_employed: this.parseNumber(apiData.Total_Households_Worked),
      average_days_per_household: this.parseNumber(apiData.Average_days_of_employment_provided_per_Household),
      households_completed_100_days: this.parseNumber(apiData.Total_No_of_HHs_completed_100_Days_of_Wage_Employment),
      total_expenditure: this.parseNumber(apiData.Total_Exp),
      wage_expenditure: this.parseNumber(apiData.Wages),
      material_expenditure: this.parseNumber(apiData.Material_and_skilled_Wages),
      average_wage_per_day: this.parseNumber(apiData.Average_Wage_rate_per_day_per_person),
      total_works_ongoing: this.parseNumber(apiData.Number_of_Ongoing_Works),
      total_works_completed: this.parseNumber(apiData.Number_of_Completed_Works),
      employment_demand_fulfilled_percent: 85, // Not available in API
      payment_within_15_days_percent: this.parseNumber(apiData.percentage_payments_gererated_within_15_days),
      data_source: 'data.gov.in',
    };
  }

  parseNumber(value) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateSampleData() {
    /**
     * Generate sample data for testing purposes
     * This should be removed in production and replaced with actual API calls
     */
    logger.info('Generating sample data for testing');

    try {
      const districts = await DistrictModel.getAll();
      const now = new Date();
      const currentYear = now.getFullYear();
      const financialYear = '2024-25';

      for (const district of districts) {
        // Generate data for the last 12 months
        for (let i = 0; i < 12; i++) {
          const month = ((now.getMonth() - i + 12) % 12) + 1;
          const year = month > now.getMonth() + 1 ? currentYear - 1 : currentYear;

          const sampleData = {
            district_id: district.id,
            financial_year: financialYear,
            month,
            year,
            total_job_cards_issued: Math.floor(Math.random() * 50000) + 10000,
            active_job_cards: Math.floor(Math.random() * 30000) + 5000,
            total_workers: Math.floor(Math.random() * 100000) + 20000,
            active_workers: Math.floor(Math.random() * 60000) + 10000,
            women_workers: Math.floor(Math.random() * 30000) + 5000,
            sc_workers: Math.floor(Math.random() * 20000) + 3000,
            st_workers: Math.floor(Math.random() * 15000) + 2000,
            person_days_generated: Math.floor(Math.random() * 500000) + 100000,
            households_employed: Math.floor(Math.random() * 25000) + 5000,
            average_days_per_household: Math.floor(Math.random() * 50) + 30,
            households_completed_100_days: Math.floor(Math.random() * 5000) + 500,
            total_expenditure: Math.floor(Math.random() * 10000000) + 2000000,
            wage_expenditure: Math.floor(Math.random() * 7000000) + 1500000,
            material_expenditure: Math.floor(Math.random() * 3000000) + 500000,
            average_wage_per_day: Math.floor(Math.random() * 100) + 200,
            total_works_ongoing: Math.floor(Math.random() * 500) + 100,
            total_works_completed: Math.floor(Math.random() * 300) + 50,
            employment_demand_fulfilled_percent: Math.floor(Math.random() * 40) + 60,
            payment_within_15_days_percent: Math.floor(Math.random() * 30) + 70,
            data_source: 'sample_data',
          };

          await PerformanceModel.upsert(sampleData);
        }

        logger.info(`Generated sample data for district: ${district.district_name}`);
      }

      logger.info('Sample data generation completed');
      return { success: true };
    } catch (error) {
      logger.error('Failed to generate sample data:', error);
      return { success: false, error: error.message };
    }
  }
}

const syncService = new SyncService();

export const syncDataFromAPI = () => syncService.syncDataFromAPI();
export const generateSampleData = () => syncService.generateSampleData();
export default syncService;
