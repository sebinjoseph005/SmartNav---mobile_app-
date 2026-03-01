import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { getCachedLocation } from '../../services/locationCache';
import {
    ArrowLeft,
    Users,
    Clock,
    MapPin,
    TrendingUp,
    TrendingDown,
    Minus,
    Coffee,
    TreePine,
    Camera,
    ShoppingBag,
    Utensils,
    RefreshCw,
} from 'lucide-react-native';

interface CrowdPlace {
    id: number;
    name: string;
    type: string;
    category: string;
    crowdLevel: 'low' | 'moderate' | 'high' | 'very_high';
    crowdScore: number; // 0-100
    bestTime: string;
    currentBusy: string;
    latitude: number;
    longitude: number;
}

const getCrowdColor = (level: string) => {
    switch (level) {
        case 'low': return '#10B981';
        case 'moderate': return '#F59E0B';
        case 'high': return '#EF4444';
        case 'very_high': return '#DC2626';
        default: return '#64748B';
    }
};

const getCrowdLabel = (level: string) => {
    switch (level) {
        case 'low': return 'Quiet';
        case 'moderate': return 'Moderate';
        case 'high': return 'Busy';
        case 'very_high': return 'Very Busy';
        default: return 'Unknown';
    }
};

const getCrowdEmoji = (level: string) => {
    switch (level) {
        case 'low': return '🟢';
        case 'moderate': return '🟡';
        case 'high': return '🔴';
        case 'very_high': return '🔴';
        default: return '⚪';
    }
};

const estimateCrowdLevel = (type: string, hour: number, day: number): { level: CrowdPlace['crowdLevel']; score: number; bestTime: string; currentBusy: string } => {
    const isWeekend = day === 0 || day === 6;
    const isMorning = hour >= 7 && hour <= 10;
    const isLunch = hour >= 12 && hour <= 14;
    const isAfternoon = hour >= 15 && hour <= 18;
    const isEvening = hour >= 18 && hour <= 22;
    const isNight = hour > 22 || hour < 7;

    let baseScore = 30;

    if (type.includes('restaurant') || type.includes('cafe')) {
        if (isLunch) baseScore = 85;
        else if (isEvening) baseScore = 90;
        else if (isMorning && type.includes('cafe')) baseScore = 70;
        else baseScore = 35;
        if (isWeekend) baseScore = Math.min(baseScore + 15, 100);
        return {
            score: baseScore,
            level: baseScore > 75 ? 'very_high' : baseScore > 55 ? 'high' : baseScore > 35 ? 'moderate' : 'low',
            bestTime: 'Before 11 AM or after 2 PM',
            currentBusy: isLunch || isEvening ? 'Peak hours right now' : 'Relatively calm',
        };
    }

    if (type.includes('attraction') || type.includes('museum')) {
        if (isAfternoon && isWeekend) baseScore = 90;
        else if (isAfternoon) baseScore = 70;
        else if (isMorning) baseScore = 45;
        else baseScore = 50;
        if (isNight) baseScore = 5;
        return {
            score: baseScore,
            level: baseScore > 75 ? 'very_high' : baseScore > 55 ? 'high' : baseScore > 35 ? 'moderate' : 'low',
            bestTime: 'Early morning (8–10 AM)',
            currentBusy: isAfternoon && isWeekend ? 'Very crowded right now' : 'Moderate crowd',
        };
    }

    if (type.includes('park') || type.includes('garden')) {
        if (isMorning) baseScore = isWeekend ? 60 : 45;
        else if (isAfternoon) baseScore = isWeekend ? 75 : 55;
        else if (isEvening) baseScore = 70;
        else baseScore = 20;
        return {
            score: baseScore,
            level: baseScore > 75 ? 'very_high' : baseScore > 55 ? 'high' : baseScore > 35 ? 'moderate' : 'low',
            bestTime: 'Weekday mornings',
            currentBusy: isEvening ? 'Evening walker rush' : 'Comfortable now',
        };
    }

    if (type.includes('mall') || type.includes('shopping')) {
        if (isAfternoon && isWeekend) baseScore = 95;
        else if (isWeekend) baseScore = 80;
        else if (isAfternoon) baseScore = 65;
        else baseScore = 40;
        return {
            score: baseScore,
            level: baseScore > 75 ? 'very_high' : baseScore > 55 ? 'high' : baseScore > 35 ? 'moderate' : 'low',
            bestTime: 'Weekday 10 AM – 12 PM',
            currentBusy: isWeekend ? 'Weekend rush' : 'Manageable',
        };
    }

    return {
        score: 40,
        level: 'moderate',
        bestTime: 'Early morning',
        currentBusy: 'Moderate crowd',
    };
};

const getTypeIcon = (type: string) => {
    if (type.includes('restaurant') || type.includes('food')) return <Utensils size={18} color="#3B82F6" />;
    if (type.includes('cafe')) return <Coffee size={18} color="#3B82F6" />;
    if (type.includes('park') || type.includes('garden')) return <TreePine size={18} color="#3B82F6" />;
    if (type.includes('attraction') || type.includes('museum')) return <Camera size={18} color="#3B82F6" />;
    if (type.includes('mall') || type.includes('shop')) return <ShoppingBag size={18} color="#3B82F6" />;
    return <MapPin size={18} color="#3B82F6" />;
};

export default function CrowdInsightScreen() {
    const navigation = useNavigation<any>();
    const [places, setPlaces] = useState<CrowdPlace[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState('');
    const [locationName, setLocationName] = useState('your area');

    const loadCrowdData = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const loc = await getCachedLocation();
            if (!loc) return;
            const { latitude, longitude } = loc;

            // Reverse geocode for location name
            try {
                const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
                if (geo[0]) {
                    setLocationName(geo[0].district || geo[0].city || geo[0].subregion || 'your area');
                }
            } catch { }

            const query = `
        [out:json][timeout:25];
        (
          node["tourism"="attraction"](around:3000,${latitude},${longitude});
          node["tourism"="museum"](around:3000,${latitude},${longitude});
          node["amenity"="restaurant"](around:3000,${latitude},${longitude});
          node["amenity"="cafe"](around:3000,${latitude},${longitude});
          node["leisure"="park"](around:3000,${latitude},${longitude});
          node["leisure"="garden"](around:3000,${latitude},${longitude});
          node["shop"="mall"](around:3000,${latitude},${longitude});
        );
        out body;>;out skel qt;
      `;

            const response = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: query,
            });

            if (!response.ok) throw new Error('API error');

            const data = await response.json();
            const now = new Date();
            const hour = now.getHours();
            const day = now.getDay();

            const crowdPlaces: CrowdPlace[] = data.elements
                .filter((p: any) => p.lat && p.lon && p.tags?.name)
                .map((p: any) => {
                    const type = p.tags?.tourism || p.tags?.amenity || p.tags?.leisure || p.tags?.shop || 'place';
                    const crowd = estimateCrowdLevel(type, hour, day);
                    return {
                        id: p.id,
                        name: p.tags.name,
                        type,
                        category: type,
                        crowdLevel: crowd.level,
                        crowdScore: crowd.score,
                        bestTime: crowd.bestTime,
                        currentBusy: crowd.currentBusy,
                        latitude: p.lat,
                        longitude: p.lon,
                    };
                })
                .sort((a: CrowdPlace, b: CrowdPlace) => b.crowdScore - a.crowdScore)
                .slice(0, 15);

            setPlaces(crowdPlaces);
            setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } catch { }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadCrowdData(); }, []);

    const stats = {
        low: places.filter(p => p.crowdLevel === 'low').length,
        moderate: places.filter(p => p.crowdLevel === 'moderate').length,
        high: places.filter(p => p.crowdLevel === 'high' || p.crowdLevel === 'very_high').length,
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <ArrowLeft size={22} color="#F1F5F9" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Crowd Insight</Text>
                    <Text style={styles.headerSub}>{locationName}</Text>
                </View>
                <TouchableOpacity style={styles.refreshBtn} onPress={() => loadCrowdData(true)}>
                    <RefreshCw size={18} color="#3B82F6" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Analyzing crowd levels…</Text>
                    <Text style={styles.loadingSubText}>Checking nearby places</Text>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadCrowdData(true)} tintColor="#3B82F6" />}
                >
                    {/* Overview Stats */}
                    <View style={styles.statsRow}>
                        <View style={[styles.statCard, { borderColor: 'rgba(16,185,129,0.3)' }]}>
                            <Text style={[styles.statNum, { color: '#10B981' }]}>{stats.low}</Text>
                            <Text style={styles.statLabel}>🟢 Quiet</Text>
                        </View>
                        <View style={[styles.statCard, { borderColor: 'rgba(245,158,11,0.3)' }]}>
                            <Text style={[styles.statNum, { color: '#F59E0B' }]}>{stats.moderate}</Text>
                            <Text style={styles.statLabel}>🟡 Moderate</Text>
                        </View>
                        <View style={[styles.statCard, { borderColor: 'rgba(239,68,68,0.3)' }]}>
                            <Text style={[styles.statNum, { color: '#EF4444' }]}>{stats.high}</Text>
                            <Text style={styles.statLabel}>🔴 Busy</Text>
                        </View>
                    </View>

                    {lastUpdated ? (
                        <Text style={styles.lastUpdated}>Updated {lastUpdated} · Based on time of day patterns</Text>
                    ) : null}

                    {/* Place Cards */}
                    <View style={styles.listContainer}>
                        {places.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Users size={48} color="#1E293B" />
                                <Text style={styles.emptyText}>No places found nearby</Text>
                                <Text style={styles.emptySubText}>Try refreshing or move to a busier area</Text>
                            </View>
                        ) : (
                            places.map((place) => (
                                <TouchableOpacity
                                    key={place.id}
                                    style={styles.placeCard}
                                    activeOpacity={0.8}
                                    onPress={() => navigation.navigate('Map', {
                                        screen: 'MapMain',
                                        params: {
                                            destination: { latitude: place.latitude, longitude: place.longitude, name: place.name, type: place.type },
                                            startNavigation: true,
                                        }
                                    })}
                                >
                                    <View style={styles.placeLeft}>
                                        <View style={styles.placeIconWrap}>
                                            {getTypeIcon(place.type)}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.placeName} numberOfLines={1}>{place.name}</Text>
                                            <Text style={styles.placeCurrentBusy}>{place.currentBusy}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.placeRight}>
                                        <View style={[styles.crowdBadge, { backgroundColor: `${getCrowdColor(place.crowdLevel)}20`, borderColor: `${getCrowdColor(place.crowdLevel)}40` }]}>
                                            <Text style={[styles.crowdBadgeText, { color: getCrowdColor(place.crowdLevel) }]}>
                                                {getCrowdEmoji(place.crowdLevel)} {getCrowdLabel(place.crowdLevel)}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Crowd bar */}
                                    <View style={styles.crowdBarWrap}>
                                        <View style={styles.crowdBarBg}>
                                            <View style={[styles.crowdBarFill, {
                                                width: `${place.crowdScore}%` as any,
                                                backgroundColor: getCrowdColor(place.crowdLevel),
                                            }]} />
                                        </View>
                                        <Text style={styles.crowdBarPct}>{place.crowdScore}% busy</Text>
                                    </View>

                                    {/* Best time */}
                                    <View style={styles.bestTimeRow}>
                                        <Clock size={12} color="#64748B" />
                                        <Text style={styles.bestTimeText}>Best: {place.bestTime}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#080E1A' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 56,
        paddingHorizontal: 20,
        paddingBottom: 18,
        backgroundColor: '#0B1220',
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
        gap: 12,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#1E293B',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#F1F5F9' },
    headerSub: { fontSize: 12, color: '#64748B', marginTop: 1 },
    refreshBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(59,130,246,0.12)',
        justifyContent: 'center', alignItems: 'center',
    },

    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100, gap: 12 },
    loadingText: { color: '#94A3B8', fontSize: 16, fontWeight: '600', marginTop: 8 },
    loadingSubText: { color: '#334155', fontSize: 13 },

    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginHorizontal: 16,
        marginTop: 20,
        marginBottom: 10,
    },
    statCard: {
        flex: 1, backgroundColor: '#0F172A',
        borderRadius: 16, padding: 16,
        alignItems: 'center', gap: 6,
        borderWidth: 1,
    },
    statNum: { fontSize: 28, fontWeight: '800' },
    statLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },

    lastUpdated: {
        textAlign: 'center', color: '#334155',
        fontSize: 11, marginBottom: 16,
    },

    listContainer: { paddingHorizontal: 16 },

    placeCard: {
        backgroundColor: '#0F172A',
        borderRadius: 18, padding: 16,
        marginBottom: 12,
        borderWidth: 1, borderColor: '#1E293B',
        gap: 10,
    },
    placeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    placeIconWrap: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(59,130,246,0.1)',
        justifyContent: 'center', alignItems: 'center',
    },
    placeName: { fontSize: 15, fontWeight: '700', color: '#F1F5F9', marginBottom: 2 },
    placeCurrentBusy: { fontSize: 11, color: '#64748B' },

    placeRight: { position: 'absolute', top: 16, right: 16 },
    crowdBadge: {
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 20, borderWidth: 1,
    },
    crowdBadgeText: { fontSize: 11, fontWeight: '700' },

    crowdBarWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    crowdBarBg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#1E293B', overflow: 'hidden' },
    crowdBarFill: { height: '100%', borderRadius: 3 },
    crowdBarPct: { fontSize: 11, color: '#475569', width: 60, textAlign: 'right' },

    bestTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    bestTimeText: { fontSize: 11, color: '#475569', fontStyle: 'italic' },

    emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
    emptyText: { color: '#94A3B8', fontSize: 18, fontWeight: '700' },
    emptySubText: { color: '#334155', fontSize: 13 },
});
