import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  ArrowLeft,
  Share2,
  Sun,
  CloudRain,
  Cloud,
  AlertTriangle,
  MapPin,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

/* ---------------- MOCK DATA ---------------- */

const CURRENT = {
  temp: 24,
  condition: 'Partly Cloudy',
  feelsLike: 26,
  high: 28,
  low: 19,
};

const HOURLY = [
  { time: 'Now', temp: 24, active: true },
  { time: '1 PM', temp: 25 },
  { time: '2 PM', temp: 24 },
  { time: '3 PM', temp: 22 },
  { time: '4 PM', temp: 20 },
];

const WEEKLY = [
  { day: 'Today', icon: 'rain', low: 18, high: 22 },
  { day: 'Tue', icon: 'sun', low: 20, high: 25 },
  { day: 'Wed', icon: 'cloud', low: 19, high: 23 },
  { day: 'Thu', icon: 'sun', low: 21, high: 28 },
];

/* ---------------- SCREEN ---------------- */

export default function WeatherDetails() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.root}>
      {/* SCROLL CONTENT */}
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft color="#fff" size={22} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Weather Details</Text>

          <TouchableOpacity>
            <Share2 color="#fff" size={20} />
          </TouchableOpacity>
        </View>

        {/* MAIN WEATHER */}
        <View style={styles.mainWeather}>
          <Sun color="#FACC15" size={48} />
          <Text style={styles.temp}>{CURRENT.temp}°C</Text>
          <Text style={styles.condition}>{CURRENT.condition}</Text>
          <Text style={styles.feels}>
            Feels like {CURRENT.feelsLike}°C • H:{CURRENT.high}° L:{CURRENT.low}°
          </Text>
        </View>

        {/* ALERT */}
        <View style={styles.alertBox}>
          <View style={styles.alertRow}>
            <AlertTriangle color="#F59E0B" size={18} />
            <Text style={styles.alertTitle}>Heat Advisory</Text>
          </View>
          <Text style={styles.alertText}>
            High temperatures expected. Hydrate frequently and avoid direct sun.
          </Text>

          <TouchableOpacity style={styles.alertButton}>
            <Text style={styles.alertButtonText}>
              View Safety Guidelines
            </Text>
          </TouchableOpacity>
        </View>

        {/* HOURLY */}
        <Text style={styles.sectionTitle}>Hourly Forecast</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {HOURLY.map((h, i) => (
            <View
              key={i}
              style={[
                styles.hourCard,
                h.active && styles.hourActive,
              ]}
            >
              <Text
                style={[
                  styles.hourTime,
                  h.active && styles.hourActiveText,
                ]}
              >
                {h.time}
              </Text>
              <Sun
                color={h.active ? '#fff' : '#94A3B8'}
                size={18}
              />
              <Text
                style={[
                  styles.hourTemp,
                  h.active && styles.hourActiveText,
                ]}
              >
                {h.temp}°
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* TRAVEL TIPS */}
        <Text style={styles.sectionTitle}>Travel Tips</Text>

<View style={styles.tipsRow}>
  <View style={styles.tipCard}>
    <Sun color="#FACC15" size={20} />
    <Text style={styles.tipText}>UV Index High</Text>
  </View>

  <View style={styles.tipCard}>
    <CloudRain color="#60A5FA" size={20} />
    <Text style={styles.tipText}>Rain Expected</Text>
  </View>
</View>



        {/* WEEKLY */}
        <Text style={styles.sectionTitle}>7-day forecast</Text>

        <View style={styles.weekBox}>
          {WEEKLY.map((d, i) => (
            <View key={i} style={styles.weekRow}>
              <Text style={styles.weekDay}>{d.day}</Text>

              {d.icon === 'sun' && (
                <Sun color="#FACC15" size={18} />
              )}
              {d.icon === 'cloud' && (
                <Cloud color="#9CA3AF" size={18} />
              )}
              {d.icon === 'rain' && (
                <CloudRain color="#60A5FA" size={18} />
              )}

              <View style={styles.weekTempRow}>
                <Text style={styles.weekLow}>{d.low}°</Text>
                <View style={styles.tempBar} />
                <Text style={styles.weekHigh}>{d.high}°</Text>
              </View>
            </View>
          ))}
        </View>

        {/* MAP */}
        <View style={styles.mapBox}>
          <Text style={styles.mapText}>300 × 300</Text>
          <TouchableOpacity style={styles.mapButton}>
            <MapPin color="#fff" size={16} />
            <Text style={styles.mapButtonText}>Open Map</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FLOATING SOS (FIXED) */}
      <TouchableOpacity
        style={styles.floatingSOS}
        onPress={() => navigation.navigate('SOS')}
        activeOpacity={0.85}
      >
        <Text style={styles.floatingSOSText}>SOS</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B1220',
  },

  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 36, // 👈 pulled down slightly
  },

  header: {
    marginTop: 8,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  mainWeather: {
    alignItems: 'center',
    marginBottom: 24,
  },
  temp: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '700',
    marginTop: 8,
  },
  condition: {
    color: '#CBD5F5',
    fontSize: 16,
    marginTop: 4,
  },
  feels: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 6,
  },

  alertBox: {
    backgroundColor: '#2A1F10',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  alertTitle: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  alertText: {
    color: '#FCD34D',
    fontSize: 13,
    marginBottom: 12,
  },
  alertButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#3B2F14',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  alertButtonText: {
    color: '#FACC15',
    fontSize: 12,
    fontWeight: '600',
  },

  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },

  hourCard: {
    width: 64,
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 10,
  },
  hourActive: {
    backgroundColor: '#2563EB',
  },
  hourTime: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 6,
  },
  hourTemp: {
    color: '#fff',
    marginTop: 6,
    fontWeight: '600',
  },
  hourActiveText: {
    color: '#fff',
  },

  tipsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  tipCard: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  tipText: {
    color: '#fff',
    fontSize: 12,
  },
  tipSOS: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosText: {
    color: '#fff',
    fontWeight: '700',
  },

  weekBox: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weekDay: {
    color: '#fff',
    width: 60,
  },
  weekTempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weekLow: {
    color: '#94A3B8',
  },
  weekHigh: {
    color: '#fff',
  },
  tempBar: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2563EB',
  },

  mapBox: {
    height: 200,
    backgroundColor: '#1F2933',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    color: '#9CA3AF',
    marginBottom: 12,
  },
  mapButton: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  /* FLOATING SOS */
  floatingSOS: {
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
  floatingSOSText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
