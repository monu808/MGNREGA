import apiService from '../services/apiService.js';
import cache from '../config/cache.js';
import logger from '../config/logger.js';

class DistrictController {
  static async getAllDistricts(req, res) {
    try {
      const cacheKey = 'districts:all';
      const cached = cache.get(cacheKey);
      
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          cached: true,
        });
      }

      // Fetch all states first, then districts for each
      const states = await apiService.fetchStates();
      const allDistricts = [];
      
      for (const state of states) {
        const districts = await apiService.fetchDistrictsByState(state.state_name);
        allDistricts.push(...districts);
      }
      
      cache.set(cacheKey, allDistricts, 3600);

      res.json({
        success: true,
        data: allDistricts,
        cached: false,
        source: 'data.gov.in API',
      });
    } catch (error) {
      logger.error('Error fetching districts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch districts from API',
      });
    }
  }

  static async getDistrictById(req, res) {
    try {
      const { id } = req.params;
      
      const cacheKey = `district:${id}`;
      const cached = cache.get(cacheKey);
      
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          cached: true,
        });
      }

      const district = await DistrictModel.getById(id);
      
      if (!district) {
        return res.status(404).json({
          success: false,
          error: 'District not found',
        });
      }

      cache.set(cacheKey, district);

      res.json({
        success: true,
        data: district,
        cached: false,
      });
    } catch (error) {
      logger.error('Error fetching district:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch district',
      });
    }
  }

  static async getDistrictsByState(req, res) {
    try {
      const { stateId } = req.params;
      
      const cacheKey = `districts:state:${stateId}`;
      const cached = cache.get(cacheKey);
      
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          cached: true,
        });
      }

      // Get state name from ID
      const states = await apiService.fetchStates();
      const state = states.find(s => s.id === parseInt(stateId) || s.state_code === stateId);
      
      if (!state) {
        return res.status(404).json({
          success: false,
          error: 'State not found',
        });
      }

      const districts = await apiService.fetchDistrictsByState(state.state_name);
      cache.set(cacheKey, districts, 3600);

      res.json({
        success: true,
        data: districts,
        cached: false,
        source: 'data.gov.in API',
      });
    } catch (error) {
      logger.error('Error fetching districts by state:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch districts from API',
      });
    }
  }

  static async getNearbyDistricts(req, res) {
    try {
      const { latitude, longitude, limit } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          error: 'Latitude and longitude are required',
        });
      }

      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      const resultLimit = parseInt(limit) || 5;

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid latitude or longitude',
        });
      }

      const districts = await DistrictModel.getNearby(lat, lon, resultLimit);

      res.json({
        success: true,
        data: districts,
        location: { latitude: lat, longitude: lon },
      });
    } catch (error) {
      logger.error('Error fetching nearby districts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch nearby districts',
      });
    }
  }

  static async searchDistricts(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Search query must be at least 2 characters',
        });
      }

      const districts = await apiService.searchDistricts(q.trim());

      res.json({
        success: true,
        data: districts,
        query: q,
        source: 'data.gov.in API',
      });
    } catch (error) {
      logger.error('Error searching districts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search districts from API',
      });
    }
  }
}

export default DistrictController;
