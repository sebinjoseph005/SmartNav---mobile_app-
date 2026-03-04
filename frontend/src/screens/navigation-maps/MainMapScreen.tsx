import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
} from 'react-native';
import SafeMapView from '../../components/SafeMapView';
import { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Search, X, Navigation, MapPin, ThumbsUp, Shield, Zap, Car, Bike, PersonStanding, Wifi, WifiOff, AlertTriangle } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { geocodeLocation, searchPlaces } from '../../services/placesService';
import {
  calculateRouteWithTraffic,
  getTrafficIncidents,
  getTrafficFlow,
  getTrafficColor,
  getIncidentIcon,
  TrafficIncident,
  TrafficFlowSegment
} from '../../services/tomtomService';

const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImM5ZWJlMTk1ZDk3MjQ3NzI4MWU1Njc0ZmEwYzlhOGYwIiwiaCI6Im11cm11cjY0In0=';
const ORS_DIRECTIONS_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';
const OSRM_DIRECTIONS_URL = 'https://router.project-osrm.org/route/v1/driving';

// Geocoding cache for faster lookups
const geocodeCache = new Map<string, { lat: number; lon: number; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export default function MainMapScreen() {
  const mapRef = useRef<SafeMapView>(null);
  const navigation = useNavigation();
  const route = useRoute<any>();
  const searchTimeout = useRef<any>(null);

  const [userLocation, setUserLocation] = useState<any>(null);
  const [startLocationText, setStartLocationText] = useState('');
  const [startLocationCoords, setStartLocationCoords] = useState<any>(null);
  const [destinationText, setDestinationText] = useState('');
  const [destinationCoords, setDestinationCoords] = useState<any>(null);
  const [routeCoords, setRouteCoords] = useState<any[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeField, setActiveField] = useState<'start' | 'destination'>('destination');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [travelTimes, setTravelTimes] = useState<any>(null);
  const [selectedMode, setSelectedMode] = useState<'driving' | 'cycling' | 'foot'>('driving');
  const [routes, setRoutes] = useState<{
    driving: { coords: any[]; distance: number; duration: number } | null;
    cycling: { coords: any[]; distance: number; duration: number } | null;
    foot: { coords: any[]; distance: number; duration: number } | null;
  }>({ driving: null, cycling: null, foot: null });
  const [trafficIncidents, setTrafficIncidents] = useState<TrafficIncident[]>([]);
  const [trafficFlow, setTrafficFlow] = useState<TrafficFlowSegment[]>([]);
  const [showTrafficLayer, setShowTrafficLayer] = useState(true);
  const [useTomTomRouting, setUseTomTomRouting] = useState(true);

  /* ---------------- CLOSE ROUTE POPUP ---------------- */
  const closeRoutePopup = () => {
    setRouteInfo(null);
    setRouteCoords([]);
    setDestinationCoords(null);
    setTravelTimes(null);
    setSelectedMode('driving');
    setRoutes({ driving: null, cycling: null, foot: null });
    setStartLocationText('');
    setStartLocationCoords(null);
    setTrafficIncidents([]);
    setTrafficFlow([]);
  };

  /* ---------------- GET USER LOCATION & NETWORK STATUS ---------------- */
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    })();

    // Monitor network connectivity
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
      if (!state.isConnected) {
        setSearchError('No internet connection');
      } else {
        setSearchError(null);
      }
    });

    // Cleanup timeout on unmount
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      unsubscribe();
    };
  }, []);

  /* ---------------- HANDLE INCOMING DESTINATION FROM SAFE HAVEN ---------------- */
  useEffect(() => {
    if (route.params?.destination && route.params?.startNavigation && userLocation) {
      const { destination } = route.params;
      console.log('🛡️ Safe Haven destination received:', destination);

      // Set destination
      setDestinationText(destination.name || 'Safe Place');
      setDestinationCoords({
        latitude: destination.latitude,
        longitude: destination.longitude,
      });

      // Set start location to user's current location
      setStartLocationCoords(userLocation);
      setStartLocationText('Current Location');

      // Auto calculate route
      setTimeout(() => {
        searchWithCoords(
          userLocation,
          { latitude: destination.latitude, longitude: destination.longitude },
          destination.name || 'Safe Place'
        );
      }, 500);
    }
  }, [route.params, userLocation]);

  /* ---------------- FORMAT TIME ---------------- */
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${mins}min`;
  };

  /* ---------------- FETCH SUGGESTIONS (OPTIMIZED FOR SLOW NETWORKS) ---------------- */
  const fetchSuggestions = async (text: string) => {
    if (!text.trim() || text.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    if (!isOnline) {
      setSearchError('No internet connection');
      setSuggestions([]);
      setSearchLoading(false);
      return;
    }

    try {
      console.log('🔍 Fetching suggestions for:', text);
      setSearchLoading(true);
      setSearchError(null);

      const data = await searchPlaces(text); // Uses cached searchPlaces with timeout & retry

      if (data && data.length > 0) {
        console.log('✅ Got', data.length, 'suggestions');
        setSuggestions(data);
        setShowSuggestions(true);
        setSearchError(null);
      } else {
        console.warn('⚠️ No suggestions returned');
        setSuggestions([]);
        setShowSuggestions(false);
        setSearchError('No places found');
      }
    } catch (err: any) {
      console.error('❌ Suggestions fetch failed:', err);
      setSuggestions([]);
      setShowSuggestions(false);

      if (err.message?.includes('timeout')) {
        setSearchError('Network too slow - try again');
      } else {
        setSearchError('Search failed - check connection');
      }
    } finally {
      setSearchLoading(false);
    }
  };

  /* ---------------- HANDLE QUERY CHANGE (OPTIMIZED DEBOUNCE FOR SLOW NETWORKS) ---------------- */
  const handleQueryChange = (text: string) => {
    if (activeField === 'destination') {
      setDestinationText(text);
    } else {
      setStartLocationText(text);
    }

    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Longer debounce for slow networks (900ms) - reduces API spam and respects ORS rate limits
    searchTimeout.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 900);
  };

  /* ---------------- CALCULATE TRAVEL TIMES ---------------- */
  const calculateTravelTimes = (distanceMeters: number, drivingMinutes: number) => {
    const distanceKm = distanceMeters / 1000;

    // Cycling: average 15 km/h
    const cyclingMinutes = Math.round((distanceKm / 15) * 60);

    // Walking: average 5 km/h
    const walkingMinutes = Math.round((distanceKm / 5) * 60);

    return {
      driving: drivingMinutes,
      cycling: cyclingMinutes,
      foot: walkingMinutes,
    };
  };

  /* ---------------- FETCH TRAFFIC DATA ---------------- */
  const fetchTrafficData = async (
    routeCoords: { latitude: number; longitude: number }[],
    start: { latitude: number; longitude: number },
    dest: { latitude: number; longitude: number }
  ) => {
    try {
      console.log('🚦 Fetching traffic data...');

      // Calculate tighter bounding box - only 0.02 degrees (~2km) buffer
      const lats = routeCoords.map(c => c.latitude);
      const lons = routeCoords.map(c => c.longitude);
      const bbox = {
        minLat: Math.min(...lats) - 0.02,
        minLon: Math.min(...lons) - 0.02,
        maxLat: Math.max(...lats) + 0.02,
        maxLon: Math.max(...lons) + 0.02,
      };

      // Fetch traffic incidents (fast, single call)
      const incidents = await getTrafficIncidents(bbox);

      // Filter incidents to only those very close to the route (within ~500m)
      const nearbyIncidents = incidents.filter(incident => {
        return routeCoords.some(coord => {
          const distance = getDistance(
            { latitude: incident.latitude, longitude: incident.longitude },
            coord
          );
          return distance < 0.5; // within 500 meters
        });
      });

      setTrafficIncidents(nearbyIncidents);
      console.log(`✅ Found ${nearbyIncidents.length} incidents near route (${incidents.length} total in area)`);

      // Fetch traffic flow data for route segments
      const flowData = await getTrafficFlow(routeCoords);
      setTrafficFlow(flowData);
      console.log(`✅ Fetched traffic flow for ${flowData.length} segments`);
    } catch (error) {
      console.error('❌ Error fetching traffic data:', error);
      // Don't block route display if traffic fails
    }
  };

  // Helper: Calculate distance between two points in km
  const getDistance = (
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.latitude * Math.PI) / 180) *
      Math.cos((point2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  /* ---------------- SELECT SUGGESTION ---------------- */
  const selectSuggestion = (suggestion: any) => {
    // Special case: "Your Location" suggestion
    if (suggestion.isCurrentLocation) {
      setStartLocationText('Your Location');
      setStartLocationCoords(null); // null means use current GPS
      if (destinationCoords) {
        searchWithCoords(userLocation, destinationCoords, destinationText);
      }
      setShowSuggestions(false);
      setSuggestions([]);
      return;
    }

    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);

    console.log('📍 Selected place:', suggestion.display_name, 'Coords:', lat, lon);

    if (activeField === 'destination') {
      setDestinationText(suggestion.display_name);
      setDestinationCoords({ latitude: lat, longitude: lon });
      // If we have start location, calculate route immediately
      const startCoords = startLocationCoords || userLocation;
      if (startCoords) {
        console.log('🚀 Calculating route from', startCoords, 'to', { latitude: lat, longitude: lon });
        searchWithCoords(startCoords, { latitude: lat, longitude: lon }, suggestion.display_name);
      } else {
        console.warn('⚠️ No start location available yet');
      }
    } else {
      setStartLocationText(suggestion.display_name);
      setStartLocationCoords({ latitude: lat, longitude: lon });
      // If we have destination, recalculate route
      if (destinationCoords) {
        searchWithCoords({ latitude: lat, longitude: lon }, destinationCoords, destinationText);
      }
    }

    setShowSuggestions(false);
    setSuggestions([]);
  };

  /* ---------------- SEARCH WITH COORDINATES ---------------- */
  const searchWithCoords = async (start: any, dest: any, placeName: string) => {
    setLoading(true);
    setSearchOpen(false);

    console.log('🗺️ Fetching route...', {
      start: start,
      dest: dest,
      placeName: placeName
    });

    try {
      setDestinationCoords(dest);

      /* 2️⃣ FETCH ROUTE - Try ORS, fallback to OSRM */
      let routeData;
      let serviceUsed = 'unknown';

      // Try ORS first (better quality, but may have network issues)
      try {
        console.log('📡 Trying ORS API...', `${ORS_DIRECTIONS_URL}`);

        const routeRes = await fetch(ORS_DIRECTIONS_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': ORS_API_KEY,
          },
          body: JSON.stringify({
            coordinates: [
              [start.longitude, start.latitude],
              [dest.longitude, dest.latitude],
            ],
            geometry_simplify: false,
            geometry_format: 'geojson',
          }),
        });

        if (routeRes.ok) {
          routeData = await routeRes.json();
          serviceUsed = 'ORS';
          console.log('✅ ORS route received');
          console.log('📊 ORS response structure:', {
            hasFeatures: !!routeData.features,
            hasRoutes: !!routeData.routes,
            topLevelKeys: Object.keys(routeData).join(', ')
          });
        } else {
          const errorText = await routeRes.text();
          console.warn('⚠️ ORS error response (fallback to OSRM):', errorText.substring(0, 200));
          throw new Error(`ORS failed: ${routeRes.status}`);
        }
      } catch (orsError: any) {
        console.warn('⚠️ ORS failed, trying OSRM...', orsError.message);

        // Fallback to OSRM (free, no API key, GET request)
        try {
          const osrmUrl = `${OSRM_DIRECTIONS_URL}/${start.longitude},${start.latitude};${dest.longitude},${dest.latitude}?overview=full&geometries=geojson&steps=true`;
          console.log('📡 Calling OSRM API...');

          const osrmRes = await fetch(osrmUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          });

          if (!osrmRes.ok) {
            throw new Error(`OSRM failed: ${osrmRes.status}`);
          }

          const osrmData = await osrmRes.json();

          console.log('📊 OSRM raw response:', {
            code: osrmData.code,
            hasRoutes: !!osrmData.routes,
            routesLength: osrmData.routes?.length,
            firstRouteKeys: osrmData.routes?.[0] ? Object.keys(osrmData.routes[0]).join(', ') : 'N/A'
          });

          if (osrmData.code !== 'Ok' || !osrmData.routes || osrmData.routes.length === 0) {
            throw new Error('OSRM returned no routes');
          }

          // Convert OSRM format to ORS-like format for consistency
          const osrmRoute = osrmData.routes[0];

          console.log('📊 OSRM route geometry type:', osrmRoute.geometry?.type);
          console.log('📊 OSRM route has coordinates:', !!osrmRoute.geometry?.coordinates);
          console.log('📊 OSRM route coordinates count:', osrmRoute.geometry?.coordinates?.length);

          routeData = {
            routes: [{
              geometry: osrmRoute.geometry,
              summary: {
                distance: osrmRoute.distance,
                duration: osrmRoute.duration,
              },
              segments: osrmRoute.legs,
            }]
          };

          serviceUsed = 'OSRM';
          console.log('✅ OSRM route received and converted');
        } catch (osrmError: any) {
          console.error('❌ Both ORS and OSRM failed:', osrmError.message);
          Alert.alert('Route Error', 'Could not calculate route. Please check your internet connection.');
          setLoading(false);
          return;
        }
      }

      console.log(`✅ Route from ${serviceUsed}:`, JSON.stringify(routeData).substring(0, 300) + '...');

      if (!routeData) {
        console.error('❌ Route data is null/undefined');
        Alert.alert('No Route Found', 'Could not find a route to this destination.');
        setLoading(false);
        return;
      }

      // Parse route data (handle both ORS features and routes format)
      let route;
      let summary;

      if (routeData.features && routeData.features.length > 0) {
        // GeoJSON features format (ORS sometimes uses this)
        console.log('📊 Parsing as GeoJSON features format');
        route = routeData.features[0];
        summary = route.properties?.summary;
      } else if (routeData.routes && routeData.routes.length > 0) {
        // Standard routes format (ORS/OSRM)
        console.log('📊 Parsing as routes format');
        route = routeData.routes[0];
        summary = route.summary;
      } else {
        console.error('❌ Unexpected route data structure:', {
          hasFeatures: !!routeData.features,
          featuresLength: routeData.features?.length,
          hasRoutes: !!routeData.routes,
          routesLength: routeData.routes?.length,
          keys: Object.keys(routeData)
        });
        Alert.alert('No Route Found', 'Invalid route data received from mapping service.');
        setLoading(false);
        return;
      }

      // Validate route geometry exists
      if (!route.geometry) {
        console.error('❌ Route missing geometry:', route);
        Alert.alert('Route Error', 'Route geometry is missing.');
        setLoading(false);
        return;
      }

      console.log('📊 Geometry structure:', {
        type: route.geometry.type,
        hasCoordinates: !!route.geometry.coordinates,
        isString: typeof route.geometry === 'string',
        geometryKeys: typeof route.geometry === 'object' ? Object.keys(route.geometry).join(', ') : 'N/A'
      });

      // Handle different geometry formats
      let coords;
      if (route.geometry.coordinates && Array.isArray(route.geometry.coordinates)) {
        // GeoJSON LineString format: coordinates is array of [lon, lat] pairs
        console.log('📍 Using GeoJSON coordinates, count:', route.geometry.coordinates.length);
        coords = route.geometry.coordinates.map((c: number[]) => ({
          latitude: c[1],
          longitude: c[0],
        }));
      } else if (typeof route.geometry === 'string' || (route.geometry && !route.geometry.coordinates)) {
        // Encoded polyline format - try to get it from OSRM instead
        console.warn('⚠️ Received encoded polyline, falling back to OSRM...');

        // Retry with OSRM which always returns GeoJSON
        try {
          const osrmUrl = `${OSRM_DIRECTIONS_URL}/${start.longitude},${start.latitude};${dest.longitude},${dest.latitude}?overview=full&geometries=geojson`;
          const osrmRes = await fetch(osrmUrl);
          const osrmData = await osrmRes.json();

          if (osrmData.code === 'Ok' && osrmData.routes && osrmData.routes.length > 0) {
            const osrmRoute = osrmData.routes[0];
            coords = osrmRoute.geometry.coordinates.map((c: number[]) => ({
              latitude: c[1],
              longitude: c[0],
            }));
            summary = {
              distance: osrmRoute.distance,
              duration: osrmRoute.duration,
            };
            console.log('✅ Using OSRM fallback coordinates');
          } else {
            throw new Error('OSRM fallback failed');
          }
        } catch (fallbackError) {
          console.error('❌ OSRM fallback failed:', fallbackError);
          Alert.alert('Route Error', 'Could not decode route. Please try again.');
          setLoading(false);
          return;
        }
      } else {
        console.error('❌ Unknown geometry format:', route.geometry);
        Alert.alert('Route Error', 'Unknown route geometry format.');
        setLoading(false);
        return;
      }

      if (!coords || coords.length === 0) {
        console.error('❌ No coordinates parsed from route');
        Alert.alert('Route Error', 'Failed to parse route coordinates.');
        setLoading(false);
        return;
      }

      if (!summary || !summary.distance || !summary.duration) {
        console.error('❌ Route missing summary data:', summary);
        Alert.alert('Route Error', 'Route summary information is missing.');
        setLoading(false);
        return;
      }
      const drivingMinutes = Math.round(summary.duration / 60);

      setRouteCoords(coords);
      setRouteInfo({
        distance: summary.distance,
        duration: summary.duration,
      });

      // Calculate travel times for all modes
      const times = calculateTravelTimes(summary.distance, drivingMinutes);
      setTravelTimes(times);

      // Store routes (using same path for all modes - only times differ)
      setRoutes({
        driving: {
          coords: coords,
          distance: summary.distance,
          duration: summary.duration,
        },
        cycling: {
          coords: coords,
          distance: summary.distance,
          duration: times.cycling * 60,
        },
        foot: {
          coords: coords,
          distance: summary.distance,
          duration: times.foot * 60,
        },
      });

      console.log('🎯 Travel Times', {
        driving: `${times.driving} min`,
        cycling: `${times.cycling} min`,
        walking: `${times.foot} min`,
        distance: `${(summary.distance / 1000).toFixed(1)} km`,
      });

      // Fetch traffic data for the route
      if (showTrafficLayer && coords.length > 0) {
        fetchTrafficData(coords, start, dest);
      }

      /* FIT MAP */
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          [start, dest],
          {
            edgePadding: { top: 150, bottom: 350, left: 60, right: 60 },
            animated: true,
          }
        );
      }, 100);
    } catch (e: any) {
      console.error('❌ Route error:', e);
      console.error('Error details:', e.message, e.stack);
      Alert.alert('Route Error', e.message || 'Failed to calculate route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- USE CURRENT LOCATION ---------------- */
  const useCurrentLocation = () => {
    setStartLocationText('Your Location');
    setStartLocationCoords(null);
    setShowSuggestions(false);
    if (destinationCoords && userLocation) {
      searchWithCoords(userLocation, destinationCoords, destinationText);
    }
  };

  /* ---------------- SEARCH PLACE (OPTIMIZED WITH CACHE) ---------------- */
  const handleSearch = async () => {
    const searchText = activeField === 'destination' ? destinationText : startLocationText;

    if (!searchText.trim() || searchText === 'Your Location') {
      return;
    }

    setLoading(true);
    setShowSuggestions(false);

    try {
      console.log('🔍 Searching for:', searchText);

      /* 1️⃣ GEOCODE WITH CACHE */
      const cacheKey = searchText.toLowerCase().trim();
      const cached = geocodeCache.get(cacheKey);

      let lat: number, lon: number;

      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('✅ Using cached result for:', searchText);
        lat = cached.lat;
        lon = cached.lon;
      } else {
        const result = await geocodeLocation(searchText);

        if (!result) {
          Alert.alert('Place Not Found', 'Could not find the location. Try a different search term.');
          setLoading(false);
          return;
        }

        lat = result.lat;
        lon = result.lon;

        // Cache the result
        geocodeCache.set(cacheKey, { lat, lon, timestamp: Date.now() });
      }

      console.log('📍 Found location:', { lat, lon });

      if (activeField === 'destination') {
        setDestinationCoords({ latitude: lat, longitude: lon });
        const startCoords = startLocationCoords || userLocation;
        if (startCoords) {
          await searchWithCoords(startCoords, { latitude: lat, longitude: lon }, searchText);
        }
      } else {
        setStartLocationCoords({ latitude: lat, longitude: lon });
        if (destinationCoords) {
          await searchWithCoords({ latitude: lat, longitude: lon }, destinationCoords, destinationText);
        }
      }

      setSearchOpen(false);
    } catch (e: any) {
      console.error('❌ Search error:', e);
      Alert.alert('Search Error', e.message || 'Failed to find location. Please try again.');
      setLoading(false);
    }
  };

  /* ---------------- CLEAR ROUTE ---------------- */
  const clearRoute = () => {
    setRouteCoords([]);
    setDestinationCoords(null);
    setDestinationText('');
    setRouteInfo(null);
    setTravelTimes(null);
    setSelectedMode('driving');
    setRoutes({ driving: null, cycling: null, foot: null });
    setStartLocationText('');
    setStartLocationCoords(null);
    setTrafficIncidents([]);
    setTrafficFlow([]);
  };

  /* ---------------- START NAVIGATION ---------------- */
  const startNavigation = async () => {
    if (!destinationCoords || !routeInfo || !userLocation) return;

    // Fetch detailed route with steps for turn-by-turn navigation
    try {
      const start = startLocationCoords || userLocation;
      let routeData;

      // Try ORS first for turn-by-turn directions
      try {
        console.log('📡 Fetching turn-by-turn from ORS...');
        const routeRes = await fetch(ORS_DIRECTIONS_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': ORS_API_KEY,
          },
          body: JSON.stringify({
            coordinates: [
              [start.longitude, start.latitude],
              [destinationCoords.longitude, destinationCoords.latitude],
            ],
            instructions: true,
          }),
        });

        if (routeRes.ok) {
          routeData = await routeRes.json();
          console.log('✅ ORS navigation data received');
        } else {
          throw new Error(`ORS failed: ${routeRes.status}`);
        }
      } catch (orsError) {
        console.warn('⚠️ ORS failed for navigation, using OSRM...');

        // Fallback to OSRM with steps
        const osrmUrl = `${OSRM_DIRECTIONS_URL}/${start.longitude},${start.latitude};${destinationCoords.longitude},${destinationCoords.latitude}?overview=full&geometries=geojson&steps=true`;
        const osrmRes = await fetch(osrmUrl);

        if (!osrmRes.ok) {
          throw new Error('Failed to get navigation directions');
        }

        const osrmData = await osrmRes.json();

        if (osrmData.code !== 'Ok' || !osrmData.routes || osrmData.routes.length === 0) {
          throw new Error('No navigation route found');
        }

        // Convert OSRM format
        routeData = {
          routes: [{
            segments: osrmData.routes[0].legs,
          }]
        };
      }

      // Handle both formats
      let steps;
      if (routeData.features && routeData.features.length > 0) {
        steps = routeData.features[0].properties.segments[0].steps;
      } else if (routeData.routes && routeData.routes.length > 0) {
        steps = routeData.routes[0].segments[0].steps;
      } else {
        Alert.alert('Error', 'Invalid navigation data received');
        return;
      }

      // Navigate to ActiveNavigation screen with detailed route data
      (navigation as any).navigate('ActiveNavigation', {
        destination: {
          name: destinationText,
          coordinates: destinationCoords,
        },
        route: {
          coordinates: routeCoords,
          distance: routeInfo.distance,
          duration: routeInfo.duration,
          steps: steps, // Turn-by-turn instructions
        },
        startLocation: start,
      });
    } catch (error) {
      console.error('Navigation start error:', error);
      Alert.alert('Error', 'Failed to start navigation');
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <View style={styles.container}>
      <SafeMapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        showsUserLocation
        initialRegion={{
          latitude: userLocation?.latitude || 9.9312,
          longitude: userLocation?.longitude || 76.2673,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {startLocationCoords && (
          <Marker coordinate={startLocationCoords} title={startLocationText}>
            <View style={styles.startMarker}>
              <View style={styles.startMarkerDot} />
            </View>
          </Marker>
        )}

        {destinationCoords && (
          <Marker coordinate={destinationCoords} title={destinationText}>
            <MapPin size={32} color="#EF4444" fill="#EF4444" />
          </Marker>
        )}

        {/* MAIN ROUTE LINE */}
        {routeCoords.length > 0 && (
          <Polyline
            key={`route-${selectedMode}`}
            coordinates={routeCoords}
            strokeWidth={6}
            strokeColor={
              selectedMode === 'driving' ? '#3B82F6' :
                selectedMode === 'cycling' ? '#22C55E' :
                  '#F59E0B'
            }
            lineDashPattern={selectedMode === 'foot' ? [10, 10] : undefined}
          />
        )}

        {/* TRAFFIC FLOW OVERLAYS - drawn on top of route */}
        {showTrafficLayer && trafficFlow.map((segment, index) => {
          const trafficColor = getTrafficColor(segment.currentSpeed, segment.freeFlowSpeed);
          // Only show if there's actual congestion (not green)
          if (trafficColor !== '#10B981') {
            return (
              <Polyline
                key={`traffic-${index}`}
                coordinates={segment.coordinates}
                strokeWidth={8}
                strokeColor={trafficColor}
                lineCap="round"
                lineJoin="round"
              />
            );
          }
          return null;
        })}

        {/* TRAFFIC INCIDENTS */}
        {showTrafficLayer && trafficIncidents.map((incident) => (
          <Marker
            key={incident.id}
            coordinate={{ latitude: incident.latitude, longitude: incident.longitude }}
            title={incident.description}
            description={incident.from && incident.to ? `${incident.from} to ${incident.to}` : undefined}
          >
            <View style={styles.incidentMarker}>
              <Text style={styles.incidentIcon}>{getIncidentIcon(incident.iconCategory)}</Text>
            </View>
          </Marker>
        ))}
      </SafeMapView>

      {/* SEARCH BAR */}
      {searchOpen ? (
        <>
          {/* BACK BUTTON */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setSearchOpen(false);
              setShowSuggestions(false);
              setSuggestions([]);
            }}
          >
            <X size={24} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.searchContainer}>
            {/* START LOCATION */}
            <View style={[styles.searchBar, activeField === 'start' && styles.searchBarActive]}>
              <View style={styles.searchDot} />
              <TextInput
                placeholder="Your Location"
                placeholderTextColor="#64748B"
                style={styles.input}
                value={startLocationText}
                onChangeText={handleQueryChange}
                onFocus={() => {
                  setActiveField('start');
                  if (startLocationText.length === 0) {
                    setShowSuggestions(true);
                    setSuggestions([]);
                  }
                }}
                onSubmitEditing={handleSearch}
              />
              {startLocationText.length > 0 ? (
                <TouchableOpacity
                  onPress={() => {
                    setStartLocationText('');
                    setStartLocationCoords(null);
                    setShowSuggestions(true);
                  }}
                  style={styles.clearButton}
                >
                  <X size={16} color="#94A3B8" />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 16 }} />
              )}
            </View>

            {/* DIVIDER LINE */}
            <View style={styles.searchDivider} />

            {/* DESTINATION */}
            <View style={[styles.searchBar, styles.searchBarLast, activeField === 'destination' && styles.searchBarActive]}>
              <MapPin size={16} color="#EF4444" />
              <TextInput
                placeholder="Choose destination"
                placeholderTextColor="#64748B"
                style={styles.input}
                value={destinationText}
                onChangeText={handleQueryChange}
                onFocus={() => {
                  setActiveField('destination');
                  if (!destinationText.trim() && suggestions.length === 0) {
                    setShowSuggestions(false);
                  }
                }}
                onSubmitEditing={handleSearch}
                autoFocus
              />
              {destinationText.length > 0 ? (
                <TouchableOpacity
                  onPress={() => {
                    setDestinationText('');
                    setShowSuggestions(false);
                  }}
                  style={styles.clearButton}
                >
                  <X size={16} color="#94A3B8" />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 16 }} />
              )}
            </View>
          </View>

          {/* SUGGESTIONS DROPDOWN */}
          {showSuggestions && (activeField === 'start' && startLocationText.length === 0 ? true : suggestions.length > 0) && (
            <View style={styles.suggestionsContainer}>
              {/* Show "Your Location" for empty start field */}
              {activeField === 'start' && startLocationText.length === 0 && (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={useCurrentLocation}
                >
                  <Navigation size={16} color="#3B82F6" />
                  <View style={styles.suggestionText}>
                    <Text style={styles.suggestionName}>Your Location</Text>
                    <Text style={styles.suggestionAddress}>Use current GPS location</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Loading indicator */}
              {searchLoading && (
                <View style={styles.suggestionItem}>
                  <ActivityIndicator size="small" color="#3B82F6" />
                  <Text style={styles.suggestionAddress}>Searching...</Text>
                </View>
              )}

              {/* Error message */}
              {searchError && !searchLoading && (
                <View style={styles.suggestionItem}>
                  {isOnline ? (
                    <Wifi size={16} color="#F59E0B" />
                  ) : (
                    <WifiOff size={16} color="#EF4444" />
                  )}
                  <Text style={styles.suggestionError}>{searchError}</Text>
                </View>
              )}

              {/* Regular suggestions */}
              {suggestions.length > 0 && !searchLoading && (
                <FlatList
                  data={suggestions}
                  keyExtractor={(item, index) => `${item.place_id}-${index}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.suggestionItem}
                      onPress={() => selectSuggestion(item)}
                    >
                      <MapPin size={16} color="#94A3B8" />
                      <View style={styles.suggestionText}>
                        <Text style={styles.suggestionName} numberOfLines={1}>
                          {item.name || item.display_name.split(',')[0]}
                        </Text>
                        <Text style={styles.suggestionAddress} numberOfLines={1}>
                          {item.display_name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          )}
        </>
      ) : (
        <>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setSearchOpen(true)}
          >
            <Search size={18} color="#fff" />
            <Text style={styles.searchText}>Where to?</Text>
          </TouchableOpacity>

          {/* TRAFFIC TOGGLE BUTTON */}
          <TouchableOpacity
            style={[styles.trafficButton, showTrafficLayer && styles.trafficButtonActive]}
            onPress={() => setShowTrafficLayer(!showTrafficLayer)}
          >
            <AlertTriangle size={20} color={showTrafficLayer ? "#FFF" : "#94A3B8"} />
            <Text style={[styles.trafficButtonText, showTrafficLayer && styles.trafficButtonTextActive]}>
              Traffic
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* LOADING */}
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator color="#3B82F6" size="large" />
          <Text style={{ color: '#fff', marginTop: 8 }}>
            Calculating route...
          </Text>
        </View>
      )}

      {/* ROUTE SELECTION POPUP */}
      {routeInfo && !loading && (
        <View style={styles.routePopup}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={closeRoutePopup}
          >
            <X size={24} color="#94A3B8" />
          </TouchableOpacity>

          {/* Destination Name */}
          <Text style={styles.destinationName} numberOfLines={1}>
            {destinationText}
          </Text>

          {/* Big Time Display */}
          <View style={styles.timeHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bigTime}>
                {formatTime(Math.round(routeInfo.duration / 60))}
              </Text>
              <Text style={styles.arrivalText}>
                Arrival at {new Date(Date.now() + routeInfo.duration * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} • {(routeInfo.distance / 1000).toFixed(1)} km
              </Text>
            </View>
            <TouchableOpacity style={styles.recommendedBadge}>
              <ThumbsUp size={14} color="#FFF" fill="#FFF" />
              <Text style={styles.recommendedText}>Recommended</Text>
            </TouchableOpacity>
          </View>

          {/* Travel Mode Times */}
          {travelTimes && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.routeOptions}
              contentContainerStyle={styles.routeOptionsContent}
            >
              {/* Car */}
              {travelTimes.driving && (
                <TouchableOpacity
                  style={[
                    styles.routeCard,
                    selectedMode === 'driving' && styles.routeCardActive
                  ]}
                  onPress={() => {
                    setSelectedMode('driving');
                    if (routes.driving) {
                      setRouteInfo({
                        distance: routes.driving.distance,
                        duration: routes.driving.duration,
                      });
                    }
                  }}
                >
                  <View style={styles.routeCardHeader}>
                    <Car size={20} color={selectedMode === 'driving' ? '#FFF' : '#3B82F6'} />
                  </View>
                  <Text style={[
                    styles.routeCardTime,
                    selectedMode === 'driving' && styles.routeCardTimeActive
                  ]}>
                    {formatTime(travelTimes.driving)}
                  </Text>
                  <Text style={styles.routeCardHint}>By Car</Text>
                </TouchableOpacity>
              )}

              {/* Bike */}
              {travelTimes.cycling && (
                <TouchableOpacity
                  style={[
                    styles.routeCard,
                    selectedMode === 'cycling' && styles.routeCardActive
                  ]}
                  onPress={() => {
                    setSelectedMode('cycling');
                    if (routes.cycling) {
                      setRouteInfo({
                        distance: routes.cycling.distance,
                        duration: routes.cycling.duration,
                      });
                    }
                  }}
                >
                  <View style={styles.routeCardHeader}>
                    <Bike size={20} color={selectedMode === 'cycling' ? '#FFF' : '#22C55E'} />
                  </View>
                  <Text style={[
                    styles.routeCardTime,
                    selectedMode === 'cycling' && styles.routeCardTimeActive
                  ]}>
                    {formatTime(travelTimes.cycling)}
                  </Text>
                  <Text style={styles.routeCardHint}>By Bike</Text>
                </TouchableOpacity>
              )}

              {/* Walking */}
              {travelTimes.foot && (
                <TouchableOpacity
                  style={[
                    styles.routeCard,
                    selectedMode === 'foot' && styles.routeCardActive
                  ]}
                  onPress={() => {
                    setSelectedMode('foot');
                    if (routes.foot) {
                      setRouteInfo({
                        distance: routes.foot.distance,
                        duration: routes.foot.duration,
                      });
                    }
                  }}
                >
                  <View style={styles.routeCardHeader}>
                    <PersonStanding size={20} color={selectedMode === 'foot' ? '#FFF' : '#F59E0B'} />
                  </View>
                  <Text style={[
                    styles.routeCardTime,
                    selectedMode === 'foot' && styles.routeCardTimeActive
                  ]}>
                    {formatTime(travelTimes.foot)}
                  </Text>
                  <Text style={styles.routeCardHint}>Walking</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}

          {/* Start Navigation Button */}
          <TouchableOpacity style={styles.navButton} onPress={startNavigation}>
            <Navigation size={24} color="#FFF" fill="#FFF" />
            <Text style={styles.navText}>Start Navigation</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1 },

  searchButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },

  searchText: {
    color: '#94A3B8',
    fontSize: 16,
  },

  searchContainer: {
    position: 'absolute',
    top: 60,
    left: 68,
    right: 16,
    backgroundColor: '#111827',
    borderRadius: 16,
    overflow: 'hidden',
  },

  searchBar: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  searchBarActive: {
    backgroundColor: '#1E293B',
  },

  searchBarLast: {
    borderTopWidth: 0,
  },

  searchDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },

  searchDivider: {
    height: 1,
    backgroundColor: '#1E3A8A',
    marginLeft: 16,
    marginRight: 16,
  },

  backButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    backgroundColor: '#111827',
    borderRadius: 12,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  clearButton: {
    padding: 4,
  },

  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },

  suggestionsContainer: {
    position: 'absolute',
    top: 200,
    left: 68,
    right: 16,
    backgroundColor: '#111827',
    borderRadius: 12,
    maxHeight: 250,
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

  suggestionError: {
    color: '#F59E0B',
    fontSize: 13,
    marginLeft: 8,
  },

  loading: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#00000080',
    justifyContent: 'center',
    alignItems: 'center',
  },

  routePopup: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#111827',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderColor: '#1E3A8A',
  },

  closeButton: {
    position: 'absolute',
    top: 8,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  destinationName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },

  timeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },

  bigTime: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 32,
  },

  arrivalText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 4,
  },

  recommendedBadge: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  recommendedText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },

  routeOptions: {
    marginBottom: 16,
  },

  routeOptionsContent: {
    gap: 12,
  },

  routeCard: {
    backgroundColor: '#0B1220',
    borderRadius: 16,
    padding: 14,
    minWidth: 130,
    borderWidth: 2,
    borderColor: '#1E3A8A',
  },

  routeCardActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },

  routeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },

  routeCardTitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },

  routeCardTitleActive: {
    color: '#FFF',
  },

  routeCardTime: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },

  routeCardTimeActive: {
    color: '#FFF',
  },

  routeCardHint: {
    color: '#64748B',
    fontSize: 12,
  },

  travelModes: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
    paddingVertical: 12,
  },

  travelModeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  travelModeText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },

  navButton: {
    backgroundColor: '#3B82F6',
    padding: 18,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },

  navText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  startMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },

  startMarkerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },

  incidentMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#DC2626',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },

  incidentIcon: {
    fontSize: 16,
  },

  trafficButton: {
    position: 'absolute',
    top: 140,
    right: 16,
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  trafficButtonActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },

  trafficButtonText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },

  trafficButtonTextActive: {
    color: '#FFF',
  },
});
