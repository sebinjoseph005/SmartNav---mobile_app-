import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import {
  Calendar,
  Navigation2,
  DollarSign,
  Bell,
  User,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Camera,
  ShoppingBag,
  UtensilsCrossed,
  TreePine,
  BookMarked,
  Users,
} from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../services/supabase';

export default function HomeDashboard() {
  const navigation = useNavigation<any>();

  const [location, setLocation] = useState<any>(null);
  const [weather, setWeather] = useState<any>({ temp: '--', desc: 'Loading...', icon: 'Partly Cloudy' });
  const [greeting, setGreeting] = useState('Good Evening');
  const [userName, setUserName] = useState('Traveler');
  const [recommendedPlaces, setRecommendedPlaces] = useState<any[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [nearbyScams, setNearbyScams] = useState(0);

  useEffect(() => {
    updateGreeting();
    loadUser();
    loadLocation();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (location) checkNearbyScams(location.latitude, location.longitude);
    }, [location])
  );

  const updateGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  };

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Traveler';
      setUserName(name.split(' ')[0]);
    }
  };

  const loadLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({});
    setLocation(loc.coords);
    fetchWeather(loc.coords.latitude, loc.coords.longitude);
    fetchRecommendedPlaces(loc.coords.latitude, loc.coords.longitude);
    checkNearbyScams(loc.coords.latitude, loc.coords.longitude);
  };

  const checkNearbyScams = async (lat: number, lon: number) => {
    try {
      const { data } = await supabase.from('scam_reports').select('id,lat,lon').limit(100);
      const nearby = (data || []).filter((r: any) => {
        const dLat = (r.lat - lat) * 111;
        const dLon = (r.lon - lon) * 111 * Math.cos((lat * Math.PI) / 180);
        return Math.sqrt(dLat * dLat + dLon * dLon) <= 5;
      });
      setNearbyScams(nearby.length);
    } catch { }
  };

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
      const response = await fetch(url);
      if (!response.ok) return;
      const data = await response.json();
      if (data?.current_weather?.temperature !== undefined) {
        setWeather({
          temp: Math.round(data.current_weather.temperature),
          desc: getWeatherDescription(data.current_weather.weathercode),
        });
      }
    } catch { }
  };

  const getWeatherDescription = (code: number): string => {
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 48) return 'Foggy';
    if (code <= 67) return 'Rainy';
    if (code <= 77) return 'Snowy';
    if (code <= 82) return 'Showers';
    if (code <= 99) return 'Thunderstorm';
    return 'Clear';
  };

  const getWeatherEmoji = (description: string): string => {
    if (description.includes('Clear')) return '☀️';
    if (description.includes('Cloudy')) return '⛅';
    if (description.includes('Foggy')) return '🌫️';
    if (description.includes('Rainy')) return '🌧️';
    if (description.includes('Snowy')) return '❄️';
    if (description.includes('Showers')) return '🌦️';
    if (description.includes('Thunderstorm')) return '⛈️';
    return '☀️';
  };

  const fetchRecommendedPlaces = async (lat: number, lon: number) => {
    try {
      setLoadingPlaces(true);
      const radius = 5000;
      const query = `
        [out:json][timeout:25];
        (
          node["tourism"="attraction"](around:${radius},${lat},${lon});
          node["tourism"="museum"](around:${radius},${lat},${lon});
          node["amenity"="restaurant"](around:${radius},${lat},${lon});
          node["amenity"="cafe"](around:${radius},${lat},${lon});
          node["leisure"="park"](around:${radius},${lat},${lon});
        );
        out body;>;out skel qt;
      `;
      const response = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query });
      if (!response.ok) return;
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) return;
      const data = await response.json();
      const places = data.elements
        .filter((p: any) => p.lat && p.lon && p.tags?.name)
        .map((p: any) => {
          const type = p.tags?.tourism || p.tags?.amenity || p.tags?.leisure || 'place';
          return { id: p.id, latitude: p.lat, longitude: p.lon, name: p.tags.name, type, category: getCategoryFromType(type) };
        })
        .slice(0, 8);
      setRecommendedPlaces(places);
    } catch { }
    finally { setLoadingPlaces(false); }
  };

  const getCategoryFromType = (type: string): string => {
    if (type.includes('attraction') || type.includes('museum')) return 'Landmark';
    if (type.includes('restaurant') || type.includes('cafe')) return 'Food';
    if (type.includes('park')) return 'Park';
    return 'Attraction';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Landmark': return <Camera size={18} color="#3B82F6" />;
      case 'Food': return <UtensilsCrossed size={18} color="#3B82F6" />;
      case 'Park': return <TreePine size={18} color="#3B82F6" />;
      default: return <MapPin size={18} color="#3B82F6" />;
    }
  };

  const isScamNearby = nearbyScams > 0;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.userName}>{userName} 👋</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Safety', { screen: 'SafetyMain' })}>
            <Bell size={22} color="#F1F5F9" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Profile')}>
            <User size={22} color="#F1F5F9" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* SAFETY STATUS CARD */}
        <TouchableOpacity
          style={[styles.statusCard, isScamNearby && styles.statusCardWarning]}
          onPress={() => isScamNearby ? navigation.navigate('Safety', { screen: 'ScamAlert' }) : null}
          activeOpacity={isScamNearby ? 0.7 : 1}
        >
          <View style={[styles.statusIconBg, isScamNearby && styles.statusIconBgWarning]}>
            {isScamNearby
              ? <AlertTriangle size={28} color="#F59E0B" strokeWidth={2.5} />
              : <CheckCircle size={28} color="#10B981" strokeWidth={2.5} />
            }
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusLabel}>Safety Status</Text>
            <Text style={[styles.statusValue, isScamNearby && styles.statusValueWarning]}>
              {isScamNearby ? `⚠️ SCAM ALERT NEARBY` : 'SECURE'}
            </Text>
            {isScamNearby && (
              <Text style={styles.statusSub}>{nearbyScams} report{nearbyScams > 1 ? 's' : ''} within 5km · Tap to view</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* WEATHER CARD */}
        <View style={styles.weatherCard}>
          <Text style={styles.weatherEmoji}>{getWeatherEmoji(weather.desc)}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.weatherLabel}>Local Weather</Text>
            <Text style={styles.weatherTemp}>{weather.temp}°C · {weather.desc}</Text>
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Home', { screen: 'TripPlanner' })}>
            <View style={[styles.actionIcon, { backgroundColor: '#2563EB' }]}>
              <Calendar size={22} color="#FFF" />
            </View>
            <Text style={styles.actionLabel}>Plan Trip</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Map')}>
            <View style={[styles.actionIcon, { backgroundColor: '#0891B2' }]}>
              <Navigation2 size={22} color="#FFF" />
            </View>
            <Text style={styles.actionLabel}>Navigate</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Profile', { screen: 'SavedTrips' })}>
            <View style={[styles.actionIcon, { backgroundColor: '#7C3AED' }]}>
              <BookMarked size={22} color="#FFF" />
            </View>
            <Text style={styles.actionLabel}>Saved Trips</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Community', { screen: 'CommunityMain' })}>
            <View style={[styles.actionIcon, { backgroundColor: '#059669' }]}>
              <Users size={22} color="#FFF" />
            </View>
            <Text style={styles.actionLabel}>Community</Text>
          </TouchableOpacity>
        </View>

        {/* NEARBY PLACES */}
        <Text style={styles.sectionTitle}>Nearby Recommended</Text>
        {loadingPlaces ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text style={styles.loadingText}>Finding great spots…</Text>
          </View>
        ) : recommendedPlaces.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MapPin size={36} color="#334155" />
            <Text style={styles.emptyText}>No places found nearby</Text>
          </View>
        ) : (
          recommendedPlaces.map((place) => (
            <TouchableOpacity
              key={place.id}
              style={styles.placeCard}
              onPress={() => navigation.navigate('Map', { screen: 'MapMain', params: { destination: { latitude: place.latitude, longitude: place.longitude, name: place.name, type: place.type }, startNavigation: true } })}
            >
              <View style={styles.placeIconContainer}>
                {getCategoryIcon(place.category)}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.placeName} numberOfLines={1}>{place.name}</Text>
                <Text style={styles.placeCategory}>{place.category}</Text>
              </View>
              <Navigation2 size={18} color="#334155" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* FLOATING SOS */}
      <TouchableOpacity style={styles.sosButton} onPress={() => navigation.navigate('SOS')} activeOpacity={0.85}>
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080E1A' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: '#0B1220',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  greeting: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  userName: { fontSize: 22, fontWeight: '800', color: '#F1F5F9', marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconButton: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#1E293B',
    justifyContent: 'center', alignItems: 'center',
  },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 120 },

  // Status Card
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F2218',
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
    gap: 14,
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  statusCardWarning: { backgroundColor: '#1A1300', borderColor: '#F59E0B' },
  statusIconBg: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(16,185,129,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  statusIconBgWarning: { backgroundColor: 'rgba(245,158,11,0.12)' },
  statusLabel: { fontSize: 12, color: '#64748B', marginBottom: 2 },
  statusValue: { fontSize: 17, fontWeight: '800', color: '#10B981', letterSpacing: 0.5 },
  statusValueWarning: { color: '#F59E0B', fontSize: 14 },
  statusSub: { fontSize: 11, color: '#94A3B8', marginTop: 3 },

  // Weather Card
  weatherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1930',
    padding: 16,
    borderRadius: 18,
    gap: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.3)',
  },
  weatherEmoji: { fontSize: 36 },
  weatherLabel: { fontSize: 12, color: '#64748B', marginBottom: 3 },
  weatherTemp: { fontSize: 16, fontWeight: '700', color: '#F1F5F9' },

  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#F1F5F9', marginBottom: 14 },

  // Quick Actions Grid
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  actionCard: {
    width: '47%',
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  actionIcon: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 13, fontWeight: '600', color: '#CBD5E1' },

  // Place cards
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  placeIconContainer: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(59,130,246,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  placeName: { fontSize: 14, fontWeight: '600', color: '#F1F5F9', marginBottom: 2 },
  placeCategory: { fontSize: 12, color: '#4B5563' },

  loadingContainer: { alignItems: 'center', paddingVertical: 30, gap: 10 },
  loadingText: { color: '#4B5563', fontSize: 13 },
  emptyContainer: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyText: { color: '#4B5563', fontSize: 13 },

  sosButton: {
    position: 'absolute', bottom: 24, right: 20,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: '#DC2626',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#DC2626', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 10, elevation: 8,
  },
  sosText: { color: '#FFF', fontWeight: '800', fontSize: 15, letterSpacing: 1 },
});
