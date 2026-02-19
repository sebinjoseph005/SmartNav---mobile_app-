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

  // Debug logging
  console.log('🔍 AIItineraryResult received params:', {
    destination,
    hasItinerary: !!itinerary,
    itinerary: itinerary,
    isMockData,
  });

  // Get activities for current day
  const currentDayActivities = itinerary?.timeline?.[day - 1]?.activities || [];
  const totalDays = itinerary?.timeline?.length || 4;
  
  console.log('📅 Current day:', day, 'Total days:', totalDays);
  console.log('🎯 Activities for day:', currentDayActivities.length);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('TripPlanner')}
            style={styles.backButton}
          >
            <ArrowLeft color="#fff" size={22} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.title} numberOfLines={2}>
              {destination || 'Your Trip'}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              AI Generated • {interests?.join(', ') || 'Custom'}
              {isMockData && ' • Demo'}
            </Text>
          </View>

          <View style={styles.headerRight} />
        </View>

        {/* DAY TABS */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.dayTabsContainer}
          contentContainerStyle={styles.dayTabsContent}
        >
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
        </ScrollView>

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
            onPress={() => navigation.navigate('TripPlanner')}
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
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {title}
            </Text>
          </View>
          <Text style={styles.rating}>⭐ {rating}</Text>
        </View>

        <Text style={styles.subtitleText} numberOfLines={2}>
          {subtitle}
        </Text>
        <Text style={styles.info} numberOfLines={3}>
          {info}
        </Text>

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
  root: { 
    flex: 1, 
    backgroundColor: '#0B1220' 
  },
  container: { 
    padding: 16, 
    paddingTop: 40 
  },

  // Fixed Header with proper alignment
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align items at the top
    marginBottom: 20,
    minHeight: 60, // Ensure minimum height
  },
  backButton: {
    marginTop: 4, // Align icon with first line of text
    width: 30, // Fixed width for back button area
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 12, // Space between back button and content
    justifyContent: 'center',
  },
  headerRight: {
    width: 30, // Balance the layout with back button
  },
  title: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '600',
    lineHeight: 24, // Proper line height for wrapping
    marginBottom: 4,
    // Allow text to wrap naturally
  },
  subtitle: { 
    color: '#94A3B8', 
    fontSize: 12,
    lineHeight: 16,
  },

  dayTabsContainer: {
    marginBottom: 20,
  },
  dayTabsContent: {
    gap: 10,
    paddingHorizontal: 2,
  },
  dayTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#111827',
  },
  dayTabActive: { 
    backgroundColor: '#2563EB' 
  },
  dayText: { 
    color: '#94A3B8' 
  },
  dayTextActive: { 
    color: '#fff', 
    fontWeight: '600' 
  },

  timeline: { 
    marginBottom: 20 
  },
  time: { 
    color: '#94A3B8', 
    marginBottom: 6,
    fontSize: 13,
  },

  card: {
    backgroundColor: '#111827',
    padding: 14,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: { 
    color: '#fff', 
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 20,
    // Allow title to wrap
  },
  rating: { 
    color: '#FACC15',
    fontSize: 13,
    flexShrink: 0,
    marginTop: 2, // Align with first line of title
  },
  subtitleText: { 
    color: '#94A3B8', 
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  info: { 
    color: '#64748B', 
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },

  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#064E3B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { 
    color: '#22C55E', 
    fontSize: 11,
    fontWeight: '500',
  },

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
  actionText: { 
    color: '#fff', 
    fontSize: 12 
  },

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
  sosText: { 
    color: '#fff', 
    fontWeight: '700',
    fontSize: 15,
  },
});