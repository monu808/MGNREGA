import pool from '../config/database.js';
import logger from '../config/logger.js';

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database tables...');

    // Create states table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS states (
        state_code VARCHAR(10) PRIMARY KEY,
        state_name VARCHAR(255) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ States table created/verified');

    // Create districts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS districts (
        district_code VARCHAR(10) PRIMARY KEY,
        district_name VARCHAR(255) NOT NULL,
        state_name VARCHAR(255) NOT NULL,
        state_code VARCHAR(10) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (state_code) REFERENCES states(state_code) ON DELETE CASCADE
      );
    `);
    console.log('✅ Districts table created/verified');

    // Create performance table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS performance (
        id SERIAL PRIMARY KEY,
        district_code VARCHAR(10) NOT NULL,
        district_name VARCHAR(255) NOT NULL,
        state_code VARCHAR(10) NOT NULL,
        state_name VARCHAR(255) NOT NULL,
        financial_year VARCHAR(20) NOT NULL,
        month VARCHAR(20) NOT NULL,
        data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(district_code, financial_year, month)
      );
    `);
    console.log('✅ Performance table created/verified');

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_districts_state_name ON districts(state_name);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_performance_district ON performance(district_code, financial_year);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_performance_updated ON performance(updated_at);
    `);

    console.log('✅ Indexes created/verified');

    // Create cleanup function for old cache
    await pool.query(`
      CREATE OR REPLACE FUNCTION cleanup_old_cache()
      RETURNS void AS $$
      BEGIN
        DELETE FROM performance WHERE updated_at < NOW() - INTERVAL '7 days';
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Cleanup function created');

    console.log('🎉 Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
