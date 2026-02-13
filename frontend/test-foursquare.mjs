// Test Foursquare API key from user
const API_KEY = 'fsq3pul+ZXEJkfwc34h+mJAVom4/zZgVAC1maGmnqNznUKc=';

console.log('Testing backend Foursquare API key with v3 API...\n');
console.log('API Key:', API_KEY.substring(0, 20) + '...');
console.log('Key length:', API_KEY.length);
console.log('\n');

async function testAPI() {
  // Test with Kochi coordinates
  const lat = 9.9312;
  const lon = 76.2673;
  
  console.log('Testing Foursquare v3 API with query parameter:');
  console.log(`URL: https://api.foursquare.com/v3/places/search?query=temple&ll=${lat},${lon}&limit=5\n`);
  
  try {
    const res = await fetch(
      `https://api.foursquare.com/v3/places/search?query=temple&ll=${lat},${lon}&limit=5`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': API_KEY.trim(),
        },
      }
    );
    
    console.log('Status:', res.status);
    const text = await res.text();
    
    if (res.status === 401) {
      console.log('❌ AUTH FAILED!');
      console.log('Response:', text);
    } else if (res.status === 410) {
      console.log('❌ ENDPOINT DEPRECATED!');
      console.log('Response:', text.substring(0, 200));
      console.log('\n⚠️ Foursquare changed their API endpoints.');
      console.log('Need to use the new migration guide.');
    } else if (res.status === 200) {
      const data = JSON.parse(text);
      console.log('✅ SUCCESS!');
      console.log('Found:', data.results?.length || 0, 'places');
      if (data.results?.[0]) {
        console.log('First place:', data.results[0].name);
        console.log('Category:', data.results[0].categories?.[0]?.name);
      }
      console.log('\n🎉 KEY WORKS! Updating your app now...\n');
    } else {
      console.log('Unexpected status:', res.status);
      console.log('Response:', text.substring(0, 200));
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

testAPI();
