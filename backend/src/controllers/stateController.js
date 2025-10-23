import apiService from '../services/apiService.js';
import cache from '../config/cache.js';
import logger from '../config/logger.js';

class StateController {
  static async getAllStates(req, res) {
    try {
      // Check cache first
      const cacheKey = 'states:all';
      const cached = cache.get(cacheKey);
      
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          cached: true,
        });
      }

      // Fetch directly from API
      const states = await apiService.fetchStates();
      
      // Cache the result for 1 hour
      cache.set(cacheKey, states, 3600);

      res.json({
        success: true,
        data: states,
        cached: false,
        source: 'data.gov.in API',
      });
    } catch (error) {
      logger.error('Error fetching states:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch states from API',
      });
    }
  }

  static async getStateById(req, res) {
    try {
      const { id } = req.params;
      
      const cacheKey = `state:${id}`;
      const cached = cache.get(cacheKey);
      
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          cached: true,
        });
      }

      // Fetch all states and find by ID
      const states = await apiService.fetchStates();
      const state = states.find(s => s.id === parseInt(id) || s.state_code === id);
      
      if (!state) {
        return res.status(404).json({
          success: false,
          error: 'State not found',
        });
      }

      cache.set(cacheKey, state, 3600);

      res.json({
        success: true,
        data: state,
        cached: false,
        source: 'data.gov.in API',
      });
    } catch (error) {
      logger.error('Error fetching state:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch state from API',
      });
    }
  }
}

export default StateController;
