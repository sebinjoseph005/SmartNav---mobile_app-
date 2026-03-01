import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import {
  Plus,
  X,
  ShieldCheck,
  Users,
  AlertTriangle,
  Volume2,
} from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../services/supabase';

export default function SafetyDashboard() {
  const navigation = useNavigation<any>();

  const [location, setLocation] = useState<any>(null);
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [safeHavenMode, setSafeHavenMode] = useState(false);
  const [safePlaces, setSafePlaces] = useState<any[]>([]);
  const [loadingSafePlaces, setLoadingSafePlaces] = useState(false);
  const [scamReports, setScamReports] = useState<any[]>([]);

  // Animation values for menu items
  const menuAnim1 = useRef(new Animated.Value(0)).current;
  const menuAnim2 = useRef(new Animated.Value(0)).current;
  const menuAnim3 = useRef(new Animated.Value(0)).current;
  const menuAnim4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadLocation();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (location) fetchScamReports(location.latitude, location.longitude);
    }, [location])
  );

  const fetchScamReports = async (lat: number, lon: number) => {
    try {
      const { data } = await supabase
        .from('scam_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      const nearby = (data || []).filter((r: any) => {
        const dLat = (r.lat - lat) * 111;
        const dLon = (r.lon - lon) * 111 * Math.cos((lat * Math.PI) / 180);
        return Math.sqrt(dLat * dLat + dLon * dLon) <= 5;
      });
      setScamReports(nearby);
    } catch (e) {
      console.error('scam fetch error', e);
    }
  };

  // Animate menu items when expanded/collapsed
  useEffect(() => {
    if (menuExpanded) {
      menuAnim1.setValue(0);
      menuAnim2.setValue(0);
      menuAnim3.setValue(0);
      menuAnim4.setValue(0);

      Animated.stagger(80, [
        Animated.spring(menuAnim1, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.spring(menuAnim2, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.spring(menuAnim3, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.spring(menuAnim4, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
      ]).start();
    } else {
      menuAnim1.setValue(0);
      menuAnim2.setValue(0);
      menuAnim3.setValue(0);
      menuAnim4.setValue(0);
    }
  }, [menuExpanded]);

  const loadLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    const loc = await Location.getCurrentPositionAsync({});
    setLocation(loc.coords);
    fetchScamReports(loc.coords.latitude, loc.coords.longitude);
  };

  const fetchSafePlaces = async (lat: number, lon: number) => {
    try {
      setLoadingSafePlaces(true);
      const radius = 13000;
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="police"](around:${radius},${lat},${lon});
          node["amenity"="hospital"](around:${radius},${lat},${lon});
          node["amenity"="clinic"](around:${radius},${lat},${lon});
          node["amenity"="fire_station"](around:${radius},${lat},${lon});
          node["amenity"="pharmacy"](around:${radius},${lat},${lon});
          node["tourism"="hotel"](around:${radius},${lat},${lon});
          node["railway"="station"](around:${radius},${lat},${lon});
        );
        out body;
      `;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
      });

      if (!response.ok) {
        console.error('Overpass API error:', response.status);
        setLoadingSafePlaces(false);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Overpass API returned non-JSON response - likely rate limited');
        setLoadingSafePlaces(false);
        return;
      }

      const data = await response.json();
      const places = data.elements.map((place: any) => ({
        id: place.id,
        latitude: place.lat,
        longitude: place.lon,
        name: place.tags?.name || 'Safe Place',
        type: place.tags?.amenity || place.tags?.tourism || place.tags?.railway || 'safe_place',
      }));

      setSafePlaces(places);
      setLoadingSafePlaces(false);
    } catch (e) {
      console.error('Error fetching safe places:', e);
      setLoadingSafePlaces(false);
    }
  };

  const toggleSafeHavenMode = () => {
    const newMode = !safeHavenMode;
    setSafeHavenMode(newMode);

    if (newMode && location) {
      fetchSafePlaces(location.latitude, location.longitude);
    } else {
      setSafePlaces([]);
    }
  };

  const handleSafePlacePress = (place: any) => {
    Alert.alert(
      '🛡️ Navigate to Safe Place?',
      `${place.name}\n${place.type.replace('_', ' ').toUpperCase()}\n\nDo you want to navigate here?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Navigate',
          onPress: () => {
            navigation.navigate('Map', {
              screen: 'MapMain',
              params: {
                destination: {
                  latitude: place.latitude,
                  longitude: place.longitude,
                  name: place.name,
                  type: place.type,
                },
                startNavigation: true,
              },
            });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* MAP */}
      {location ? (
        <MapView
          style={StyleSheet.absoluteFillObject}
          region={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation
        >
          {safeHavenMode && safePlaces.map((place) => (
            <Marker
              key={place.id}
              coordinate={{ latitude: place.latitude, longitude: place.longitude }}
              title={place.name}
              description={place.type.replace('_', ' ').toUpperCase()}
              pinColor="#DC2626"
              onPress={() => handleSafePlacePress(place)}
            />
          ))}
          {scamReports.map((r: any) => (
            <Marker
              key={`scam-${r.id}`}
              coordinate={{ latitude: r.lat, longitude: r.lon }}
              title={`⚠️ ${r.scam_type}`}
              description={r.description.slice(0, 80)}
              pinColor="#F59E0B"
            />
          ))}
        </MapView>
      ) : (
        <View style={styles.mapFallback}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      )}

      {/* SAFE HAVEN BANNER */}
      {safeHavenMode && (
        <View style={styles.safeHavenBanner}>
          <ShieldCheck size={18} color="#FFF" />
          <Text style={styles.safeHavenBannerText}>
            Safe Haven Mode Active • {safePlaces.length} safe places nearby
          </Text>
        </View>
      )}

      {/* SCAM ALERT BANNER */}
      {scamReports.length > 0 && (
        <View style={styles.scamBanner}>
          <AlertTriangle size={16} color="#000" />
          <Text style={styles.scamBannerText}>
            ⚠️ {scamReports.length} scam{scamReports.length > 1 ? 's' : ''} reported nearby — stay alert!
          </Text>
        </View>
      )}

      {/* EXPANDABLE MENU */}
      {menuExpanded && (
        <View style={styles.expandedMenuContainer}>
          <View style={styles.menuGrid}>
            {/* SAFE HAVEN */}
            <Animated.View style={[styles.menuItemWrapper, { opacity: menuAnim1, transform: [{ translateY: menuAnim1.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
              <TouchableOpacity
                style={[styles.menuItem, safeHavenMode && styles.menuItemActive]}
                onPress={() => {
                  setMenuExpanded(false);
                  toggleSafeHavenMode();
                }}
              >
                <View style={[styles.menuIconCircle, safeHavenMode && styles.menuIconCircleActive]}>
                  <ShieldCheck size={20} color="#FFF" />
                </View>
                <Text style={styles.menuLabel}>{safeHavenMode ? 'Exit Safe Haven' : 'Safe Haven'}</Text>
                {loadingSafePlaces && <ActivityIndicator size="small" color="#3B82F6" />}
              </TouchableOpacity>
            </Animated.View>

            {/* CROWD DETECTION (Coming Soon) */}
            <Animated.View style={[styles.menuItemWrapper, { opacity: menuAnim2, transform: [{ translateY: menuAnim2.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
              <TouchableOpacity style={[styles.menuItem, styles.menuItemDisabled]}>
                <View style={styles.menuIconCircle}>
                  <Users size={20} color="#FFF" />
                </View>
                <Text style={styles.menuLabel}>Crowd Detection</Text>
                <Text style={styles.comingSoonBadge}>Soon</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* SCAM ALERTS */}
            <Animated.View style={[styles.menuItemWrapper, { opacity: menuAnim3, transform: [{ translateY: menuAnim3.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => { setMenuExpanded(false); navigation.navigate('ScamAlert'); }}
              >
                <View style={[styles.menuIconCircle, { backgroundColor: '#F59E0B' }]}>
                  <AlertTriangle size={20} color="#000" />
                </View>
                <Text style={styles.menuLabel}>Scam Alerts</Text>
                {scamReports.length > 0 && (
                  <View style={styles.scamCountBadge}>
                    <Text style={styles.scamCountText}>{scamReports.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* QUIET PLACES (Coming Soon) */}
            <Animated.View style={[styles.menuItemWrapper, { opacity: menuAnim4, transform: [{ translateY: menuAnim4.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
              <TouchableOpacity style={[styles.menuItem, styles.menuItemDisabled]}>
                <View style={styles.menuIconCircle}>
                  <Volume2 size={20} color="#FFF" />
                </View>
                <Text style={styles.menuLabel}>Quiet Places</Text>
                <Text style={styles.comingSoonBadge}>Soon</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      )}

      {/* FLOATING ACTION BUTTON */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setMenuExpanded(!menuExpanded)}
        activeOpacity={0.8}
      >
        {menuExpanded ? (
          <X size={28} color="#FFF" strokeWidth={2.5} />
        ) : (
          <Plus size={28} color="#FFF" strokeWidth={2.5} />
        )}
      </TouchableOpacity>

      {/* FLOATING SOS */}
      <TouchableOpacity
        style={styles.sosButton}
        onPress={() => navigation.navigate('SOS')}
        activeOpacity={0.85}
      >
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },

  mapFallback: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },

  safeHavenBanner: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(220, 38, 38, 0.95)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },

  safeHavenBannerText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  expandedMenuContainer: {
    position: 'absolute',
    bottom: 180,
    left: 20,
    right: 20,
  },

  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start',
  },

  menuItemWrapper: {
    width: '48%',
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },

  menuItemActive: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    borderColor: 'rgba(220, 38, 38, 0.5)',
    borderWidth: 2,
  },

  menuItemDisabled: {
    opacity: 0.6,
  },

  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuIconCircleActive: {
    backgroundColor: '#DC2626',
  },

  menuLabel: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  comingSoonBadge: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '700',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  scamBanner: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#F59E0B',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scamBannerText: { color: '#000', fontSize: 13, fontWeight: '700', flex: 1 },
  scamCountBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  scamCountText: { color: '#000', fontSize: 10, fontWeight: '700' },

  fab: {
    position: 'absolute',
    bottom: 110,
    right: 20,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },

  sosButton: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },

  sosText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
