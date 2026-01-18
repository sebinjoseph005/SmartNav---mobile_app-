import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  ArrowLeft,
  Shield,
  Bookmark,
  Share2,
  Pencil,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function AIItineraryResult() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [day, setDay] = useState(1);
  const [safetyMode, setSafetyMode] = useState(true);

  const { destination, itinerary, budget, currency, interests, isMockData } = route.params || {};

  // Get activities for current day
  const currentDayActivities = itinerary?.timeline?.[day - 1]?.activities || [];
  const totalDays = itinerary?.timeline?.length || 4;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft color="#fff" size={22} />
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Text style={styles.title}>{destination || 'Your Trip'}</Text>
            <Text style={styles.subtitle}>
              AI Generated • {interests?.join(', ') || 'Custom'}
              {isMockData && ' • Demo'}
            </Text>
          </View>

          <View style={{ width: 22 }} />
        </View>

        {/* DAY TABS */}
        <View style={styles.dayTabs}>
          {Array.from({ length: totalDays }, (_, i) => i + 1).map(d => (
            <TouchableOpacity
              key={d}
              style={[
                styles.dayTab,
                day === d && styles.dayTabActive,
              ]}
              onPress={() => setDay(d)}
            >
              <Text
                style={[
                  styles.dayText,
                  day === d && styles.dayTextActive,
                ]}
              >
                Day {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SAFETY MODE */}
        <View style={styles.safetyCard}>
          <Shield color="#3B82F6" size={20} />
          <View style={{ flex: 1 }}>
            <Text style={styles.safetyTitle}>Safety Mode</Text>
            <Text style={styles.safetySub}>
              Highlight crowds & zones
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.toggle,
              safetyMode && styles.toggleActive,
            ]}
            onPress={() => setSafetyMode(!safetyMode)}
          >
            <View
              style={[
                styles.toggleDot,
                safetyMode && styles.toggleDotActive,
              ]}
            />
          </TouchableOpacity>
        </View>

        {/* TIMELINE */}
        {currentDayActivities.length > 0 ? (
          currentDayActivities.map((activity: any, index: number) => (
            <TimelineItem
              key={index}
              time={activity.time}
              title={activity.title}
              subtitle={activity.subtitle}
              rating={activity.rating}
              badge={activity.badge}
              info={activity.info}
            />
          ))
        ) : (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#9CA3AF', fontSize: 14 }}>
              No activities planned for this day
            </Text>
          </View>
        )}

        {/* ACTIONS */}
        <View style={styles.actions}>
          <ActionBtn icon={<Bookmark size={18} />} label="Save" />
          <ActionBtn icon={<Share2 size={18} />} label="Share" />
          <ActionBtn
            icon={<Pencil size={18} />}
            label="Edit"
            onPress={() => navigation.navigate('TripPlannerInput')}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FLOATING SOS */}
      <TouchableOpacity style={styles.sos}>
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>
    </View>
  );
}

/* --------- COMPONENTS --------- */

function TimelineItem({
  time,
  title,
  subtitle,
  rating,
  badge,
  info,
}: any) {
  return (
    <View style={styles.timeline}>
      <Text style={styles.time}>{time}</Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.rating}>⭐ {rating}</Text>
        </View>

        <Text style={styles.subtitleText}>{subtitle}</Text>
        <Text style={styles.info}>{info}</Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      </View>
    </View>
  );
}

function ActionBtn({ icon, label, onPress }: any) {
  return (
    <TouchableOpacity
      style={styles.actionBtn}
      onPress={onPress}
    >
      {icon}
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

/* --------- STYLES --------- */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B1220' },
  container: { padding: 16, paddingTop: 40 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '600' },
  subtitle: { color: '#94A3B8', fontSize: 12 },

  dayTabs: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 20,
  },
  dayTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#111827',
  },
  dayTabActive: { backgroundColor: '#2563EB' },
  dayText: { color: '#94A3B8' },
  dayTextActive: { color: '#fff', fontWeight: '600' },

  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12,
  },
  safetyTitle: { color: '#fff', fontWeight: '600' },
  safetySub: { color: '#94A3B8', fontSize: 12 },

  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1F2933',
    padding: 3,
  },
  toggleActive: { backgroundColor: '#2563EB' },
  toggleDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#64748B',
  },
  toggleDotActive: {
    backgroundColor: '#fff',
    marginLeft: 20,
  },

  timeline: { marginBottom: 20 },
  time: { color: '#94A3B8', marginBottom: 6 },

  card: {
    backgroundColor: '#111827',
    padding: 14,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitle: { color: '#fff', fontWeight: '600' },
  rating: { color: '#FACC15' },
  subtitleText: { color: '#94A3B8', marginTop: 4 },
  info: { color: '#64748B', marginTop: 6 },

  badge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#064E3B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { color: '#22C55E', fontSize: 12 },

  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#111827',
    marginHorizontal: 6,
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    gap: 4,
  },
  actionText: { color: '#fff', fontSize: 12 },

  sos: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosText: { color: '#fff', fontWeight: '700' },
});
