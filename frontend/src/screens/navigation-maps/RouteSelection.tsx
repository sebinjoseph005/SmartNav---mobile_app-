import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import SafeMapView from '../../components/SafeMapView';
import { Marker, Polyline } from 'react-native-maps';
import { ArrowLeft, Navigation, MapPin, ThumbsUp, Shield, Zap } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';

const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';

type RouteType = 'best' | 'safe' | 'fastest';

export default function RouteSelection() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const place = route.params?.place;

  const [userLocation, setUserLocation] = useState<any>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteType>('best');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoute();
  }, []);

  const loadRoute = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      const userLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(userLoc);

      // Get destination coordinates
      const destLat = place.geocodes?.main?.latitude;
      const destLon = place.geocodes?.main?.longitude;

      if (!destLat || !destLon) {
        setLoading(false);
        return;
      }

      // Fetch routes for all travel modes
      const modes: TravelMode[] = ['driving', 'cycling', 'foot'];
      const results: any = {};

      for (const mode of modes) {
        try {
          const url = `${OSRM_BASE}/${mode}/${location.coords.longitude},${location.coords.latitude};${destLon},${destLat}?overview=full&geometries=geojson`;

          const res = await fetch(url);
          const data = await res.json();

          if (data.routes && data.routes[0]) {
            const route = data.routes[0];
            const coordinates = route.geometry.coordinates.map((coord: number[]) => ({
              longitude: coord[0],
              latitude: coord[1],
            }));

            results[mode] = {
              coordinates,
              distance: route.distance,
              duration: route.duration,
            };
          }
        } catch (err) {
          console.log(`Error fetching ${mode} route:`, err);
        }
      }

      setTravelModes(results);
      // Set driving as default route
      if (results.driving) {
        setRouteData(results.driving);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const selectMode = (mode: TravelMode) => {
    setSelectedMode(mode);
    if (travelModes[mode]) {
      setRouteData(travelModes[mode]);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#3B82F6" size="large" />
        <Text style={styles.loadingText}>Calculating route...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* BACK BUTTON */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <ArrowLeft size={24} color="#FFF" />
      </TouchableOpacity>

      {/* MAP */}
      <SafeMapView
        style={styles.map}
        initialRegion={{
          latitude: userLocation?.latitude || 0,
          longitude: userLocation?.longitude || 0,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
      >
        {/* User Location */}
        {userLocation && (
          <Marker coordinate={userLocation} title="You">
            <View style={styles.userMarker}>
              <View style={styles.userMarkerInner} />
            </View>
          </Marker>
        )}

        {/* Destination */}
        {place.geocodes?.main && (
          <Marker
            coordinate={{
              latitude: place.geocodes.main.latitude,
              longitude: place.geocodes.main.longitude,
            }}
            title={place.name}
          >
            <MapPin size={32} color="#EF4444" fill="#EF4444" />
          </Marker>
        )}

        {/* Route Polyline */}
        {routeData && (
          <Polyline
            coordinates={routeData.coordinates}
            strokeWidth={5}
            strokeColor="#3B82F6"
          />
        )}
      </SafeMapView>

      {/* ROUTE INFO CARD */}
      {routeData && (
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.placeName}>{place.name}</Text>
            <Text style={styles.placeAddress}>
              {place.location?.address || 'Address not available'}
            </Text>
          </View>

          {/* TRAVEL MODE OPTIONS */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.modesScroll}
            contentContainerStyle={styles.modesContainer}
          >
            {/* CAR */}
            {travelModes.driving && (
              <TouchableOpacity
                style={[
                  styles.modeCard,
                  selectedMode === 'driving' && styles.modeCardActive,
                ]}
                onPress={() => selectMode('driving')}
              >
                <View style={styles.modeIcon}>
                  <Car
                    size={20}
                    color={selectedMode === 'driving' ? '#FFF' : '#94A3B8'}
                  />
                </View>
                <Text style={[
                  styles.modeLabel,
                  selectedMode === 'driving' && styles.modeLabelActive,
                ]}>
                  Car
                </Text>
                <Text style={[
                  styles.modeTime,
                  selectedMode === 'driving' && styles.modeTimeActive,
                ]}>
                  {Math.round(travelModes.driving.duration / 60)} min
                </Text>
                <Text style={styles.modeDistance}>
                  {(travelModes.driving.distance / 1000).toFixed(1)} km
                </Text>
              </TouchableOpacity>
            )}

            {/* BIKE */}
            {travelModes.cycling && (
              <TouchableOpacity
                style={[
                  styles.modeCard,
                  selectedMode === 'cycling' && styles.modeCardActive,
                ]}
                onPress={() => selectMode('cycling')}
              >
                <View style={styles.modeIcon}>
                  <Bike
                    size={20}
                    color={selectedMode === 'cycling' ? '#FFF' : '#94A3B8'}
                  />
                </View>
                <Text style={[
                  styles.modeLabel,
                  selectedMode === 'cycling' && styles.modeLabelActive,
                ]}>
                  Bike
                </Text>
                <Text style={[
                  styles.modeTime,
                  selectedMode === 'cycling' && styles.modeTimeActive,
                ]}>
                  {Math.round(travelModes.cycling.duration / 60)} min
                </Text>
                <Text style={styles.modeDistance}>
                  {(travelModes.cycling.distance / 1000).toFixed(1)} km
                </Text>
              </TouchableOpacity>
            )}

            {/* WALKING */}
            {travelModes.foot && (
              <TouchableOpacity
                style={[
                  styles.modeCard,
                  selectedMode === 'foot' && styles.modeCardActive,
                ]}
                onPress={() => selectMode('foot')}
              >
                <View style={styles.modeIcon}>
                  <PersonStanding
                    size={20}
                    color={selectedMode === 'foot' ? '#FFF' : '#94A3B8'}
                  />
                </View>
                <Text style={[
                  styles.modeLabel,
                  selectedMode === 'foot' && styles.modeLabelActive,
                ]}>
                  Walk
                </Text>
                <Text style={[
                  styles.modeTime,
                  selectedMode === 'foot' && styles.modeTimeActive,
                ]}>
                  {Math.round(travelModes.foot.duration / 60)} min
                </Text>
                <Text style={styles.modeDistance}>
                  {(travelModes.foot.distance / 1000).toFixed(1)} km
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.startButton}
            onPress={() =>
              navigation.navigate('ActiveNavigation', {
                place,
                route: routeData,
              })
            }
          >
            <Navigation size={24} color="#FFF" />
            <Text style={styles.startButtonText}>Start Navigation</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    backgroundColor: '#0B1220',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
    backgroundColor: '#111827',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3B82F680',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  infoCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#111827',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  infoRow: {
    marginBottom: 20,
  },
  placeName: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  placeAddress: {
    color: '#94A3B8',
    fontSize: 14,
  },
  modesScroll: {
    marginBottom: 16,
  },
  modesContainer: {
    gap: 12,
    paddingRight: 20,
  },
  modeCard: {
    backgroundColor: '#0B1220',
    borderRadius: 16,
    padding: 16,
    minWidth: 110,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1E3A8A',
  },
  modeCardActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  modeIcon: {
    marginBottom: 8,
  },
  modeLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  modeLabelActive: {
    color: '#FFF',
  },
  modeTime: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  modeTimeActive: {
    color: '#FFF',
  },
  modeDistance: {
    color: '#64748B',
    fontSize: 12,
  },
  startButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
