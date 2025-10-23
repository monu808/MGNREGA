import pool from '../config/database.js';

class StateModel {
  static async getAll() {
    const query = 'SELECT * FROM states ORDER BY state_name';
    const result = await pool.query(query);
    return result.rows;
  }

  static async getById(id) {
    const query = 'SELECT * FROM states WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getByCode(code) {
    const query = 'SELECT * FROM states WHERE state_code = $1';
    const result = await pool.query(query, [code]);
    return result.rows[0];
  }
}

export default StateModel;
