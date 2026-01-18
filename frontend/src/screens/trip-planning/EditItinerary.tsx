import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function EditItinerary() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Itinerary</Text>
      <Text style={styles.sub}>Drag, reorder, add stops later</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1220', padding: 20 },
  title: { color: '#fff', fontSize: 22 },
  sub: { color: '#9CA3AF', marginTop: 8 },
});
