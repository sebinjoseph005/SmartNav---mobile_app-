import { Platform } from 'react-native';

// Your computer's IP address
const LOCAL_IP = '10.242.113.88'; // ✅ Auto-detected

// Get API URL based on environment
const getApiUrl = () => {
  // For Android emulator
  if (Platform.OS === 'android') {
    // Try computer's IP first, fallback to emulator address
    return `http://${LOCAL_IP}:3000/api`;
  }

  // For iOS or physical device
  return `http://${LOCAL_IP}:3000/api`;
};

const API_URL = getApiUrl();

// Test backend connectivity
export const testBackendConnection = async () => {
  try {
    console.log('🔍 Testing backend at:', `${API_URL}/test`);
    const response = await fetch(`${API_URL}/test`);
    const data = await response.json();
    console.log('✅ Backend connection successful:', data);
    return data;
  } catch (error: any) {
    console.error('❌ Backend connection failed:', error.message);
    throw error;
  }
};

export const generateTripItinerary = async (tripData: {
  destination: string;
  lat: number;
  lon: number;
  fromDate: string;
  toDate: string;
  travelers: number;
  budget: number;
  currency: string;
  interests: string[];
}) => {
  try {
    const apiUrl = `${API_URL}/trip/generate`;
    
    console.log('\n========================================');
    console.log('🚀 CALLING BACKEND API');
    console.log('========================================');
    console.log('API URL:', apiUrl);
    console.log('Full URL:', `http://${LOCAL_IP}:3000/api/trip/generate`);
    console.log('Data being sent:', JSON.stringify({
      destination: tripData.destination,
      lat: tripData.lat,
      lon: tripData.lon,
      fromDate: tripData.fromDate,
      toDate: tripData.toDate,
      travelers: tripData.travelers,
      budget: tripData.budget,
      currency: tripData.currency,
      interests: tripData.interests,
    }, null, 2));
    console.log('========================================\n');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        destination: tripData.destination,
        lat: tripData.lat || 0,
        lon: tripData.lon || 0,
        fromDate: tripData.fromDate,
        toDate: tripData.toDate,
        travelers: tripData.travelers,
        budget: tripData.budget,
        currency: tripData.currency,
        interests: tripData.interests,
      }),
    });

    console.log('\n========================================');
    console.log('📡 BACKEND RESPONSE');
    console.log('========================================');
    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
    console.log('========================================\n');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('\n❌ API ERROR RESPONSE:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    console.log("API RESPONSE:", JSON.stringify(result, null, 2));
    
    console.log('\n========================================');
    console.log('✅ API SUCCESS');
    console.log('========================================');
    console.log('Result structure:', {
      hasItinerary: !!result.itinerary,
      destination: result.itinerary?.destination,
      days: result.itinerary?.days,
      timelineDays: result.itinerary?.timeline?.length,
      isMockData: result.itinerary?.isMockData,
      firstActivity: result.itinerary?.timeline?.[0]?.activities?.[0]?.title
    });
    console.log('========================================\n');
    
    return result;
  } catch (error: any) {
    console.error('\n========================================');
    console.error('❌ NETWORK/API ERROR');
    console.error('========================================');
    console.error('Error type:', error.constructor?.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('========================================\n');
    throw new Error(`Network Error: ${error.message}`);
  }
};

function calculateDays(fromDate: string, toDate: string): number {
  console.log('📅 Calculating days from:', fromDate, 'to:', toDate);
  
  if (!fromDate || !toDate) {
    console.warn('⚠️ Missing dates, defaulting to 4 days');
    return 4;
  }
  
  const from = new Date(fromDate);
  const to = new Date(toDate);
  
  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    console.error('❌ Invalid dates, defaulting to 4 days');
    return 4;
  }
  
  const diff = Math.abs(to.getTime() - from.getTime());
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  
  console.log(`✅ Calculated ${days} days`);
  return days;
}
