import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Clock, Users, Trash2, ThumbsUp, ThumbsDown } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../services/supabase';

export default function MyPostsScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const type: 'stories' | 'buddies' = route.params?.type || 'stories';

    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => { loadMyPosts(); }, []);

    const loadMyPosts = async () => {
        setLoading(true);
        try {
            const { data: authData } = await supabase.auth.getUser();
            const uid = authData?.user?.id;
            setUserId(uid || null);
            if (!uid) return;
            if (type === 'stories') {
                const { data } = await supabase.from('trip_stories').select('*').eq('author_id', uid).order('created_at', { ascending: false });
                setPosts(data || []);
            } else {
                const { data } = await supabase.from('trip_buddies').select('*').eq('author_id', uid).order('created_at', { ascending: false });
                setPosts(data || []);
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const handleDelete = (item: any) => {
        const table = type === 'stories' ? 'trip_stories' : 'trip_buddies';
        const label = type === 'stories' ? 'Story' : 'Trip Post';
        Alert.alert(`Delete ${label}`, 'Are you sure? This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from(table).delete().eq('id', item.id); setPosts(prev => prev.filter(p => p.id !== item.id)); } },
        ]);
    };

    const renderStory = ({ item }: any) => (
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('BlogDetail', { story: item, currentUserId: userId })} activeOpacity={0.8}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.destRow}><MapPin size={12} color="#2563EB" /><Text style={styles.dest}>{item.destination}</Text></View>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}><Trash2 size={15} color="#EF4444" /></TouchableOpacity>
            </View>
            <Text style={styles.preview} numberOfLines={2}>{item.story}</Text>
            <View style={styles.footer}>
                <View style={styles.metaRow}><Clock size={11} color="#475569" /><Text style={styles.metaText}>{timeAgo(item.created_at)}</Text></View>
                <View style={styles.metaRow}><ThumbsUp size={12} color="#10B981" /><Text style={styles.metaText}>{item.upvotes || 0}</Text><ThumbsDown size={12} color="#EF4444" style={{ marginLeft: 6 }} /><Text style={styles.metaText}>{item.downvotes || 0}</Text></View>
                <Text style={styles.link}>Read →</Text>
            </View>
        </TouchableOpacity>
    );

    const renderBuddy = ({ item }: any) => (
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('BuddyChat', { buddy: item })} activeOpacity={0.8}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <View style={styles.destRow}><MapPin size={13} color="#2563EB" /><Text style={styles.title}>{item.destination}</Text></View>
                    <Text style={styles.dest}>{item.travel_date}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}><Trash2 size={15} color="#EF4444" /></TouchableOpacity>
            </View>
            <Text style={styles.preview} numberOfLines={2}>{item.description}</Text>
            <View style={styles.footer}>
                <View style={styles.metaRow}><Users size={12} color="#10B981" /><Text style={styles.metaText}>{item.spots_left} spots left</Text></View>
                <View style={styles.metaRow}><Clock size={11} color="#475569" /><Text style={styles.metaText}>{timeAgo(item.created_at)}</Text></View>
                <Text style={styles.link}>View →</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><ArrowLeft size={20} color="#F1F5F9" /></TouchableOpacity>
                <Text style={styles.headerTitle}>{type === 'stories' ? '✈️ My Stories' : '🤝 My Trip Posts'}</Text>
                <View style={{ width: 36 }} />
            </View>
            {loading ? (
                <View style={styles.centered}><ActivityIndicator size="large" color="#2563EB" /></View>
            ) : (
                <FlatList
                    data={posts}
                    keyExtractor={item => item.id}
                    renderItem={type === 'stories' ? renderStory : renderBuddy}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>{type === 'stories' ? '✈️' : '🤝'}</Text>
                            <Text style={styles.emptyTitle}>{type === 'stories' ? 'No stories yet' : 'No trip posts yet'}</Text>
                            <Text style={styles.emptySubtitle}>{type === 'stories' ? 'Share your first travel story!' : 'Post a trip and find companions!'}</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#060C18' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#F1F5F9' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 16, gap: 12, paddingBottom: 60 },
    card: { backgroundColor: '#0F172A', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#1E293B' },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
    title: { fontSize: 15, fontWeight: '700', color: '#F1F5F9', marginBottom: 4 },
    destRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dest: { color: '#2563EB', fontSize: 12, fontWeight: '500' },
    preview: { color: '#64748B', fontSize: 13, lineHeight: 19, marginBottom: 12 },
    footer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { color: '#64748B', fontSize: 11, fontWeight: '600' },
    link: { color: '#2563EB', fontSize: 13, fontWeight: '600', marginLeft: 'auto' },
    deleteBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(239,68,68,0.1)', justifyContent: 'center', alignItems: 'center' },
    emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
    emptyIcon: { fontSize: 48 },
    emptyTitle: { color: '#F1F5F9', fontSize: 18, fontWeight: '700' },
    emptySubtitle: { color: '#64748B', fontSize: 14, textAlign: 'center', paddingHorizontal: 30 },
});
