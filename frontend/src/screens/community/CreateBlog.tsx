import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';

export default function CreateStoryScreen() {
    const navigation = useNavigation<any>();

    const [destination, setDestination] = useState('');
    const [title, setTitle] = useState('');
    const [story, setStory] = useState('');
    const [places, setPlaces] = useState('');
    const [tags, setTags] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const canSubmit = destination.trim() && title.trim() && story.trim().length >= 50;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        try {
            setSubmitting(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not logged in');

            const authorName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Traveler';
            const placesArray = places.split(',').map(p => p.trim()).filter(Boolean);
            const tagsArray = tags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);

            const { error } = await supabase.from('trip_stories').insert({
                user_id: user.id,
                author_name: authorName,
                destination: destination.trim(),
                title: title.trim(),
                story: story.trim(),
                places: placesArray,
                tags: tagsArray,
            });

            if (error) throw error;

            Alert.alert('🎉 Story Published!', 'Your trip story is now live in the community.', [
                { text: 'Great!', onPress: () => navigation.goBack() },
            ]);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Could not publish story.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color="#fff" size={22} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Share Your Story</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.form}>
                <Text style={styles.label}>Destination *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Delhi, Goa, Kochi…"
                    placeholderTextColor="#4B5563"
                    value={destination}
                    onChangeText={setDestination}
                />

                <Text style={styles.label}>Story Title *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Give your story a catchy title"
                    placeholderTextColor="#4B5563"
                    value={title}
                    onChangeText={setTitle}
                />

                <Text style={styles.label}>Your Story * (min 50 chars)</Text>
                <TextInput
                    style={styles.textarea}
                    placeholder="Tell us about your journey — where you went, what you saw, tips for others…"
                    placeholderTextColor="#4B5563"
                    multiline
                    numberOfLines={8}
                    value={story}
                    onChangeText={setStory}
                    textAlignVertical="top"
                />
                <Text style={styles.charCount}>{story.length} chars</Text>

                <Text style={styles.label}>Places Visited (comma separated)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Red Fort, Chandni Chowk, India Gate"
                    placeholderTextColor="#4B5563"
                    value={places}
                    onChangeText={setPlaces}
                />

                <Text style={styles.label}>Tags (comma separated)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. budget, solo, adventure, food"
                    placeholderTextColor="#4B5563"
                    value={tags}
                    onChangeText={setTags}
                />

                <TouchableOpacity
                    style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting || !canSubmit}
                >
                    {submitting ? <ActivityIndicator color="#fff" size={20} /> : (
                        <><Send size={18} color="#fff" /><Text style={styles.submitText}>Publish Story</Text></>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#080E1A' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1E293B',
    },
    backBtn: { padding: 4 },
    headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
    form: { padding: 16, gap: 4, paddingBottom: 60 },
    label: { color: '#94A3B8', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 10 },
    input: {
        backgroundColor: '#111827', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
        color: '#fff', fontSize: 14, borderWidth: 1, borderColor: '#1E293B', marginBottom: 4,
    },
    textarea: {
        backgroundColor: '#111827', borderRadius: 12, padding: 14, color: '#fff', fontSize: 14,
        height: 160, borderWidth: 1, borderColor: '#1E293B', marginBottom: 4,
    },
    charCount: { color: '#4B5563', fontSize: 11, textAlign: 'right', marginBottom: 4 },
    submitBtn: {
        backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14, marginTop: 24,
    },
    submitBtnDisabled: { opacity: 0.4 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
