import { syncDataFromAPI } from './src/services/syncService.js';

async function test() {
  try {
    console.log('Starting real data sync...');
    const result = await syncDataFromAPI();
    console.log('Sync result:', JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

test();
