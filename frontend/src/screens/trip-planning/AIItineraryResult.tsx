import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function AIItineraryResult() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kyoto Trip</Text>

      <View style={styles.card}>
        <Text>Day 1 – Temples & Markets</Text>
      </View>
      <View style={styles.card}>
        <Text>Day 2 – Nature & Shrines</Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('EditItinerary')}
      >
        <Text style={styles.buttonText}>Edit Itinerary</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1220', padding: 20 },
  title: { color: '#fff', fontSize: 22, marginBottom: 20 },
  card: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 14,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
