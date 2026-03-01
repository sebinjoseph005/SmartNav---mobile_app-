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
    TreePine,
    MapPin,
    Wind,
    Book,
    Waves,
    Mountain,
    Sunrise,
    Navigation2,
    Volume2,
    VolumeX,
} from 'lucide-react-native';

interface QuietPlace {
    id: number;
    name: string;
    type: string;
    quietScore: number; // 0-100, higher = quieter
    tag: string;
    description: string;
    latitude: number;
    longitude: number;
    distance?: string;
}

const getQuietScore = (type: string, tags: any): number => {
    const scores: Record<string, number> = {
        garden: 90,
        nature_reserve: 95,
        park: 75,
        library: 92,
        viewpoint: 85,
        cemetery: 88,
        forest: 93,
        beach: 70,
        golf_course: 78,
        pitch: 50,
        playground: 30,
        cafe: 55,
        restaurant: 35,
        marketplace: 20,
    };
    return scores[type] || 60;
};

const getQuietTag = (score: number): string => {
    if (score >= 90) return 'Very Peaceful';
    if (score >= 75) return 'Calm';
    if (score >= 60) return 'Mostly Quiet';
    return 'Fairly Quiet';
};

const getQuietDescription = (type: string): string => {
    const descriptions: Record<string, string> = {
        garden: 'Serene botanical garden, perfect for reflection',
        nature_reserve: 'Protected natural area with minimal foot traffic',
        park: 'Green open space, best during weekday mornings',
        library: 'Quiet indoor retreat with a calm atmosphere',
        viewpoint: 'Scenic lookout with peaceful surroundings',
        cemetery: 'Historic quiet grounds, peaceful atmosphere',
        forest: 'Lush woodland escape from the city noise',
        beach: 'Natural waterfront, calmer at off-peak hours',
        golf_course: 'Well-maintained quiet outdoor green space',
    };
    return descriptions[type] || 'A calm and quiet nearby space';
};

const getQuietIcon = (type: string, size = 20) => {
    const colorMap: Record<string, string> = {
        garden: '#10B981',
        nature_reserve: '#059669',
        park: '#22C55E',
        library: '#8B5CF6',
        viewpoint: '#06B6D4',
        beach: '#0EA5E9',
        forest: '#16A34A',
    };
    const color = colorMap[type] || '#3B82F6';

    if (type === 'library') return <Book size={size} color={color} />;
    if (type === 'viewpoint') return <Mountain size={size} color={color} />;
    if (type === 'beach') return <Waves size={size} color={color} />;
    if (type === 'garden' || type === 'nature_reserve' || type === 'forest') return <TreePine size={size} color={color} />;
    if (type === 'park') return <Wind size={size} color={color} />;
    return <MapPin size={size} color={color} />;
};

const getQuietColor = (score: number): string => {
    if (score >= 90) return '#10B981';
    if (score >= 75) return '#22C55E';
    if (score >= 60) return '#84CC16';
    return '#F59E0B';
};

export default function QuietPlacesScreen() {
    const navigation = useNavigation<any>();
    const [places, setPlaces] = useState<QuietPlace[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [locationName, setLocationName] = useState('nearby');

    const calcDistance = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`;
    };

    const loadPlaces = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const loc = await getCachedLocation();
            if (!loc) return;
            const { latitude, longitude } = loc;
            setUserLocation({ latitude, longitude });

            try {
                const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
                if (geo[0]) setLocationName(geo[0].district || geo[0].city || geo[0].subregion || 'nearby');
            } catch { }

            const query = `
        [out:json][timeout:30];
        (
          node["leisure"="garden"](around:5000,${latitude},${longitude});
          node["leisure"="park"](around:5000,${latitude},${longitude});
          node["leisure"="nature_reserve"](around:5000,${latitude},${longitude});
          node["amenity"="library"](around:5000,${latitude},${longitude});
          node["tourism"="viewpoint"](around:5000,${latitude},${longitude});
          node["natural"="beach"](around:5000,${latitude},${longitude});
          node["landuse"="forest"](around:5000,${latitude},${longitude});
          node["leisure"="golf_course"](around:5000,${latitude},${longitude});
        );
        out body;>;out skel qt;
      `;

            const response = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query });
            if (!response.ok) throw new Error('API error');
            const data = await response.json();

            const quietPlaces: QuietPlace[] = data.elements
                .filter((p: any) => p.lat && p.lon && p.tags?.name)
                .map((p: any) => {
                    const type = p.tags?.leisure || p.tags?.amenity || p.tags?.tourism || p.tags?.natural || p.tags?.landuse || 'park';
                    const score = getQuietScore(type, p.tags);
                    return {
                        id: p.id,
                        name: p.tags.name,
                        type,
                        quietScore: score,
                        tag: getQuietTag(score),
                        description: getQuietDescription(type),
                        latitude: p.lat,
                        longitude: p.lon,
                        distance: calcDistance(latitude, longitude, p.lat, p.lon),
                    };
                })
                .sort((a: QuietPlace, b: QuietPlace) => b.quietScore - a.quietScore)
                .slice(0, 15);

            setPlaces(quietPlaces);
        } catch { }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadPlaces(); }, []);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <ArrowLeft size={22} color="#F1F5F9" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Quiet Places</Text>
                    <Text style={styles.headerSub}>Peaceful spots near {locationName}</Text>
                </View>
                <View style={styles.headerBadge}>
                    <VolumeX size={14} color="#10B981" />
                    <Text style={styles.headerBadgeText}>Low Noise</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text style={styles.loadingText}>Finding peaceful places…</Text>
                    <Text style={styles.loadingSubText}>Looking for parks, gardens & more</Text>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadPlaces(true)} tintColor="#10B981" />}
                >
                    {/* Tip Banner */}
                    <View style={styles.tipBanner}>
                        <Sunrise size={16} color="#10B981" />
                        <Text style={styles.tipText}>
                            💡 Weekday mornings (7–9 AM) are the quietest time to visit most places
                        </Text>
                    </View>

                    {places.length === 0 ? (
                        <View style={styles.emptyState}>
                            <VolumeX size={56} color="#1E293B" />
                            <Text style={styles.emptyTitle}>No quiet spots found</Text>
                            <Text style={styles.emptySubText}>Try refreshing or expanding your search area</Text>
                        </View>
                    ) : (
                        places.map((place, index) => (
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
                                {/* Rank badge for top 3 */}
                                {index < 3 && (
                                    <View style={[styles.rankBadge, { backgroundColor: index === 0 ? '#F59E0B' : index === 1 ? '#94A3B8' : '#B45309' }]}>
                                        <Text style={styles.rankText}>#{index + 1}</Text>
                                    </View>
                                )}

                                <View style={styles.cardTop}>
                                    <View style={[styles.iconWrap, { backgroundColor: `${getQuietColor(place.quietScore)}15` }]}>
                                        {getQuietIcon(place.type)}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.placeName} numberOfLines={1}>{place.name}</Text>
                                        <Text style={styles.placeDesc} numberOfLines={2}>{place.description}</Text>
                                    </View>
                                </View>

                                {/* Quiet score bar */}
                                <View style={styles.scoreRow}>
                                    <VolumeX size={12} color="#10B981" />
                                    <View style={styles.scoreBarBg}>
                                        <View style={[styles.scoreBarFill, {
                                            width: `${place.quietScore}%` as any,
                                            backgroundColor: getQuietColor(place.quietScore),
                                        }]} />
                                    </View>
                                    <Text style={[styles.quietTag, { color: getQuietColor(place.quietScore) }]}>
                                        {place.tag}
                                    </Text>
                                </View>

                                {/* Footer */}
                                <View style={styles.cardFooter}>
                                    <View style={styles.distancePill}>
                                        <MapPin size={11} color="#64748B" />
                                        <Text style={styles.distanceText}>{place.distance}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.goBtn}
                                        onPress={() => navigation.navigate('Map', {
                                            screen: 'MapMain',
                                            params: {
                                                destination: { latitude: place.latitude, longitude: place.longitude, name: place.name, type: place.type },
                                                startNavigation: true,
                                            }
                                        })}
                                    >
                                        <Navigation2 size={13} color="#10B981" />
                                        <Text style={styles.goBtnText}>Navigate</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}

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
    headerBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: 'rgba(16,185,129,0.12)',
        paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: 20, borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.25)',
    },
    headerBadgeText: { fontSize: 11, fontWeight: '700', color: '#10B981' },

    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100, gap: 12 },
    loadingText: { color: '#94A3B8', fontSize: 16, fontWeight: '600', marginTop: 8 },
    loadingSubText: { color: '#334155', fontSize: 13 },

    scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

    tipBanner: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        backgroundColor: 'rgba(16,185,129,0.08)',
        borderRadius: 14, padding: 14,
        marginBottom: 16,
        borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)',
    },
    tipText: { flex: 1, color: '#94A3B8', fontSize: 12, lineHeight: 18 },

    placeCard: {
        backgroundColor: '#0F172A',
        borderRadius: 18, padding: 16,
        marginBottom: 12,
        borderWidth: 1, borderColor: '#1E293B',
        gap: 12,
        position: 'relative',
        overflow: 'hidden',
    },
    rankBadge: {
        position: 'absolute', top: 12, right: 12,
        width: 28, height: 28, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center',
    },
    rankText: { color: '#FFF', fontSize: 11, fontWeight: '800' },

    cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    iconWrap: {
        width: 44, height: 44, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center',
    },
    placeName: { fontSize: 15, fontWeight: '700', color: '#F1F5F9', marginBottom: 4 },
    placeDesc: { fontSize: 12, color: '#64748B', lineHeight: 17 },

    scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    scoreBarBg: { flex: 1, height: 5, borderRadius: 3, backgroundColor: '#1E293B', overflow: 'hidden' },
    scoreBarFill: { height: '100%', borderRadius: 3 },
    quietTag: { fontSize: 11, fontWeight: '700', width: 80, textAlign: 'right' },

    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    distancePill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    distanceText: { fontSize: 12, color: '#64748B' },
    goBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: 'rgba(16,185,129,0.12)',
        paddingHorizontal: 12, paddingVertical: 7,
        borderRadius: 20, borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.3)',
    },
    goBtnText: { fontSize: 12, fontWeight: '700', color: '#10B981' },

    emptyState: { alignItems: 'center', paddingVertical: 80, gap: 12 },
    emptyTitle: { color: '#94A3B8', fontSize: 18, fontWeight: '700' },
    emptySubText: { color: '#334155', fontSize: 13 },
});
