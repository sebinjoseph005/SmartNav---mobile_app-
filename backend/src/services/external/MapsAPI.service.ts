import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// OpenStreetMap APIs - No API key needed!
const OVERPASS_API = 'https://overpass-api.de/api/interpreter';
const NOMINATIM_API = 'https://nominatim.openstreetmap.org';

// ⚡ GEOCODING CACHE - dramatically speeds up repeated requests
const geocodeCache = new Map<string, { lat: number; lon: number; timestamp: number }>();
const GEOCODE_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function isValidCoordinate(lat: number, lon: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lon < -180 || lon > 180) return false;
  // Treat (0,0) as "missing" for this app (mobile often sends 0 when unknown)
  if (lat === 0 && lon === 0) return false;
  return true;
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Map categories to OpenStreetMap tags
function mapCategoryToOSMTags(categories: string): string[] {
  const categoryMap: { [key: string]: string[] } = {
    // Food & Drink (Tourist-oriented only)
    'restaurant': ['amenity=restaurant'],
    'cafe': ['amenity=cafe'],
    'bar': ['amenity=bar'],

    // Tourism & Attractions - PRIMARY CATEGORIES
    'museum': ['tourism=museum'],
    'artwork': ['tourism=artwork'],
    'viewpoint': ['tourism=viewpoint'],
    'gallery': ['tourism=gallery'],
    'theme_park': ['tourism=theme_park'],
    'zoo': ['tourism=zoo'],
    'aquarium': ['tourism=aquarium'],
    'castle': ['historic=castle'],
    'monument': ['historic=monument'],
    'memorial': ['historic=memorial'],
    'archaeological_site': ['historic=archaeological_site'],
    'ruins': ['historic=ruins'],
    'fort': ['historic=fort'],
    'palace': ['historic=palace'],
    'temple': ['historic=temple', 'amenity=place_of_worship'],
    // Generic attraction - works worldwide as fallback (combines multiple tags)
    'attraction': ['tourism=attraction', 'tourism=museum', 'tourism=gallery', 'historic'],

    // Accommodation (if needed)
    'hotel': ['tourism=hotel'],
    'hostel': ['tourism=hostel'],

    // Shopping (Tourist markets only)
    'market': ['amenity=marketplace', 'shop=mall'],

    // Recreation & Nature
    'park': ['leisure=park'],
    'garden': ['leisure=garden'],
    'nature_reserve': ['leisure=nature_reserve'],
    'beach': ['natural=beach'],
    'stadium': ['leisure=stadium'],
    'sports_centre': ['leisure=sports_centre'],

    // Essential Infrastructure (Added for dynamic chat lookups)
    'hospital': ['amenity=hospital', 'amenity=clinic'],
    'clinic': ['amenity=clinic'],
    'college': ['amenity=college'],
    'university': ['amenity=university'],
    'school': ['amenity=school'],
  };

  const tags: string[] = [];
  const cats = categories.toLowerCase().split(',');

  for (const cat of cats) {
    const trimmed = cat.trim();
    if (categoryMap[trimmed]) {
      tags.push(...categoryMap[trimmed]);
    }
  }

  // Default fallback - ONLY tourist attractions, NO generic amenities
  // Use broader tags that work worldwide
  if (tags.length === 0) {
    tags.push('tourism', 'historic', 'leisure=park');
  }

  return tags;
}

export class MapsAPIService {
  /** Search places by category near a lat/lon using OpenStreetMap Overpass API */
  static async getPlacesByCategory(
    lat: number,
    lon: number,
    categories: string,
    radius: number = 50000 // Default 50km radius
  ) {
    try {
      if (!isValidCoordinate(lat, lon)) {
        throw new Error('Invalid coordinates provided for OpenStreetMap search');
      }

      const tags = mapCategoryToOSMTags(categories);

      // Build Overpass query for multiple tag types including ways & relations (nwr)
      const tagQueries = tags.map(tag => {
        if (tag.includes('=')) {
          const [key, value] = tag.split('=');
          return `nwr["${key}"="${value}"](around:${radius},${lat},${lon});`;
        } else {
          return `nwr["${tag}"](around:${radius},${lat},${lon});`;
        }
      }).join('\n  ');

      const query = `
        [out:json][timeout:25];
        (
          ${tagQueries}
        );
        out center tags 100;
      `;

      console.log('📡 Calling OpenStreetMap Overpass API...');

      const res = await fetch(OVERPASS_API, {
        method: 'POST',
        body: query,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      console.log('📊 Overpass API response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Overpass API error:', errorText);
        throw new Error(`Overpass API failed: ${res.status} - ${errorText}`);
      }

      const data: any = await res.json();
      console.log(`✅ OpenStreetMap returned ${data.elements?.length || 0} places`);

      if (!data.elements || data.elements.length === 0) {
        console.warn('⚠️ No places found from OpenStreetMap');
        return [];
      }

      // Filter and map elements that have names (prefer English names)
      const places = data.elements
        .filter((p: any) => {
          if (!p.tags || !(p.tags['name:en'] || p.tags.name || p.tags['int_name'])) return false;

          // EXCLUDE non-tourist service places (unless implicitly requested by specific category)
          const tags = p.tags;
          const bannedAmenities = ['bank', 'atm', 'post_office', 'police', 'fire_station', 'embassy', 'dentist', 'veterinary'];
          const bannedShops = ['supermarket', 'convenience', 'department_store', 'general'];

          // Special escape hatch: if the user explicitly searched for hospital/college, we shouldn't ban it.
          // Since we query exactly the tag (e.g. amenity=hospital), we trust the query over the banlist when they match.
          // But to be safe, just limit the banned list.

          if (bannedAmenities.includes(tags.amenity)) return false;
          if (bannedShops.includes(tags.shop)) return false;

          return true;
        })
        .map((p: any) => {
          const tags = p.tags || {};

          // Elements of type 'way' or 'relation' put coordinates in 'center' when 'out center' is used.
          const plat = p.lat || p.center?.lat;
          const plon = p.lon || p.center?.lon;
          const distance = calculateDistance(lat, lon, plat, plon);

          // Prefer English name, fallback to international name, then default name
          const placeName = tags['name:en'] || tags['int_name'] || tags.name;

          // Determine category from tags (prioritize tourism/historic/leisure)
          const category = tags.tourism || tags.historic || tags.leisure || tags.amenity || 'Place';

          return {
            id: p.id.toString(),
            name: placeName,
            description: formatCategory(category),
            categories: formatCategory(category),
            rating: 4.0, // OSM doesn't provide ratings, use default
            lat: plat,
            lon: plon,
            address: tags['addr:street'] || tags['addr:city'] || 'Address available on map',
            distance: distance,
          };
        })
        .sort((a: any, b: any) => a.distance - b.distance); // Sort by distance

      console.log(`📋 Parsed places: ${places.slice(0, 3).map((p: any) => `${p.name} (${p.distance.toFixed(1)}km)`).join(', ')}`);

      return places;
    } catch (error: any) {
      console.error('❌ MapsAPIService error:', error.message);
      throw error;
    }
  }

  /** Search places by category near a destination string (city/place name) */
  static async getPlacesByCategoryNear(near: string, categories: string) {
    try {
      const trimmed = (near || '').trim();
      if (!trimmed) {
        throw new Error('Destination (near) is required for OpenStreetMap search');
      }

      // ⚡ Check cache first for faster response
      const cacheKey = trimmed.toLowerCase();
      const cached = geocodeCache.get(cacheKey);

      let lat: number, lon: number;

      if (cached && Date.now() - cached.timestamp < GEOCODE_CACHE_DURATION) {
        console.log('✅ Cache hit for geocoding:', trimmed);
        lat = cached.lat;
        lon = cached.lon;
      } else {
        // Geocode the location using Nominatim with English language preference
        const geocodeUrl = `${NOMINATIM_API}/search?q=${encodeURIComponent(trimmed)}&format=json&limit=1&accept-language=en`;

        console.log('📡 Geocoding location with Nominatim:', trimmed);

        const geoRes = await fetch(geocodeUrl, {
          headers: {
            'User-Agent': 'SmartNav-Backend/1.0',
          },
        });

        if (!geoRes.ok) {
          throw new Error(`Nominatim geocoding failed: ${geoRes.status}`);
        }

        const geoData: any = await geoRes.json();

        if (!geoData || geoData.length === 0) {
          console.warn('⚠️ Location not found:', trimmed);
          throw new Error(`Location "${trimmed}" not found`);
        }

        const location = geoData[0];
        lat = parseFloat(location.lat);
        lon = parseFloat(location.lon);

        // Store in cache
        geocodeCache.set(cacheKey, { lat, lon, timestamp: Date.now() });

        // Clean old entries if cache gets too large
        if (geocodeCache.size > 500) {
          const entries = Array.from(geocodeCache.entries());
          entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
          entries.slice(0, 250).forEach(([key]) => geocodeCache.delete(key));
        }

        console.log(`✅ Geocoded "${trimmed}" to (${lat}, ${lon})`);
      }

      // Now search for places near those coordinates
      return await this.getPlacesByCategory(lat, lon, categories, 30000); // 30km for city-based search
    } catch (error: any) {
      console.error('❌ MapsAPIService (near) error:', error.message);
      throw error;
    }
  }
}

// Format category names to be more readable
function formatCategory(category: string): string {
  const categoryMap: { [key: string]: string } = {
    // Food & Drink
    'restaurant': 'Restaurant',
    'cafe': 'Café',
    'bar': 'Bar',
    'fast_food': 'Restaurant',
    // Tourism
    'hotel': 'Hotel',
    'museum': 'Museum',
    'attraction': 'Tourist Attraction',
    'viewpoint': 'Scenic Viewpoint',
    'artwork': 'Public Art',
    'gallery': 'Art Gallery',
    'theme_park': 'Theme Park',
    'zoo': 'Zoo',
    'aquarium': 'Aquarium',
    'hostel': 'Hostel',
    // Historic
    'castle': 'Historic Castle',
    'monument': 'Monument',
    'memorial': 'Memorial',
    'archaeological_site': 'Archaeological Site',
    'ruins': 'Historic Ruins',
    'fort': 'Historic Fort',
    'palace': 'Palace',
    'temple': 'Temple',
    // Nature & Recreation
    'park': 'Park',
    'garden': 'Garden',
    'nature_reserve': 'Nature Reserve',
    'beach': 'Beach',
    'stadium': 'Stadium',
    'sports_centre': 'Sports Center',
    // Shopping
    'marketplace': 'Market',
    'mall': 'Shopping Mall',
  };
  return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');
}
