import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Search, MapPin } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { geocodeLocation, searchPlaces as geocodeSearch } from '../../services/placesService';

// API Configuration - Using OpenStreetMap
const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

export default function SearchResults() {
  const navigation = useNavigation<any>();
  const searchTimeout = useRef<any>(null);

  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Debug: Log API config on mount
  useEffect(() => {
    console.log('\n=== API CONFIG ===');
    console.log('✅ Using OpenStreetMap (Overpass API + Nominatim)');
    console.log('→ No API key needed - fully open source!');
  }, []);

  useEffect(() => {
    // Load popular places near user initially
    loadNearbyPlaces();

    // Cleanup timeout on unmount
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  // Helper: Overpass query for amenities near lat/lon
  const overpassNearbyQuery = (lat: number, lon: number) => `
    [out:json][timeout:15];
    (
      node["amenity"](around:2000,${lat},${lon});
      way["amenity"](around:2000,${lat},${lon});
      relation["amenity"](around:2000,${lat},${lon});
    );
    out center 20;
  `;

  // Fetch place suggestions as user types (OPTIMIZED)
  const fetchSuggestions = async (text: string) => {
    if (!text.trim() || text.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const data = await geocodeSearch(text); // Uses optimized cached service
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch (err) {
      console.log('Suggestions error:', err);
    }
  };

  // Handle query change with debounce for suggestions
  const handleQueryChange = (text: string) => {
    setQuery(text);
    
    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Debounce suggestions fetch (300ms)
    searchTimeout.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 300);
  };

  // Select a suggestion
  const selectSuggestion = (suggestion: any) => {
    setQuery(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
    // Trigger search with selected place
    searchPlacesNear(suggestion.lat, suggestion.lon, suggestion.display_name);
  };

  const loadNearbyPlaces = async () => {
    try {
      setLoading(true);
      setError('Finding places near you...');
      const { coords } = await Location.getCurrentPositionAsync({});
      const query = overpassNearbyQuery(coords.latitude, coords.longitude);
      const res = await fetch(OVERPASS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!res.ok) {
        setError('Failed to load places from OpenStreetMap.');
        setPlaces([]);
        return;
      }
      const data = await res.json();
      // Map Overpass results to place objects
      const results = (data.elements || []).map((el: any) => ({
        id: el.id,
        name: el.tags?.name || el.tags?.amenity || 'Unknown',
        lat: el.lat || el.center?.lat,
        lon: el.lon || el.center?.lon,
        category: el.tags?.amenity || 'Place',
        address: el.tags?.address || '',
      }));
      setPlaces(results);
    } catch (err: any) {
      console.log('Load error:', err.message);
      setError('Failed to load nearby places');
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  const searchPlaces = async () => {
    if (!query.trim()) return;
    setShowSuggestions(false);
    try {
      setLoading(true);
      setError('');

      console.log('\n=== SEARCHING:', query, '===');

      // Check if query is vague (e.g., "temples in kochi", "hotels in dubai")
      const categoryMatch = parseCategoryQuery(query);
      
      if (categoryMatch) {
        // Handle category-based search
        console.log('📍 Category search detected:', categoryMatch);
        await searchByCategory(categoryMatch.category, categoryMatch.location);
      } else {
        // Handle general location search
        await searchByLocation(query);
      }
    } catch (err: any) {
      console.log('❌ Search error:', err.message);
      setError('Search failed. Check internet connection.');
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  // Parse queries like "temples in kochi", "hotels near dubai"
  const parseCategoryQuery = (text: string) => {
    const patterns = [
      /(.+?)\s+in\s+(.+)/i,      // "temples in kochi"
      /(.+?)\s+near\s+(.+)/i,    // "hotels near dubai"
      /(.+?)\s+at\s+(.+)/i,      // "restaurants at paris"
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          category: match[1].trim(),
          location: match[2].trim(),
        };
      }
    }
    return null;
  };

  // Map search terms to OpenStreetMap tags
  const getCategoryTags = (category: string): string[] => {
    const lower = category.toLowerCase();
    const categoryMap: { [key: string]: string[] } = {
      // Religious places
      'temple': ['["amenity"="place_of_worship"]["religion"="hindu"]', '["amenity"="place_of_worship"]["religion"="buddhist"]'],
      'temples': ['["amenity"="place_of_worship"]["religion"="hindu"]', '["amenity"="place_of_worship"]["religion"="buddhist"]'],
      'church': ['["amenity"="place_of_worship"]["religion"="christian"]'],
      'churches': ['["amenity"="place_of_worship"]["religion"="christian"]'],
      'mosque': ['["amenity"="place_of_worship"]["religion"="muslim"]'],
      'mosques': ['["amenity"="place_of_worship"]["religion"="muslim"]'],
      'shrine': ['["amenity"="place_of_worship"]'],
      
      // Accommodation
      'hotel': ['["tourism"="hotel"]'],
      'hotels': ['["tourism"="hotel"]'],
      'hostel': ['["tourism"="hostel"]'],
      'resort': ['["tourism"="hotel"]'],
      
      // Food & Drink
      'restaurant': ['["amenity"="restaurant"]'],
      'restaurants': ['["amenity"="restaurant"]'],
      'cafe': ['["amenity"="cafe"]'],
      'cafes': ['["amenity"="cafe"]'],
      'bar': ['["amenity"="bar"]'],
      'food': ['["amenity"="restaurant"]', '["amenity"="fast_food"]'],
      
      // Attractions
      'museum': ['["tourism"="museum"]'],
      'museums': ['["tourism"="museum"]'],
      'attraction': ['["tourism"="attraction"]'],
      'attractions': ['["tourism"="attraction"]'],
      'monument': ['["historic"="monument"]'],
      'park': ['["leisure"="park"]'],
      'beach': ['["natural"="beach"]'],
      
      // Services
      'shop': ['["shop"]'],
      'mall': ['["shop"="mall"]'],
      'hospital': ['["amenity"="hospital"]'],
      'bank': ['["amenity"="bank"]'],
    };

    // Try exact match first
    if (categoryMap[lower]) {
      return categoryMap[lower];
    }

    // Try partial matches
    for (const [key, tags] of Object.entries(categoryMap)) {
      if (lower.includes(key) || key.includes(lower)) {
        return tags;
      }
    }

    // Default: search for tourism and amenity
    return ['["tourism"]', '["amenity"]'];
  };

  // Search by category near a location (OPTIMIZED)
  const searchByCategory = async (category: string, location: string) => {
    // Geocode the location using optimized cached service
    const result = await geocodeLocation(location);
    
    if (!result) {
      setError(`Cannot find "${location}". Try a different location.`);
      setPlaces([]);
      return;
    }

    const { lat, lon } = result;
    console.log(`✅ Found ${location} at (${lat}, ${lon})`);
    setError(`Searching for ${category} in ${location}...`);

    // Get category tags
    const tags = getCategoryTags(category);
    console.log(`🔍 Searching for ${category} using tags:`, tags);

    // Build Overpass query - optimized for speed
    const radius = 10000; // 10km radius (faster queries)
    const tagQueries = tags.map(tag => `node${tag}(around:${radius},${lat},${lon});`).join('\n      ');
    
    const overpassQuery = `
      [out:json][timeout:15];
      (
        ${tagQueries}
      );
      out body 50;
    `;

    const res = await fetch(OVERPASS_API, {
      method: 'POST',
      body: overpassQuery,
    });

    if (!res.ok) {
      setError('Failed to search places.');
      setPlaces([]);
      return;
    }

    const data = await res.json();
    console.log(`✅ Found ${data.elements?.length || 0} ${category}`);

    if (!data.elements || data.elements.length === 0) {
      setError(`No ${category} found near ${location}.`);
      setPlaces([]);
      return;
    }

    const formattedPlaces = formatOverpassData(data.elements, lat, lon);
    setPlaces(formattedPlaces);
  };

  // Search by general location (OPTIMIZED)
  const searchByLocation = async (location: string) => {
    const data = await geocodeSearch(location); // Uses optimized cached service
    
    if (!data || data.length === 0) {
      setError('Search failed.');
      setPlaces([]);
      return;
    }
    
    const results = (data || []).map((el: any) => ({
      id: el.place_id,
      name: el.display_name.split(',')[0],
      lat: el.lat,
      lon: el.lon,
      category: el.type || 'Place',
      address: el.display_name,
      description: el.type ? `${el.type} in ${el.address?.city || el.address?.country || 'this area'}` : '',
    }));
    setPlaces(results);
  };

  // Search places near a specific location
  const searchPlacesNear = async (lat: number, lon: number, placeName: string) => {
    try {
      setLoading(true);
      setError(`Loading places near ${placeName}...`);
      const query = overpassNearbyQuery(lat, lon);
      const res = await fetch(OVERPASS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!res.ok) {
        setError('Search failed.');
        setPlaces([]);
        return;
      }
      const data = await res.json();
      // Map Overpass results to place objects
      const results = (data.elements || []).map((el: any) => ({
        id: el.id,
        name: el.tags?.name || el.tags?.amenity || 'Unknown',
        lat: el.lat || el.center?.lat,
        lon: el.lon || el.center?.lon,
        category: el.tags?.amenity || 'Place',
        address: el.tags?.address || '',
      }));
      setPlaces(results);
    } catch (err: any) {
      console.log('❌ Search error:', err.message);
      setError('Search failed.');
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  // Format Overpass API data to match our UI structure
  const formatOverpassData = (elements: any[], userLat: number, userLon: number) => {
    return elements
      .filter(elem => elem.tags && elem.tags.name) // Only items with names
      .map((elem) => {
        const tags = elem.tags || {};
        
        // Calculate distance
        const distance = calculateDistance(userLat, userLon, elem.lat, elem.lon);
        
        // Determine category from tags
        const category = tags.amenity || tags.tourism || tags.shop || tags.leisure || tags.historic || 'Place';
        
        // Extract description from available tags
        const description = 
          tags.description || 
          tags['description:en'] ||
          tags.note ||
          (tags.religion ? `${formatCategory(category)} - ${tags.religion}` : '') ||
          (tags.denomination ? `${tags.denomination} ${formatCategory(category)}` : '') ||
          (tags.cuisine ? `${tags.cuisine} cuisine` : '') ||
          formatCategory(category);
        
        // Build full address
        const addressParts = [
          tags['addr:street'],
          tags['addr:city'],
          tags['addr:state'],
        ].filter(Boolean);
        const fullAddress = addressParts.length > 0 
          ? addressParts.join(', ') 
          : tags['addr:full'] || '';
        
        return {
          id: elem.id.toString(),
          name: tags.name,
          lat: elem.lat,
          lon: elem.lon,
          category: formatCategory(category),
          distance: distance,
          address: fullAddress,
          description: description,
          website: tags.website || tags['contact:website'],
          phone: tags.phone || tags['contact:phone'],
          openingHours: tags.opening_hours,
          wikipedia: tags.wikipedia || tags['wikipedia:en'],
          type: elem.type,
          tags: tags,
        };
      })
      .sort((a, b) => a.distance - b.distance); // Sort by distance
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // Format category names to be more readable
  const formatCategory = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      'restaurant': 'Restaurant',
      'cafe': 'Café',
      'bar': 'Bar',
      'fast_food': 'Fast Food',
      'hotel': 'Hotel',
      'hostel': 'Hostel',
      'museum': 'Museum',
      'attraction': 'Attraction',
      'viewpoint': 'Viewpoint',
      'park': 'Park',
      'garden': 'Garden',
      'shop': 'Shop',
      'supermarket': 'Supermarket',
      'bank': 'Bank',
      'hospital': 'Hospital',
      'pharmacy': 'Pharmacy',
      'place_of_worship': 'Place of Worship',
      'monument': 'Monument',
      'memorial': 'Memorial',
      'beach': 'Beach',
      'artwork': 'Artwork',
    };
    return categoryMap[category] || category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <View style={styles.container}>
      {/* HEADER + SEARCH */}
      <View style={styles.searchHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            value={query}
            onChangeText={handleQueryChange}
            placeholder="Search places, hotels, temples..."
            placeholderTextColor="#64748B"
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={searchPlaces}
            onFocus={() => {
              if (query.trim().length >= 2 && suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
          />
        </View>
      </View>

      {/* SUGGESTIONS DROPDOWN */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionItem}
              onPress={() => selectSuggestion(suggestion)}
            >
              <MapPin size={16} color="#94A3B8" />
              <View style={styles.suggestionText}>
                <Text style={styles.suggestionName} numberOfLines={1}>
                  {suggestion.name || suggestion.display_name.split(',')[0]}
                </Text>
                <Text style={styles.suggestionAddress} numberOfLines={1}>
                  {suggestion.display_name}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.title}>
        {query ? `Results for "${query}"` : 'Places near you'}
      </Text>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : places.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            {query ? 'No places found. Try another search.' : 'Search for a place or city'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          onScrollBeginDrag={() => setShowSuggestions(false)}
          renderItem={({ item }) => {
            // OpenStreetMap data structure
            const image = null; // OSM doesn't provide images directly

            const category = item.category || 'Place';
            const distance = item.distance ? `${item.distance.toFixed(1)}km away` : '';

            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('MapMain', { selectedPlace: item })
                }
              >
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>

                  <View style={styles.row}>
                    <Text style={styles.category}>{category}</Text>
                  </View>

                  {item.description && (
                    <Text style={styles.description} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}

                  {distance && (
                    <View style={styles.row}>
                      <MapPin size={14} color="#94A3B8" />
                      <Text style={styles.meta}>{distance}</Text>
                    </View>
                  )}

                  {item.address && (
                    <Text style={styles.address} numberOfLines={1}>
                      {item.address}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* SOS */}
      <TouchableOpacity style={styles.sos}>
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
    paddingTop: 60,
    paddingHorizontal: 16,
  },

  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
  },

  errorText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },

  errorHint: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },

  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },

  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
  },

  suggestionsContainer: {
    backgroundColor: '#111827',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E3A8A',
    overflow: 'hidden',
  },

  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },

  suggestionText: {
    flex: 1,
  },

  suggestionName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },

  suggestionAddress: {
    color: '#94A3B8',
    fontSize: 13,
  },

  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 14,
  },

  card: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },

  image: {
    width: 88,
    height: 88,
    borderRadius: 14,
  },

  info: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },

  name: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  category: {
    color: '#64748B',
    fontSize: 12,
    marginLeft: 4,
  },

  description: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },

  meta: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },

  address: {
    color: '#64748B',
    fontSize: 12,
  },

  sos: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },

  sosText: {
    color: '#FFF',
    fontWeight: '700',
  },
});
