import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import {
  ShieldCheck,
  Navigation,
  Route,
  WifiOff,
  Bell,
} from 'lucide-react-native';

export default function HomeDashboard() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <Image
            source={require('../../../assets/images/placeholders/avatar-default.png')}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.greeting}>Good Morning</Text>
            <Text style={styles.name}>Welcome back, Alex</Text>
          </View>
        </View>

        <Bell color="#94A3B8" size={22} />
      </View>

      {/* Status Cards */}
      <View style={styles.cardRow}>
        <View style={styles.card}>
          <ShieldCheck color="#22C55E" size={22} />
          <Text style={styles.cardTitle}>SECURE</Text>
          <Text style={styles.cardSub}>Safety Status</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.temp}>24°C</Text>
          <Text style={styles.cardSub}>Partly Cloudy</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Action icon={<Route />} label="Plan Trip" />
        <Action icon={<Navigation />} label="Navigate" />
        <Action icon={<WifiOff />} label="Offline" />
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapBox}>
        <Image
          source={require('../../../assets/images/placeholders/location-default.png')}
          style={styles.mapImage}
        />
      </View>

      {/* SOS */}
      <TouchableOpacity style={styles.sosButton}>
        <Image
          source={require('../../../assets/images/icons/sos-red.png')}
          style={styles.sosImage}
        />
      </TouchableOpacity>
    </View>
  );
}

function Action({ icon, label }: any) {
  return (
    <View style={styles.actionCard}>
      {React.cloneElement(icon, {
        size: 22,
        color: '#3B82F6',
      })}
      <Text style={styles.actionText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  profileRow: {
    flexDirection: 'row',
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
  },
  card: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 14,
  },
  cardTitle: {
    color: '#22C55E',
    marginTop: 8,
    fontWeight: '600',
  },
  cardSub: {
    color: '#9CA3AF',
    marginTop: 4,
  },
  temp: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionText: {
    color: '#FFF',
    marginTop: 6,
    fontSize: 13,
  },
  mapBox: {
    backgroundColor: '#111827',
    borderRadius: 16,
    overflow: 'hidden',
    height: 180,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  sosButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
  sosImage: {
    width: 56,
    height: 56,
  },
});
