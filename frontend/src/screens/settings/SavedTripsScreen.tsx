import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Calendar, Users, Trash2, Eye, Share2 } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getSavedTrips, deleteSavedTrip, SavedTrip } from '../../services/tripService';

export default function SavedTripsScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuth();

    const [trips, setTrips] = useState<SavedTrip[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const loadTrips = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const data = await getSavedTrips(user.id);
            setTrips(data);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to load saved trips.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Reload whenever this screen is focused
    useFocusEffect(
        useCallback(() => {
            loadTrips();
        }, [loadTrips])
    );

    const handleDelete = (tripId: string, destination: string) => {
        Alert.alert(
            'Delete Trip',
            `Remove "${destination}" from your saved trips?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setDeletingId(tripId);
                            await deleteSavedTrip(tripId);
                            setTrips(prev => prev.filter(t => t.id !== tripId));
                        } catch (err: any) {
                            Alert.alert('Error', err.message || 'Could not delete trip.');
                        } finally {
                            setDeletingId(null);
                        }
                    },
                },
            ]
        );
    };

    const handleView = (trip: SavedTrip) => {
        navigation.navigate('AIItineraryResult', {
            destination: trip.destination,
            itinerary: trip.itinerary,
            budget: trip.budget,
            currency: trip.currency,
            interests: trip.interests,
            fromDate: trip.from_date,
            toDate: trip.to_date,
            travelers: trip.travelers,
            isMockData: false,
        });
    };

    const handleShare = async (trip: SavedTrip) => {
        try {
            const dateFrom = formatDate(trip.from_date);
            const dateTo = formatDate(trip.to_date);
            const dateStr = dateFrom !== '—' && dateTo !== '—' ? `📅 ${dateFrom} – ${dateTo}` : '';
            const budgetStr = trip.budget ? `💰 Budget: ${trip.currency || ''} ${Number(trip.budget).toLocaleString()}` : '';
            const interestsStr = (trip.interests || []).length > 0 ? `🎯 Interests: ${trip.interests.join(', ')}` : '';
            const travelersStr = trip.travelers ? `👥 ${trip.travelers} traveler${trip.travelers !== 1 ? 's' : ''}` : '';

            const message = [
                `🌍 Check out my SmartNav trip to ${trip.destination}!`,
                '',
                dateStr,
                travelersStr,
                budgetStr,
                interestsStr,
                '',
                '📱 Plan your own trip with SmartNav – the smart travel companion app!',
            ].filter(Boolean).join('\n');

            await Share.share({
                message,
                title: `SmartNav Trip: ${trip.destination}`,
            });
        } catch (err: any) {
            if (err.message !== 'User did not share') {
                Alert.alert('Share failed', 'Could not share this trip.');
            }
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color="#fff" size={22} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Saved Trips</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.loadingText}>Loading your trips…</Text>
                </View>
            ) : trips.length === 0 ? (
                /* Empty state */
                <View style={styles.centered}>
                    <MapPin size={56} color="#2563EB" style={{ marginBottom: 16 }} />
                    <Text style={styles.emptyTitle}>No saved trips yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Generate an itinerary and tap{' '}
                        <Text style={{ color: '#2563EB', fontWeight: '600' }}>Save</Text> to keep it here.
                    </Text>
                    <TouchableOpacity
                        style={styles.planBtn}
                        onPress={() => navigation.navigate('TripPlanner')}
                    >
                        <Text style={styles.planBtnText}>Plan a Trip →</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={trips}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            {/* Destination + interests */}
                            <View style={styles.cardTop}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.destination}>{item.destination}</Text>
                                    <View style={styles.tags}>
                                        {(item.interests || []).map((tag, i) => (
                                            <View key={i} style={styles.tag}>
                                                <Text style={styles.tagText}>{tag}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>

                            {/* Date / Travelers */}
                            <View style={styles.meta}>
                                <View style={styles.metaItem}>
                                    <Calendar size={13} color="#64748B" />
                                    <Text style={styles.metaText}>
                                        {formatDate(item.from_date)} – {formatDate(item.to_date)}
                                    </Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <Users size={13} color="#64748B" />
                                    <Text style={styles.metaText}>{item.travelers} traveler{item.travelers !== 1 ? 's' : ''}</Text>
                                </View>
                            </View>

                            {/* Budget */}
                            <Text style={styles.budget}>
                                {item.currency} {Number(item.budget).toLocaleString()} budget
                            </Text>

                            {/* Actions */}
                            <View style={styles.cardActions}>
                                <TouchableOpacity style={styles.viewBtn} onPress={() => handleView(item)}>
                                    <Eye size={16} color="#fff" />
                                    <Text style={styles.viewBtnText}>View Itinerary</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.shareBtn}
                                    onPress={() => handleShare(item)}
                                >
                                    <Share2 size={15} color="#3B82F6" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.deleteBtn}
                                    onPress={() => handleDelete(item.id, item.destination)}
                                    disabled={deletingId === item.id}
                                >
                                    {deletingId === item.id ? (
                                        <ActivityIndicator size={16} color="#DC2626" />
                                    ) : (
                                        <Trash2 size={15} color="#DC2626" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B1220' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    backBtn: { padding: 4 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    loadingText: { color: '#94A3B8', marginTop: 12, fontSize: 14 },

    emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8 },
    emptySubtitle: { color: '#94A3B8', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    planBtn: {
        backgroundColor: '#2563EB',
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 14,
    },
    planBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

    list: { padding: 16, gap: 16 },

    card: {
        backgroundColor: '#111827',
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.12)',
    },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    destination: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },

    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    tag: {
        backgroundColor: 'rgba(37,99,235,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    tagText: { color: '#2563EB', fontSize: 12, fontWeight: '500' },

    meta: { flexDirection: 'row', gap: 20, marginBottom: 6 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    metaText: { color: '#94A3B8', fontSize: 12 },

    budget: { color: '#64748B', fontSize: 12, marginBottom: 14 },

    cardActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    viewBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#2563EB',
        paddingVertical: 12,
        borderRadius: 12,
    },
    viewBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    shareBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(59,130,246,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.2)',
    },
    deleteBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(220,38,38,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(220,38,38,0.25)',
    },
});
