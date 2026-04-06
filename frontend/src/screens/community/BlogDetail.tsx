import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Calendar, ThumbsUp, ThumbsDown, Trash2 } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../services/supabase';

export default function BlogDetail() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { story: initialStory, currentUserId: passedUserId } = route.params || {};

    const [story, setStory] = useState<any>(initialStory);
    const [currentUserId, setCurrentUserId] = useState<string | null>(passedUserId || null);
    const [myVote, setMyVote] = useState<number>(0);

    useEffect(() => {
        if (!currentUserId) {
            supabase.auth.getUser().then(({ data }) => setCurrentUserId(data?.user?.id || null));
        }
    }, []);

    useEffect(() => {
        if (!currentUserId || !story?.id) return;
        supabase.from('story_votes').select('vote').eq('user_id', currentUserId).eq('story_id', story.id).maybeSingle()
            .then(({ data }) => setMyVote(data?.vote || 0));
    }, [currentUserId, story?.id]);

    if (!story) {
        return (
            <SafeAreaView style={styles.container}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><ArrowLeft color="#fff" size={22} /></TouchableOpacity>
                <View style={styles.centered}><Text style={styles.errorText}>Story not found</Text></View>
            </SafeAreaView>
        );
    }

    const isOwner = currentUserId && story.author_id === currentUserId;

    const formatDate = (dateStr: string) => {
        try { return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return dateStr; }
    };

    const placesArray: string[] = Array.isArray(story.places) ? story.places : [];

    const handleDelete = () => {
        Alert.alert('Delete Story', 'Are you sure? This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('trip_stories').delete().eq('id', story.id); navigation.goBack(); } },
        ]);
    };

    const handleVote = async (vote: 1 | -1) => {
        if (!currentUserId) { Alert.alert('Sign in required', 'Please sign in to vote.'); return; }
        let newVote: number | null = vote;
        let upvoteDelta = 0, downvoteDelta = 0;
        if (myVote === vote) { newVote = null; if (vote === 1) upvoteDelta = -1; else downvoteDelta = -1; }
        else { if (vote === 1) { upvoteDelta = 1; if (myVote === -1) downvoteDelta = -1; } else { downvoteDelta = 1; if (myVote === 1) upvoteDelta = -1; } }
        setMyVote(newVote || 0);
        setStory((s: any) => ({ ...s, upvotes: Math.max(0, (s.upvotes || 0) + upvoteDelta), downvotes: Math.max(0, (s.downvotes || 0) + downvoteDelta) }));
        try {
            if (newVote === null) await supabase.from('story_votes').delete().eq('user_id', currentUserId).eq('story_id', story.id);
            else await supabase.from('story_votes').upsert({ user_id: currentUserId, story_id: story.id, vote: newVote });
            const updated: any = {};
            if (upvoteDelta !== 0) updated.upvotes = Math.max(0, (story.upvotes || 0) + upvoteDelta);
            if (downvoteDelta !== 0) updated.downvotes = Math.max(0, (story.downvotes || 0) + downvoteDelta);
            if (Object.keys(updated).length > 0) await supabase.from('trip_stories').update(updated).eq('id', story.id);
        } catch (e) { console.error('Vote error', e); }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><ArrowLeft color="#fff" size={22} /></TouchableOpacity>
                <View style={{ flex: 1 }} />
                {isOwner && (<TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}><Trash2 size={18} color="#EF4444" /></TouchableOpacity>)}
            </View>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.destinationTag}>
                    <MapPin size={14} color="#2563EB" />
                    <Text style={styles.destinationTagText}>{story.destination}</Text>
                </View>
                <Text style={styles.title}>{story.title}</Text>
                <View style={styles.meta}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{story.author_name?.[0]?.toUpperCase() || '?'}</Text></View>
                    <View>
                        <Text style={styles.authorName}>{story.author_name}</Text>
                        <View style={styles.dateRow}><Calendar size={11} color="#64748B" /><Text style={styles.dateText}>{formatDate(story.created_at)}</Text></View>
                    </View>
                </View>
                <View style={styles.voteSection}>
                    <TouchableOpacity style={[styles.voteBtn, myVote === 1 && styles.voteBtnUp]} onPress={() => handleVote(1)}>
                        <ThumbsUp size={16} color={myVote === 1 ? '#10B981' : '#64748B'} />
                        <Text style={[styles.voteCount, myVote === 1 && { color: '#10B981' }]}>{story.upvotes || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.voteBtn, myVote === -1 && styles.voteBtnDown]} onPress={() => handleVote(-1)}>
                        <ThumbsDown size={16} color={myVote === -1 ? '#EF4444' : '#64748B'} />
                        <Text style={[styles.voteCount, myVote === -1 && { color: '#EF4444' }]}>{story.downvotes || 0}</Text>
                    </TouchableOpacity>
                    <Text style={styles.voteHint}>Was this helpful?</Text>
                </View>
                <Text style={styles.storyText}>{story.story}</Text>
                {placesArray.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📍 Places Visited</Text>
                        <View style={styles.placeChips}>
                            {placesArray.map((place: string, i: number) => (<View key={i} style={styles.placeChip}><Text style={styles.placeChipText}>{place}</Text></View>))}
                        </View>
                    </View>
                )}
                {(story.tags || []).length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>🏷 Tags</Text>
                        <View style={styles.tagRow}>
                            {story.tags.map((tag: string, i: number) => (<View key={i} style={styles.tag}><Text style={styles.tagText}>#{tag}</Text></View>))}
                        </View>
                    </View>
                )}
                {placesArray.length > 0 && (
                    <TouchableOpacity style={styles.followBtn} onPress={() => navigation.navigate('Home', { screen: 'TripPlanner', params: { prefillDestination: story.destination } })}>
                        <MapPin size={18} color="#fff" />
                        <Text style={styles.followBtnText}>Plan a Similar Trip →</Text>
                    </TouchableOpacity>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#080E1A' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
    backBtn: { padding: 4, marginRight: 8 },
    deleteBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(239,68,68,0.12)', justifyContent: 'center', alignItems: 'center' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#94A3B8', fontSize: 16 },
    content: { padding: 20 },
    destinationTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(37,99,235,0.1)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 14 },
    destinationTagText: { color: '#2563EB', fontSize: 13, fontWeight: '600' },
    title: { color: '#fff', fontSize: 24, fontWeight: '800', lineHeight: 32, marginBottom: 16 },
    meta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    authorName: { color: '#F1F5F9', fontSize: 14, fontWeight: '600', marginBottom: 2 },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dateText: { color: '#64748B', fontSize: 12 },
    voteSection: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0F172A', borderRadius: 16, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: '#1E293B' },
    voteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#1E293B', backgroundColor: '#111827' },
    voteBtnUp: { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)' },
    voteBtnDown: { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)' },
    voteCount: { color: '#64748B', fontSize: 14, fontWeight: '700' },
    voteHint: { flex: 1, color: '#475569', fontSize: 12, fontStyle: 'italic' },
    storyText: { color: '#CBD5E1', fontSize: 15, lineHeight: 26, marginBottom: 28 },
    section: { marginBottom: 20 },
    sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
    placeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    placeChip: { backgroundColor: '#111827', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#1E293B' },
    placeChipText: { color: '#94A3B8', fontSize: 13 },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: { backgroundColor: 'rgba(37,99,235,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    tagText: { color: '#2563EB', fontSize: 12, fontWeight: '500' },
    followBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 16, marginTop: 10 },
    followBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
