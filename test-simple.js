const fetch = require('node-fetch');

async function test() {
  console.log('\n🧪 Testing AI Trip Generation...\n');
  
  const body = {
    destination: 'Delhi',
    lat: 28.6139,
    lon: 77.2090,
    fromDate: '2026-03-01',
    toDate: '2026-03-02',  // 2 days for faster test
    travelers: 2,
    budget: 5000,
    currency: 'INR',
    interests: ['Food', 'History']
  };

  console.log('📤 Sending request...');
  console.log('⏳ Wait 10-15 seconds for Groq AI to generate...\n');

  const res = await fetch('http://localhost:3000/api/trip/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const result = await res.json();
  
  console.log('✅ Response received!\n');
  console.log(`📍 Destination: ${result.itinerary.destination}`);
  console.log(`📅 Days: ${result.itinerary.days}`);
  console.log(`🤖 Source: ${result.itinerary.source}`);
  
  if (result.itinerary.source === 'groq-ai') {
    console.log('   ✅ SUCCESS! Using Groq AI!');
  } else {
    console.log('   ⚠️  WARNING: Not using Groq AI (using ' + result.itinerary.source + ')');
    console.log('   Check backend console logs for errors');
  }
  
  console.log(`📝 Day 1 Activities: ${result.itinerary.timeline[0].activities.length}`);
  console.log(`🎯 First Activity: ${result.itinerary.timeline[0].activities[0].title}\n`);
}

test().catch(console.error);
