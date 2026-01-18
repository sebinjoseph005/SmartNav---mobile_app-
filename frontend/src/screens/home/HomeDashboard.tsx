import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  ShieldCheck,
  Navigation,
  Route,
  WifiOff,
  Bell,
} from 'lucide-react-native';
import { supabase } from '../../services/supabase';
import { useNavigation } from '@react-navigation/native';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 22) return 'Good Evening';
  return 'Hello';
};

export default function HomeDashboard() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('Traveler');

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      const fullName =
        data?.user?.user_metadata?.full_name;
      if (fullName) setName(fullName);
    };
    loadUser();
  }, []);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {getGreeting()}
          </Text>
          <Text style={styles.name}>
            Welcome back, {name}
          </Text>
        </View>

        <TouchableOpacity>
          <Bell color="#94A3B8" size={22} />
        </TouchableOpacity>
      </View>

      {/* STATUS CARDS */}
      <View style={styles.cardRow}>
        {/* ✅ SAFETY STATUS BUTTON */}
        <TouchableOpacity
          style={styles.statusCard}
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate('Safety')
          }
        >
          <ShieldCheck color="#22C55E" size={22} />
          <Text style={styles.cardTitle}>SECURE</Text>
          <Text style={styles.cardSub}>
            Safety Status
          </Text>
        </TouchableOpacity>

        {/* ✅ WEATHER BUTTON */}
        <TouchableOpacity
          style={styles.statusCard}
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate('WeatherDetails')
          }
        >
          <Text style={styles.temp}>24°C</Text>
          <Text style={styles.cardSub}>
            Partly Cloudy
          </Text>
        </TouchableOpacity>
      </View>

      {/* BIG ACTION BUTTONS */}
      <View style={styles.actionRow}>
        <BigAction
          icon={<Route />}
          label="Plan Trip"
          onPress={() =>
            navigation.navigate('TripPlanner')
          }
        />
        <BigAction
          icon={<Navigation />}
          label="Navigate"
          onPress={() =>
            navigation.navigate('Map')
          }
        />
        <BigAction
          icon={<WifiOff />}
          label="Offline"
          onPress={() =>
            navigation.navigate('Offline')
          }
        />
      </View>

      {/* MAP PLACEHOLDER */}
      <View style={styles.mapBox}>
        <Text style={styles.mapText}>
          Map preview here
        </Text>
      </View>

      {/* SOS */}
      <TouchableOpacity
        style={styles.sosButton}
        onPress={() =>
          navigation.navigate('SOS')
        }
      >
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>
    </View>
  );
}

function BigAction({
  icon,
  label,
  onPress,
}: any) {
  return (
    <TouchableOpacity
      style={styles.bigActionCard}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {React.cloneElement(icon, {
        size: 26,
        color: '#3B82F6',
      })}
      <Text style={styles.bigActionText}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
    padding: 16,
  },

  header: {
    marginTop: 20,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  greeting: {
    color: '#94A3B8',
    fontSize: 13,
  },
  name: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },

  cardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },

  statusCard: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 18,
    borderRadius: 16,
  },

  cardTitle: {
    color: '#22C55E',
    marginTop: 10,
    fontWeight: '600',
  },

  cardSub: {
    color: '#9CA3AF',
    marginTop: 6,
  },

  temp: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  bigActionCard: {
    flex: 1,
    height: 110,
    backgroundColor: '#111827',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },

  bigActionText: {
    color: '#FFF',
    marginTop: 10,
    fontSize: 14,
    fontWeight: '500',
  },

  mapBox: {
    height: 180,
    backgroundColor: '#111827',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  mapText: {
    color: '#9CA3AF',
  },

  sosButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#DC2626',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },

  sosText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
