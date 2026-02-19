import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';
import {
  Bell,
  User,
  Calendar,
  Navigation2,
  DollarSign,
  Plus,
  X,
  Cloud,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

const getWeatherInfo = (code: number) => {
  if (code === 0) return { icon: '☀️', desc: 'CLEAR SKY' };
  if (code <= 3) return { icon: '⛅', desc: 'PARTLY CLOUDY' };
  if (code <= 48) return { icon: '🌫️', desc: 'FOGGY' };
  if (code <= 67) return { icon: '🌧️', desc: 'RAINY' };
  if (code <= 77) return { icon: '❄️', desc: 'SNOWY' };
  if (code <= 82) return { icon: '🌦️', desc: 'SHOWERS' };
  return { icon: '⛈️', desc: 'THUNDERSTORM' };
};

export default function HomeDashboard() {
  const navigation = useNavigation<any>();

  const [name, setName] = useState('Traveler');
  const [location, setLocation] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [menuExpanded, setMenuExpanded] = useState(false);

  // Animation values for menu items
  const menuAnim1 = useRef(new Animated.Value(0)).current;
  const menuAnim2 = useRef(new Animated.Value(0)).current;
  const menuAnim3 = useRef(new Animated.Value(0)).current;
  const menuAnim4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUser();
    loadLocation();
  }, []);

  // Animate menu items when expanded/collapsed
  useEffect(() => {
    if (menuExpanded) {
      // Reset all animations to 0 first
      menuAnim1.setValue(0);
      menuAnim2.setValue(0);
      menuAnim3.setValue(0);
      menuAnim4.setValue(0);

      // Then start staggered animation - items appear one by one
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
      // Reset animations instantly when closing
      menuAnim1.setValue(0);
      menuAnim2.setValue(0);
      menuAnim3.setValue(0);
      menuAnim4.setValue(0);
    }
  }, [menuExpanded]);

  const loadUser = async () => {
    const { data } = await supabase.auth.getUser();
    const fullName = data?.user?.user_metadata?.full_name;
    if (fullName) setName(fullName);
  };

  const loadLocation = async () => {
    const { status } =
      await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') return;

    const loc = await Location.getCurrentPositionAsync({});
    setLocation(loc.coords);
    fetchWeather(loc.coords.latitude, loc.coords.longitude);
  };

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      setLoadingWeather(true);
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`
      );
      const data = await res.json();
      setWeather(data.current_weather);
      setLoadingWeather(false);
    } catch (e) {
      console.log(e);
      setLoadingWeather(false);
    }
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
        />
      ) : (
        <View style={styles.mapFallback}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      )}

      {/* TOP OVERLAY */}
      <View style={styles.topOverlay}>
        {/* HEADER */}
        <View style={styles.headerCard}>
          <Text style={styles.greeting}>
            • {getGreeting()}, <Text style={styles.name}>{name}</Text>
          </Text>

          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconBtn}>
              <Bell size={20} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => navigation.navigate('Profile')}
            >
              <User size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* WEATHER */}
        <TouchableOpacity
          style={styles.weatherCard}
          onPress={() => navigation.navigate('WeatherDetails')}
        >
          {loadingWeather ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : weather ? (
            <>
              <Text style={styles.weatherIcon}>
                {getWeatherInfo(weather.weathercode).icon}
              </Text>
              <View style={styles.weatherInfo}>
                <Text style={styles.weatherTemp}>
                  {Math.round(weather.temperature)}°C
                </Text>
                <Text style={styles.weatherDesc}>
                  {getWeatherInfo(weather.weathercode).desc}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.weatherTemp}>--°C</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* EXPANDABLE MENU - Google Keep Style with Animations */}
      {menuExpanded && (
        <View style={styles.expandedMenuContainer}>
          {/* PLAN TRIP */}
          <Animated.View
            style={[
              styles.menuItemWrapper,
              {
                opacity: menuAnim1,
                transform: [
                  {
                    translateY: menuAnim1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                  {
                    scale: menuAnim1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuExpanded(false);
                navigation.navigate('TripPlanner');
              }}
            >
              <View style={styles.menuIconCircle}>
                <Calendar size={20} color="#FFF" />
              </View>
              <Text style={styles.menuLabel}>Plan Trip</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* NAVIGATE */}
          <Animated.View
            style={[
              styles.menuItemWrapper,
              {
                opacity: menuAnim2,
                transform: [
                  {
                    translateY: menuAnim2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                  {
                    scale: menuAnim2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuExpanded(false);
                navigation.navigate('Map');
              }}
            >
              <View style={styles.menuIconCircle}>
                <Navigation2 size={20} color="#FFF" />
              </View>
              <Text style={styles.menuLabel}>Navigate</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* SPLIT BUDGET */}
          <Animated.View
            style={[
              styles.menuItemWrapper,
              {
                opacity: menuAnim3,
                transform: [
                  {
                    translateY: menuAnim3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                  {
                    scale: menuAnim3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuExpanded(false);
                navigation.navigate('TripBudget');
              }}
            >
              <View style={styles.menuIconCircle}>
                <DollarSign size={20} color="#FFF" />
              </View>
              <Text style={styles.menuLabel}>Split Budget</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* WEATHER */}
          <Animated.View
            style={[
              styles.menuItemWrapper,
              {
                opacity: menuAnim4,
                transform: [
                  {
                    translateY: menuAnim4.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                  {
                    scale: menuAnim4.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuExpanded(false);
                navigation.navigate('WeatherDetails');
              }}
            >
              <View style={styles.menuIconCircle}>
                <Cloud size={20} color="#FFF" />
              </View>
              <Text style={styles.menuLabel}>Weather</Text>
            </TouchableOpacity>
          </Animated.View>
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

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  mapFallback: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },

  topOverlay: {
    position: 'absolute',
    top: 55,
    left: 16,
    right: 16,
  },

  headerCard: {
    backgroundColor: 'rgba(15,23,42,0.95)',
    padding: 14,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  greeting: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },

  name: {
    fontWeight: '700',
  },

  headerIcons: {
    flexDirection: 'row',
    gap: 10,
  },

  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(30,41,59,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  weatherCard: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(15,23,42,0.95)',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  weatherIcon: {
    fontSize: 32,
  },

  weatherInfo: {
    flexDirection: 'column',
  },

  weatherTemp: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700',
  },

  weatherDesc: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 1,
  },

  /* EXPANDABLE MENU - Google Keep Style */
  expandedMenuContainer: {
    position: 'absolute',
    bottom: 180,
    right: 20,
    alignItems: 'flex-end',
    gap: 8,
  },

  menuItemWrapper: {
    width: '100%',
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 12,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },

  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuLabel: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '600',
  },

  /* FLOATING ACTION BUTTON */
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

  /* FLOATING SOS BUTTON */
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
