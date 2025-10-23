-- MGNREGA Database Schema
-- PostgreSQL 15+

-- Create database
CREATE DATABASE IF NOT EXISTS mgnrega_db;

\c mgnrega_db;

-- States table
CREATE TABLE IF NOT EXISTS states (
    id SERIAL PRIMARY KEY,
    state_code VARCHAR(10) UNIQUE NOT NULL,
    state_name VARCHAR(255) NOT NULL,
    state_name_hindi VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Districts table
CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    state_id INTEGER REFERENCES states(id) ON DELETE CASCADE,
    district_code VARCHAR(20) UNIQUE NOT NULL,
    district_name VARCHAR(255) NOT NULL,
    district_name_hindi VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance data table
CREATE TABLE IF NOT EXISTS district_performance (
    id SERIAL PRIMARY KEY,
    district_id INTEGER REFERENCES districts(id) ON DELETE CASCADE,
    financial_year VARCHAR(20) NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    
    -- Job Cards
    total_job_cards_issued BIGINT DEFAULT 0,
    active_job_cards BIGINT DEFAULT 0,
    
    -- Workers
    total_workers BIGINT DEFAULT 0,
    active_workers BIGINT DEFAULT 0,
    women_workers BIGINT DEFAULT 0,
    sc_workers BIGINT DEFAULT 0,
    st_workers BIGINT DEFAULT 0,
    
    -- Employment
    person_days_generated BIGINT DEFAULT 0,
    households_employed BIGINT DEFAULT 0,
    average_days_per_household DECIMAL(10, 2) DEFAULT 0,
    households_completed_100_days INTEGER DEFAULT 0,
    
    -- Financial
    total_expenditure DECIMAL(15, 2) DEFAULT 0,
    wage_expenditure DECIMAL(15, 2) DEFAULT 0,
    material_expenditure DECIMAL(15, 2) DEFAULT 0,
    average_wage_per_day DECIMAL(10, 2) DEFAULT 0,
    
    -- Works
    total_works_ongoing INTEGER DEFAULT 0,
    total_works_completed INTEGER DEFAULT 0,
    
    -- Performance Indicators
    employment_demand_fulfilled_percent DECIMAL(5, 2) DEFAULT 0,
    payment_within_15_days_percent DECIMAL(5, 2) DEFAULT 0,
    
    -- Metadata
    data_source VARCHAR(50) DEFAULT 'data.gov.in',
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(district_id, financial_year, month, year)
);

-- API sync log
CREATE TABLE IF NOT EXISTS sync_logs (
    id SERIAL PRIMARY KEY,
    sync_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    records_synced INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions (for analytics)
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    district_id INTEGER REFERENCES districts(id),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    user_agent TEXT,
    language VARCHAR(10) DEFAULT 'en',
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_districts_state ON districts(state_id);
CREATE INDEX idx_districts_location ON districts(latitude, longitude);
CREATE INDEX idx_performance_district ON district_performance(district_id);
CREATE INDEX idx_performance_date ON district_performance(financial_year, month, year);
CREATE INDEX idx_performance_lookup ON district_performance(district_id, financial_year);
CREATE INDEX idx_sync_logs_date ON sync_logs(created_at);
CREATE INDEX idx_user_sessions_district ON user_sessions(district_id);

-- Insert Uttar Pradesh state
INSERT INTO states (state_code, state_name, state_name_hindi) 
VALUES ('UP', 'Uttar Pradesh', 'उत्तर प्रदेश')
ON CONFLICT (state_code) DO NOTHING;

-- Insert sample districts for Uttar Pradesh
INSERT INTO districts (state_id, district_code, district_name, district_name_hindi, latitude, longitude) 
VALUES 
    ((SELECT id FROM states WHERE state_code = 'UP'), 'UP-AGR', 'Agra', 'आगरा', 27.1767, 78.0081),
    ((SELECT id FROM states WHERE state_code = 'UP'), 'UP-ALL', 'Allahabad', 'इलाहाबाद', 25.4358, 81.8463),
    ((SELECT id FROM states WHERE state_code = 'UP'), 'UP-LKO', 'Lucknow', 'लखनऊ', 26.8467, 80.9462),
    ((SELECT id FROM states WHERE state_code = 'UP'), 'UP-VNS', 'Varanasi', 'वाराणसी', 25.3176, 82.9739),
    ((SELECT id FROM states WHERE state_code = 'UP'), 'UP-KNP', 'Kanpur', 'कानपुर', 26.4499, 80.3319),
    ((SELECT id FROM states WHERE state_code = 'UP'), 'UP-GZB', 'Ghaziabad', 'गाज़ियाबाद', 28.6692, 77.4538),
    ((SELECT id FROM states WHERE state_code = 'UP'), 'UP-MRT', 'Meerut', 'मेरठ', 28.9845, 77.7064),
    ((SELECT id FROM states WHERE state_code = 'UP'), 'UP-BLY', 'Bareilly', 'बरेली', 28.3670, 79.4304),
    ((SELECT id FROM states WHERE state_code = 'UP'), 'UP-ALG', 'Aligarh', 'अलीगढ़', 27.8974, 78.0880),
    ((SELECT id FROM states WHERE state_code = 'UP'), 'UP-MRD', 'Moradabad', 'मुरादाबाद', 28.8389, 78.7768),
    ((SELECT id FROM states WHERE state_code = 'UP'), 'UP-SHJ', 'Shahjahanpur', 'शाहजहाँपुर', 27.8802, 79.9050),
    ((SELECT id FROM states WHERE state_code = 'UP'), 'UP-RBR', 'Rae Bareli', 'रायबरेली', 26.2307, 81.2506),
    ((SELECT id FROM states WHERE state_code = 'UP'), 'UP-FRD', 'Faridabad', 'फरीदाबाद', 28.4089, 77.3178),
    ((SELECT id FROM states WHERE state_code = 'UP'), 'UP-JNP', 'Jaunpur', 'जौनपुर', 25.7461, 82.6847),
    ((SELECT id FROM states WHERE state_code = 'UP'), 'UP-BDN', 'Budaun', 'बदायूं', 28.0416, 79.1240),
    ((SELECT id FROM states WHERE state_code = 'UP'), 'UP-RMP', 'Rampur', 'रामपुर', 28.8115, 79.0252),
    ((SELECT id FROM states WHERE state_code = 'UP'), 'UP-GZP', 'Ghazipur', 'गाज़ीपुर', 25.5882, 83.5782),
    ((SELECT id FROM states WHERE state_code = 'UP'), 'UP-AZM', 'Azamgarh', 'आज़मगढ़', 26.0673, 83.1849),
    ((SELECT id FROM states WHERE state_code = 'UP'), 'UP-BLP', 'Ballia', 'बलिया', 25.7580, 84.1497),
    ((SELECT id FROM states WHERE state_code = 'UP'), 'UP-MNJ', 'Mainpuri', 'मैनपुरी', 27.2351, 79.0270)
ON CONFLICT (district_code) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_states_updated_at BEFORE UPDATE ON states
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_districts_updated_at BEFORE UPDATE ON districts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_updated_at BEFORE UPDATE ON district_performance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for easy querying
CREATE OR REPLACE VIEW district_latest_performance AS
SELECT 
    d.id as district_id,
    d.district_name,
    d.district_name_hindi,
    s.state_name,
    dp.*
FROM districts d
JOIN states s ON d.state_id = s.id
LEFT JOIN LATERAL (
    SELECT * FROM district_performance
    WHERE district_id = d.id
    ORDER BY year DESC, month DESC
    LIMIT 1
) dp ON TRUE;

-- Grant permissions (adjust as needed for your deployment)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mgnrega_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO mgnrega_user;

COMMENT ON TABLE states IS 'Stores Indian states information';
COMMENT ON TABLE districts IS 'Stores district information with geolocation';
COMMENT ON TABLE district_performance IS 'Stores monthly MGNREGA performance data for each district';
COMMENT ON TABLE sync_logs IS 'Logs API synchronization attempts';
COMMENT ON TABLE user_sessions IS 'Tracks user sessions for analytics';
