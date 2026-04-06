import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Calendar, Users, Send } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';

export default function CreateBuddyPost() {
    const navigation = useNavigation<any>();
    const [destination, setDestination] = useState('');
    const [travelDate, setTravelDate] = useState('');
    const [description, setDescription] = useState('');
    const [spotsLeft, setSpotsLeft] = useState('2');
    const [submitting, setSubmitting] = useState(false);

    const handlePost = async () => {
        if (!destination.trim() || !travelDate.trim() || !description.trim()) {
            Alert.alert('Missing Info', 'Please fill in all fields before posting.');
            return;
        }

        setSubmitting(true);
        try {
            const { data: authData } = await supabase.auth.getUser();
            const user = authData?.user;
            if (!user) {
                Alert.alert('Error', 'You must be logged in to post.');
                return;
            }

            const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Traveler';

            const { error } = await supabase.from('trip_buddies').insert({
                destination: destination.trim(),
                travel_date: travelDate.trim(),
                description: description.trim(),
                spots_left: parseInt(spotsLeft) || 2,
                author_name: fullName,
                author_id: user.id,
            });

            if (error) throw error;

            Alert.alert('Posted! 🤝', 'Your trip post is live. Other travelers can now join!', [
                { text: 'Great!', onPress: () => navigation.goBack() },
            ]);
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
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft size={20} color="#F1F5F9" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Post a Trip</Text>
                    <View style={{ width: 36 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <Text style={styles.subtitle}>Looking for travel companions? Post your trip and connect with like-minded travelers! 🤝</Text>

                    {/* Destination */}
                    <View style={styles.field}>
                        <View style={styles.fieldLabel}>
                            <MapPin size={15} color="#2563EB" />
                            <Text style={styles.label}>Destination *</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Goa, Kerala, Munnar..."
                            placeholderTextColor="#334155"
                            value={destination}
                            onChangeText={setDestination}
                        />
                    </View>

                    {/* Travel Date */}
                    <View style={styles.field}>
                        <View style={styles.fieldLabel}>
                            <Calendar size={15} color="#2563EB" />
                            <Text style={styles.label}>Travel Date *</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. March 20-25, 2025"
                            placeholderTextColor="#334155"
                            value={travelDate}
                            onChangeText={setTravelDate}
                        />
                    </View>

                    {/* Spots */}
                    <View style={styles.field}>
                        <View style={styles.fieldLabel}>
                            <Users size={15} color="#2563EB" />
                            <Text style={styles.label}>Spots Available</Text>
                        </View>
                        <View style={styles.spotsRow}>
                            {['1', '2', '3', '4', '5+'].map(n => (
                                <TouchableOpacity
                                    key={n}
                                    style={[styles.spotChip, spotsLeft === n && styles.spotChipActive]}
                                    onPress={() => setSpotsLeft(n)}
                                >
                                    <Text style={[styles.spotChipText, spotsLeft === n && styles.spotChipTextActive]}>{n}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.field}>
                        <View style={styles.fieldLabel}>
                            <Send size={15} color="#2563EB" />
                            <Text style={styles.label}>About Your Trip *</Text>
                        </View>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Describe your trip plan, what kind of travel buddies you're looking for, budget range, etc..."
                            placeholderTextColor="#334155"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Submit */}
                    <TouchableOpacity
                        style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                        onPress={handlePost}
                        disabled={submitting}
                        activeOpacity={0.85}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Users size={18} color="#fff" />
                                <Text style={styles.submitText}>Post Trip</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#060C18' },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: '#1E293B',
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#F1F5F9' },

    content: { padding: 20 },
    subtitle: { color: '#64748B', fontSize: 14, lineHeight: 20, marginBottom: 24 },

    field: { marginBottom: 20 },
    fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    label: { color: '#CBD5E1', fontSize: 14, fontWeight: '600' },
    input: {
        backgroundColor: '#0F172A',
        borderRadius: 14, borderWidth: 1, borderColor: '#1E293B',
        paddingHorizontal: 16, paddingVertical: 13,
        color: '#F1F5F9', fontSize: 14,
    },
    textArea: { minHeight: 120, paddingTop: 13 },

    spotsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    spotChip: {
        paddingHorizontal: 18, paddingVertical: 10,
        borderRadius: 20, borderWidth: 1, borderColor: '#1E293B',
        backgroundColor: '#0F172A',
    },
    spotChipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
    spotChipText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
    spotChipTextActive: { color: '#fff' },

    submitBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, backgroundColor: '#2563EB',
        paddingVertical: 16, borderRadius: 16, marginTop: 8,
    },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
