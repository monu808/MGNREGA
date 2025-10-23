import pool from '../config/database.js';

class DistrictModel {
  static async getAll() {
    const query = `
      SELECT d.*, s.state_name, s.state_name_hindi 
      FROM districts d
      JOIN states s ON d.state_id = s.id
      ORDER BY d.district_name
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async getById(id) {
    const query = `
      SELECT d.*, s.state_name, s.state_name_hindi 
      FROM districts d
      JOIN states s ON d.state_id = s.id
      WHERE d.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getByStateId(stateId) {
    const query = `
      SELECT d.*, s.state_name, s.state_name_hindi 
      FROM districts d
      JOIN states s ON d.state_id = s.id
      WHERE d.state_id = $1
      ORDER BY d.district_name
    `;
    const result = await pool.query(query, [stateId]);
    return result.rows;
  }

  static async getNearby(latitude, longitude, limit = 5) {
    // Simple distance calculation using Haversine formula in SQL
    const query = `
      SELECT 
        d.*,
        s.state_name,
        s.state_name_hindi,
        (
          6371 * acos(
            cos(radians($1)) * cos(radians(d.latitude)) *
            cos(radians(d.longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(d.latitude))
          )
        ) AS distance_km
      FROM districts d
      JOIN states s ON d.state_id = s.id
      WHERE d.latitude IS NOT NULL AND d.longitude IS NOT NULL
      ORDER BY distance_km
      LIMIT $3
    `;
    const result = await pool.query(query, [latitude, longitude, limit]);
    return result.rows;
  }

  static async searchByName(searchTerm) {
    const query = `
      SELECT d.*, s.state_name, s.state_name_hindi 
      FROM districts d
      JOIN states s ON d.state_id = s.id
      WHERE 
        d.district_name ILIKE $1 
        OR d.district_name_hindi ILIKE $1
      ORDER BY d.district_name
      LIMIT 10
    `;
    const result = await pool.query(query, [`%${searchTerm}%`]);
    return result.rows;
  }
}

export default DistrictModel;
