import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { getCachedLocation } from '../../services/locationCache';
import {
  Calendar,
  Navigation2,
  DollarSign,
  Bell,
  User,
  AlertTriangle,
  MapPin,
  Camera,
  UtensilsCrossed,
  TreePine,
  Users,
  Shield,
  CheckCircle,
  Compass,
  Sunset,
  Bot,
  Sparkles,
} from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../services/supabase';

export default function HomeDashboard() {
  const navigation = useNavigation<any>();

  const [location, setLocation] = useState<any>(null);
  const [weather, setWeather] = useState<any>({ temp: '--', desc: 'Loading...' });
  const [greeting, setGreeting] = useState('Good Evening');
  const [greetingEmoji, setGreetingEmoji] = useState('🌙');
  const [userName, setUserName] = useState('Traveler');
  const [recommendedPlaces, setRecommendedPlaces] = useState<any[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [nearbyScams, setNearbyScams] = useState(0);
  const [locationName, setLocationName] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    updateGreeting();
    loadUser();
    loadLocation();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (nearbyScams > 0) {
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]));
      loop.start();
      return () => loop.stop();
    } else {
      // Reset pulse when no scams
      pulseAnim.setValue(1);
    }
  }, [nearbyScams]);

  useFocusEffect(useCallback(() => {
    // Always refresh scam count when screen comes into focus
    const refresh = async () => {
      const loc = await getCachedLocation();
      if (loc) {
        setLocation(loc);
        checkNearbyScams(loc.latitude, loc.longitude);
      }
    };
    refresh();
  }, []));

  const updateGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) { setGreeting('Good Morning'); setGreetingEmoji('🌅'); }
    else if (h < 18) { setGreeting('Good Afternoon'); setGreetingEmoji('☀️'); }
    else { setGreeting('Good Evening'); setGreetingEmoji('🌙'); }
  };

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Traveler';
      setUserName(name.split(' ')[0]);
    }
  };

  const loadLocation = async () => {
    const loc = await getCachedLocation();
    if (!loc) return;
    setLocation(loc);
    // Fire all data fetches in parallel
    Promise.all([
      fetchWeather(loc.latitude, loc.longitude),
      fetchRecommendedPlaces(loc.latitude, loc.longitude),
      checkNearbyScams(loc.latitude, loc.longitude),
    ]);
    try {
      const geo = await Location.reverseGeocodeAsync({ latitude: loc.latitude, longitude: loc.longitude });
      if (geo[0]) setLocationName(geo[0].district || geo[0].city || geo[0].subregion || '');
    } catch { }
  };

  const checkNearbyScams = async (lat: number, lon: number) => {
    try {
      // Force fresh query — no Supabase cache
      const { data, error } = await supabase
        .from('scam_reports')
        .select('id,lat,lon')
        .limit(200);

      if (error) { setNearbyScams(0); return; }

      const deletedStr = await AsyncStorage.getItem('deleted_scams');
      const deleted = deletedStr ? JSON.parse(deletedStr) : [];

      const nearby = (data || []).filter((r: any) => {
        if (deleted.includes(r.id)) return false;
        const dLat = (r.lat - lat) * 111;
        const dLon = (r.lon - lon) * 111 * Math.cos((lat * Math.PI) / 180);
        return Math.sqrt(dLat * dLat + dLon * dLon) <= 5;
      });
      setNearbyScams(nearby.length);
    } catch {
      setNearbyScams(0);
    }
  };

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.current_weather?.temperature !== undefined) {
        setWeather({
          temp: Math.round(data.current_weather.temperature),
          desc: getWeatherDescription(data.current_weather.weathercode),
        });
      }
    } catch { }
  };

  const getWeatherDescription = (code: number) => {
    if (code === 0) return 'Clear Sky';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 48) return 'Foggy';
    if (code <= 67) return 'Rainy';
    if (code <= 77) return 'Snowy';
    if (code <= 82) return 'Showers';
    if (code <= 99) return 'Thunderstorm';
    return 'Clear';
  };

  const getWeatherEmoji = (d: string) => {
    if (d.includes('Clear')) return '☀️';
    if (d.includes('Cloudy')) return '⛅';
    if (d.includes('Foggy')) return '🌫️';
    if (d.includes('Rain') || d.includes('Shower')) return '🌧️';
    if (d.includes('Snow')) return '❄️';
    if (d.includes('Thunder')) return '⛈️';
    return '🌤️';
  };

  const fetchRecommendedPlaces = async (lat: number, lon: number) => {
    try {
      setLoadingPlaces(true);
      const query = `
        [out:json][timeout:20];
        (
          node["tourism"="attraction"](around:5000,${lat},${lon});
          node["tourism"="museum"](around:5000,${lat},${lon});
          node["amenity"="restaurant"](around:5000,${lat},${lon});
          node["amenity"="cafe"](around:5000,${lat},${lon});
          node["leisure"="park"](around:5000,${lat},${lon});
        );
        out body;>;out skel qt;
      `;
      const SERVERS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
      let data = null;
      for (const server of SERVERS) {
        try {
          const res = await fetch(server, { method: 'POST', body: query });
          if (!res.ok) continue;
          if (!res.headers.get('content-type')?.includes('application/json')) continue;
          data = await res.json();
          break;
        } catch { continue; }
      }
      if (!data || !data.elements) return;
      const places = data.elements
        .filter((p: any) => p.lat && p.lon && p.tags?.name)
        .map((p: any) => {
          const type = p.tags?.tourism || p.tags?.amenity || p.tags?.leisure || 'place';
          return { id: p.id, latitude: p.lat, longitude: p.lon, name: p.tags.name, type, category: getCategoryFromType(type) };
        })
        .slice(0, 5);
      setRecommendedPlaces(places);
    } catch { }
    finally { setLoadingPlaces(false); }
  };

  const getCategoryFromType = (t: string) => {
    if (t.includes('attraction') || t.includes('museum')) return 'Landmark';
    if (t.includes('restaurant') || t.includes('cafe')) return 'Food';
    if (t.includes('park')) return 'Park';
    return 'Attraction';
  };

  const categoryConfig: Record<string, { icon: any; color: string }> = {
    Landmark: { icon: Camera, color: '#8B5CF6' },
    Food: { icon: UtensilsCrossed, color: '#F59E0B' },
    Park: { icon: TreePine, color: '#10B981' },
    Attraction: { icon: MapPin, color: '#3B82F6' },
  };

  const isScamNearby = nearbyScams > 0;

  const quickActions = [
    { label: 'Plan Trip', icon: Calendar, color: '#2563EB', onPress: () => navigation.navigate('Home', { screen: 'TripPlanner' }) },
    { label: 'Navigate', icon: Navigation2, color: '#0891B2', onPress: () => navigation.navigate('Map') },
    { label: 'Budget', icon: DollarSign, color: '#D97706', onPress: () => navigation.navigate('Home', { screen: 'TripBudget' }) },
    { label: 'Community', icon: Users, color: '#059669', onPress: () => navigation.navigate('Community', { screen: 'CommunityMain' }) },
  ];

  return (
    <View style={styles.container}>

      {/* ── HEADER ─────────────────────────────── */}
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{greetingEmoji} {greeting}</Text>
          <Text style={styles.userName}>{userName}</Text>
          {locationName ? (
            <View style={styles.locationRow}>
              <MapPin size={11} color="#64748B" />
              <Text style={styles.locationText}>{locationName}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconButton, isScamNearby && styles.iconButtonAlert]}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Bell size={20} color={isScamNearby ? '#F59E0B' : '#94A3B8'} />
            {isScamNearby && <View style={styles.notifDot} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Profile')}>
            <User size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── WEATHER CARD ───────────────────────── */}
        <TouchableOpacity
          style={styles.weatherCard}
          onPress={() => navigation.navigate('Home', { screen: 'WeatherDetails' })}
          activeOpacity={0.85}
        >
          <View style={styles.weatherLeft}>
            <Text style={styles.weatherEmoji}>{getWeatherEmoji(weather.desc)}</Text>
            <View>
              <Text style={styles.weatherLabel}>LOCAL WEATHER</Text>
              <Text style={styles.weatherTemp}>{weather.temp}°C</Text>
              <Text style={styles.weatherDesc}>{weather.desc}</Text>
            </View>
          </View>
          <View style={styles.weatherRight}>
            <View style={styles.weatherTapHint}>
              <Sunset size={14} color="#64748B" />
              <Text style={styles.weatherTapText}>Full Forecast ›</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ── SAFETY STATUS CARD ─────────────────── */}
        <TouchableOpacity
          style={[styles.safetyCard, isScamNearby && styles.safetyCardAlert]}
          onPress={() => navigation.navigate('Safety', { screen: isScamNearby ? 'ScamAlert' : 'SafetyMain' })}
          activeOpacity={0.85}
        >
          <Animated.View style={[
            styles.safetyIconWrap,
            isScamNearby ? styles.safetyIconWrapAlert : styles.safetyIconWrapSafe,
            isScamNearby && { transform: [{ scale: pulseAnim }] },
          ]}>
            {isScamNearby
              ? <AlertTriangle size={22} color="#F59E0B" strokeWidth={2.5} />
              : <Shield size={22} color="#10B981" strokeWidth={2.5} />
            }
          </Animated.View>
          <View style={{ flex: 1 }}>
            <Text style={styles.safetyLabel}>SAFETY STATUS</Text>
            <Text style={[styles.safetyValue, isScamNearby && styles.safetyValueAlert]}>
              {isScamNearby ? `⚠️  ${nearbyScams} Scam Alert${nearbyScams > 1 ? 's' : ''} Nearby` : '✅  Area Secure'}
            </Text>
            <Text style={styles.safetySub}>
              {isScamNearby ? 'Tap to view reports on map' : 'No threats detected within 5km'}
            </Text>
          </View>
          <CheckCircle size={16} color={isScamNearby ? '#F59E0B' : '#10B981'} style={{ opacity: 0.6 }} />
        </TouchableOpacity>

        {/* ── AI COMPANION CARD ──────────────────── */}
        <TouchableOpacity
          style={styles.aiCard}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('Home', { screen: 'AICompanion' }); }}
          activeOpacity={0.85}
        >
          <View style={styles.aiIconWrap}>
            <Bot size={24} color="#A78BFA" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.aiTitleRow}>
              <Text style={styles.aiTitle}>SmartNav AI</Text>
              <View style={styles.aiBadge}>
                <Sparkles size={10} color="#F59E0B" />
                <Text style={styles.aiBadgeText}>LIVE</Text>
              </View>
            </View>
            <Text style={styles.aiDesc}>Ask about safety, local tips, or travel advice — context-aware!</Text>
          </View>
        </TouchableOpacity>

        {/* ── QUICK ACTIONS ──────────────────────── */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          {quickActions.map((action, i) => (
            <TouchableOpacity
              key={i}
              style={styles.actionCard}
              onPress={action.onPress}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: action.color }]}>
                <action.icon size={24} color="#FFF" />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── NEARBY SPOTS ───────────────────────── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Nearby Spots</Text>
          <TouchableOpacity onPress={loadLocation}>
            <Text style={styles.refreshLink}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {loadingPlaces ? (
          <View style={styles.centeredRow}>
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text style={styles.loadingText}>Finding great spots…</Text>
          </View>
        ) : recommendedPlaces.length === 0 ? (
          <View style={styles.centeredRow}>
            <Compass size={32} color="#1E293B" />
            <Text style={styles.emptyText}>No spots found nearby</Text>
          </View>
        ) : (
          recommendedPlaces.map(place => {
            const cfg = categoryConfig[place.category] || categoryConfig['Attraction'];
            return (
              <TouchableOpacity
                key={place.id}
                style={styles.placeCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Map', {
                  screen: 'MapMain',
                  params: { destination: { latitude: place.latitude, longitude: place.longitude, name: place.name, type: place.type }, startNavigation: true }
                })}
              >
                <View style={[styles.placeIcon, { backgroundColor: `${cfg.color}20` }]}>
                  <cfg.icon size={18} color={cfg.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.placeName} numberOfLines={1}>{place.name}</Text>
                  <Text style={[styles.placeCategory, { color: cfg.color }]}>{place.category}</Text>
                </View>
                <View style={styles.placeNavBtn}>
                  <Navigation2 size={14} color="#3B82F6" />
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── SOS BUTTON ─────────────────────────── */}
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
  container: { flex: 1, backgroundColor: '#060C18' },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 58,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: '#0A1020',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30,41,59,0.7)',
  },
  greeting: { fontSize: 13, color: '#64748B', fontWeight: '600', letterSpacing: 0.3, marginBottom: 2 },
  userName: { fontSize: 28, fontWeight: '900', color: '#F1F5F9', letterSpacing: -0.5 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  locationText: { fontSize: 11, color: '#475569' },
  headerActions: { flexDirection: 'row', gap: 10, paddingTop: 4 },
  iconButton: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#111827',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#1E293B',
    position: 'relative',
  },
  iconButtonAlert: {
    borderColor: 'rgba(245,158,11,0.4)',
    backgroundColor: 'rgba(245,158,11,0.08)',
  },
  notifDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#F59E0B', borderWidth: 1.5, borderColor: '#0A1020',
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },

  // Weather Card
  weatherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1929',
    borderRadius: 22,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.25)',
  },
  weatherLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  weatherEmoji: { fontSize: 44 },
  weatherLabel: { fontSize: 10, color: '#475569', fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  weatherTemp: { fontSize: 30, fontWeight: '900', color: '#F1F5F9', letterSpacing: -1 },
  weatherDesc: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  weatherRight: { alignItems: 'flex-end' },
  weatherTapHint: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#1E293B', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  weatherTapText: { fontSize: 11, color: '#64748B', fontWeight: '600' },

  // Safety Card
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A1F14',
    borderRadius: 22,
    padding: 18,
    marginBottom: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(16,185,129,0.3)',
    gap: 14,
  },
  safetyCardAlert: {
    backgroundColor: '#1A1200',
    borderColor: 'rgba(245,158,11,0.4)',
  },
  safetyIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  safetyIconWrapSafe: { backgroundColor: 'rgba(16,185,129,0.12)' },
  safetyIconWrapAlert: { backgroundColor: 'rgba(245,158,11,0.12)' },
  safetyLabel: { fontSize: 10, color: '#475569', fontWeight: '700', letterSpacing: 1, marginBottom: 3 },
  safetyValue: { fontSize: 15, fontWeight: '800', color: '#10B981', marginBottom: 3 },
  safetyValueAlert: { color: '#F59E0B' },
  safetySub: { fontSize: 11, color: '#475569' },

  // AI Companion Card
  aiCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0F0D25', borderRadius: 22,
    padding: 18, marginBottom: 24, gap: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(167,139,250,0.3)',
  },
  aiIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(139,92,246,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  aiTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  aiTitle: { fontSize: 16, fontWeight: '800', color: '#E0D4FD' },
  aiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(245,158,11,0.15)',
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  aiBadgeText: { fontSize: 9, fontWeight: '800', color: '#F59E0B', letterSpacing: 1 },
  aiDesc: { fontSize: 12, color: '#7C6DB5', lineHeight: 17 },

  // Quick Actions 2x2
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#F1F5F9', marginBottom: 14, letterSpacing: -0.3 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  refreshLink: { fontSize: 13, color: '#3B82F6', fontWeight: '600' },

  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 30 },
  actionCard: {
    width: '47%',
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1, borderColor: '#1E293B',
  },
  actionIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
  },
  actionLabel: { fontSize: 14, fontWeight: '700', color: '#CBD5E1' },

  // Place Cards
  placeCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0F172A', borderRadius: 18,
    padding: 14, marginBottom: 10, gap: 12,
    borderWidth: 1, borderColor: '#1E293B',
  },
  placeIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  placeName: { fontSize: 14, fontWeight: '700', color: '#F1F5F9', marginBottom: 2 },
  placeCategory: { fontSize: 11, fontWeight: '700' },
  placeNavBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(59,130,246,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },

  centeredRow: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  loadingText: { color: '#475569', fontSize: 13 },
  emptyText: { color: '#475569', fontSize: 13 },

  // SOS — round circle
  sosButton: {
    position: 'absolute', bottom: 24, right: 20,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#DC2626',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#DC2626', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6, shadowRadius: 14, elevation: 10,
  },
  sosText: { color: '#FFF', fontWeight: '900', fontSize: 15, letterSpacing: 1.5 },
});
