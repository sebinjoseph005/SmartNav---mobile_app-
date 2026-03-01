// TomTom API Service for Traffic and Routing
const TOMTOM_API_KEY = 'sC0nodrHUtH7A85XH2kCASd4MZaWf3bx';
const TOMTOM_BASE_URL = 'https://api.tomtom.com';

export interface TrafficIncident {
  id: string;
  latitude: number;
  longitude: number;
  iconCategory: number;
  magnitudeOfDelay: number;
  description: string;
  from?: string;
  to?: string;
  delay?: number;
  length?: number;
}

export interface TrafficFlowSegment {
  coordinates: { latitude: number; longitude: number }[];
  currentSpeed: number;
  freeFlowSpeed: number;
  currentTravelTime: number;
  freeFlowTravelTime: number;
  confidence: number;
  roadClosure: boolean;
}

/**
 * Calculate route with traffic using TomTom Routing API
 */
export const calculateRouteWithTraffic = async (
  start: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  mode: 'car' | 'bicycle' | 'pedestrian' = 'car'
): Promise<{
  coordinates: { latitude: number; longitude: number }[];
  distance: number; // meters
  duration: number; // seconds
  durationInTraffic: number; // seconds with traffic
  summary: string;
}> => {
  try {
    const url = `${TOMTOM_BASE_URL}/routing/1/calculateRoute/${start.latitude},${start.longitude}:${destination.latitude},${destination.longitude}/json`;
    
    const params = new URLSearchParams({
      key: TOMTOM_API_KEY,
      traffic: 'true',
      travelMode: mode,
      routeType: 'fastest',
      instructionsType: 'text',
      vehicleHeading: '90',
      computeTravelTimeFor: 'all',
    });

    const response = await fetch(`${url}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`TomTom Routing API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes found');
    }

    const route = data.routes[0];
    const legs = route.legs[0];
    const points = legs.points.map((p: any) => ({
      latitude: p.latitude,
      longitude: p.longitude,
    }));

    return {
      coordinates: points,
      distance: route.summary.lengthInMeters,
      duration: route.summary.travelTimeInSeconds,
      durationInTraffic: route.summary.trafficDelayInSeconds 
        ? route.summary.travelTimeInSeconds + route.summary.trafficDelayInSeconds
        : route.summary.travelTimeInSeconds,
      summary: `${(route.summary.lengthInMeters / 1000).toFixed(1)}km • ${Math.ceil(route.summary.travelTimeInSeconds / 60)}min`,
    };
  } catch (error) {
    console.error('TomTom routing error:', error);
    throw error;
  }
};

/**
 * Get traffic incidents in a bounding box
 */
export const getTrafficIncidents = async (
  bbox: {
    minLat: number;
    minLon: number;
    maxLat: number;
    maxLon: number;
  }
): Promise<TrafficIncident[]> => {
  try {
    // Updated to use v5 incidents API with simpler parameters
    const url = `${TOMTOM_BASE_URL}/traffic/services/5/incidentDetails`;
    
    const params = new URLSearchParams({
      key: TOMTOM_API_KEY,
      bbox: `${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}`,
      language: 'en-US',
      categoryFilter: '0,1,2,3,4,5,6,7,8,9,10,11,14',
      timeValidityFilter: 'present',
    });

    const response = await fetch(`${url}?${params.toString()}`);
    
    if (!response.ok) {
      console.error('TomTom Traffic Incidents API error:', response.status, await response.text());
      return [];
    }

    const data = await response.json();

    if (!data.incidents || data.incidents.length === 0) {
      console.log('No traffic incidents found in area');
      return [];
    }

    return data.incidents.map((incident: any, index: number) => {
      // Handle different coordinate formats
      let lat, lon;
      if (incident.geometry?.coordinates) {
        const coords = incident.geometry.coordinates;
        if (Array.isArray(coords[0])) {
          // LineString or Polygon - use first coordinate
          lon = coords[0][0];
          lat = coords[0][1];
        } else {
          // Point
          lon = coords[0];
          lat = coords[1];
        }
      } else if (incident.properties?.startPositionLatitude) {
        // Alternative format
        lat = incident.properties.startPositionLatitude;
        lon = incident.properties.startPositionLongitude;
      } else {
        console.warn('Incident missing coordinates:', incident);
        return null;
      }
      
      const props = incident.properties || {};
      
      return {
        id: `incident-${index}-${props.id || ''}`,
        latitude: lat,
        longitude: lon,
        iconCategory: props.iconCategory || 0,
        magnitudeOfDelay: props.magnitudeOfDelay || 0,
        description: props.events?.[0]?.description || props.description || 'Traffic incident',
        from: props.from,
        to: props.to,
        delay: props.delay,
        length: props.length,
      };
    }).filter((incident: any) => incident !== null);
  } catch (error) {
    console.error('TomTom traffic incidents error:', error);
    return [];
  }
};

/**
 * Get traffic flow data for a route (shows congestion levels)
 * Optimized for long routes - samples key points only
 */
export const getTrafficFlow = async (
  coordinates: { latitude: number; longitude: number }[]
): Promise<TrafficFlowSegment[]> => {
  try {
    if (coordinates.length < 2) return [];
    
    const segments: TrafficFlowSegment[] = [];
    
    // For long routes, sample fewer points (every 50-100 coordinates)
    // This reduces API calls dramatically
    const totalPoints = coordinates.length;
    const samplingRate = totalPoints > 500 ? 100 : totalPoints > 200 ? 50 : 20;
    
    console.log(`🚦 Sampling traffic every ${samplingRate} points (${Math.ceil(totalPoints / samplingRate)} API calls)`);
    
    for (let i = 0; i < coordinates.length - samplingRate; i += samplingRate) {
      const startIdx = i;
      const endIdx = Math.min(i + samplingRate, coordinates.length - 1);
      const startPoint = coordinates[startIdx];
      const endPoint = coordinates[endIdx];
      
      // Calculate bearing for road direction
      const bearing = calculateBearing(startPoint, endPoint);
      
      // Query traffic at the START of this segment
      const url = `${TOMTOM_BASE_URL}/traffic/services/4/flowSegmentData/absolute/10/json`;
      const params = new URLSearchParams({
        key: TOMTOM_API_KEY,
        point: `${startPoint.latitude},${startPoint.longitude}`,
        unit: 'KMPH',
        heading: Math.round(bearing).toString(),
        thickness: '10',
      });

      try {
        const response = await fetch(`${url}?${params.toString()}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          const flowData = data.flowSegmentData;
          
          // Use ONLY the exact route coordinates for this segment
          const segmentCoords = coordinates.slice(startIdx, endIdx + 1);
          
          segments.push({
            coordinates: segmentCoords,
            currentSpeed: flowData.currentSpeed || 50,
            freeFlowSpeed: flowData.freeFlowSpeed || 50,
            currentTravelTime: flowData.currentTravelTime || 0,
            freeFlowTravelTime: flowData.freeFlowTravelTime || 0,
            confidence: flowData.confidence || 1,
            roadClosure: flowData.roadClosure || false,
          });
        } else {
          console.warn(`Traffic flow API error at point ${i}:`, response.status);
        }
      } catch (segmentError) {
        console.warn('Error fetching traffic segment:', segmentError);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`✅ Created ${segments.length} traffic segments`);
    return segments;
  } catch (error) {
    console.error('TomTom traffic flow error:', error);
    return [];
  }
};

/**
 * Calculate bearing between two coordinates (in degrees)
 */
function calculateBearing(
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number }
): number {
  const startLat = (start.latitude * Math.PI) / 180;
  const startLng = (start.longitude * Math.PI) / 180;
  const endLat = (end.latitude * Math.PI) / 180;
  const endLng = (end.longitude * Math.PI) / 180;

  const dLng = endLng - startLng;

  const y = Math.sin(dLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360;

  return bearing;
}

/**
 * Get traffic icon/color based on speed and congestion
 */
export const getTrafficColor = (currentSpeed: number, freeFlowSpeed: number): string => {
  if (currentSpeed === 0 || freeFlowSpeed === 0) return '#10B981'; // Green - no data
  
  const ratio = currentSpeed / freeFlowSpeed;
  
  if (ratio >= 0.8) return '#10B981'; // Green - free flow
  if (ratio >= 0.6) return '#F59E0B'; // Yellow - moderate
  if (ratio >= 0.4) return '#F97316'; // Orange - slow
  return '#DC2626'; // Red - congested
};

/**
 * Get incident icon emoji based on category
 */
export const getIncidentIcon = (iconCategory: number): string => {
  switch (iconCategory) {
    case 0: return '⚠️'; // Unknown
    case 1: return '🚧'; // Accident
    case 2: return '🌫️'; // Fog
    case 3: return '⚠️'; // Dangerous Conditions
    case 4: return '🌧️'; // Rain
    case 5: return '🧊'; // Ice
    case 6: return '🚗'; // Jam
    case 7: return '🚧'; // Lane Closed
    case 8: return '🚧'; // Road Closed
    case 9: return '🚧'; // Road Works
    case 10: return '💨'; // Wind
    case 11: return '🌊'; // Flooding
    case 14: return '🚧'; // Broken Down Vehicle
    default: return '⚠️';
  }
};
