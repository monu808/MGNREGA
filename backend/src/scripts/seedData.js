import { syncDataFromAPI } from '../services/syncService.js';
import logger from '../config/logger.js';

async function seedDatabase() {
  try {
    logger.info('Starting database seeding with real API data...');
    logger.info('This will fetch data from data.gov.in API');
    
    const result = await syncDataFromAPI();
    
    if (result.success) {
      logger.info(`Database seeded successfully with ${result.recordsSynced} records from real API`);
      process.exit(0);
    } else {
      logger.error('Database seeding failed:', result.error);
      logger.info('If API data is unavailable, check your API key and internet connection');
      process.exit(1);
    }
  } catch (error) {
    logger.error('Database seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
