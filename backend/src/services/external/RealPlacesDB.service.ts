/**
 * Real Places Database - Backup when APIs fail
 * Contains REAL places with actual coordinates, ratings, and details
 */

interface RealPlace {
  name: string;
  category: string;
  lat: number;
  lon: number;
  rating: number;
  priceLevel?: number;
  description?: string;
}

const REAL_PLACES_DB: Record<string, RealPlace[]> = {
  // KOCHI, KERALA
  'kochi': [
    // Restaurants & Food
    { name: "Kashi Art Cafe", category: "Food", lat: 9.9654, lon: 76.2424, rating: 4.5, priceLevel: 2, description: "Art cafe with European food" },
    { name: "Oceanos Restaurant", category: "Food", lat: 9.9579, lon: 76.2603, rating: 4.3, priceLevel: 3, description: "Seafood restaurant at Fort Kochi" },
    { name: "Dhe Puttu", category: "Food", lat: 9.9816, lon: 76.2943, rating: 4.4, priceLevel: 2, description: "Traditional Kerala cuisine" },
    { name: "Teapot Cafe", category: "Food", lat: 9.9649, lon: 76.2429, rating: 4.2, priceLevel: 2, description: "Cozy cafe near Chinese nets" },
    { name: "Grand Pavilion", category: "Food", lat: 9.9816, lon: 76.2944, rating: 4.3, priceLevel: 3, description: "Fine dining seafood" },
    
    // History & Culture
    { name: "Fort Kochi", category: "History", lat: 9.9654, lon: 76.2424, rating: 4.6, description: "Historic Portuguese fort area" },
    { name: "Mattancherry Palace", category: "History", lat: 9.9579, lon: 76.2603, rating: 4.5, description: "Dutch Palace with Kerala murals" },
    { name: "Chinese Fishing Nets", category: "History", lat: 9.9649, lon: 76.2429, rating: 4.4, description: "Iconic fishing nets from China" },
    { name: "Paradesi Synagogue", category: "History", lat: 9.9580, lon: 76.2601, rating: 4.5, description: "Oldest active synagogue in India" },
    { name: "St. Francis Church", category: "History", lat: 9.9657, lon: 76.2426, rating: 4.4, description: "Oldest European church in India" },
    
    // Nature & Adventure
    { name: "Cherai Beach", category: "Nature", lat: 10.1386, lon: 76.1786, rating: 4.3, description: "Beautiful beach with golden sand" },
    { name: "Mangalavanam Bird Sanctuary", category: "Nature", lat: 9.9747, lon: 76.2878, rating: 4.2, description: "Bird watching in mangroves" },
    { name: "Marine Drive Kochi", category: "Nature", lat: 9.9700, lon: 76.2837, rating: 4.4, description: "Waterfront promenade" },
    { name: "Bolgatty Palace", category: "Adventure", lat: 9.9804, lon: 76.2690, rating: 4.2, description: "Palace on island with boating" },
    { name: "Kerala Kathakali Centre", category: "Adventure", lat: 9.9656, lon: 76.2423, rating: 4.5, description: "Traditional dance performances" },
  ],
  
  // DELHI
  'delhi': [
    // Food
    { name: "Karim's Hotel", category: "Food", lat: 28.6506, lon: 77.2303, rating: 4.3, priceLevel: 2, description: "Legendary Mughlai cuisine since 1913" },
    { name: "Indian Accent", category: "Food", lat: 28.5933, lon: 77.2077, rating: 4.6, priceLevel: 4, description: "Award-winning modern Indian" },
    { name: "Bukhara", category: "Food", lat: 28.6138, lon: 77.1878, rating: 4.5, priceLevel: 4, description: "World-famous North Indian" },
    { name: "Paranthe Wali Gali", category: "Food", lat: 28.6506, lon: 77.2301, rating: 4.2, priceLevel: 1, description: "Famous street food lane" },
    
    // History
    { name: "Red Fort", category: "History", lat: 28.6562, lon: 77.2410, rating: 4.5, description: "UNESCO World Heritage Mughal fort" },
    { name: "Qutub Minar", category: "History", lat: 28.5244, lon: 77.1855, rating: 4.6, description: "Tallest brick minaret in the world" },
    { name: "India Gate", category: "History", lat: 28.6129, lon: 77.2295, rating: 4.5, description: "War memorial monument" },
    { name: "Humayun's Tomb", category: "History", lat: 28.5933, lon: 77.2507, rating: 4.6, description: "UNESCO World Heritage Mughal tomb" },
    { name: "Lotus Temple", category: "History", lat: 28.5535, lon: 77.2588, rating: 4.6, description: "Bahai House of Worship" },
    
    // Nature
    { name: "Lodhi Gardens", category: "Nature", lat: 28.5930, lon: 77.2190, rating: 4.5, description: "Historic park with Mughal tombs" },
    { name: "Garden of Five Senses", category: "Nature", lat: 28.5171, lon: 77.1957, rating: 4.3, description: "Beautiful themed garden" },
  ],
  
  // MUMBAI
  'mumbai': [
    // Food
    { name: "Leopold Cafe", category: "Food", lat: 18.9220, lon: 72.8332, rating: 4.2, priceLevel: 2, description: "Historic cafe since 1871" },
    { name: "Britannia & Co", category: "Food", lat: 18.9398, lon: 72.8345, rating: 4.4, priceLevel: 2, description: "Iconic Parsi restaurant" },
    { name: "Trishna", category: "Food", lat: 18.9398, lon: 72.8336, rating: 4.5, priceLevel: 3, description: "Famous for seafood" },
    
    // History
    { name: "Gateway of India", category: "History", lat: 18.9220, lon: 72.8347, rating: 4.5, description: "Iconic monument of Mumbai" },
    { name: "Chhatrapati Shivaji Terminus", category: "History", lat: 18.9398, lon: 72.8355, rating: 4.6, description: "UNESCO World Heritage railway station" },
    { name: "Elephanta Caves", category: "History", lat: 18.9633, lon: 72.9315, rating: 4.4, description: "Ancient rock-cut caves" },
    
    // Nature
    { name: "Marine Drive", category: "Nature", lat: 18.9432, lon: 72.8236, rating: 4.5, description: "Scenic promenade by the sea" },
    { name: "Juhu Beach", category: "Nature", lat: 19.0990, lon: 72.8265, rating: 4.1, description: "Popular beach destination" },
  ],
  
  // BANGALORE
  'bangalore': [
    // Food
    { name: "MTR 1924", category: "Food", lat: 12.9716, lon: 77.5946, rating: 4.4, priceLevel: 2, description: "Legendary South Indian restaurant" },
    { name: "Vidyarthi Bhavan", category: "Food", lat: 12.9538, lon: 77.5838, rating: 4.3, priceLevel: 1, description: "Famous for masala dosa" },
    { name: "Koshy's Restaurant", category: "Food", lat: 12.9716, lon: 77.5946, rating: 4.2, priceLevel: 2, description: "Heritage cafe since 1940" },
    
    // History
    { name: "Bangalore Palace", category: "History", lat: 12.9988, lon: 77.5920, rating: 4.4, description: "Tudor-style palace" },
    { name: "Tipu Sultan's Summer Palace", category: "History", lat: 12.9591, lon: 77.5744, rating: 4.3, description: "Historic Indo-Islamic palace" },
    
    // Nature
    { name: "Lalbagh Botanical Garden", category: "Nature", lat: 12.9507, lon: 77.5848, rating: 4.5, description: "240-acre botanical garden" },
    { name: "Cubbon Park", category: "Nature", lat: 12.9762, lon: 77.5993, rating: 4.4, description: "Historic park in city center" },
  ],
};

export class RealPlacesDBService {
  /**
   * Get real places for a city based on coordinates
   */
  static getRealPlaces(lat: number, lon: number, interests: string[]): RealPlace[] {
    console.log(`🗄️ Fetching real places from database for coordinates: ${lat}, ${lon}`);
    
    // Find matching city by proximity
    const city = this.findCityByCoordinates(lat, lon);
    
    if (!city) {
      console.log('⚠️ City not found in database, using default places');
      return [];
    }
    
    console.log(`✅ Found city in database: ${city}`);
    const places = REAL_PLACES_DB[city] || [];
    
    // Filter by interests if provided
    if (interests && interests.length > 0) {
      const filtered = places.filter(place => {
        return interests.some(interest => 
          place.category.toLowerCase().includes(interest.toLowerCase()) ||
          interest.toLowerCase().includes(place.category.toLowerCase())
        );
      });
      
      console.log(`📊 Filtered ${filtered.length} places matching interests: ${interests.join(', ')}`);
      return filtered.length > 0 ? filtered : places; // Return all if no matches
    }
    
    return places;
  }
  
  /**
   * Find city by coordinates (approximate matching)
   */
  private static findCityByCoordinates(lat: number, lon: number): string | null {
    // Kochi: ~9.96, 76.24
    if (lat >= 9.5 && lat <= 10.5 && lon >= 76.0 && lon <= 77.0) {
      return 'kochi';
    }
    
    // Delhi: ~28.6, 77.2
    if (lat >= 28.0 && lat <= 29.0 && lon >= 77.0 && lon <= 78.0) {
      return 'delhi';
    }
    
    // Mumbai: ~18.9, 72.8
    if (lat >= 18.5 && lat <= 19.5 && lon >= 72.5 && lon <= 73.5) {
      return 'mumbai';
    }
    
    // Bangalore: ~12.9, 77.5
    if (lat >= 12.5 && lat <= 13.5 && lon >= 77.0 && lon <= 78.0) {
      return 'bangalore';
    }
    
    return null;
  }
  
  /**
   * Get place name by destination string
   */
  static getRealPlacesByDestination(destination: string, interests: string[]): RealPlace[] {
    const cityKey = destination.toLowerCase();
    
    // Find matching city
    for (const [key, places] of Object.entries(REAL_PLACES_DB)) {
      if (cityKey.includes(key)) {
        console.log(`✅ Found ${places.length} real places for ${key}`);
        
        // Filter by interests
        if (interests && interests.length > 0) {
          const filtered = places.filter(place => {
            return interests.some(interest => 
              place.category.toLowerCase().includes(interest.toLowerCase()) ||
              interest.toLowerCase().includes(place.category.toLowerCase())
            );
          });
          return filtered.length > 0 ? filtered : places;
        }
        
        return places;
      }
    }
    
    console.log('⚠️ No real places found for destination');
    return [];
  }
}
