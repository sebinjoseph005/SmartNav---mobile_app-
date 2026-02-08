// Test the trip generation API endpoint
(async () => {
  const body = {
    destination: "Kochi",
    lat: 9.9312,
    lon: 76.2673,
    fromDate: "2026-02-01",
    toDate: "2026-02-03",
    travelers: 2,
    budget: 3000,
    currency: "₹",
    interests: ["Food", "History"]
  };

  console.log('📤 Sending request to backend...');
  console.log('Data:', JSON.stringify(body, null, 2));

  try {
    const res = await fetch('http://localhost:3000/api/trip/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });

    console.log('\n📊 Response status:', res.status);
    
    const result = await res.json();
    
    console.log('\n✅ SUCCESS! Generated itinerary:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.itinerary) {
      console.log('\n📋 Itinerary summary:');
      console.log('- Destination:', result.itinerary.destination);
      console.log('- Days:', result.itinerary.days);
      console.log('- Source:', result.itinerary.source);
      console.log('- Mock data:', result.itinerary.isMockData);
      console.log('- Timeline days:', result.itinerary.timeline?.length || 0);
      
      if (result.itinerary.timeline?.[0]?.activities) {
        console.log('- Day 1 activities:', result.itinerary.timeline[0].activities.length);
        console.log('- First activity:', result.itinerary.timeline[0].activities[0]?.title);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
})();
