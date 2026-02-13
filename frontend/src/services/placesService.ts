// Cache for geocoding results (in-memory, expires after 30 minutes)
const geocodeCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const REQUEST_TIMEOUT = 8000; // 8 seconds max wait time
const MAX_RETRIES = 2; // Retry up to 2 times on failure
const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImM5ZWJlMTk1ZDk3MjQ3NzI4MWU1Njc0ZmEwYzlhOGYwIiwiaCI6Im11cm11cjY0In0=';

/**
 * Fetch with timeout protection for slow networks
 */
const fetchWithTimeout = (url: string, options: any, timeout: number = REQUEST_TIMEOUT): Promise<Response> => {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout - network too slow')), timeout)
    ),
  ]);
};

/**
 * Retry logic for failed requests
 */
const fetchWithRetry = async (url: string, options: any, retries: number = MAX_RETRIES): Promise<Response> => {
  try {
    return await fetchWithTimeout(url, options);
  } catch (error: any) {
    if (retries > 0 && (error.message.includes('timeout') || error.message.includes('network'))) {
      console.log(`⚠️ Retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
};

export async function searchPlaces(query: string) {
  if (!query || query.length < 3) return [];

  // Check cache first
  const cacheKey = query.toLowerCase().trim();
  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('✅ Cache hit for:', query);
    return cached.data;
  }

  // Try ORS first, fallback to Nominatim if it fails
  console.log('🌐 Searching for:', query);
  
  // Try ORS (preferred - better results)
  try {
    const orsUrl = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(query)}&size=5&lang=en`;
    
    const res = await fetchWithRetry(orsUrl, {
      headers: {
        'Accept': 'application/json',
      },
    }, 1); // Only 1 retry for ORS

    if (res.ok) {
      const data = await res.json();
      const features = data.features || [];
      
      if (features.length > 0) {
        const transformedData = features.map((item: any) => ({
          place_id: item.properties.id || Math.random().toString(),
          display_name: item.properties.label,
          lat: item.geometry.coordinates[1].toString(),
          lon: item.geometry.coordinates[0].toString(),
          name: item.properties.name,
          address: item.properties,
        }));
        
        console.log('✅ ORS:', transformedData.length, 'results');
        geocodeCache.set(cacheKey, { data: transformedData, timestamp: Date.now() });
        return transformedData;
      }
    }
  } catch (orsError: any) {
    console.warn('⚠️ ORS failed, trying Nominatim...', orsError.message);
  }

  // Fallback to Nominatim (OpenStreetMap - no API key needed)
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1&accept-language=en`;
    
    const res = await fetchWithRetry(nominatimUrl, {
      headers: {
        'User-Agent': 'SmartNav-Mobile-App/1.0',
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      console.error('❌ Nominatim error - Status:', res.status);
      return [];
    }

    const data = await res.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      console.log('ℹ️ No results found for:', query);
      return [];
    }
    
    // Transform Nominatim format
    const transformedData = data.map((item: any) => ({
      place_id: item.place_id || Math.random().toString(),
      display_name: item.display_name,
      lat: item.lat,
      lon: item.lon,
      name: item.name || item.display_name.split(',')[0],
      address: item.address,
    }));
    
    console.log('✅ Nominatim:', transformedData.length, 'results');
    
    // Store in cache
    geocodeCache.set(cacheKey, { data: transformedData, timestamp: Date.now() });
    
    // Clean old cache entries
    if (geocodeCache.size > 100) {
      const entries = Array.from(geocodeCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      entries.slice(0, 50).forEach(([key]) => geocodeCache.delete(key));
    }
    
    return transformedData;
  } catch (e: any) {
    console.error('❌ All geocoding services failed:', e.message);
    console.error('   Check your internet connection');
    return [];
  }
}

// Fast geocode for single location (with cache)
export async function geocodeLocation(query: string): Promise<{ lat: number; lon: number } | null> {
  if (!query || query.length < 2) return null;

  const cacheKey = `geocode:${query.toLowerCase().trim()}`;
  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // Try ORS first
  try {
    const orsUrl = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(query)}&size=1&lang=en`;
    
    const res = await fetchWithRetry(orsUrl, {
      headers: { 'Accept': 'application/json' },
    }, 1); // Only 1 retry

    if (res.ok) {
      const data = await res.json();
      
      if (data.features && data.features.length > 0) {
        const result = {
          lat: data.features[0].geometry.coordinates[1],
          lon: data.features[0].geometry.coordinates[0],
        };
        
        console.log('✅ ORS geocoded:', result);
        geocodeCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
      }
    }
  } catch (orsError) {
    console.warn('⚠️ ORS geocoding failed, trying Nominatim...');
  }

  // Fallback to Nominatim
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&accept-language=en`;
    
    const res = await fetchWithRetry(nominatimUrl, {
      headers: {
        'User-Agent': 'SmartNav-Mobile-App/1.0',
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      console.error('❌ Nominatim geocoding failed - Status:', res.status);
      return null;
    }

    const data = await res.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      console.warn('⚠️ No geocoding results for:', query);
      return null;
    }
    
    const result = {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
    };
    
    console.log('✅ Nominatim geocoded:', result);
    geocodeCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (e: any) {
    console.error('❌ All geocoding failed:', e.message);
    return null;
  }
}
