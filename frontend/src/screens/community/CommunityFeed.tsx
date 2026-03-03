import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, MapPin, Heart, Users, Clock, Search, X } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../services/supabase';

export default function CommunityFeed() {
    const navigation = useNavigation<any>();
    const [tab, setTab] = useState<'stories' | 'buddies'>('stories');
    const [stories, setStories] = useState<any[]>([]);
    const [buddies, setBuddies] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [tab])
    );

    const loadData = async () => {
        setLoading(true);
        try {
            if (tab === 'stories') {
                const { data } = await supabase
                    .from('trip_stories')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(30);
                setStories(data || []);
            } else {
                const { data } = await supabase
                    .from('trip_buddies')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(30);
                setBuddies(data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const renderStory = ({ item }: any) => (
        <TouchableOpacity
            style={styles.storyCard}
            onPress={() => navigation.navigate('BlogDetail', { story: item })}
            activeOpacity={0.8}
        >
            <View style={styles.storyCardTop}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.author_name?.[0]?.toUpperCase() || '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.authorName}>{item.author_name}</Text>
                    <View style={styles.destinationRow}>
                        <MapPin size={12} color="#2563EB" />
                        <Text style={styles.destinationText}>{item.destination}</Text>
                    </View>
                </View>
                <View style={styles.timeBadge}>
                    <Clock size={10} color="#64748B" />
                    <Text style={styles.timeText}>{timeAgo(item.created_at)}</Text>
                </View>
            </View>

            <Text style={styles.storyTitle}>{item.title}</Text>
            <Text style={styles.storyPreview} numberOfLines={2}>{item.story}</Text>

            {(item.tags || []).length > 0 && (
                <View style={styles.tags}>
                    {item.tags.slice(0, 3).map((tag: string, i: number) => (
                        <View key={i} style={styles.tag}>
                            <Text style={styles.tagText}>#{tag}</Text>
                        </View>
                    ))}
                </View>
            )}

            <View style={styles.storyFooter}>
                <View style={styles.likesRow}>
                    <Heart size={14} color="#64748B" />
                    <Text style={styles.likesText}>{item.likes || 0}</Text>
                </View>
                <Text style={styles.readMore}>Read story →</Text>
            </View>
        </TouchableOpacity>
    );

    const renderBuddy = ({ item }: any) => (
        <TouchableOpacity
            style={styles.buddyCard}
            onPress={() => navigation.navigate('BuddyChat', { buddy: item })}
            activeOpacity={0.8}
        >
            <View style={styles.buddyHeader}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.author_name?.[0]?.toUpperCase() || '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.authorName}>{item.author_name}</Text>
                    <Text style={styles.buddySubtitle}>Looking for travel companions</Text>
                </View>
                <View style={styles.spotsBadge}>
                    <Text style={styles.spotsText}>{item.spots_left} spots</Text>
                </View>
            </View>

            <View style={styles.buddyDestRow}>
                <MapPin size={14} color="#2563EB" />
                <Text style={styles.buddyDest}>{item.destination}</Text>
            </View>
            <View style={styles.buddyDateRow}>
                <Clock size={14} color="#64748B" />
                <Text style={styles.buddyDate}>{item.travel_date}</Text>
            </View>

            <Text style={styles.buddyDesc} numberOfLines={2}>{item.description}</Text>

            <TouchableOpacity
                style={styles.joinBtn}
                onPress={() => navigation.navigate('BuddyChat', { buddy: item })}
            >
                <Users size={15} color="#fff" />
                <Text style={styles.joinBtnText}>Join & Chat</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Community</Text>
                <TouchableOpacity
                    style={styles.createBtn}
                    onPress={() => navigation.navigate(tab === 'stories' ? 'CreateStory' : 'CreateBuddyPost')}
                >
                    <Plus size={18} color="#fff" />
                    <Text style={styles.createBtnText}>{tab === 'stories' ? 'Share Story' : 'Post Trip'}</Text>
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, tab === 'stories' && styles.tabActive]}
                    onPress={() => setTab('stories')}
                >
                    <Text style={[styles.tabText, tab === 'stories' && styles.tabTextActive]}>✈️ Trip Stories</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, tab === 'buddies' && styles.tabActive]}
                    onPress={() => setTab('buddies')}
                >
                    <Text style={[styles.tabText, tab === 'buddies' && styles.tabTextActive]}>🤝 Trip Buddies</Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBar}>
                <Search size={16} color="#64748B" />
                <TextInput
                    style={styles.searchInput}
                    placeholder={tab === 'stories' ? 'Search destinations or stories...' : 'Search trip destinations...'}
                    placeholderTextColor="#475569"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <X size={16} color="#64748B" />
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#2563EB" />
                </View>
            ) : (
                <FlatList
                    data={
                        (tab === 'stories' ? stories : buddies).filter(item => {
                            if (!searchQuery.trim()) return true;
                            const q = searchQuery.toLowerCase();
                            const dest = (item.destination || '').toLowerCase();
                            const title = (item.title || '').toLowerCase();
                            const desc = (item.description || item.story || '').toLowerCase();
                            return dest.includes(q) || title.includes(q) || desc.includes(q);
                        })
                    }
                    keyExtractor={item => item.id}
                    renderItem={tab === 'stories' ? renderStory : renderBuddy}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>{tab === 'stories' ? '✈️' : '🤝'}</Text>
                            <Text style={styles.emptyTitle}>
                                {tab === 'stories' ? 'No stories yet' : 'No trips posted yet'}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                {tab === 'stories'
                                    ? 'Be the first to share your travel experience!'
                                    : 'Looking for company? Post your upcoming trip!'}
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#080E1A' },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#F1F5F9' },
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#2563EB',
        paddingVertical: 9,
        paddingHorizontal: 14,
        borderRadius: 20,
    },
    createBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

    tabs: {
        flexDirection: 'row',
        backgroundColor: '#111827',
        margin: 14,
        borderRadius: 14,
        padding: 4,
        gap: 4,
    },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    tabActive: { backgroundColor: '#2563EB' },
    tabText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#fff' },

    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111827',
        marginHorizontal: 14,
        marginBottom: 10,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
        gap: 8,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    searchInput: {
        flex: 1,
        color: '#F1F5F9',
        fontSize: 14,
        paddingVertical: 10,
    },

    list: { paddingHorizontal: 14, paddingBottom: 100, gap: 14 },

    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Story Card
    storyCard: {
        backgroundColor: '#0F172A',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    storyCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    avatar: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#2563EB',
        justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    authorName: { color: '#F1F5F9', fontSize: 13, fontWeight: '600', marginBottom: 2 },
    destinationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    destinationText: { color: '#2563EB', fontSize: 12, fontWeight: '500' },
    timeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    timeText: { color: '#64748B', fontSize: 11 },

    storyTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 6 },
    storyPreview: { color: '#94A3B8', fontSize: 13, lineHeight: 20, marginBottom: 10 },

    tags: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
    tag: { backgroundColor: 'rgba(37,99,235,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    tagText: { color: '#2563EB', fontSize: 11, fontWeight: '500' },

    storyFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    likesRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    likesText: { color: '#64748B', fontSize: 13 },
    readMore: { color: '#2563EB', fontSize: 13, fontWeight: '600' },

    // Buddy Card
    buddyCard: {
        backgroundColor: '#0F172A',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#1E293B',
        gap: 8,
    },
    buddyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    buddySubtitle: { color: '#64748B', fontSize: 11 },
    spotsBadge: { backgroundColor: 'rgba(16,185,129,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    spotsText: { color: '#10B981', fontSize: 12, fontWeight: '600' },
    buddyDestRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    buddyDest: { color: '#2563EB', fontSize: 14, fontWeight: '700' },
    buddyDateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    buddyDate: { color: '#64748B', fontSize: 12 },
    buddyDesc: { color: '#94A3B8', fontSize: 13, lineHeight: 19 },
    joinBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#2563EB',
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 4,
    },
    joinBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

    // Empty
    emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
    emptyIcon: { fontSize: 48 },
    emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
    emptySubtitle: { color: '#64748B', fontSize: 14, textAlign: 'center', paddingHorizontal: 30 },
});
