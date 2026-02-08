// Test trip generation API
const testAPI = async () => {
  const body = {
    destination: "Kochi",
    lat: 0,
    lon: 0,
    fromDate: "2026-01-20",
    toDate: "2026-01-22",
    travelers: 2,
    budget: 3000,
    currency: "INR",
    interests: ["Food", "History"]
  };

  console.log('\n🚀 Testing API at http://localhost:3000/api/trip/generate');
  console.log('📤 Request body:', JSON.stringify(body, null, 2));

  try {
    const response = await fetch('http://localhost:3000/api/trip/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    console.log(`\n📊 Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return;
    }

    const result = await response.json();
    console.log('\n✅ SUCCESS!\n');
    console.log('📋 Full Response:', JSON.stringify(result, null, 2));
    
    if (result.itinerary) {
      console.log('\n📊 Summary:');
      console.log(`  Destination: ${result.itinerary.destination}`);
      console.log(`  Days: ${result.itinerary.days}`);
      console.log(`  Total Budget: ${result.itinerary.currency} ${result.itinerary.totalBudget}`);
      console.log(`  Timeline Days: ${result.itinerary.timeline?.length || 0}`);
      console.log(`  First Activity: ${result.itinerary.timeline?.[0]?.activities?.[0]?.title || 'N/A'}`);
      console.log(`  Source: ${result.itinerary.source}`);
      console.log(`  Is Mock Data: ${result.itinerary.isMockData}`);
      console.log(`  Total Activities Day 1: ${result.itinerary.timeline?.[0]?.activities?.length || 0}`);
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  }
};

testAPI();
