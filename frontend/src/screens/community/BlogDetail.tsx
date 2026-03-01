import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Heart, Calendar } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function BlogDetail() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { story } = route.params || {};

    if (!story) {
        return (
            <SafeAreaView style={styles.container}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color="#fff" size={22} />
                </TouchableOpacity>
                <View style={styles.centered}>
                    <Text style={styles.errorText}>Story not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        } catch { return dateStr; }
    };

    const placesArray: string[] = Array.isArray(story.places) ? story.places : [];

    const handleFollowRoute = () => {
        if (placesArray.length === 0) return;
        // Navigate to trip planner pre-filled with the destination
        navigation.navigate('Home', {
            screen: 'TripPlanner',
            params: { prefillDestination: story.destination },
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color="#fff" size={22} />
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Destination tag */}
                <View style={styles.destinationTag}>
                    <MapPin size={14} color="#2563EB" />
                    <Text style={styles.destinationTagText}>{story.destination}</Text>
                </View>

                {/* Title */}
                <Text style={styles.title}>{story.title}</Text>

                {/* Author + date */}
                <View style={styles.meta}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{story.author_name?.[0]?.toUpperCase() || '?'}</Text>
                    </View>
                    <View>
                        <Text style={styles.authorName}>{story.author_name}</Text>
                        <View style={styles.dateRow}>
                            <Calendar size={11} color="#64748B" />
                            <Text style={styles.dateText}>{formatDate(story.created_at)}</Text>
                        </View>
                    </View>
                    <View style={styles.likes}>
                        <Heart size={14} color="#64748B" />
                        <Text style={styles.likesText}>{story.likes || 0}</Text>
                    </View>
                </View>

                {/* Full story */}
                <Text style={styles.storyText}>{story.story}</Text>

                {/* Places visited */}
                {placesArray.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📍 Places Visited</Text>
                        <View style={styles.placeChips}>
                            {placesArray.map((place: string, i: number) => (
                                <View key={i} style={styles.placeChip}>
                                    <Text style={styles.placeChipText}>{place}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Tags */}
                {(story.tags || []).length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>🏷 Tags</Text>
                        <View style={styles.tagRow}>
                            {story.tags.map((tag: string, i: number) => (
                                <View key={i} style={styles.tag}>
                                    <Text style={styles.tagText}>#{tag}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Follow route button */}
                {placesArray.length > 0 && (
                    <TouchableOpacity style={styles.followBtn} onPress={handleFollowRoute}>
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
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: '#1E293B',
    },
    backBtn: { padding: 4, marginRight: 8 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#94A3B8', fontSize: 16 },

    content: { padding: 20 },
    destinationTag: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(37,99,235,0.1)',
        alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 20, marginBottom: 14,
    },
    destinationTagText: { color: '#2563EB', fontSize: 13, fontWeight: '600' },

    title: { color: '#fff', fontSize: 24, fontWeight: '800', lineHeight: 32, marginBottom: 16 },

    meta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    authorName: { color: '#F1F5F9', fontSize: 14, fontWeight: '600', marginBottom: 2 },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dateText: { color: '#64748B', fontSize: 12 },
    likes: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5 },
    likesText: { color: '#64748B', fontSize: 13 },

    storyText: { color: '#CBD5E1', fontSize: 15, lineHeight: 26, marginBottom: 28 },

    section: { marginBottom: 20 },
    sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },

    placeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    placeChip: {
        backgroundColor: '#111827', paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 20, borderWidth: 1, borderColor: '#1E293B',
    },
    placeChipText: { color: '#94A3B8', fontSize: 13 },

    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: { backgroundColor: 'rgba(37,99,235,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    tagText: { color: '#2563EB', fontSize: 12, fontWeight: '500' },

    followBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 16, marginTop: 10,
    },
    followBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
