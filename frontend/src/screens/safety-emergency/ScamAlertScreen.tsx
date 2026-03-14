import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, AlertTriangle, MapPin, Clock, Send, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../services/supabase';
import { getCachedLocation } from '../../services/locationCache';

const SCAM_TYPES = [
    'Overcharging',
    'Fake Guide',
    'Taxi Scam',
    'Fake Ticket',
    'Pickpocket',
    'Fake Police',
    'Other',
];

interface ScamReport {
    id: string;
    user_id: string;
    description: string;
    scam_type: string;
    lat: number;
    lon: number;
    created_at: string;
}

export default function ScamAlertScreen() {
    const navigation = useNavigation<any>();

    const [tab, setTab] = useState<'report' | 'nearby'>('report');
    const [selectedType, setSelectedType] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [location, setLocation] = useState<any>(null);
    const [nearbyReports, setNearbyReports] = useState<ScamReport[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        loadLocationAndReports();
        loadCurrentUser();
    }, []);

    const loadCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);
    };

    const loadLocationAndReports = async () => {
        const loc = await getCachedLocation();
        if (!loc) return;
        setLocation(loc);
        fetchNearbyReports(loc.latitude, loc.longitude);
    };

    const fetchNearbyReports = async (lat: number, lon: number) => {
        try {
            setLoadingReports(true);
            const { data, error } = await supabase
                .from('scam_reports')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(30);

            if (error) throw error;

            // Fetch locally-deleted scam reports to filter out ghost reports
            const deletedStr = await AsyncStorage.getItem('deleted_scams');
            const deleted = deletedStr ? JSON.parse(deletedStr) : [];

            // Filter to ~5km radius using rough distance calc and remove deleted ones
            const nearby = (data || []).filter((r: ScamReport) => {
                if (deleted.includes(r.id)) return false;
                const dLat = (r.lat - lat) * 111;
                const dLon = (r.lon - lon) * 111 * Math.cos((lat * Math.PI) / 180);
                const dist = Math.sqrt(dLat * dLat + dLon * dLon);
                return dist <= 5;
            });
            setNearbyReports(nearby);
        } catch (e) {
            console.error('Error fetching reports:', e);
        } finally {
            setLoadingReports(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedType) {
            Alert.alert('Missing info', 'Please select a scam type.');
            return;
        }
        if (description.trim().length < 20) {
            Alert.alert('Too short', 'Please describe the scam in at least 20 characters.');
            return;
        }
        if (!location) {
            Alert.alert('Location needed', 'Could not get your location. Please try again.');
            return;
        }

        try {
            setSubmitting(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not logged in');

            const { error } = await supabase.from('scam_reports').insert({
                user_id: user.id,
                lat: location.latitude,
                lon: location.longitude,
                scam_type: selectedType,
                description: description.trim(),
            });

            if (error) throw error;

            Alert.alert(
                '✅ Report Submitted',
                'Thank you! Your scam report will help other travelers stay safe.',
                [{ text: 'OK', onPress: () => { setSelectedType(''); setDescription(''); setTab('nearby'); loadLocationAndReports(); } }]
            );
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Could not submit report.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteReport = (report: ScamReport) => {
        Alert.alert(
            '🗑️ Delete Report',
            `Are you sure you want to remove your "${report.scam_type}" report?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setDeletingId(report.id);
                            await supabase
                                .from('scam_reports')
                                .delete()
                                .eq('id', report.id)
                                .eq('user_id', currentUserId!);

                            const deletedStr = await AsyncStorage.getItem('deleted_scams');
                            const deleted = deletedStr ? JSON.parse(deletedStr) : [];
                            if (!deleted.includes(report.id)) {
                                deleted.push(report.id);
                                await AsyncStorage.setItem('deleted_scams', JSON.stringify(deleted));
                            }

                            setNearbyReports(prev => prev.filter(r => r.id !== report.id));
                        } catch (err: any) {
                            Alert.alert('Error', err.message || 'Could not delete report.');
                        } finally {
                            setDeletingId(null);
                        }
                    },
                },
            ]
        );
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('SafetyMain')} style={styles.backBtn}>
                    <ArrowLeft color="#fff" size={22} />
                </TouchableOpacity>
                <View style={styles.headerTitle}>
                    <AlertTriangle size={18} color="#F59E0B" />
                    <Text style={styles.headerText}>Scam Alerts</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, tab === 'report' && styles.tabActive]}
                    onPress={() => setTab('report')}
                >
                    <Text style={[styles.tabText, tab === 'report' && styles.tabTextActive]}>
                        Report Scam
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, tab === 'nearby' && styles.tabActive]}
                    onPress={() => setTab('nearby')}
                >
                    <Text style={[styles.tabText, tab === 'nearby' && styles.tabTextActive]}>
                        Nearby Alerts {nearbyReports.length > 0 ? `(${nearbyReports.length})` : ''}
                    </Text>
                </TouchableOpacity>
            </View>

            {tab === 'report' ? (
                <ScrollView contentContainerStyle={styles.form}>
                    <Text style={styles.label}>What type of scam?</Text>
                    <View style={styles.typeGrid}>
                        {SCAM_TYPES.map(type => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.typeChip, selectedType === type && styles.typeChipActive]}
                                onPress={() => setSelectedType(type)}
                            >
                                <Text style={[styles.typeText, selectedType === type && styles.typeTextActive]}>
                                    {type}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Describe what happened</Text>
                    <TextInput
                        style={styles.textarea}
                        placeholder="Tell others how it happened so they can avoid it…"
                        placeholderTextColor="#4B5563"
                        multiline
                        numberOfLines={6}
                        value={description}
                        onChangeText={setDescription}
                        textAlignVertical="top"
                    />
                    <Text style={styles.charCount}>{description.length} chars (min 20)</Text>

                    <View style={styles.locationNote}>
                        <MapPin size={14} color="#2563EB" />
                        <Text style={styles.locationNoteText}>
                            {location
                                ? `Your current location will be used (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`
                                : 'Getting your location…'}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitBtn, (submitting || !selectedType || description.length < 20) && styles.submitBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={submitting || !selectedType || description.length < 20}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" size={20} />
                        ) : (
                            <>
                                <Send size={18} color="#fff" />
                                <Text style={styles.submitText}>Submit Report</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            ) : (
                <View style={{ flex: 1 }}>
                    {loadingReports ? (
                        <View style={styles.centered}>
                            <ActivityIndicator size="large" color="#F59E0B" />
                            <Text style={styles.loadingText}>Finding nearby scam reports…</Text>
                        </View>
                    ) : nearbyReports.length === 0 ? (
                        <View style={styles.centered}>
                            <AlertTriangle size={48} color="#2563EB" />
                            <Text style={styles.emptyTitle}>No alerts within 5km</Text>
                            <Text style={styles.emptySubtext}>This area looks safe. Stay alert!</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={nearbyReports}
                            keyExtractor={item => item.id}
                            contentContainerStyle={{ padding: 16, gap: 12 }}
                            renderItem={({ item }) => {
                                const isOwn = currentUserId && item.user_id === currentUserId;
                                return (
                                    <View style={styles.reportCard}>
                                        <View style={styles.reportHeader}>
                                            <View style={styles.scamTypeBadge}>
                                                <Text style={styles.scamTypeText}>{item.scam_type}</Text>
                                            </View>
                                            <View style={styles.reportMeta}>
                                                {isOwn && (
                                                    <TouchableOpacity
                                                        style={styles.deleteBtn}
                                                        onPress={() => handleDeleteReport(item)}
                                                        disabled={deletingId === item.id}
                                                    >
                                                        {deletingId === item.id ? (
                                                            <ActivityIndicator size={12} color="#DC2626" />
                                                        ) : (
                                                            <Trash2 size={14} color="#DC2626" />
                                                        )}
                                                    </TouchableOpacity>
                                                )}
                                                <Clock size={12} color="#64748B" />
                                                <Text style={styles.reportTime}>{timeAgo(item.created_at)}</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.reportDesc}>{item.description}</Text>
                                        {isOwn && <Text style={styles.ownBadge}>Your report</Text>}
                                    </View>
                                );
                            }}
                        />
                    )}
                </View>
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
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    backBtn: { padding: 4 },
    headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerText: { color: '#fff', fontSize: 17, fontWeight: '700' },

    tabs: {
        flexDirection: 'row',
        backgroundColor: '#111827',
        margin: 16,
        borderRadius: 14,
        padding: 4,
        gap: 4,
    },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    tabActive: { backgroundColor: '#F59E0B' },
    tabText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#000' },

    form: { padding: 16, gap: 4 },
    label: { color: '#94A3B8', fontSize: 13, fontWeight: '600', marginBottom: 10, marginTop: 6 },

    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    typeChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#1E293B',
        borderWidth: 1,
        borderColor: '#334155',
    },
    typeChipActive: { backgroundColor: 'rgba(245,158,11,0.2)', borderColor: '#F59E0B' },
    typeText: { color: '#94A3B8', fontSize: 13 },
    typeTextActive: { color: '#F59E0B', fontWeight: '600' },

    textarea: {
        backgroundColor: '#1E293B',
        borderRadius: 14,
        padding: 14,
        color: '#fff',
        fontSize: 14,
        height: 140,
        borderWidth: 1,
        borderColor: '#334155',
        marginBottom: 4,
    },
    charCount: { color: '#4B5563', fontSize: 11, textAlign: 'right', marginBottom: 16 },

    locationNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(37,99,235,0.1)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 24,
    },
    locationNoteText: { color: '#94A3B8', fontSize: 12, flex: 1 },

    submitBtn: {
        backgroundColor: '#F59E0B',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        borderRadius: 14,
    },
    submitBtnDisabled: { opacity: 0.4 },
    submitText: { color: '#000', fontSize: 15, fontWeight: '700' },

    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
    loadingText: { color: '#94A3B8', fontSize: 14, marginTop: 8 },
    emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
    emptySubtext: { color: '#94A3B8', fontSize: 14, textAlign: 'center' },

    reportCard: {
        backgroundColor: '#1a2235',
        borderRadius: 14,
        padding: 14,
        borderLeftWidth: 3,
        borderLeftColor: '#F59E0B',
    },
    reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    scamTypeBadge: {
        backgroundColor: 'rgba(245,158,11,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    scamTypeText: { color: '#F59E0B', fontSize: 12, fontWeight: '600' },
    reportMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    reportTime: { color: '#64748B', fontSize: 12 },
    reportDesc: { color: '#CBD5E1', fontSize: 14, lineHeight: 20 },
    deleteBtn: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: 'rgba(220,38,38,0.1)',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 6,
    },
    ownBadge: {
        color: '#3B82F6', fontSize: 11, fontWeight: '600',
        marginTop: 8, opacity: 0.7,
    },
});
