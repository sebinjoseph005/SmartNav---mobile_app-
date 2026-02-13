import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';
import {
  ShieldCheck,
  Navigation,
  Route,
  Bell,
  Cloud,
  Droplets,
  CloudRain,
  DollarSign,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

export default function HomeDashboard() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('Traveler');
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    // Load user name
    supabase.auth.getUser().then(({ data }) => {
      const fullName = data?.user?.user_metadata?.full_name;
      if (fullName) setName(fullName);
    });

    // Load location
    (async () => {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') return;

      const location =
        await Location.getCurrentPositionAsync({});

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.name}>
            Welcome back, <Text style={styles.nameHighlight}>{name}</Text>
          </Text>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <Bell size={20} color="#CBD5E1" />
        </TouchableOpacity>
      </View>

      {/* STATUS CARDS */}
      <View style={styles.row}>
        {/* SECURE CARD WITH GLOW */}
        <View style={[styles.card, styles.secureCard]}>
          <ShieldCheck color="#22C55E" size={20} />
          <Text style={styles.secure}>SECURE</Text>
          <Text style={styles.sub}>All systems safe</Text>
        </View>

        {/* ENHANCED WEATHER CARD */}
        <TouchableOpacity
          style={[styles.card, styles.weatherCard]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('WeatherDetails')}
        >
          <Text style={styles.temp}>24°C</Text>
          <Text style={styles.weatherDesc}>Partly Cloudy</Text>
          <View style={styles.warning}>
            <Text style={styles.warningText}>⚠️ Rain expected</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ACTION BUTTONS */}
      <View style={styles.row}>
        <Action
          icon={<Route />}
          label="Plan Trip"
          onPress={() =>
            navigation.navigate('Trip', {
              screen: 'TripPlanner',
            })
          }
        />
        <Action
          icon={<Navigation />}
          label="Navigate"
          onPress={() => navigation.navigate('Map', { screen: 'MapMain' })}
        />
        <Action
          icon={<DollarSign />}
          label="Split Budget"
          onPress={() => navigation.navigate('BudgetSplit')}
        />
      </View>

      {/* YOUR LOCATION LABEL (OUTSIDE MAP) */}
      <Text style={styles.mapLabel}>Your Location</Text>

      {/* MAP CARD */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('Map', { screen: 'MapMain' })}
        style={styles.mapCard}
      >
        <View style={styles.mapClip}>
          {!userLocation ? (
            <View style={styles.mapLoading}>
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text style={styles.loadingText}>
                Locating you…
              </Text>
            </View>
          ) : (
            <>
              <MapView
                style={StyleSheet.absoluteFillObject}
                region={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                showsUserLocation
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
              />
              {/* DARK OVERLAY FOR BETTER BLENDING */}
              <View style={styles.mapOverlay} />
            </>
          )}
        </View>
      </TouchableOpacity>

      {/* SOS - KEEP THE GLOW HERE */}
      <TouchableOpacity
        style={styles.sos}
        onPress={() => navigation.navigate('SOS')}
        activeOpacity={0.8}
      >
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ---------- COMPONENTS ---------- */

function Card({ children }: any) {
  return <View style={styles.card}>{children}</View>;
}

function Action({ icon, label, onPress }: any) {
  return (
    <TouchableOpacity style={styles.action} onPress={onPress}>
      {React.cloneElement(icon, {
        size: 26,
        color: '#3B82F6',
      })}
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ---------- STYLES ---------- */

// Only for important elements
const premiumGlow = {
  shadowColor: '#22C55E',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.4,
  shadowRadius: 16,
  elevation: 12,
};

const sosGlow = {
  shadowColor: '#DC2626',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.5,
  shadowRadius: 20,
  elevation: 15,
};

// Subtle depth for cards
const subtleShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 3,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220', // Dark blue background matching app theme
    padding: 16,
  },

  header: {
    marginTop: 24,
    marginBottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  greeting: {
    color: '#64748B',
    fontSize: 13,
  },

  name: {
    color: '#CBD5E1',
    fontSize: 18,
    fontWeight: '600',
  },

  nameHighlight: {
    color: '#FFF',
    fontWeight: '600',
  },

  iconButton: {
    backgroundColor: '#111827',
    padding: 10,
    borderRadius: 14,
    ...subtleShadow,
  },

  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },

  card: {
    flex: 1,
    backgroundColor: '#0F172A', // Slightly lighter than background
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    ...subtleShadow, // Subtle shadow instead of glow
  },

  secureCard: {
    backgroundColor: '#0A1F1A',
    borderColor: '#22C55E33',
    ...premiumGlow, // Keep glow only here
  },

  weatherCard: {
    backgroundColor: '#0F172A',
    borderColor: '#1E3A8A',
  },

  secure: {
    color: '#22C55E',
    fontWeight: '600',
    marginTop: 8,
  },

  temp: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
  },

  weatherDesc: {
    color: '#CBD5E1',
    fontSize: 13,
    marginTop: 6,
  },

  sub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 6,
  },

  warning: {
    marginTop: 8,
    backgroundColor: '#422006',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },

  warningText: {
    color: '#FCD34D',
    fontSize: 11,
    fontWeight: '600',
  },

  action: {
    flex: 1,
    height: 110,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
    ...subtleShadow, // Flat design, no glow
  },

  actionText: {
    color: '#FFF',
    marginTop: 10,
    fontSize: 14,
    fontWeight: '500',
  },

  /* MAP */
  mapLabel: {
    color: '#E5E7EB',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
  },

  mapCard: {
    height: 240,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#0F172A',
    marginBottom: 12,
    ...subtleShadow, // Subtle shadow, no glow
  },

  mapClip: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },

  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.15)', // Dark overlay for better blending
    pointerEvents: 'none',
  },

  mapLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },

  loadingText: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 12,
  },

  /* SOS - KEEP THE DRAMATIC GLOW */
  sos: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    backgroundColor: '#DC2626',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...sosGlow, // Dramatic glow for emergency button
    borderWidth: 2,
    borderColor: '#EF4444',
  },

  sosText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
