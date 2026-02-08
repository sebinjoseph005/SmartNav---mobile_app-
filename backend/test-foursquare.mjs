import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;

console.log('🧪 Testing Foursquare API...\n');
console.log('API Key exists:', !!FOURSQUARE_API_KEY);
console.log('API Key length:', FOURSQUARE_API_KEY?.length || 0);
console.log('API Key:', FOURSQUARE_API_KEY?.substring(0, 20) + '...\n');

async function testFoursquare(destination) {
  console.log(`📍 Testing destination: ${destination}`);
  
  const url = new URL('https://api.foursquare.com/v3/places/search');
  url.searchParams.set('near', destination);
  url.searchParams.set('categories', '13003,13065'); // Food
  url.searchParams.set('limit', '10');
  url.searchParams.set('sort', 'RATING');
  
  console.log('   URL:', url.toString());
  
  try {
    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': FOURSQUARE_API_KEY,
        'Accept': 'application/json',
      },
    });
    
    console.log('   Status:', res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('   ❌ Error:', errorText);
      return;
    }
    
    const data = await res.json();
    console.log('   ✅ Places found:', data.results?.length || 0);
    
    if (data.results && data.results.length > 0) {
      console.log('   \n   Sample places:');
      data.results.slice(0, 5).forEach((p, i) => {
        console.log(`      ${i+1}. ${p.name} (${p.categories?.[0]?.name || 'N/A'}) - ${p.rating || 'No rating'}`);
      });
    }
    
  } catch (error) {
    console.error('   ❌ Exception:', error.message);
  }
  
  console.log('');
}

// Test multiple destinations
(async () => {
  await testFoursquare('Tokyo');
  await testFoursquare('Paris');
  await testFoursquare('Kochi');
  await testFoursquare('New York');
})();
