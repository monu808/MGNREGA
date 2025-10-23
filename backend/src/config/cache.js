import NodeCache from 'node-cache';

// Cache with TTL of 1 hour
const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL) || 3600,
  checkperiod: 120,
  useClones: false,
});

export default cache;
