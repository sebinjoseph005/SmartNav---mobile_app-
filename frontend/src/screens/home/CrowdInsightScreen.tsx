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

            const query = `
        [out:json][timeout:20];
        (
          node["tourism"="attraction"](around:4000,${latitude},${longitude});
          node["tourism"="museum"](around:4000,${latitude},${longitude});
          node["amenity"="restaurant"](around:4000,${latitude},${longitude});
          node["amenity"="cafe"](around:4000,${latitude},${longitude});
          node["leisure"="park"](around:4000,${latitude},${longitude});
          node["leisure"="garden"](around:4000,${latitude},${longitude});
          node["shop"="mall"](around:4000,${latitude},${longitude});
        );
        out body;>;out skel qt;
      `;

            // Race the two servers - fastest one wins!
            const fetchFromOSM = async () => {
                const SERVERS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
                
                try {
                    const response = await Promise.any(
                        SERVERS.map(async (server) => {
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s hard timeout
                            
                            try {
                                const res = await fetch(server, { 
                                    method: 'POST', 
                                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                    body: `data=${encodeURIComponent(query)}`,
                                    signal: controller.signal as RequestInit["signal"]
                                });
                                clearTimeout(timeoutId);
                                if (!res.ok) throw new Error('Bad response');
                                const ct = res.headers.get('content-type');
                                if (!ct || !ct.includes('application/json')) throw new Error('Bad content type');
                                return await res.json();
                            } catch (e) {
                                clearTimeout(timeoutId);
                                throw e;
                            }
                        })
                    );
                    return response;
                } catch (error) {
                    throw new Error('All servers failed');
                }
            };

            let data;
            try {
                // Run geocoding and OSM fetch in parallel
                const [geo, osmData] = await Promise.all([
                    Location.reverseGeocodeAsync({ latitude, longitude }).catch(() => null),
                    fetchFromOSM()
                ]);
                data = osmData;
                if (geo && geo[0]) {
                    setLocationName(geo[0].district || geo[0].city || geo[0].subregion || 'your area');
                }
            } catch (e) {
                console.warn("⚠️ Crowd Insight API Failed, using fallback data");
                data = { elements: [] };
                // Still try to get geocoding
                try {
                    const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
                    if (geo[0]) setLocationName(geo[0].district || geo[0].city || geo[0].subregion || 'your area');
                } catch { }
            }

            const now = new Date();
            const hour = now.getHours();
            const day = now.getDay();

            let crowdPlaces: CrowdPlace[] = [];
            
            if (data && data.elements) {
                crowdPlaces = data.elements
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
                    .slice(0, 25);
            }

            // 🛡️ CRITICAL FALLBACK: If API fails, ALWAYS show some simulated nearby places
            if (crowdPlaces.length === 0) {
                const types = ['restaurant', 'cafe', 'mall', 'park', 'attraction'];
                crowdPlaces = types.map((type, i) => {
                    const crowd = estimateCrowdLevel(type, hour, day);
                    return {
                        id: 999000 + i,
                        name: `Local ${type.charAt(0).toUpperCase() + type.slice(1)}`,
                        type: type,
                        category: type,
                        crowdLevel: crowd.level,
                        crowdScore: crowd.score,
                        bestTime: crowd.bestTime,
                        currentBusy: crowd.currentBusy,
                        latitude: latitude + (Math.random() - 0.5) * 0.02,
                        longitude: longitude + (Math.random() - 0.5) * 0.02,
                    };
                }).sort((a: CrowdPlace, b: CrowdPlace) => b.crowdScore - a.crowdScore);
            }

            setPlaces(crowdPlaces);
            setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } catch (e) { 
            console.error(e);
            setPlaces([]);
        }
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
                        <View style={[styles.statCard, { backgroundColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.2)' }]}>
                            <Text style={[styles.statNum, { color: '#10B981' }]}>{stats.low}</Text>
                            <Text style={[styles.statLabel, { color: '#10B981' }]}>Quiet</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)' }]}>
                            <Text style={[styles.statNum, { color: '#F59E0B' }]}>{stats.moderate}</Text>
                            <Text style={[styles.statLabel, { color: '#F59E0B' }]}>Moderate</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }]}>
                            <Text style={[styles.statNum, { color: '#EF4444' }]}>{stats.high}</Text>
                            <Text style={[styles.statLabel, { color: '#EF4444' }]}>Busy</Text>
                        </View>
                    </View>

                    {lastUpdated ? (
                        <Text style={styles.lastUpdated}>Updated {lastUpdated} · Based on time of day patterns</Text>
                    ) : null}

                    {/* Place Cards */}
                    <View style={styles.listContainer}>
                        {places.length === 0 ? (
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIconWrap}>
                                    <Users size={32} color="#3B82F6" />
                                </View>
                                <Text style={styles.emptyText}>No places found nearby</Text>
                                <Text style={styles.emptySubText}>Try refreshing or moving to a busier area.</Text>
                            </View>
                        ) : (
                            places.map((place) => (
                                <TouchableOpacity
                                    key={place.id}
                                    style={styles.placeCard}
                                    activeOpacity={0.7}
                                    onPress={() => navigation.navigate('Map', {
                                        screen: 'MapMain',
                                        params: {
                                            destination: { latitude: place.latitude, longitude: place.longitude, name: place.name, type: place.type },
                                            startNavigation: true,
                                        }
                                    })}
                                >
                                    <View style={styles.placeHeader}>
                                        <View style={styles.placeLeft}>
                                            <View style={styles.placeIconWrap}>
                                                {getTypeIcon(place.type)}
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.placeName} numberOfLines={1}>{place.name}</Text>
                                                <Text style={styles.placeCurrentBusy}>{place.currentBusy}</Text>
                                            </View>
                                        </View>
                                        <View style={[styles.crowdBadge, { backgroundColor: `${getCrowdColor(place.crowdLevel)}15`, borderColor: `${getCrowdColor(place.crowdLevel)}30` }]}>
                                            <Text style={[styles.crowdBadgeText, { color: getCrowdColor(place.crowdLevel) }]}>
                                                {getCrowdLabel(place.crowdLevel)}
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
                                        <Text style={styles.crowdBarPct}>{place.crowdScore}%</Text>
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
    container: { flex: 1, backgroundColor: '#050914' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 56,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: 'rgba(11,18,32,0.8)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        gap: 14,
    },
    backBtn: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: '#1E293B',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#F1F5F9', letterSpacing: -0.5 },
    headerSub: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
    refreshBtn: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: 'rgba(59,130,246,0.15)',
        justifyContent: 'center', alignItems: 'center',
    },

    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100, gap: 16 },
    loadingText: { color: '#E2E8F0', fontSize: 17, fontWeight: '600', marginTop: 8 },
    loadingSubText: { color: '#64748B', fontSize: 14 },

    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginHorizontal: 16,
        marginTop: 24,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#0F172A',
        borderRadius: 20,
        paddingVertical: 18,
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
    },
    statNum: { fontSize: 26, fontWeight: '800' },
    statLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

    lastUpdated: {
        textAlign: 'center', color: '#64748B',
        fontSize: 12, marginBottom: 20,
        fontWeight: '500'
    },

    listContainer: { paddingHorizontal: 16 },

    placeCard: {
        backgroundColor: '#0B1220',
        borderRadius: 20, padding: 18,
        marginBottom: 14,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
    },
    placeHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16
    },
    placeLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, paddingRight: 10 },
    placeIconWrap: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'rgba(59,130,246,0.12)',
        justifyContent: 'center', alignItems: 'center',
    },
    placeName: { fontSize: 16, fontWeight: '700', color: '#F8FAFC', marginBottom: 4, letterSpacing: -0.3 },
    placeCurrentBusy: { fontSize: 13, color: '#94A3B8' },

    crowdBadge: {
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 12, borderWidth: 1,
    },
    crowdBadgeText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

    crowdBarWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    crowdBarBg: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#1E293B', overflow: 'hidden' },
    crowdBarFill: { height: '100%', borderRadius: 4 },
    crowdBarPct: { fontSize: 13, fontWeight: '700', color: '#94A3B8', width: 45, textAlign: 'right' },

    bestTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0F172A', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    bestTimeText: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },

    emptyState: { alignItems: 'center', paddingVertical: 80, gap: 16 },
    emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(59,130,246,0.1)', justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: '#E2E8F0', fontSize: 18, fontWeight: '700' },
    emptySubText: { color: '#64748B', fontSize: 14, textAlign: 'center' },
});
