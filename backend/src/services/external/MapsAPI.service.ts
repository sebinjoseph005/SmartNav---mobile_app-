import fetch from 'node-fetch';

const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY!;

export class MapsAPIService {
  /** Search places by category near a lat/lon */
  static async getPlacesByCategory(
    lat: number,
    lon: number,
    categories: string
  ) {
    try {
      const url = `https://api.foursquare.com/v3/places/search?ll=${lat},${lon}&categories=${categories}&limit=20&radius=10000`;

      console.log('📡 Calling Foursquare API:', url);
      console.log('🔑 API Key present:', !!FOURSQUARE_API_KEY);

      const res = await fetch(url, {
        headers: {
          Authorization: FOURSQUARE_API_KEY,
          Accept: 'application/json',
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
        console.warn('⚠️ No places found, returning empty array');
        return [];
      }

      return data.results.map((p: any) => ({
        id: p.fsq_id,
        name: p.name,
        description: p.categories?.[0]?.name || 'Popular place to visit',
        lat: p.geocodes?.main?.latitude,
        lon: p.geocodes?.main?.longitude,
      }));
    } catch (error: any) {
      console.error('❌ MapsAPIService error:', error.message);
      throw error;
    }
  }
}
