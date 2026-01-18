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
    console.log('🚀 Calling API:', `${API_URL}/trip/generate`);
    console.log('📦 Request data:', {
      destination: tripData.destination,
      lat: tripData.lat,
      lon: tripData.lon,
      days: calculateDays(tripData.fromDate, tripData.toDate),
      budget: tripData.budget,
      currency: tripData.currency,
      interests: tripData.interests,
    });

    const response = await fetch(`${API_URL}/trip/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        destination: tripData.destination,
        lat: tripData.lat || 0,
        lon: tripData.lon || 0,
        days: calculateDays(tripData.fromDate, tripData.toDate),
        budget: tripData.budget,
        currency: tripData.currency,
        interests: tripData.interests,
      }),
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ API Success:', result);
    return result;
  } catch (error: any) {
    console.error('❌ Network Error:', error.message);
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
