import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Share2,
  Pencil,
  MapPin,
  List,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import SafeMapView from '../../components/SafeMapView';
import { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { useAuth } from '../../context/AuthContext';
import { saveTrip } from '../../services/tripService';

export default function AIItineraryResult() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();

  const [day, setDay] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const {
    destination,
    itinerary,
    budget,
    currency,
    interests,
    isMockData,
    fromDate,
    toDate,
    travelers,
  } = route.params || {};

  // Get activities for current day
  const currentDayActivities = itinerary?.timeline?.[day - 1]?.activities || [];
  const totalDays = itinerary?.timeline?.length || 4;

  // Activities that have GPS coordinates (for map)
  const mappableActivities = currentDayActivities.filter(
    (a: any) => a.lat && a.lon && !isNaN(a.lat) && !isNaN(a.lon)
  );

  // Map region centred on the first mappable activity
  const mapRegion =
    mappableActivities.length > 0
      ? {
        latitude: mappableActivities[0].lat,
        longitude: mappableActivities[0].lon,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      }
      : {
        latitude: 20.5937,
        longitude: 78.9629,
        latitudeDelta: 10,
        longitudeDelta: 10,
      };

  const polylineCoords = mappableActivities.map((a: any) => ({
    latitude: a.lat,
    longitude: a.lon,
  }));

  // ─── Save Trip ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (saved || saving) return;

    if (!user) {
      Alert.alert('Not logged in', 'Please log in to save trips.');
      return;
    }

    try {
      setSaving(true);
      await saveTrip({
        userId: user.id,
        destination: destination || 'Unknown',
        interests: interests || [],
        fromDate: fromDate || '',
        toDate: toDate || '',
        travelers: travelers || 1,
        budget: budget || 0,
        currency: currency || 'INR',
        itinerary,
      });
      setSaved(true);
    } catch (err: any) {
      Alert.alert('Save failed', err.message || 'Could not save the trip. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
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

        {/* ── DAY TABS ───────────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dayTabsContainer}
          contentContainerStyle={styles.dayTabsContent}
        >
          {Array.from({ length: totalDays }, (_, i) => i + 1).map(d => (
            <TouchableOpacity
              key={d}
              style={[styles.dayTab, day === d && styles.dayTabActive]}
              onPress={() => setDay(d)}
            >
              <Text style={[styles.dayText, day === d && styles.dayTextActive]}>
                Day {d}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── VIEW MODE TOGGLE (List / Map) ──────────────────────────────── */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <List size={16} color={viewMode === 'list' ? '#fff' : '#94A3B8'} />
            <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
              Timeline
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
            onPress={() => setViewMode('map')}
          >
            <MapPin size={16} color={viewMode === 'map' ? '#fff' : '#94A3B8'} />
            <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>
              Map Route
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── TIMELINE VIEW ──────────────────────────────────────────────── */}
        {viewMode === 'list' && (
          <>
            {currentDayActivities.length > 0 ? (
              currentDayActivities.map((activity: any, index: number) => (
                <TimelineItem
                  key={index}
                  index={index}
                  time={activity.time}
                  title={activity.title}
                  subtitle={activity.subtitle}
                  rating={activity.rating}
                  badge={activity.badge}
                  info={activity.info}
                  hasCoords={!!(activity.lat && activity.lon)}
                />
              ))
            ) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#9CA3AF', fontSize: 14 }}>
                  No activities planned for this day
                </Text>
              </View>
            )}
          </>
        )}

        {/* ── MAP ROUTE VIEW ─────────────────────────────────────────────── */}
        {viewMode === 'map' && (
          <View style={styles.mapContainer}>
            {mappableActivities.length > 0 ? (
              <>
                <SafeMapView
                  provider={PROVIDER_DEFAULT}
                  style={styles.map}
                  region={mapRegion}
                  showsUserLocation={false}
                >
                  {/* Route polyline */}
                  {polylineCoords.length > 1 && (
                    <Polyline
                      coordinates={polylineCoords}
                      strokeColor="#2563EB"
                      strokeWidth={3}
                      lineDashPattern={[0]}
                    />
                  )}

                  {/* Activity markers */}
                  {mappableActivities.map((activity: any, index: number) => (
                    <Marker
                      key={index}
                      coordinate={{ latitude: activity.lat, longitude: activity.lon }}
                      title={`${index + 1}. ${activity.title}`}
                      description={activity.time}
                    >
                      <View style={styles.markerBubble}>
                        <Text style={styles.markerNumber}>{index + 1}</Text>
                      </View>
                    </Marker>
                  ))}
                </SafeMapView>

                {/* Map legend */}
                <View style={styles.mapLegend}>
                  {mappableActivities.map((activity: any, index: number) => (
                    <View key={index} style={styles.legendItem}>
                      <View style={styles.legendDot}>
                        <Text style={styles.legendDotText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.legendLabel} numberOfLines={1}>
                        {activity.time} · {activity.title}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.noMapData}>
                <MapPin size={40} color="#2563EB" />
                <Text style={styles.noMapText}>
                  No location data for Day {day} activities
                </Text>
                <Text style={styles.noMapSubtext}>
                  Coordinates are required to show the route
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── ACTIONS ────────────────────────────────────────────────────── */}
        <View style={styles.actions}>
          {/* Save button */}
          <TouchableOpacity
            style={[styles.actionBtn, saved && styles.actionBtnSaved]}
            onPress={handleSave}
            disabled={saving || saved}
          >
            {saving ? (
              <ActivityIndicator size={18} color="#fff" />
            ) : saved ? (
              <BookmarkCheck size={18} color="#22C55E" />
            ) : (
              <Bookmark size={18} color="#fff" />
            )}
            <Text style={[styles.actionText, saved && styles.actionTextSaved]}>
              {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
            </Text>
          </TouchableOpacity>

          <ActionBtn icon={<Share2 size={18} color="#fff" />} label="Share" />
          <ActionBtn
            icon={<Pencil size={18} color="#fff" />}
            label="Edit"
            onPress={() => navigation.navigate('TripPlanner')}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── FLOATING SOS ──────────────────────────────────────────────────── */}
      <TouchableOpacity style={styles.sos} onPress={() => navigation.navigate('SOS')}>
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ─── SUBCOMPONENTS ─────────────────────────────────────────────────────── */

function TimelineItem({
  index,
  time,
  title,
  subtitle,
  rating,
  badge,
  info,
  hasCoords,
}: any) {
  return (
    <View style={styles.timeline}>
      <View style={styles.timeRow}>
        <Text style={styles.time}>{time}</Text>
        {hasCoords && (
          <View style={styles.coordBadge}>
            <MapPin size={10} color="#2563EB" />
            <Text style={styles.coordBadgeText}>On map</Text>
          </View>
        )}
      </View>

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
    <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
      {icon}
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ─── STYLES ────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B1220' },
  container: { padding: 16, paddingTop: 40 },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    minHeight: 60,
  },
  backButton: { marginTop: 4, width: 30 },
  headerContent: { flex: 1, marginHorizontal: 12, justifyContent: 'center' },
  headerRight: { width: 30 },
  title: { color: '#fff', fontSize: 18, fontWeight: '600', lineHeight: 24, marginBottom: 4 },
  subtitle: { color: '#94A3B8', fontSize: 12, lineHeight: 16 },

  dayTabsContainer: { marginBottom: 14 },
  dayTabsContent: { gap: 10, paddingHorizontal: 2 },
  dayTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#111827' },
  dayTabActive: { backgroundColor: '#2563EB' },
  dayText: { color: '#94A3B8' },
  dayTextActive: { color: '#fff', fontWeight: '600' },

  // View mode toggle
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  toggleBtnActive: { backgroundColor: '#2563EB' },
  toggleText: { color: '#94A3B8', fontSize: 13, fontWeight: '500' },
  toggleTextActive: { color: '#fff', fontWeight: '600' },

  // Timeline
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  coordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(37,99,235,0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  coordBadgeText: { color: '#2563EB', fontSize: 10, fontWeight: '500' },
  timeline: { marginBottom: 20 },
  time: { color: '#94A3B8', fontSize: 13 },
  card: { backgroundColor: '#111827', padding: 14, borderRadius: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitleContainer: { flex: 1, marginRight: 8 },
  cardTitle: { color: '#fff', fontWeight: '600', fontSize: 16, lineHeight: 20 },
  rating: { color: '#FACC15', fontSize: 13, flexShrink: 0, marginTop: 2 },
  subtitleText: { color: '#94A3B8', fontSize: 13, lineHeight: 18, marginBottom: 6 },
  info: { color: '#64748B', fontSize: 12, lineHeight: 16, marginBottom: 8 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#064E3B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { color: '#22C55E', fontSize: 11, fontWeight: '500' },

  // Map
  mapContainer: { borderRadius: 20, overflow: 'hidden', marginBottom: 20 },
  map: { width: '100%', height: 320, borderRadius: 20 },
  mapLegend: { backgroundColor: '#111827', padding: 14, gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  legendDotText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  legendLabel: { color: '#CBD5E1', fontSize: 13, flex: 1 },
  noMapData: { alignItems: 'center', padding: 40, gap: 12, backgroundColor: '#111827', borderRadius: 20 },
  noMapText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  noMapSubtext: { color: '#64748B', fontSize: 13, textAlign: 'center' },

  // Marker
  markerBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  markerNumber: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Actions
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  actionBtn: {
    flex: 1,
    backgroundColor: '#111827',
    marginHorizontal: 6,
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    gap: 4,
  },
  actionBtnSaved: { backgroundColor: '#064E3B' },
  actionText: { color: '#fff', fontSize: 12 },
  actionTextSaved: { color: '#22C55E', fontWeight: '600' },

  // SOS
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
  sosText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
