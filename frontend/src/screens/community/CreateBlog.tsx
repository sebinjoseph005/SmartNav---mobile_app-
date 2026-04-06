import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, BookOpen, Tag, Send } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';

export default function CreateBlog() {
    const navigation = useNavigation<any>();
    const [title, setTitle] = useState('');
    const [destination, setDestination] = useState('');
    const [story, setStory] = useState('');
    const [places, setPlaces] = useState('');
    const [tags, setTags] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handlePost = async () => {
        if (!title.trim() || !destination.trim() || !story.trim()) {
            Alert.alert('Missing Info', 'Please fill in the title, destination, and your story.');
            return;
        }
        setSubmitting(true);
        try {
            const { data: authData } = await supabase.auth.getUser();
            const user = authData?.user;
            if (!user) { Alert.alert('Error', 'You must be logged in to post.'); return; }
            const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Traveler';
            const placesArr = places.split(',').map(p => p.trim()).filter(Boolean);
            const tagsArr = tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
            const { error } = await supabase.from('trip_stories').insert({
                title: title.trim(),
                destination: destination.trim(),
                story: story.trim(),
                places: placesArr,
                tags: tagsArr,
                author_name: fullName,
                author_id: user.id,
            });
            if (error) throw error;
            Alert.alert('Posted! ✈️', 'Your travel story is live!', [{ text: 'Awesome!', onPress: () => navigation.goBack() }]);
        } catch (err: any) {
            console.error(err);
            Alert.alert('Error', err.message || 'Failed to post. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><ArrowLeft size={20} color="#F1F5F9" /></TouchableOpacity>
                    <Text style={styles.headerTitle}>Share Your Story</Text>
                    <View style={{ width: 36 }} />
                </View>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <Text style={styles.subtitle}>Share your travel experience with the community! Help others plan their trips. ✈️</Text>
                    <View style={styles.field}>
                        <View style={styles.fieldLabel}><BookOpen size={15} color="#2563EB" /><Text style={styles.label}>Story Title *</Text></View>
                        <TextInput style={styles.input} placeholder="e.g. My amazing trip to Munnar..." placeholderTextColor="#334155" value={title} onChangeText={setTitle} />
                    </View>
                    <View style={styles.field}>
                        <View style={styles.fieldLabel}><MapPin size={15} color="#2563EB" /><Text style={styles.label}>Destination *</Text></View>
                        <TextInput style={styles.input} placeholder="e.g. Munnar, Kerala" placeholderTextColor="#334155" value={destination} onChangeText={setDestination} />
                    </View>
                    <View style={styles.field}>
                        <View style={styles.fieldLabel}><Send size={15} color="#2563EB" /><Text style={styles.label}>Your Story *</Text></View>
                        <TextInput style={[styles.input, styles.textArea]} placeholder="Tell your story — what did you see, feel, and experience?" placeholderTextColor="#334155" value={story} onChangeText={setStory} multiline numberOfLines={7} textAlignVertical="top" />
                    </View>
                    <View style={styles.field}>
                        <View style={styles.fieldLabel}><MapPin size={15} color="#2563EB" /><Text style={styles.label}>Places Visited (comma-separated)</Text></View>
                        <TextInput style={styles.input} placeholder="e.g. Tea Museum, Mattupetty Dam, Eravikulam" placeholderTextColor="#334155" value={places} onChangeText={setPlaces} />
                    </View>
                    <View style={styles.field}>
                        <View style={styles.fieldLabel}><Tag size={15} color="#2563EB" /><Text style={styles.label}>Tags (comma-separated)</Text></View>
                        <TextInput style={styles.input} placeholder="e.g. nature, adventure, solo" placeholderTextColor="#334155" value={tags} onChangeText={setTags} />
                    </View>
                    <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={handlePost} disabled={submitting} activeOpacity={0.85}>
                        {submitting ? <ActivityIndicator color="#fff" /> : <><BookOpen size={18} color="#fff" /><Text style={styles.submitText}>Publish Story</Text></>}
                    </TouchableOpacity>
                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#060C18' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#F1F5F9' },
    content: { padding: 20 },
    subtitle: { color: '#64748B', fontSize: 14, lineHeight: 20, marginBottom: 24 },
    field: { marginBottom: 20 },
    fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    label: { color: '#CBD5E1', fontSize: 14, fontWeight: '600' },
    input: { backgroundColor: '#0F172A', borderRadius: 14, borderWidth: 1, borderColor: '#1E293B', paddingHorizontal: 16, paddingVertical: 13, color: '#F1F5F9', fontSize: 14 },
    textArea: { minHeight: 160, paddingTop: 13 },
    submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 16, marginTop: 8 },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
