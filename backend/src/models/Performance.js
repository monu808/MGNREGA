import pool from '../config/database.js';

class PerformanceModel {
  static async getLatestByDistrict(districtId) {
    const query = `
      SELECT * FROM district_performance
      WHERE district_id = $1
      ORDER BY year DESC, month DESC
      LIMIT 1
    `;
    const result = await pool.query(query, [districtId]);
    return result.rows[0];
  }

  static async getHistoryByDistrict(districtId, limit = 12) {
    const query = `
      SELECT * FROM district_performance
      WHERE district_id = $1
      ORDER BY year DESC, month DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [districtId, limit]);
    return result.rows;
  }

  static async getByDistrictAndPeriod(districtId, financialYear, month, year) {
    const query = `
      SELECT * FROM district_performance
      WHERE district_id = $1 
        AND financial_year = $2 
        AND month = $3 
        AND year = $4
    `;
    const result = await pool.query(query, [districtId, financialYear, month, year]);
    return result.rows[0];
  }

  static async upsert(data) {
    const query = `
      INSERT INTO district_performance (
        district_id, financial_year, month, year,
        total_job_cards_issued, active_job_cards,
        total_workers, active_workers, women_workers, sc_workers, st_workers,
        person_days_generated, households_employed, average_days_per_household,
        households_completed_100_days,
        total_expenditure, wage_expenditure, material_expenditure, average_wage_per_day,
        total_works_ongoing, total_works_completed,
        employment_demand_fulfilled_percent, payment_within_15_days_percent,
        data_source, last_synced_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
      )
      ON CONFLICT (district_id, financial_year, month, year)
      DO UPDATE SET
        total_job_cards_issued = EXCLUDED.total_job_cards_issued,
        active_job_cards = EXCLUDED.active_job_cards,
        total_workers = EXCLUDED.total_workers,
        active_workers = EXCLUDED.active_workers,
        women_workers = EXCLUDED.women_workers,
        sc_workers = EXCLUDED.sc_workers,
        st_workers = EXCLUDED.st_workers,
        person_days_generated = EXCLUDED.person_days_generated,
        households_employed = EXCLUDED.households_employed,
        average_days_per_household = EXCLUDED.average_days_per_household,
        households_completed_100_days = EXCLUDED.households_completed_100_days,
        total_expenditure = EXCLUDED.total_expenditure,
        wage_expenditure = EXCLUDED.wage_expenditure,
        material_expenditure = EXCLUDED.material_expenditure,
        average_wage_per_day = EXCLUDED.average_wage_per_day,
        total_works_ongoing = EXCLUDED.total_works_ongoing,
        total_works_completed = EXCLUDED.total_works_completed,
        employment_demand_fulfilled_percent = EXCLUDED.employment_demand_fulfilled_percent,
        payment_within_15_days_percent = EXCLUDED.payment_within_15_days_percent,
        last_synced_at = EXCLUDED.last_synced_at,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const values = [
      data.district_id,
      data.financial_year,
      data.month,
      data.year,
      data.total_job_cards_issued || 0,
      data.active_job_cards || 0,
      data.total_workers || 0,
      data.active_workers || 0,
      data.women_workers || 0,
      data.sc_workers || 0,
      data.st_workers || 0,
      data.person_days_generated || 0,
      data.households_employed || 0,
      data.average_days_per_household || 0,
      data.households_completed_100_days || 0,
      data.total_expenditure || 0,
      data.wage_expenditure || 0,
      data.material_expenditure || 0,
      data.average_wage_per_day || 0,
      data.total_works_ongoing || 0,
      data.total_works_completed || 0,
      data.employment_demand_fulfilled_percent || 0,
      data.payment_within_15_days_percent || 0,
      data.data_source || 'data.gov.in',
      new Date(),
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getComparisonData(districtIds, financialYear) {
    const query = `
      SELECT 
        d.id as district_id,
        d.district_name,
        dp.*
      FROM districts d
      LEFT JOIN LATERAL (
        SELECT * FROM district_performance
        WHERE district_id = d.id AND financial_year = $2
        ORDER BY year DESC, month DESC
        LIMIT 1
      ) dp ON TRUE
      WHERE d.id = ANY($1)
    `;
    const result = await pool.query(query, [districtIds, financialYear]);
    return result.rows;
  }

  static async getStateAverages(stateId, financialYear) {
    const query = `
      SELECT 
        AVG(person_days_generated) as avg_person_days,
        AVG(average_days_per_household) as avg_days_per_household,
        AVG(average_wage_per_day) as avg_wage_per_day,
        AVG(employment_demand_fulfilled_percent) as avg_demand_fulfilled,
        AVG(payment_within_15_days_percent) as avg_timely_payment
      FROM district_performance dp
      JOIN districts d ON dp.district_id = d.id
      WHERE d.state_id = $1 AND dp.financial_year = $2
    `;
    const result = await pool.query(query, [stateId, financialYear]);
    return result.rows[0];
  }
}

export default PerformanceModel;
