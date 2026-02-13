/**
 * Real Places Database - DISABLED
 * Mock data removed - using only AI and Foursquare API for all destinations
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

// Mock data database removed - using AI for all destinations
const REAL_PLACES_DB: Record<string, RealPlace[]> = {};

export class RealPlacesDBService {
  /**
   * Get real places for a city based on coordinates
   * DISABLED - Always returns empty array
   */
  static getRealPlaces(lat: number, lon: number, interests: string[]): RealPlace[] {
    console.log('🚫 Mock data disabled - using AI only');
    return [];
  }
  
  /**
   * Find city by coordinates
   * DISABLED
   */
  private static findCityByCoordinates(lat: number, lon: number): string | null {
    return null;
  }
  
  /**
   * Get place name by destination string
   * DISABLED - Always returns empty array
   */
  static getRealPlacesByDestination(destination: string, interests: string[]): RealPlace[] {
    console.log('🚫 Mock data disabled - using AI only');
    return [];
  }
}
