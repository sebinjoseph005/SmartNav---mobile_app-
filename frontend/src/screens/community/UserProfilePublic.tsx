import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, MapPin, Calendar, Users } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';

export default function CreateBuddyPost() {
    const navigation = useNavigation<any>();

    const [destination, setDestination] = useState('');
    const [travelDate, setTravelDate] = useState('');
    const [description, setDescription] = useState('');
    const [spots, setSpots] = useState('3');
    const [submitting, setSubmitting] = useState(false);

    const canSubmit = destination.trim() && travelDate.trim() && description.trim().length >= 20;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        try {
            setSubmitting(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not logged in');

            const authorName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Traveler';
            const { error } = await supabase.from('trip_buddies').insert({
                user_id: user.id,
                author_name: authorName,
                destination: destination.trim(),
                travel_date: travelDate.trim(),
                description: description.trim(),
                spots_left: parseInt(spots) || 3,
                chat_messages: [],
            });

            if (error) throw error;

            Alert.alert('🎉 Trip Posted!', 'Travelers can now find and join your trip!', [
                { text: 'Cool!', onPress: () => navigation.goBack() },
            ]);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Could not post trip.');
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
                <Text style={styles.headerTitle}>Post Your Trip</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.form}>
                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                        🤝 Post your upcoming trip and let other travelers join you for company and adventure!
                    </Text>
                </View>

                <Text style={styles.label}>Destination *</Text>
                <View style={styles.inputRow}>
                    <MapPin size={16} color="#2563EB" />
                    <TextInput
                        style={styles.inputInner}
                        placeholder="Where are you going?"
                        placeholderTextColor="#4B5563"
                        value={destination}
                        onChangeText={setDestination}
                    />
                </View>

                <Text style={styles.label}>Travel Date *</Text>
                <View style={styles.inputRow}>
                    <Calendar size={16} color="#2563EB" />
                    <TextInput
                        style={styles.inputInner}
                        placeholder="e.g. March 15–20, 2026"
                        placeholderTextColor="#4B5563"
                        value={travelDate}
                        onChangeText={setTravelDate}
                    />
                </View>

                <Text style={styles.label}>Spots Available</Text>
                <View style={styles.spotsRow}>
                    {['1', '2', '3', '4', '5'].map(n => (
                        <TouchableOpacity
                            key={n}
                            style={[styles.spotBtn, spots === n && styles.spotBtnActive]}
                            onPress={() => setSpots(n)}
                        >
                            <Users size={14} color={spots === n ? '#fff' : '#64748B'} />
                            <Text style={[styles.spotText, spots === n && styles.spotTextActive]}>{n}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Description * (min 20 chars)</Text>
                <TextInput
                    style={styles.textarea}
                    placeholder="Tell people about your plan, what you're looking for in a travel buddy, your travel style…"
                    placeholderTextColor="#4B5563"
                    multiline
                    numberOfLines={6}
                    value={description}
                    onChangeText={setDescription}
                    textAlignVertical="top"
                />
                <Text style={styles.charCount}>{description.length} chars</Text>

                <TouchableOpacity
                    style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting || !canSubmit}
                >
                    {submitting ? <ActivityIndicator color="#fff" size={20} /> : (
                        <><Send size={18} color="#fff" /><Text style={styles.submitText}>Post Trip</Text></>
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

    infoBox: {
        backgroundColor: 'rgba(37,99,235,0.1)', padding: 14, borderRadius: 14,
        marginBottom: 20, borderWidth: 1, borderColor: 'rgba(37,99,235,0.2)',
    },
    infoText: { color: '#93C5FD', fontSize: 13, lineHeight: 20 },

    label: { color: '#94A3B8', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 10 },
    inputRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#111827', borderRadius: 12, paddingHorizontal: 14,
        borderWidth: 1, borderColor: '#1E293B', marginBottom: 4,
    },
    inputInner: { flex: 1, paddingVertical: 13, color: '#fff', fontSize: 14 },

    spotsRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
    spotBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 5, backgroundColor: '#111827', paddingVertical: 12,
        borderRadius: 12, borderWidth: 1, borderColor: '#1E293B',
    },
    spotBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
    spotText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
    spotTextActive: { color: '#fff' },

    textarea: {
        backgroundColor: '#111827', borderRadius: 12, padding: 14, color: '#fff',
        fontSize: 14, height: 150, borderWidth: 1, borderColor: '#1E293B', marginBottom: 4,
    },
    charCount: { color: '#4B5563', fontSize: 11, textAlign: 'right', marginBottom: 4 },

    submitBtn: {
        backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14, marginTop: 24,
    },
    submitBtnDisabled: { opacity: 0.4 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
