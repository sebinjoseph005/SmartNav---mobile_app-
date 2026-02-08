import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY!;

function isValidCoordinate(lat: number, lon: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lon < -180 || lon > 180) return false;
  // Treat (0,0) as "missing" for this app (mobile often sends 0 when unknown)
  if (lat === 0 && lon === 0) return false;
  return true;
}

export class MapsAPIService {
  /** Search places by category near a lat/lon */
  static async getPlacesByCategory(
    lat: number,
    lon: number,
    categories: string
  ) {
    try {
      if (!FOURSQUARE_API_KEY) {
        throw new Error('FOURSQUARE_API_KEY is not configured in .env file');
      }

      if (!isValidCoordinate(lat, lon)) {
        throw new Error('Invalid coordinates provided for Foursquare ll search');
      }

      const urlObj = new URL('https://places-api.foursquare.com/places/search');
      urlObj.searchParams.set('ll', `${lat},${lon}`);
      urlObj.searchParams.set('categories', categories);
      urlObj.searchParams.set('limit', '50');
      urlObj.searchParams.set('radius', '20000');
      urlObj.searchParams.set('sort', 'RATING');
      const url = urlObj.toString();

      console.log('📡 Calling Foursquare API (new):', url);
      console.log('🔑 API Key length:', FOURSQUARE_API_KEY?.length);

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${FOURSQUARE_API_KEY}`,
          Accept: 'application/json',
          'X-Places-Api-Version': '2025-06-17',
        },
      });

      console.log('📊 Foursquare response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Foursquare API error:', errorText);
        throw new Error(`Foursquare API failed: ${res.status} - ${errorText}`);
      }

      const data: any = await res.json();
      console.log(`✅ Foursquare returned ${data.results?.length || 0} places`);

      if (!data.results || data.results.length === 0) {
        console.warn('⚠️ No places found from Foursquare');
        return [];
      }

      // Map with complete information
      const places = data.results.map((p: any) => ({
        id: p.fsq_id,
        name: p.name,
        description: p.categories?.[0]?.name || 'Popular place to visit',
        categories: p.categories?.[0]?.name,
        rating: p.rating ? Math.round(p.rating * 10) / 10 : 4.0, // Round to 1 decimal
        lat: p.geocodes?.main?.latitude,
        lon: p.geocodes?.main?.longitude,
        address: p.location?.formatted_address || p.location?.address || 'Address available on map',
      }));

      console.log(`📋 Parsed places: ${places.slice(0, 3).map((p: any) => `${p.name} (${p.rating}⭐)`).join(', ')}`);
      
      return places;
    } catch (error: any) {
      console.error('❌ MapsAPIService error:', error.message);
      throw error;
    }
  }

  /** Search places by category near a destination string (city/place name) */
  static async getPlacesByCategoryNear(near: string, categories: string) {
    try {
      if (!FOURSQUARE_API_KEY) {
        throw new Error('FOURSQUARE_API_KEY is not configured in .env file');
      }

      const trimmed = (near || '').trim();
      if (!trimmed) {
        throw new Error('Destination (near) is required for Foursquare near search');
      }

      const urlObj = new URL('https://places-api.foursquare.com/places/search');
      urlObj.searchParams.set('near', trimmed);
      urlObj.searchParams.set('categories', categories);
      urlObj.searchParams.set('limit', '50');
      // radius is not supported with "near" in some Foursquare modes; omit it to be safe.
      urlObj.searchParams.set('sort', 'RATING');
      const url = urlObj.toString();

      console.log('📡 Calling Foursquare API (new, near):', url);
      console.log('🔑 API Key length:', FOURSQUARE_API_KEY?.length);

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${FOURSQUARE_API_KEY}`,
          Accept: 'application/json',
          'X-Places-Api-Version': '2025-06-17',
        },
      });

      console.log('📊 Foursquare response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Foursquare API error:', errorText);
        throw new Error(`Foursquare API failed: ${res.status} - ${errorText}`);
      }

      const data: any = await res.json();
      console.log(`✅ Foursquare returned ${data.results?.length || 0} places`);

      if (!data.results || data.results.length === 0) {
        console.warn('⚠️ No places found from Foursquare');
        return [];
      }

      const places = data.results.map((p: any) => ({
        id: p.fsq_id,
        name: p.name,
        description: p.categories?.[0]?.name || 'Popular place to visit',
        categories: p.categories?.[0]?.name,
        rating: p.rating ? Math.round(p.rating * 10) / 10 : 4.0,
        lat: p.geocodes?.main?.latitude,
        lon: p.geocodes?.main?.longitude,
        address: p.location?.formatted_address || p.location?.address || 'Address available on map',
      }));

      console.log(`📋 Parsed places: ${places.slice(0, 3).map((p: any) => `${p.name} (${p.rating}⭐)`).join(', ')}`);
      return places;
    } catch (error: any) {
      console.error('❌ MapsAPIService (near) error:', error.message);
      throw error;
    }
  }
}
